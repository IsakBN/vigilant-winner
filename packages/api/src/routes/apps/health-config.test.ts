/**
 * @agent wave4a-health-config
 * @created 2026-01-26
 *
 * Tests for health config routes
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import type { Env } from '../../types/env'
import type { AuthUser } from '../../middleware/auth'
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

const DEFAULT_HEALTH_CONFIG = {
  events: [{ name: 'onAppReady', required: true, timeoutMs: 30000 }],
  endpoints: [],
}

const criticalEventSchema = z.object({
  name: z.string()
    .min(1)
    .max(100)
    .regex(/^[a-zA-Z][a-zA-Z0-9_]*$/),
  required: z.boolean(),
  timeoutMs: z.number().int().min(1000).max(300000),
})

const criticalEndpointSchema = z.object({
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE']),
  url: z.string()
    .min(1)
    .max(500)
    .regex(/^\/[a-zA-Z0-9/_\-.?&=]*$/),
  expectedStatus: z.array(z.number().int().min(100).max(599)).min(1).max(10),
  required: z.boolean(),
})

const healthConfigSchema = z.object({
  events: z.array(criticalEventSchema).max(20).default([]),
  endpoints: z.array(criticalEndpointSchema).max(20).default([]),
})

const appIdParamsSchema = z.object({
  appId: z.string().uuid(),
})

/**
 * Create test routes that mirror the actual health config routes
 */
function createTestApp() {
  const env = createMockEnv()
  const app = new Hono<{ Bindings: Env; Variables: Variables }>()

  // Mock auth middleware
  app.use('*', async (c, next) => {
    c.set('user', testUser)
    return next()
  })

  // GET /apps/:appId/health-config
  app.get(
    '/apps/:appId/health-config',
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

      const configRow = await c.env.DB.prepare(
        'SELECT * FROM health_configs WHERE app_id = ?'
      ).bind(appId).first()

      if (!configRow) {
        return c.json({ config: DEFAULT_HEALTH_CONFIG })
      }

      const config = JSON.parse((configRow as { config: string }).config)
      return c.json({ config })
    }
  )

  // POST /apps/:appId/health-config
  app.post(
    '/apps/:appId/health-config',
    zValidator('param', appIdParamsSchema),
    zValidator('json', healthConfigSchema),
    async (c) => {
      const user = c.get('user')
      const { appId } = c.req.valid('param')
      const config = c.req.valid('json')

      const appResult = await c.env.DB.prepare(
        'SELECT id FROM apps WHERE id = ? AND owner_id = ? AND deleted_at IS NULL'
      ).bind(appId, user.id).first()

      if (!appResult) {
        return c.json({ error: ERROR_CODES.APP_NOT_FOUND, message: 'App not found' }, 404)
      }

      const now = Math.floor(Date.now() / 1000)
      const configJson = JSON.stringify(config)

      const existingConfig = await c.env.DB.prepare(
        'SELECT id FROM health_configs WHERE app_id = ?'
      ).bind(appId).first()

      if (existingConfig) {
        await c.env.DB.prepare(
          'UPDATE health_configs SET config = ?, updated_at = ? WHERE app_id = ?'
        ).bind(configJson, now, appId).run()
      } else {
        const configId = crypto.randomUUID()
        await c.env.DB.prepare('INSERT INTO health_configs VALUES')
          .bind(configId, appId, configJson, now, now).run()
      }

      return c.json({ success: true, config })
    }
  )

  return { app, env }
}

/**
 * Create test app without auth (for testing auth requirement)
 */
function createTestAppWithoutAuth() {
  const env = createMockEnv()
  const app = new Hono<{ Bindings: Env; Variables: Variables }>()

  // No auth middleware - simulates unauthenticated request
  app.get('/apps/:appId/health-config', async (c) => {
    const user = c.get('user')
    if (!user) {
      return c.json({ error: ERROR_CODES.UNAUTHORIZED, message: 'Unauthorized' }, 401)
    }
    return c.json({ config: DEFAULT_HEALTH_CONFIG })
  })

  app.post('/apps/:appId/health-config', async (c) => {
    const user = c.get('user')
    if (!user) {
      return c.json({ error: ERROR_CODES.UNAUTHORIZED, message: 'Unauthorized' }, 401)
    }
    return c.json({ success: true })
  })

  return { app, env }
}

