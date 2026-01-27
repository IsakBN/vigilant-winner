/**
 * Subscription Routes
 *
 * Handles subscription plans, checkout, and billing management.
 */

import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import type { Env } from '../../types/env'
import { listPlans, getCurrentSubscription, getUsage } from './info-handlers'
import { createCheckout, createPortal, handleWebhook } from './billing-handlers'

// =============================================================================
// Schemas
// =============================================================================

const checkoutSchema = z.object({
  planId: z.string().min(1),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
})

const portalSchema = z.object({
  returnUrl: z.string().url().optional(),
})

// =============================================================================
// Router
// =============================================================================

export const subscriptionsRouter = new Hono<{ Bindings: Env }>()

/**
 * GET /v1/subscriptions/plans
 * List available subscription plans (public)
 */
subscriptionsRouter.get('/plans', listPlans)

/**
 * GET /v1/subscriptions/me
 * Get current user's subscription (requires auth)
 */
subscriptionsRouter.get('/me', getCurrentSubscription)

/**
 * POST /v1/subscriptions/checkout
 * Create a Stripe checkout session (requires auth)
 */
subscriptionsRouter.post('/checkout', zValidator('json', checkoutSchema), createCheckout)

/**
 * POST /v1/subscriptions/portal
 * Create a Stripe customer portal session (requires auth)
 */
subscriptionsRouter.post('/portal', zValidator('json', portalSchema), createPortal)

/**
 * GET /v1/subscriptions/usage
 * Get usage statistics for current subscription (requires auth)
 */
subscriptionsRouter.get('/usage', getUsage)

/**
 * POST /v1/subscriptions/webhook
 * Handle Stripe webhooks with idempotency
 */
subscriptionsRouter.post('/webhook', handleWebhook)
