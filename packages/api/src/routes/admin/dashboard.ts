/**
 * Admin dashboard routes
 *
 * System-wide metrics, activity feed, and alerts for admin dashboard
 *
 * Routes:
 * - GET /admin/dashboard/overview  - System overview metrics (cached 5 min)
 * - GET /admin/dashboard/activity  - Recent activity feed (paginated)
 * - GET /admin/dashboard/alerts    - System alerts and warnings
 *
 * @module routes/admin/dashboard
 */

import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { logAdminAction } from '../../lib/admin/audit'
import { getAdminId } from '../../middleware/admin'
import {
  calculateOverviewMetrics,
  type DashboardOverview,
} from '../../lib/admin/dashboard-metrics'
import { getActivityFeed, type ActivityType } from '../../lib/admin/dashboard-activity'
import { getSystemAlerts, type AlertSeverity } from '../../lib/admin/dashboard-alerts'
import type { Env } from '../../types/env'

// =============================================================================
// Constants
// =============================================================================

const OVERVIEW_CACHE_KEY = 'admin:dashboard:overview'
const OVERVIEW_CACHE_TTL = 5 * 60 // 5 minutes in seconds
const DEFAULT_PAGE_SIZE = 50

// =============================================================================
// Validation Schemas
// =============================================================================

const activityQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(DEFAULT_PAGE_SIZE),
  offset: z.coerce.number().min(0).default(0),
  type: z.enum([
    'user_signup',
    'app_created',
    'release_published',
    'subscription_started',
    'subscription_cancelled',
  ]).optional(),
})

const alertsQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(DEFAULT_PAGE_SIZE),
  offset: z.coerce.number().min(0).default(0),
  severity: z.enum(['info', 'warning', 'critical']).optional(),
  resolved: z.enum(['true', 'false']).optional(),
})

// =============================================================================
// Router
// =============================================================================

export const adminDashboardRouter = new Hono<{ Bindings: Env }>()

/**
 * GET /admin/dashboard/overview
 * System overview metrics with 5-minute caching
 */
adminDashboardRouter.get('/overview', async (c) => {
  const adminId = getAdminId(c)

  // Try to get cached overview
  const cached = await getCachedOverview(c.env.CACHE)
  if (cached) {
    await logAdminAction(c.env.DB, {
      adminId,
      action: 'view_dashboard',
      details: { view: 'overview', cached: true },
    })
    return c.json({ ...cached, cached: true })
  }

  // Calculate fresh metrics
  const overview = await calculateOverviewMetrics(c.env.DB)

  // Cache the results
  await cacheOverview(c.env.CACHE, overview)

  await logAdminAction(c.env.DB, {
    adminId,
    action: 'view_dashboard',
    details: { view: 'overview', cached: false },
  })

  return c.json({ ...overview, cached: false, generatedAt: Date.now() })
})

/**
 * GET /admin/dashboard/activity
 * Recent activity feed with pagination
 */
adminDashboardRouter.get(
  '/activity',
  zValidator('query', activityQuerySchema),
  async (c) => {
    const { limit, offset, type } = c.req.valid('query')
    const adminId = getAdminId(c)

    const result = await getActivityFeed(c.env.DB, {
      limit,
      offset,
      type: type as ActivityType | undefined,
    })

    await logAdminAction(c.env.DB, {
      adminId,
      action: 'view_dashboard',
      details: { view: 'activity', type, limit, offset },
    })

    return c.json({
      items: result.items,
      pagination: {
        total: result.total,
        limit,
        offset,
        hasMore: offset + result.items.length < result.total,
      },
    })
  }
)

/**
 * GET /admin/dashboard/alerts
 * System alerts and warnings
 */
adminDashboardRouter.get(
  '/alerts',
  zValidator('query', alertsQuerySchema),
  async (c) => {
    const { limit, offset, severity, resolved } = c.req.valid('query')
    const adminId = getAdminId(c)

    const result = await getSystemAlerts(c.env.DB, {
      limit,
      offset,
      severity: severity as AlertSeverity | undefined,
      resolved: resolved === 'true' ? true : resolved === 'false' ? false : undefined,
    })

    await logAdminAction(c.env.DB, {
      adminId,
      action: 'view_dashboard',
      details: { view: 'alerts', severity, resolved, count: result.items.length },
    })

    return c.json({
      items: result.items,
      pagination: {
        total: result.total,
        limit,
        offset,
        hasMore: offset + result.items.length < result.total,
      },
    })
  }
)

// =============================================================================
// Cache Helpers
// =============================================================================

async function getCachedOverview(kv: KVNamespace): Promise<DashboardOverview | null> {
  try {
    const cached = await kv.get(OVERVIEW_CACHE_KEY, 'json')
    return cached as DashboardOverview | null
  } catch {
    return null
  }
}

async function cacheOverview(kv: KVNamespace, overview: DashboardOverview): Promise<void> {
  try {
    await kv.put(OVERVIEW_CACHE_KEY, JSON.stringify(overview), {
      expirationTtl: OVERVIEW_CACHE_TTL,
    })
  } catch {
    // Cache write failures are non-critical
  }
}
