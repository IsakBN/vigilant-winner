/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */
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
    it('returns paginated user list with stats', async () => {
      mockStatement.first.mockResolvedValue({ total: 100 })
      mockStatement.all.mockResolvedValue({
        results: [
          {
            id: 'user-1',
            email: 'user1@test.com',
            name: 'User One',
            created_at: 1706200000000,
            updated_at: 1706300000000,
            deleted_at: null,
            plan_name: 'pro',
            plan_id: 'plan-1',
            subscription_status: 'active',
            subscription_expires_at: null,
            app_count: 3,
            device_count: 150,
            ban_reason: null,
          },
        ],
      })

      const res = await app.request('/admin/users?limit=20&offset=0')

      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.users).toHaveLength(1)
      expect(data.users[0]?.email).toBe('user1@test.com')
      expect(data.users[0]?.status).toBe('active')
      expect(data.users[0]?.stats.appCount).toBe(3)
      expect(data.users[0]?.stats.deviceCount).toBe(150)
      expect(data.pagination.total).toBe(100)
    })

    it('filters by search query', async () => {
      mockStatement.first.mockResolvedValue({ total: 1 })
      mockStatement.all.mockResolvedValue({
        results: [{
          id: 'user-1',
          email: 'john@test.com',
          name: 'John',
          created_at: 1706200000000,
          updated_at: null,
          deleted_at: null,
          plan_name: null,
          plan_id: null,
          subscription_status: null,
          subscription_expires_at: null,
          app_count: 0,
          device_count: 0,
          ban_reason: null,
        }],
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
      const prepareCall = mockDb.prepare.mock.calls[0]?.[0] as string | undefined
      expect(prepareCall).toContain('sp.name = ?')
    })

    it('filters by banned status', async () => {
      mockStatement.first.mockResolvedValue({ total: 2 })
      mockStatement.all.mockResolvedValue({
        results: [
          { id: 'user-1', ban_reason: 'TOS violation', deleted_at: null },
          { id: 'user-2', ban_reason: null, deleted_at: null },
        ],
      })

      const res = await app.request('/admin/users?status=banned')

      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.users.every((u) => u.status === 'banned')).toBe(true)
    })

    it('filters by deleted status', async () => {
      mockStatement.first.mockResolvedValue({ total: 1 })
      mockStatement.all.mockResolvedValue({
        results: [{
          id: 'user-1',
          deleted_at: 1706200000000,
          ban_reason: null,
        }],
      })

      const res = await app.request('/admin/users?status=deleted')

      expect(res.status).toBe(200)
      const prepareCall = mockDb.prepare.mock.calls[0]?.[0] as string | undefined
      expect(prepareCall).toContain('deleted_at IS NOT NULL')
    })

    it('sorts by email ascending', async () => {
      mockStatement.first.mockResolvedValue({ total: 2 })
      mockStatement.all.mockResolvedValue({ results: [] })

      const res = await app.request('/admin/users?sortBy=email&sortOrder=asc')

      expect(res.status).toBe(200)
      const prepareCall = mockDb.prepare.mock.calls[1]?.[0] as string | undefined
      expect(prepareCall).toContain('ORDER BY u.email ASC')
    })

    it('sorts by lastLoginAt descending', async () => {
      mockStatement.first.mockResolvedValue({ total: 2 })
      mockStatement.all.mockResolvedValue({ results: [] })

      const res = await app.request('/admin/users?sortBy=lastLoginAt&sortOrder=desc')

      expect(res.status).toBe(200)
      const prepareCall = mockDb.prepare.mock.calls[1]?.[0] as string | undefined
      expect(prepareCall).toContain('ORDER BY u.updated_at DESC')
    })
  })

  describe('GET /admin/users/:userId', () => {
    it('returns user details with stats', async () => {
      mockStatement.first
        .mockResolvedValueOnce({
          id: 'user-1',
          email: 'user@test.com',
          name: 'Test User',
          created_at: 1706200000000,
          updated_at: 1706300000000,
          deleted_at: null,
          subscription_id: 'sub-1',
          subscription_status: 'active',
          subscription_expires_at: null,
          plan_id: 'plan-1',
          plan_name: 'pro',
          plan_display: 'Pro',
        })
        .mockResolvedValueOnce({ cnt: 5 }) // app count
        .mockResolvedValueOnce({ cnt: 100 }) // device count
        .mockResolvedValueOnce({ cnt: 25 }) // release count
        .mockResolvedValueOnce(null) // ban record

      const res = await app.request('/admin/users/550e8400-e29b-41d4-a716-446655440000')

      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.email).toBe('user@test.com')
      expect(data.status).toBe('active')
      expect(data.stats.appCount).toBe(5)
      expect(data.stats.deviceCount).toBe(100)
      expect(data.stats.totalReleases).toBe(25)
      expect(data.subscription.planName).toBe('pro')
    })

    it('returns banned status with ban info', async () => {
      mockStatement.first
        .mockResolvedValueOnce({
          id: 'user-1',
          email: 'banned@test.com',
          name: 'Banned User',
          created_at: 1706200000000,
          updated_at: null,
          deleted_at: null,
          subscription_id: null,
          subscription_status: null,
        })
        .mockResolvedValueOnce({ cnt: 0 })
        .mockResolvedValueOnce({ cnt: 0 })
        .mockResolvedValueOnce({ cnt: 0 })
        .mockResolvedValueOnce({
          reason: 'Terms of service violation',
          until: null,
          suspended_by: 'admin-456',
          created_at: 1706250000000,
        })

      const res = await app.request('/admin/users/550e8400-e29b-41d4-a716-446655440000')

      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.status).toBe('banned')
      expect(data.banInfo.reason).toBe('Terms of service violation')
      expect(data.banInfo.bannedBy).toBe('admin-456')
    })

    it('returns deleted status', async () => {
      mockStatement.first
        .mockResolvedValueOnce({
          id: 'user-1',
          email: 'deleted@test.com',
          deleted_at: 1706200000000,
        })
        .mockResolvedValueOnce({ cnt: 0 })
        .mockResolvedValueOnce({ cnt: 0 })
        .mockResolvedValueOnce({ cnt: 0 })
        .mockResolvedValueOnce(null)

      const res = await app.request('/admin/users/550e8400-e29b-41d4-a716-446655440000')

      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.status).toBe('deleted')
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

  describe('PATCH /admin/users/:userId', () => {
    it('bans user with reason', async () => {
      mockStatement.first.mockResolvedValue({
        id: 'user-1',
        email: 'user@test.com',
        deleted_at: null,
      })

      const res = await app.request('/admin/users/550e8400-e29b-41d4-a716-446655440000', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'banned',
          banReason: 'Violated terms of service repeatedly',
        }),
      })

      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.success).toBe(true)
      expect(data.message).toContain('banned')
    })

    it('requires banReason when banning', async () => {
      mockStatement.first.mockResolvedValue({
        id: 'user-1',
        email: 'user@test.com',
        deleted_at: null,
      })

      const res = await app.request('/admin/users/550e8400-e29b-41d4-a716-446655440000', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'banned' }),
      })

      expect(res.status).toBe(400)
      const data = await res.json()
      expect(data.message).toContain('Ban reason required')
    })

    it('unbans user', async () => {
      mockStatement.first.mockResolvedValue({
        id: 'user-1',
        email: 'user@test.com',
        deleted_at: null,
      })

      const res = await app.request('/admin/users/550e8400-e29b-41d4-a716-446655440000', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'active' }),
      })

      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.message).toContain('unbanned')
    })

    it('updates user subscription plan', async () => {
      mockStatement.first
        .mockResolvedValueOnce({
          id: 'user-1',
          email: 'user@test.com',
          deleted_at: null,
        })
        .mockResolvedValueOnce({
          id: 'plan-enterprise',
          name: 'enterprise',
        })

      const res = await app.request('/admin/users/550e8400-e29b-41d4-a716-446655440000', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription: {
            planId: '550e8400-e29b-41d4-a716-446655440001',
            expiresAt: null,
          },
        }),
      })

      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.message).toContain('Subscription updated')
    })

    it('rejects non-existent plan', async () => {
      mockStatement.first
        .mockResolvedValueOnce({
          id: 'user-1',
          email: 'user@test.com',
          deleted_at: null,
        })
        .mockResolvedValueOnce(null) // plan not found

      const res = await app.request('/admin/users/550e8400-e29b-41d4-a716-446655440000', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription: {
            planId: '550e8400-e29b-41d4-a716-000000000000',
          },
        }),
      })

      expect(res.status).toBe(404)
      const data = await res.json()
      expect(data.message).toContain('Plan not found')
    })

    it('prevents self-modification', async () => {
      // Admin ID is 'admin-123' from mock
      const { getAdminId } = await import('../../middleware/admin')
      vi.mocked(getAdminId).mockReturnValue('550e8400-e29b-41d4-a716-446655440000')

      const res = await app.request('/admin/users/550e8400-e29b-41d4-a716-446655440000', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'banned', banReason: 'Self-ban test' }),
      })

      expect(res.status).toBe(400)
      const data = await res.json()
      expect(data.message).toContain('Cannot modify yourself')

      // Reset mock
      vi.mocked(getAdminId).mockReturnValue('admin-123')
    })

    it('rejects modification of deleted user', async () => {
      mockStatement.first.mockResolvedValue({
        id: 'user-1',
        email: 'deleted@test.com',
        deleted_at: 1706200000000,
      })

      const res = await app.request('/admin/users/550e8400-e29b-41d4-a716-446655440000', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'active' }),
      })

      expect(res.status).toBe(400)
      const data = await res.json()
      expect(data.message).toContain('Cannot modify deleted user')
    })

    it('returns 404 for non-existent user', async () => {
      mockStatement.first.mockResolvedValue(null)

      const res = await app.request('/admin/users/550e8400-e29b-41d4-a716-446655440000', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'active' }),
      })

      expect(res.status).toBe(404)
    })

    it('rejects empty update', async () => {
      mockStatement.first.mockResolvedValue({
        id: 'user-1',
        email: 'user@test.com',
        deleted_at: null,
      })

      const res = await app.request('/admin/users/550e8400-e29b-41d4-a716-446655440000', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })

      expect(res.status).toBe(400)
      const data = await res.json()
      expect(data.message).toContain('No changes provided')
    })
  })

  describe('DELETE /admin/users/:userId', () => {
    it('soft deletes user', async () => {
      mockStatement.first
        .mockResolvedValueOnce({
          id: 'user-1',
          email: 'user@test.com',
          deleted_at: null,
        })
        .mockResolvedValueOnce({ cnt: 3 }) // app count

      const res = await app.request('/admin/users/550e8400-e29b-41d4-a716-446655440000', {
        method: 'DELETE',
      })

      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.success).toBe(true)
      expect(data.message).toContain('deactivated')
      expect(mockStatement.run).toHaveBeenCalled()
    })

    it('also soft deletes user apps', async () => {
      mockStatement.first
        .mockResolvedValueOnce({
          id: 'user-1',
          email: 'user@test.com',
          deleted_at: null,
        })
        .mockResolvedValueOnce({ cnt: 5 })

      await app.request('/admin/users/550e8400-e29b-41d4-a716-446655440000', {
        method: 'DELETE',
      })

      // Verify apps update was called
      const appUpdateCall = mockDb.prepare.mock.calls.find(
        call => (call[0] as string).includes('UPDATE apps SET deleted_at')
      )
      expect(appUpdateCall).toBeDefined()
    })

    it('prevents self-deletion', async () => {
      const { getAdminId } = await import('../../middleware/admin')
      vi.mocked(getAdminId).mockReturnValue('550e8400-e29b-41d4-a716-446655440000')

      const res = await app.request('/admin/users/550e8400-e29b-41d4-a716-446655440000', {
        method: 'DELETE',
      })

      expect(res.status).toBe(400)
      const data = await res.json()
      expect(data.message).toContain('Cannot delete yourself')

      vi.mocked(getAdminId).mockReturnValue('admin-123')
    })

    it('returns 404 for non-existent user', async () => {
      mockStatement.first.mockResolvedValue(null)

      const res = await app.request('/admin/users/550e8400-e29b-41d4-a716-446655440000', {
        method: 'DELETE',
      })

      expect(res.status).toBe(404)
    })

    it('rejects deletion of already deleted user', async () => {
      mockStatement.first.mockResolvedValue({
        id: 'user-1',
        email: 'deleted@test.com',
        deleted_at: 1706200000000,
      })

      const res = await app.request('/admin/users/550e8400-e29b-41d4-a716-446655440000', {
        method: 'DELETE',
      })

      expect(res.status).toBe(400)
      const data = await res.json()
      expect(data.message).toContain('already deleted')
    })

    it('validates UUID format', async () => {
      const res = await app.request('/admin/users/invalid-id', {
        method: 'DELETE',
      })

      expect(res.status).toBe(400)
    })
  })
})
