# Feature: api/admin-subscriptions

Implement admin subscription management.

## Knowledge Docs to Read First

- `.claude/knowledge/API_FEATURES.md` → Admin endpoints
- `.claude/knowledge/IMPLEMENTATION_DETAILS.md` → Stripe integration

## Dependencies

- `api/admin-auth` (must complete first)
- `api/stripe-billing` (must complete first)

## What to Implement

### 1. Admin Subscriptions Routes

```typescript
// packages/api/src/routes/admin/subscriptions.ts
import { Hono } from 'hono'
import { adminMiddleware } from '../../middleware/admin'
import Stripe from 'stripe'
import { logAdminAction } from '../../lib/admin-audit'

const subscriptions = new Hono()

subscriptions.use('*', adminMiddleware)

// List all subscriptions
subscriptions.get('/', async (c) => {
  const limit = parseInt(c.req.query('limit') || '50')
  const offset = parseInt(c.req.query('offset') || '0')
  const status = c.req.query('status') // active, cancelled, past_due
  const planId = c.req.query('plan')

  let query = `
    SELECT
      s.*,
      u.email as user_email,
      u.name as user_name
    FROM subscriptions s
    JOIN users u ON u.id = s.user_id
    WHERE 1=1
  `

  const params: unknown[] = []

  if (status) {
    query += ' AND s.status = ?'
    params.push(status)
  }

  if (planId) {
    query += ' AND s.plan_id = ?'
    params.push(planId)
  }

  query += ' ORDER BY s.created_at DESC LIMIT ? OFFSET ?'
  params.push(limit, offset)

  const results = await c.env.DB.prepare(query).bind(...params).all()

  // Get totals by plan
  const planStats = await c.env.DB.prepare(`
    SELECT plan_id, COUNT(*) as count
    FROM subscriptions WHERE status = 'active'
    GROUP BY plan_id
  `).all()

  return c.json({
    subscriptions: results.results,
    planStats: planStats.results,
    limit,
    offset,
  })
})

// Get subscription details
subscriptions.get('/:subscriptionId', async (c) => {
  const subscriptionId = c.req.param('subscriptionId')

  const subscription = await c.env.DB.prepare(`
    SELECT
      s.*,
      u.id as user_id,
      u.email as user_email,
      u.name as user_name
    FROM subscriptions s
    JOIN users u ON u.id = s.user_id
    WHERE s.id = ?
  `).bind(subscriptionId).first()

  if (!subscription) {
    return c.json({ error: 'NOT_FOUND' }, 404)
  }

  // Get Stripe subscription details if exists
  let stripeDetails = null
  if (subscription.stripe_subscription_id) {
    const stripe = new Stripe(c.env.STRIPE_SECRET_KEY)
    try {
      stripeDetails = await stripe.subscriptions.retrieve(subscription.stripe_subscription_id)
    } catch (error) {
      console.error('Failed to fetch Stripe subscription:', error)
    }
  }

  // Get usage stats
  const usage = await c.env.DB.prepare(`
    SELECT
      (SELECT COUNT(DISTINCT device_id) FROM device_events WHERE app_id IN (SELECT id FROM apps WHERE user_id = ?) AND timestamp >= datetime('now', '-30 days')) as mau,
      (SELECT SUM(bundle_size) FROM releases WHERE app_id IN (SELECT id FROM apps WHERE user_id = ?)) as storage_used
  `).bind(subscription.user_id, subscription.user_id).first()

  return c.json({
    subscription,
    stripeDetails,
    usage,
  })
})

// Change subscription plan (admin override)
subscriptions.post('/:subscriptionId/change-plan', async (c) => {
  const subscriptionId = c.req.param('subscriptionId')
  const admin = c.get('adminUser')
  const { planId, reason } = await c.req.json()

  const subscription = await c.env.DB.prepare(
    'SELECT * FROM subscriptions WHERE id = ?'
  ).bind(subscriptionId).first()

  if (!subscription) {
    return c.json({ error: 'NOT_FOUND' }, 404)
  }

  const oldPlan = subscription.plan_id

  // If has Stripe subscription, update in Stripe
  if (subscription.stripe_subscription_id) {
    const stripe = new Stripe(c.env.STRIPE_SECRET_KEY)
    const priceId = getPriceIdForPlan(planId)

    try {
      await stripe.subscriptions.update(subscription.stripe_subscription_id, {
        items: [{
          id: subscription.stripe_item_id,
          price: priceId,
        }],
        proration_behavior: 'none', // Admin changes don't prorate
      })
    } catch (error) {
      return c.json({ error: 'STRIPE_ERROR', message: error.message }, 500)
    }
  }

  // Update local database
  await c.env.DB.prepare(
    'UPDATE subscriptions SET plan_id = ?, updated_at = datetime("now") WHERE id = ?'
  ).bind(planId, subscriptionId).run()

  // Log admin action
  await logAdminAction(c.env, admin.email, 'subscription.plan_changed', {
    subscriptionId,
    userId: subscription.user_id,
    oldPlan,
    newPlan: planId,
    reason,
  })

  return c.json({ success: true, oldPlan, newPlan: planId })
})

// Extend subscription (add time)
subscriptions.post('/:subscriptionId/extend', async (c) => {
  const subscriptionId = c.req.param('subscriptionId')
  const admin = c.get('adminUser')
  const { days, reason } = await c.req.json()

  if (!days || days < 1 || days > 365) {
    return c.json({ error: 'Invalid days (1-365)' }, 400)
  }

  const subscription = await c.env.DB.prepare(
    'SELECT * FROM subscriptions WHERE id = ?'
  ).bind(subscriptionId).first()

  if (!subscription) {
    return c.json({ error: 'NOT_FOUND' }, 404)
  }

  const currentEnd = new Date(subscription.current_period_end)
  const newEnd = new Date(currentEnd.getTime() + days * 24 * 60 * 60 * 1000)

  // Update local database
  await c.env.DB.prepare(
    'UPDATE subscriptions SET current_period_end = ?, updated_at = datetime("now") WHERE id = ?'
  ).bind(newEnd.toISOString(), subscriptionId).run()

  // Log admin action
  await logAdminAction(c.env, admin.email, 'subscription.extended', {
    subscriptionId,
    userId: subscription.user_id,
    daysAdded: days,
    oldEnd: subscription.current_period_end,
    newEnd: newEnd.toISOString(),
    reason,
  })

  return c.json({
    success: true,
    oldEnd: subscription.current_period_end,
    newEnd: newEnd.toISOString(),
  })
})

// Cancel subscription
subscriptions.post('/:subscriptionId/cancel', async (c) => {
  const subscriptionId = c.req.param('subscriptionId')
  const admin = c.get('adminUser')
  const { immediate, reason } = await c.req.json()

  const subscription = await c.env.DB.prepare(
    'SELECT * FROM subscriptions WHERE id = ?'
  ).bind(subscriptionId).first()

  if (!subscription) {
    return c.json({ error: 'NOT_FOUND' }, 404)
  }

  // Cancel in Stripe if exists
  if (subscription.stripe_subscription_id) {
    const stripe = new Stripe(c.env.STRIPE_SECRET_KEY)
    try {
      if (immediate) {
        await stripe.subscriptions.cancel(subscription.stripe_subscription_id)
      } else {
        await stripe.subscriptions.update(subscription.stripe_subscription_id, {
          cancel_at_period_end: true,
        })
      }
    } catch (error) {
      return c.json({ error: 'STRIPE_ERROR', message: error.message }, 500)
    }
  }

  // Update local database
  await c.env.DB.prepare(`
    UPDATE subscriptions SET
      status = ?,
      cancelled_at = datetime('now'),
      updated_at = datetime('now')
    WHERE id = ?
  `).bind(immediate ? 'cancelled' : 'cancelling', subscriptionId).run()

  // Log admin action
  await logAdminAction(c.env, admin.email, 'subscription.cancelled', {
    subscriptionId,
    userId: subscription.user_id,
    immediate,
    reason,
  })

  return c.json({ success: true, immediate })
})

// Refund payment
subscriptions.post('/:subscriptionId/refund', async (c) => {
  const subscriptionId = c.req.param('subscriptionId')
  const admin = c.get('adminUser')
  const { paymentIntentId, amount, reason } = await c.req.json()

  if (!paymentIntentId) {
    return c.json({ error: 'Payment intent ID required' }, 400)
  }

  const stripe = new Stripe(c.env.STRIPE_SECRET_KEY)

  try {
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: amount ? Math.round(amount * 100) : undefined, // Convert to cents, or full refund
      reason: 'requested_by_customer',
    })

    // Log admin action
    await logAdminAction(c.env, admin.email, 'subscription.refunded', {
      subscriptionId,
      paymentIntentId,
      amount: refund.amount / 100,
      reason,
    })

    return c.json({
      success: true,
      refundId: refund.id,
      amount: refund.amount / 100,
    })
  } catch (error) {
    return c.json({ error: 'STRIPE_ERROR', message: error.message }, 500)
  }
})

// Grant free trial/credits
subscriptions.post('/grant', async (c) => {
  const admin = c.get('adminUser')
  const { userId, planId, durationDays, reason } = await c.req.json()

  // Create or update subscription
  const existingSubscription = await c.env.DB.prepare(
    'SELECT id FROM subscriptions WHERE user_id = ?'
  ).bind(userId).first()

  const periodEnd = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000)

  if (existingSubscription) {
    await c.env.DB.prepare(`
      UPDATE subscriptions SET
        plan_id = ?,
        status = 'active',
        current_period_end = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `).bind(planId, periodEnd.toISOString(), existingSubscription.id).run()
  } else {
    await c.env.DB.prepare(`
      INSERT INTO subscriptions (id, user_id, plan_id, status, current_period_start, current_period_end, created_at, updated_at)
      VALUES (?, ?, ?, 'active', datetime('now'), ?, datetime('now'), datetime('now'))
    `).bind(crypto.randomUUID(), userId, planId, periodEnd.toISOString()).run()
  }

  // Log admin action
  await logAdminAction(c.env, admin.email, 'subscription.granted', {
    userId,
    planId,
    durationDays,
    reason,
  })

  return c.json({ success: true, expiresAt: periodEnd.toISOString() })
})

export default subscriptions
```

