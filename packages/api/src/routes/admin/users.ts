/**
 * Admin user management routes
 *
 * User listing, details, limit overrides, and suspension management
 *
 * @agent wave5-admin
 */

import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { ERROR_CODES } from '@bundlenudge/shared'
import { logAdminAction } from '../../lib/admin/audit'
import { getAdminId } from '../../middleware/admin'
import type { Env } from '../../types/env'

// Validation schemas
const listUsersSchema = z.object({
  search: z.string().optional(),
  plan: z.string().optional(),
  status: z.enum(['active', 'suspended']).optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
})

const userIdSchema = z.object({
  userId: z.string().uuid(),
})

const overrideLimitsSchema = z.object({
  mauLimit: z.number().int().positive().optional(),
  storageGb: z.number().int().positive().optional(),
  expiresAt: z.number().int().positive().optional(),
  reason: z.string().min(5).max(500),
})

const suspendUserSchema = z.object({
  reason: z.string().min(10).max(500),
  until: z.number().int().positive().optional(),
})

export const adminUsersRouter = new Hono<{ Bindings: Env }>()

/**
 * GET /admin/users
 * List all users with filtering
 */
adminUsersRouter.get('/', zValidator('query', listUsersSchema), async (c) => {
  const { search, plan, status, limit, offset } = c.req.valid('query')
  const adminId = getAdminId(c)

  const conditions: string[] = []
  const bindings: (string | number)[] = []

  if (search) {
    conditions.push('(u.email LIKE ? OR u.name LIKE ?)')
    bindings.push(`%${search}%`, `%${search}%`)
  }

  if (plan) {
    conditions.push('sp.name = ?')
    bindings.push(plan)
  }

  const whereClause = conditions.length > 0
    ? `WHERE ${conditions.join(' AND ')}`
    : ''

  // Get total count
  const countResult = await c.env.DB.prepare(`
    SELECT COUNT(DISTINCT u.id) as total
    FROM user u
    LEFT JOIN subscriptions s ON s.user_id = u.id
    LEFT JOIN subscription_plans sp ON s.plan_id = sp.id
    ${whereClause}
  `).bind(...bindings).first<{ total: number }>()

  const total = countResult?.total ?? 0

  // Get paginated results with subscription info
  const results = await c.env.DB.prepare(`
    SELECT
      u.id, u.email, u.name, u.created_at,
      sp.name as plan_name,
      s.status as subscription_status,
      (SELECT COUNT(*) FROM apps WHERE owner_id = u.id) as app_count,
      (SELECT 1 FROM user_suspensions
       WHERE user_id = u.id AND lifted_at IS NULL
       AND (until IS NULL OR until > ?) LIMIT 1) as is_suspended
    FROM user u
    LEFT JOIN subscriptions s ON s.user_id = u.id
    LEFT JOIN subscription_plans sp ON s.plan_id = sp.id
    ${whereClause}
    GROUP BY u.id
    ORDER BY u.created_at DESC
    LIMIT ? OFFSET ?
  `).bind(...bindings, Date.now(), limit, offset).all<{
    id: string
    email: string
    name: string | null
    created_at: number
    plan_name: string | null
    subscription_status: string | null
    app_count: number
    is_suspended: number | null
  }>()

  // Filter by suspension status if requested
  let users = results.results
  if (status === 'suspended') {
    users = users.filter(u => u.is_suspended === 1)
  } else if (status === 'active') {
    users = users.filter(u => u.is_suspended !== 1)
  }

  // Log view action
  await logAdminAction(c.env.DB, {
    adminId,
    action: 'view_user',
    details: { search, plan, status, count: users.length },
  })

  return c.json({
    users: users.map(u => ({
      id: u.id,
      email: u.email,
      name: u.name,
      createdAt: u.created_at,
      plan: u.plan_name,
      subscriptionStatus: u.subscription_status,
      appCount: u.app_count,
      isSuspended: u.is_suspended === 1,
    })),
    pagination: { total, limit, offset, hasMore: offset + users.length < total },
  })
})

