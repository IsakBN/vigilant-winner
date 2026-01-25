/**
 * iOS Build System Routes
 *
 * Manages iOS app builds and signing for BundleNudge.
 * Handles build lifecycle: trigger, monitor, download, cancel.
 *
 * @agent ios-builds
 * @created 2026-01-26
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

interface iOSBuildRow {
  id: string
  app_id: string
  version: string
  build_number: number
  status: 'pending' | 'building' | 'signing' | 'uploading' | 'complete' | 'failed'
  configuration: 'debug' | 'release'
  bundle_id: string
  team_id: string | null
  provisioning_profile: string | null
  artifact_url: string | null
  artifact_size: number | null
  logs: string | null
  error: string | null
  started_at: number | null
  completed_at: number | null
  created_at: number
}

interface AuthVariables {
  user: AuthUser
}

// =============================================================================
// Schemas
// =============================================================================

const triggerBuildSchema = z.object({
  version: z.string().min(1).max(50),
  buildNumber: z.number().int().positive().optional(),
  configuration: z.enum(['debug', 'release']).default('release'),
  bundleId: z.string().min(1).max(255),
  teamId: z.string().max(20).optional(),
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

function formatBuild(row: iOSBuildRow): {
  id: string
  appId: string
  version: string
  buildNumber: number
  status: iOSBuildRow['status']
  platform: 'ios'
  configuration: iOSBuildRow['configuration']
  bundleId: string
  teamId: string | null
  provisioningProfile: string | null
  artifactUrl: string | null
  artifactSize: number | null
  logs: string | null
  error: string | null
  startedAt: number | null
  completedAt: number | null
  createdAt: number
} {
  return {
    id: row.id,
    appId: row.app_id,
    version: row.version,
    buildNumber: row.build_number,
    status: row.status,
    platform: 'ios' as const,
    configuration: row.configuration,
    bundleId: row.bundle_id,
    teamId: row.team_id,
    provisioningProfile: row.provisioning_profile,
    artifactUrl: row.artifact_url,
    artifactSize: row.artifact_size,
    logs: row.logs,
    error: row.error,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    createdAt: row.created_at,
  }
}

async function getNextBuildNumber(
  db: Env['DB'],
  appId: string,
  version: string
): Promise<number> {
  const result = await db.prepare(`
    SELECT MAX(build_number) as max_build FROM ios_builds
    WHERE app_id = ? AND version = ?
  `).bind(appId, version).first<{ max_build: number | null }>()

  return (result?.max_build ?? 0) + 1
}

// =============================================================================
// Router
// =============================================================================

export const iosBuildRoutes = new Hono<{
  Bindings: Env
  Variables: AuthVariables
}>()

iosBuildRoutes.use('*', authMiddleware)

/**
 * GET /v1/apps/:appId/builds/ios - List iOS builds
 */
iosBuildRoutes.get('/:appId/builds/ios', async (c) => {
  const user = c.get('user')
  const appId = c.req.param('appId')
  const limit = Math.min(Number(c.req.query('limit')) || 20, 100)
  const offset = Number(c.req.query('offset')) || 0
  const status = c.req.query('status')
  const version = c.req.query('version')

  if (!await verifyAppOwnership(c.env.DB, appId, user.id)) {
    return c.json(
      { error: ERROR_CODES.APP_NOT_FOUND, message: 'App not found' },
      404
    )
  }

  // Build query with optional filters
  const conditions = ['app_id = ?']
  const params: (string | number)[] = [appId]

  if (status) {
    conditions.push('status = ?')
    params.push(status)
  }
  if (version) {
    conditions.push('version = ?')
    params.push(version)
  }

  const whereClause = conditions.join(' AND ')

  // Get total count
  const countResult = await c.env.DB.prepare(
    `SELECT COUNT(*) as total FROM ios_builds WHERE ${whereClause}`
  ).bind(...params).first<{ total: number }>()
  const total = countResult?.total ?? 0

  // Get paginated results
  const results = await c.env.DB.prepare(`
    SELECT * FROM ios_builds WHERE ${whereClause}
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `).bind(...params, limit, offset).all<iOSBuildRow>()

  return c.json({
    data: results.results.map(formatBuild),
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + results.results.length < total,
    },
  })
})

/**
 * POST /v1/apps/:appId/builds/ios - Trigger new iOS build
 */
