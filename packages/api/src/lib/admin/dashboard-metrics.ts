/**
 * Dashboard metrics calculation helpers
 *
 * Calculates system-wide metrics for admin dashboard overview
 *
 * @module lib/admin/dashboard-metrics
 */

// =============================================================================
// Constants
// =============================================================================

const ONE_DAY_MS = 24 * 60 * 60 * 1000
const SEVEN_DAYS_MS = 7 * ONE_DAY_MS
const THIRTY_DAYS_MS = 30 * ONE_DAY_MS

// =============================================================================
// Types
// =============================================================================

export interface DashboardOverview {
  users: {
    total: number
    active: number
    newToday: number
    newThisWeek: number
    newThisMonth: number
  }
  apps: {
    total: number
    active: number
    newThisWeek: number
  }
  devices: {
    total: number
    active: number
    byPlatform: { ios: number; android: number }
  }
  releases: {
    total: number
    thisWeek: number
    avgBundleSize: number
  }
  subscriptions: {
    byPlan: Record<string, number>
    mrr: number
    churnRate: number
  }
}

// =============================================================================
// Main Calculator
// =============================================================================

export async function calculateOverviewMetrics(db: D1Database): Promise<DashboardOverview> {
  const now = Date.now()
  const todayStart = now - (now % ONE_DAY_MS)
  const weekAgo = now - SEVEN_DAYS_MS
  const monthAgo = now - THIRTY_DAYS_MS

  const [userMetrics, appMetrics, deviceMetrics, releaseMetrics, subscriptionMetrics] =
    await Promise.all([
      calculateUserMetrics(db, todayStart, weekAgo, monthAgo),
      calculateAppMetrics(db, weekAgo, monthAgo),
      calculateDeviceMetrics(db, monthAgo),
      calculateReleaseMetrics(db, weekAgo),
      calculateSubscriptionMetrics(db, monthAgo),
    ])

  return {
    users: userMetrics,
    apps: appMetrics,
    devices: deviceMetrics,
    releases: releaseMetrics,
    subscriptions: subscriptionMetrics,
  }
}

// =============================================================================
// Individual Metric Calculators
// =============================================================================

async function calculateUserMetrics(
  db: D1Database,
  todayStart: number,
  weekAgo: number,
  monthAgo: number
): Promise<DashboardOverview['users']> {
  const results = await db.batch([
    db.prepare('SELECT COUNT(*) as cnt FROM user'),
    db.prepare('SELECT COUNT(*) as cnt FROM user WHERE created_at > ?').bind(monthAgo),
    db.prepare('SELECT COUNT(*) as cnt FROM user WHERE created_at > ?').bind(todayStart),
    db.prepare('SELECT COUNT(*) as cnt FROM user WHERE created_at > ?').bind(weekAgo),
    db.prepare('SELECT COUNT(*) as cnt FROM user WHERE created_at > ?').bind(monthAgo),
  ])

  return {
    total: (results[0].results[0] as { cnt: number } | undefined)?.cnt ?? 0,
    active: (results[1].results[0] as { cnt: number } | undefined)?.cnt ?? 0,
    newToday: (results[2].results[0] as { cnt: number } | undefined)?.cnt ?? 0,
    newThisWeek: (results[3].results[0] as { cnt: number } | undefined)?.cnt ?? 0,
    newThisMonth: (results[4].results[0] as { cnt: number } | undefined)?.cnt ?? 0,
  }
}

async function calculateAppMetrics(
  db: D1Database,
  weekAgo: number,
  monthAgo: number
): Promise<DashboardOverview['apps']> {
  const results = await db.batch([
    db.prepare('SELECT COUNT(*) as cnt FROM apps WHERE deleted_at IS NULL'),
    db.prepare(`
      SELECT COUNT(DISTINCT a.id) as cnt
      FROM apps a
      INNER JOIN releases r ON r.app_id = a.id
      WHERE a.deleted_at IS NULL AND r.created_at > ?
    `).bind(monthAgo),
    db.prepare(`
      SELECT COUNT(*) as cnt FROM apps
      WHERE deleted_at IS NULL AND created_at > ?
    `).bind(weekAgo),
  ])

  return {
    total: (results[0].results[0] as { cnt: number } | undefined)?.cnt ?? 0,
    active: (results[1].results[0] as { cnt: number } | undefined)?.cnt ?? 0,
    newThisWeek: (results[2].results[0] as { cnt: number } | undefined)?.cnt ?? 0,
  }
}

