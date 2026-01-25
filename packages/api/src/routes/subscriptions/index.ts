/**
 * Subscription Routes
 *
 * Handles subscription plans, checkout, and billing management.
 */

import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import type { Env } from '../../types/env'
import {
  createCheckoutSession,
  createPortalSession,
  verifyStripeSignature,
  type StripeEvent,
} from '../../lib/stripe'

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
subscriptionsRouter.get('/plans', async (c) => {
  const plans = await c.env.DB.prepare(`
    SELECT id, name, display_name, price_cents, mau_limit, storage_gb,
           bundle_retention, features
    FROM subscription_plans
    WHERE is_active = 1
    ORDER BY price_cents ASC
  `).all()

  return c.json({
    plans: plans.results?.map(formatPlan) ?? [],
  })
})

/**
 * GET /v1/subscriptions/me
 * Get current user's subscription (requires auth)
 */
subscriptionsRouter.get('/me', async (c) => {
  const userId = c.req.header('X-User-Id')

  if (!userId) {
    return c.json({ error: 'unauthorized', message: 'Authentication required' }, 401)
  }

  const subscription = await c.env.DB.prepare(`
    SELECT s.*, p.name as plan_name, p.display_name as plan_display_name,
           p.mau_limit, p.storage_gb, p.bundle_retention
    FROM subscriptions s
    JOIN subscription_plans p ON s.plan_id = p.id
    WHERE s.user_id = ? AND s.status != 'expired'
    ORDER BY s.created_at DESC
    LIMIT 1
  `).bind(userId).first()

  if (!subscription) {
    // Return free tier info for users without subscription
    const freePlan = await c.env.DB.prepare(`
      SELECT * FROM subscription_plans WHERE name = 'free'
    `).first()

    return c.json({
      subscription: null,
      plan: freePlan ? formatPlan(freePlan) : getDefaultFreePlan(),
    })
  }

  return c.json({
    subscription: formatSubscription(subscription),
    plan: {
      id: subscription.plan_id,
      name: subscription.plan_name,
      displayName: subscription.plan_display_name,
      mauLimit: subscription.mau_limit,
      storageGb: subscription.storage_gb,
      bundleRetention: subscription.bundle_retention,
    },
  })
})

/**
 * POST /v1/subscriptions/checkout
 * Create a Stripe checkout session (requires auth)
 */
subscriptionsRouter.post('/checkout', zValidator('json', checkoutSchema), async (c) => {
  const userId = c.req.header('X-User-Id')
  const body = c.req.valid('json')

  if (!userId) {
    return c.json({ error: 'unauthorized', message: 'Authentication required' }, 401)
  }

  // Get the plan
  const plan = await c.env.DB.prepare(`
    SELECT * FROM subscription_plans WHERE id = ? AND is_active = 1
  `).bind(body.planId).first<{ stripe_price_id: string | null }>()

  if (!plan) {
    return c.json({ error: 'not_found', message: 'Plan not found' }, 404)
  }

  if (!plan.stripe_price_id) {
    return c.json({ error: 'invalid_plan', message: 'Plan is not available for purchase' }, 400)
  }

  // Create checkout session
  const result = await createCheckoutSession(c.env.STRIPE_SECRET_KEY, {
    priceId: plan.stripe_price_id,
    successUrl: body.successUrl ?? `${c.env.DASHBOARD_URL}/settings/billing?success=true`,
    cancelUrl: body.cancelUrl ?? `${c.env.DASHBOARD_URL}/settings/billing?canceled=true`,
    clientReferenceId: userId,
    metadata: {
      plan_id: body.planId,
      user_id: userId,
    },
  })

  if (result.error) {
    return c.json({ error: 'stripe_error', message: result.error.message }, 500)
  }

  return c.json({ url: result.data?.url })
})

/**
 * POST /v1/subscriptions/portal
 * Create a Stripe customer portal session (requires auth)
 */
subscriptionsRouter.post('/portal', zValidator('json', portalSchema), async (c) => {
  const userId = c.req.header('X-User-Id')
  const body = c.req.valid('json')

  if (!userId) {
    return c.json({ error: 'unauthorized', message: 'Authentication required' }, 401)
  }

  // Get user's subscription with Stripe customer ID
  const subscription = await c.env.DB.prepare(`
    SELECT stripe_customer_id FROM subscriptions
    WHERE user_id = ? AND stripe_customer_id IS NOT NULL
    ORDER BY created_at DESC LIMIT 1
  `).bind(userId).first<{ stripe_customer_id: string }>()

  if (!subscription?.stripe_customer_id) {
    return c.json({ error: 'no_subscription', message: 'No active subscription found' }, 404)
  }

  // Create portal session
  const result = await createPortalSession(
    c.env.STRIPE_SECRET_KEY,
    subscription.stripe_customer_id,
    body.returnUrl ?? `${c.env.DASHBOARD_URL}/settings/billing`
  )

  if (result.error) {
    return c.json({ error: 'stripe_error', message: result.error.message }, 500)
  }

  return c.json({ url: result.data?.url })
})

