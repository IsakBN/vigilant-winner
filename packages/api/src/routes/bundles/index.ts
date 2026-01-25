/**
 * Bundle serving routes
 *
 * Serves bundle files from R2 storage for SDK downloads
 */

import { Hono } from 'hono'
import { ERROR_CODES } from '@bundlenudge/shared'
import type { Env } from '../../types/env'

export const bundlesRoutes = new Hono<{ Bindings: Env }>()

/**
 * Serve bundle files from R2 storage
 * GET /v1/bundles/:appId/:releaseId/bundle.js
 */
bundlesRoutes.get('/:appId/:releaseId/bundle.js', async (c) => {
  const appId = c.req.param('appId')
  const releaseId = c.req.param('releaseId')

  // Validate API key from Authorization header
  const authResult = await validateApiKey(c.env.DB, c.req.header('Authorization'))
  if (!authResult.valid) {
    return c.json({ error: ERROR_CODES.UNAUTHORIZED, message: authResult.error }, 401)
  }

  // Verify the API key belongs to this app
  if (authResult.appId !== appId) {
    return c.json({ error: ERROR_CODES.FORBIDDEN, message: 'API key does not match app' }, 403)
  }

  // Fetch from R2
  const key = `${appId}/${releaseId}/bundle.js`
  const object = await c.env.BUNDLES.get(key)

  if (!object) {
    return c.json({ error: ERROR_CODES.NOT_FOUND, message: 'Bundle not found' }, 404)
  }

  // Get release info for caching headers
  const release = await c.env.DB.prepare(
    'SELECT version, status FROM releases WHERE id = ? AND app_id = ?'
  ).bind(releaseId, appId).first<{ version: string; status: string }>()

  // Set appropriate headers
  const headers = new Headers()
  headers.set('Content-Type', 'application/javascript')
  headers.set('Content-Length', object.size.toString())

  // Cache immutably if release is active, otherwise short cache
  if (release?.status === 'active') {
    headers.set('Cache-Control', 'public, max-age=31536000, immutable')
  } else {
    headers.set('Cache-Control', 'public, max-age=300')
  }

  // Add custom headers for debugging
  headers.set('X-BundleNudge-Version', release?.version ?? 'unknown')
  headers.set('X-BundleNudge-Release-Id', releaseId)

  return new Response(object.body, { status: 200, headers })
})

/**
 * HEAD request for bundle (check existence without downloading)
 */
bundlesRoutes.on('HEAD', '/:appId/:releaseId/bundle.js', async (c) => {
  const appId = c.req.param('appId')
  const releaseId = c.req.param('releaseId')

  const authResult = await validateApiKey(c.env.DB, c.req.header('Authorization'))
  if (!authResult.valid) {
    return c.json({ error: ERROR_CODES.UNAUTHORIZED, message: authResult.error }, 401)
  }

  if (authResult.appId !== appId) {
    return c.json({ error: ERROR_CODES.FORBIDDEN, message: 'API key does not match app' }, 403)
  }

  const key = `${appId}/${releaseId}/bundle.js`
  const object = await c.env.BUNDLES.head(key)

  if (!object) {
    return new Response(null, { status: 404 })
  }

  const headers = new Headers()
  headers.set('Content-Type', 'application/javascript')
  headers.set('Content-Length', object.size.toString())

  return new Response(null, { status: 200, headers })
})

/**
 * Validate API key from Authorization header
 */
async function validateApiKey(
  db: D1Database,
  authHeader: string | undefined
): Promise<{ valid: true; appId: string } | { valid: false; error: string }> {
  if (!authHeader?.startsWith('Bearer ')) {
    return { valid: false, error: 'Missing API key' }
  }

  const apiKey = authHeader.slice(7)

  // Look up the app by API key
  const app = await db.prepare(
    'SELECT id FROM apps WHERE api_key = ? AND deleted_at IS NULL'
  ).bind(apiKey).first<{ id: string }>()

  if (!app) {
    return { valid: false, error: 'Invalid API key' }
  }

  return { valid: true, appId: app.id }
}