iosBuildRoutes.post(
  '/:appId/builds/ios',
  zValidator('json', triggerBuildSchema),
  async (c) => {
    const user = c.get('user')
    const appId = c.req.param('appId')
    const data = c.req.valid('json')

    if (!await verifyAppOwnership(c.env.DB, appId, user.id)) {
      return c.json(
        { error: ERROR_CODES.APP_NOT_FOUND, message: 'App not found' },
        404
      )
    }

    // Determine build number (auto-increment if not provided)
    const buildNumber = data.buildNumber ??
      await getNextBuildNumber(c.env.DB, appId, data.version)

    // Check for duplicate version + build number
    const existing = await c.env.DB.prepare(`
      SELECT id FROM ios_builds
      WHERE app_id = ? AND version = ? AND build_number = ?
    `).bind(appId, data.version, buildNumber).first()

    if (existing) {
      return c.json({
        error: ERROR_CODES.ALREADY_EXISTS,
        message: `Build ${data.version} (${String(buildNumber)}) already exists`,
      }, 409)
    }

    const buildId = crypto.randomUUID()
    const now = Math.floor(Date.now() / 1000)

    await c.env.DB.prepare(`
      INSERT INTO ios_builds (
        id, app_id, version, build_number, status, configuration,
        bundle_id, team_id, created_at
      ) VALUES (?, ?, ?, ?, 'pending', ?, ?, ?, ?)
    `).bind(
      buildId,
      appId,
      data.version,
      buildNumber,
      data.configuration,
      data.bundleId,
      data.teamId ?? null,
      now
    ).run()

    const build = await c.env.DB.prepare(
      'SELECT * FROM ios_builds WHERE id = ?'
    ).bind(buildId).first<iOSBuildRow>()

    if (!build) {
      return c.json(
        { error: ERROR_CODES.INTERNAL_ERROR, message: 'Failed to create build' },
        500
      )
    }

    return c.json({ build: formatBuild(build) }, 201)
  }
)

/**
 * GET /v1/apps/:appId/builds/ios/:buildId - Get build details
 */
iosBuildRoutes.get('/:appId/builds/ios/:buildId', async (c) => {
  const user = c.get('user')
  const { appId, buildId } = c.req.param()

  if (!await verifyAppOwnership(c.env.DB, appId, user.id)) {
    return c.json(
      { error: ERROR_CODES.APP_NOT_FOUND, message: 'App not found' },
      404
    )
  }

  const build = await c.env.DB.prepare(`
    SELECT * FROM ios_builds WHERE id = ? AND app_id = ?
  `).bind(buildId, appId).first<iOSBuildRow>()

  if (!build) {
    return c.json(
      { error: ERROR_CODES.NOT_FOUND, message: 'Build not found' },
      404
    )
  }

  return c.json({ build: formatBuild(build) })
})

/**
 * DELETE /v1/apps/:appId/builds/ios/:buildId - Cancel/delete build
 */
iosBuildRoutes.delete('/:appId/builds/ios/:buildId', async (c) => {
  const user = c.get('user')
  const { appId, buildId } = c.req.param()

  if (!await verifyAppOwnership(c.env.DB, appId, user.id)) {
    return c.json(
      { error: ERROR_CODES.APP_NOT_FOUND, message: 'App not found' },
      404
    )
  }

  const build = await c.env.DB.prepare(`
    SELECT * FROM ios_builds WHERE id = ? AND app_id = ?
  `).bind(buildId, appId).first<iOSBuildRow>()

  if (!build) {
    return c.json(
      { error: ERROR_CODES.NOT_FOUND, message: 'Build not found' },
      404
    )
  }

  // Only allow canceling pending or in-progress builds
  const cancelableStatuses = ['pending', 'building', 'signing', 'uploading']
  if (!cancelableStatuses.includes(build.status)) {
    return c.json({
      error: ERROR_CODES.INVALID_STATE,
      message: `Cannot cancel build with status: ${build.status}`,
    }, 400)
  }

  const now = Math.floor(Date.now() / 1000)

  await c.env.DB.prepare(`
    UPDATE ios_builds
    SET status = 'failed', error = 'Cancelled by user', completed_at = ?
    WHERE id = ?
  `).bind(now, buildId).run()

  return c.json({ success: true, cancelled: true })
})
