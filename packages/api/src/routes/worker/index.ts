/**
 * Worker Routes
 *
 * Endpoints for build workers to claim jobs, report status, and send heartbeats.
 * These are internal endpoints used by worker nodes, not user-facing.
 *
 * @agent queue-system
 * @created 2026-01-26
 */

import { Hono } from 'hono'
import { ERROR_CODES } from '@bundlenudge/shared'
import type { Env } from '../../types/env'

// Import sub-routers
import { claimRoutes } from './claim'
import { statusRoutes } from './status'
import { heartbeatRoutes } from './heartbeat'

// =============================================================================
// Types
// =============================================================================

export interface WorkerVariables {
  workerId: string
}

// =============================================================================
// Router
// =============================================================================

export const workerRoutes = new Hono<{
  Bindings: Env
  Variables: WorkerVariables
}>()

/**
 * Simple token auth for workers
 * In production, validate against a worker secret
 */
workerRoutes.use('*', async (c, next) => {
  const authHeader = c.req.header('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json(
      { error: ERROR_CODES.UNAUTHORIZED, message: 'Missing token' },
      401
    )
  }

  // Extract worker ID from token or header
  const workerId = c.req.header('X-Worker-ID')
  if (workerId) {
    c.set('workerId', workerId)
  }

  return next()
})

// Mount sub-routes
workerRoutes.route('/builds/worker', claimRoutes)
workerRoutes.route('/builds/worker', statusRoutes)
workerRoutes.route('/nodes/worker', heartbeatRoutes)
