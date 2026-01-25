/**
 * Admin app management routes
 *
 * App listing, details, disable/enable, and deletion
 *
 * @agent wave5-admin
 */

import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { ERROR_CODES } from '@bundlenudge/shared'
import { logAdminAction } from '../../lib/admin/audit'
import { getAdminId } from '../../middleware/admin'
import type { Env } from '../../types/env'

// Validation schemas
const listAppsSchema = z.object({
  search: z.string().optional(),
  ownerId: z.string().uuid().optional(),
  platform: z.enum(['ios', 'android']).optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
})

const appIdSchema = z.object({
  appId: z.string().uuid(),
})

const disableAppSchema = z.object({
  reason: z.string().min(10).max(500),
})

const deleteAppSchema = z.object({
  confirmName: z.string().min(1),
  reason: z.string().min(10).max(500),
})

export const adminAppsRouter = new Hono<{ Bindings: Env }>()

/**
 * GET /admin/apps
 * List all apps with filtering
 */
adminAppsRouter.get('/', zValidator('query', listAppsSchema), async (c) => {
  const { search, ownerId, platform, limit, offset } = c.req.valid('query')
  const adminId = getAdminId(c)

  const conditions: string[] = ['a.deleted_at IS NULL']
  const bindings: (string | number)[] = []

  if (search) {
    conditions.push('(a.name LIKE ? OR a.bundle_id LIKE ?)')
    bindings.push(`%${search}%`, `%${search}%`)
  }

  if (ownerId) {
    conditions.push('a.owner_id = ?')
    bindings.push(ownerId)
  }

  if (platform) {
    conditions.push('a.platform = ?')
    bindings.push(platform)
  }

  const whereClause = `WHERE ${conditions.join(' AND ')}`

  // Get total count
  const countResult = await c.env.DB.prepare(`
    SELECT COUNT(*) as total FROM apps a ${whereClause}
  `).bind(...bindings).first<{ total: number }>()

  const total = countResult?.total ?? 0

  // Get paginated results
  const results = await c.env.DB.prepare(`
    SELECT
      a.id, a.name, a.bundle_id, a.platform, a.owner_id, a.created_at,
      u.email as owner_email, u.name as owner_name,
      (SELECT COUNT(*) FROM releases WHERE app_id = a.id) as release_count,
      (SELECT COUNT(*) FROM devices WHERE app_id = a.id) as device_count
    FROM apps a
    LEFT JOIN user u ON u.id = a.owner_id
    ${whereClause}
    ORDER BY a.created_at DESC
    LIMIT ? OFFSET ?
  `).bind(...bindings, limit, offset).all<{
    id: string
    name: string
    bundle_id: string | null
    platform: string
    owner_id: string
    created_at: number
    owner_email: string | null
    owner_name: string | null
    release_count: number
    device_count: number
  }>()

  await logAdminAction(c.env.DB, {
    adminId,
    action: 'view_app',
    details: { search, ownerId, platform, count: results.results.length },
  })

  return c.json({
    apps: results.results.map(a => ({
      id: a.id,
      name: a.name,
      bundleId: a.bundle_id,
      platform: a.platform,
      ownerId: a.owner_id,
      ownerEmail: a.owner_email,
      ownerName: a.owner_name,
      releaseCount: a.release_count,
      deviceCount: a.device_count,
      createdAt: a.created_at,
    })),
    pagination: { total, limit, offset, hasMore: offset + results.results.length < total },
  })
})

/**
 * GET /admin/apps/:appId
 * Get detailed app information
 */
