/**
 * Admin authentication route tests
 *
 * @agent wave5-admin
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

describe('Admin Auth Routes', () => {
  let app: Hono
  let mockDb: {
    prepare: ReturnType<typeof vi.fn>
  }
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

  describe('POST /admin-auth/send-otp', () => {
    it('sends OTP to valid bundlenudge.com email', async () => {
      const res = await app.request('/admin-auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@bundlenudge.com' }),
      })

      expect(res.status).toBe(200)
      const data = (await res.json())
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
        last_attempt_at: Date.now() - 1000, // Recent attempt
        locked_until: null,
      })

      const res = await app.request('/admin-auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@bundlenudge.com' }),
      })

      expect(res.status).toBe(429)
      const data = (await res.json())
      expect(data.error).toBe('RATE_LIMITED')
    })

    it('returns 429 when account is locked', async () => {
      mockStatement.first.mockResolvedValue({
        email: 'admin@bundlenudge.com',
        locked_until: Date.now() + 1000000, // Locked in future
      })

      const res = await app.request('/admin-auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@bundlenudge.com' }),
      })

      expect(res.status).toBe(429)
      const data = (await res.json())
      expect(data.message).toContain('Account locked')
    })

    it('resets send count after window expires', async () => {
      mockStatement.first.mockResolvedValue({
        email: 'admin@bundlenudge.com',
        send_count: 3,
        last_attempt_at: Date.now() - (20 * 60 * 1000), // 20 mins ago
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
      const data = (await res.json())
      expect(data.message).toContain('No OTP request found')
    })

    it('rejects expired OTP', async () => {
      mockStatement.first.mockResolvedValue({
        email: 'admin@bundlenudge.com',
        otp_hash: 'somehash',
        otp_expires_at: Date.now() - 1000, // Expired
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
      const data = (await res.json())
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
      const data = (await res.json())
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
      const data = (await res.json())
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
      const data = (await res.json())
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
