/**
 * Admin dashboard route tests
 *
 * Tests for overview, activity, and alerts endpoints
 *
 * @module routes/admin/dashboard.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Hono } from 'hono'
import { adminDashboardRouter } from './dashboard'

// Mock audit logging
vi.mock('../../lib/admin/audit', () => ({
  logAdminAction: vi.fn().mockResolvedValue('audit-id'),
}))

// Mock admin middleware helper
vi.mock('../../middleware/admin', () => ({
  getAdminId: vi.fn().mockReturnValue('admin-123'),
}))

// Mock metrics modules
vi.mock('../../lib/admin/dashboard-metrics', () => ({
  calculateOverviewMetrics: vi.fn(),
}))

vi.mock('../../lib/admin/dashboard-activity', () => ({
  getActivityFeed: vi.fn(),
}))

vi.mock('../../lib/admin/dashboard-alerts', () => ({
  getSystemAlerts: vi.fn(),
}))

describe('Admin Dashboard Routes', () => {
  let app: Hono
  let mockKv: { get: ReturnType<typeof vi.fn>; put: ReturnType<typeof vi.fn> }
  let mockDb: { prepare: ReturnType<typeof vi.fn> }

  beforeEach(() => {
    vi.clearAllMocks()

    mockKv = {
      get: vi.fn().mockResolvedValue(null),
      put: vi.fn().mockResolvedValue(undefined),
    }

    mockDb = {
      prepare: vi.fn().mockReturnValue({
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue({ cnt: 0 }),
        all: vi.fn().mockResolvedValue({ results: [] }),
      }),
    }

    app = new Hono()
    app.use('*', async (c, next) => {
      c.env = { DB: mockDb, CACHE: mockKv } as unknown
      await next()
    })
    app.route('/admin/dashboard', adminDashboardRouter)
  })

  describe('GET /admin/dashboard/overview', () => {
    it('returns cached overview when available', async () => {
      const cachedData = {
        users: { total: 1000, active: 800, newToday: 10, newThisWeek: 50, newThisMonth: 200 },
        apps: { total: 500, active: 400, newThisWeek: 20 },
        devices: { total: 10000, active: 8000, byPlatform: { ios: 6000, android: 4000 } },
        releases: { total: 2000, thisWeek: 100, avgBundleSize: 5000000 },
        subscriptions: { byPlan: { free: 300, pro: 150, team: 50 }, mrr: 150000, churnRate: 2.5 },
      }
      mockKv.get.mockResolvedValue(cachedData)

      const res = await app.request('/admin/dashboard/overview')

      expect(res.status).toBe(200)
      const data = await res.json() as {
        cached: boolean
        users: { total: number }
        devices: { byPlatform: { ios: number; android: number } }
      }
      expect(data.cached).toBe(true)
      expect(data.users.total).toBe(1000)
      expect(data.devices.byPlatform.ios).toBe(6000)
    })

    it('calculates fresh metrics when cache is empty', async () => {
      const { calculateOverviewMetrics } = await import('../../lib/admin/dashboard-metrics')
      vi.mocked(calculateOverviewMetrics).mockResolvedValue({
        users: { total: 500, active: 400, newToday: 5, newThisWeek: 25, newThisMonth: 100 },
        apps: { total: 250, active: 200, newThisWeek: 10 },
        devices: { total: 5000, active: 4000, byPlatform: { ios: 3000, android: 2000 } },
        releases: { total: 1000, thisWeek: 50, avgBundleSize: 4500000 },
        subscriptions: { byPlan: { free: 150, pro: 75, team: 25 }, mrr: 75000, churnRate: 3.0 },
      })

      const res = await app.request('/admin/dashboard/overview')

      expect(res.status).toBe(200)
      const data = await res.json() as {
        cached: boolean
        users: { total: number }
        generatedAt: number
      }
      expect(data.cached).toBe(false)
      expect(data.users.total).toBe(500)
      expect(data.generatedAt).toBeDefined()
    })

    it('caches fresh metrics after calculation', async () => {
      const { calculateOverviewMetrics } = await import('../../lib/admin/dashboard-metrics')
      vi.mocked(calculateOverviewMetrics).mockResolvedValue({
        users: { total: 100, active: 80, newToday: 1, newThisWeek: 5, newThisMonth: 20 },
        apps: { total: 50, active: 40, newThisWeek: 2 },
        devices: { total: 1000, active: 800, byPlatform: { ios: 600, android: 400 } },
        releases: { total: 200, thisWeek: 10, avgBundleSize: 3000000 },
        subscriptions: { byPlan: { free: 80, pro: 20 }, mrr: 20000, churnRate: 1.5 },
      })

      await app.request('/admin/dashboard/overview')

      expect(mockKv.put).toHaveBeenCalledWith(
        'admin:dashboard:overview',
        expect.any(String),
        { expirationTtl: 300 }
      )
    })

    it('handles cache read errors gracefully', async () => {
      mockKv.get.mockRejectedValue(new Error('KV error'))

      const { calculateOverviewMetrics } = await import('../../lib/admin/dashboard-metrics')
      vi.mocked(calculateOverviewMetrics).mockResolvedValue({
        users: { total: 0, active: 0, newToday: 0, newThisWeek: 0, newThisMonth: 0 },
        apps: { total: 0, active: 0, newThisWeek: 0 },
        devices: { total: 0, active: 0, byPlatform: { ios: 0, android: 0 } },
        releases: { total: 0, thisWeek: 0, avgBundleSize: 0 },
        subscriptions: { byPlan: {}, mrr: 0, churnRate: 0 },
      })

      const res = await app.request('/admin/dashboard/overview')

      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.cached).toBe(false)
    })

    it('handles cache write errors gracefully', async () => {
      mockKv.put.mockRejectedValue(new Error('KV write error'))

      const { calculateOverviewMetrics } = await import('../../lib/admin/dashboard-metrics')
      vi.mocked(calculateOverviewMetrics).mockResolvedValue({
        users: { total: 10, active: 8, newToday: 1, newThisWeek: 3, newThisMonth: 5 },
        apps: { total: 5, active: 4, newThisWeek: 1 },
        devices: { total: 100, active: 80, byPlatform: { ios: 60, android: 40 } },
        releases: { total: 20, thisWeek: 2, avgBundleSize: 2000000 },
        subscriptions: { byPlan: { free: 10 }, mrr: 0, churnRate: 0 },
      })

      const res = await app.request('/admin/dashboard/overview')

      expect(res.status).toBe(200)
    })

    it('includes all expected metrics in response', async () => {
      const { calculateOverviewMetrics } = await import('../../lib/admin/dashboard-metrics')
      vi.mocked(calculateOverviewMetrics).mockResolvedValue({
        users: { total: 1000, active: 800, newToday: 10, newThisWeek: 50, newThisMonth: 200 },
        apps: { total: 500, active: 400, newThisWeek: 20 },
        devices: { total: 10000, active: 8000, byPlatform: { ios: 6000, android: 4000 } },
        releases: { total: 2000, thisWeek: 100, avgBundleSize: 5000000 },
        subscriptions: { byPlan: { free: 300, pro: 150, team: 50 }, mrr: 150000, churnRate: 2.5 },
      })

      const res = await app.request('/admin/dashboard/overview')
      const data = await res.json() as {
        users: { total: number; active: number; newToday: number; newThisWeek: number; newThisMonth: number }
        apps: { total: number; active: number; newThisWeek: number }
        devices: { total: number; active: number; byPlatform: { ios: number; android: number } }
        releases: { total: number; thisWeek: number; avgBundleSize: number }
        subscriptions: { byPlan: Record<string, number>; mrr: number; churnRate: number }
      }

      // Verify structure
      expect(data.users).toHaveProperty('total')
      expect(data.users).toHaveProperty('active')
      expect(data.users).toHaveProperty('newToday')
      expect(data.users).toHaveProperty('newThisWeek')
      expect(data.users).toHaveProperty('newThisMonth')

      expect(data.apps).toHaveProperty('total')
      expect(data.apps).toHaveProperty('active')
      expect(data.apps).toHaveProperty('newThisWeek')

      expect(data.devices).toHaveProperty('total')
      expect(data.devices).toHaveProperty('active')
      expect(data.devices.byPlatform).toHaveProperty('ios')
      expect(data.devices.byPlatform).toHaveProperty('android')

      expect(data.releases).toHaveProperty('total')
      expect(data.releases).toHaveProperty('thisWeek')
      expect(data.releases).toHaveProperty('avgBundleSize')

      expect(data.subscriptions).toHaveProperty('byPlan')
      expect(data.subscriptions).toHaveProperty('mrr')
      expect(data.subscriptions).toHaveProperty('churnRate')
    })
  })

  describe('GET /admin/dashboard/activity', () => {
    it('returns activity feed with default pagination', async () => {
      const { getActivityFeed } = await import('../../lib/admin/dashboard-activity')
      vi.mocked(getActivityFeed).mockResolvedValue({
        items: [
          {
            id: 'signup_user-1',
            type: 'user_signup',
            userId: 'user-1',
            userEmail: 'user@example.com',
            metadata: { name: 'Test User' },
            createdAt: 1706200000000,
          },
        ],
        total: 1,
      })

      const res = await app.request('/admin/dashboard/activity')

      expect(res.status).toBe(200)
      const data = await res.json() as {
        items: { type: string }[]
        pagination: { total: number; limit: number; offset: number; hasMore: boolean }
      }
      expect(data.items).toHaveLength(1)
      expect(data.items[0]?.type).toBe('user_signup')
      expect(data.pagination.total).toBe(1)
      expect(data.pagination.limit).toBe(50)
      expect(data.pagination.offset).toBe(0)
    })

    it('accepts custom pagination parameters', async () => {
      const { getActivityFeed } = await import('../../lib/admin/dashboard-activity')
      vi.mocked(getActivityFeed).mockResolvedValue({ items: [], total: 100 })

      const res = await app.request('/admin/dashboard/activity?limit=10&offset=20')

      expect(res.status).toBe(200)
      expect(getActivityFeed).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ limit: 10, offset: 20 })
      )
    })

    it('filters by activity type', async () => {
      const { getActivityFeed } = await import('../../lib/admin/dashboard-activity')
      vi.mocked(getActivityFeed).mockResolvedValue({
        items: [
          {
            id: 'app_app-1',
            type: 'app_created',
            userId: 'user-1',
            userEmail: 'user@example.com',
            metadata: { appId: 'app-1', appName: 'My App', platform: 'ios' },
            createdAt: 1706200000000,
          },
        ],
        total: 1,
      })

      const res = await app.request('/admin/dashboard/activity?type=app_created')

      expect(res.status).toBe(200)
      expect(getActivityFeed).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ type: 'app_created' })
      )
    })

    it('validates activity type parameter', async () => {
      const res = await app.request('/admin/dashboard/activity?type=invalid_type')

      expect(res.status).toBe(400)
    })

    it('returns hasMore correctly', async () => {
      const { getActivityFeed } = await import('../../lib/admin/dashboard-activity')
      vi.mocked(getActivityFeed).mockResolvedValue({
        items: Array(50).fill({
          id: 'test',
          type: 'user_signup',
          userId: 'user-1',
          userEmail: 'test@example.com',
          metadata: {},
          createdAt: Date.now(),
        }) as { id: string; type: string; userId: string; userEmail: string; metadata: Record<string, unknown>; createdAt: number }[],
        total: 100,
      })

      const res = await app.request('/admin/dashboard/activity?limit=50&offset=0')
      const data = await res.json() as { pagination: { hasMore: boolean } }

      expect(data.pagination.hasMore).toBe(true)
    })

    it('returns all activity types correctly', async () => {
      const { getActivityFeed } = await import('../../lib/admin/dashboard-activity')
      vi.mocked(getActivityFeed).mockResolvedValue({
        items: [
          { id: '1', type: 'user_signup', userId: 'u1', userEmail: 'a@b.com', metadata: {}, createdAt: 5 },
          { id: '2', type: 'app_created', userId: 'u1', userEmail: 'a@b.com', metadata: {}, createdAt: 4 },
          { id: '3', type: 'release_published', userId: 'u1', userEmail: 'a@b.com', metadata: {}, createdAt: 3 },
          { id: '4', type: 'subscription_started', userId: 'u1', userEmail: 'a@b.com', metadata: {}, createdAt: 2 },
          { id: '5', type: 'subscription_cancelled', userId: 'u1', userEmail: 'a@b.com', metadata: {}, createdAt: 1 },
        ],
        total: 5,
      })

      const res = await app.request('/admin/dashboard/activity')
      const data = await res.json() as { items: { type: string }[] }

      const types = data.items.map((i) => i.type)
      expect(types).toContain('user_signup')
      expect(types).toContain('app_created')
      expect(types).toContain('release_published')
      expect(types).toContain('subscription_started')
      expect(types).toContain('subscription_cancelled')
    })
  })

  describe('GET /admin/dashboard/alerts', () => {
    it('returns system alerts with default pagination', async () => {
      const { getSystemAlerts } = await import('../../lib/admin/dashboard-alerts')
      vi.mocked(getSystemAlerts).mockResolvedValue({
        items: [
          {
            id: 'error_rate_123',
            severity: 'warning',
            type: 'high_error_rate',
            message: 'Error rate is 7.5% in the last hour',
            metadata: { errorRate: 7.5, total: 1000, errors: 75 },
            createdAt: 1706200000000,
            resolvedAt: null,
          },
        ],
        total: 1,
      })

      const res = await app.request('/admin/dashboard/alerts')

      expect(res.status).toBe(200)
      const data = await res.json() as { items: { severity: string; type: string }[] }
      expect(data.items).toHaveLength(1)
      expect(data.items[0]?.severity).toBe('warning')
      expect(data.items[0]?.type).toBe('high_error_rate')
    })

    it('filters by severity', async () => {
      const { getSystemAlerts } = await import('../../lib/admin/dashboard-alerts')
      vi.mocked(getSystemAlerts).mockResolvedValue({ items: [], total: 0 })

      const res = await app.request('/admin/dashboard/alerts?severity=critical')

      expect(res.status).toBe(200)
      expect(getSystemAlerts).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ severity: 'critical' })
      )
    })

    it('filters by resolved status - resolved=true', async () => {
      const { getSystemAlerts } = await import('../../lib/admin/dashboard-alerts')
      vi.mocked(getSystemAlerts).mockResolvedValue({ items: [], total: 0 })

      const res = await app.request('/admin/dashboard/alerts?resolved=true')

      expect(res.status).toBe(200)
      expect(getSystemAlerts).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ resolved: true })
      )
    })

    it('filters by resolved status - resolved=false', async () => {
      const { getSystemAlerts } = await import('../../lib/admin/dashboard-alerts')
      vi.mocked(getSystemAlerts).mockResolvedValue({ items: [], total: 0 })

      const res = await app.request('/admin/dashboard/alerts?resolved=false')

      expect(res.status).toBe(200)
      expect(getSystemAlerts).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ resolved: false })
      )
    })

    it('validates severity parameter', async () => {
      const res = await app.request('/admin/dashboard/alerts?severity=invalid')

      expect(res.status).toBe(400)
    })

    it('accepts pagination parameters', async () => {
      const { getSystemAlerts } = await import('../../lib/admin/dashboard-alerts')
      vi.mocked(getSystemAlerts).mockResolvedValue({ items: [], total: 0 })

      const res = await app.request('/admin/dashboard/alerts?limit=25&offset=50')

      expect(res.status).toBe(200)
      expect(getSystemAlerts).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ limit: 25, offset: 50 })
      )
    })

    it('returns alerts sorted by severity', async () => {
      const { getSystemAlerts } = await import('../../lib/admin/dashboard-alerts')
      vi.mocked(getSystemAlerts).mockResolvedValue({
        items: [
          {
            id: '1',
            severity: 'critical',
            type: 'high_error_rate',
            message: 'Critical error',
            metadata: {},
            createdAt: 1,
            resolvedAt: null,
          },
          {
            id: '2',
            severity: 'warning',
            type: 'webhook_failures',
            message: 'Webhook failures',
            metadata: {},
            createdAt: 2,
            resolvedAt: null,
          },
          {
            id: '3',
            severity: 'info',
            type: 'traffic_spike',
            message: 'Traffic spike',
            metadata: {},
            createdAt: 3,
            resolvedAt: null,
          },
        ],
        total: 3,
      })

      const res = await app.request('/admin/dashboard/alerts')
      const data = await res.json() as { items: { severity: string }[] }

      expect(data.items[0]?.severity).toBe('critical')
      expect(data.items[1]?.severity).toBe('warning')
      expect(data.items[2]?.severity).toBe('info')
    })

    it('includes all expected alert types', async () => {
      const { getSystemAlerts } = await import('../../lib/admin/dashboard-alerts')
      vi.mocked(getSystemAlerts).mockResolvedValue({
        items: [
          { id: '1', severity: 'critical', type: 'high_error_rate', message: 'a', metadata: {}, createdAt: 1, resolvedAt: null },
          { id: '2', severity: 'warning', type: 'webhook_failures_accumulating', message: 'b', metadata: {}, createdAt: 2, resolvedAt: null },
          { id: '3', severity: 'warning', type: 'storage_approaching_limit', message: 'c', metadata: {}, createdAt: 3, resolvedAt: null },
          { id: '4', severity: 'info', type: 'unusual_traffic_pattern', message: 'd', metadata: {}, createdAt: 4, resolvedAt: null },
        ],
        total: 4,
      })

      const res = await app.request('/admin/dashboard/alerts')
      const data = await res.json() as { items: { type: string }[] }

      const types = data.items.map((i) => i.type)
      expect(types).toContain('high_error_rate')
      expect(types).toContain('webhook_failures_accumulating')
      expect(types).toContain('storage_approaching_limit')
      expect(types).toContain('unusual_traffic_pattern')
    })
  })

  describe('Audit Logging', () => {
    it('logs overview view action', async () => {
      const { logAdminAction } = await import('../../lib/admin/audit')
      const { calculateOverviewMetrics } = await import('../../lib/admin/dashboard-metrics')
      vi.mocked(calculateOverviewMetrics).mockResolvedValue({
        users: { total: 0, active: 0, newToday: 0, newThisWeek: 0, newThisMonth: 0 },
        apps: { total: 0, active: 0, newThisWeek: 0 },
        devices: { total: 0, active: 0, byPlatform: { ios: 0, android: 0 } },
        releases: { total: 0, thisWeek: 0, avgBundleSize: 0 },
        subscriptions: { byPlan: {}, mrr: 0, churnRate: 0 },
      })

      await app.request('/admin/dashboard/overview')

      expect(logAdminAction).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          adminId: 'admin-123',
          action: 'view_dashboard',
          details: expect.objectContaining({ view: 'overview' }) as unknown,
        })
      )
    })

    it('logs activity view action', async () => {
      const { logAdminAction } = await import('../../lib/admin/audit')
      const { getActivityFeed } = await import('../../lib/admin/dashboard-activity')
      vi.mocked(getActivityFeed).mockResolvedValue({ items: [], total: 0 })

      await app.request('/admin/dashboard/activity')

      expect(logAdminAction).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          adminId: 'admin-123',
          action: 'view_dashboard',
          details: expect.objectContaining({ view: 'activity' }) as unknown,
        })
      )
    })

    it('logs alerts view action', async () => {
      const { logAdminAction } = await import('../../lib/admin/audit')
      const { getSystemAlerts } = await import('../../lib/admin/dashboard-alerts')
      vi.mocked(getSystemAlerts).mockResolvedValue({ items: [], total: 0 })

      await app.request('/admin/dashboard/alerts')

      expect(logAdminAction).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          adminId: 'admin-123',
          action: 'view_dashboard',
          details: expect.objectContaining({ view: 'alerts' }) as unknown,
        })
      )
    })
  })
})
