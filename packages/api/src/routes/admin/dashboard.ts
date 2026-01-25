/**
 * Admin dashboard statistics routes
 *
 * Platform overview stats and audit log viewing
 *
 * @agent wave5-admin
 */

import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { getAuditLog, logAdminAction, type AdminAction } from '../../lib/admin/audit'
import { getAdminId } from '../../middleware/admin'
import type { Env } from '../../types/env'

// Validation schemas
const auditLogQuerySchema = z.object({
  action: z.string().optional(),
  adminId: z.string().uuid().optional(),
  targetUserId: z.string().uuid().optional(),
  targetAppId: z.string().uuid().optional(),
  startDate: z.coerce.number().positive().optional(),
  endDate: z.coerce.number().positive().optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
})

export const adminDashboardRouter = new Hono<{ Bindings: Env }>()

/**
 * GET /admin/dashboard/overview
 * Get platform summary statistics
 */
adminDashboardRouter.get('/overview', async (c) => {
  const adminId = getAdminId(c)
  const now = Date.now()
  const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000)
  const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000)

  // Run all queries in parallel
  const [
    totalUsers,
    newUsers7d,
    totalApps,
    newApps7d,
    totalReleases,
    releases7d,
    totalDevices,
    activeDevices30d,
    subscriptionStats,
    planBreakdown,
  ] = await Promise.all([
    // Total users
    c.env.DB.prepare('SELECT COUNT(*) as cnt FROM user')
      .first<{ cnt: number }>(),

    // New users in last 7 days
    c.env.DB.prepare('SELECT COUNT(*) as cnt FROM user WHERE created_at > ?')
      .bind(sevenDaysAgo).first<{ cnt: number }>(),

    // Total apps (non-deleted)
    c.env.DB.prepare('SELECT COUNT(*) as cnt FROM apps WHERE deleted_at IS NULL')
      .first<{ cnt: number }>(),

    // New apps in last 7 days
    c.env.DB.prepare(`
      SELECT COUNT(*) as cnt FROM apps
      WHERE deleted_at IS NULL AND created_at > ?
    `).bind(sevenDaysAgo).first<{ cnt: number }>(),

    // Total releases
    c.env.DB.prepare('SELECT COUNT(*) as cnt FROM releases')
      .first<{ cnt: number }>(),

    // Releases in last 7 days
    c.env.DB.prepare('SELECT COUNT(*) as cnt FROM releases WHERE created_at > ?')
      .bind(sevenDaysAgo).first<{ cnt: number }>(),

    // Total devices
    c.env.DB.prepare('SELECT COUNT(*) as cnt FROM devices')
      .first<{ cnt: number }>(),

    // Active devices in last 30 days
    c.env.DB.prepare('SELECT COUNT(*) as cnt FROM devices WHERE last_seen_at > ?')
      .bind(thirtyDaysAgo).first<{ cnt: number }>(),

    // Subscription status breakdown
    c.env.DB.prepare(`
      SELECT status, COUNT(*) as cnt FROM subscriptions GROUP BY status
    `).all<{ status: string; cnt: number }>(),

    // Plan breakdown
    c.env.DB.prepare(`
      SELECT sp.name, COUNT(s.id) as cnt
      FROM subscription_plans sp
      LEFT JOIN subscriptions s ON s.plan_id = sp.id AND s.status = 'active'
      GROUP BY sp.name
    `).all<{ name: string; cnt: number }>(),
  ])

  // Process subscription stats
  const subscriptionBreakdown: Record<string, number> = {}
  for (const row of subscriptionStats?.results ?? []) {
    subscriptionBreakdown[row.status] = row.cnt
  }

  // Process plan breakdown
  const planCounts: Record<string, number> = {}
  for (const row of planBreakdown?.results ?? []) {
    if (row.name) {
      planCounts[row.name] = row.cnt
    }
  }

  // Log dashboard view
  await logAdminAction(c.env.DB, {
    adminId,
    action: 'view_dashboard',
    details: { view: 'overview' },
  })

  return c.json({
    users: {
      total: totalUsers?.cnt ?? 0,
      new7d: newUsers7d?.cnt ?? 0,
    },
    apps: {
      total: totalApps?.cnt ?? 0,
      new7d: newApps7d?.cnt ?? 0,
    },
    releases: {
      total: totalReleases?.cnt ?? 0,
      new7d: releases7d?.cnt ?? 0,
    },
    devices: {
      total: totalDevices?.cnt ?? 0,
      active30d: activeDevices30d?.cnt ?? 0,
    },
    subscriptions: subscriptionBreakdown,
    plans: planCounts,
    generatedAt: now,
  })
})

/**
 * GET /admin/dashboard/audit-log
 * Get admin action history
 */
adminDashboardRouter.get('/audit-log', zValidator('query', auditLogQuerySchema), async (c) => {
  const query = c.req.valid('query')
  const currentAdminId = getAdminId(c)

  const result = await getAuditLog(c.env.DB, {
    adminId: query.adminId,
    action: query.action as AdminAction | undefined,
    targetUserId: query.targetUserId,
    targetAppId: query.targetAppId,
    startDate: query.startDate,
    endDate: query.endDate,
    limit: query.limit,
    offset: query.offset,
  })

  // Log that admin viewed the audit log
  await logAdminAction(c.env.DB, {
    adminId: currentAdminId,
    action: 'view_dashboard',
    details: { view: 'audit-log', filters: query },
  })

  return c.json({
    entries: result.entries,
    pagination: {
      total: result.total,
      limit: query.limit,
      offset: query.offset,
      hasMore: query.offset + result.entries.length < result.total,
    },
  })
})

/**
 * GET /admin/dashboard/health
 * Quick system health check
 */
adminDashboardRouter.get('/health', async (c) => {
  const checks: Record<string, boolean> = {}

  try {
    // Check DB connectivity
    const dbCheck = await c.env.DB.prepare('SELECT 1 as ok').first<{ ok: number }>()
    checks.database = dbCheck?.ok === 1
  } catch {
    checks.database = false
  }

  // Check if we have any suspended users (just to verify table exists)
  try {
    await c.env.DB.prepare('SELECT COUNT(*) FROM user_suspensions').first()
    checks.adminTables = true
  } catch {
    checks.adminTables = false
  }

  const healthy = Object.values(checks).every(v => v)

  return c.json({
    status: healthy ? 'healthy' : 'degraded',
    checks,
    timestamp: Date.now(),
  })
})