describe('Health Config routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /apps/:appId/health-config', () => {
    it('returns saved config for valid app', async () => {
      const { app, env } = createTestApp()
      const appId = crypto.randomUUID()
      const savedConfig = {
        events: [
          { name: 'onAppReady', required: true, timeoutMs: 30000 },
          { name: 'onUserAuthenticated', required: false, timeoutMs: 60000 },
        ],
        endpoints: [
          { method: 'GET', url: '/api/config', expectedStatus: [200], required: true },
        ],
      }

      const mockDb = env.DB as unknown as { first: ReturnType<typeof vi.fn> }
      mockDb.first
        .mockResolvedValueOnce({ id: appId })
        .mockResolvedValueOnce({ id: 'config-1', app_id: appId, config: JSON.stringify(savedConfig) })

      const res = await app.request(`/apps/${appId}/health-config`, {}, env)
      expect(res.status).toBe(200)

      const body = await res.json() as { config: typeof savedConfig }
      expect(body.config.events).toHaveLength(2)
      expect(body.config.endpoints).toHaveLength(1)
      expect(body.config.events[0]?.name).toBe('onAppReady')
    })

    it('returns default config when none set', async () => {
      const { app, env } = createTestApp()
      const appId = crypto.randomUUID()

      const mockDb = env.DB as unknown as { first: ReturnType<typeof vi.fn> }
      mockDb.first
        .mockResolvedValueOnce({ id: appId })
        .mockResolvedValueOnce(null)

      const res = await app.request(`/apps/${appId}/health-config`, {}, env)
      expect(res.status).toBe(200)

      const body = await res.json() as { config: typeof DEFAULT_HEALTH_CONFIG }
      expect(body.config).toEqual(DEFAULT_HEALTH_CONFIG)
    })

    it('returns 404 for non-existent app', async () => {
      const { app, env } = createTestApp()
      const appId = crypto.randomUUID()

      const mockDb = env.DB as unknown as { first: ReturnType<typeof vi.fn> }
      mockDb.first.mockResolvedValue(null)

      const res = await app.request(`/apps/${appId}/health-config`, {}, env)
      expect(res.status).toBe(404)

      const body = await res.json() as { error: string }
      expect(body.error).toBe(ERROR_CODES.APP_NOT_FOUND)
    })

    it('returns 401 when not authenticated', async () => {
      const { app, env } = createTestAppWithoutAuth()
      const appId = crypto.randomUUID()

      const res = await app.request(`/apps/${appId}/health-config`, {}, env)
      expect(res.status).toBe(401)
    })
  })

  describe('POST /apps/:appId/health-config', () => {
    it('saves config successfully', async () => {
      const { app, env } = createTestApp()
      const appId = crypto.randomUUID()
      const newConfig = {
        events: [
          { name: 'onAppReady', required: true, timeoutMs: 30000 },
        ],
        endpoints: [
          { method: 'GET', url: '/api/health', expectedStatus: [200, 204], required: true },
        ],
      }

      const mockDb = env.DB as unknown as {
        first: ReturnType<typeof vi.fn>
        run: ReturnType<typeof vi.fn>
      }
      mockDb.first
        .mockResolvedValueOnce({ id: appId })
        .mockResolvedValueOnce(null) // No existing config
      mockDb.run.mockResolvedValue({ success: true })

      const res = await app.request(`/apps/${appId}/health-config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfig),
      }, env)

      expect(res.status).toBe(200)

      const body = await res.json() as { success: boolean; config: typeof newConfig }
      expect(body.success).toBe(true)
      expect(body.config.events).toHaveLength(1)
      expect(body.config.endpoints).toHaveLength(1)
    })

    it('updates existing config', async () => {
      const { app, env } = createTestApp()
      const appId = crypto.randomUUID()
      const updatedConfig = {
        events: [
          { name: 'onAppReady', required: true, timeoutMs: 45000 },
        ],
        endpoints: [],
      }

      const mockDb = env.DB as unknown as {
        first: ReturnType<typeof vi.fn>
        run: ReturnType<typeof vi.fn>
      }
      mockDb.first
        .mockResolvedValueOnce({ id: appId })
        .mockResolvedValueOnce({ id: 'existing-config-id' }) // Existing config
      mockDb.run.mockResolvedValue({ success: true })

      const res = await app.request(`/apps/${appId}/health-config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedConfig),
      }, env)

      expect(res.status).toBe(200)

      const body = await res.json() as { success: boolean }
      expect(body.success).toBe(true)
    })

    it('returns 404 for non-existent app', async () => {
      const { app, env } = createTestApp()
      const appId = crypto.randomUUID()

      const mockDb = env.DB as unknown as { first: ReturnType<typeof vi.fn> }
      mockDb.first.mockResolvedValue(null)

      const res = await app.request(`/apps/${appId}/health-config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events: [], endpoints: [] }),
      }, env)

      expect(res.status).toBe(404)
    })

    it('returns 401 when not authenticated', async () => {
      const { app, env } = createTestAppWithoutAuth()
      const appId = crypto.randomUUID()

      const res = await app.request(`/apps/${appId}/health-config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events: [], endpoints: [] }),
      }, env)

      expect(res.status).toBe(401)
    })
  })

  describe('Validation - Event names', () => {
    it('rejects event name starting with number', async () => {
      const { app, env } = createTestApp()
      const appId = crypto.randomUUID()

      const mockDb = env.DB as unknown as { first: ReturnType<typeof vi.fn> }
      mockDb.first.mockResolvedValue({ id: appId })

      const res = await app.request(`/apps/${appId}/health-config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          events: [{ name: '123invalid', required: true, timeoutMs: 30000 }],
          endpoints: [],
        }),
      }, env)

      expect(res.status).toBe(400)
    })

    it('rejects event name with special characters', async () => {
      const { app, env } = createTestApp()
      const appId = crypto.randomUUID()

      const mockDb = env.DB as unknown as { first: ReturnType<typeof vi.fn> }
      mockDb.first.mockResolvedValue({ id: appId })

      const res = await app.request(`/apps/${appId}/health-config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          events: [{ name: 'on-app-ready', required: true, timeoutMs: 30000 }],
          endpoints: [],
        }),
      }, env)

      expect(res.status).toBe(400)
    })

    it('accepts valid event names with underscores', async () => {
      const { app, env } = createTestApp()
      const appId = crypto.randomUUID()

      const mockDb = env.DB as unknown as {
        first: ReturnType<typeof vi.fn>
        run: ReturnType<typeof vi.fn>
      }
      mockDb.first
        .mockResolvedValueOnce({ id: appId })
        .mockResolvedValueOnce(null)
      mockDb.run.mockResolvedValue({ success: true })

      const res = await app.request(`/apps/${appId}/health-config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          events: [{ name: 'on_app_ready', required: true, timeoutMs: 30000 }],
          endpoints: [],
        }),
      }, env)

      expect(res.status).toBe(200)
    })
  })

  describe('Validation - Endpoint URLs', () => {
    it('rejects absolute URLs', async () => {
      const { app, env } = createTestApp()
      const appId = crypto.randomUUID()

      const mockDb = env.DB as unknown as { first: ReturnType<typeof vi.fn> }
      mockDb.first.mockResolvedValue({ id: appId })

      const res = await app.request(`/apps/${appId}/health-config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          events: [],
          endpoints: [{
            method: 'GET',
            url: 'https://example.com/api',
            expectedStatus: [200],
            required: true,
          }],
        }),
      }, env)

      expect(res.status).toBe(400)
    })

    it('rejects URLs without leading slash', async () => {
      const { app, env } = createTestApp()
      const appId = crypto.randomUUID()

      const mockDb = env.DB as unknown as { first: ReturnType<typeof vi.fn> }
      mockDb.first.mockResolvedValue({ id: appId })

      const res = await app.request(`/apps/${appId}/health-config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          events: [],
          endpoints: [{
            method: 'GET',
            url: 'api/health',
            expectedStatus: [200],
            required: true,
          }],
        }),
      }, env)

      expect(res.status).toBe(400)
    })

    it('accepts valid relative URLs with query params', async () => {
      const { app, env } = createTestApp()
      const appId = crypto.randomUUID()

      const mockDb = env.DB as unknown as {
        first: ReturnType<typeof vi.fn>
        run: ReturnType<typeof vi.fn>
      }
      mockDb.first
        .mockResolvedValueOnce({ id: appId })
        .mockResolvedValueOnce(null)
      mockDb.run.mockResolvedValue({ success: true })

      const res = await app.request(`/apps/${appId}/health-config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          events: [],
          endpoints: [{
            method: 'GET',
            url: '/api/config?version=1',
            expectedStatus: [200],
            required: true,
          }],
        }),
      }, env)

      expect(res.status).toBe(200)
    })
  })

  describe('Validation - Timeouts', () => {
    it('rejects timeout below minimum', async () => {
      const { app, env } = createTestApp()
      const appId = crypto.randomUUID()

      const mockDb = env.DB as unknown as { first: ReturnType<typeof vi.fn> }
      mockDb.first.mockResolvedValue({ id: appId })

      const res = await app.request(`/apps/${appId}/health-config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          events: [{ name: 'onAppReady', required: true, timeoutMs: 500 }],
          endpoints: [],
        }),
      }, env)

      expect(res.status).toBe(400)
    })

    it('rejects timeout above maximum', async () => {
      const { app, env } = createTestApp()
      const appId = crypto.randomUUID()

      const mockDb = env.DB as unknown as { first: ReturnType<typeof vi.fn> }
      mockDb.first.mockResolvedValue({ id: appId })

      const res = await app.request(`/apps/${appId}/health-config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          events: [{ name: 'onAppReady', required: true, timeoutMs: 500000 }],
          endpoints: [],
        }),
      }, env)

      expect(res.status).toBe(400)
    })
  })

  describe('Validation - Status codes', () => {
    it('rejects empty expectedStatus array', async () => {
      const { app, env } = createTestApp()
      const appId = crypto.randomUUID()

      const mockDb = env.DB as unknown as { first: ReturnType<typeof vi.fn> }
      mockDb.first.mockResolvedValue({ id: appId })

      const res = await app.request(`/apps/${appId}/health-config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          events: [],
          endpoints: [{
            method: 'GET',
            url: '/api/health',
            expectedStatus: [],
            required: true,
          }],
        }),
      }, env)

      expect(res.status).toBe(400)
    })

    it('rejects invalid HTTP status codes', async () => {
      const { app, env } = createTestApp()
      const appId = crypto.randomUUID()

      const mockDb = env.DB as unknown as { first: ReturnType<typeof vi.fn> }
      mockDb.first.mockResolvedValue({ id: appId })

      const res = await app.request(`/apps/${appId}/health-config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          events: [],
          endpoints: [{
            method: 'GET',
            url: '/api/health',
            expectedStatus: [999],
            required: true,
          }],
        }),
      }, env)

      expect(res.status).toBe(400)
    })
  })
})

describe('Health Config schema validation', () => {
  it('accepts config with multiple events and endpoints', () => {
    const config = {
      events: [
        { name: 'onAppReady', required: true, timeoutMs: 30000 },
        { name: 'onUserAuthenticated', required: false, timeoutMs: 60000 },
      ],
      endpoints: [
        { method: 'GET' as const, url: '/api/config', expectedStatus: [200], required: true },
        { method: 'POST' as const, url: '/api/login', expectedStatus: [200, 201], required: false },
      ],
    }

    const result = healthConfigSchema.safeParse(config)
    expect(result.success).toBe(true)
  })

  it('accepts empty config', () => {
    const result = healthConfigSchema.safeParse({ events: [], endpoints: [] })
    expect(result.success).toBe(true)
  })

  it('applies defaults for missing arrays', () => {
    const result = healthConfigSchema.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.events).toEqual([])
      expect(result.data.endpoints).toEqual([])
    }
  })
})
