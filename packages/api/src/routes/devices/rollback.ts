/**
 * Rollback Telemetry Routes - SDK rollback reporting and dashboard analytics
 * @agent wave5d-rollback
 * @created 2026-01-26
 */

import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { ERROR_CODES } from '@bundlenudge/shared'
import { authMiddleware, type AuthUser } from '../../middleware/auth'
import type { Env } from '../../types/env'

// Types
interface RollbackReportRow {
  id: string
  device_id: string
  release_id: string
  reason: string
  failed_events: string | null
  failed_endpoints: string | null
  previous_version: string | null
  timestamp: number
  created_at: number
}

interface DeviceRow { id: string; device_id: string; app_id: string }
interface ReleaseRow { id: string; app_id: string }
interface AppRow { id: string; owner_id: string }
interface AuthVariables { user: AuthUser }

// Schemas
const rollbackReportSchema = z.object({
  releaseId: z.string().uuid(),
  reason: z.enum(['crash_detected', 'health_check_failed', 'manual', 'hash_mismatch']),
  failedEvents: z.array(z.string()).optional(),
  failedEndpoints: z.array(z.object({
    method: z.string(),
    url: z.string(),
    status: z.number(),
  })).optional(),
  previousVersion: z.string().optional(),
  timestamp: z.number(),
})

const rollbackQuerySchema = z.object({
  startTime: z.coerce.number().optional(),
  endTime: z.coerce.number().optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
})

function formatReport(row: RollbackReportRow) {
  return {
    id: row.id,
    deviceId: row.device_id,
    releaseId: row.release_id,
    reason: row.reason,
    failedEvents: row.failed_events ? JSON.parse(row.failed_events) : null,
    failedEndpoints: row.failed_endpoints ? JSON.parse(row.failed_endpoints) : null,
    previousVersion: row.previous_version,
    timestamp: row.timestamp,
    createdAt: row.created_at,
  }
}

// Routers
export const rollbackRouter = new Hono<{ Bindings: Env; Variables: AuthVariables }>()

/** POST /v1/devices/:deviceId/rollback-report - Report rollback from SDK */
rollbackRouter.post(
  '/:deviceId/rollback-report',
  zValidator('json', rollbackReportSchema),
  async (c) => {
    const deviceId = c.req.param('deviceId')
    const body = c.req.valid('json')

    // Validate device exists
    const device = await c.env.DB.prepare(
      'SELECT id, device_id, app_id FROM devices WHERE device_id = ?'
    ).bind(deviceId).first<DeviceRow>()

    if (!device) {
      return c.json(
        { error: ERROR_CODES.DEVICE_NOT_FOUND, message: 'Device not found' },
        404
      )
    }

    // Validate release exists
    const release = await c.env.DB.prepare(
      'SELECT id, app_id FROM releases WHERE id = ?'
    ).bind(body.releaseId).first<ReleaseRow>()

    if (!release) {
      return c.json(
        { error: ERROR_CODES.INVALID_INPUT, message: 'Invalid releaseId' },
        400
      )
    }

    const now = Math.floor(Date.now() / 1000)
    const reportId = crypto.randomUUID()

    await c.env.DB.prepare(`
      INSERT INTO rollback_reports (
        id, device_id, release_id, reason, failed_events,
        failed_endpoints, previous_version, timestamp, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      reportId,
      deviceId,
      body.releaseId,
      body.reason,
      body.failedEvents ? JSON.stringify(body.failedEvents) : null,
      body.failedEndpoints ? JSON.stringify(body.failedEndpoints) : null,
      body.previousVersion ?? null,
      body.timestamp,
      now
    ).run()

    // Update release stats
    await c.env.DB.prepare(`
      UPDATE release_stats
      SET total_rollbacks = total_rollbacks + 1, last_updated_at = ?
      WHERE release_id = ?
    `).bind(now, body.releaseId).run()

    return c.json({ success: true, reportId }, 201)
  }
)

/** GET /v1/releases/:releaseId/rollback-reports - Dashboard aggregated reports */
export const rollbackReportsRouter = new Hono<{ Bindings: Env; Variables: AuthVariables }>()

rollbackReportsRouter.use('*', authMiddleware)

rollbackReportsRouter.get(
  '/:releaseId/rollback-reports',
  zValidator('query', rollbackQuerySchema),
  async (c) => {
    const user = c.get('user')
    const releaseId = c.req.param('releaseId')
    const query = c.req.valid('query')
    const limit = query.limit ?? 100

    // Validate release exists and user has access
    const release = await c.env.DB.prepare(
      'SELECT id, app_id FROM releases WHERE id = ?'
    ).bind(releaseId).first<ReleaseRow>()

    if (!release) {
      return c.json(
        { error: ERROR_CODES.RELEASE_NOT_FOUND, message: 'Release not found' },
        404
      )
    }

    // Verify app ownership
    const app = await c.env.DB.prepare(
      'SELECT id, owner_id FROM apps WHERE id = ? AND deleted_at IS NULL'
    ).bind(release.app_id).first<AppRow>()

    if (app?.owner_id !== user.id) {
      return c.json(
        { error: ERROR_CODES.FORBIDDEN, message: 'Access denied' },
        403
      )
    }

    // Build query with optional time filters
    let whereClause = 'release_id = ?'
    const params: (string | number)[] = [releaseId]

    if (query.startTime) {
      whereClause += ' AND timestamp >= ?'
      params.push(query.startTime)
    }
    if (query.endTime) {
      whereClause += ' AND timestamp <= ?'
      params.push(query.endTime)
    }

    // Get total count
    const countResult = await c.env.DB.prepare(
      `SELECT COUNT(*) as total FROM rollback_reports WHERE ${whereClause}`
    ).bind(...params).first<{ total: number }>()
    const total = countResult?.total ?? 0

    // Get rollbacks by reason
    const byReason = await c.env.DB.prepare(`
      SELECT reason, COUNT(*) as count
      FROM rollback_reports
      WHERE ${whereClause}
      GROUP BY reason
    `).bind(...params).all<{ reason: string; count: number }>()

    const reasonCounts: Record<string, number> = {}
    for (const row of byReason.results) {
      reasonCounts[row.reason] = row.count
    }

    // Get recent rollbacks
    const recentReports = await c.env.DB.prepare(`
      SELECT id, device_id, release_id, reason, failed_events,
             failed_endpoints, previous_version, timestamp, created_at
      FROM rollback_reports
      WHERE ${whereClause}
      ORDER BY timestamp DESC
      LIMIT ?
    `).bind(...params, limit).all<RollbackReportRow>()

    return c.json({
      summary: {
        total,
        byReason: reasonCounts,
      },
      reports: recentReports.results.map(formatReport),
    })
  }
)
