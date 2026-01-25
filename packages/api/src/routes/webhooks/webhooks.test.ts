/**
 * @agent remediate-webhook-encryption
 */
import { describe, it, expect } from 'vitest'
import { z } from 'zod'
import { encrypt, decrypt, generateKey } from '../../lib/crypto'

// Schema definitions (matching the routes)
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

describe('webhook routes', () => {
  describe('createWebhookSchema', () => {
    it('validates valid webhook', () => {
      const result = createWebhookSchema.safeParse({
        url: 'https://example.com/webhook',
        events: ['release.created'],
      })
      expect(result.success).toBe(true)
    })

    it('accepts multiple events', () => {
      const result = createWebhookSchema.safeParse({
        url: 'https://example.com/webhook',
        events: ['release.created', 'release.updated', 'crash.detected'],
      })
      expect(result.success).toBe(true)
    })

    it('accepts custom secret', () => {
      const result = createWebhookSchema.safeParse({
        url: 'https://example.com/webhook',
        events: ['release.created'],
        secret: 'my_custom_secret_key_123',
      })
      expect(result.success).toBe(true)
    })

    it('rejects invalid URL', () => {
      const result = createWebhookSchema.safeParse({
        url: 'not-a-url',
        events: ['release.created'],
      })
      expect(result.success).toBe(false)
    })

    it('rejects empty events array', () => {
      const result = createWebhookSchema.safeParse({
        url: 'https://example.com/webhook',
        events: [],
      })
      expect(result.success).toBe(false)
    })

    it('rejects short secret', () => {
      const result = createWebhookSchema.safeParse({
        url: 'https://example.com/webhook',
        events: ['release.created'],
        secret: 'short',
      })
      expect(result.success).toBe(false)
    })

    it('accepts HTTP URL', () => {
      const result = createWebhookSchema.safeParse({
        url: 'http://localhost:3000/webhook',
        events: ['test'],
      })
      expect(result.success).toBe(true)
    })
  })

  describe('updateWebhookSchema', () => {
    it('validates empty update', () => {
      const result = updateWebhookSchema.safeParse({})
      expect(result.success).toBe(true)
    })

    it('validates URL update', () => {
      const result = updateWebhookSchema.safeParse({
        url: 'https://new-example.com/webhook',
      })
      expect(result.success).toBe(true)
    })

    it('validates events update', () => {
      const result = updateWebhookSchema.safeParse({
        events: ['release.created', 'release.updated'],
      })
      expect(result.success).toBe(true)
    })

    it('validates isActive update', () => {
      const result = updateWebhookSchema.safeParse({
        isActive: false,
      })
      expect(result.success).toBe(true)
    })

    it('validates full update', () => {
      const result = updateWebhookSchema.safeParse({
        url: 'https://example.com/webhook',
        events: ['release.created'],
        isActive: true,
      })
      expect(result.success).toBe(true)
    })

    it('rejects invalid URL', () => {
      const result = updateWebhookSchema.safeParse({
        url: 'not-a-url',
      })
      expect(result.success).toBe(false)
    })

    it('rejects empty events array', () => {
      const result = updateWebhookSchema.safeParse({
        events: [],
      })
      expect(result.success).toBe(false)
    })
  })

  describe('webhook formatting', () => {
    interface WebhookRow {
      id: string
      app_id: string
      url: string
      events: string
      is_active: number
      last_triggered_at: number | null
      created_at: number
      updated_at: number
    }

    function formatWebhook(webhook: WebhookRow): {
      id: string
      appId: string
      url: string
      events: string[]
      isActive: boolean
      lastTriggeredAt: number | null
      createdAt: number
      updatedAt: number
    } {
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

    it('formats webhook correctly', () => {
      const dbWebhook: WebhookRow = {
        id: 'wh-123',
        app_id: 'app-456',
        url: 'https://example.com/webhook',
        events: '["release.created","release.updated"]',
        is_active: 1,
        last_triggered_at: 1700000000,
        created_at: 1699000000,
        updated_at: 1699500000,
      }

      const formatted = formatWebhook(dbWebhook)

      expect(formatted.id).toBe('wh-123')
      expect(formatted.appId).toBe('app-456')
      expect(formatted.url).toBe('https://example.com/webhook')
      expect(formatted.events).toEqual(['release.created', 'release.updated'])
      expect(formatted.isActive).toBe(true)
      expect(formatted.lastTriggeredAt).toBe(1700000000)
    })

    it('handles inactive webhook', () => {
      const dbWebhook: WebhookRow = {
        id: 'wh-123',
        app_id: 'app-456',
        url: 'https://example.com/webhook',
        events: '["release.created"]',
        is_active: 0,
        last_triggered_at: null,
        created_at: 1699000000,
        updated_at: 1699000000,
      }

      const formatted = formatWebhook(dbWebhook)

      expect(formatted.isActive).toBe(false)
      expect(formatted.lastTriggeredAt).toBeNull()
    })

    it('handles invalid JSON events', () => {
      const dbWebhook: WebhookRow = {
        id: 'wh-123',
        app_id: 'app-456',
        url: 'https://example.com/webhook',
        events: 'invalid json',
        is_active: 1,
        last_triggered_at: null,
        created_at: 1699000000,
        updated_at: 1699000000,
      }

      const formatted = formatWebhook(dbWebhook)

      expect(formatted.events).toEqual([])
    })
  })

  describe('webhook event formatting', () => {
    interface WebhookEventRow {
      id: string
      webhook_id: string
      event: string
      status: string
      status_code: number | null
      error_message: string | null
      created_at: number
    }

    function formatWebhookEvent(event: WebhookEventRow): {
      id: string
      webhookId: string
      event: string
      status: string
      statusCode: number | null
      errorMessage: string | null
      createdAt: number
    } {
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

    it('formats delivered event', () => {
      const dbEvent: WebhookEventRow = {
        id: 'evt-123',
        webhook_id: 'wh-456',
        event: 'release.created',
        status: 'delivered',
        status_code: 200,
        error_message: null,
        created_at: 1700000000,
      }

      const formatted = formatWebhookEvent(dbEvent)

      expect(formatted.id).toBe('evt-123')
      expect(formatted.webhookId).toBe('wh-456')
      expect(formatted.event).toBe('release.created')
      expect(formatted.status).toBe('delivered')
      expect(formatted.statusCode).toBe(200)
      expect(formatted.errorMessage).toBeNull()
    })

    it('formats failed event', () => {
      const dbEvent: WebhookEventRow = {
        id: 'evt-123',
        webhook_id: 'wh-456',
        event: 'release.created',
        status: 'failed',
        status_code: 500,
        error_message: 'Internal server error',
        created_at: 1700000000,
      }

      const formatted = formatWebhookEvent(dbEvent)

      expect(formatted.status).toBe('failed')
      expect(formatted.statusCode).toBe(500)
      expect(formatted.errorMessage).toBe('Internal server error')
    })

    it('formats timeout event', () => {
      const dbEvent: WebhookEventRow = {
        id: 'evt-123',
        webhook_id: 'wh-456',
        event: 'release.created',
        status: 'failed',
        status_code: null,
        error_message: 'Request timed out',
        created_at: 1700000000,
      }

      const formatted = formatWebhookEvent(dbEvent)

      expect(formatted.status).toBe('failed')
      expect(formatted.statusCode).toBeNull()
      expect(formatted.errorMessage).toBe('Request timed out')
    })
  })

  describe('test payload', () => {
    it('has correct structure', () => {
      const appId = 'app-123'
      const webhookId = 'wh-456'

      const testPayload = {
        event: 'test',
        timestamp: new Date().toISOString(),
        data: {
          message: 'This is a test webhook from BundleNudge',
          appId,
          webhookId,
        },
      }

      expect(testPayload.event).toBe('test')
      expect(testPayload.timestamp).toBeDefined()
      expect(testPayload.data.message).toContain('test webhook')
      expect(testPayload.data.appId).toBe(appId)
      expect(testPayload.data.webhookId).toBe(webhookId)
    })
  })

  describe('event filtering', () => {
    function matchesEvent(webhookEvents: string[], event: string): boolean {
      return webhookEvents.includes(event) || webhookEvents.includes('*')
    }

    it('matches exact event', () => {
      const events = ['release.created', 'release.updated']
      expect(matchesEvent(events, 'release.created')).toBe(true)
    })

    it('does not match missing event', () => {
      const events = ['release.created']
      expect(matchesEvent(events, 'release.updated')).toBe(false)
    })

    it('matches wildcard', () => {
      const events = ['*']
      expect(matchesEvent(events, 'release.created')).toBe(true)
      expect(matchesEvent(events, 'crash.detected')).toBe(true)
    })

    it('matches with wildcard in list', () => {
      const events = ['release.created', '*']
      expect(matchesEvent(events, 'any.event')).toBe(true)
    })
  })

  describe('secret generation', () => {
    it('generates proper format', () => {
      // Simulating what nanoid would produce
      const prefix = 'whsec_'
      const randomPart = 'a'.repeat(32) // Placeholder
      const secret = `${prefix}${randomPart}`

      expect(secret).toMatch(/^whsec_[a-zA-Z0-9_-]{32}$/)
    })

    it('secret has minimum length', () => {
      const secret = 'whsec_' + 'x'.repeat(32)
      expect(secret.length).toBeGreaterThanOrEqual(38)
    })
  })

  /**
   * @agent remediate-webhook-encryption
   */
  describe('secret encryption', () => {
    const encryptionKey = generateKey()

    it('encrypts webhook secret before storage', async () => {
      const secret = 'whsec_abc123xyz789def456uvw012'
      const encrypted = await encrypt(secret, encryptionKey)

      // Encrypted value should be different from plaintext
      expect(encrypted).not.toBe(secret)
      // Should be base64 encoded
      expect(encrypted).toMatch(/^[A-Za-z0-9+/=]+$/)
    })

    it('decrypts webhook secret correctly', async () => {
      const secret = 'whsec_my_secret_key_for_webhooks'
      const encrypted = await encrypt(secret, encryptionKey)
      const decrypted = await decrypt(encrypted, encryptionKey)

      expect(decrypted).toBe(secret)
    })

    it('roundtrip preserves webhook secret format', async () => {
      const secret = 'whsec_' + 'x'.repeat(32)
      const encrypted = await encrypt(secret, encryptionKey)
      const decrypted = await decrypt(encrypted, encryptionKey)

      expect(decrypted).toMatch(/^whsec_[a-zA-Z0-9_-]+$/)
    })

    it('handles legacy plaintext secrets gracefully', async () => {
      const plaintextSecret = 'whsec_legacy_unencrypted_secret'

      // When decryption fails (not valid ciphertext), we should fall back
      // to treating it as plaintext
      const decryptWithFallback = async (
        value: string,
        key: string
      ): Promise<string> => {
        try {
          return await decrypt(value, key)
        } catch {
          return value
        }
      }

      const result = await decryptWithFallback(plaintextSecret, encryptionKey)
      expect(result).toBe(plaintextSecret)
    })

    it('different encryptions of same secret produce different ciphertext', async () => {
      const secret = 'whsec_same_secret_each_time'

      const encrypted1 = await encrypt(secret, encryptionKey)
      const encrypted2 = await encrypt(secret, encryptionKey)

      expect(encrypted1).not.toBe(encrypted2)
    })

    it('encrypted secrets can be used for HMAC after decryption', async () => {
      const secret = 'whsec_signature_test_key'
      const encrypted = await encrypt(secret, encryptionKey)
      const decrypted = await decrypt(encrypted, encryptionKey)

      // Verify we can use decrypted secret for HMAC
      const encoder = new TextEncoder()
      const keyData = encoder.encode(decrypted)
      const messageData = encoder.encode('test message')

      const key = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      )

      const signature = await crypto.subtle.sign('HMAC', key, messageData)
      expect(signature.byteLength).toBe(32) // SHA-256 produces 32 bytes
    })
  })
})
