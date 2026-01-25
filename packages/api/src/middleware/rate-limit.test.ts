/**
 * @agent fix-rate-limiting
 * @created 2026-01-25
 * @description Tests for rate limiting middleware
 *
 * @agent remediate-auth-rate-limit
 * @modified 2026-01-25
 * @description Added tests for auth rate limiting
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Hono } from 'hono'
import {
  createRateLimitMiddleware,
  buildRateLimitKey,
  getIdentifier,
  checkRateLimit,
  RATE_LIMITS,
} from './rate-limit'
import type { Env } from '../types/env'

function createMockKV(): KVNamespace {
  const store = new Map<string, string>()
  return {
    get: vi.fn((key: string) => Promise.resolve(store.get(key) ?? null)),
    put: vi.fn((key: string, value: string) => {
      store.set(key, value)
      return Promise.resolve()
    }),
    delete: vi.fn((key: string) => {
      store.delete(key)
      return Promise.resolve()
    }),
    list: vi.fn(),
    getWithMetadata: vi.fn(),
  } as unknown as KVNamespace
}

describe('buildRateLimitKey', () => {
  it('builds key with identifier and endpoint', () => {
    expect(buildRateLimitKey('device-123', '/v1/updates')).toBe('rate:device-123:/v1/updates')
    expect(buildRateLimitKey('192.168.1.1', '/v1/telemetry')).toBe('rate:192.168.1.1:/v1/telemetry')
  })
})

describe('getIdentifier', () => {
  it('prefers device ID over IP', () => {
    expect(getIdentifier('device-123', '192.168.1.1')).toBe('device-123')
  })

  it('falls back to IP when no device ID', () => {
    expect(getIdentifier(undefined, '192.168.1.1')).toBe('192.168.1.1')
  })

  it('returns unknown when neither available', () => {
    expect(getIdentifier(undefined, undefined)).toBe('unknown')
  })
})

describe('checkRateLimit', () => {
  let mockKV: KVNamespace

  beforeEach(() => { mockKV = createMockKV() })

  it('allows first request with correct remaining count', async () => {
    const result = await checkRateLimit(mockKV, 'test-key', 10, 60)
    expect(result.allowed).toBe(true)
    expect(result.info.limit).toBe(10)
    expect(result.info.remaining).toBe(9)
  })

  it('increments count on each request', async () => {
    await checkRateLimit(mockKV, 'test-key', 10, 60)
    const result = await checkRateLimit(mockKV, 'test-key', 10, 60)
    expect(result.allowed).toBe(true)
    expect(result.info.remaining).toBe(8)
  })

  it('blocks when limit exceeded', async () => {
    for (let i = 0; i < 10; i++) {
      await checkRateLimit(mockKV, 'test-key', 10, 60)
    }
    const result = await checkRateLimit(mockKV, 'test-key', 10, 60)
    expect(result.allowed).toBe(false)
    expect(result.info.remaining).toBe(0)
  })

  it('returns valid reset timestamp', async () => {
    const now = Math.floor(Date.now() / 1000)
    const result = await checkRateLimit(mockKV, 'test-key', 10, 60)
    expect(result.info.resetAt).toBeGreaterThan(now - 1)
    expect(result.info.resetAt).toBeLessThanOrEqual(now + 60)
  })
})

describe('createRateLimitMiddleware', () => {
  let mockKV: KVNamespace
  let mockEnv: Env

  beforeEach(() => {
    mockKV = createMockKV()
    mockEnv = { RATE_LIMIT: mockKV } as Env
  })

  function createApp(type: 'updates' | 'devices' | 'telemetry' | 'auth'): Hono<{ Bindings: Env }> {
    const app = new Hono<{ Bindings: Env }>()
    app.use('*', createRateLimitMiddleware(type))
    app.get('/test', (c) => c.json({ success: true }))
    return app
  }

  async function makeRequest(app: Hono<{ Bindings: Env }>, deviceId: string): Promise<Response> {
    return await app.request('/test', { headers: { 'X-Device-ID': deviceId } }, mockEnv)
  }

  it('allows requests under limit', async () => {
    const app = createApp('updates')
    const res = await makeRequest(app, 'device-123')
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ success: true })
  })

  it('sets rate limit headers on response', async () => {
    const app = createApp('updates')
    const res = await makeRequest(app, 'device-123')
    expect(res.headers.get('X-RateLimit-Limit')).toBe('60')
    expect(res.headers.get('X-RateLimit-Remaining')).toBe('59')
    expect(res.headers.get('X-RateLimit-Reset')).toBeTruthy()
  })

  it('blocks requests over limit with 429', async () => {
    const app = createApp('devices') // 10 req/min limit
    for (let i = 0; i < 10; i++) {
      await makeRequest(app, 'device-123')
    }

    const res = await makeRequest(app, 'device-123')
    expect(res.status).toBe(429)

    const body: { error: string; retryAfter: number } = await res.json()
    expect(body.error).toBe('RATE_LIMITED')
    expect(body.retryAfter).toBeGreaterThan(0)
  })

  it('includes Retry-After header when blocked', async () => {
    const app = createApp('devices')
    for (let i = 0; i < 10; i++) {
      await makeRequest(app, 'device-123')
    }

    const res = await makeRequest(app, 'device-123')
    const retryAfter = parseInt(res.headers.get('Retry-After') ?? '0', 10)
    expect(retryAfter).toBeGreaterThan(0)
    expect(retryAfter).toBeLessThanOrEqual(60)
  })

  it('tracks different devices separately', async () => {
    const app = createApp('devices')
    for (let i = 0; i < 10; i++) {
      await makeRequest(app, 'device-1')
    }

    const res1 = await makeRequest(app, 'device-1')
    expect(res1.status).toBe(429)

    const res2 = await makeRequest(app, 'device-2')
    expect(res2.status).toBe(200)
  })

  it('uses IP when no device ID provided', async () => {
    const app = createApp('devices')
    const res = await app.request('/test', {
      headers: { 'CF-Connecting-IP': '192.168.1.100' },
    }, mockEnv)
    expect(res.status).toBe(200)
    // Rate limiting worked with IP-based identifier
    expect(res.headers.get('X-RateLimit-Limit')).toBe('10')
  })
})

describe('RATE_LIMITS config', () => {
  it('has correct limits for all endpoint types', () => {
    expect(RATE_LIMITS.updates).toEqual({ limit: 60, windowSeconds: 60 })
    expect(RATE_LIMITS.telemetry).toEqual({ limit: 100, windowSeconds: 60 })
    expect(RATE_LIMITS.devices).toEqual({ limit: 10, windowSeconds: 60 })
    expect(RATE_LIMITS.auth).toEqual({ limit: 10, windowSeconds: 60 })
  })
})

describe('auth rate limiting', () => {
  let mockKV: KVNamespace
  let mockEnv: Env

  beforeEach(() => {
    mockKV = createMockKV()
    mockEnv = { RATE_LIMIT: mockKV } as Env
  })

  function createAuthApp(): Hono<{ Bindings: Env }> {
    const app = new Hono<{ Bindings: Env }>()
    app.use('*', createRateLimitMiddleware('auth'))
    app.post('/login', (c) => c.json({ success: true }))
    return app
  }

  it('enforces strict 10 req/min limit for auth routes', async () => {
    const app = createAuthApp()

    // Should allow first 10 requests
    for (let i = 0; i < 10; i++) {
      const res = await app.request('/login', {
        method: 'POST',
        headers: { 'CF-Connecting-IP': '192.168.1.1' },
      }, mockEnv)
      expect(res.status).toBe(200)
    }

    // 11th request should be blocked
    const blockedRes = await app.request('/login', {
      method: 'POST',
      headers: { 'CF-Connecting-IP': '192.168.1.1' },
    }, mockEnv)
    expect(blockedRes.status).toBe(429)
  })

  it('uses IP-based identification for auth routes', async () => {
    const app = createAuthApp()

    // Exhaust rate limit for IP 1
    for (let i = 0; i < 10; i++) {
      await app.request('/login', {
        method: 'POST',
        headers: { 'CF-Connecting-IP': '192.168.1.1' },
      }, mockEnv)
    }

    // Different IP should still be allowed
    const res = await app.request('/login', {
      method: 'POST',
      headers: { 'CF-Connecting-IP': '192.168.1.2' },
    }, mockEnv)
    expect(res.status).toBe(200)
  })

  it('sets correct rate limit headers', async () => {
    const app = createAuthApp()
    const res = await app.request('/login', {
      method: 'POST',
      headers: { 'CF-Connecting-IP': '192.168.1.1' },
    }, mockEnv)

    expect(res.headers.get('X-RateLimit-Limit')).toBe('10')
    expect(res.headers.get('X-RateLimit-Remaining')).toBe('9')
  })
})
