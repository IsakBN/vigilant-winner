/**
 * Releases CRUD routes
 *
 * Handles release creation, management, and bundle uploads
 *
 * @agent fix-subscription-enforcement
 * @modified 2026-01-25
 */

import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import {
  createReleaseSchema,
  updateReleaseSchema,
  updateRolloutSchema,
  ERROR_CODES,
} from '@bundlenudge/shared'
import { authMiddleware, type AuthUser } from '../../middleware/auth'
import { checkStorageLimitWithAddition } from '../../lib/subscription-limits'
import type { Env } from '../../types/env'

interface ReleaseRow {
  id: string
  app_id: string
  version: string
  bundle_url: string
  bundle_size: number
  bundle_hash: string
  rollout_percentage: number
  targeting_rules: string | null
  release_notes: string | null
  status: 'active' | 'paused' | 'rolled_back'
  rollback_reason: string | null
  min_app_version: string | null
  max_app_version: string | null
  created_at: number
  updated_at: number
}

interface ReleaseStats {
  total_downloads: number
  total_installs: number
  total_rollbacks: number
  total_crashes: number
}

interface AuthVariables {
  user: AuthUser
}

export const releasesRoutes = new Hono<{ Bindings: Env; Variables: AuthVariables }>()

// All routes require authentication
releasesRoutes.use('*', authMiddleware)

/**
 * List releases for an app
 */
releasesRoutes.get('/:appId', async (c) => {
  const user = c.get('user')
  const appId = c.req.param('appId')

  // Verify app ownership
  const app = await c.env.DB.prepare(
    'SELECT * FROM apps WHERE id = ? AND owner_id = ? AND deleted_at IS NULL'
  ).bind(appId, user.id).first()

  if (!app) {
    return c.json(
      { error: ERROR_CODES.APP_NOT_FOUND, message: 'App not found' },
      404
    )
  }

  const results = await c.env.DB.prepare(`
    SELECT * FROM releases
    WHERE app_id = ?
    ORDER BY created_at DESC
  `).bind(appId).all<ReleaseRow>()

  return c.json({ releases: results.results })
})

/**
 * Get single release with stats
 */
releasesRoutes.get('/:appId/:releaseId', async (c) => {
  const user = c.get('user')
  const appId = c.req.param('appId')
  const releaseId = c.req.param('releaseId')

  // Verify app ownership
  const app = await c.env.DB.prepare(
    'SELECT * FROM apps WHERE id = ? AND owner_id = ? AND deleted_at IS NULL'
  ).bind(appId, user.id).first()

  if (!app) {
    return c.json(
      { error: ERROR_CODES.APP_NOT_FOUND, message: 'App not found' },
      404
    )
  }

  const release = await c.env.DB.prepare(
    'SELECT * FROM releases WHERE id = ? AND app_id = ?'
  ).bind(releaseId, appId).first<ReleaseRow>()

  if (!release) {
    return c.json(
      { error: ERROR_CODES.RELEASE_NOT_FOUND, message: 'Release not found' },
      404
    )
  }

  // Get stats
  const stats = await c.env.DB.prepare(
    'SELECT * FROM release_stats WHERE release_id = ?'
  ).bind(releaseId).first<ReleaseStats>()

  return c.json({
    release,
    stats: stats ?? {
      total_downloads: 0,
      total_installs: 0,
      total_rollbacks: 0,
      total_crashes: 0,
    },
  })
})

/**
 * Create new release (metadata only, bundle uploaded separately)
 */
