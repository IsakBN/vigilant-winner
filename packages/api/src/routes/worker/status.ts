/**
 * Worker Status Update Routes
 *
 * Handles build status updates and log streaming from workers.
 *
 * @agent queue-system
 * @created 2026-01-26
 */

import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { ERROR_CODES } from '@bundlenudge/shared'
import { broadcastBuildStatus } from '../../lib/realtime'
import type { Env } from '../../types/env'
import type { WorkerVariables } from './index'

// =============================================================================
// Schemas
// =============================================================================

const updateStatusSchema = z.object({
  status: z.enum(['building', 'signing', 'uploading', 'complete', 'failed']),
  error: z.string().max(10000).optional(),
  artifactUrl: z.string().url().optional(),
  artifactSize: z.number().int().positive().optional(),
})

const appendLogSchema = z.object({
  logs: z.array(z.object({
    timestamp: z.number(),
    level: z.enum(['info', 'warn', 'error', 'debug']),
    message: z.string().max(5000),
  })).max(100),
})

// =============================================================================
// Database Types
// =============================================================================

interface BuildResult {
  id: string
  worker_id: string | null
  app_id: string
}

interface AppOwnerResult {
  owner_id: string
}

// =============================================================================
// Router
// =============================================================================

export const statusRoutes = new Hono<{
  Bindings: Env
  Variables: WorkerVariables
}>()

/**
 * POST /builds/worker/:buildId/status - Update build status
 *
 * Workers call this to update the build progress and final result.
 * When status is 'complete' or 'failed', worker is marked as available.
 */
statusRoutes.post(
  '/:buildId/status',
  zValidator('json', updateStatusSchema),
  async (c) => {
    const buildId = c.req.param('buildId')
    const data = c.req.valid('json')
    const now = Math.floor(Date.now() / 1000)

    const isComplete = data.status === 'complete' || data.status === 'failed'

    // Try iOS first
    const iosResult = await updateIosBuildStatus(c.env.DB, buildId, data, isComplete, now)
    if (iosResult) {
      if (isComplete && iosResult.worker_id) {
        await updateWorkerAfterBuild(c.env.DB, iosResult.worker_id, data.status, now)
      }
      // Broadcast status update to connected clients
      const userId = await getAppOwnerId(c.env.DB, iosResult.app_id)
      if (userId) {
        await broadcastBuildStatus(c.env, userId, buildId, {
          status: data.status,
          error: data.error,
          artifactUrl: data.artifactUrl,
        })
      }
      return c.json({ success: true })
    }

    // Try Android
    const androidResult = await updateAndroidBuildStatus(c.env.DB, buildId, data, isComplete, now)
    if (androidResult) {
      if (isComplete && androidResult.worker_id) {
        await updateWorkerAfterBuild(c.env.DB, androidResult.worker_id, data.status, now)
      }
      // Broadcast status update to connected clients
      const userId = await getAppOwnerId(c.env.DB, androidResult.app_id)
      if (userId) {
        await broadcastBuildStatus(c.env, userId, buildId, {
          status: data.status,
          error: data.error,
          artifactUrl: data.artifactUrl,
        })
      }
      return c.json({ success: true })
    }

    return c.json(
      { error: ERROR_CODES.NOT_FOUND, message: 'Build not found' },
      404
    )
  }
)

/**
 * POST /builds/worker/:buildId/log - Append build logs
 *
 * Workers stream logs in batches. Each log entry has timestamp, level, message.
 */
statusRoutes.post(
  '/:buildId/log',
  zValidator('json', appendLogSchema),
  async (c) => {
    const buildId = c.req.param('buildId')
    const { logs } = c.req.valid('json')

    const logText = formatLogs(logs)

    // Try iOS
    const iosResult = await appendLogsToIosBuild(c.env.DB, buildId, logText)
    if (iosResult) {
      return c.json({ success: true })
    }

    // Try Android
    const androidResult = await appendLogsToAndroidBuild(c.env.DB, buildId, logText)
    if (androidResult) {
      return c.json({ success: true })
    }

    return c.json(
      { error: ERROR_CODES.NOT_FOUND, message: 'Build not found' },
      404
    )
  }
)

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Get app owner ID for broadcasting
 */
async function getAppOwnerId(db: D1Database, appId: string): Promise<string | null> {
  const result = await db.prepare(
    'SELECT owner_id FROM apps WHERE id = ?'
  ).bind(appId).first<AppOwnerResult>()
  return result?.owner_id ?? null
}

/**
 * Update build status (iOS or Android)
 */
async function updateBuildStatus(
  db: D1Database,
  table: 'ios_builds' | 'android_builds',
  buildId: string,
  data: z.infer<typeof updateStatusSchema>,
  isComplete: boolean,
  now: number
): Promise<BuildResult | null> {
  const result = await db.prepare(`
    UPDATE ${table}
    SET status = ?,
        error = COALESCE(?, error),
        artifact_url = COALESCE(?, artifact_url),
        artifact_size = COALESCE(?, artifact_size),
        completed_at = CASE WHEN ? THEN ? ELSE completed_at END
    WHERE id = ?
    RETURNING id, worker_id, app_id
  `).bind(
    data.status,
    data.error ?? null,
    data.artifactUrl ?? null,
    data.artifactSize ?? null,
    isComplete,
    isComplete ? now : null,
    buildId
  ).first<BuildResult>()

  return result ?? null
}

const updateIosBuildStatus = (
  db: D1Database,
  buildId: string,
  data: z.infer<typeof updateStatusSchema>,
  isComplete: boolean,
  now: number
) => updateBuildStatus(db, 'ios_builds', buildId, data, isComplete, now)

const updateAndroidBuildStatus = (
  db: D1Database,
  buildId: string,
  data: z.infer<typeof updateStatusSchema>,
  isComplete: boolean,
  now: number
) => updateBuildStatus(db, 'android_builds', buildId, data, isComplete, now)

/**
 * Update worker after build completion
 */
async function updateWorkerAfterBuild(
  db: D1Database,
  workerId: string,
  status: string,
  now: number
): Promise<void> {
  await db.prepare(`
    UPDATE worker_nodes
    SET status = 'online',
        current_build_id = NULL,
        total_builds = total_builds + 1,
        failed_builds = failed_builds + CASE WHEN ? = 'failed' THEN 1 ELSE 0 END,
        updated_at = ?
    WHERE id = ?
  `).bind(status, now, workerId).run()
}

/**
 * Append logs to build (iOS or Android)
 */
async function appendLogsToBuild(
  db: D1Database,
  table: 'ios_builds' | 'android_builds',
  buildId: string,
  logText: string
): Promise<{ id: string } | null> {
  const result = await db.prepare(`
    UPDATE ${table}
    SET logs = COALESCE(logs || '\n', '') || ?
    WHERE id = ?
    RETURNING id
  `).bind(logText, buildId).first<{ id: string }>()

  return result ?? null
}

const appendLogsToIosBuild = (db: D1Database, buildId: string, logText: string) =>
  appendLogsToBuild(db, 'ios_builds', buildId, logText)

const appendLogsToAndroidBuild = (db: D1Database, buildId: string, logText: string) =>
  appendLogsToBuild(db, 'android_builds', buildId, logText)

/**
 * Format log entries into text
 */
function formatLogs(logs: { timestamp: number; level: string; message: string }[]): string {
  return logs.map(l =>
    `[${new Date(l.timestamp).toISOString()}] [${l.level.toUpperCase()}] ${l.message}`
  ).join('\n')
}