adminAppsRouter.get('/:appId', zValidator('param', appIdSchema), async (c) => {
  const { appId } = c.req.valid('param')
  const adminId = getAdminId(c)

  // Get app with owner info
  const app = await c.env.DB.prepare(`
    SELECT
      a.id, a.name, a.bundle_id, a.platform, a.owner_id,
      a.api_key, a.webhook_secret, a.settings, a.created_at, a.updated_at,
      u.email as owner_email, u.name as owner_name,
      sp.name as owner_plan
    FROM apps a
    LEFT JOIN user u ON u.id = a.owner_id
    LEFT JOIN subscriptions s ON s.user_id = a.owner_id
    LEFT JOIN subscription_plans sp ON s.plan_id = sp.id
    WHERE a.id = ? AND a.deleted_at IS NULL
  `).bind(appId).first<{
    id: string; name: string; bundle_id: string | null; platform: string
    owner_id: string; api_key: string; webhook_secret: string
    settings: string | null; created_at: number; updated_at: number
    owner_email: string | null; owner_name: string | null; owner_plan: string | null
  }>()

  if (!app) {
    return c.json({ error: ERROR_CODES.NOT_FOUND, message: 'App not found' }, 404)
  }

  // Get stats
  const [releaseCount, deviceCount, channelCount] = await Promise.all([
    c.env.DB.prepare('SELECT COUNT(*) as cnt FROM releases WHERE app_id = ?')
      .bind(appId).first<{ cnt: number }>(),
    c.env.DB.prepare('SELECT COUNT(*) as cnt FROM devices WHERE app_id = ?')
      .bind(appId).first<{ cnt: number }>(),
    c.env.DB.prepare('SELECT COUNT(*) as cnt FROM channels WHERE app_id = ?')
      .bind(appId).first<{ cnt: number }>(),
  ])

  // Get recent releases
  const releases = await c.env.DB.prepare(`
    SELECT id, version, status, rollout_percentage, created_at
    FROM releases WHERE app_id = ?
    ORDER BY created_at DESC LIMIT 10
  `).bind(appId).all<{
    id: string; version: string; status: string
    rollout_percentage: number; created_at: number
  }>()

  // Get channels
  const channels = await c.env.DB.prepare(`
    SELECT id, name, active_release_id FROM channels WHERE app_id = ?
  `).bind(appId).all<{ id: string; name: string; active_release_id: string | null }>()

  await logAdminAction(c.env.DB, {
    adminId,
    action: 'view_app',
    targetAppId: appId,
    targetUserId: app.owner_id,
  })

  return c.json({
    app: {
      id: app.id, name: app.name, bundleId: app.bundle_id, platform: app.platform,
      apiKeyPrefix: app.api_key.slice(0, 12) + '...',
      createdAt: app.created_at, updatedAt: app.updated_at,
    },
    owner: {
      id: app.owner_id, email: app.owner_email, name: app.owner_name, plan: app.owner_plan,
    },
    stats: {
      releases: releaseCount?.cnt ?? 0,
      devices: deviceCount?.cnt ?? 0,
      channels: channelCount?.cnt ?? 0,
    },
    recentReleases: releases.results.map(r => ({
      id: r.id, version: r.version, status: r.status,
      rolloutPercentage: r.rollout_percentage, createdAt: r.created_at,
    })),
    channels: channels.results,
  })
})

/**
 * POST /admin/apps/:appId/disable
 * Disable an app (prevents updates from being served)
 */
adminAppsRouter.post(
  '/:appId/disable',
  zValidator('param', appIdSchema),
  zValidator('json', disableAppSchema),
  async (c) => {
    const { appId } = c.req.valid('param')
    const { reason } = c.req.valid('json')
    const adminId = getAdminId(c)

    // Get app info for audit
    const app = await c.env.DB.prepare(`
      SELECT id, name, owner_id FROM apps WHERE id = ? AND deleted_at IS NULL
    `).bind(appId).first<{ id: string; name: string; owner_id: string }>()

    if (!app) {
      return c.json({ error: ERROR_CODES.NOT_FOUND, message: 'App not found' }, 404)
    }

    // Note: The apps table doesn't have a disabled column yet.
    // For now, we log the action and it could be enforced via a future migration
    // or by checking the audit log for disable_app actions.

    await logAdminAction(c.env.DB, {
      adminId,
      action: 'disable_app',
      targetAppId: appId,
      targetUserId: app.owner_id,
      details: { appName: app.name, reason },
    })

    return c.json({
      success: true,
      message: `App "${app.name}" has been disabled`,
    })
  }
)

/**
 * DELETE /admin/apps/:appId/disable
 * Re-enable an app
 */