releasesRoutes.post(
  '/:appId',
  zValidator('json', createReleaseSchema),
  async (c) => {
    const user = c.get('user')
    const appId = c.req.param('appId')
    const data = c.req.valid('json')

    // Verify app ownership
    const app = await c.env.DB.prepare(
      'SELECT * FROM apps WHERE id = ? AND owner_id = ? AND deleted_at IS NULL'
    ).bind(appId, user.id).first()

    if (!app) {
      return c.json(
        { error: ERROR_CODES.APP_NOT_FOUND, message: 'App not found' },
        404
      )
    }

    // Check for duplicate version
    const existing = await c.env.DB.prepare(
      'SELECT id FROM releases WHERE app_id = ? AND version = ?'
    ).bind(appId, data.version).first()

    if (existing) {
      return c.json(
        { error: ERROR_CODES.DUPLICATE_VERSION, message: 'Version already exists' },
        409
      )
    }

    const releaseId = crypto.randomUUID()
    const now = Math.floor(Date.now() / 1000)

    // Create release with placeholder bundle info (will be updated on upload)
    await c.env.DB.prepare(`
      INSERT INTO releases (
        id, app_id, version, bundle_url, bundle_size, bundle_hash,
        release_notes, min_app_version, max_app_version, status,
        rollout_percentage, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      releaseId,
      appId,
      data.version,
      '', // Placeholder - updated on bundle upload
      0,
      '',
      data.releaseNotes ?? null,
      data.minAppVersion ?? null,
      data.maxAppVersion ?? null,
      'paused', // Start paused until bundle is uploaded
      100,
      now,
      now
    ).run()

    const release = await c.env.DB.prepare(
      'SELECT * FROM releases WHERE id = ?'
    ).bind(releaseId).first<ReleaseRow>()

    return c.json({ release }, 201)
  }
)

/**
 * Upload bundle for a release
 */
releasesRoutes.post('/:appId/:releaseId/bundle', async (c) => {
  const user = c.get('user')
  const appId = c.req.param('appId')
  const releaseId = c.req.param('releaseId')

  // Verify app ownership
  const app = await c.env.DB.prepare(
    'SELECT * FROM apps WHERE id = ? AND owner_id = ? AND deleted_at IS NULL'
  ).bind(appId, user.id).first()

  if (!app) {
    return c.json(
      { error: ERROR_CODES.APP_NOT_FOUND, message: 'App not found' },
      404
    )
  }

  const release = await c.env.DB.prepare(
    'SELECT * FROM releases WHERE id = ? AND app_id = ?'
  ).bind(releaseId, appId).first<ReleaseRow>()

  if (!release) {
    return c.json(
      { error: ERROR_CODES.RELEASE_NOT_FOUND, message: 'Release not found' },
      404
    )
  }

  // Get the raw body as ArrayBuffer
  const body = await c.req.arrayBuffer()
  if (body.byteLength === 0) {
    return c.json(
      { error: ERROR_CODES.VALIDATION_ERROR, message: 'Bundle file required' },
      400
    )
  }

  // Check storage limit before upload
  const storageCheck = await checkStorageLimitWithAddition(c.env, user.id, body.byteLength)
  if (!storageCheck.allowed) {
    return c.json(
      {
        error: ERROR_CODES.STORAGE_LIMIT_EXCEEDED,
        message: storageCheck.message ?? 'Storage limit exceeded. Please upgrade your plan.',
      },
      403
    )
  }

  // Calculate hash
  const hashBuffer = await crypto.subtle.digest('SHA-256', body)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const bundleHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

  // Upload to R2
  const bundleKey = `${appId}/${releaseId}/bundle.js`
  await c.env.BUNDLES.put(bundleKey, body, {
    httpMetadata: { contentType: 'application/javascript' },
    customMetadata: { version: release.version, hash: bundleHash },
  })

  // Update release with bundle info
  const bundleUrl = `${c.env.API_URL}/v1/bundles/${bundleKey}`
  const now = Math.floor(Date.now() / 1000)

  await c.env.DB.prepare(`
    UPDATE releases
    SET bundle_url = ?, bundle_size = ?, bundle_hash = ?, updated_at = ?
    WHERE id = ?
  `).bind(bundleUrl, body.byteLength, bundleHash, now, releaseId).run()

  const updated = await c.env.DB.prepare(
    'SELECT * FROM releases WHERE id = ?'
  ).bind(releaseId).first<ReleaseRow>()

  return c.json({ release: updated, bundleUrl, bundleSize: body.byteLength })
})

/**
 * Update release metadata
 */
releasesRoutes.patch(
  '/:appId/:releaseId',
  zValidator('json', updateReleaseSchema),
  async (c) => {
    const user = c.get('user')
    const appId = c.req.param('appId')
    const releaseId = c.req.param('releaseId')
    const data = c.req.valid('json')

    // Verify app ownership
    const app = await c.env.DB.prepare(
      'SELECT * FROM apps WHERE id = ? AND owner_id = ? AND deleted_at IS NULL'
    ).bind(appId, user.id).first()

    if (!app) {
      return c.json(
        { error: ERROR_CODES.APP_NOT_FOUND, message: 'App not found' },
        404
      )
    }

    const release = await c.env.DB.prepare(
      'SELECT * FROM releases WHERE id = ? AND app_id = ?'
    ).bind(releaseId, appId).first<ReleaseRow>()

    if (!release) {
      return c.json(
        { error: ERROR_CODES.RELEASE_NOT_FOUND, message: 'Release not found' },
        404
      )
    }

    const updates: string[] = []
    const values: (string | number | null)[] = []

    if (data.releaseNotes !== undefined) {
      updates.push('release_notes = ?')
      values.push(data.releaseNotes ?? null)
    }
    if (data.status !== undefined) {
      updates.push('status = ?')
      values.push(data.status)
    }
    if (data.rollbackReason !== undefined) {
      updates.push('rollback_reason = ?')
      values.push(data.rollbackReason ?? null)
    }

    if (updates.length === 0) {
      return c.json({ release })
    }

    const now = Math.floor(Date.now() / 1000)
    updates.push('updated_at = ?')
    values.push(now)
    values.push(releaseId)

    await c.env.DB.prepare(
      `UPDATE releases SET ${updates.join(', ')} WHERE id = ?`
    ).bind(...values).run()

    const updated = await c.env.DB.prepare(
      'SELECT * FROM releases WHERE id = ?'
    ).bind(releaseId).first<ReleaseRow>()

    return c.json({ release: updated })
  }
)

/**
 * Update rollout percentage
 */
releasesRoutes.patch(
  '/:appId/:releaseId/rollout',
  zValidator('json', updateRolloutSchema),
  async (c) => {
    const user = c.get('user')
    const appId = c.req.param('appId')
    const releaseId = c.req.param('releaseId')
    const data = c.req.valid('json')

    // Verify app ownership
    const app = await c.env.DB.prepare(
      'SELECT * FROM apps WHERE id = ? AND owner_id = ? AND deleted_at IS NULL'
    ).bind(appId, user.id).first()

    if (!app) {
      return c.json(
        { error: ERROR_CODES.APP_NOT_FOUND, message: 'App not found' },
        404
      )
    }

    const release = await c.env.DB.prepare(
      'SELECT * FROM releases WHERE id = ? AND app_id = ?'
    ).bind(releaseId, appId).first<ReleaseRow>()

    if (!release) {
      return c.json(
        { error: ERROR_CODES.RELEASE_NOT_FOUND, message: 'Release not found' },
        404
      )
    }

    if (data.rolloutPercentage === undefined) {
      return c.json({ release })
    }

    const now = Math.floor(Date.now() / 1000)

    await c.env.DB.prepare(
      'UPDATE releases SET rollout_percentage = ?, updated_at = ? WHERE id = ?'
    ).bind(data.rolloutPercentage, now, releaseId).run()

    const updated = await c.env.DB.prepare(
      'SELECT * FROM releases WHERE id = ?'
    ).bind(releaseId).first<ReleaseRow>()

    return c.json({ release: updated })
  }
)
