/**
 * Device Management Routes
 *
 * App-scoped device management endpoints for dashboard use.
 * Includes device details, deletion, targeting, and statistics.
 *
 * @agent device-management
 * @created 2026-01-25
 */

import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { ERROR_CODES } from '@bundlenudge/shared'
import { authMiddleware, type AuthUser } from '../../middleware/auth'
import type { Env } from '../../types/env'

// =============================================================================
// Types
// =============================================================================

interface DeviceRow {
  id: string
  app_id: string
  device_id: string
  platform: 'ios' | 'android'
  os_version: string | null
  device_model: string | null
  app_version: string
  current_bundle_version: string | null
  target_group: string | null
  last_seen_at: number | null
  revoked_at: number | null
  created_at: number
}

interface AuthVariables {
  user: AuthUser
}

// =============================================================================
// Schemas
// =============================================================================

const deviceTargetSchema = z.object({
  targetGroup: z.string().min(1).max(100),
})

const bulkTargetSchema = z.object({
  deviceIds: z.array(z.string().min(1).max(100)).min(1).max(100),
  targetGroup: z.string().min(1).max(100),
})

// =============================================================================
// Helpers
// =============================================================================

async function verifyAppOwnership(
  db: Env['DB'],
  appId: string,
  userId: string
): Promise<boolean> {
  const app = await db.prepare(
    'SELECT id FROM apps WHERE id = ? AND owner_id = ? AND deleted_at IS NULL'
  ).bind(appId, userId).first()
  return !!app
}

function formatDevice(row: DeviceRow) {
  return {
    id: row.id,
    appId: row.app_id,
    deviceId: row.device_id,
    platform: row.platform,
    osVersion: row.os_version,
    deviceModel: row.device_model,
    appVersion: row.app_version,
    currentBundleVersion: row.current_bundle_version,
    targetGroup: row.target_group,
    lastSeenAt: row.last_seen_at,
    revokedAt: row.revoked_at,
    createdAt: row.created_at,
  }
}

// =============================================================================
// Router
// =============================================================================

export const deviceManagementRouter = new Hono<{
  Bindings: Env
  Variables: AuthVariables
}>()

deviceManagementRouter.use('*', authMiddleware)

/**
 * GET /v1/apps/:appId/devices
 * List devices for an app with pagination
 */
deviceManagementRouter.get('/:appId/devices', async (c) => {
  const user = c.get('user')
  const appId = c.req.param('appId')
  const limit = Math.min(Number(c.req.query('limit')) || 20, 100)
  const offset = Number(c.req.query('offset')) || 0

  if (!await verifyAppOwnership(c.env.DB, appId, user.id)) {
    return c.json({ error: ERROR_CODES.APP_NOT_FOUND, message: 'App not found' }, 404)
  }

  const countResult = await c.env.DB.prepare(
    'SELECT COUNT(*) as total FROM devices WHERE app_id = ?'
  ).bind(appId).first<{ total: number }>()
  const total = countResult?.total ?? 0

  const results = await c.env.DB.prepare(`
    SELECT id, app_id, device_id, platform, os_version, device_model,
           app_version, current_bundle_version, target_group, last_seen_at,
           revoked_at, created_at
    FROM devices WHERE app_id = ?
    ORDER BY last_seen_at DESC NULLS LAST
    LIMIT ? OFFSET ?
  `).bind(appId, limit, offset).all<DeviceRow>()

  return c.json({
    data: results.results.map(formatDevice),
    pagination: { total, limit, offset, hasMore: offset + results.results.length < total },
  })
})

/**
 * GET /v1/apps/:appId/devices/stats
 * Get device statistics for an app
 */
