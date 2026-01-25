/**
 * Android Build System Routes
 *
 * Manages Android app builds and signing for BundleNudge
 *
 * @agent android-builds
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

interface AuthVariables {
  user: AuthUser
}

interface AndroidBuildRow {
  id: string
  app_id: string
  version: string
  version_code: number
  status: 'pending' | 'building' | 'signing' | 'uploading' | 'complete' | 'failed'
  build_type: 'debug' | 'release'
  flavor: string | null
  package_name: string
  keystore_alias: string | null
  artifact_url: string | null
  artifact_size: number | null
  artifact_type: 'apk' | 'aab'
  logs: string | null
  error: string | null
  started_at: number | null
  completed_at: number | null
  created_at: number
}

interface AppRow {
  id: string
  owner_id: string
}

// =============================================================================
// Schemas
// =============================================================================

const triggerBuildSchema = z.object({
  version: z.string().min(1).max(50),
  versionCode: z.number().int().positive().optional(),
  buildType: z.enum(['debug', 'release']),
  flavor: z.string().min(1).max(50).optional(),
  packageName: z.string().min(1).max(255),
  artifactType: z.enum(['apk', 'aab']),
})

export type TriggerBuildInput = z.infer<typeof triggerBuildSchema>

// =============================================================================
// Constants
// =============================================================================

const BUILD_STATUS = {
  PENDING: 'pending',
  BUILDING: 'building',
  SIGNING: 'signing',
  UPLOADING: 'uploading',
  COMPLETE: 'complete',
  FAILED: 'failed',
} as const

const CANCELABLE_STATUSES = [BUILD_STATUS.PENDING, BUILD_STATUS.BUILDING] as const

// =============================================================================
// Router
// =============================================================================

export const androidBuildsRouter = new Hono<{
  Bindings: Env
  Variables: AuthVariables
}>()

androidBuildsRouter.use('*', authMiddleware)

// =============================================================================
// Helpers
// =============================================================================

async function verifyAppOwnership(
  db: D1Database,
  appId: string,
  userId: string
): Promise<AppRow | null> {
  return db.prepare(
    'SELECT id, owner_id FROM apps WHERE id = ? AND owner_id = ? AND deleted_at IS NULL'
  ).bind(appId, userId).first<AppRow>()
}

async function getNextVersionCode(
  db: D1Database,
  appId: string
): Promise<number> {
  const result = await db.prepare(
    'SELECT MAX(version_code) as max_code FROM android_builds WHERE app_id = ?'
  ).bind(appId).first<{ max_code: number | null }>()

  return (result?.max_code ?? 0) + 1
}

function formatBuildResponse(row: AndroidBuildRow): {
  id: string
  appId: string
  version: string
  versionCode: number
  status: AndroidBuildRow['status']
  platform: 'android'
  buildType: AndroidBuildRow['build_type']
  flavor: string | null
  packageName: string
  keystoreAlias: string | null
  artifactUrl: string | null
  artifactSize: number | null
  artifactType: AndroidBuildRow['artifact_type']
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
    versionCode: row.version_code,
    status: row.status,
    platform: 'android' as const,
    buildType: row.build_type,
    flavor: row.flavor,
    packageName: row.package_name,
    keystoreAlias: row.keystore_alias,
    artifactUrl: row.artifact_url,
    artifactSize: row.artifact_size,
    artifactType: row.artifact_type,
    logs: row.logs,
    error: row.error,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    createdAt: row.created_at,
  }
}

// =============================================================================
// Routes
// =============================================================================

/**
 * GET /v1/apps/:appId/builds/android
 * List Android builds for an app with pagination
 */
androidBuildsRouter.get('/:appId/builds/android', async (c) => {
  const user = c.get('user')
  const appId = c.req.param('appId')
  const limit = Math.min(Number(c.req.query('limit')) || 20, 100)
  const offset = Number(c.req.query('offset')) || 0

  const app = await verifyAppOwnership(c.env.DB, appId, user.id)
  if (!app) {
    return c.json(
      { error: ERROR_CODES.APP_NOT_FOUND, message: 'App not found' },
      404
    )
  }

  const countResult = await c.env.DB.prepare(
    'SELECT COUNT(*) as total FROM android_builds WHERE app_id = ?'
  ).bind(appId).first<{ total: number }>()
  const total = countResult?.total ?? 0

  const results = await c.env.DB.prepare(`
    SELECT * FROM android_builds
    WHERE app_id = ?
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `).bind(appId, limit, offset).all<AndroidBuildRow>()

  return c.json({
    data: results.results.map(formatBuildResponse),
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + results.results.length < total,
    },
  })
})

/**
 * POST /v1/apps/:appId/builds/android
 * Trigger a new Android build
 */
