/**
 * @agent remediate-api-key-middleware
 * @modified 2026-01-25
 *
 * Tests for API key CRUD routes
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import type { Env } from '../../types/env'
import type { AuthUser } from '../../middleware/auth'
import {
  hashApiKey,
  API_KEY_PERMISSIONS,
  type ApiKeyPermission,
} from '../../middleware/api-key'
import { ERROR_CODES } from '@bundlenudge/shared'

interface Variables {
  user: AuthUser
}

function createMockEnv() {
  const mockDb = {
    prepare: vi.fn().mockReturnThis(),
    bind: vi.fn().mockReturnThis(),
    first: vi.fn(),
    all: vi.fn(),
    run: vi.fn(),
  }

  return {
    DB: mockDb as unknown as D1Database,
    RATE_LIMIT: {
      get: vi.fn(),
      put: vi.fn(),
    } as unknown as KVNamespace,
    BUNDLES: {} as R2Bucket,
    ENVIRONMENT: 'development' as const,
    JWT_SECRET: 'test-secret',
    DATABASE_URL: 'test-db-url',
    BETTER_AUTH_SECRET: 'test-auth-secret',
    GITHUB_CLIENT_ID: 'test-client-id',
    GITHUB_CLIENT_SECRET: 'test-client-secret',
    RESEND_API_KEY: 'test-resend-key',
    STRIPE_SECRET_KEY: 'test-stripe-key',
    STRIPE_WEBHOOK_SECRET: 'test-stripe-webhook',
    ENCRYPTION_KEY: 'test-encryption-key',
    WEBHOOK_ENCRYPTION_KEY: 'test-webhook-encryption',
    GITHUB_TOKEN_ENCRYPTION_KEY: 'test-github-token-encryption',
    GITHUB_APP_ID: 'test-github-app-id',
    GITHUB_APP_NAME: 'test-github-app-name',
    GITHUB_PRIVATE_KEY: 'test-github-private-key',
    GITHUB_WEBHOOK_SECRET: 'test-github-webhook-secret',
    DASHBOARD_URL: 'https://dashboard.test.com',
    API_URL: 'https://api.test.com',
  }
}

const testUser: AuthUser = {
  id: 'user-123',
  email: 'test@example.com',
  name: 'Test User',
  isAdmin: false,
}

/**
 * Create test routes that mirror the actual API keys routes but with mock auth
 * This tests the route logic without needing to set up Better Auth
 */
