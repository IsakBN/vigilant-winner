/**
 * Admin subscription list route tests
 *
 * @agent admin-subscriptions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Hono } from 'hono'
import { adminSubscriptionsRouter } from './subscriptions'

// Mock audit logging
vi.mock('../../lib/admin/audit', () => ({
  logAdminAction: vi.fn().mockResolvedValue('audit-id'),
}))

// Mock admin middleware helper
vi.mock('../../middleware/admin', () => ({
  getAdminId: vi.fn().mockReturnValue('admin-123'),
}))

describe('Admin Subscription List Routes', () => {
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
    app.route('/admin/subscriptions', adminSubscriptionsRouter)
  })

  describe('GET /admin/subscriptions', () => {
    it('returns paginated subscription list with stats', async () => {
      mockStatement.first.mockResolvedValueOnce({ total: 50 })
      mockStatement.all
        .mockResolvedValueOnce({
          results: [
            {
              id: 'sub-1',
              user_id: 'user-1',
              plan_id: 'plan-pro',
              status: 'active',
              current_period_start: 1706200000000,
              current_period_end: 1708792000000,
              cancel_at_period_end: 0,
              stripe_subscription_id: 'sub_stripe_123',
              created_at: 1706200000000,
              user_email: 'user@test.com',
              plan_name: 'pro',
              plan_display: 'Pro',
              plan_price_cents: 2900,
            },
          ],
        })
      mockStatement.first.mockResolvedValueOnce({ total_mrr: 145000 })
      mockStatement.all.mockResolvedValueOnce({
        results: [
          { name: 'pro', display_name: 'Pro', count: 30 },
          { name: 'team', display_name: 'Team', count: 15 },
        ],
      })

      const res = await app.request('/admin/subscriptions?limit=20&offset=0')

      expect(res.status).toBe(200)
      const data = await res.json() as {
        subscriptions: { userId: string; planName: string }[]
        stats: { mrrCents: number; planDistribution: unknown[] }
        pagination: { total: number }
      }
      expect(data.subscriptions).toHaveLength(1)
      expect(data.subscriptions[0]?.userId).toBe('user-1')
      expect(data.subscriptions[0]?.planName).toBe('pro')
      expect(data.stats.mrrCents).toBe(145000)
      expect(data.stats.planDistribution).toHaveLength(2)
      expect(data.pagination.total).toBe(50)
    })

    it('filters by status', async () => {
      mockStatement.first.mockResolvedValueOnce({ total: 10 })
      mockStatement.all.mockResolvedValueOnce({ results: [] })
      mockStatement.first.mockResolvedValueOnce({ total_mrr: 0 })
      mockStatement.all.mockResolvedValueOnce({ results: [] })

      const res = await app.request('/admin/subscriptions?status=cancelled')

      expect(res.status).toBe(200)
      const prepareCall = mockDb.prepare.mock.calls[0]?.[0] as string | undefined
      expect(prepareCall).toContain('s.status = ?')
    })

    it('filters by planId', async () => {
      mockStatement.first.mockResolvedValueOnce({ total: 5 })
      mockStatement.all.mockResolvedValueOnce({ results: [] })
      mockStatement.first.mockResolvedValueOnce({ total_mrr: 0 })
      mockStatement.all.mockResolvedValueOnce({ results: [] })

      const res = await app.request('/admin/subscriptions?planId=plan-pro')

      expect(res.status).toBe(200)
    })

    it('filters by userId', async () => {
      mockStatement.first.mockResolvedValueOnce({ total: 1 })
      mockStatement.all.mockResolvedValueOnce({ results: [] })
      mockStatement.first.mockResolvedValueOnce({ total_mrr: 0 })
      mockStatement.all.mockResolvedValueOnce({ results: [] })

      const res = await app.request(
        '/admin/subscriptions?userId=550e8400-e29b-41d4-a716-446655440000'
      )

      expect(res.status).toBe(200)
    })
  })

  describe('GET /admin/subscriptions/plans', () => {
    it('returns all subscription plans with subscriber counts', async () => {
      mockStatement.all
        .mockResolvedValueOnce({
          results: [
            {
              id: 'plan-free',
              name: 'free',
              display_name: 'Free',
              price_cents: 0,
              stripe_price_id: null,
              mau_limit: 1000,
              storage_gb: 1,
              bundle_retention: 7,
              features: '["basic_analytics"]',
              is_active: 1,
              created_at: 1706200000000,
            },
            {
              id: 'plan-pro',
              name: 'pro',
              display_name: 'Pro',
              price_cents: 2900,
              stripe_price_id: 'price_xxx',
              mau_limit: 50000,
              storage_gb: 10,
              bundle_retention: 30,
              features: '["analytics","webhooks"]',
              is_active: 1,
              created_at: 1706200000000,
            },
          ],
        })
        .mockResolvedValueOnce({
          results: [
            { plan_id: 'plan-free', count: 100 },
            { plan_id: 'plan-pro', count: 50 },
          ],
        })

      const res = await app.request('/admin/subscriptions/plans')

      expect(res.status).toBe(200)
      const data = await res.json() as {
        plans: { name: string; subscriberCount: number; priceCents: number; features: string[] }[]
      }
      expect(data.plans).toHaveLength(2)
      expect(data.plans[0]?.name).toBe('free')
      expect(data.plans[0]?.subscriberCount).toBe(100)
      expect(data.plans[1]?.priceCents).toBe(2900)
      expect(data.plans[1]?.features).toContain('webhooks')
    })
  })

  describe('Audit Logging - List Operations', () => {
    it('logs view_subscriptions action', async () => {
      const { logAdminAction } = await import('../../lib/admin/audit')
      mockStatement.first.mockResolvedValueOnce({ total: 0 })
      mockStatement.all.mockResolvedValue({ results: [] })
      mockStatement.first.mockResolvedValueOnce({ total_mrr: 0 })

      await app.request('/admin/subscriptions')

      expect(logAdminAction).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          adminId: 'admin-123',
          action: 'view_subscriptions',
        })
      )
    })

    it('logs view_subscription_plans action', async () => {
      const { logAdminAction } = await import('../../lib/admin/audit')
      mockStatement.all.mockResolvedValue({ results: [] })

      await app.request('/admin/subscriptions/plans')

      expect(logAdminAction).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          adminId: 'admin-123',
          action: 'view_subscription_plans',
        })
      )
    })
  })
})
