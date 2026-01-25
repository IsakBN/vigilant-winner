/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment */
/**
 * Admin dashboard route tests
 *
 * @agent wave5-admin
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Hono } from 'hono'
import { adminDashboardRouter } from './dashboard'

// Mock audit logging
vi.mock('../../lib/admin/audit', () => ({
  logAdminAction: vi.fn().mockResolvedValue('audit-id'),
  getAuditLog: vi.fn().mockResolvedValue({ entries: [], total: 0 }),
}))

// Mock admin middleware helper
vi.mock('../../middleware/admin', () => ({
  getAdminId: vi.fn().mockReturnValue('admin-123'),
}))

describe('Admin Dashboard Routes', () => {
  let app: Hono
  let mockDb: { prepare: ReturnType<typeof vi.fn> }
  let mockStatement: {
    bind: ReturnType<typeof vi.fn>
    first: ReturnType<typeof vi.fn>
    all: ReturnType<typeof vi.fn>
  }

  beforeEach(() => {
    mockStatement = {
      bind: vi.fn().mockReturnThis(),
      first: vi.fn().mockResolvedValue({ cnt: 0 }),
      all: vi.fn().mockResolvedValue({ results: [] }),
    }
    mockDb = {
      prepare: vi.fn().mockReturnValue(mockStatement),
    }

    app = new Hono()
    app.use('*', async (c, next) => {
      c.env = { DB: mockDb } as unknown
      await next()
    })
    app.route('/admin/dashboard', adminDashboardRouter)
  })

  describe('GET /admin/dashboard/overview', () => {
    it('returns platform statistics', async () => {
      // Mock all the count queries
      mockStatement.first
        .mockResolvedValueOnce({ cnt: 1000 }) // total users
        .mockResolvedValueOnce({ cnt: 50 }) // new users 7d
        .mockResolvedValueOnce({ cnt: 500 }) // total apps
        .mockResolvedValueOnce({ cnt: 20 }) // new apps 7d
        .mockResolvedValueOnce({ cnt: 2000 }) // total releases
        .mockResolvedValueOnce({ cnt: 100 }) // releases 7d
        .mockResolvedValueOnce({ cnt: 10000 }) // total devices
        .mockResolvedValueOnce({ cnt: 5000 }) // active devices 30d

      mockStatement.all
        .mockResolvedValueOnce({
          results: [
            { status: 'active', cnt: 800 },
            { status: 'trialing', cnt: 100 },
            { status: 'cancelled', cnt: 50 },
          ],
        })
        .mockResolvedValueOnce({
          results: [
            { name: 'free', cnt: 500 },
            { name: 'pro', cnt: 300 },
            { name: 'enterprise', cnt: 50 },
          ],
        })

      const res = await app.request('/admin/dashboard/overview')

      expect(res.status).toBe(200)
      interface _OverviewData {
        users: { total: number; new7d: number }
        apps: { total: number }
        releases: { total: number }
        devices: { total: number; active30d: number }
        subscriptions: { active: number }
        plans: { pro: number }
        generatedAt?: number
      }
      const data = await res.json()
      expect(data.users.total).toBe(1000)
      expect(data.users.new7d).toBe(50)
      expect(data.apps.total).toBe(500)
      expect(data.releases.total).toBe(2000)
      expect(data.devices.total).toBe(10000)
      expect(data.devices.active30d).toBe(5000)
      expect(data.subscriptions.active).toBe(800)
      expect(data.plans.pro).toBe(300)
    })

    it('handles empty database', async () => {
      mockStatement.first.mockResolvedValue({ cnt: 0 })
      mockStatement.all.mockResolvedValue({ results: [] })

      const res = await app.request('/admin/dashboard/overview')

      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.users.total).toBe(0)
      expect(data.apps.total).toBe(0)
    })

    it('includes timestamp', async () => {
      mockStatement.first.mockResolvedValue({ cnt: 0 })
      mockStatement.all.mockResolvedValue({ results: [] })

      const res = await app.request('/admin/dashboard/overview')
      const data = (await res.json())

      expect(data.generatedAt).toBeDefined()
      expect(typeof data.generatedAt).toBe('number')
    })
  })

  describe('GET /admin/dashboard/audit-log', () => {
    it('returns audit log entries', async () => {
      const { getAuditLog } = await import('../../lib/admin/audit')
      vi.mocked(getAuditLog).mockResolvedValue({
        entries: [
          {
            id: 'log-1',
            adminId: 'admin-123',
            action: 'suspend_user',
            targetUserId: 'user-456',
            targetAppId: null,
            details: null,
            ipAddress: null,
            userAgent: null,
            createdAt: 1706200000000,
          },
        ],
        total: 1,
      })

      const res = await app.request('/admin/dashboard/audit-log')

      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.entries).toHaveLength(1)
      expect(data.entries[0]?.action).toBe('suspend_user')
    })

    it('accepts filter parameters', async () => {
      const { getAuditLog } = await import('../../lib/admin/audit')
      vi.mocked(getAuditLog).mockResolvedValue({ entries: [], total: 0 })

      const res = await app.request(
        '/admin/dashboard/audit-log?action=suspend_user&limit=10&offset=20'
      )

      expect(res.status).toBe(200)
      expect(getAuditLog).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          action: 'suspend_user',
          limit: 10,
          offset: 20,
        })
      )
    })

    it('filters by admin ID', async () => {
      const { getAuditLog } = await import('../../lib/admin/audit')
      vi.mocked(getAuditLog).mockResolvedValue({ entries: [], total: 0 })

      const res = await app.request(
        '/admin/dashboard/audit-log?adminId=550e8400-e29b-41d4-a716-446655440000'
      )

      expect(res.status).toBe(200)
      expect(getAuditLog).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          adminId: '550e8400-e29b-41d4-a716-446655440000',
        })
      )
    })

    it('filters by date range', async () => {
      const { getAuditLog } = await import('../../lib/admin/audit')
      vi.mocked(getAuditLog).mockResolvedValue({ entries: [], total: 0 })

      const res = await app.request(
        '/admin/dashboard/audit-log?startDate=1706100000000&endDate=1706200000000'
      )

      expect(res.status).toBe(200)
      expect(getAuditLog).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          startDate: 1706100000000,
          endDate: 1706200000000,
        })
      )
    })

    it('includes pagination info', async () => {
      const { getAuditLog } = await import('../../lib/admin/audit')
      vi.mocked(getAuditLog).mockResolvedValue({
        entries: Array(50).fill({
          id: 'log-1',
          adminId: 'admin-123',
          action: 'view_user',
          targetUserId: null,
          targetAppId: null,
          details: null,
          ipAddress: null,
          userAgent: null,
          createdAt: 1706200000000,
        }) as AuditLogEntry[],
        total: 100,
      })

      const res = await app.request('/admin/dashboard/audit-log?limit=50&offset=0')

      const data = await res.json()
      expect(data.pagination.total).toBe(100)
      expect(data.pagination.limit).toBe(50)
      expect(data.pagination.hasMore).toBe(true)
    })
  })

  describe('GET /admin/dashboard/health', () => {
    it('returns healthy status when all checks pass', async () => {
      mockStatement.first.mockResolvedValue({ ok: 1 })

      const res = await app.request('/admin/dashboard/health')

      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.status).toBe('healthy')
      expect(data.checks.database).toBe(true)
    })

    it('returns degraded status when database check fails', async () => {
      mockStatement.first.mockRejectedValue(new Error('DB error'))

      const res = await app.request('/admin/dashboard/health')

      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.status).toBe('degraded')
      expect(data.checks.database).toBe(false)
    })

    it('includes timestamp', async () => {
      mockStatement.first.mockResolvedValue({ ok: 1 })

      const res = await app.request('/admin/dashboard/health')
      const data = (await res.json())

      expect(data.timestamp).toBeDefined()
    })
  })
})