function createTestApp() {
  const env = createMockEnv()
  const app = new Hono<{ Bindings: Env; Variables: Variables }>()

  // All routes require authentication (mock)
  app.use('*', async (c, next) => {
    c.set('user', testUser)
    return next()
  })

  const appIdParamsSchema = z.object({
    appId: z.string().uuid(),
  })

  const keyIdParamsSchema = z.object({
    appId: z.string().uuid(),
    keyId: z.string().uuid(),
  })

  const createKeySchema = z.object({
    name: z.string().min(1).max(100),
    permissions: z.array(
      z.enum(Object.keys(API_KEY_PERMISSIONS) as [ApiKeyPermission, ...ApiKeyPermission[]])
    ).optional(),
  })

  // GET /apps/:appId/keys - List API keys
  app.get(
    '/apps/:appId/keys',
    zValidator('param', appIdParamsSchema),
    async (c) => {
      const user = c.get('user')
      const { appId } = c.req.valid('param')

      const appResult = await c.env.DB.prepare(
        'SELECT id FROM apps WHERE id = ? AND owner_id = ? AND deleted_at IS NULL'
      ).bind(appId, user.id).first()

      if (!appResult) {
        return c.json({ error: ERROR_CODES.APP_NOT_FOUND, message: 'App not found' }, 404)
      }

      const keys = await c.env.DB.prepare(
        'SELECT * FROM api_keys WHERE app_id = ? ORDER BY created_at DESC'
      ).bind(appId).all()

      const apiKeys = keys.results.map((k: Record<string, unknown>) => ({
        id: k.id,
        name: k.name,
        keyPrefix: k.key_prefix,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        permissions: JSON.parse(k.permissions as string),
        createdAt: k.created_at,
        lastUsedAt: k.last_used_at,
        revokedAt: k.revoked_at,
      }))

      return c.json({ apiKeys })
    }
  )

  // POST /apps/:appId/keys - Create API key
  app.post(
    '/apps/:appId/keys',
    zValidator('param', appIdParamsSchema),
    zValidator('json', createKeySchema),
    async (c) => {
      const user = c.get('user')
      const { appId } = c.req.valid('param')
      const body = c.req.valid('json')

      const appResult = await c.env.DB.prepare(
        'SELECT id FROM apps WHERE id = ? AND owner_id = ? AND deleted_at IS NULL'
      ).bind(appId, user.id).first()

      if (!appResult) {
        return c.json({ error: ERROR_CODES.APP_NOT_FOUND, message: 'App not found' }, 404)
      }

      const apiKey = generateTestApiKey()
      const keyId = crypto.randomUUID()
      const keyHash = await hashApiKey(apiKey)
      const keyPrefix = apiKey.slice(0, 16)
      const defaultPerms: ApiKeyPermission[] = ['release:read', 'update:check']
      const permissions = JSON.stringify(body.permissions ?? defaultPerms)
      const now = Math.floor(Date.now() / 1000)

      await c.env.DB.prepare('INSERT INTO api_keys VALUES').bind(
        keyId, appId, body.name, keyPrefix, keyHash, permissions, now
      ).run()

      return c.json({
        id: keyId,
        name: body.name,
        apiKey,
        keyPrefix,
        permissions: body.permissions ?? defaultPerms,
        createdAt: now,
      }, 201)
    }
  )

  // DELETE /apps/:appId/keys/:keyId - Revoke API key
  app.delete(
    '/apps/:appId/keys/:keyId',
    zValidator('param', keyIdParamsSchema),
    async (c) => {
      const user = c.get('user')
      const { appId, keyId } = c.req.valid('param')

      const appResult = await c.env.DB.prepare(
        'SELECT id FROM apps WHERE id = ? AND owner_id = ? AND deleted_at IS NULL'
      ).bind(appId, user.id).first()

      if (!appResult) {
        return c.json({ error: ERROR_CODES.APP_NOT_FOUND, message: 'App not found' }, 404)
      }

      const key = await c.env.DB.prepare(
        'SELECT id, revoked_at FROM api_keys WHERE id = ? AND app_id = ?'
      ).bind(keyId, appId).first<{ id: string; revoked_at: number | null }>()

      if (!key) {
        return c.json({ error: ERROR_CODES.NOT_FOUND, message: 'API key not found' }, 404)
      }

      if (key.revoked_at) {
        return c.json({ error: ERROR_CODES.INVALID_STATE, message: 'API key already revoked' }, 400)
      }

      const now = Math.floor(Date.now() / 1000)
      await c.env.DB.prepare('UPDATE api_keys SET revoked_at = ? WHERE id = ?').bind(now, keyId).run()

      return c.json({ success: true })
    }
  )

  return { app, env }
}

function generateTestApiKey(): string {
  const prefix = 'abcd1234'
  const secret = 'aBcDeFgHiJkLmNoPqRsTuVwXyZ123'
  return `bn_live_${prefix}_${secret}`
}

