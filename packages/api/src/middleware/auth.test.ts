import { describe, it, expect, vi } from 'vitest'
import { Hono } from 'hono'
import { authMiddleware, requireAdmin, type AuthUser } from './auth'
import type { Env } from '../types/env'

// Mock the auth module
vi.mock('../lib/auth', () => ({
  createAuth: () => ({
    api: {
      getSession: vi.fn(),
    },
  }),
  isAdmin: (email: string | null | undefined) => email?.endsWith('@bundlenudge.com') ?? false,
}))

interface AuthVariables {
  user: AuthUser
}

const mockEnv = {} as Env

describe('authMiddleware', () => {
  it('returns 401 when no session exists', async () => {
    const { createAuth } = await import('../lib/auth')
    const mockAuth = createAuth(mockEnv)
    vi.mocked(mockAuth.api.getSession).mockResolvedValue(null)

    const app = new Hono<{ Bindings: Env }>()
    app.use('*', authMiddleware)
    app.get('/test', (c) => c.json({ success: true }))

    const res = await app.request('/test', {}, mockEnv)
    expect(res.status).toBe(401)

    const body: { error: string } = await res.json()
    expect(body.error).toBe('UNAUTHORIZED')
  })
})

describe('requireAdmin', () => {
  it('returns 401 when no user is set', async () => {
    const app = new Hono<{ Bindings: Env }>()
    app.use('*', requireAdmin)
    app.get('/admin', (c) => c.json({ admin: true }))

    const res = await app.request('/admin', {}, mockEnv)
    expect(res.status).toBe(401)
  })

  it('returns 403 when user is not admin', async () => {
    const app = new Hono<{ Bindings: Env; Variables: AuthVariables }>()
    app.use('*', async (c, next) => {
      c.set('user', {
        id: 'user-1',
        email: 'user@example.com',
        name: 'Test User',
        isAdmin: false,
      })
      await next()
    })
    app.use('*', requireAdmin)
    app.get('/admin', (c) => c.json({ admin: true }))

    const res = await app.request('/admin', {}, mockEnv)
    expect(res.status).toBe(403)

    const body: { error: string } = await res.json()
    expect(body.error).toBe('FORBIDDEN')
  })

  it('allows admin users through', async () => {
    const app = new Hono<{ Bindings: Env; Variables: AuthVariables }>()
    app.use('*', async (c, next) => {
      c.set('user', {
        id: 'admin-1',
        email: 'admin@bundlenudge.com',
        name: 'Admin User',
        isAdmin: true,
      })
      await next()
    })
    app.use('*', requireAdmin)
    app.get('/admin', (c) => c.json({ admin: true }))

    const res = await app.request('/admin', {}, mockEnv)
    expect(res.status).toBe(200)
  })
})
