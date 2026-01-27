/**
 * Subscription Helpers
 *
 * Helper functions for formatting subscription and plan data.
 */

// =============================================================================
// Types
// =============================================================================

export interface PlanRecord {
  id: string
  name: string
  display_name: string
  price_cents: number
  mau_limit: number
  storage_gb: number
  bundle_retention: number
  features: string | null
}

export interface SubscriptionRecord {
  id: string
  plan_id: string
  status: string
  current_period_start: number
  current_period_end: number
  cancel_at_period_end: number
}

// =============================================================================
// Formatters
// =============================================================================

export function formatPlan(plan: PlanRecord): {
  id: string
  name: string
  displayName: string
  priceCents: number
  mauLimit: number
  storageGb: number
  bundleRetention: number
  features: unknown[]
} {
  return {
    id: plan.id,
    name: plan.name,
    displayName: plan.display_name,
    priceCents: plan.price_cents,
    mauLimit: plan.mau_limit,
    storageGb: plan.storage_gb,
    bundleRetention: plan.bundle_retention,
    features: plan.features ? (JSON.parse(plan.features) as unknown[]) : [],
  }
}

export function formatSubscription(sub: SubscriptionRecord): {
  id: string
  planId: string
  status: string
  currentPeriodStart: number
  currentPeriodEnd: number
  cancelAtPeriodEnd: boolean
} {
  return {
    id: sub.id,
    planId: sub.plan_id,
    status: sub.status,
    currentPeriodStart: sub.current_period_start,
    currentPeriodEnd: sub.current_period_end,
    cancelAtPeriodEnd: Boolean(sub.cancel_at_period_end),
  }
}

export function getDefaultFreePlan(): {
  id: string
  name: string
  displayName: string
  priceCents: number
  mauLimit: number
  storageGb: number
  bundleRetention: number
} {
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
