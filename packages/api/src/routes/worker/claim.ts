/**
 * Worker Job Claiming Routes
 *
 * Handles workers claiming build jobs from the queue.
 *
 * @agent queue-system
 * @created 2026-01-26
 */

import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import type { Env } from '../../types/env'
import type { WorkerVariables } from './index'

// =============================================================================
// Schemas
// =============================================================================

const claimJobSchema = z.object({
  workerId: z.string().min(1).max(100),
  nodePool: z.string().max(50).optional(),
})

// =============================================================================
// Database Types
// =============================================================================

interface IosBuild {
  id: string
  app_id: string
  version: string
  build_number: number
  configuration: string
  bundle_id: string
  team_id: string | null
}

interface AndroidBuild {
  id: string
  app_id: string
  version: string
  version_code: number
  build_type: string
  flavor: string | null
  package_name: string
  keystore_alias: string | null
}

// =============================================================================
// Router
// =============================================================================

export const claimRoutes = new Hono<{
  Bindings: Env
  Variables: WorkerVariables
}>()

/**
 * POST /builds/worker/claim - Claim next available build job
 *
 * Workers poll this endpoint to get the next pending build.
 * Prioritizes iOS builds first, then Android.
 * Updates worker status to 'busy' when job is claimed.
 */
claimRoutes.post('/claim', zValidator('json', claimJobSchema), async (c) => {
  const { workerId } = c.req.valid('json')
  const now = Math.floor(Date.now() / 1000)

  // Try to claim an iOS build first (prioritize by created_at)
  const iosBuild = await claimIosBuild(c.env.DB, workerId, now)
  if (iosBuild) {
    await updateWorkerStatus(c.env.DB, workerId, iosBuild.id, now)
    return c.json({
      claimed: true,
      build: formatIosBuild(iosBuild),
    })
  }

  // Try Android builds
  const androidBuild = await claimAndroidBuild(c.env.DB, workerId, now)
  if (androidBuild) {
    await updateWorkerStatus(c.env.DB, workerId, androidBuild.id, now)
    return c.json({
      claimed: true,
      build: formatAndroidBuild(androidBuild),
    })
  }

  // No jobs available
  return c.json({ claimed: false, build: null })
})

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Claim next pending iOS build
 */
async function claimIosBuild(
  db: D1Database,
  workerId: string,
  now: number
): Promise<IosBuild | null> {
  const build = await db.prepare(`
    UPDATE ios_builds
    SET status = 'building', worker_id = ?, started_at = ?
    WHERE id = (
      SELECT id FROM ios_builds
      WHERE status = 'pending' AND worker_id IS NULL
      ORDER BY created_at ASC
      LIMIT 1
    )
    RETURNING id, app_id, version, build_number, configuration, bundle_id, team_id
  `).bind(workerId, now).first<IosBuild>()

  return build ?? null
}

/**
 * Claim next pending Android build
 */
async function claimAndroidBuild(
  db: D1Database,
  workerId: string,
  now: number
): Promise<AndroidBuild | null> {
  const build = await db.prepare(`
    UPDATE android_builds
    SET status = 'building', worker_id = ?, started_at = ?
    WHERE id = (
      SELECT id FROM android_builds
      WHERE status = 'pending' AND worker_id IS NULL
      ORDER BY created_at ASC
      LIMIT 1
    )
    RETURNING id, app_id, version, version_code, build_type, flavor, package_name, keystore_alias
  `).bind(workerId, now).first<AndroidBuild>()

  return build ?? null
}

/**
 * Update worker node status when claiming a job
 */
async function updateWorkerStatus(
  db: D1Database,
  workerId: string,
  buildId: string,
  now: number
): Promise<void> {
  await db.prepare(`
    INSERT INTO worker_nodes (id, status, current_build_id, last_heartbeat_at, created_at, updated_at)
    VALUES (?, 'busy', ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      status = 'busy',
      current_build_id = ?,
      last_heartbeat_at = ?,
      updated_at = ?
  `).bind(workerId, buildId, now, now, now, buildId, now, now).run()
}

/**
 * Format iOS build for response
 */
function formatIosBuild(build: IosBuild) {
  return {
    id: build.id,
    type: 'ios' as const,
    appId: build.app_id,
    version: build.version,
    buildNumber: build.build_number,
    configuration: build.configuration,
    bundleId: build.bundle_id,
    teamId: build.team_id,
  }
}

/**
 * Format Android build for response
 */
function formatAndroidBuild(build: AndroidBuild) {
  return {
    id: build.id,
    type: 'android' as const,
    appId: build.app_id,
    version: build.version,
    versionCode: build.version_code,
    buildType: build.build_type,
    flavor: build.flavor,
    packageName: build.package_name,
    keystoreAlias: build.keystore_alias,
  }
}