async function calculateDeviceMetrics(
  db: D1Database,
  monthAgo: number
): Promise<DashboardOverview['devices']> {
  const results = await db.batch([
    db.prepare('SELECT COUNT(*) as cnt FROM devices'),
    db.prepare('SELECT COUNT(*) as cnt FROM devices WHERE last_seen_at > ?').bind(monthAgo),
    db.prepare('SELECT platform, COUNT(*) as cnt FROM devices GROUP BY platform'),
  ])

  const platformCounts = results[2].results as { platform: string; cnt: number }[]
  const byPlatform = { ios: 0, android: 0 }
  for (const row of platformCounts) {
    if (row.platform === 'ios') byPlatform.ios = row.cnt
    if (row.platform === 'android') byPlatform.android = row.cnt
  }

  return {
    total: (results[0].results[0] as { cnt: number } | undefined)?.cnt ?? 0,
    active: (results[1].results[0] as { cnt: number } | undefined)?.cnt ?? 0,
    byPlatform,
  }
}

async function calculateReleaseMetrics(
  db: D1Database,
  weekAgo: number
): Promise<DashboardOverview['releases']> {
  const results = await db.batch([
    db.prepare('SELECT COUNT(*) as cnt FROM releases'),
    db.prepare('SELECT COUNT(*) as cnt FROM releases WHERE created_at > ?').bind(weekAgo),
    db.prepare('SELECT AVG(bundle_size) as avg FROM releases'),
  ])

  return {
    total: (results[0].results[0] as { cnt: number } | undefined)?.cnt ?? 0,
    thisWeek: (results[1].results[0] as { cnt: number } | undefined)?.cnt ?? 0,
    avgBundleSize: Math.round((results[2].results[0] as { avg: number } | undefined)?.avg ?? 0),
  }
}

async function calculateSubscriptionMetrics(
  db: D1Database,
  monthAgo: number
): Promise<DashboardOverview['subscriptions']> {
  const results = await db.batch([
    db.prepare(`
      SELECT sp.name, COUNT(s.id) as cnt
      FROM subscription_plans sp
      LEFT JOIN subscriptions s ON s.plan_id = sp.id AND s.status = 'active'
      GROUP BY sp.id, sp.name
    `),
    db.prepare(`
      SELECT SUM(sp.price_cents) as mrr
      FROM subscriptions s
      INNER JOIN subscription_plans sp ON s.plan_id = sp.id
      WHERE s.status = 'active'
    `),
    db.prepare(`
      SELECT COUNT(*) as cnt FROM subscriptions
      WHERE status = 'cancelled' AND updated_at > ?
    `).bind(monthAgo),
    db.prepare(`
      SELECT COUNT(*) as cnt FROM subscriptions
      WHERE status = 'active' OR (status = 'cancelled' AND updated_at > ?)
    `).bind(monthAgo),
  ])

  const planRows = results[0].results as { name: string; cnt: number }[]
  const byPlan: Record<string, number> = {}
  for (const row of planRows) {
    if (row.name) byPlan[row.name] = row.cnt
  }

  const mrr = (results[1].results[0] as { mrr: number } | undefined)?.mrr ?? 0
  const cancelled = (results[2].results[0] as { cnt: number } | undefined)?.cnt ?? 0
  const totalActive = (results[3].results[0] as { cnt: number } | undefined)?.cnt ?? 0
  const churnRate = totalActive > 0 ? (cancelled / totalActive) * 100 : 0

  return {
    byPlan,
    mrr,
    churnRate: Math.round(churnRate * 100) / 100,
  }
}