androidBuildsRouter.post(
  '/:appId/builds/android',
  zValidator('json', triggerBuildSchema),
  async (c) => {
    const user = c.get('user')
    const appId = c.req.param('appId')
    const data = c.req.valid('json')

    const app = await verifyAppOwnership(c.env.DB, appId, user.id)
    if (!app) {
      return c.json(
        { error: ERROR_CODES.APP_NOT_FOUND, message: 'App not found' },
        404
      )
    }

    const versionCode = data.versionCode ?? await getNextVersionCode(c.env.DB, appId)

    // Check for duplicate version + versionCode
    const existing = await c.env.DB.prepare(
      'SELECT id FROM android_builds WHERE app_id = ? AND version = ? AND version_code = ?'
    ).bind(appId, data.version, versionCode).first()

    if (existing) {
      return c.json(
        { error: ERROR_CODES.ALREADY_EXISTS, message: 'Build with this version and version code already exists' },
        409
      )
    }

    const buildId = crypto.randomUUID()
    const now = Math.floor(Date.now() / 1000)

    await c.env.DB.prepare(`
      INSERT INTO android_builds (
        id, app_id, version, version_code, status, build_type,
        flavor, package_name, artifact_type, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      buildId,
      appId,
      data.version,
      versionCode,
      BUILD_STATUS.PENDING,
      data.buildType,
      data.flavor ?? null,
      data.packageName,
      data.artifactType,
      now
    ).run()

    const build = await c.env.DB.prepare(
      'SELECT * FROM android_builds WHERE id = ?'
    ).bind(buildId).first<AndroidBuildRow>()

    if (!build) {
      return c.json(
        { error: ERROR_CODES.INTERNAL_ERROR, message: 'Failed to create build' },
        500
      )
    }

    return c.json({ build: formatBuildResponse(build) }, 201)
  }
)

/**
 * GET /v1/apps/:appId/builds/android/:buildId
 * Get Android build details
 */
androidBuildsRouter.get('/:appId/builds/android/:buildId', async (c) => {
  const user = c.get('user')
  const appId = c.req.param('appId')
  const buildId = c.req.param('buildId')

  const app = await verifyAppOwnership(c.env.DB, appId, user.id)
  if (!app) {
    return c.json(
      { error: ERROR_CODES.APP_NOT_FOUND, message: 'App not found' },
      404
    )
  }

  const build = await c.env.DB.prepare(
    'SELECT * FROM android_builds WHERE id = ? AND app_id = ?'
  ).bind(buildId, appId).first<AndroidBuildRow>()

  if (!build) {
    return c.json(
      { error: ERROR_CODES.NOT_FOUND, message: 'Build not found' },
      404
    )
  }

  return c.json({ build: formatBuildResponse(build) })
})

/**
 * DELETE /v1/apps/:appId/builds/android/:buildId
 * Cancel or delete an Android build
 */
androidBuildsRouter.delete('/:appId/builds/android/:buildId', async (c) => {
  const user = c.get('user')
  const appId = c.req.param('appId')
  const buildId = c.req.param('buildId')

  const app = await verifyAppOwnership(c.env.DB, appId, user.id)
  if (!app) {
    return c.json(
      { error: ERROR_CODES.APP_NOT_FOUND, message: 'App not found' },
      404
    )
  }

  const build = await c.env.DB.prepare(
    'SELECT * FROM android_builds WHERE id = ? AND app_id = ?'
  ).bind(buildId, appId).first<AndroidBuildRow>()

  if (!build) {
    return c.json(
      { error: ERROR_CODES.NOT_FOUND, message: 'Build not found' },
      404
    )
  }

  // Only allow cancellation of pending or building builds
  const isCancelable = CANCELABLE_STATUSES.includes(
    build.status as typeof CANCELABLE_STATUSES[number]
  )

  if (!isCancelable && build.status !== BUILD_STATUS.FAILED) {
    return c.json(
      { error: ERROR_CODES.INVALID_STATE, message: 'Cannot delete a completed build' },
      400
    )
  }

  // For pending/building builds, mark as failed (cancelled)
  if (isCancelable) {
    const now = Math.floor(Date.now() / 1000)
    await c.env.DB.prepare(`
      UPDATE android_builds
      SET status = ?, error = ?, completed_at = ?
      WHERE id = ?
    `).bind(BUILD_STATUS.FAILED, 'Build cancelled by user', now, buildId).run()

    return c.json({ success: true, cancelled: true })
  }

  // For failed builds, delete entirely
  await c.env.DB.prepare(
    'DELETE FROM android_builds WHERE id = ?'
  ).bind(buildId).run()

  return c.json({ success: true, deleted: true })
})
