/**
 * Webhook CRUD Routes
 *
 * @agent remediate-webhook-encryption
 * @description Manages outgoing webhook configurations for apps.
 *              Webhook secrets are encrypted at rest using AES-256-GCM.
 */

import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { nanoid } from 'nanoid'
import { ERROR_CODES } from '@bundlenudge/shared'
import { authMiddleware, type AuthUser } from '../../middleware/auth'
import type { Env } from '../../types/env'
import { sendWebhook, WEBHOOK_EVENTS } from '../../lib/webhooks'
import { encrypt, decrypt } from '../../lib/crypto'

// =============================================================================
// Schemas
// =============================================================================

const createWebhookSchema = z.object({
  url: z.string().url(),
  events: z.array(z.string()).min(1),
  secret: z.string().min(16).optional(),
})

const updateWebhookSchema = z.object({
  url: z.string().url().optional(),
  events: z.array(z.string()).min(1).optional(),
  isActive: z.boolean().optional(),
})

// =============================================================================
// Types
// =============================================================================

interface WebhookRow {
  id: string
  app_id: string
  url: string
  events: string
  secret: string
  is_active: number
  last_triggered_at: number | null
  created_at: number
  updated_at: number
}

interface WebhookEventRow {
  id: string
  webhook_id: string
  event: string
  payload: string
  status: string
  status_code: number | null
  error_message: string | null
  created_at: number
}

interface AuthVariables {
  user: AuthUser
}

// =============================================================================
// Router
// =============================================================================

export const webhooksRouter = new Hono<{ Bindings: Env; Variables: AuthVariables }>()

// All routes require authentication
webhooksRouter.use('*', authMiddleware)

/**
 * GET /v1/apps/:appId/webhooks
 * List webhooks for an app
 */
webhooksRouter.get('/:appId/webhooks', async (c) => {
  const user = c.get('user')
  const appId = c.req.param('appId')

  // Verify app ownership
  const app = await c.env.DB.prepare(
    'SELECT id FROM apps WHERE id = ? AND owner_id = ? AND deleted_at IS NULL'
  ).bind(appId, user.id).first()

  if (!app) {
    return c.json({ error: ERROR_CODES.NOT_FOUND, message: 'App not found' }, 404)
  }

  const results = await c.env.DB.prepare(`
    SELECT id, app_id, url, events, is_active, last_triggered_at, created_at, updated_at
    FROM webhooks
    WHERE app_id = ?
    ORDER BY created_at DESC
  `).bind(appId).all<WebhookRow>()

  return c.json({
    webhooks: results.results.map(formatWebhook),
  })
})

/**
 * GET /v1/apps/:appId/webhooks/:webhookId
 * Get a single webhook
 */
webhooksRouter.get('/:appId/webhooks/:webhookId', async (c) => {
  const user = c.get('user')
  const appId = c.req.param('appId')
  const webhookId = c.req.param('webhookId')

  // Verify app ownership
  const app = await c.env.DB.prepare(
    'SELECT id FROM apps WHERE id = ? AND owner_id = ? AND deleted_at IS NULL'
  ).bind(appId, user.id).first()

  if (!app) {
    return c.json({ error: ERROR_CODES.NOT_FOUND, message: 'App not found' }, 404)
  }

  const webhook = await c.env.DB.prepare(`
    SELECT id, app_id, url, events, is_active, last_triggered_at, created_at, updated_at
    FROM webhooks
    WHERE id = ? AND app_id = ?
  `).bind(webhookId, appId).first<WebhookRow>()

  if (!webhook) {
    return c.json({ error: ERROR_CODES.NOT_FOUND, message: 'Webhook not found' }, 404)
  }

  return c.json({ webhook: formatWebhook(webhook) })
})

/**
 * POST /v1/apps/:appId/webhooks
 * Create a webhook
 */
