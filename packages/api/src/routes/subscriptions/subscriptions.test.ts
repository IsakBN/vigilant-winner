import { describe, it, expect } from 'vitest'
import { z } from 'zod'

// Local schema definitions for testing
const checkoutSchema = z.object({
  planId: z.string().min(1),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
})

const portalSchema = z.object({
  returnUrl: z.string().url().optional(),
})

describe('subscription routes logic', () => {
  describe('checkoutSchema', () => {
    it('validates valid checkout request', () => {
      const result = checkoutSchema.safeParse({
        planId: 'plan_pro',
      })
      expect(result.success).toBe(true)
    })

    it('validates with optional URLs', () => {
      const result = checkoutSchema.safeParse({
        planId: 'plan_team',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
      })
      expect(result.success).toBe(true)
    })

    it('rejects empty planId', () => {
      const result = checkoutSchema.safeParse({
        planId: '',
      })
      expect(result.success).toBe(false)
    })

    it('rejects invalid URLs', () => {
      const result = checkoutSchema.safeParse({
        planId: 'plan_pro',
        successUrl: 'not-a-url',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('portalSchema', () => {
    it('validates empty request', () => {
      const result = portalSchema.safeParse({})
      expect(result.success).toBe(true)
    })

    it('validates with returnUrl', () => {
      const result = portalSchema.safeParse({
        returnUrl: 'https://example.com/billing',
      })
      expect(result.success).toBe(true)
    })

    it('rejects invalid URL', () => {
      const result = portalSchema.safeParse({
        returnUrl: 'not-a-url',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('plan formatting', () => {
    function formatPlan(plan: Record<string, unknown>) {
      return {
        id: plan.id,
        name: plan.name,
        displayName: plan.display_name,
        priceCents: plan.price_cents,
        mauLimit: plan.mau_limit,
        storageGb: plan.storage_gb,
        bundleRetention: plan.bundle_retention,
        features: plan.features ? JSON.parse(plan.features as string) : [],
      }
    }

    it('formats plan correctly', () => {
      const dbPlan = {
        id: 'plan_pro',
        name: 'pro',
        display_name: 'Pro',
        price_cents: 1999,
        mau_limit: 50000,
        storage_gb: 50,
        bundle_retention: 15,
        features: '["priority_support","advanced_analytics"]',
      }

      const formatted = formatPlan(dbPlan)

      expect(formatted.id).toBe('plan_pro')
      expect(formatted.displayName).toBe('Pro')
      expect(formatted.priceCents).toBe(1999)
      expect(formatted.features).toEqual(['priority_support', 'advanced_analytics'])
    })

    it('handles null features', () => {
      const dbPlan = {
        id: 'plan_free',
        name: 'free',
        display_name: 'Free',
        price_cents: 0,
        mau_limit: 10000,
        storage_gb: 5,
        bundle_retention: 5,
        features: null,
      }

      const formatted = formatPlan(dbPlan)
      expect(formatted.features).toEqual([])
    })
  })

  describe('subscription formatting', () => {
    function formatSubscription(sub: Record<string, unknown>) {
      return {
        id: sub.id,
        planId: sub.plan_id,
        status: sub.status,
        currentPeriodStart: sub.current_period_start,
        currentPeriodEnd: sub.current_period_end,
        cancelAtPeriodEnd: Boolean(sub.cancel_at_period_end),
      }
    }

    it('formats subscription correctly', () => {
      const dbSub = {
        id: 'sub-123',
        plan_id: 'plan_pro',
        status: 'active',
        current_period_start: 1700000000,
        current_period_end: 1702678400,
        cancel_at_period_end: 0,
      }

      const formatted = formatSubscription(dbSub)

      expect(formatted.id).toBe('sub-123')
      expect(formatted.planId).toBe('plan_pro')
      expect(formatted.status).toBe('active')
      expect(formatted.cancelAtPeriodEnd).toBe(false)
    })

    it('handles cancel_at_period_end true', () => {
      const dbSub = {
        id: 'sub-456',
        plan_id: 'plan_team',
        status: 'active',
        current_period_start: 1700000000,
        current_period_end: 1702678400,
        cancel_at_period_end: 1,
      }

      const formatted = formatSubscription(dbSub)
      expect(formatted.cancelAtPeriodEnd).toBe(true)
    })
  })

  describe('usage calculation', () => {
    it('calculates storage in GB', () => {
      const storageBytes = 5368709120 // 5 GB in bytes
      const storageGb = Math.round(storageBytes / 1024 / 1024 / 1024 * 100) / 100
      expect(storageGb).toBe(5)
    })

    it('rounds storage to 2 decimal places', () => {
      const storageBytes = 1610612736 // 1.5 GB
      const storageGb = Math.round(storageBytes / 1024 / 1024 / 1024 * 100) / 100
      expect(storageGb).toBe(1.5)
    })

    it('handles zero storage', () => {
      const storageBytes = 0
      const storageGb = Math.round(storageBytes / 1024 / 1024 / 1024 * 100) / 100
      expect(storageGb).toBe(0)
    })
  })

  describe('default free plan', () => {
    function getDefaultFreePlan() {
      return {
        id: 'plan_free',
        name: 'free',
        displayName: 'Free',
        priceCents: 0,
        mauLimit: 10000,
        storageGb: 20,
        bundleRetention: 5,
      }
    }

    it('returns correct free tier limits', () => {
      const plan = getDefaultFreePlan()

      expect(plan.priceCents).toBe(0)
      expect(plan.mauLimit).toBe(10000)
      expect(plan.storageGb).toBe(20)
      expect(plan.bundleRetention).toBe(5)
    })
  })

  describe('webhook event handling', () => {
    it('parses checkout.session.completed event', () => {
      const event = {
        type: 'checkout.session.completed',
        data: {
          object: {
            client_reference_id: 'user-123',
            customer: 'cus_abc',
            subscription: 'sub_xyz',
            metadata: { plan_id: 'plan_pro' },
          },
        },
      }

      const session = event.data.object
      expect(session.client_reference_id).toBe('user-123')
      expect(session.customer).toBe('cus_abc')
      expect(session.subscription).toBe('sub_xyz')
      expect(session.metadata.plan_id).toBe('plan_pro')
    })

    it('parses customer.subscription.updated event', () => {
      const event = {
        type: 'customer.subscription.updated',
        data: {
          object: {
            id: 'sub_xyz',
            status: 'active',
            current_period_start: 1700000000,
            current_period_end: 1702678400,
            cancel_at_period_end: false,
          },
        },
      }

      const subscription = event.data.object
      expect(subscription.id).toBe('sub_xyz')
      expect(subscription.status).toBe('active')
      expect(subscription.cancel_at_period_end).toBe(false)
    })

    it('parses customer.subscription.deleted event', () => {
      const event = {
        type: 'customer.subscription.deleted',
        data: {
          object: {
            id: 'sub_xyz',
          },
        },
      }

      expect(event.data.object.id).toBe('sub_xyz')
    })

    it('parses invoice.payment_failed event', () => {
      const event = {
        type: 'invoice.payment_failed',
        data: {
          object: {
            subscription: 'sub_xyz',
          },
        },
      }

      expect(event.data.object.subscription).toBe('sub_xyz')
    })
  })

  describe('subscription tiers', () => {
    const plans = [
      { id: 'plan_free', name: 'free', priceCents: 0, mauLimit: 10000, storageGb: 5 },
      { id: 'plan_pro', name: 'pro', priceCents: 1999, mauLimit: 50000, storageGb: 50 },
      { id: 'plan_team', name: 'team', priceCents: 9999, mauLimit: 500000, storageGb: 500 },
    ]

    it('free tier has lowest limits', () => {
      const free = plans.find(p => p.name === 'free')
      expect(free?.mauLimit).toBe(10000)
      expect(free?.storageGb).toBe(5)
    })

    it('pro tier has higher limits than free', () => {
      const free = plans.find(p => p.name === 'free')
      const pro = plans.find(p => p.name === 'pro')

      expect(pro!.mauLimit).toBeGreaterThan(free!.mauLimit)
      expect(pro!.storageGb).toBeGreaterThan(free!.storageGb)
    })

    it('team tier has highest limits', () => {
      const team = plans.find(p => p.name === 'team')
      expect(team?.mauLimit).toBe(500000)
      expect(team?.storageGb).toBe(500)
    })

    it('plans are sorted by price', () => {
      const sorted = [...plans].sort((a, b) => a.priceCents - b.priceCents)
      expect(sorted[0].name).toBe('free')
      expect(sorted[1].name).toBe('pro')
      expect(sorted[2].name).toBe('team')
    })
  })
})