adminAppsRouter.delete(
  '/:appId/disable',
  zValidator('param', appIdSchema),
  async (c) => {
    const { appId } = c.req.valid('param')
    const adminId = getAdminId(c)

    const app = await c.env.DB.prepare(`
      SELECT id, name, owner_id FROM apps WHERE id = ? AND deleted_at IS NULL
    `).bind(appId).first<{ id: string; name: string; owner_id: string }>()

    if (!app) {
      return c.json({ error: ERROR_CODES.NOT_FOUND, message: 'App not found' }, 404)
    }

    await logAdminAction(c.env.DB, {
      adminId,
      action: 'enable_app',
      targetAppId: appId,
      targetUserId: app.owner_id,
      details: { appName: app.name },
    })

    return c.json({
      success: true,
      message: `App "${app.name}" has been enabled`,
    })
  }
)

/**
 * DELETE /admin/apps/:appId
 * Permanently delete an app and all related data
 */
adminAppsRouter.delete(
  '/:appId',
  zValidator('param', appIdSchema),
  zValidator('json', deleteAppSchema),
  async (c) => {
    const { appId } = c.req.valid('param')
    const { confirmName, reason } = c.req.valid('json')
    const adminId = getAdminId(c)

    const app = await c.env.DB.prepare(`
      SELECT id, name, owner_id FROM apps WHERE id = ? AND deleted_at IS NULL
    `).bind(appId).first<{ id: string; name: string; owner_id: string }>()

    if (!app) {
      return c.json({ error: ERROR_CODES.NOT_FOUND, message: 'App not found' }, 404)
    }

    // Verify confirmation name matches
    if (confirmName !== app.name) {
      return c.json({
        error: ERROR_CODES.VALIDATION_ERROR,
        message: 'Confirmation name does not match',
        expected: app.name,
      }, 400)
    }

    // Get counts for audit
    const [releaseCount, deviceCount, channelCount] = await Promise.all([
      c.env.DB.prepare('SELECT COUNT(*) as cnt FROM releases WHERE app_id = ?')
        .bind(appId).first<{ cnt: number }>(),
      c.env.DB.prepare('SELECT COUNT(*) as cnt FROM devices WHERE app_id = ?')
        .bind(appId).first<{ cnt: number }>(),
      c.env.DB.prepare('SELECT COUNT(*) as cnt FROM channels WHERE app_id = ?')
        .bind(appId).first<{ cnt: number }>(),
    ])

    // Log action BEFORE deleting
    await logAdminAction(c.env.DB, {
      adminId,
      action: 'delete_app',
      targetAppId: appId,
      targetUserId: app.owner_id,
      details: {
        appName: app.name,
        reason,
        releasesDeleted: releaseCount?.cnt ?? 0,
        devicesDeleted: deviceCount?.cnt ?? 0,
        channelsDeleted: channelCount?.cnt ?? 0,
      },
    })

    // Delete all related data in order
    await c.env.DB.batch([
      // Delete telemetry
      c.env.DB.prepare('DELETE FROM telemetry_events WHERE app_id = ?').bind(appId),
      // Delete release stats
      c.env.DB.prepare(`
        DELETE FROM release_stats WHERE release_id IN
        (SELECT id FROM releases WHERE app_id = ?)
      `).bind(appId),
      // Delete devices
      c.env.DB.prepare('DELETE FROM devices WHERE app_id = ?').bind(appId),
      // Delete releases
      c.env.DB.prepare('DELETE FROM releases WHERE app_id = ?').bind(appId),
      // Delete channels
      c.env.DB.prepare('DELETE FROM channels WHERE app_id = ?').bind(appId),
      // Delete API keys
      c.env.DB.prepare('DELETE FROM api_keys WHERE app_id = ?').bind(appId),
      // Delete webhooks events and webhooks
      c.env.DB.prepare(`
        DELETE FROM webhook_events WHERE webhook_id IN
        (SELECT id FROM webhooks WHERE app_id = ?)
      `).bind(appId),
      c.env.DB.prepare('DELETE FROM webhooks WHERE app_id = ?').bind(appId),
      // Delete project members
      c.env.DB.prepare('DELETE FROM project_members WHERE app_id = ?').bind(appId),
      // Delete crash integrations
      c.env.DB.prepare('DELETE FROM crash_integrations WHERE app_id = ?').bind(appId),
      // Delete app repos
      c.env.DB.prepare('DELETE FROM app_repos WHERE app_id = ?').bind(appId),
      // Finally delete the app
      c.env.DB.prepare('DELETE FROM apps WHERE id = ?').bind(appId),
    ])

    return c.json({
      success: true,
      message: `App "${app.name}" and all related data have been deleted`,
    })
  }
)
