/**
 * Advanced Metrics Routes
 *
 * Provides deeper analytics and insights for apps including:
 * - Dashboard overview metrics
 * - Release performance metrics
 * - Device distribution metrics
 * - Time-series trend data
 */

import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { ERROR_CODES } from '@bundlenudge/shared'
import { authMiddleware, type AuthUser } from '../../middleware/auth'
import type { Env } from '../../types/env'

// =============================================================================
// Constants
// =============================================================================

const SECONDS_PER_DAY = 86400
const THIRTY_DAYS_SECONDS = 30 * SECONDS_PER_DAY
const SEVEN_DAYS_SECONDS = 7 * SECONDS_PER_DAY
const MAX_TREND_DATA_POINTS = 100

// =============================================================================
// Schemas
// =============================================================================

const metricsQuerySchema = z.object({
  from: z.coerce.number().optional(),
  to: z.coerce.number().optional(),
})

const trendsQuerySchema = z.object({
  from: z.coerce.number().optional(),
  to: z.coerce.number().optional(),
  period: z.enum(['hourly', 'daily', 'weekly']).default('daily'),
})

// =============================================================================
// Types
// =============================================================================

interface AuthVariables {
  user: AuthUser
}

interface AppRow {
  id: string
  owner_id: string
  deleted_at: number | null
}

interface ReleaseStatsRow {
  release_id: string
  version: string
  bundle_size: number
  status: string
  created_at: number
  total_downloads: number | null
  total_installs: number | null
  total_crashes: number | null
}

interface DeviceRow {
  platform: string
  os_version: string | null
  app_version: string | null
  locale: string | null
  last_seen_at: number | null
  created_at: number
}

interface TelemetryEventRow {
  event_type: string
  timestamp: number
}

// =============================================================================
// Router
// =============================================================================

export const metricsRouter = new Hono<{
  Bindings: Env
  Variables: AuthVariables
}>()

metricsRouter.use('*', authMiddleware)

/**
 * GET /v1/apps/:appId/metrics/overview
 * Dashboard overview metrics
 */
metricsRouter.get(
  '/:appId/metrics/overview',
  zValidator('query', metricsQuerySchema),
  async (c) => {
    const user = c.get('user')
    const appId = c.req.param('appId')
    const query = c.req.valid('query')

    const app = await verifyAppOwnership(c.env.DB, appId, user.id)
    if (!app) {
      return c.json(
        { error: ERROR_CODES.APP_NOT_FOUND, message: 'App not found' },
        404
      )
    }

    const now = Math.floor(Date.now() / 1000)
    const thirtyDaysAgo = now - THIRTY_DAYS_SECONDS
    const from = query.from ?? thirtyDaysAgo
    const to = query.to ?? now

    const metrics = await getOverviewMetrics(c.env.DB, appId, from, to)
    return c.json({ metrics })
  }
)

/**
 * GET /v1/apps/:appId/metrics/releases
 * Release performance metrics
 */
metricsRouter.get(
  '/:appId/metrics/releases',
  zValidator('query', metricsQuerySchema),
  async (c) => {
    const user = c.get('user')
    const appId = c.req.param('appId')
    const query = c.req.valid('query')

    const app = await verifyAppOwnership(c.env.DB, appId, user.id)
    if (!app) {
      return c.json(
        { error: ERROR_CODES.APP_NOT_FOUND, message: 'App not found' },
        404
      )
    }

    const now = Math.floor(Date.now() / 1000)
    const thirtyDaysAgo = now - THIRTY_DAYS_SECONDS
    const from = query.from ?? thirtyDaysAgo
    const to = query.to ?? now

    const releases = await getReleaseMetrics(c.env.DB, appId, from, to)
    return c.json({ releases })
  }
)

/**
 * GET /v1/apps/:appId/metrics/devices
 * Device distribution metrics
 */
metricsRouter.get(
  '/:appId/metrics/devices',
  zValidator('query', metricsQuerySchema),
  async (c) => {
    const user = c.get('user')
    const appId = c.req.param('appId')
    const query = c.req.valid('query')

    const app = await verifyAppOwnership(c.env.DB, appId, user.id)
    if (!app) {
      return c.json(
        { error: ERROR_CODES.APP_NOT_FOUND, message: 'App not found' },
        404
      )
    }

    const now = Math.floor(Date.now() / 1000)
    const thirtyDaysAgo = now - THIRTY_DAYS_SECONDS
    const from = query.from ?? thirtyDaysAgo
    const to = query.to ?? now

    const deviceMetrics = await getDeviceMetrics(c.env.DB, appId, from, to)
    return c.json({ devices: deviceMetrics })
  }
)

/**
 * GET /v1/apps/:appId/metrics/trends
 * Time-series trend data
 */
