/**
 * @agent remediate-api-key-middleware
 * @modified 2026-01-25
 *
 * Tests for API key authentication middleware
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Hono, type Context } from 'hono'
import bcrypt from 'bcryptjs'
import { apiKeyMiddleware, requirePermission, hashApiKey } from './api-key'
import type { Env } from '../types/env'

interface ApiKeyInfo {
  id: string
  appId: string
  name: string
  permissions: string[]
}

interface TestEnv {
  Bindings: Env
  Variables: { apiKey: ApiKeyInfo | undefined }
}

function createMockEnv() {
  const mockDb = {
    prepare: vi.fn().mockReturnThis(),
    bind: vi.fn().mockReturnThis(),
    first: vi.fn(),
    all: vi.fn(),
    run: vi.fn(),
  }

  const mockKV = {
    get: vi.fn(),
    put: vi.fn(),
  }

  return {
    DB: mockDb as unknown as D1Database,
    RATE_LIMIT: mockKV as unknown as KVNamespace,
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

describe('API Key Middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('apiKeyMiddleware', () => {
    it('returns 401 when Authorization header is missing', async () => {
      const env = createMockEnv()
      const app = new Hono<TestEnv>()
      app.use('*', apiKeyMiddleware)
      app.get('/test', (c) => c.json({ success: true }))

      const res = await app.request('/test', {}, env)
      expect(res.status).toBe(401)

      const body = (await res.json())
      expect(body.message).toBe('Missing API key')
    })

    it('returns 401 when Authorization header format is wrong', async () => {
      const env = createMockEnv()
      const app = new Hono<TestEnv>()
      app.use('*', apiKeyMiddleware)
      app.get('/test', (c) => c.json({ success: true }))

      const res = await app.request('/test', {
        headers: { Authorization: 'Basic abc123' },
      }, env)
      expect(res.status).toBe(401)
    })

    it('returns 401 for invalid API key format', async () => {
      const env = createMockEnv()
      const app = new Hono<TestEnv>()
      app.use('*', apiKeyMiddleware)
      app.get('/test', (c) => c.json({ success: true }))

      const res = await app.request('/test', {
        headers: { Authorization: 'Bearer invalid-key' },
      }, env)
      expect(res.status).toBe(401)

      const body = (await res.json())
      expect(body.message).toBe('Invalid API key format')
    })

    it('returns 401 when API key not found in database', async () => {
      const env = createMockEnv()
      const mockDb = env.DB as unknown as { all: ReturnType<typeof vi.fn> }
      const mockKV = env.RATE_LIMIT as unknown as { get: ReturnType<typeof vi.fn> }

      mockKV.get.mockResolvedValue(null)
      mockDb.all.mockResolvedValue({ results: [] })

      const app = new Hono<TestEnv>()
      app.use('*', apiKeyMiddleware)
      app.get('/test', (c) => c.json({ success: true }))

      const validFormatKey = 'bn_live_abcd1234_aBcDeFgHiJkLmNoPqRsTuVwXyZ123'
      const res = await app.request('/test', {
        headers: { Authorization: `Bearer ${validFormatKey}` },
      }, env)

      expect(res.status).toBe(401)
      const body = (await res.json())
      expect(body.message).toBe('Invalid API key')
    })

    it('returns 401 for revoked API key', async () => {
      const env = createMockEnv()
      const mockDb = env.DB as unknown as { all: ReturnType<typeof vi.fn> }
      const mockKV = env.RATE_LIMIT as unknown as { get: ReturnType<typeof vi.fn> }

      const testKey = 'bn_live_abcd1234_aBcDeFgHiJkLmNoPqRsTuVwXyZ123'
      const keyHash = await bcrypt.hash(testKey, 12)

      mockKV.get.mockResolvedValue(null)
      mockDb.all.mockResolvedValue({
        results: [{
          id: 'key-1',
          key_hash: keyHash,
          app_id: 'app-123',
          permissions: '["release:read"]',
          revoked_at: 1700000000, // Revoked
          name: 'Test Key',
        }],
      })

      const app = new Hono<TestEnv>()
      app.use('*', apiKeyMiddleware)
      app.get('/test', (c) => c.json({ success: true }))

      const res = await app.request('/test', {
        headers: { Authorization: `Bearer ${testKey}` },
      }, env)

      expect(res.status).toBe(401)
      const body = (await res.json())
      expect(body.message).toBe('API key has been revoked')
    })

    it('uses cached verification when available', async () => {
      const env = createMockEnv()
      const mockDb = env.DB as unknown as { all: ReturnType<typeof vi.fn> }
      const mockKV = env.RATE_LIMIT as unknown as { get: ReturnType<typeof vi.fn> }

      mockKV.get.mockResolvedValue({
        appId: 'app-123',
        keyId: 'key-1',
        name: 'Cached Key',
        permissions: ['release:read'],
        verifiedAt: Date.now(), // Fresh cache
      })

      const app = new Hono<TestEnv>()
      app.use('*', apiKeyMiddleware)
      app.get('/test', (c) => {
        const apiKey = c.get('apiKey')
        return c.json({ appId: apiKey?.appId })
      })

      const validFormatKey = 'bn_live_abcd1234_aBcDeFgHiJkLmNoPqRsTuVwXyZ123'
      const res = await app.request('/test', {
        headers: { Authorization: `Bearer ${validFormatKey}` },
      }, env)

      expect(res.status).toBe(200)
      const body = (await res.json())
      expect(body.appId).toBe('app-123')

      // Database should not be called when cache is valid
      expect(mockDb.all).not.toHaveBeenCalled()
    })
  })

  describe('requirePermission', () => {
    it('allows request when permission is present', async () => {
      const env = createMockEnv()
      const app = new Hono<TestEnv>()

      // Mock the apiKey being set
      app.use('*', async (c, next) => {
        c.set('apiKey', {
          id: 'key-1',
          appId: 'app-123',
          name: 'Test Key',
          permissions: ['release:create', 'release:read'],
        })
        return next()
      })
      app.use('*', requirePermission('release:create'))
      app.get('/test', (c) => c.json({ success: true }))

      const res = await app.request('/test', {}, env)
      expect(res.status).toBe(200)
    })

    it('blocks request when permission is missing', async () => {
      const env = createMockEnv()
      const app = new Hono<TestEnv>()

      app.use('*', async (c, next) => {
        c.set('apiKey', {
          id: 'key-1',
          appId: 'app-123',
          name: 'Test Key',
          permissions: ['release:read'],
        })
        return next()
      })
      app.use('*', requirePermission('release:create'))
      app.get('/test', (c) => c.json({ success: true }))

      const res = await app.request('/test', {}, env)
      expect(res.status).toBe(403)

      const body = (await res.json())
      expect(body.message).toContain('release:create')
    })

    it('blocks request when apiKey is not set', async () => {
      const env = createMockEnv()
      const app = new Hono<TestEnv>()

      app.use('*', requirePermission('release:create'))
      app.get('/test', (c) => c.json({ success: true }))

      const res = await app.request('/test', {}, env)
      expect(res.status).toBe(401)
    })

    it('requires all permissions when array is provided', async () => {
      const env = createMockEnv()
      const app = new Hono<TestEnv>()

      app.use('*', async (c, next) => {
        c.set('apiKey', {
          id: 'key-1',
          appId: 'app-123',
          name: 'Test Key',
          permissions: ['release:read', 'release:create'],
        })
        return next()
      })
      app.use('*', requirePermission(['release:create', 'release:delete']))
      app.get('/test', (c) => c.json({ success: true }))

      const res = await app.request('/test', {}, env)
      expect(res.status).toBe(403)
    })
  })

  describe('hashApiKey', () => {
    it('creates a valid bcrypt hash', async () => {
      const key = 'bn_live_abcd1234_testSecret123456789012'
      const hash = await hashApiKey(key)

      expect(hash).toMatch(/^\$2[ab]\$/)
      expect(await bcrypt.compare(key, hash)).toBe(true)
    })

    it('creates different hashes for same key', async () => {
      const key = 'bn_live_abcd1234_testSecret123456789012'
      const hash1 = await hashApiKey(key)
      const hash2 = await hashApiKey(key)

      expect(hash1).not.toBe(hash2)
      // But both should verify correctly
      expect(await bcrypt.compare(key, hash1)).toBe(true)
      expect(await bcrypt.compare(key, hash2)).toBe(true)
    })
  })
})
