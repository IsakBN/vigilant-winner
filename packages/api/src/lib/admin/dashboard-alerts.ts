/**
 * Dashboard system alerts helpers
 *
 * Generates alerts based on system metrics and thresholds
 *
 * @module lib/admin/dashboard-alerts
 */

// =============================================================================
// Constants
// =============================================================================

const ONE_DAY_MS = 24 * 60 * 60 * 1000
const ONE_HOUR_MS = 60 * 60 * 1000

// Alert thresholds
const ERROR_RATE_WARNING = 5 // 5%
const ERROR_RATE_CRITICAL = 10 // 10%
const WEBHOOK_FAILURES_WARNING = 50
const WEBHOOK_FAILURES_CRITICAL = 200
const TRAFFIC_SPIKE_INFO = 3 // 3x average
const TRAFFIC_SPIKE_CRITICAL = 5 // 5x average

// =============================================================================
// Types
// =============================================================================

export type AlertSeverity = 'info' | 'warning' | 'critical'

export interface SystemAlert {
  id: string
  severity: AlertSeverity
  type: string
  message: string
  metadata: Record<string, unknown>
  createdAt: number
  resolvedAt: number | null
}

export interface AlertsOptions {
  limit: number
  offset: number
  severity?: AlertSeverity
  resolved?: boolean
}

export interface AlertsResult {
  items: SystemAlert[]
  total: number
}

// =============================================================================
// Main Function
// =============================================================================

export async function getSystemAlerts(
  db: D1Database,
  options: AlertsOptions
): Promise<AlertsResult> {
  const { limit, offset, severity, resolved } = options
  const alerts: SystemAlert[] = []
  const now = Date.now()
  const hourAgo = now - ONE_HOUR_MS

  // Generate alerts based on system metrics
  await Promise.all([
    generateErrorRateAlerts(db, alerts, hourAgo),
    generateWebhookFailureAlerts(db, alerts),
    generateStorageAlerts(db, alerts),
    generateTrafficAlerts(db, alerts, hourAgo),
  ])

  // Apply filters
  let filteredAlerts = applyFilters(alerts, severity, resolved)

  // Sort by severity (critical first) then by createdAt
  filteredAlerts = sortAlerts(filteredAlerts)

  const total = filteredAlerts.length
  const paginatedAlerts = filteredAlerts.slice(offset, offset + limit)

  return { items: paginatedAlerts, total }
}

// =============================================================================
// Filtering and Sorting
// =============================================================================

function applyFilters(
  alerts: SystemAlert[],
  severity?: AlertSeverity,
  resolved?: boolean
): SystemAlert[] {
  let filtered = alerts

  if (severity) {
    filtered = filtered.filter(a => a.severity === severity)
  }

  if (resolved !== undefined) {
    filtered = filtered.filter(a =>
      resolved ? a.resolvedAt !== null : a.resolvedAt === null
    )
  }

  return filtered
}

function sortAlerts(alerts: SystemAlert[]): SystemAlert[] {
  const severityOrder: Record<AlertSeverity, number> = { critical: 0, warning: 1, info: 2 }

  return alerts.sort((a, b) => {
    const sevDiff = severityOrder[a.severity] - severityOrder[b.severity]
    if (sevDiff !== 0) return sevDiff
    return b.createdAt - a.createdAt
  })
}

// =============================================================================
// Alert Generators
// =============================================================================

