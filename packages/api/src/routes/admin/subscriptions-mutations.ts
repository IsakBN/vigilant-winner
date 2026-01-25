/**
 * Admin subscription mutation handlers
 *
 * Handlers for updating and granting subscriptions
 *
 * @agent admin-subscriptions
 */

import type { Context } from 'hono'
import { ERROR_CODES } from '@bundlenudge/shared'
import { logAdminAction } from '../../lib/admin/audit'
import { getAdminId } from '../../middleware/admin'
import type { Env } from '../../types/env'

type HonoContext = Context<{ Bindings: Env }>

interface UpdateSubscriptionBody {
  status?: 'active' | 'cancelled'
  planId?: string
  currentPeriodEnd?: number
  cancelAtPeriodEnd?: boolean
}

interface GrantSubscriptionBody {
  userId: string
  planId: string
  durationDays: number
  reason: string
}

/**
 * Update a subscription
 */
export async function updateSubscription(
  c: HonoContext,
  subscriptionId: string,
  body: UpdateSubscriptionBody
): Promise<Response> {
  const adminId = getAdminId(c)

  const subscription = await c.env.DB.prepare(`
    SELECT s.*, u.email as user_email, sp.name as plan_name
    FROM subscriptions s
    LEFT JOIN user u ON u.id = s.user_id
    LEFT JOIN subscription_plans sp ON sp.id = s.plan_id
    WHERE s.id = ?
  `).bind(subscriptionId).first<{
    id: string
    user_id: string
    plan_id: string
    status: string
    user_email: string | null
    plan_name: string | null
  }>()

  if (!subscription) {
    return c.json({ error: ERROR_CODES.NOT_FOUND, message: 'Subscription not found' }, 404)
  }

  if (body.planId) {
    const plan = await c.env.DB.prepare(
      'SELECT id FROM subscription_plans WHERE id = ? AND is_active = 1'
    ).bind(body.planId).first()
    if (!plan) {
      return c.json({ error: ERROR_CODES.INVALID_INPUT, message: 'Invalid plan ID' }, 400)
    }
  }

  const now = Date.now()
  const updates: string[] = ['updated_at = ?']
  const updateBindings: (string | number | null)[] = [now]

  if (body.status !== undefined) {
    updates.push('status = ?')
    updateBindings.push(body.status)
  }
  if (body.planId !== undefined) {
    updates.push('plan_id = ?')
    updateBindings.push(body.planId)
  }
  if (body.currentPeriodEnd !== undefined) {
    updates.push('current_period_end = ?')
    updateBindings.push(body.currentPeriodEnd)
  }
  if (body.cancelAtPeriodEnd !== undefined) {
    updates.push('cancel_at_period_end = ?')
    updateBindings.push(body.cancelAtPeriodEnd ? 1 : 0)
  }

  await c.env.DB.prepare(`
    UPDATE subscriptions SET ${updates.join(', ')} WHERE id = ?
  `).bind(...updateBindings, subscriptionId).run()

  await logAdminAction(c.env.DB, {
    adminId,
    action: 'update_subscription',
    targetUserId: subscription.user_id,
    details: {
      subscriptionId,
      userEmail: subscription.user_email,
      previousPlan: subscription.plan_name,
      previousStatus: subscription.status,
      changes: body,
    },
  })

  return c.json({ success: true, message: 'Subscription updated successfully' })
}

/**
 * Grant a subscription to a user
 */
export async function grantSubscription(c: HonoContext, body: GrantSubscriptionBody): Promise<Response> {
  const adminId = getAdminId(c)

  const user = await c.env.DB.prepare('SELECT id, email FROM user WHERE id = ?')
    .bind(body.userId).first<{ id: string; email: string }>()
  if (!user) {
    return c.json({ error: ERROR_CODES.NOT_FOUND, message: 'User not found' }, 404)
  }

  const plan = await c.env.DB.prepare(
    'SELECT id, name, display_name FROM subscription_plans WHERE id = ? AND is_active = 1'
  ).bind(body.planId).first<{ id: string; name: string; display_name: string }>()
  if (!plan) {
    return c.json({ error: ERROR_CODES.INVALID_INPUT, message: 'Invalid plan ID' }, 400)
  }

  const existingSubscription = await c.env.DB.prepare(`
    SELECT id, plan_id FROM subscriptions
    WHERE user_id = ? AND status IN ('active', 'trialing')
  `).bind(body.userId).first<{ id: string; plan_id: string }>()

  const now = Date.now()
  const periodEnd = now + (body.durationDays * 24 * 60 * 60 * 1000)
  let subscriptionId: string

  if (existingSubscription) {
    subscriptionId = existingSubscription.id
    await c.env.DB.prepare(`
      UPDATE subscriptions SET
        plan_id = ?, status = 'active', current_period_end = ?,
        cancel_at_period_end = 0, updated_at = ?
      WHERE id = ?
    `).bind(body.planId, periodEnd, now, existingSubscription.id).run()
  } else {
    subscriptionId = crypto.randomUUID()
    await c.env.DB.prepare(`
      INSERT INTO subscriptions (
        id, user_id, plan_id, status,
        current_period_start, current_period_end,
        cancel_at_period_end, created_at, updated_at
      )
      VALUES (?, ?, ?, 'active', ?, ?, 0, ?, ?)
    `).bind(subscriptionId, body.userId, body.planId, now, periodEnd, now, now).run()
  }

  await logAdminAction(c.env.DB, {
    adminId,
    action: 'grant_subscription',
    targetUserId: body.userId,
    details: {
      subscriptionId,
      userEmail: user.email,
      planId: body.planId,
      planName: plan.name,
      durationDays: body.durationDays,
      reason: body.reason,
      wasExtension: !!existingSubscription,
    },
  })

  return c.json({
    success: true,
    message: existingSubscription
      ? `Extended subscription to ${plan.display_name} for ${String(body.durationDays)} days`
      : `Granted ${plan.display_name} subscription for ${String(body.durationDays)} days`,
    subscriptionId,
    periodEnd,
  })
}
