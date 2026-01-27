/**
 * Billing Route Handlers
 *
 * Handlers for Stripe checkout, portal, and webhooks.
 */

import type { Context } from 'hono'
import type { Env } from '../../types/env'
import {
  createCheckoutSession,
  createPortalSession,
  verifyStripeSignature,
  type StripeEvent,
} from '../../lib/stripe'
import { handleStripeEvent } from './webhook-handlers'

/**
 * POST /v1/subscriptions/checkout
 * Create a Stripe checkout session (requires auth)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function createCheckout(c: Context<{ Bindings: Env }, string, any>) {
  const userId = c.req.header('X-User-Id')
  const body = c.req.valid('json') as {
    planId: string
    successUrl?: string
    cancelUrl?: string
  }

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
}

/**
 * POST /v1/subscriptions/portal
 * Create a Stripe customer portal session (requires auth)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function createPortal(c: Context<{ Bindings: Env }, string, any>) {
  const userId = c.req.header('X-User-Id')
  const body = c.req.valid('json') as { returnUrl?: string }

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
}

/**
 * POST /v1/subscriptions/webhook
 * Handle Stripe webhooks with idempotency
 */
export async function handleWebhook(c: Context<{ Bindings: Env }>) {
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

  const event = JSON.parse(payload) as StripeEvent
  const now = Math.floor(Date.now() / 1000)

  // Idempotency check - skip if already processed
  const existing = await c.env.DB.prepare(`
    SELECT id, processed FROM stripe_webhook_events WHERE id = ?
  `).bind(event.id).first<{ id: string; processed: number }>()

  if (existing?.processed) {
    return c.json({ received: true, skipped: true })
  }

  // Record event as being processed
  await c.env.DB.prepare(`
    INSERT INTO stripe_webhook_events (id, type, processed, created_at)
    VALUES (?, ?, 0, ?)
    ON CONFLICT(id) DO NOTHING
  `).bind(event.id, event.type, now).run()

  try {
    // Handle event
    await handleStripeEvent(c.env, event)

    // Mark as processed
    await c.env.DB.prepare(`
      UPDATE stripe_webhook_events SET processed = 1 WHERE id = ?
    `).bind(event.id).run()

    return c.json({ received: true })
  } catch (error) {
    // Record error
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    await c.env.DB.prepare(`
      UPDATE stripe_webhook_events SET error = ? WHERE id = ?
    `).bind(errorMsg, event.id).run()

    throw error
  }
}
