/**
 * Subscription Limit Enforcement
 *
 * Utilities to check and enforce subscription plan limits
 * for MAU (Monthly Active Users) and storage.
 *
 * @agent fix-subscription-enforcement
 * @modified 2026-01-25
 */

import type { Env } from '../types/env'

// =============================================================================
// Types
// =============================================================================

export interface LimitCheckResult {
  allowed: boolean
  current: number
  limit: number
  percentage: number
  warning?: boolean
  message?: string
}

interface PlanLimits {
  mau_limit: number
  storage_gb: number
}

interface SubscriptionRow {
  plan_id: string
  status: string
}

// =============================================================================
// Constants
// =============================================================================

/** Percentage threshold at which to block (110% of limit) */
const HARD_LIMIT_PERCENTAGE = 110

/** Percentage threshold at which to warn (90% of limit) */
const WARNING_THRESHOLD_PERCENTAGE = 90

/** Default free plan limits */
const DEFAULT_FREE_PLAN: PlanLimits = {
  mau_limit: 10000,
  storage_gb: 20,
}

// =============================================================================
// MAU Limit Check
// =============================================================================

/**
 * Check if user is within their MAU (Monthly Active Users) limit
 *
 * MAU is defined as unique devices that have been active in the last 30 days.
 * Allows up to 110% of limit before blocking.
 */
export async function checkMAULimit(env: Env, userId: string): Promise<LimitCheckResult> {
  const planLimits = await getUserPlanLimits(env, userId)
  const currentMAU = await countUserMAU(env, userId)

  return calculateLimitResult(currentMAU, planLimits.mau_limit, 'MAU')
}

/**
 * Check MAU limit for a specific app owner
 * Used in update check endpoint where we need to find the app owner
 */
export async function checkMAULimitForApp(
  env: Env,
  appId: string
): Promise<LimitCheckResult & { ownerId: string | null }> {
  const appOwner = await getAppOwner(env, appId)

  if (!appOwner) {
    return {
      allowed: false,
      current: 0,
      limit: 0,
      percentage: 0,
      ownerId: null,
      message: 'App not found',
    }
  }

  const result = await checkMAULimit(env, appOwner)
  return { ...result, ownerId: appOwner }
}

// =============================================================================
// Storage Limit Check
// =============================================================================

/**
 * Check if user is within their storage limit
 *
 * Storage is the sum of all bundle sizes across all apps.
 * Allows up to 110% of limit before blocking.
 */
export async function checkStorageLimit(env: Env, userId: string): Promise<LimitCheckResult> {
  const planLimits = await getUserPlanLimits(env, userId)
  const currentStorageBytes = await sumUserStorage(env, userId)
  const limitBytes = planLimits.storage_gb * 1024 * 1024 * 1024 // Convert GB to bytes

  return calculateLimitResult(currentStorageBytes, limitBytes, 'storage')
}

/**
 * Check if adding a new bundle would exceed storage limit
 */
export async function checkStorageLimitWithAddition(
  env: Env,
  userId: string,
  additionalBytes: number
): Promise<LimitCheckResult> {
  const planLimits = await getUserPlanLimits(env, userId)
  const currentStorageBytes = await sumUserStorage(env, userId)
  const totalBytes = currentStorageBytes + additionalBytes
  const limitBytes = planLimits.storage_gb * 1024 * 1024 * 1024

  return calculateLimitResult(totalBytes, limitBytes, 'storage')
}

// =============================================================================
// Internal Helpers
// =============================================================================

/**
 * Get the plan limits for a user
 * Falls back to free plan if no subscription found
 */
async function getUserPlanLimits(env: Env, userId: string): Promise<PlanLimits> {
  const subscription = await env.DB.prepare(`
    SELECT s.plan_id, s.status
    FROM subscriptions s
    WHERE s.user_id = ? AND s.status IN ('active', 'trialing')
    ORDER BY s.created_at DESC
    LIMIT 1
  `).bind(userId).first<SubscriptionRow>()

  if (!subscription) {
    return DEFAULT_FREE_PLAN
  }

  const plan = await env.DB.prepare(`
    SELECT mau_limit, storage_gb
    FROM subscription_plans
    WHERE id = ?
  `).bind(subscription.plan_id).first<PlanLimits>()

  return plan ?? DEFAULT_FREE_PLAN
}

/**
 * Count unique devices active in the last 30 days for all user's apps
 */
async function countUserMAU(env: Env, userId: string): Promise<number> {
  const thirtyDaysAgo = Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60

  const result = await env.DB.prepare(`
    SELECT COUNT(DISTINCT d.device_id) as mau
    FROM devices d
    JOIN apps a ON d.app_id = a.id
    WHERE a.owner_id = ? AND d.last_seen_at > ?
  `).bind(userId, thirtyDaysAgo).first<{ mau: number }>()

  return result?.mau ?? 0
}

/**
 * Sum total storage used across all user's apps
 */
async function sumUserStorage(env: Env, userId: string): Promise<number> {
  const result = await env.DB.prepare(`
    SELECT COALESCE(SUM(r.bundle_size), 0) as storage_bytes
    FROM releases r
    JOIN apps a ON r.app_id = a.id
    WHERE a.owner_id = ?
  `).bind(userId).first<{ storage_bytes: number }>()

  return result?.storage_bytes ?? 0
}

/**
 * Get the owner ID for an app
 */
async function getAppOwner(env: Env, appId: string): Promise<string | null> {
  const app = await env.DB.prepare(`
    SELECT owner_id FROM apps WHERE id = ? AND deleted_at IS NULL
  `).bind(appId).first<{ owner_id: string }>()

  return app?.owner_id ?? null
}

/**
 * Calculate limit result with percentage and warning/block thresholds
 */
function calculateLimitResult(
  current: number,
  limit: number,
  limitType: 'MAU' | 'storage'
): LimitCheckResult {
  if (limit === 0) {
    return {
      allowed: false,
      current,
      limit,
      percentage: 0,
      message: `No ${limitType} limit configured`,
    }
  }

  const percentage = Math.round((current / limit) * 100)
  const warning = percentage >= WARNING_THRESHOLD_PERCENTAGE && percentage < HARD_LIMIT_PERCENTAGE
  const allowed = percentage < HARD_LIMIT_PERCENTAGE

  let message: string | undefined

  if (!allowed) {
    message = formatExceededMessage(limitType, current, limit, percentage)
  } else if (warning) {
    message = formatWarningMessage(limitType, percentage)
  }

  return { allowed, current, limit, percentage, warning, message }
}

function formatExceededMessage(
  limitType: 'MAU' | 'storage',
  current: number,
  limit: number,
  percentage: number
): string {
  if (limitType === 'MAU') {
    return `MAU limit exceeded (${current.toLocaleString()} / ${limit.toLocaleString()}, ${percentage}%). Please upgrade your plan.`
  }
  const currentGb = (current / 1024 / 1024 / 1024).toFixed(2)
  const limitGb = (limit / 1024 / 1024 / 1024).toFixed(2)
  return `Storage limit exceeded (${currentGb} GB / ${limitGb} GB, ${percentage}%). Please upgrade your plan.`
}

function formatWarningMessage(limitType: 'MAU' | 'storage', percentage: number): string {
  return `Approaching ${limitType} limit (${percentage}% used). Consider upgrading your plan.`
}