webhooksRouter.post(
  '/:appId/webhooks',
  zValidator('json', createWebhookSchema),
  async (c) => {
    const user = c.get('user')
    const appId = c.req.param('appId')
    const body = c.req.valid('json')

    // Verify app ownership
    const app = await c.env.DB.prepare(
      'SELECT id FROM apps WHERE id = ? AND owner_id = ? AND deleted_at IS NULL'
    ).bind(appId, user.id).first()

    if (!app) {
      return c.json({ error: ERROR_CODES.NOT_FOUND, message: 'App not found' }, 404)
    }

    // Generate secret if not provided
    const secret = body.secret ?? `whsec_${nanoid(32)}`
    const webhookId = crypto.randomUUID()
    const now = Math.floor(Date.now() / 1000)

    // Encrypt secret before storing
    const encryptedSecret = await encrypt(secret, c.env.WEBHOOK_ENCRYPTION_KEY)

    await c.env.DB.prepare(`
      INSERT INTO webhooks (id, app_id, url, events, secret, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 1, ?, ?)
    `).bind(
      webhookId,
      appId,
      body.url,
      JSON.stringify(body.events),
      encryptedSecret,
      now,
      now
    ).run()

    const webhook = await c.env.DB.prepare(
      'SELECT * FROM webhooks WHERE id = ?'
    ).bind(webhookId).first<WebhookRow>()

    if (!webhook) {
      return c.json({ error: 'server_error' as const, message: 'Failed to create webhook' }, 500)
    }
    return c.json({
      webhook: {
        ...formatWebhook(webhook),
        secret, // Only return secret on creation
      },
    }, 201)
  }
)

/**
 * PATCH /v1/apps/:appId/webhooks/:webhookId
 * Update a webhook
 */
webhooksRouter.patch(
  '/:appId/webhooks/:webhookId',
  zValidator('json', updateWebhookSchema),
  async (c) => {
    const user = c.get('user')
    const appId = c.req.param('appId')
    const webhookId = c.req.param('webhookId')
    const body = c.req.valid('json')

    // Verify app ownership
    const app = await c.env.DB.prepare(
      'SELECT id FROM apps WHERE id = ? AND owner_id = ? AND deleted_at IS NULL'
    ).bind(appId, user.id).first()

    if (!app) {
      return c.json({ error: ERROR_CODES.NOT_FOUND, message: 'App not found' }, 404)
    }

    const existing = await c.env.DB.prepare(
      'SELECT * FROM webhooks WHERE id = ? AND app_id = ?'
    ).bind(webhookId, appId).first<WebhookRow>()

    if (!existing) {
      return c.json({ error: ERROR_CODES.NOT_FOUND, message: 'Webhook not found' }, 404)
    }

    const updates: string[] = []
    const values: (string | number)[] = []

    if (body.url !== undefined) {
      updates.push('url = ?')
      values.push(body.url)
    }

    if (body.events !== undefined) {
      updates.push('events = ?')
      values.push(JSON.stringify(body.events))
    }

    if (body.isActive !== undefined) {
      updates.push('is_active = ?')
      values.push(body.isActive ? 1 : 0)
    }

    if (updates.length > 0) {
      const now = Math.floor(Date.now() / 1000)
      updates.push('updated_at = ?')
      values.push(now)
      values.push(webhookId)
      values.push(appId)

      await c.env.DB.prepare(`
        UPDATE webhooks SET ${updates.join(', ')} WHERE id = ? AND app_id = ?
      `).bind(...values).run()
    }

    const webhook = await c.env.DB.prepare(
      'SELECT id, app_id, url, events, is_active, last_triggered_at, created_at, updated_at FROM webhooks WHERE id = ?'
    ).bind(webhookId).first<WebhookRow>()

    if (!webhook) {
      return c.json({ error: ERROR_CODES.NOT_FOUND, message: 'Webhook not found' }, 404)
    }
    return c.json({ webhook: formatWebhook(webhook) })
  }
)

/**
 * DELETE /v1/apps/:appId/webhooks/:webhookId
 * Delete a webhook
 */
webhooksRouter.delete('/:appId/webhooks/:webhookId', async (c) => {
  const user = c.get('user')
  const appId = c.req.param('appId')
  const webhookId = c.req.param('webhookId')

  // Verify app ownership
  const app = await c.env.DB.prepare(
    'SELECT id FROM apps WHERE id = ? AND owner_id = ? AND deleted_at IS NULL'
  ).bind(appId, user.id).first()

  if (!app) {
    return c.json({ error: ERROR_CODES.NOT_FOUND, message: 'App not found' }, 404)
  }

  // Delete webhook events first
  await c.env.DB.prepare(
    'DELETE FROM webhook_events WHERE webhook_id = ?'
  ).bind(webhookId).run()

  const result = await c.env.DB.prepare(
    'DELETE FROM webhooks WHERE id = ? AND app_id = ?'
  ).bind(webhookId, appId).run()

  if (!result.meta.changes) {
    return c.json({ error: ERROR_CODES.NOT_FOUND, message: 'Webhook not found' }, 404)
  }

  return c.json({ success: true })
})

/**
 * POST /v1/apps/:appId/webhooks/:webhookId/test
 * Test a webhook by sending a test payload
 */
