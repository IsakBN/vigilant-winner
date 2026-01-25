/**
 * Health Reports Routes
 *
 * Provides app health monitoring with metrics aggregation.
 * Includes device health breakdown, release health, and SDK health report submission.
 *
 * @agent health-reports
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

/** Cache TTL for health summaries (5 minutes) */
const HEALTH_CACHE_TTL_SECONDS = 300

/** Time range options in seconds */
const TIME_RANGES = {
  '24h': 24 * 60 * 60,
  '7d': 7 * 24 * 60 * 60,
  '30d': 30 * 24 * 60 * 60,
} as const

type TimeRange = keyof typeof TIME_RANGES

// =============================================================================
// Schemas
// =============================================================================

const timeRangeSchema = z.enum(['24h', '7d', '30d']).default('24h')

const healthReportSchema = z.object({
  deviceId: z.string().min(1).max(100),
  appId: z.string().uuid(),
  releaseId: z.string().uuid().optional(),
  updateSuccess: z.boolean().optional(),
  updateDuration: z.number().int().positive().optional(),
  crashDetected: z.boolean().default(false),
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

interface HealthAggregation {
  total_reports: number
  successful_updates: number
  failed_updates: number
  crashes: number
  avg_update_duration: number | null
}

interface ReleaseHealthRow {
  release_id: string
  version: string
  total_reports: number
  successful_updates: number
  crashes: number
  avg_update_duration: number | null
}

interface DeviceHealthRow {
  platform: 'ios' | 'android'
  os_version: string
  device_count: number
  successful_updates: number
  total_updates: number
  crashes: number
}

// =============================================================================
// Router
// =============================================================================

export const healthRouter = new Hono<{ Bindings: Env; Variables: AuthVariables }>()

/**
 * Verify app ownership
 */
async function verifyAppOwnership(
  db: D1Database,
  appId: string,
  userId: string
): Promise<AppRow | null> {
  return db.prepare(
    'SELECT id, owner_id, deleted_at FROM apps WHERE id = ? AND owner_id = ? AND deleted_at IS NULL'
  ).bind(appId, userId).first<AppRow>()
}

/**
 * Generate cache key for health data
 */
function generateHealthCacheKey(appId: string, endpoint: string, range: TimeRange): string {
  return `health:${appId}:${endpoint}:${range}`
}

/**
 * Get timestamp for time range start
 */
function getTimeRangeStart(range: TimeRange): number {
  const now = Math.floor(Date.now() / 1000)
  return now - TIME_RANGES[range]
}

// =============================================================================
// GET /v1/apps/:appId/health - Overall app health summary
// =============================================================================

healthRouter.get('/:appId/health', authMiddleware, async (c) => {
  const user = c.get('user')
  const appId = c.req.param('appId')
  const range = timeRangeSchema.parse(c.req.query('range'))

  const app = await verifyAppOwnership(c.env.DB, appId, user.id)
  if (!app) {
    return c.json(
      { error: ERROR_CODES.APP_NOT_FOUND, message: 'App not found' },
      404
    )
  }

  const cacheKey = generateHealthCacheKey(appId, 'summary', range)

  // Check cache
  const cached = await c.env.RATE_LIMIT.get(cacheKey)
  if (cached) {
    return c.json(JSON.parse(cached))
  }

  const rangeStart = getTimeRangeStart(range)

  // Aggregate health metrics
  const aggregation = await c.env.DB.prepare(`
    SELECT
      COUNT(*) as total_reports,
      SUM(CASE WHEN update_success = 1 THEN 1 ELSE 0 END) as successful_updates,
      SUM(CASE WHEN update_success = 0 THEN 1 ELSE 0 END) as failed_updates,
      SUM(CASE WHEN crash_detected = 1 THEN 1 ELSE 0 END) as crashes,
      AVG(CASE WHEN update_duration IS NOT NULL THEN update_duration END) as avg_update_duration
    FROM health_reports
    WHERE app_id = ? AND created_at >= ?
  `).bind(appId, rangeStart).first<HealthAggregation>()

  // Get active device count
  const deviceCount = await c.env.DB.prepare(`
    SELECT COUNT(DISTINCT device_id) as count
    FROM devices
    WHERE app_id = ? AND last_seen_at >= ?
  `).bind(appId, rangeStart).first<{ count: number }>()

  const totalReports = aggregation?.total_reports ?? 0
  const successfulUpdates = aggregation?.successful_updates ?? 0
  const failedUpdates = aggregation?.failed_updates ?? 0
  const crashes = aggregation?.crashes ?? 0
  const totalUpdates = successfulUpdates + failedUpdates

  // Calculate rates
  const updateSuccessRate = totalUpdates > 0
    ? Math.round((successfulUpdates / totalUpdates) * 10000) / 100
    : 100

  const crashFreeRate = totalReports > 0
    ? Math.round(((totalReports - crashes) / totalReports) * 10000) / 100
    : 100

  // Overall score: weighted average of update success and crash-free rate
  const overallScore = Math.round((updateSuccessRate * 0.4 + crashFreeRate * 0.6) * 100) / 100

  const response = {
    appId,
    overallScore,
    activeDevices: deviceCount?.count ?? 0,
    crashFreeRate,
    updateSuccessRate,
    avgUpdateTime: aggregation?.avg_update_duration
      ? Math.round(aggregation.avg_update_duration / 1000 * 100) / 100
      : null,
    timeRange: range,
    lastUpdated: Math.floor(Date.now() / 1000),
  }

  // Cache the result
  c.executionCtx.waitUntil(
    c.env.RATE_LIMIT.put(cacheKey, JSON.stringify(response), {
      expirationTtl: HEALTH_CACHE_TTL_SECONDS,
    })
  )

  return c.json(response)
})

// =============================================================================
// GET /v1/apps/:appId/health/releases - Release-specific health metrics
// =============================================================================

healthRouter.get('/:appId/health/releases', authMiddleware, async (c) => {
  const user = c.get('user')
  const appId = c.req.param('appId')
  const range = timeRangeSchema.parse(c.req.query('range'))
  const limit = Math.min(Number(c.req.query('limit')) || 20, 100)
  const offset = Number(c.req.query('offset')) || 0

  const app = await verifyAppOwnership(c.env.DB, appId, user.id)
  if (!app) {
    return c.json(
      { error: ERROR_CODES.APP_NOT_FOUND, message: 'App not found' },
      404
    )
  }

  const rangeStart = getTimeRangeStart(range)

  // Get total active devices for adoption calculation
  const totalDevices = await c.env.DB.prepare(`
    SELECT COUNT(DISTINCT device_id) as count
    FROM devices
    WHERE app_id = ? AND last_seen_at >= ?
  `).bind(appId, rangeStart).first<{ count: number }>()

  const totalDeviceCount = totalDevices?.count ?? 0

  // Get release health metrics
  const releases = await c.env.DB.prepare(`
    SELECT
      r.id as release_id,
      r.version,
      COUNT(DISTINCT hr.device_id) as device_count,
      COUNT(*) as total_reports,
      SUM(CASE WHEN hr.update_success = 1 THEN 1 ELSE 0 END) as successful_updates,
      SUM(CASE WHEN hr.crash_detected = 1 THEN 1 ELSE 0 END) as crashes,
      AVG(CASE WHEN hr.update_duration IS NOT NULL THEN hr.update_duration END) as avg_update_duration,
      (SELECT COUNT(*) FROM release_stats rs WHERE rs.release_id = r.id) as rollback_count
    FROM releases r
    LEFT JOIN health_reports hr ON r.id = hr.release_id AND hr.created_at >= ?
    WHERE r.app_id = ?
    GROUP BY r.id, r.version
    ORDER BY r.created_at DESC
    LIMIT ? OFFSET ?
  `).bind(rangeStart, appId, limit, offset).all<ReleaseHealthRow & { device_count: number; rollback_count: number }>()

  // Get total count
  const countResult = await c.env.DB.prepare(
    'SELECT COUNT(*) as total FROM releases WHERE app_id = ?'
  ).bind(appId).first<{ total: number }>()

  const data = releases.results.map((row) => {
    const totalReports = row.total_reports
    const crashes = row.crashes
    // successfulUpdates available in row.successful_updates for future use

    return {
      releaseId: row.release_id,
      version: row.version,
      adoptionRate: totalDeviceCount > 0
        ? Math.round((row.device_count / totalDeviceCount) * 10000) / 100
        : 0,
      crashFreeRate: totalReports > 0
        ? Math.round(((totalReports - crashes) / totalReports) * 10000) / 100
        : 100,
      rollbackCount: row.rollback_count,
      avgDownloadTime: row.avg_update_duration
        ? Math.round(row.avg_update_duration / 1000 * 100) / 100
        : null,
    }
  })

  return c.json({
    data,
    timeRange: range,
    pagination: {
      total: countResult?.total ?? 0,
      limit,
      offset,
      hasMore: offset + releases.results.length < (countResult?.total ?? 0),
    },
  })
})

// =============================================================================
// GET /v1/apps/:appId/health/devices - Device health breakdown
// =============================================================================

healthRouter.get('/:appId/health/devices', authMiddleware, async (c) => {
  const user = c.get('user')
  const appId = c.req.param('appId')
  const range = timeRangeSchema.parse(c.req.query('range'))

  const app = await verifyAppOwnership(c.env.DB, appId, user.id)
  if (!app) {
    return c.json(
      { error: ERROR_CODES.APP_NOT_FOUND, message: 'App not found' },
      404
    )
  }

  const rangeStart = getTimeRangeStart(range)

  // Group health by platform and OS version
  const deviceHealth = await c.env.DB.prepare(`
    SELECT
      d.platform,
      COALESCE(d.os_version, 'Unknown') as os_version,
      COUNT(DISTINCT d.device_id) as device_count,
      SUM(CASE WHEN hr.update_success = 1 THEN 1 ELSE 0 END) as successful_updates,
      SUM(CASE WHEN hr.update_success IS NOT NULL THEN 1 ELSE 0 END) as total_updates,
      SUM(CASE WHEN hr.crash_detected = 1 THEN 1 ELSE 0 END) as crashes
    FROM devices d
    LEFT JOIN health_reports hr ON d.device_id = hr.device_id
      AND d.app_id = hr.app_id
      AND hr.created_at >= ?
    WHERE d.app_id = ? AND d.last_seen_at >= ?
    GROUP BY d.platform, d.os_version
    ORDER BY device_count DESC
  `).bind(rangeStart, appId, rangeStart).all<DeviceHealthRow>()

  const data = deviceHealth.results.map((row) => {
    const totalUpdates = row.total_updates
    const successfulUpdates = row.successful_updates
    const crashes = row.crashes
    const deviceCount = row.device_count

    return {
      platform: row.platform,
      osVersion: row.os_version,
      deviceCount,
      crashFreeRate: deviceCount > 0
        ? Math.round(((deviceCount - crashes) / deviceCount) * 10000) / 100
        : 100,
      updateSuccessRate: totalUpdates > 0
        ? Math.round((successfulUpdates / totalUpdates) * 10000) / 100
        : 100,
    }
  })

  return c.json({
    data,
    timeRange: range,
  })
})

// =============================================================================
// POST /v1/apps/:appId/health/reports - Submit health report from SDK
// =============================================================================

healthRouter.post(
  '/:appId/health/reports',
  zValidator('json', healthReportSchema),
  async (c) => {
    const appId = c.req.param('appId')
    const body = c.req.valid('json')

    // Validate appId matches body
    if (body.appId !== appId) {
      return c.json(
        { error: ERROR_CODES.VALIDATION_ERROR, message: 'appId mismatch' },
        400
      )
    }

    // Validate app exists (lightweight check, no auth required for SDK)
    const app = await c.env.DB.prepare(
      'SELECT id FROM apps WHERE id = ? AND deleted_at IS NULL'
    ).bind(appId).first<{ id: string }>()

    if (!app) {
      return c.json(
        { error: ERROR_CODES.APP_NOT_FOUND, message: 'App not found' },
        404
      )
    }

    // Validate release if provided
    if (body.releaseId) {
      const release = await c.env.DB.prepare(
        'SELECT id FROM releases WHERE id = ? AND app_id = ?'
      ).bind(body.releaseId, appId).first<{ id: string }>()

      if (!release) {
        return c.json(
          { error: ERROR_CODES.RELEASE_NOT_FOUND, message: 'Release not found' },
          404
        )
      }
    }

    const reportId = crypto.randomUUID()
    const now = Math.floor(Date.now() / 1000)

    await c.env.DB.prepare(`
      INSERT INTO health_reports (
        id, device_id, app_id, release_id, update_success,
        update_duration, crash_detected, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      reportId,
      body.deviceId,
      appId,
      body.releaseId ?? null,
      body.updateSuccess !== undefined ? (body.updateSuccess ? 1 : 0) : null,
      body.updateDuration ?? null,
      body.crashDetected ? 1 : 0,
      now
    ).run()

    // Update device crash count if crash detected
    if (body.crashDetected) {
      c.executionCtx.waitUntil(
        c.env.DB.prepare(`
          UPDATE devices
          SET crash_count = crash_count + 1
          WHERE app_id = ? AND device_id = ?
        `).bind(appId, body.deviceId).run()
      )
    }

    return c.json({ success: true, reportId }, 201)
  }
)

