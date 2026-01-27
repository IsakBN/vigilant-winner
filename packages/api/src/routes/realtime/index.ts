/**
 * Realtime WebSocket routes
 *
 * Provides WebSocket connection endpoint for real-time updates.
 *
 * @agent websocket-realtime
 * @created 2026-01-27
 */

import { Hono } from 'hono'
import { authMiddleware, type AuthUser } from '../../middleware/auth'
import { getSessionCount } from '../../lib/realtime'
import type { Env } from '../../types/env'

// =============================================================================
// Types
// =============================================================================

interface AuthVariables {
  user: AuthUser
}

// =============================================================================
// Router
// =============================================================================

export const realtimeRoutes = new Hono<{
  Bindings: Env
  Variables: AuthVariables
}>()

/**
 * GET /realtime/ws - WebSocket connection endpoint
 *
 * Clients connect here to receive real-time updates.
 * Requires authentication via session cookie or bearer token.
 *
 * Query params:
 * - No additional params needed, userId extracted from auth
 *
 * After connecting, clients can send:
 * - { type: 'subscribe', resource: 'build', id: 'build-123' }
 * - { type: 'unsubscribe', resource: 'build', id: 'build-123' }
 * - { type: 'ping' }
 */
realtimeRoutes.get('/ws', authMiddleware, async (c) => {
  const upgradeHeader = c.req.header('Upgrade')

  if (upgradeHeader !== 'websocket') {
    return c.json(
      { error: 'upgrade_required', message: 'Expected WebSocket upgrade' },
      426
    )
  }

  const user = c.get('user')

  // Get or create DO instance for this user
  const doId = c.env.REALTIME.idFromName(user.id)
  const stub = c.env.REALTIME.get(doId)

  // Forward the WebSocket upgrade to the Durable Object
  const url = new URL(c.req.url)
  url.searchParams.set('userId', user.id)

  return stub.fetch(new Request(url.toString(), {
    headers: c.req.raw.headers,
  }))
})

/**
 * GET /realtime/sessions - Get active session count (for debugging)
 *
 * Returns the number of active WebSocket connections for the current user.
 */
realtimeRoutes.get('/sessions', authMiddleware, async (c) => {
  const user = c.get('user')
  const count = await getSessionCount(c.env, user.id)

  return c.json({ sessions: count })
})

// =============================================================================
// Exports
// =============================================================================

export { realtimeRoutes as realtimeRouter }
