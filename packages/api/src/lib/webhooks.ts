/**
 * Webhook delivery utilities
 *
 * Handles sending webhooks with HMAC-SHA256 signatures and retry logic.
 */

import type { Env } from '../types/env'

// =============================================================================
// Types
// =============================================================================

export interface WebhookPayload {
  event: string
  timestamp: string
  data: Record<string, unknown>
}

export interface WebhookResult {
  success: boolean
  statusCode?: number
  error?: string
}

interface WebhookRow {
  id: string
  app_id: string
  url: string
  events: string
  secret: string
  is_active: number
}

// =============================================================================
// Constants
// =============================================================================

const WEBHOOK_TIMEOUT_MS = 10000 // 10 seconds
const MAX_RETRIES = 3
const RETRY_DELAYS = [1000, 5000, 30000] // 1s, 5s, 30s

// =============================================================================
// Signature
// =============================================================================

/**
 * Generate HMAC-SHA256 signature for webhook payload
 */
export async function generateSignature(
  secret: string,
  timestamp: number,
  body: string
): Promise<string> {
  const signatureData = `${String(timestamp)}.${body}`
  const encoder = new TextEncoder()
  const keyData = encoder.encode(secret)
  const messageData = encoder.encode(signatureData)

  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )

  const signature = await crypto.subtle.sign('HMAC', key, messageData)
  const hashArray = new Uint8Array(signature)

  return Array.from(hashArray)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Verify a webhook signature
 */
export async function verifySignature(
  signatureHeader: string,
  body: string,
  secret: string,
  toleranceSeconds = 300
): Promise<boolean> {
  // Parse signature header (format: t=timestamp,v1=signature)
  const parts = signatureHeader.split(',')
  const timestampPart = parts.find((p) => p.startsWith('t='))
  const signaturePart = parts.find((p) => p.startsWith('v1='))

  if (!timestampPart || !signaturePart) {
    return false
  }

  const timestamp = parseInt(timestampPart.slice(2), 10)
  const providedSignature = signaturePart.slice(3)

  // Check timestamp tolerance
  const now = Math.floor(Date.now() / 1000)
  if (Math.abs(now - timestamp) > toleranceSeconds) {
    return false
  }

  // Generate expected signature
  const expectedSignature = await generateSignature(secret, timestamp, body)

  // Constant-time comparison
  return timingSafeEqual(providedSignature, expectedSignature)
}

/**
 * Constant-time string comparison to prevent timing attacks
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false
  }

  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }

  return result === 0
}

// =============================================================================
// Delivery
// =============================================================================

/**
 * Send a single webhook request
 */
export async function sendWebhook(
  url: string,
  secret: string,
  payload: WebhookPayload
): Promise<WebhookResult> {
  const body = JSON.stringify(payload)
  const timestamp = Math.floor(Date.now() / 1000)

  // Generate signature
  const signature = await generateSignature(secret, timestamp, body)

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), WEBHOOK_TIMEOUT_MS)

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-BundleNudge-Signature': `t=${String(timestamp)},v1=${signature}`,
        'X-BundleNudge-Event': payload.event,
      },
      body,
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    return {
      success: response.ok,
      statusCode: response.status,
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return {
        success: false,
        error: 'Request timed out',
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Send webhook with retry logic
 */
export async function sendWebhookWithRetry(
  url: string,
  secret: string,
  payload: WebhookPayload
): Promise<WebhookResult> {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const result = await sendWebhook(url, secret, payload)

    if (result.success) {
      return result
    }

    // Don't retry client errors (4xx)
    if (result.statusCode && result.statusCode >= 400 && result.statusCode < 500) {
      return result
    }

    // Wait before retry (except on last attempt)
    if (attempt < MAX_RETRIES - 1) {
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAYS[attempt]))
    }
  }

  return { success: false, error: 'Max retries exceeded' }
}

// =============================================================================
// Trigger
// =============================================================================

/**
 * Trigger webhooks for an event
 */
export async function triggerWebhooks(
  env: Env,
  appId: string,
  event: string,
  data: Record<string, unknown>
): Promise<void> {
  // Get active webhooks for this app
  const webhooksResult = await env.DB.prepare(`
    SELECT id, app_id, url, events, secret, is_active
    FROM webhooks
    WHERE app_id = ? AND is_active = 1
  `).bind(appId).all<WebhookRow>()

  const payload: WebhookPayload = {
    event,
    timestamp: new Date().toISOString(),
    data,
  }

  const now = Math.floor(Date.now() / 1000)

  // Send to each matching webhook
  await Promise.allSettled(
    webhooksResult.results.map(async (webhook) => {
      // Check if webhook is subscribed to this event
      let events: string[] = []
      try {
        events = JSON.parse(webhook.events) as string[]
      } catch {
        return
      }

      if (!events.includes(event) && !events.includes('*')) {
        return
      }

      const result = await sendWebhookWithRetry(webhook.url, webhook.secret, payload)

      // Log the delivery attempt
      await env.DB.prepare(`
        INSERT INTO webhook_events (id, webhook_id, event, payload, status, status_code, error_message, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        crypto.randomUUID(),
        webhook.id,
        event,
        JSON.stringify(payload),
        result.success ? 'delivered' : 'failed',
        result.statusCode ?? null,
        result.error ?? null,
        now
      ).run()

      // Update last triggered timestamp
      await env.DB.prepare(
        'UPDATE webhooks SET last_triggered_at = ? WHERE id = ?'
      ).bind(now, webhook.id).run()
    })
  )
}

// =============================================================================
// Webhook Events
// =============================================================================

export const WEBHOOK_EVENTS = {
  // Release events
  RELEASE_CREATED: 'release.created',
  RELEASE_UPDATED: 'release.updated',
  RELEASE_PAUSED: 'release.paused',
  RELEASE_RESUMED: 'release.resumed',
  RELEASE_ROLLED_BACK: 'release.rolled_back',

  // Device events
  DEVICE_REGISTERED: 'device.registered',
  DEVICE_UPDATED: 'device.updated',

  // App events
  APP_CREATED: 'app.created',
  APP_UPDATED: 'app.updated',
  APP_DELETED: 'app.deleted',

  // Update events
  UPDATE_INSTALLED: 'update.installed',
  UPDATE_FAILED: 'update.failed',
  UPDATE_ROLLED_BACK: 'update.rolled_back',

  // Crash events
  CRASH_DETECTED: 'crash.detected',
  CRASH_THRESHOLD_EXCEEDED: 'crash.threshold_exceeded',

  // Test event
  TEST: 'test',
} as const

export type WebhookEvent = (typeof WEBHOOK_EVENTS)[keyof typeof WEBHOOK_EVENTS]