## Files to Create

1. `packages/api/src/routes/admin/subscriptions.ts`

## Tests Required

```typescript
describe('Admin Subscriptions', () => {
  it('lists subscriptions with filters', async () => {
    const response = await adminRequest('GET', '/admin/subscriptions?status=active')
    expect(response.status).toBe(200)
    expect(response.body.subscriptions).toBeDefined()
    expect(response.body.planStats).toBeDefined()
  })

  it('changes subscription plan', async () => {
    const response = await adminRequest('POST', `/admin/subscriptions/${subId}/change-plan`, {
      planId: 'team',
      reason: 'Customer upgrade',
    })
    expect(response.body.newPlan).toBe('team')
  })

  it('extends subscription', async () => {
    const response = await adminRequest('POST', `/admin/subscriptions/${subId}/extend`, {
      days: 30,
      reason: 'Goodwill',
    })
    expect(response.body.success).toBe(true)
  })

  it('grants free subscription', async () => {
    const response = await adminRequest('POST', '/admin/subscriptions/grant', {
      userId: testUserId,
      planId: 'pro',
      durationDays: 90,
      reason: 'Partner program',
    })
    expect(response.body.success).toBe(true)
  })
})
```

## Acceptance Criteria

- [ ] List subscriptions with filters
- [ ] View subscription details with Stripe info
- [ ] Change plan (admin override)
- [ ] Extend subscription period
- [ ] Cancel subscription (immediate or end of period)
- [ ] Refund payments
- [ ] Grant free subscriptions
- [ ] All actions logged
- [ ] Tests pass