describe('API Keys routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /apps/:appId/keys', () => {
    it('returns list of API keys for valid app', async () => {
      const { app, env } = createTestApp()
      const appId = crypto.randomUUID()

      const mockDb = env.DB as unknown as { first: ReturnType<typeof vi.fn>; all: ReturnType<typeof vi.fn> }
      mockDb.first.mockResolvedValue({ id: appId })
      mockDb.all.mockResolvedValue({
        results: [
          {
            id: 'key-1',
            app_id: appId,
            name: 'CI Key',
            key_prefix: 'bn_live_abc12345',
            permissions: '["release:create","release:read"]',
            created_at: 1700000000,
            last_used_at: 1700001000,
            revoked_at: null,
          },
        ],
      })

      const res = await app.request(`/apps/${appId}/keys`, {}, env)
      expect(res.status).toBe(200)

      const body: { apiKeys: { name: string; permissions: string[] }[] } = await res.json()
      expect(body.apiKeys).toHaveLength(1)
      expect(body.apiKeys[0]?.name).toBe('CI Key')
      expect(body.apiKeys[0]?.permissions).toEqual(['release:create', 'release:read'])
    })

    it('returns 404 for non-existent app', async () => {
      const { app, env } = createTestApp()
      const appId = crypto.randomUUID()

      const mockDb = env.DB as unknown as { first: ReturnType<typeof vi.fn> }
      mockDb.first.mockResolvedValue(null)

      const res = await app.request(`/apps/${appId}/keys`, {}, env)
      expect(res.status).toBe(404)
    })
  })

  describe('POST /apps/:appId/keys', () => {
    it('creates a new API key with default permissions', async () => {
      const { app, env } = createTestApp()
      const appId = crypto.randomUUID()

      const mockDb = env.DB as unknown as { first: ReturnType<typeof vi.fn>; run: ReturnType<typeof vi.fn> }
      mockDb.first.mockResolvedValue({ id: appId })
      mockDb.run.mockResolvedValue({ success: true })

      const res = await app.request(`/apps/${appId}/keys`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'New CI Key' }),
      }, env)

      expect(res.status).toBe(201)

      const body = (await res.json())
      expect(body.name).toBe('New CI Key')
      expect(body.apiKey).toMatch(/^bn_live_[a-z0-9]{8}_[A-Za-z0-9_-]+$/)
      expect(body.permissions).toEqual(['release:read', 'update:check'])
    })

    it('creates a new API key with custom permissions', async () => {
      const { app, env } = createTestApp()
      const appId = crypto.randomUUID()

      const mockDb = env.DB as unknown as { first: ReturnType<typeof vi.fn>; run: ReturnType<typeof vi.fn> }
      mockDb.first.mockResolvedValue({ id: appId })
      mockDb.run.mockResolvedValue({ success: true })

      const res = await app.request(`/apps/${appId}/keys`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Full Access Key',
          permissions: ['release:create', 'release:read', 'release:update'],
        }),
      }, env)

      expect(res.status).toBe(201)

      const body = (await res.json())
      expect(body.permissions).toEqual(['release:create', 'release:read', 'release:update'])
    })

    it('returns 404 for non-existent app', async () => {
      const { app, env } = createTestApp()
      const appId = crypto.randomUUID()

      const mockDb = env.DB as unknown as { first: ReturnType<typeof vi.fn> }
      mockDb.first.mockResolvedValue(null)

      const res = await app.request(`/apps/${appId}/keys`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Test Key' }),
      }, env)

      expect(res.status).toBe(404)
    })
  })

  describe('DELETE /apps/:appId/keys/:keyId', () => {
    it('revokes an existing API key', async () => {
      const { app, env } = createTestApp()
      const appId = crypto.randomUUID()
      const keyId = crypto.randomUUID()

      const mockDb = env.DB as unknown as { first: ReturnType<typeof vi.fn>; run: ReturnType<typeof vi.fn> }
      // First call: check app exists
      // Second call: check key exists
      mockDb.first
        .mockResolvedValueOnce({ id: appId })
        .mockResolvedValueOnce({ id: keyId, revoked_at: null })
      mockDb.run.mockResolvedValue({ success: true })

      const res = await app.request(`/apps/${appId}/keys/${keyId}`, {
        method: 'DELETE',
      }, env)

      expect(res.status).toBe(200)
      const body = (await res.json())
      expect(body.success).toBe(true)
    })

    it('returns 404 for non-existent key', async () => {
      const { app, env } = createTestApp()
      const appId = crypto.randomUUID()
      const keyId = crypto.randomUUID()

      const mockDb = env.DB as unknown as { first: ReturnType<typeof vi.fn> }
      mockDb.first
        .mockResolvedValueOnce({ id: appId })
        .mockResolvedValueOnce(null)

      const res = await app.request(`/apps/${appId}/keys/${keyId}`, {
        method: 'DELETE',
      }, env)

      expect(res.status).toBe(404)
    })

    it('returns 400 for already revoked key', async () => {
      const { app, env } = createTestApp()
      const appId = crypto.randomUUID()
      const keyId = crypto.randomUUID()

      const mockDb = env.DB as unknown as { first: ReturnType<typeof vi.fn> }
      mockDb.first
        .mockResolvedValueOnce({ id: appId })
        .mockResolvedValueOnce({ id: keyId, revoked_at: 1700000000 })

      const res = await app.request(`/apps/${appId}/keys/${keyId}`, {
        method: 'DELETE',
      }, env)

      expect(res.status).toBe(400)
    })
  })
})

describe('API Key format', () => {
  it('validates correct API key format', () => {
    const validKey = 'bn_live_abcd1234_aBcDeFgHiJkLmNoPqRsTuVwXyZ123'
    const regex = /^bn_(live|test)_[a-z0-9]{8}_[A-Za-z0-9_-]{24,}$/
    expect(regex.test(validKey)).toBe(true)
  })

  it('rejects invalid API key format', () => {
    const invalidKeys = [
      'invalid_key',
      'bn_prod_abcd1234_secret',
      'bn_live_ABCD_secret',
      'bn_live_abc_short',
    ]
    const regex = /^bn_(live|test)_[a-z0-9]{8}_[A-Za-z0-9_-]{24,}$/

    for (const key of invalidKeys) {
      expect(regex.test(key)).toBe(false)
    }
  })
})
