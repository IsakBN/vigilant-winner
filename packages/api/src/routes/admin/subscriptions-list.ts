/**
 * Admin subscription list handlers
 *
 * Handlers for listing subscriptions and plans
 *
 * @agent admin-subscriptions
 */

import type { Context } from 'hono'
import { logAdminAction } from '../../lib/admin/audit'
import { getAdminId } from '../../middleware/admin'
import type { Env } from '../../types/env'

type HonoContext = Context<{ Bindings: Env }>

interface ListSubscriptionsQuery {
  limit: number
  offset: number
  status?: string
  planId?: string
  userId?: string
}

/**
 * List subscriptions with filtering and stats
 */
export async function listSubscriptions(
  c: HonoContext,
  query: ListSubscriptionsQuery
): Promise<Response> {
  const { limit, offset, status, planId, userId } = query
  const adminId = getAdminId(c)

  const conditions: string[] = []
  const bindings: (string | number)[] = []

  if (status) {
    conditions.push('s.status = ?')
    bindings.push(status)
  }
  if (planId) {
    conditions.push('s.plan_id = ?')
    bindings.push(planId)
  }
  if (userId) {
    conditions.push('s.user_id = ?')
    bindings.push(userId)
  }

  const whereClause = conditions.length > 0
    ? `WHERE ${conditions.join(' AND ')}`
    : ''

  const countResult = await c.env.DB.prepare(`
    SELECT COUNT(*) as total FROM subscriptions s ${whereClause}
  `).bind(...bindings).first<{ total: number }>()

  const total = countResult?.total ?? 0

  const results = await c.env.DB.prepare(`
    SELECT
      s.id, s.user_id, s.plan_id, s.status,
      s.current_period_start, s.current_period_end,
      s.cancel_at_period_end, s.stripe_subscription_id, s.created_at,
      u.email as user_email,
      sp.name as plan_name, sp.display_name as plan_display
    FROM subscriptions s
    LEFT JOIN user u ON u.id = s.user_id
    LEFT JOIN subscription_plans sp ON sp.id = s.plan_id
    ${whereClause}
    ORDER BY s.created_at DESC
    LIMIT ? OFFSET ?
  `).bind(...bindings, limit, offset).all<{
    id: string
    user_id: string
    plan_id: string
    status: string
    current_period_start: number | null
    current_period_end: number | null
    cancel_at_period_end: number | null
    stripe_subscription_id: string | null
    created_at: number
    user_email: string | null
    plan_name: string | null
    plan_display: string | null
  }>()

  const mrrResult = await c.env.DB.prepare(`
    SELECT SUM(sp.price_cents) as total_mrr
    FROM subscriptions s
    JOIN subscription_plans sp ON sp.id = s.plan_id
    WHERE s.status = 'active'
  `).first<{ total_mrr: number | null }>()

  const planDistribution = await c.env.DB.prepare(`
    SELECT sp.name, sp.display_name, COUNT(*) as count
    FROM subscriptions s
    JOIN subscription_plans sp ON sp.id = s.plan_id
    WHERE s.status = 'active'
    GROUP BY sp.id
    ORDER BY count DESC
  `).all<{ name: string; display_name: string; count: number }>()

  await logAdminAction(c.env.DB, {
    adminId,
    action: 'view_subscriptions',
    details: { filters: { status, planId, userId }, count: results.results.length },
  })

  return c.json({
    subscriptions: results.results.map((s) => ({
      id: s.id,
      userId: s.user_id,
      userEmail: s.user_email,
      planId: s.plan_id,
      planName: s.plan_name,
      status: s.status,
      currentPeriodStart: s.current_period_start,
      currentPeriodEnd: s.current_period_end,
      cancelAtPeriodEnd: s.cancel_at_period_end === 1,
      stripeSubscriptionId: s.stripe_subscription_id,
      createdAt: s.created_at,
    })),
    stats: {
      mrrCents: mrrResult?.total_mrr ?? 0,
      planDistribution: planDistribution.results,
    },
    pagination: { total, limit, offset, hasMore: offset + results.results.length < total },
  })
}

/**
 * List all subscription plans
 */
export async function listPlans(c: HonoContext): Promise<Response> {
  const adminId = getAdminId(c)

  const plans = await c.env.DB.prepare(`
    SELECT
      id, name, display_name, price_cents, stripe_price_id,
      mau_limit, storage_gb, bundle_retention, features,
      is_active, created_at
    FROM subscription_plans
    ORDER BY price_cents ASC
  `).all<{
    id: string
    name: string
    display_name: string
    price_cents: number
    stripe_price_id: string | null
    mau_limit: number
    storage_gb: number
    bundle_retention: number
    features: string | null
    is_active: number
    created_at: number
  }>()

  const subscriberCounts = await c.env.DB.prepare(`
    SELECT plan_id, COUNT(*) as count
    FROM subscriptions
    WHERE status = 'active'
    GROUP BY plan_id
  `).all<{ plan_id: string; count: number }>()

  const countsMap = new Map(subscriberCounts.results.map((r) => [r.plan_id, r.count]))

  await logAdminAction(c.env.DB, { adminId, action: 'view_subscription_plans' })

  return c.json({
    plans: plans.results.map((p) => ({
      id: p.id,
      name: p.name,
      displayName: p.display_name,
      priceCents: p.price_cents,
      stripePriceId: p.stripe_price_id,
      mauLimit: p.mau_limit,
      storageGb: p.storage_gb,
      bundleRetention: p.bundle_retention,
      features: p.features ? (JSON.parse(p.features) as string[]) : [],
      isActive: p.is_active === 1,
      subscriberCount: countsMap.get(p.id) ?? 0,
      createdAt: p.created_at,
    })),
  })
}