/**
 * GET /admin/users/:userId
 * Get detailed user information
 */
adminUsersRouter.get('/:userId', zValidator('param', userIdSchema), async (c) => {
  const { userId } = c.req.valid('param')
  const adminId = getAdminId(c)

  // Get user with subscription
  const user = await c.env.DB.prepare(`
    SELECT u.id, u.email, u.name, u.created_at,
           s.id as subscription_id, s.status as subscription_status,
           sp.name as plan_name, sp.display_name as plan_display,
           sp.mau_limit as plan_mau_limit, sp.storage_gb as plan_storage_gb
    FROM user u
    LEFT JOIN subscriptions s ON s.user_id = u.id
    LEFT JOIN subscription_plans sp ON s.plan_id = sp.id
    WHERE u.id = ?
  `).bind(userId).first<{
    id: string; email: string; name: string | null; created_at: number
    subscription_id: string | null; subscription_status: string | null
    plan_name: string | null; plan_display: string | null
    plan_mau_limit: number | null; plan_storage_gb: number | null
  }>()

  if (!user) {
    return c.json({ error: ERROR_CODES.NOT_FOUND, message: 'User not found' }, 404)
  }

  // Get apps
  const apps = await c.env.DB.prepare(`
    SELECT id, name, platform, created_at FROM apps
    WHERE owner_id = ? AND deleted_at IS NULL
    ORDER BY created_at DESC LIMIT 20
  `).bind(userId).all<{ id: string; name: string; platform: string; created_at: number }>()

  // Get limit overrides
  const overrides = await c.env.DB.prepare(`
    SELECT * FROM user_limit_overrides
    WHERE user_id = ? AND (expires_at IS NULL OR expires_at > ?)
  `).bind(userId, Date.now()).first<{
    id: string; mau_limit: number | null; storage_gb: number | null
    expires_at: number | null; reason: string | null
  }>()

  // Get suspension
  const suspension = await c.env.DB.prepare(`
    SELECT * FROM user_suspensions
    WHERE user_id = ? AND lifted_at IS NULL
    AND (until IS NULL OR until > ?)
    ORDER BY created_at DESC LIMIT 1
  `).bind(userId, Date.now()).first<{
    id: string; reason: string; until: number | null; suspended_by: string; created_at: number
  }>()

  // Log view action
  await logAdminAction(c.env.DB, {
    adminId,
    action: 'view_user',
    targetUserId: userId,
  })

  return c.json({
    user: {
      id: user.id, email: user.email, name: user.name, createdAt: user.created_at,
    },
    subscription: user.subscription_id ? {
      id: user.subscription_id,
      status: user.subscription_status,
      plan: { name: user.plan_name, display: user.plan_display,
              mauLimit: user.plan_mau_limit, storageGb: user.plan_storage_gb },
    } : null,
    apps: apps.results,
    overrides: overrides ? {
      mauLimit: overrides.mau_limit,
      storageGb: overrides.storage_gb,
      expiresAt: overrides.expires_at,
      reason: overrides.reason,
    } : null,
    suspension: suspension ? {
      reason: suspension.reason,
      until: suspension.until,
      suspendedBy: suspension.suspended_by,
      createdAt: suspension.created_at,
    } : null,
  })
})

/**
 * POST /admin/users/:userId/override-limits
 * Set custom limits for a user
 */