/**
 * GET /v1/subscriptions/usage
 * Get usage statistics for current subscription (requires auth)
 */
subscriptionsRouter.get('/usage', async (c) => {
  const userId = c.req.header('X-User-Id')

  if (!userId) {
    return c.json({ error: 'unauthorized', message: 'Authentication required' }, 401)
  }

  // Get MAU count (unique devices in last 30 days)
  const mauResult = await c.env.DB.prepare(`
    SELECT COUNT(DISTINCT device_id) as mau
    FROM devices d
    JOIN apps a ON d.app_id = a.id
    WHERE a.owner_id = ? AND d.last_seen_at > ?
  `).bind(userId, Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60).first<{ mau: number }>()

  // Get storage usage (sum of bundle sizes)
  const storageResult = await c.env.DB.prepare(`
    SELECT COALESCE(SUM(r.bundle_size), 0) as storage_bytes
    FROM releases r
    JOIN apps a ON r.app_id = a.id
    WHERE a.owner_id = ?
  `).bind(userId).first<{ storage_bytes: number }>()

  // Get app count
  const appResult = await c.env.DB.prepare(`
    SELECT COUNT(*) as app_count FROM apps WHERE owner_id = ? AND deleted_at IS NULL
  `).bind(userId).first<{ app_count: number }>()

  return c.json({
    usage: {
      mau: mauResult?.mau ?? 0,
      storageBytes: storageResult?.storage_bytes ?? 0,
      storageGb: Math.round((storageResult?.storage_bytes ?? 0) / 1024 / 1024 / 1024 * 100) / 100,
      appCount: appResult?.app_count ?? 0,
    },
  })
})

/**
 * POST /v1/subscriptions/webhook
 * Handle Stripe webhooks
 */
subscriptionsRouter.post('/webhook', async (c) => {
  const signature = c.req.header('Stripe-Signature')
  const payload = await c.req.text()

  if (!signature) {
    return c.json({ error: 'missing_signature' }, 400)
  }

  // Verify signature
  const isValid = await verifyStripeSignature(
    payload,
    signature,
    c.env.STRIPE_WEBHOOK_SECRET
  )

  if (!isValid) {
    return c.json({ error: 'invalid_signature' }, 400)
  }

  const event: StripeEvent = JSON.parse(payload)

  // Handle event
  await handleStripeEvent(c.env.DB, event)

  return c.json({ received: true })
})

// =============================================================================
// Webhook Event Handlers
// =============================================================================

async function handleStripeEvent(db: D1Database, event: StripeEvent): Promise<void> {
  const now = Math.floor(Date.now() / 1000)

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as {
        client_reference_id: string
        customer: string
        subscription: string
        metadata: { plan_id: string }
      }

      // Create subscription record
      await db.prepare(`
        INSERT INTO subscriptions (id, user_id, plan_id, status, stripe_customer_id,
          stripe_subscription_id, created_at, updated_at)
        VALUES (?, ?, ?, 'active', ?, ?, ?, ?)
      `).bind(
        crypto.randomUUID(),
        session.client_reference_id,
        session.metadata.plan_id,
        session.customer,
        session.subscription,
        now,
        now
      ).run()
      break
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as {
        id: string
        status: string
        current_period_start: number
        current_period_end: number
        cancel_at_period_end: boolean
      }

      await db.prepare(`
        UPDATE subscriptions SET
          status = ?,
          current_period_start = ?,
          current_period_end = ?,
          cancel_at_period_end = ?,
          updated_at = ?
        WHERE stripe_subscription_id = ?
      `).bind(
        mapStripeStatus(subscription.status),
        subscription.current_period_start,
        subscription.current_period_end,
        subscription.cancel_at_period_end ? 1 : 0,
        now,
        subscription.id
      ).run()
      break
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as { id: string }

      await db.prepare(`
        UPDATE subscriptions SET status = 'expired', updated_at = ?
        WHERE stripe_subscription_id = ?
      `).bind(now, subscription.id).run()
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as { subscription: string }

      await db.prepare(`
        UPDATE subscriptions SET status = 'past_due', updated_at = ?
        WHERE stripe_subscription_id = ?
      `).bind(now, invoice.subscription).run()
      break
    }
  }
}

// =============================================================================
// Helpers
// =============================================================================

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

function mapStripeStatus(status: string): string {
  switch (status) {
    case 'active': return 'active'
    case 'trialing': return 'trialing'
    case 'past_due': return 'past_due'
    case 'canceled': return 'cancelled'
    default: return 'active'
  }
}

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
