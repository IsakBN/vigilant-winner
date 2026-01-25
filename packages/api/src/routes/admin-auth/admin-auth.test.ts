/**
 * Admin authentication route tests
 *
 * Tests for login, logout, me, and OTP routes
 *
 * @agent admin-auth-routes
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Hono } from 'hono'
import { adminAuthRouter } from './index'

// Mock email sending
vi.mock('../../lib/email', () => ({
  sendOTPEmail: vi.fn().mockResolvedValue(undefined),
}))

// Mock audit logging
vi.mock('../../lib/admin/audit', () => ({
  logAdminAction: vi.fn().mockResolvedValue('audit-id'),
}))

// =============================================================================
// Test Setup
// =============================================================================

describe('Admin Auth Routes', () => {
  let app: Hono
  let mockDb: { prepare: ReturnType<typeof vi.fn> }
  let mockStatement: {
    bind: ReturnType<typeof vi.fn>
    run: ReturnType<typeof vi.fn>
    first: ReturnType<typeof vi.fn>
  }

  beforeEach(() => {
    mockStatement = {
      bind: vi.fn().mockReturnThis(),
      run: vi.fn().mockResolvedValue({ success: true }),
      first: vi.fn().mockResolvedValue(null),
    }
    mockDb = {
      prepare: vi.fn().mockReturnValue(mockStatement),
    }

    app = new Hono()

    // Middleware MUST come before route mount
    app.use('*', async (c, next) => {
      c.env = { DB: mockDb } as unknown
      await next()
    })

    app.route('/admin-auth', adminAuthRouter)
  })

  // ===========================================================================
  // Login Tests
  // ===========================================================================

  describe('POST /admin-auth/login', () => {
    it('returns 401 for non-bundlenudge.com email', async () => {
      const res = await app.request('/admin-auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'user@gmail.com',
          password: 'password123',
        }),
      })

      expect(res.status).toBe(401)
      const data = (await res.json()) as { error: string }
      expect(data.error).toBe('UNAUTHORIZED')
    })

    it('returns 401 when admin not found', async () => {
      mockStatement.first.mockResolvedValue(null)

      const res = await app.request('/admin-auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@bundlenudge.com',
          password: 'password123',
        }),
      })

      expect(res.status).toBe(401)
    })

    it('returns 401 for invalid password', async () => {
      // Mock admin with a known password hash
      mockStatement.first.mockResolvedValue({
        id: 'admin-1',
        email: 'admin@bundlenudge.com',
        name: 'Admin User',
        password_hash: 'invalidsalt$invalidhash',
        role: 'admin',
        permissions: null,
        last_login_at: null,
        created_at: Date.now(),
        updated_at: Date.now(),
      })

      const res = await app.request('/admin-auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@bundlenudge.com',
          password: 'wrongpassword',
        }),
      })

      expect(res.status).toBe(401)
    })

    it('returns 400 for password too short', async () => {
      const res = await app.request('/admin-auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@bundlenudge.com',
          password: 'short',
        }),
      })

      expect(res.status).toBe(400)
    })

    it('returns 400 for invalid email format', async () => {
      const res = await app.request('/admin-auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'not-an-email',
          password: 'password123',
        }),
      })

      expect(res.status).toBe(400)
    })
  })

  // ===========================================================================
  // Logout Tests
  // ===========================================================================

  describe('POST /admin-auth/logout', () => {
    it('returns success without auth header', async () => {
      const res = await app.request('/admin-auth/logout', {
        method: 'POST',
      })

      expect(res.status).toBe(200)
      const data = (await res.json()) as { success: boolean }
      expect(data.success).toBe(true)
    })

    it('returns success and deletes session with valid token', async () => {
      const res = await app.request('/admin-auth/logout', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer valid-session-token',
        },
      })

      expect(res.status).toBe(200)
      const data = (await res.json()) as { success: boolean }
      expect(data.success).toBe(true)
      expect(mockDb.prepare).toHaveBeenCalled()
    })

    it('returns success even with invalid Bearer format', async () => {
      const res = await app.request('/admin-auth/logout', {
        method: 'POST',
        headers: {
          Authorization: 'Basic invalid-format',
        },
      })

      expect(res.status).toBe(200)
    })
  })

  // ===========================================================================
  // Me Tests
  // ===========================================================================

  describe('GET /admin-auth/me', () => {
    it('returns 401 without auth header', async () => {
      const res = await app.request('/admin-auth/me', {
        method: 'GET',
      })

      expect(res.status).toBe(401)
      const data = (await res.json()) as { error: string }
      expect(data.error).toBe('UNAUTHORIZED')
    })

    it('returns 401 with invalid Bearer format', async () => {
      const res = await app.request('/admin-auth/me', {
        method: 'GET',
        headers: {
          Authorization: 'Basic invalid-format',
        },
      })

      expect(res.status).toBe(401)
    })

    it('returns 401 when session not found', async () => {
      mockStatement.first.mockResolvedValue(null)

      const res = await app.request('/admin-auth/me', {
        method: 'GET',
        headers: {
          Authorization: 'Bearer invalid-token',
        },
      })

      expect(res.status).toBe(401)
      const data = (await res.json()) as { message: string }
      expect(data.message).toBe('Invalid session')
    })

    it('returns 401 when session expired', async () => {
      mockStatement.first
        .mockResolvedValueOnce({
          id: 'session-1',
          admin_id: 'admin-1',
          token_hash: 'somehash',
          expires_at: Date.now() - 1000, // Expired
          created_at: Date.now() - 100000,
        })

      const res = await app.request('/admin-auth/me', {
        method: 'GET',
        headers: {
          Authorization: 'Bearer expired-token',
        },
      })

      expect(res.status).toBe(401)
      const data = (await res.json()) as { error: string }
      expect(data.error).toBe('SESSION_EXPIRED')
    })

    it('returns 401 when admin not found', async () => {
      mockStatement.first
        .mockResolvedValueOnce({
          id: 'session-1',
          admin_id: 'admin-1',
          token_hash: 'somehash',
          expires_at: Date.now() + 100000,
          created_at: Date.now(),
        })
        .mockResolvedValueOnce(null) // Admin not found

      const res = await app.request('/admin-auth/me', {
        method: 'GET',
        headers: {
          Authorization: 'Bearer valid-token',
        },
      })

      expect(res.status).toBe(401)
      const data = (await res.json()) as { message: string }
      expect(data.message).toBe('Admin not found')
    })

    it('returns admin info with valid session', async () => {
      const now = Date.now()
      mockStatement.first
        .mockResolvedValueOnce({
          id: 'session-1',
          admin_id: 'admin-1',
          token_hash: 'somehash',
          expires_at: now + 100000,
          created_at: now,
        })
        .mockResolvedValueOnce({
          id: 'admin-1',
          email: 'admin@bundlenudge.com',
          name: 'Admin User',
          role: 'admin',
          permissions: '["users.read","apps.read"]',
          last_login_at: now - 1000,
          created_at: now - 100000,
          updated_at: now,
        })

      const res = await app.request('/admin-auth/me', {
        method: 'GET',
        headers: {
          Authorization: 'Bearer valid-token',
        },
      })

      expect(res.status).toBe(200)
      const data = (await res.json()) as {
        admin: {
          id: string
          email: string
          name: string
          role: string
          permissions: string[]
        }
      }
      expect(data.admin.id).toBe('admin-1')
      expect(data.admin.email).toBe('admin@bundlenudge.com')
      expect(data.admin.name).toBe('Admin User')
      expect(data.admin.role).toBe('admin')
      expect(data.admin.permissions).toEqual(['users.read', 'apps.read'])
    })

    it('returns empty permissions array when null', async () => {
      const now = Date.now()
      mockStatement.first
        .mockResolvedValueOnce({
          id: 'session-1',
          admin_id: 'admin-1',
          token_hash: 'somehash',
          expires_at: now + 100000,
          created_at: now,
        })
        .mockResolvedValueOnce({
          id: 'admin-1',
          email: 'admin@bundlenudge.com',
          name: 'Admin User',
          role: 'support',
          permissions: null,
          last_login_at: null,
          created_at: now - 100000,
          updated_at: now,
        })

      const res = await app.request('/admin-auth/me', {
        method: 'GET',
        headers: {
          Authorization: 'Bearer valid-token',
        },
      })

      expect(res.status).toBe(200)
      const data = (await res.json()) as {
        admin: { permissions: string[] }
      }
      expect(data.admin.permissions).toEqual([])
    })
  })

  // ===========================================================================
  // OTP Tests (existing)
  // ===========================================================================

  describe('POST /admin-auth/send-otp', () => {
    it('sends OTP to valid bundlenudge.com email', async () => {
      const res = await app.request('/admin-auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@bundlenudge.com' }),
      })

      expect(res.status).toBe(200)
      const data = (await res.json()) as { success: boolean; message: string }
      expect(data.success).toBe(true)
      expect(data.message).toBe('OTP sent to your email')
    })

    it('rejects non-bundlenudge.com email', async () => {
      const res = await app.request('/admin-auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'user@gmail.com' }),
      })

      expect(res.status).toBe(400)
    })

    it('rejects invalid email format', async () => {
      const res = await app.request('/admin-auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'not-an-email' }),
      })

      expect(res.status).toBe(400)
    })

    it('rate limits after 3 sends in 15 minutes', async () => {
      mockStatement.first.mockResolvedValue({
        email: 'admin@bundlenudge.com',
        send_count: 3,
        last_attempt_at: Date.now() - 1000,
        locked_until: null,
      })

      const res = await app.request('/admin-auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@bundlenudge.com' }),
      })

      expect(res.status).toBe(429)
      const data = (await res.json()) as { error: string }
      expect(data.error).toBe('RATE_LIMITED')
    })

    it('returns 429 when account is locked', async () => {
      mockStatement.first.mockResolvedValue({
        email: 'admin@bundlenudge.com',
        locked_until: Date.now() + 1000000,
      })

      const res = await app.request('/admin-auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@bundlenudge.com' }),
      })

      expect(res.status).toBe(429)
      const data = (await res.json()) as { message: string }
      expect(data.message).toContain('Account locked')
    })

    it('resets send count after window expires', async () => {
      mockStatement.first.mockResolvedValue({
        email: 'admin@bundlenudge.com',
        send_count: 3,
        last_attempt_at: Date.now() - 20 * 60 * 1000,
        locked_until: null,
      })

      const res = await app.request('/admin-auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@bundlenudge.com' }),
      })

      expect(res.status).toBe(200)
    })
  })

  describe('POST /admin-auth/verify-otp', () => {
    it('rejects non-bundlenudge.com email', async () => {
      const res = await app.request('/admin-auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'user@gmail.com', otp: '123456' }),
      })

      expect(res.status).toBe(403)
    })

    it('rejects when no OTP request exists', async () => {
      mockStatement.first.mockResolvedValue(null)

      const res = await app.request('/admin-auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@bundlenudge.com', otp: '123456' }),
      })

      expect(res.status).toBe(400)
      const data = (await res.json()) as { message: string }
      expect(data.message).toContain('No OTP request found')
    })

    it('rejects expired OTP', async () => {
      mockStatement.first.mockResolvedValue({
        email: 'admin@bundlenudge.com',
        otp_hash: 'somehash',
        otp_expires_at: Date.now() - 1000,
        verify_attempts: 0,
        failed_attempts: 0,
        locked_until: null,
      })

      const res = await app.request('/admin-auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@bundlenudge.com', otp: '123456' }),
      })

      expect(res.status).toBe(400)
      const data = (await res.json()) as { message: string }
      expect(data.message).toContain('expired')
    })

    it('rejects after 5 verify attempts', async () => {
      mockStatement.first.mockResolvedValue({
        email: 'admin@bundlenudge.com',
        otp_hash: 'somehash',
        otp_expires_at: Date.now() + 100000,
        verify_attempts: 5,
        failed_attempts: 5,
        locked_until: null,
      })

      const res = await app.request('/admin-auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@bundlenudge.com', otp: '123456' }),
      })

      expect(res.status).toBe(429)
      const data = (await res.json()) as { message: string }
      expect(data.message).toContain('Too many verification attempts')
    })

    it('returns 429 when account is locked', async () => {
      mockStatement.first.mockResolvedValue({
        email: 'admin@bundlenudge.com',
        locked_until: Date.now() + 1000000,
      })

      const res = await app.request('/admin-auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@bundlenudge.com', otp: '123456' }),
      })

      expect(res.status).toBe(429)
    })

    it('increments failed attempts on invalid OTP', async () => {
      mockStatement.first.mockResolvedValue({
        email: 'admin@bundlenudge.com',
        otp_hash: 'different-hash',
        otp_expires_at: Date.now() + 100000,
        verify_attempts: 0,
        failed_attempts: 0,
        locked_until: null,
      })

      const res = await app.request('/admin-auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@bundlenudge.com', otp: '123456' }),
      })

      expect(res.status).toBe(400)
      const data = (await res.json()) as { attemptsRemaining: number }
      expect(data.attemptsRemaining).toBe(4)
    })

    it('locks account after 10 failed attempts', async () => {
      mockStatement.first.mockResolvedValue({
        email: 'admin@bundlenudge.com',
        otp_hash: 'different-hash',
        otp_expires_at: Date.now() + 100000,
        verify_attempts: 0,
        failed_attempts: 9,
        locked_until: null,
      })

      const res = await app.request('/admin-auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@bundlenudge.com', otp: '123456' }),
      })

      expect(res.status).toBe(429)
      const data = (await res.json()) as { message: string }
      expect(data.message).toContain('Account locked')
    })

    it('rejects OTP with wrong length', async () => {
      const res = await app.request('/admin-auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@bundlenudge.com', otp: '12345' }),
      })

      expect(res.status).toBe(400)
    })
  })
})