adminUsersRouter.post(
  '/:userId/override-limits',
  zValidator('param', userIdSchema),
  zValidator('json', overrideLimitsSchema),
  async (c) => {
    const { userId } = c.req.valid('param')
    const body = c.req.valid('json')
    const adminId = getAdminId(c)

    // Verify user exists
    const user = await c.env.DB.prepare('SELECT id FROM user WHERE id = ?')
      .bind(userId).first()
    if (!user) {
      return c.json({ error: ERROR_CODES.NOT_FOUND, message: 'User not found' }, 404)
    }

    const now = Date.now()
    const id = crypto.randomUUID()

    // Upsert override
    await c.env.DB.prepare(`
      INSERT INTO user_limit_overrides (
        id, user_id, mau_limit, storage_gb, expires_at, reason, created_by, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET
        mau_limit = COALESCE(excluded.mau_limit, mau_limit),
        storage_gb = COALESCE(excluded.storage_gb, storage_gb),
        expires_at = excluded.expires_at,
        reason = excluded.reason,
        updated_at = excluded.updated_at
    `).bind(
      id, userId, body.mauLimit ?? null, body.storageGb ?? null,
      body.expiresAt ?? null, body.reason, adminId, now, now
    ).run()

    await logAdminAction(c.env.DB, {
      adminId, action: 'override_limits', targetUserId: userId,
      details: { mauLimit: body.mauLimit, storageGb: body.storageGb, reason: body.reason },
    })

    return c.json({ success: true, message: 'Limits overridden successfully' })
  }
)

/**
 * DELETE /admin/users/:userId/override-limits
 * Remove custom limit overrides
 */
adminUsersRouter.delete(
  '/:userId/override-limits',
  zValidator('param', userIdSchema),
  async (c) => {
    const { userId } = c.req.valid('param')
    const adminId = getAdminId(c)

    await c.env.DB.prepare('DELETE FROM user_limit_overrides WHERE user_id = ?')
      .bind(userId).run()

    await logAdminAction(c.env.DB, {
      adminId, action: 'remove_override_limits', targetUserId: userId,
    })

    return c.json({ success: true, message: 'Limit overrides removed' })
  }
)

/**
 * POST /admin/users/:userId/suspend
 * Suspend a user account
 */
adminUsersRouter.post(
  '/:userId/suspend',
  zValidator('param', userIdSchema),
  zValidator('json', suspendUserSchema),
  async (c) => {
    const { userId } = c.req.valid('param')
    const body = c.req.valid('json')
    const adminId = getAdminId(c)

    // Don't allow self-suspension
    if (userId === adminId) {
      return c.json({ error: ERROR_CODES.FORBIDDEN, message: 'Cannot suspend yourself' }, 400)
    }

    // Verify user exists
    const user = await c.env.DB.prepare('SELECT id, email FROM user WHERE id = ?')
      .bind(userId).first<{ id: string; email: string }>()
    if (!user) {
      return c.json({ error: ERROR_CODES.NOT_FOUND, message: 'User not found' }, 404)
    }

    const now = Date.now()
    const id = crypto.randomUUID()

    await c.env.DB.prepare(`
      INSERT INTO user_suspensions (id, user_id, reason, until, suspended_by, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(id, userId, body.reason, body.until ?? null, adminId, now).run()

    await logAdminAction(c.env.DB, {
      adminId, action: 'suspend_user', targetUserId: userId,
      details: { reason: body.reason, until: body.until, email: user.email },
    })

    return c.json({
      success: true,
      message: body.until
        ? `User suspended until ${new Date(body.until).toISOString()}`
        : 'User suspended indefinitely',
    })
  }
)

/**
 * DELETE /admin/users/:userId/suspend
 * Unsuspend a user account
 */
adminUsersRouter.delete(
  '/:userId/suspend',
  zValidator('param', userIdSchema),
  async (c) => {
    const { userId } = c.req.valid('param')
    const adminId = getAdminId(c)

    const now = Date.now()

    await c.env.DB.prepare(`
      UPDATE user_suspensions SET lifted_at = ?, lifted_by = ?
      WHERE user_id = ? AND lifted_at IS NULL
    `).bind(now, adminId, userId).run()

    await logAdminAction(c.env.DB, {
      adminId, action: 'unsuspend_user', targetUserId: userId,
    })

    return c.json({ success: true, message: 'User unsuspended' })
  }
)