async function generateErrorRateAlerts(
  db: D1Database,
  alerts: SystemAlert[],
  hourAgo: number
): Promise<void> {
  const result = await db.prepare(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN error_code IS NOT NULL THEN 1 ELSE 0 END) as errors
    FROM telemetry_events
    WHERE timestamp > ?
  `).bind(hourAgo).first<{ total: number; errors: number }>()

  if (!result || result.total === 0) return

  const errorRate = (result.errors / result.total) * 100
  if (errorRate <= ERROR_RATE_WARNING) return

  alerts.push({
    id: `error_rate_${String(Date.now())}`,
    severity: errorRate > ERROR_RATE_CRITICAL ? 'critical' : 'warning',
    type: 'high_error_rate',
    message: `Error rate is ${errorRate.toFixed(1)}% in the last hour (${String(result.errors)}/${String(result.total)} events)`,
    metadata: { errorRate, total: result.total, errors: result.errors },
    createdAt: Date.now(),
    resolvedAt: null,
  })
}

async function generateWebhookFailureAlerts(
  db: D1Database,
  alerts: SystemAlert[]
): Promise<void> {
  const result = await db.prepare(`
    SELECT COUNT(*) as failed_count
    FROM webhook_events
    WHERE status = 'failed' AND created_at > ?
  `).bind(Date.now() - ONE_DAY_MS).first<{ failed_count: number }>()

  if (!result || result.failed_count <= WEBHOOK_FAILURES_WARNING) return

  alerts.push({
    id: `webhook_failures_${String(Date.now())}`,
    severity: result.failed_count > WEBHOOK_FAILURES_CRITICAL ? 'critical' : 'warning',
    type: 'webhook_failures_accumulating',
    message: `${String(result.failed_count)} webhook deliveries failed in the last 24 hours`,
    metadata: { failedCount: result.failed_count },
    createdAt: Date.now(),
    resolvedAt: null,
  })
}

async function generateStorageAlerts(
  db: D1Database,
  alerts: SystemAlert[]
): Promise<void> {
  const result = await db.prepare(`
    SELECT COUNT(*) as cnt
    FROM (
      SELECT u.id, sp.storage_gb * 1024 * 1024 * 1024 as limit_bytes,
             COALESCE(SUM(r.bundle_size), 0) as used_bytes
      FROM user u
      INNER JOIN subscriptions s ON s.user_id = u.id AND s.status = 'active'
      INNER JOIN subscription_plans sp ON s.plan_id = sp.id
      LEFT JOIN apps a ON a.owner_id = u.id
      LEFT JOIN releases r ON r.app_id = a.id
      GROUP BY u.id, sp.storage_gb
      HAVING used_bytes > limit_bytes * 0.9
    ) users_near_limit
  `).first<{ cnt: number }>()

  if (!result || result.cnt === 0) return

  alerts.push({
    id: `storage_limit_${String(Date.now())}`,
    severity: 'warning',
    type: 'storage_approaching_limit',
    message: `${String(result.cnt)} users are approaching their storage limit (>90% used)`,
    metadata: { usersAffected: result.cnt },
    createdAt: Date.now(),
    resolvedAt: null,
  })
}

async function generateTrafficAlerts(
  db: D1Database,
  alerts: SystemAlert[],
  hourAgo: number
): Promise<void> {
  const results = await db.batch([
    db.prepare(`
      SELECT COUNT(*) as current_hour
      FROM telemetry_events
      WHERE timestamp > ?
    `).bind(hourAgo),
    db.prepare(`
      SELECT COUNT(*) / 24 as daily_avg
      FROM telemetry_events
      WHERE timestamp > ?
    `).bind(Date.now() - ONE_DAY_MS),
  ])

  const currentHour = (results[0].results[0] as { current_hour: number } | undefined)?.current_hour ?? 0
  const dailyAvg = (results[1].results[0] as { daily_avg: number } | undefined)?.daily_avg ?? 0

  if (dailyAvg === 0 || currentHour <= dailyAvg * TRAFFIC_SPIKE_INFO) return

  alerts.push({
    id: `traffic_spike_${String(Date.now())}`,
    severity: currentHour > dailyAvg * TRAFFIC_SPIKE_CRITICAL ? 'critical' : 'info',
    type: 'unusual_traffic_pattern',
    message: `Traffic is ${(currentHour / dailyAvg).toFixed(1)}x higher than average this hour`,
    metadata: { currentHour, dailyAvg: Math.round(dailyAvg) },
    createdAt: Date.now(),
    resolvedAt: null,
  })
}