metricsRouter.get(
  '/:appId/metrics/trends',
  zValidator('query', trendsQuerySchema),
  async (c) => {
    const user = c.get('user')
    const appId = c.req.param('appId')
    const query = c.req.valid('query')

    const app = await verifyAppOwnership(c.env.DB, appId, user.id)
    if (!app) {
      return c.json(
        { error: ERROR_CODES.APP_NOT_FOUND, message: 'App not found' },
        404
      )
    }

    const now = Math.floor(Date.now() / 1000)
    const thirtyDaysAgo = now - THIRTY_DAYS_SECONDS
    const from = query.from ?? thirtyDaysAgo
    const to = query.to ?? now

    const trends = await getTrendData(
      c.env.DB,
      appId,
      from,
      to,
      query.period
    )
    return c.json({ trends })
  }
)

// =============================================================================
// Helper Functions
// =============================================================================

async function verifyAppOwnership(
  db: D1Database,
  appId: string,
  userId: string
): Promise<AppRow | null> {
  return db.prepare(
    'SELECT * FROM apps WHERE id = ? AND owner_id = ? AND deleted_at IS NULL'
  ).bind(appId, userId).first<AppRow>()
}

async function getOverviewMetrics(
  db: D1Database,
  appId: string,
  from: number,
  to: number
) {
  // Get total and active devices
  const deviceStats = await db.prepare(`
    SELECT
      COUNT(*) as total_devices,
      SUM(CASE WHEN last_seen_at >= ? THEN 1 ELSE 0 END) as active_devices
    FROM devices
    WHERE app_id = ?
  `).bind(from, appId).first<{
    total_devices: number
    active_devices: number
  }>()

  // Get release stats
  const releaseStats = await db.prepare(`
    SELECT
      COUNT(*) as total_releases,
      SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_releases,
      AVG(bundle_size) as avg_bundle_size
    FROM releases
    WHERE app_id = ?
  `).bind(appId).first<{
    total_releases: number
    active_releases: number
    avg_bundle_size: number | null
  }>()

  // Get update stats from telemetry
  const updateStats = await db.prepare(`
    SELECT
      COUNT(*) as total_updates,
      SUM(CASE WHEN event_type = 'update_installed' THEN 1 ELSE 0 END) as successful,
      SUM(CASE WHEN event_type = 'update_failed' THEN 1 ELSE 0 END) as failed
    FROM telemetry_events
    WHERE app_id = ? AND timestamp >= ? AND timestamp <= ?
      AND event_type IN ('update_installed', 'update_failed', 'update_downloaded')
  `).bind(appId, from, to).first<{
    total_updates: number
    successful: number
    failed: number
  }>()

  // Calculate storage used from releases
  const storageStats = await db.prepare(`
    SELECT SUM(bundle_size) as storage_used
    FROM releases
    WHERE app_id = ?
  `).bind(appId).first<{ storage_used: number | null }>()

  const totalUpdates = updateStats?.total_updates ?? 0
  const successfulUpdates = updateStats?.successful ?? 0
  const successRate = totalUpdates > 0 ? successfulUpdates / totalUpdates : 1

  return {
    totalDevices: deviceStats?.total_devices ?? 0,
    activeDevices: deviceStats?.active_devices ?? 0,
    totalReleases: releaseStats?.total_releases ?? 0,
    activeReleases: releaseStats?.active_releases ?? 0,
    totalUpdates,
    updateSuccessRate: Math.round(successRate * 10000) / 100,
    avgUpdateSize: Math.round(releaseStats?.avg_bundle_size ?? 0),
    storageUsed: storageStats?.storage_used ?? 0,
  }
}

async function getReleaseMetrics(
  db: D1Database,
  appId: string,
  from: number,
  to: number
) {
  // Get releases with stats
  const releases = await db.prepare(`
    SELECT
      r.id as release_id,
      r.version,
      r.bundle_size,
      r.status,
      r.created_at,
      COALESCE(rs.total_downloads, 0) as total_downloads,
      COALESCE(rs.total_installs, 0) as total_installs,
      COALESCE(rs.total_crashes, 0) as total_crashes
    FROM releases r
    LEFT JOIN release_stats rs ON rs.release_id = r.id
    WHERE r.app_id = ? AND r.created_at >= ? AND r.created_at <= ?
    ORDER BY r.created_at DESC
    LIMIT 50
  `).bind(appId, from, to).all<ReleaseStatsRow>()

  // Get total devices for adoption rate calculation
  const totalDevices = await db.prepare(
    'SELECT COUNT(*) as count FROM devices WHERE app_id = ?'
  ).bind(appId).first<{ count: number }>()
  const deviceCount = totalDevices?.count ?? 1

  return releases.results.map((release) => {
    const downloads = release.total_downloads ?? 0
    const installs = release.total_installs ?? 0
    const crashes = release.total_crashes ?? 0

    return {
      releaseId: release.release_id,
      version: release.version,
      bundleSize: release.bundle_size,
      downloadCount: downloads,
      activeDevices: installs,
      adoptionRate: Math.round((installs / deviceCount) * 10000) / 100,
      avgDownloadTime: 0, // Would need telemetry data to calculate
      errorRate: installs > 0
        ? Math.round((crashes / installs) * 10000) / 100
        : 0,
    }
  })
}

