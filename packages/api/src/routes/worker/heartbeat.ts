/**
 * Worker Heartbeat Routes
 *
 * Handles worker health monitoring via periodic heartbeats.
 * Workers send heartbeats every 30-60 seconds to signal they're alive.
 *
 * @agent queue-system
 * @created 2026-01-26
 */

import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { ERROR_CODES } from '@bundlenudge/shared'
import type { Env } from '../../types/env'
import type { WorkerVariables } from './index'

// =============================================================================
// Schemas
// =============================================================================

const heartbeatSchema = z.object({
  workerId: z.string().min(1).max(100),
  status: z.enum(['online', 'busy', 'draining']),
  currentBuildId: z.string().optional(),
  cpuUsage: z.number().min(0).max(100).optional(),
  memoryUsage: z.number().min(0).max(100).optional(),
  diskUsage: z.number().min(0).max(100).optional(),
})

const buildCompleteSchema = z.object({
  buildId: z.string(),
  durationMs: z.number().int().positive(),
  success: z.boolean(),
})

// =============================================================================
// Router
// =============================================================================

export const heartbeatRoutes = new Hono<{
  Bindings: Env
  Variables: WorkerVariables
}>()

/**
 * POST /nodes/worker/heartbeat - Worker heartbeat
 *
 * Workers send this periodically to update their status and metrics.
 * Creates worker node entry if it doesn't exist (first heartbeat).
 */
heartbeatRoutes.post(
  '/heartbeat',
  zValidator('json', heartbeatSchema),
  async (c) => {
    const data = c.req.valid('json')
    const now = Math.floor(Date.now() / 1000)

    await upsertWorkerHeartbeat(c.env.DB, data, now)

    return c.json({ success: true, timestamp: now })
  }
)

/**
 * POST /nodes/worker/offline - Mark worker as offline
 *
 * Called when worker is shutting down gracefully.
 * Sets status to 'offline' and clears current build.
 */
heartbeatRoutes.post('/offline', async (c) => {
  const workerId = c.req.header('X-Worker-ID')

  if (!workerId) {
    return c.json(
      { error: ERROR_CODES.INVALID_INPUT, message: 'Missing X-Worker-ID header' },
      400
    )
  }

  const now = Math.floor(Date.now() / 1000)

  await markWorkerOffline(c.env.DB, workerId, now)

  return c.json({ success: true })
})

/**
 * POST /nodes/worker/build-complete - Report build completion stats
 *
 * Optional endpoint for workers to report detailed build metrics.
 * Stats are already updated in the status endpoint, so this just acknowledges.
 */
heartbeatRoutes.post(
  '/build-complete',
  zValidator('json', buildCompleteSchema),
  async (c) => {
    // Stats already updated in status endpoint
    // This endpoint exists for future metric collection
    return c.json({ success: true, recorded: true })
  }
)

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Upsert worker node heartbeat
 * Creates new worker entry on first heartbeat, updates existing otherwise
 */
async function upsertWorkerHeartbeat(
  db: D1Database,
  data: z.infer<typeof heartbeatSchema>,
  now: number
): Promise<void> {
  await db.prepare(`
    INSERT INTO worker_nodes (
      id,
      status,
      current_build_id,
      last_heartbeat_at,
      created_at,
      updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      status = ?,
      current_build_id = ?,
      last_heartbeat_at = ?,
      updated_at = ?
  `).bind(
    data.workerId,
    data.status,
    data.currentBuildId ?? null,
    now,
    now,
    now,
    data.status,
    data.currentBuildId ?? null,
    now,
    now
  ).run()
}

/**
 * Mark worker as offline
 */
async function markWorkerOffline(
  db: D1Database,
  workerId: string,
  now: number
): Promise<void> {
  await db.prepare(`
    UPDATE worker_nodes
    SET status = 'offline',
        current_build_id = NULL,
        updated_at = ?
    WHERE id = ?
  `).bind(now, workerId).run()
}