webhooksRouter.post('/:appId/webhooks/:webhookId/test', async (c) => {
  const user = c.get('user')
  const appId = c.req.param('appId')
  const webhookId = c.req.param('webhookId')

  // Verify app ownership
  const app = await c.env.DB.prepare(
    'SELECT id FROM apps WHERE id = ? AND owner_id = ? AND deleted_at IS NULL'
  ).bind(appId, user.id).first()

  if (!app) {
    return c.json({ error: ERROR_CODES.NOT_FOUND, message: 'App not found' }, 404)
  }

  const webhook = await c.env.DB.prepare(
    'SELECT * FROM webhooks WHERE id = ? AND app_id = ?'
  ).bind(webhookId, appId).first<WebhookRow>()

  if (!webhook) {
    return c.json({ error: ERROR_CODES.NOT_FOUND, message: 'Webhook not found' }, 404)
  }

  // Decrypt secret (handles legacy plaintext secrets)
  const secret = await decryptSecret(webhook.secret, c.env.WEBHOOK_ENCRYPTION_KEY)

  const testPayload = {
    event: WEBHOOK_EVENTS.TEST,
    timestamp: new Date().toISOString(),
    data: {
      message: 'This is a test webhook from BundleNudge',
      appId,
      webhookId,
    },
  }

  const result = await sendWebhook(webhook.url, secret, testPayload)

  return c.json({
    success: result.success,
    statusCode: result.statusCode,
    error: result.error,
  })
})

/**
 * GET /v1/apps/:appId/webhooks/:webhookId/events
 * Get recent webhook delivery events
 */
webhooksRouter.get('/:appId/webhooks/:webhookId/events', async (c) => {
  const user = c.get('user')
  const appId = c.req.param('appId')
  const webhookId = c.req.param('webhookId')
  const limit = Math.min(parseInt(c.req.query('limit') ?? '50', 10), 100)

  // Verify app ownership
  const app = await c.env.DB.prepare(
    'SELECT id FROM apps WHERE id = ? AND owner_id = ? AND deleted_at IS NULL'
  ).bind(appId, user.id).first()

  if (!app) {
    return c.json({ error: ERROR_CODES.NOT_FOUND, message: 'App not found' }, 404)
  }

  const webhook = await c.env.DB.prepare(
    'SELECT id FROM webhooks WHERE id = ? AND app_id = ?'
  ).bind(webhookId, appId).first()

  if (!webhook) {
    return c.json({ error: ERROR_CODES.NOT_FOUND, message: 'Webhook not found' }, 404)
  }

  const events = await c.env.DB.prepare(`
    SELECT id, webhook_id, event, status, status_code, error_message, created_at
    FROM webhook_events
    WHERE webhook_id = ?
    ORDER BY created_at DESC
    LIMIT ?
  `).bind(webhookId, limit).all<WebhookEventRow>()

  return c.json({
    events: events.results.map(formatWebhookEvent),
  })
})

// =============================================================================
// Secret Decryption (with legacy fallback)
// =============================================================================

/**
 * Decrypt a webhook secret, falling back to plaintext for legacy secrets
 * @agent remediate-webhook-encryption
 */
async function decryptSecret(
  encryptedOrPlaintext: string,
  encryptionKey: string
): Promise<string> {
  try {
    return await decrypt(encryptedOrPlaintext, encryptionKey)
  } catch {
    // Legacy unencrypted secret - return as-is
    return encryptedOrPlaintext
  }
}

// =============================================================================
// Helpers
// =============================================================================

interface FormattedWebhook {
  id: string
  appId: string
  url: string
  events: string[]
  isActive: boolean
  lastTriggeredAt: number | null
  createdAt: number
  updatedAt: number
}

function formatWebhook(webhook: WebhookRow): FormattedWebhook {
  let events: string[] = []
  try {
    events = JSON.parse(webhook.events) as string[]
  } catch {
    events = []
  }

  return {
    id: webhook.id,
    appId: webhook.app_id,
    url: webhook.url,
    events,
    isActive: webhook.is_active === 1,
    lastTriggeredAt: webhook.last_triggered_at,
    createdAt: webhook.created_at,
    updatedAt: webhook.updated_at,
  }
}

interface FormattedWebhookEvent {
  id: string
  webhookId: string
  event: string
  status: string
  statusCode: number | null
  errorMessage: string | null
  createdAt: number
}

function formatWebhookEvent(event: WebhookEventRow): FormattedWebhookEvent {
  return {
    id: event.id,
    webhookId: event.webhook_id,
    event: event.event,
    status: event.status,
    statusCode: event.status_code,
    errorMessage: event.error_message,
    createdAt: event.created_at,
  }
}
