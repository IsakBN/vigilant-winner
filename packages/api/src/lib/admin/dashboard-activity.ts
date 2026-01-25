/**
 * Dashboard activity feed helpers
 *
 * Fetches recent activity across the platform for admin visibility
 *
 * @module lib/admin/dashboard-activity
 */

// =============================================================================
// Types
// =============================================================================

export type ActivityType =
  | 'user_signup'
  | 'app_created'
  | 'release_published'
  | 'subscription_started'
  | 'subscription_cancelled'

export interface ActivityItem {
  id: string
  type: ActivityType
  userId: string
  userEmail: string
  metadata: Record<string, unknown>
  createdAt: number
}

export interface ActivityFeedOptions {
  limit: number
  offset: number
  type?: ActivityType
}

export interface ActivityFeedResult {
  items: ActivityItem[]
  total: number
}

// =============================================================================
// Main Function
// =============================================================================

export async function getActivityFeed(
  db: D1Database,
  options: ActivityFeedOptions
): Promise<ActivityFeedResult> {
  const { limit, offset, type } = options
  const items: ActivityItem[] = []

  // Get total count across all activity types
  const countResult = await db.prepare(`
    SELECT COUNT(*) as total FROM (
      SELECT id FROM user
      UNION ALL
      SELECT id FROM apps WHERE deleted_at IS NULL
      UNION ALL
      SELECT id FROM releases
      UNION ALL
      SELECT id FROM subscriptions WHERE status IN ('active', 'cancelled')
    ) combined
  `).first<{ total: number }>()

  const total = countResult?.total ?? 0

  // Fetch activities from each source in parallel
  const [users, apps, releases, subscriptions] = await Promise.all([
    fetchRecentSignups(db, limit),
    fetchRecentApps(db, limit),
    fetchRecentReleases(db, limit),
    fetchRecentSubscriptions(db, limit),
  ])

  items.push(...users, ...apps, ...releases, ...subscriptions)

  // Sort all items by createdAt descending
  items.sort((a, b) => b.createdAt - a.createdAt)

  // Filter by type if specified
  const filteredItems = type ? items.filter(i => i.type === type) : items

  // Apply pagination
  const paginatedItems = filteredItems.slice(offset, offset + limit)

  return {
    items: paginatedItems,
    total: type ? filteredItems.length : total,
  }
}

// =============================================================================
// Data Fetchers
// =============================================================================

async function fetchRecentSignups(db: D1Database, limit: number): Promise<ActivityItem[]> {
  const result = await db.prepare(`
    SELECT id, email, name, created_at
    FROM user
    ORDER BY created_at DESC
    LIMIT ?
  `).bind(limit).all<{ id: string; email: string; name: string | null; created_at: number }>()

  return result.results.map(user => ({
    id: `signup_${user.id}`,
    type: 'user_signup' as const,
    userId: user.id,
    userEmail: user.email,
    metadata: { name: user.name },
    createdAt: user.created_at,
  }))
}

async function fetchRecentApps(db: D1Database, limit: number): Promise<ActivityItem[]> {
  const result = await db.prepare(`
    SELECT a.id, a.name, a.platform, a.owner_id, a.created_at, u.email
    FROM apps a
    LEFT JOIN user u ON a.owner_id = u.id
    WHERE a.deleted_at IS NULL
    ORDER BY a.created_at DESC
    LIMIT ?
  `).bind(limit).all<{
    id: string
    name: string
    platform: string
    owner_id: string
    created_at: number
    email: string | null
  }>()

  return result.results.map(app => ({
    id: `app_${app.id}`,
    type: 'app_created' as const,
    userId: app.owner_id,
    userEmail: app.email ?? 'unknown',
    metadata: { appId: app.id, appName: app.name, platform: app.platform },
    createdAt: app.created_at,
  }))
}

async function fetchRecentReleases(db: D1Database, limit: number): Promise<ActivityItem[]> {
  const result = await db.prepare(`
    SELECT r.id, r.version, r.app_id, r.created_at, a.name as app_name, a.owner_id, u.email
    FROM releases r
    INNER JOIN apps a ON r.app_id = a.id
    LEFT JOIN user u ON a.owner_id = u.id
    ORDER BY r.created_at DESC
    LIMIT ?
  `).bind(limit).all<{
    id: string
    version: string
    app_id: string
    created_at: number
    app_name: string
    owner_id: string
    email: string | null
  }>()

  return result.results.map(release => ({
    id: `release_${release.id}`,
    type: 'release_published' as const,
    userId: release.owner_id,
    userEmail: release.email ?? 'unknown',
    metadata: { releaseId: release.id, version: release.version, appName: release.app_name },
    createdAt: release.created_at,
  }))
}

async function fetchRecentSubscriptions(db: D1Database, limit: number): Promise<ActivityItem[]> {
  const result = await db.prepare(`
    SELECT s.id, s.user_id, s.status, s.created_at, s.updated_at, u.email, sp.name as plan_name
    FROM subscriptions s
    LEFT JOIN user u ON s.user_id = u.id
    LEFT JOIN subscription_plans sp ON s.plan_id = sp.id
    WHERE s.status IN ('active', 'cancelled')
    ORDER BY s.updated_at DESC
    LIMIT ?
  `).bind(limit).all<{
    id: string
    user_id: string
    status: string
    created_at: number
    updated_at: number
    email: string | null
    plan_name: string | null
  }>()

  return result.results.map(sub => ({
    id: `sub_${sub.id}_${sub.status}`,
    type: sub.status === 'active' ? 'subscription_started' as const : 'subscription_cancelled' as const,
    userId: sub.user_id,
    userEmail: sub.email ?? 'unknown',
    metadata: { subscriptionId: sub.id, plan: sub.plan_name },
    createdAt: sub.status === 'active' ? sub.created_at : sub.updated_at,
  }))
}
