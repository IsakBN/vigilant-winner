/**
 * Information Route Handlers
 *
 * Handlers for plans, subscriptions, and usage information.
 */

import type { Context } from 'hono'
import type { Env } from '../../types/env'
import {
  formatPlan,
  formatSubscription,
  getDefaultFreePlan,
  type PlanRecord,
  type SubscriptionRecord,
} from './helpers'

/**
 * GET /v1/subscriptions/plans
 * List available subscription plans (public)
 */
export async function listPlans(c: Context<{ Bindings: Env }>) {
  const plans = await c.env.DB.prepare(`
    SELECT id, name, display_name, price_cents, mau_limit, storage_gb,
           bundle_retention, features
    FROM subscription_plans
    WHERE is_active = 1
    ORDER BY price_cents ASC
  `).all()

  return c.json({
    plans: (plans.results as unknown as PlanRecord[]).map(formatPlan),
  })
}

/**
 * GET /v1/subscriptions/me
 * Get current user's subscription (requires auth)
 */
export async function getCurrentSubscription(c: Context<{ Bindings: Env }>) {
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
      plan: freePlan ? formatPlan(freePlan as unknown as PlanRecord) : getDefaultFreePlan(),
    })
  }

  return c.json({
    subscription: formatSubscription(subscription as unknown as SubscriptionRecord),
    plan: {
      id: subscription.plan_id,
      name: subscription.plan_name,
      displayName: subscription.plan_display_name,
      mauLimit: subscription.mau_limit,
      storageGb: subscription.storage_gb,
      bundleRetention: subscription.bundle_retention,
    },
  })
}

/**
 * GET /v1/subscriptions/usage
 * Get usage statistics for current subscription (requires auth)
 */
export async function getUsage(c: Context<{ Bindings: Env }>) {
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
}
