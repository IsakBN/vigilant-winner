/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call */
/**
 * Admin user management route tests
 *
 * @agent wave5-admin
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Hono } from 'hono'
import { adminUsersRouter } from './users'

// Mock audit logging
vi.mock('../../lib/admin/audit', () => ({
  logAdminAction: vi.fn().mockResolvedValue('audit-id'),
}))

// Mock admin middleware helper
vi.mock('../../middleware/admin', () => ({
  getAdminId: vi.fn().mockReturnValue('admin-123'),
}))

describe('Admin User Management Routes', () => {
  let app: Hono
  let mockDb: { prepare: ReturnType<typeof vi.fn> }
  let mockStatement: {
    bind: ReturnType<typeof vi.fn>
    run: ReturnType<typeof vi.fn>
    first: ReturnType<typeof vi.fn>
    all: ReturnType<typeof vi.fn>
  }

  beforeEach(() => {
    mockStatement = {
      bind: vi.fn().mockReturnThis(),
      run: vi.fn().mockResolvedValue({ success: true }),
      first: vi.fn(),
      all: vi.fn().mockResolvedValue({ results: [] }),
    }
    mockDb = { prepare: vi.fn().mockReturnValue(mockStatement) }

    app = new Hono()
    app.use('*', async (c, next) => {
      c.env = { DB: mockDb } as unknown
      await next()
    })
    app.route('/admin/users', adminUsersRouter)
  })

  describe('GET /admin/users', () => {
    it('returns paginated user list', async () => {
      mockStatement.first.mockResolvedValue({ total: 100 })
      mockStatement.all.mockResolvedValue({
        results: [
          {
            id: 'user-1',
            email: 'user1@test.com',
            name: 'User One',
            created_at: 1706200000000,
            plan_name: 'pro',
            subscription_status: 'active',
            app_count: 3,
            is_suspended: null,
          },
        ],
      })

      const res = await app.request('/admin/users?limit=20&offset=0')

      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.users).toHaveLength(1)
      expect(data.users[0]?.email).toBe('user1@test.com')
      expect(data.pagination.total).toBe(100)
    })

    it('filters by search query', async () => {
      mockStatement.first.mockResolvedValue({ total: 1 })
      mockStatement.all.mockResolvedValue({
        results: [{ id: 'user-1', email: 'john@test.com', name: 'John', created_at: 1706200000000 }],
      })

      const res = await app.request('/admin/users?search=john')

      expect(res.status).toBe(200)
      const prepareCall = mockDb.prepare.mock.calls[0]?.[0] as string | undefined
      expect(prepareCall).toContain('LIKE')
    })

    it('filters by plan', async () => {
      mockStatement.first.mockResolvedValue({ total: 5 })
      mockStatement.all.mockResolvedValue({ results: [] })

      const res = await app.request('/admin/users?plan=pro')

      expect(res.status).toBe(200)
    })

    it('filters by suspended status', async () => {
      mockStatement.first.mockResolvedValue({ total: 2 })
      mockStatement.all.mockResolvedValue({
        results: [
          { id: 'user-1', is_suspended: 1 },
          { id: 'user-2', is_suspended: null },
        ],
      })

      const res = await app.request('/admin/users?status=suspended')

      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.users.every((u) => u.isSuspended)).toBe(true)
    })
  })

  describe('GET /admin/users/:userId', () => {
    it('returns user details', async () => {
      mockStatement.first
        .mockResolvedValueOnce({
          id: 'user-1',
          email: 'user@test.com',
          name: 'Test User',
          created_at: 1706200000000,
          subscription_id: 'sub-1',
          subscription_status: 'active',
          plan_name: 'pro',
          plan_display: 'Pro',
          plan_mau_limit: 50000,
          plan_storage_gb: 10,
        })
        .mockResolvedValueOnce(null) // overrides
        .mockResolvedValueOnce(null) // suspension
      mockStatement.all.mockResolvedValue({ results: [] })

      const res = await app.request('/admin/users/550e8400-e29b-41d4-a716-446655440000')

      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.user.email).toBe('user@test.com')
      expect(data.subscription.plan.name).toBe('pro')
    })

    it('returns 404 for non-existent user', async () => {
      mockStatement.first.mockResolvedValue(null)

      const res = await app.request('/admin/users/550e8400-e29b-41d4-a716-446655440000')

      expect(res.status).toBe(404)
    })

    it('validates UUID format', async () => {
      const res = await app.request('/admin/users/invalid-id')

      expect(res.status).toBe(400)
    })
  })

  describe('POST /admin/users/:userId/override-limits', () => {
    it('sets limit overrides', async () => {
      mockStatement.first.mockResolvedValue({ id: 'user-1' })

      const res = await app.request('/admin/users/550e8400-e29b-41d4-a716-446655440000/override-limits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mauLimit: 100000,
          storageGb: 50,
          reason: 'Enterprise customer trial',
        }),
      })

      expect(res.status).toBe(200)
      const data = (await res.json())
      expect(data.success).toBe(true)
    })

    it('returns 404 for non-existent user', async () => {
      mockStatement.first.mockResolvedValue(null)

      const res = await app.request('/admin/users/550e8400-e29b-41d4-a716-446655440000/override-limits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mauLimit: 100000, reason: 'Test reason' }),
      })

      expect(res.status).toBe(404)
    })

    it('requires reason', async () => {
      const res = await app.request('/admin/users/550e8400-e29b-41d4-a716-446655440000/override-limits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mauLimit: 100000 }),
      })

      expect(res.status).toBe(400)
    })
  })

  describe('DELETE /admin/users/:userId/override-limits', () => {
    it('removes limit overrides', async () => {
      const res = await app.request('/admin/users/550e8400-e29b-41d4-a716-446655440000/override-limits', {
        method: 'DELETE',
      })

      expect(res.status).toBe(200)
      expect(mockStatement.run).toHaveBeenCalled()
    })
  })

  describe('POST /admin/users/:userId/suspend', () => {
    it('suspends user', async () => {
      mockStatement.first.mockResolvedValue({ id: 'user-1', email: 'user@test.com' })

      const res = await app.request('/admin/users/550e8400-e29b-41d4-a716-446655440000/suspend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Terms of service violation' }),
      })

      expect(res.status).toBe(200)
      const data = (await res.json())
      expect(data.message).toContain('suspended indefinitely')
    })

    it('suspends user with expiry', async () => {
      mockStatement.first.mockResolvedValue({ id: 'user-1', email: 'user@test.com' })
      const until = Date.now() + 86400000

      const res = await app.request('/admin/users/550e8400-e29b-41d4-a716-446655440000/suspend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Temporary violation', until }),
      })

      expect(res.status).toBe(200)
      const data = (await res.json())
      expect(data.message).toContain('suspended until')
    })

    it('returns 404 for non-existent user', async () => {
      mockStatement.first.mockResolvedValue(null)

      const res = await app.request('/admin/users/550e8400-e29b-41d4-a716-446655440000/suspend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Test suspension' }),
      })

      expect(res.status).toBe(404)
    })

    it('requires reason with minimum length', async () => {
      const res = await app.request('/admin/users/550e8400-e29b-41d4-a716-446655440000/suspend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'short' }),
      })

      expect(res.status).toBe(400)
    })
  })

  describe('DELETE /admin/users/:userId/suspend', () => {
    it('unsuspends user', async () => {
      const res = await app.request('/admin/users/550e8400-e29b-41d4-a716-446655440000/suspend', {
        method: 'DELETE',
      })

      expect(res.status).toBe(200)
      const data = (await res.json())
      expect(data.message).toBe('User unsuspended')
    })
  })
})
