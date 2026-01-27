/**
 * Newsletter service for managing subscribers and campaigns
 *
 * @agent newsletter-system
 * @created 2026-01-27
 */

import type { Env } from '../types/env'
import { createEmailService } from './email/service'

// =============================================================================
// Types
// =============================================================================

export interface Subscriber {
  id: string
  email: string
  name: string | null
  subscribedAt: Date
  unsubscribedAt: Date | null
  source: string | null
}

export interface Campaign {
  id: string
  subject: string
  content: string
  previewText: string | null
  status: 'draft' | 'scheduled' | 'sending' | 'sent'
  scheduledFor: Date | null
  sentAt: Date | null
  recipientCount: number | null
  openCount: number
  clickCount: number
  createdBy: string
  createdAt: Date
  updatedAt: Date | null
}

// =============================================================================
// Unsubscribe Token Functions
// =============================================================================

/**
 * Generate an HMAC-based unsubscribe token for an email
 */
export async function generateUnsubscribeToken(
  email: string,
  secret: string
): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(email)
  const keyData = encoder.encode(secret)

  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )

  const signature = await crypto.subtle.sign('HMAC', key, data)
  const signatureArray = new Uint8Array(signature)
  const signatureHex = Array.from(signatureArray)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

  // Encode email and signature in base64
  const payload = JSON.stringify({ email, sig: signatureHex })
  return btoa(payload)
}

/**
 * Verify an unsubscribe token and return the email if valid
 */
export async function verifyUnsubscribeToken(
  token: string,
  secret: string
): Promise<string | null> {
  try {
    const payload = JSON.parse(atob(token)) as { email: string; sig: string }
    const { email, sig } = payload

    // Regenerate the signature and compare
    const expectedToken = await generateUnsubscribeToken(email, secret)
    const expectedPayload = JSON.parse(atob(expectedToken)) as { sig: string }

    if (sig === expectedPayload.sig) {
      return email
    }

    return null
  } catch {
    return null
  }
}

// =============================================================================
// Newsletter Sending
// =============================================================================

/**
 * Send a newsletter to a list of subscribers
 * Uses batched sending for efficiency
 */
export async function sendNewsletter(
  env: Env,
  campaign: Campaign,
  subscribers: Subscriber[]
): Promise<{ sent: number; failed: number }> {
  const emailService = createEmailService(env)
  const results = { sent: 0, failed: 0 }

  // Process in batches of 50
  const batchSize = 50
  for (let i = 0; i < subscribers.length; i += batchSize) {
    const batch = subscribers.slice(i, i + batchSize)

    // Send to each subscriber in the batch
    const promises = batch.map(async (subscriber) => {
      try {
        const unsubscribeToken = await generateUnsubscribeToken(
          subscriber.email,
          env.BETTER_AUTH_SECRET
        )
        const unsubscribeUrl = `${env.API_URL}/v1/admin/newsletter/unsubscribe?token=${unsubscribeToken}`

        await emailService.sendNewsletter(subscriber.email, campaign.subject, {
          content: campaign.content,
          previewText: campaign.previewText ?? undefined,
          unsubscribeUrl,
        })

        results.sent++
      } catch (error) {
        console.error(`Failed to send to ${subscriber.email}:`, error)
        results.failed++
      }
    })

    await Promise.all(promises)

    // Small delay between batches to avoid rate limits
    if (i + batchSize < subscribers.length) {
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
  }

  return results
}

/**
 * Send a test email for a campaign
 */
export async function sendTestEmail(
  env: Env,
  campaign: Campaign,
  testEmail: string
): Promise<boolean> {
  const emailService = createEmailService(env)

  try {
    // Use a dummy unsubscribe URL for test emails
    const unsubscribeUrl = `${env.API_URL}/v1/admin/newsletter/unsubscribe?token=test`

    await emailService.sendNewsletter(
      testEmail,
      `[TEST] ${campaign.subject}`,
      {
        content: campaign.content,
        previewText: campaign.previewText ?? undefined,
        unsubscribeUrl,
      }
    )

    return true
  } catch (error) {
    console.error('Failed to send test email:', error)
    return false
  }
}

// =============================================================================
// Subscriber Management
// =============================================================================

/**
 * Parse CSV content for subscriber import
 */
export function parseSubscriberCsv(
  csvContent: string
): Array<{ email: string; name?: string }> {
  const lines = csvContent.trim().split('\n')
  if (lines.length === 0) return []

  // Detect header row
  const firstLine = lines[0].toLowerCase()
  const hasHeader = firstLine.includes('email')
  const startIndex = hasHeader ? 1 : 0

  // Parse columns from header
  let emailCol = 0
  let nameCol = -1

  if (hasHeader) {
    const headers = firstLine.split(',').map((h) => h.trim())
    emailCol = headers.findIndex((h) => h === 'email')
    nameCol = headers.findIndex((h) => h === 'name')

    if (emailCol === -1) emailCol = 0
  }

  const subscribers: Array<{ email: string; name?: string }> = []

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    const cols = line.split(',').map((c) => c.trim().replace(/^["']|["']$/g, ''))
    const email = cols[emailCol]

    // Validate email format
    if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      const name = nameCol >= 0 ? cols[nameCol] : undefined
      subscribers.push({ email, name })
    }
  }

  return subscribers
}

/**
 * Export subscribers to CSV format
 */
export function exportSubscribersCsv(subscribers: Subscriber[]): string {
  const header = 'email,name,subscribed_at,source'
  const rows = subscribers.map((s) => {
    const name = s.name?.replace(/,/g, ' ') ?? ''
    const subscribedAt = s.subscribedAt.toISOString()
    const source = s.source ?? ''
    return `${s.email},${name},${subscribedAt},${source}`
  })

  return [header, ...rows].join('\n')
}
