/**
 * Bundle routes
 *
 * Serves bundle files from R2 storage and provides bundle size tracking
 *
 * @agent bundle-size-tracking
 * @modified 2026-01-25
 * @description Added stats and history endpoints for bundle size monitoring
 */

import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { ERROR_CODES } from '@bundlenudge/shared'
import { authMiddleware, type AuthUser } from '../../middleware/auth'
import type { Env } from '../../types/env'

// =============================================================================
// Validation Schemas
// =============================================================================

const bundleHistoryQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).optional().default(20),
  offset: z.coerce.number().min(0).optional().default(0),
  startDate: z.coerce.number().optional(),
  endDate: z.coerce.number().optional(),
})

// =============================================================================
// Types
// =============================================================================

interface ReleaseRow {
  id: string
  app_id: string
  version: string
  bundle_size: number
  created_at: number
}

interface AuthVariables {
  user: AuthUser
}

// =============================================================================
// Bundle Serving Router (mounted at /v1/bundles)
// =============================================================================

export const bundlesRoutes = new Hono<{ Bindings: Env; Variables: AuthVariables }>()

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

// =============================================================================
// Bundle Size Tracking Router (mounted at /v1/apps)
// Routes: /:appId/bundles/stats, /:appId/bundles/history
// =============================================================================

export const bundlesRouter = new Hono<{ Bindings: Env; Variables: AuthVariables }>()

// Apply auth middleware to all bundle tracking routes
bundlesRouter.use('/:appId/bundles/*', authMiddleware)

/**
 * Get bundle size statistics for an app
 * GET /v1/apps/:appId/bundles/stats
 */
bundlesRouter.get('/:appId/bundles/stats', async (c) => {
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

  // Get bundle statistics
  const statsResult = await c.env.DB.prepare(`
    SELECT
      COUNT(*) as total_bundles,
      COALESCE(SUM(bundle_size), 0) as total_storage,
      COALESCE(AVG(bundle_size), 0) as avg_size,
      COALESCE(MIN(bundle_size), 0) as min_size,
      COALESCE(MAX(bundle_size), 0) as max_size
    FROM releases
    WHERE app_id = ? AND bundle_size > 0
  `).bind(appId).first<{
    total_bundles: number
    total_storage: number
    avg_size: number
    min_size: number
    max_size: number
  }>()

  // Get latest release with size
  const latestRelease = await c.env.DB.prepare(`
    SELECT id, bundle_size, created_at
    FROM releases
    WHERE app_id = ? AND bundle_size > 0
    ORDER BY created_at DESC
    LIMIT 1
  `).bind(appId).first<ReleaseRow>()

  // Get previous release to calculate size change
  const previousRelease = await c.env.DB.prepare(`
    SELECT bundle_size
    FROM releases
    WHERE app_id = ? AND bundle_size > 0
    ORDER BY created_at DESC
    LIMIT 1 OFFSET 1
  `).bind(appId).first<{ bundle_size: number }>()

  const latestBundleSize = latestRelease?.bundle_size ?? 0
  const previousBundleSize = previousRelease?.bundle_size ?? 0
  const absoluteChange = latestBundleSize - previousBundleSize
  const percentageChange = previousBundleSize > 0
    ? ((absoluteChange / previousBundleSize) * 100)
    : 0

  return c.json({
    appId,
    latestBundleSize,
    averageBundleSize: Math.round(statsResult?.avg_size ?? 0),
    minBundleSize: statsResult?.min_size ?? 0,
    maxBundleSize: statsResult?.max_size ?? 0,
    totalBundles: statsResult?.total_bundles ?? 0,
    totalStorageUsed: statsResult?.total_storage ?? 0,
    sizeChange: {
      absolute: absoluteChange,
      percentage: Math.round(percentageChange * 100) / 100,
    },
  })
})

/**
 * Get bundle size history for an app
 * GET /v1/apps/:appId/bundles/history
 */
bundlesRouter.get(
  '/:appId/bundles/history',
  zValidator('query', bundleHistoryQuerySchema),
  async (c) => {
    const user = c.get('user')
    const appId = c.req.param('appId')
    const query = c.req.valid('query')
    const { limit, offset, startDate, endDate } = query

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

    // Build query with optional date filters
    let countQuery = 'SELECT COUNT(*) as total FROM releases WHERE app_id = ? AND bundle_size > 0'
    let dataQuery = `
      SELECT id, version, bundle_size, created_at
      FROM releases
      WHERE app_id = ? AND bundle_size > 0
    `
    const countParams: (string | number)[] = [appId]
    const dataParams: (string | number)[] = [appId]

    if (startDate !== undefined) {
      countQuery += ' AND created_at >= ?'
      dataQuery += ' AND created_at >= ?'
      countParams.push(startDate)
      dataParams.push(startDate)
    }

    if (endDate !== undefined) {
      countQuery += ' AND created_at <= ?'
      dataQuery += ' AND created_at <= ?'
      countParams.push(endDate)
      dataParams.push(endDate)
    }

    dataQuery += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
    dataParams.push(limit, offset)

    // Get total count
    const countResult = await c.env.DB.prepare(countQuery)
      .bind(...countParams)
      .first<{ total: number }>()
    const total = countResult?.total ?? 0

    // Get paginated releases
    const releases = await c.env.DB.prepare(dataQuery)
      .bind(...dataParams)
      .all<ReleaseRow>()

    // Calculate size changes for each entry
    const entries = await calculateSizeChanges(c.env.DB, appId, releases.results)

    return c.json({
      appId,
      entries,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + entries.length < total,
      },
    })
  }
)

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Calculate size change for each release entry
 */
async function calculateSizeChanges(
  db: D1Database,
  appId: string,
  releases: ReleaseRow[]
): Promise<{
  releaseId: string
  version: string
  bundleSize: number
  createdAt: number
  sizeChange: number
}[]> {
  if (releases.length === 0) {
    return []
  }

  const entries = []

  for (let i = 0; i < releases.length; i++) {
    const release = releases[i]
    let sizeChange = 0

    // For the first entry, look up the previous release in DB
    // For subsequent entries, use the next item in the array
    if (i === releases.length - 1) {
      // Last item in current page - look up previous from DB
      const prev = await db.prepare(`
        SELECT bundle_size FROM releases
        WHERE app_id = ? AND bundle_size > 0 AND created_at < ?
        ORDER BY created_at DESC
        LIMIT 1
      `).bind(appId, release.created_at).first<{ bundle_size: number }>()
      sizeChange = release.bundle_size - (prev?.bundle_size ?? 0)
    } else {
      // Compare with the next item (older release)
      sizeChange = release.bundle_size - releases[i + 1].bundle_size
    }

    entries.push({
      releaseId: release.id,
      version: release.version,
      bundleSize: release.bundle_size,
      createdAt: release.created_at,
      sizeChange,
    })
  }

  return entries
}

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
