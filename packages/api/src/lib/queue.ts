/**
 * Queue utilities for build job routing
 *
 * Routes build jobs to priority queues based on user subscription tier.
 * P0 = Enterprise (highest priority)
 * P1 = Team
 * P2 = Pro
 * P3 = Free (lowest priority)
 *
 * @agent queue-system
 * @created 2026-01-26
 */

import type { Env, BuildJobMessage } from '../types/env'

// =============================================================================
// Types
// =============================================================================

interface SubscriptionRow {
  plan_name: string
}

// =============================================================================
// Priority Resolution
// =============================================================================

/**
 * Get subscription tier priority (0-3) for a user
 * Higher tiers get lower numbers (higher priority)
 */
export async function getUserPriority(
  db: D1Database,
  userId: string
): Promise<0 | 1 | 2 | 3> {
  const sub = await db.prepare(`
    SELECT sp.name as plan_name
    FROM subscriptions s
    JOIN subscription_plans sp ON s.plan_id = sp.id
    WHERE s.user_id = ? AND s.status IN ('active', 'trialing')
    ORDER BY s.created_at DESC
    LIMIT 1
  `).bind(userId).first<SubscriptionRow>()

  if (!sub) {
    return 3 // Free tier (no subscription)
  }

  return mapPlanNameToPriority(sub.plan_name)
}

/**
 * Map plan name to priority level
 */
function mapPlanNameToPriority(planName: string): 0 | 1 | 2 | 3 {
  const normalized = planName.toLowerCase()

  switch (normalized) {
    case 'enterprise':
      return 0
    case 'team':
      return 1
    case 'pro':
      return 2
    default:
      return 3 // Free or unknown
  }
}

// =============================================================================
// Queue Selection
// =============================================================================

/**
 * Get the appropriate queue for a priority level
 */
export function getQueueForPriority(
  env: Env,
  priority: 0 | 1 | 2 | 3
): Queue<BuildJobMessage> {
  switch (priority) {
    case 0:
      return env.BUILD_QUEUE_P0
    case 1:
      return env.BUILD_QUEUE_P1
    case 2:
      return env.BUILD_QUEUE_P2
    case 3:
    default:
      return env.BUILD_QUEUE_P3
  }
}

// =============================================================================
// Enqueue Operations
// =============================================================================

/**
 * Enqueue a build job to the appropriate priority queue
 */
export async function enqueueBuild(
  env: Env,
  buildId: string,
  buildType: 'ios' | 'android',
  appId: string,
  userId: string
): Promise<{ queued: boolean; priority: 0 | 1 | 2 | 3 }> {
  const priority = await getUserPriority(env.DB, userId)
  const queue = getQueueForPriority(env, priority)

  const message: BuildJobMessage = {
    buildId,
    buildType,
    appId,
    priority,
    createdAt: Date.now(),
  }

  await queue.send(message)

  return { queued: true, priority }
}

// =============================================================================
// Dead Letter Queue
// =============================================================================

/**
 * Move a failed job to the dead letter queue
 */
export async function moveToDeadLetter(
  env: Env,
  message: BuildJobMessage,
  error: string
): Promise<void> {
  const dlqMessage = {
    ...message,
    error,
    failedAt: Date.now(),
  }

  await env.BUILD_QUEUE_DLQ.send(dlqMessage)
}
