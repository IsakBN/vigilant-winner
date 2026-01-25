/**
 * Admin subscription mutation route tests
 *
 * @agent admin-subscriptions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Hono } from 'hono'
import { adminSubscriptionsRouter } from './subscriptions'

vi.mock('../../lib/admin/audit', () => ({
  logAdminAction: vi.fn().mockResolvedValue('audit-id'),
}))

vi.mock('../../middleware/admin', () => ({
  getAdminId: vi.fn().mockReturnValue('admin-123'),
}))

describe('Admin Subscription Mutation Routes', () => {
  let app: Hono
  let mockStatement: ReturnType<typeof createMockStatement>

  interface MockStatement {
    bind: ReturnType<typeof vi.fn>
    run: ReturnType<typeof vi.fn>
    first: ReturnType<typeof vi.fn>
    all: ReturnType<typeof vi.fn>
  }

  function createMockStatement(): MockStatement {
    return {
      bind: vi.fn().mockReturnThis(),
      run: vi.fn().mockResolvedValue({ success: true }),
      first: vi.fn(),
      all: vi.fn().mockResolvedValue({ results: [] }),
    }
  }

  beforeEach(() => {
    mockStatement = createMockStatement()
    const mockDb = { prepare: vi.fn().mockReturnValue(mockStatement) }
    app = new Hono()
    app.use('*', async (c, next) => {
      c.env = { DB: mockDb } as unknown
      await next()
    })
    app.route('/admin/subscriptions', adminSubscriptionsRouter)
  })

  const UUID = '550e8400-e29b-41d4-a716-446655440000'
  const mockSub = {
    id: 'sub-1', user_id: 'user-1', plan_id: 'plan-pro',
    status: 'active', user_email: 'user@test.com', plan_name: 'pro',
  }

  describe('PATCH /admin/subscriptions/:subscriptionId', () => {
    it('updates subscription status', async () => {
      mockStatement.first.mockResolvedValueOnce(mockSub)
      const res = await app.request(`/admin/subscriptions/${UUID}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' }),
      })
      expect(res.status).toBe(200)
      expect((await res.json()).success).toBe(true)
    })

    it('updates subscription plan when valid', async () => {
      mockStatement.first
        .mockResolvedValueOnce(mockSub)
        .mockResolvedValueOnce({ id: 'plan-team' })
      const res = await app.request(`/admin/subscriptions/${UUID}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: 'plan-team' }),
      })
      expect(res.status).toBe(200)
    })

    it('extends subscription period and sets cancel at period end', async () => {
      mockStatement.first.mockResolvedValueOnce(mockSub)
      const futureDate = Date.now() + 30 * 24 * 60 * 60 * 1000
      const res = await app.request(`/admin/subscriptions/${UUID}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPeriodEnd: futureDate, cancelAtPeriodEnd: true }),
      })
      expect(res.status).toBe(200)
    })

    it('returns 404 for non-existent subscription', async () => {
      mockStatement.first.mockResolvedValueOnce(null)
      const res = await app.request(`/admin/subscriptions/${UUID}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' }),
      })
      expect(res.status).toBe(404)
    })

    it('returns 400 for invalid plan ID or UUID format', async () => {
      mockStatement.first.mockResolvedValueOnce(mockSub).mockResolvedValueOnce(null)
      let res = await app.request(`/admin/subscriptions/${UUID}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: 'invalid' }),
      })
      expect(res.status).toBe(400)

      res = await app.request('/admin/subscriptions/invalid-id', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' }),
      })
      expect(res.status).toBe(400)
    })
  })

  describe('POST /admin/subscriptions/grant', () => {
    const mockUser = { id: 'user-1', email: 'user@test.com' }
    const mockPlan = { id: 'plan-pro', name: 'pro', display_name: 'Pro' }
    const validGrant = { userId: UUID, planId: 'plan-pro', durationDays: 30, reason: 'Enterprise trial' }

    it('grants new subscription when user has none', async () => {
      mockStatement.first
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(mockPlan)
        .mockResolvedValueOnce(null)
      const res = await app.request('/admin/subscriptions/grant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validGrant),
      })
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.message).toContain('Granted')
      expect(data.subscriptionId).toBeDefined()
    })

    it('extends existing subscription', async () => {
      mockStatement.first
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(mockPlan)
        .mockResolvedValueOnce({ id: 'sub-existing', plan_id: 'plan-pro' })
      const res = await app.request('/admin/subscriptions/grant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validGrant),
      })
      const data = await res.json()
      expect(data.message).toContain('Extended')
      expect(data.subscriptionId).toBe('sub-existing')
    })

    it('returns 404 for non-existent user', async () => {
      mockStatement.first.mockResolvedValueOnce(null)
      const res = await app.request('/admin/subscriptions/grant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validGrant),
      })
      expect(res.status).toBe(404)
    })

    it('returns 400 for invalid plan or validation errors', async () => {
      mockStatement.first.mockResolvedValueOnce(mockUser).mockResolvedValueOnce(null)
      let res = await app.request('/admin/subscriptions/grant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validGrant),
      })
      expect(res.status).toBe(400)

      res = await app.request('/admin/subscriptions/grant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...validGrant, reason: 'x' }),
      })
      expect(res.status).toBe(400)

      res = await app.request('/admin/subscriptions/grant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...validGrant, durationDays: 500 }),
      })
      expect(res.status).toBe(400)
    })
  })

  describe('Audit Logging', () => {
    it('logs update_subscription and grant_subscription actions', async () => {
      const { logAdminAction } = await import('../../lib/admin/audit')
      mockStatement.first.mockResolvedValueOnce(mockSub)
      await app.request(`/admin/subscriptions/${UUID}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' }),
      })
      expect(logAdminAction).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ action: 'update_subscription', targetUserId: 'user-1' })
      )

      vi.clearAllMocks()
      mockStatement.first
        .mockResolvedValueOnce({ id: 'user-1', email: 'user@test.com' })
        .mockResolvedValueOnce({ id: 'plan-pro', name: 'pro', display_name: 'Pro' })
        .mockResolvedValueOnce(null)
      await app.request('/admin/subscriptions/grant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: UUID, planId: 'plan-pro', durationDays: 30, reason: 'Enterprise trial' }),
      })
      expect(logAdminAction).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ action: 'grant_subscription', targetUserId: UUID })
      )
    })
  })
})