deviceManagementRouter.get('/:appId/devices/stats', async (c) => {
  const user = c.get('user')
  const appId = c.req.param('appId')

  if (!await verifyAppOwnership(c.env.DB, appId, user.id)) {
    return c.json({ error: ERROR_CODES.APP_NOT_FOUND, message: 'App not found' }, 404)
  }

  const now = Math.floor(Date.now() / 1000)
  const thirtyDaysAgo = now - (30 * 24 * 60 * 60)
  const sevenDaysAgo = now - (7 * 24 * 60 * 60)

  // Get total and platform counts
  const totals = await c.env.DB.prepare(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN last_seen_at >= ? THEN 1 ELSE 0 END) as active,
      SUM(CASE WHEN platform = 'ios' THEN 1 ELSE 0 END) as ios,
      SUM(CASE WHEN platform = 'android' THEN 1 ELSE 0 END) as android,
      SUM(CASE WHEN created_at >= ? THEN 1 ELSE 0 END) as new_7d,
      SUM(CASE WHEN created_at >= ? THEN 1 ELSE 0 END) as new_30d
    FROM devices WHERE app_id = ?
  `).bind(thirtyDaysAgo, sevenDaysAgo, thirtyDaysAgo, appId).first<{
    total: number
    active: number
    ios: number
    android: number
    new_7d: number
    new_30d: number
  }>()

  // Get target group counts
  const targetGroups = await c.env.DB.prepare(`
    SELECT target_group, COUNT(*) as count
    FROM devices
    WHERE app_id = ? AND target_group IS NOT NULL
    GROUP BY target_group
  `).bind(appId).all<{ target_group: string; count: number }>()

  const byTargetGroup: Record<string, number> = {}
  for (const row of targetGroups.results) {
    byTargetGroup[row.target_group] = row.count
  }

  return c.json({
    stats: {
      total: totals?.total ?? 0,
      active: totals?.active ?? 0,
      byPlatform: {
        ios: totals?.ios ?? 0,
        android: totals?.android ?? 0,
      },
      byTargetGroup,
      newLast7d: totals?.new_7d ?? 0,
      newLast30d: totals?.new_30d ?? 0,
    },
  })
})

/**
 * GET /v1/apps/:appId/devices/:deviceId
 * Get single device details
 */
deviceManagementRouter.get('/:appId/devices/:deviceId', async (c) => {
  const user = c.get('user')
  const { appId, deviceId } = c.req.param()

  if (!await verifyAppOwnership(c.env.DB, appId, user.id)) {
    return c.json({ error: ERROR_CODES.APP_NOT_FOUND, message: 'App not found' }, 404)
  }

  const device = await c.env.DB.prepare(`
    SELECT id, app_id, device_id, platform, os_version, device_model,
           app_version, current_bundle_version, target_group, last_seen_at,
           revoked_at, created_at
    FROM devices WHERE app_id = ? AND device_id = ?
  `).bind(appId, deviceId).first<DeviceRow>()

  if (!device) {
    return c.json({ error: ERROR_CODES.DEVICE_NOT_FOUND, message: 'Device not found' }, 404)
  }

  return c.json({ device: formatDevice(device) })
})

/**
 * DELETE /v1/apps/:appId/devices/:deviceId
 * Remove a device (hard delete)
 */
deviceManagementRouter.delete('/:appId/devices/:deviceId', async (c) => {
  const user = c.get('user')
  const { appId, deviceId } = c.req.param()

  if (!await verifyAppOwnership(c.env.DB, appId, user.id)) {
    return c.json({ error: ERROR_CODES.APP_NOT_FOUND, message: 'App not found' }, 404)
  }

  const result = await c.env.DB.prepare(
    'DELETE FROM devices WHERE app_id = ? AND device_id = ?'
  ).bind(appId, deviceId).run()

  if (!result.meta.changes) {
    return c.json({ error: ERROR_CODES.DEVICE_NOT_FOUND, message: 'Device not found' }, 404)
  }

  return c.json({ success: true })
})

/**
 * POST /v1/apps/:appId/devices/:deviceId/target
 * Add device to a targeting group
 */
deviceManagementRouter.post(
  '/:appId/devices/:deviceId/target',
  zValidator('json', deviceTargetSchema),
  async (c) => {
    const user = c.get('user')
    const { appId, deviceId } = c.req.param()
    const { targetGroup } = c.req.valid('json')

    if (!await verifyAppOwnership(c.env.DB, appId, user.id)) {
      return c.json({ error: ERROR_CODES.APP_NOT_FOUND, message: 'App not found' }, 404)
    }

    const result = await c.env.DB.prepare(`
      UPDATE devices SET target_group = ?
      WHERE app_id = ? AND device_id = ?
    `).bind(targetGroup, appId, deviceId).run()

    if (!result.meta.changes) {
      return c.json({ error: ERROR_CODES.DEVICE_NOT_FOUND, message: 'Device not found' }, 404)
    }

    const device = await c.env.DB.prepare(`
      SELECT id, app_id, device_id, platform, os_version, device_model,
             app_version, current_bundle_version, target_group, last_seen_at,
             revoked_at, created_at
      FROM devices WHERE app_id = ? AND device_id = ?
    `).bind(appId, deviceId).first<DeviceRow>()

    if (!device) {
      return c.json({ error: ERROR_CODES.DEVICE_NOT_FOUND, message: 'Device not found' }, 404)
    }
    return c.json({ success: true, device: formatDevice(device) })
  }
)

/**
 * DELETE /v1/apps/:appId/devices/:deviceId/target
 * Remove device from targeting group
 */
deviceManagementRouter.delete('/:appId/devices/:deviceId/target', async (c) => {
  const user = c.get('user')
  const { appId, deviceId } = c.req.param()

  if (!await verifyAppOwnership(c.env.DB, appId, user.id)) {
    return c.json({ error: ERROR_CODES.APP_NOT_FOUND, message: 'App not found' }, 404)
  }

  const result = await c.env.DB.prepare(`
    UPDATE devices SET target_group = NULL
    WHERE app_id = ? AND device_id = ?
  `).bind(appId, deviceId).run()

  if (!result.meta.changes) {
    return c.json({ error: ERROR_CODES.DEVICE_NOT_FOUND, message: 'Device not found' }, 404)
  }

  return c.json({ success: true })
})

/**
 * POST /v1/apps/:appId/devices/bulk-target
 * Bulk add devices to a targeting group
 */
deviceManagementRouter.post(
  '/:appId/devices/bulk-target',
  zValidator('json', bulkTargetSchema),
  async (c) => {
    const user = c.get('user')
    const appId = c.req.param('appId')
    const { deviceIds, targetGroup } = c.req.valid('json')

    if (!await verifyAppOwnership(c.env.DB, appId, user.id)) {
      return c.json({ error: ERROR_CODES.APP_NOT_FOUND, message: 'App not found' }, 404)
    }

    // Use a batch to update all devices in a transaction
    const placeholders = deviceIds.map(() => '?').join(', ')
    const result = await c.env.DB.prepare(`
      UPDATE devices SET target_group = ?
      WHERE app_id = ? AND device_id IN (${placeholders})
    `).bind(targetGroup, appId, ...deviceIds).run()

    return c.json({ success: true, updated: result.meta.changes })
  }
)
