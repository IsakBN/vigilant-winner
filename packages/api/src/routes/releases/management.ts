/**
 * Release Management Routes
 *
 * Handles release lifecycle operations: activate, pause, rollback
 */

import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { ERROR_CODES } from '@bundlenudge/shared'
import { authMiddleware, type AuthUser } from '../../middleware/auth'
import type { Env } from '../../types/env'

const RELEASE_STATUS = {
  ACTIVE: 'active',
  PAUSED: 'paused',
  ROLLED_BACK: 'rolled_back',
} as const

interface ReleaseRow {
  id: string
  app_id: string
  version: string
  status: string
  rollout_percentage: number
  created_at: number
}

interface AuthVariables {
  user: AuthUser
}

// Schemas
const activateReleaseSchema = z.object({
  rolloutPercentage: z.number().min(0).max(100).default(100),
})

const rollbackSchema = z.object({
  reason: z.string().max(500).optional(),
})

export const releaseManagementRoutes = new Hono<{
  Bindings: Env
  Variables: AuthVariables
}>()

releaseManagementRoutes.use('*', authMiddleware)

/**
 * Activate a release (make it available for updates)
 */
releaseManagementRoutes.post(
  '/:appId/:releaseId/activate',
  zValidator('json', activateReleaseSchema),
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

    // Check if release has a bundle uploaded
    if (!release.version) {
      return c.json(
        { error: ERROR_CODES.INVALID_STATE, message: 'Release has no bundle' },
        400
      )
    }

    const now = Math.floor(Date.now() / 1000)

    await c.env.DB.prepare(`
      UPDATE releases
      SET status = ?, rollout_percentage = ?, updated_at = ?
      WHERE id = ?
    `).bind(RELEASE_STATUS.ACTIVE, data.rolloutPercentage, now, releaseId).run()

    const updated = await c.env.DB.prepare(
      'SELECT * FROM releases WHERE id = ?'
    ).bind(releaseId).first<ReleaseRow>()

    return c.json({ release: updated })
  }
)

/**
 * Pause a release (stop serving to new devices)
 */
releaseManagementRoutes.post('/:appId/:releaseId/pause', async (c) => {
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

  const now = Math.floor(Date.now() / 1000)

  await c.env.DB.prepare(`
    UPDATE releases SET status = ?, updated_at = ? WHERE id = ?
  `).bind(RELEASE_STATUS.PAUSED, now, releaseId).run()

  const updated = await c.env.DB.prepare(
    'SELECT * FROM releases WHERE id = ?'
  ).bind(releaseId).first<ReleaseRow>()

  return c.json({ release: updated })
})

/**
 * Rollback: mark current release as rolled back and activate a previous one
 */
releaseManagementRoutes.post(
  '/:appId/:releaseId/rollback',
  zValidator('json', rollbackSchema),
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

    // Get the release to rollback TO (this should be a previous working version)
    const targetRelease = await c.env.DB.prepare(
      'SELECT * FROM releases WHERE id = ? AND app_id = ?'
    ).bind(releaseId, appId).first<ReleaseRow>()

    if (!targetRelease) {
      return c.json(
        { error: ERROR_CODES.RELEASE_NOT_FOUND, message: 'Release not found' },
        404
      )
    }

    const now = Math.floor(Date.now() / 1000)

    // Mark all currently active releases as rolled_back
    await c.env.DB.prepare(`
      UPDATE releases
      SET status = ?, rollback_reason = ?, updated_at = ?
      WHERE app_id = ? AND status = ? AND id != ?
    `).bind(
      RELEASE_STATUS.ROLLED_BACK,
      data.reason ?? 'Manual rollback',
      now,
      appId,
      RELEASE_STATUS.ACTIVE,
      releaseId
    ).run()

    // Activate the target release
    await c.env.DB.prepare(`
      UPDATE releases
      SET status = ?, updated_at = ?
      WHERE id = ?
    `).bind(RELEASE_STATUS.ACTIVE, now, releaseId).run()

    const updated = await c.env.DB.prepare(
      'SELECT * FROM releases WHERE id = ?'
    ).bind(releaseId).first<ReleaseRow>()

    return c.json({ release: updated, rolledBack: true })
  }
)

/**
 * Get release history (for rollback selection)
 */
releaseManagementRoutes.get('/:appId/history', async (c) => {
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

  // Get recent releases with stats
  const releases = await c.env.DB.prepare(`
    SELECT
      r.*,
      rs.total_downloads,
      rs.total_installs,
      rs.total_rollbacks,
      rs.total_crashes
    FROM releases r
    LEFT JOIN release_stats rs ON rs.release_id = r.id
    WHERE r.app_id = ?
    ORDER BY r.created_at DESC
    LIMIT 20
  `).bind(appId).all()

  return c.json({ releases: releases.results })
})