async function getDeviceMetrics(
  db: D1Database,
  appId: string,
  from: number,
  _to: number
) {
  const now = Math.floor(Date.now() / 1000)
  const sevenDaysAgo = now - SEVEN_DAYS_SECONDS

  // Get all devices for the app
  const devices = await db.prepare(`
    SELECT platform, os_version, app_version, locale, last_seen_at, created_at
    FROM devices
    WHERE app_id = ?
  `).bind(appId).all<DeviceRow>()

  // Process device data
  const byPlatform: Record<string, number> = { ios: 0, android: 0 }
  const byOsVersion: Record<string, number> = {}
  const byAppVersion: Record<string, number> = {}
  const byCountry: Record<string, number> = {}
  let newDevicesLast7d = 0
  let churned30d = 0

  for (const device of devices.results) {
    // Platform distribution
    if (device.platform === 'ios' || device.platform === 'android') {
      byPlatform[device.platform]++
    }

    // OS version distribution
    if (device.os_version) {
      byOsVersion[device.os_version] = (byOsVersion[device.os_version] ?? 0) + 1
    }

    // App version distribution
    if (device.app_version) {
      byAppVersion[device.app_version] = (byAppVersion[device.app_version] ?? 0) + 1
    }

    // Country from locale (extract country code)
    if (device.locale) {
      const country = extractCountryFromLocale(device.locale)
      byCountry[country] = (byCountry[country] ?? 0) + 1
    }

    // New devices in last 7 days
    if (device.created_at >= sevenDaysAgo) {
      newDevicesLast7d++
    }

    // Churned devices (not seen in 30 days)
    const lastSeen = device.last_seen_at ?? device.created_at
    if (lastSeen < from) {
      churned30d++
    }
  }

  return {
    byPlatform,
    byOsVersion,
    byAppVersion,
    byCountry,
    newDevicesLast7d,
    churned30d,
  }
}

async function getTrendData(
  db: D1Database,
  appId: string,
  from: number,
  to: number,
  period: 'hourly' | 'daily' | 'weekly'
) {
  const bucketSize = getPeriodBucketSize(period)
  const maxBuckets = Math.min(
    Math.ceil((to - from) / bucketSize),
    MAX_TREND_DATA_POINTS
  )

  // Adjust 'from' to not exceed max data points
  const adjustedFrom = to - maxBuckets * bucketSize

  // Get telemetry events for trend calculation
  const events = await db.prepare(`
    SELECT event_type, timestamp
    FROM telemetry_events
    WHERE app_id = ? AND timestamp >= ? AND timestamp <= ?
    ORDER BY timestamp ASC
  `).bind(appId, adjustedFrom, to).all<TelemetryEventRow>()

  // Get new devices for trend
  const newDevices = await db.prepare(`
    SELECT created_at
    FROM devices
    WHERE app_id = ? AND created_at >= ? AND created_at <= ?
  `).bind(appId, adjustedFrom, to).all<{ created_at: number }>()

  // Build data points
  const dataPoints: {
    timestamp: number
    updates: number
    errors: number
    newDevices: number
  }[] = []

  for (let bucketStart = adjustedFrom; bucketStart < to; bucketStart += bucketSize) {
    const bucketEnd = bucketStart + bucketSize

    let updates = 0
    let errors = 0

    for (const event of events.results) {
      if (event.timestamp >= bucketStart && event.timestamp < bucketEnd) {
        if (event.event_type === 'update_installed') {
          updates++
        } else if (event.event_type === 'update_failed') {
          errors++
        }
      }
    }

    let deviceCount = 0
    for (const device of newDevices.results) {
      if (device.created_at >= bucketStart && device.created_at < bucketEnd) {
        deviceCount++
      }
    }

    dataPoints.push({
      timestamp: bucketStart,
      updates,
      errors,
      newDevices: deviceCount,
    })
  }

  return {
    period,
    dataPoints,
  }
}

function getPeriodBucketSize(period: 'hourly' | 'daily' | 'weekly'): number {
  switch (period) {
    case 'hourly':
      return 3600 // 1 hour
    case 'daily':
      return SECONDS_PER_DAY // 24 hours
    case 'weekly':
      return 7 * SECONDS_PER_DAY // 7 days
  }
}

function extractCountryFromLocale(locale: string): string {
  // Locale format: "en_US", "fr_FR", "zh_CN", etc.
  const parts = locale.split(/[-_]/)
  if (parts.length >= 2) {
    return parts[1].toUpperCase()
  }
  return 'UNKNOWN'
}
