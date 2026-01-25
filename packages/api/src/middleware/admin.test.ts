/**
 * Admin middleware tests
 *
 * @agent wave5-admin
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Hono } from 'hono'
import { requireAdminMiddleware, getAdminUser, getAdminId, isAdminEmail } from './admin'

// Mock auth lib
vi.mock('../lib/auth', () => ({
  isAdmin: vi.fn((email: string) => email.endsWith('@bundlenudge.com')),
}))

interface AdminUser {
  id: string
  email: string | null
  name: string
  isAdmin: boolean
}

interface TestEnv {
  Variables: {
    user: AdminUser | undefined
    adminId: string | undefined
    adminUser: AdminUser | undefined
  }
}

describe('Admin Middleware', () => {
  let app: Hono<TestEnv>

  beforeEach(() => {
    app = new Hono<TestEnv>()
  })

  describe('requireAdminMiddleware', () => {
    it('returns 401 when user is not authenticated', async () => {
      app.use('*', async (c, next) => {
        c.set('user', undefined)
        await next()
      })
      app.use('*', requireAdminMiddleware)
      app.get('/admin/test', (c) => c.json({ success: true }))

      const res = await app.request('/admin/test')
      expect(res.status).toBe(401)

      const data = (await res.json())
      expect(data.error).toBe('UNAUTHORIZED')
      expect(data.message).toBe('Authentication required')
    })

    it('returns 403 for non-admin email domain', async () => {
      app.use('*', async (c, next) => {
        c.set('user', {
          id: 'user-123',
          email: 'user@gmail.com',
          name: 'Regular User',
          isAdmin: false,
        })
        await next()
      })
      app.use('*', requireAdminMiddleware)
      app.get('/admin/test', (c) => c.json({ success: true }))

      const res = await app.request('/admin/test')
      expect(res.status).toBe(403)

      const data = (await res.json())
      expect(data.error).toBe('FORBIDDEN')
      expect(data.message).toBe('Admin access required')
    })

    it('returns 403 for user without email', async () => {
      app.use('*', async (c, next) => {
        c.set('user', {
          id: 'user-123',
          email: null,
          name: 'No Email User',
          isAdmin: false,
        })
        await next()
      })
      app.use('*', requireAdminMiddleware)
      app.get('/admin/test', (c) => c.json({ success: true }))

      const res = await app.request('/admin/test')
      expect(res.status).toBe(403)
    })

    it('allows admin users through', async () => {
      app.use('*', async (c, next) => {
        c.set('user', {
          id: 'admin-123',
          email: 'admin@bundlenudge.com',
          name: 'Admin User',
          isAdmin: true,
        })
        await next()
      })
      app.use('*', requireAdminMiddleware)
      app.get('/admin/test', (c) => c.json({ success: true }))

      const res = await app.request('/admin/test')
      expect(res.status).toBe(200)
    })

    it('sets adminUser in context', async () => {
      let capturedAdminUser: unknown

      app.use('*', async (c, next) => {
        c.set('user', {
          id: 'admin-123',
          email: 'admin@bundlenudge.com',
          name: 'Admin User',
          isAdmin: true,
        })
        await next()
      })
      app.use('*', requireAdminMiddleware)
      app.get('/admin/test', (c) => {
        capturedAdminUser = c.get('adminUser')
        return c.json({ success: true })
      })

      await app.request('/admin/test')

      expect(capturedAdminUser).toEqual({
        id: 'admin-123',
        email: 'admin@bundlenudge.com',
        name: 'Admin User',
        isAdmin: true,
      })
    })

    it('sets adminId in context for audit logging', async () => {
      let capturedAdminId: unknown

      app.use('*', async (c, next) => {
        c.set('user', {
          id: 'admin-123',
          email: 'admin@bundlenudge.com',
          name: 'Admin User',
          isAdmin: true,
        })
        await next()
      })
      app.use('*', requireAdminMiddleware)
      app.get('/admin/test', (c) => {
        capturedAdminId = c.get('adminId')
        return c.json({ success: true })
      })

      await app.request('/admin/test')

      expect(capturedAdminId).toBe('admin-123')
    })
  })

  describe('getAdminUser', () => {
    it('returns admin user from context', () => {
      const mockContext = {
        get: vi.fn().mockReturnValue({
          id: 'admin-123',
          email: 'admin@bundlenudge.com',
          name: 'Admin',
          isAdmin: true,
        }),
      }

      const result = getAdminUser(mockContext)

      expect(result.id).toBe('admin-123')
      expect(result.email).toBe('admin@bundlenudge.com')
    })

    it('throws if admin middleware not applied', () => {
      const mockContext = {
        get: vi.fn().mockReturnValue(undefined),
      }

      expect(() => getAdminUser(mockContext)).toThrow('Admin middleware not applied')
    })
  })

  describe('getAdminId', () => {
    it('returns admin ID from context', () => {
      const mockContext = {
        get: vi.fn().mockReturnValue('admin-123'),
      }

      const result = getAdminId(mockContext)
      expect(result).toBe('admin-123')
    })

    it('throws if admin middleware not applied', () => {
      const mockContext = {
        get: vi.fn().mockReturnValue(undefined),
      }

      expect(() => getAdminId(mockContext)).toThrow('Admin middleware not applied')
    })
  })

  describe('isAdminEmail', () => {
    it('returns true for bundlenudge.com emails', () => {
      expect(isAdminEmail('admin@bundlenudge.com')).toBe(true)
      expect(isAdminEmail('test@bundlenudge.com')).toBe(true)
      expect(isAdminEmail('support@bundlenudge.com')).toBe(true)
    })

    it('returns false for non-admin emails', () => {
      expect(isAdminEmail('user@gmail.com')).toBe(false)
      expect(isAdminEmail('admin@otherdomain.com')).toBe(false)
      expect(isAdminEmail('fake@bundlenudge.com.evil.com')).toBe(false)
    })
  })
})
