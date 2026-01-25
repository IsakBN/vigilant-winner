/**
 * Admin subscription management routes
 *
 * Subscription listing, updates, plan management, and granting
 *
 * @agent admin-subscriptions
 */

import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import type { Env } from '../../types/env'
import { listSubscriptions, listPlans } from './subscriptions-list'
import { updateSubscription, grantSubscription } from './subscriptions-mutations'

// =============================================================================
// Validation Schemas
// =============================================================================

const listSubscriptionsSchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
  status: z.enum(['active', 'cancelled', 'past_due', 'expired', 'trialing']).optional(),
  planId: z.string().optional(),
  userId: z.string().uuid().optional(),
})

const subscriptionIdSchema = z.object({
  subscriptionId: z.string().uuid(),
})

const updateSubscriptionSchema = z.object({
  status: z.enum(['active', 'cancelled']).optional(),
  planId: z.string().optional(),
  currentPeriodEnd: z.number().int().positive().optional(),
  cancelAtPeriodEnd: z.boolean().optional(),
})

const grantSubscriptionSchema = z.object({
  userId: z.string().uuid(),
  planId: z.string(),
  durationDays: z.number().int().min(1).max(365),
  reason: z.string().min(5).max(500),
})

// =============================================================================
// Router
// =============================================================================

export const adminSubscriptionsRouter = new Hono<{ Bindings: Env }>()

/**
 * GET /admin/subscriptions
 * List all subscriptions with filtering and MRR stats
 */
adminSubscriptionsRouter.get(
  '/',
  zValidator('query', listSubscriptionsSchema),
  async (c) => {
    const query = c.req.valid('query')
    return listSubscriptions(c, query)
  }
)

/**
 * GET /admin/subscriptions/plans
 * List all subscription plans
 */
adminSubscriptionsRouter.get('/plans', async (c) => {
  return listPlans(c)
})

/**
 * PATCH /admin/subscriptions/:subscriptionId
 * Update a subscription (status, plan, extend, cancel)
 */
adminSubscriptionsRouter.patch(
  '/:subscriptionId',
  zValidator('param', subscriptionIdSchema),
  zValidator('json', updateSubscriptionSchema),
  async (c) => {
    const { subscriptionId } = c.req.valid('param')
    const body = c.req.valid('json')
    return updateSubscription(c, subscriptionId, body)
  }
)

/**
 * POST /admin/subscriptions/grant
 * Grant a subscription to a user (admin-granted, no Stripe)
 */
adminSubscriptionsRouter.post(
  '/grant',
  zValidator('json', grantSubscriptionSchema),
  async (c) => {
    const body = c.req.valid('json')
    return grantSubscription(c, body)
  }
)
