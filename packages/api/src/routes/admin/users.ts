/**
 * Admin user management routes
 *
 * User listing, details, updates, and deletion
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
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
  search: z.string().optional(),
  status: z.enum(['active', 'banned', 'deleted']).optional(),
  plan: z.string().optional(),
  sortBy: z.enum(['createdAt', 'lastLoginAt', 'email']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

const userIdSchema = z.object({
  userId: z.string().uuid(),
})

const updateUserSchema = z.object({
  status: z.enum(['active', 'banned']).optional(),
  banReason: z.string().min(10).max(500).optional(),
  subscription: z.object({
    planId: z.string().uuid(),
    expiresAt: z.number().int().positive().nullable().optional(),
  }).optional(),
})

export const adminUsersRouter = new Hono<{ Bindings: Env }>()

/**
 * GET /admin/users
 * List all users with pagination and filtering
 */
adminUsersRouter.get('/', zValidator('query', listUsersSchema), async (c) => {
  const { limit, offset, search, status, plan, sortBy, sortOrder } = c.req.valid('query')
  const adminId = getAdminId(c)

  const conditions: string[] = []
  const bindings: (string | number)[] = []

  // Search filter
  if (search) {
    conditions.push('(u.email LIKE ? OR u.name LIKE ?)')
    bindings.push(`%${search}%`, `%${search}%`)
  }

  // Plan filter
  if (plan) {
    conditions.push('sp.name = ?')
    bindings.push(plan)
  }

  // Status filter (active, banned, deleted)
  if (status === 'deleted') {
    conditions.push('u.deleted_at IS NOT NULL')
  } else {
    conditions.push('u.deleted_at IS NULL')
  }

  const whereClause = conditions.length > 0
    ? `WHERE ${conditions.join(' AND ')}`
    : ''

  // Map sortBy to database column
  const sortColumn = {
    createdAt: 'u.created_at',
    lastLoginAt: 'u.updated_at', // Use updated_at as proxy for last login
    email: 'u.email',
  }[sortBy]

  // Get total count
  const countResult = await c.env.DB.prepare(`
    SELECT COUNT(DISTINCT u.id) as total
    FROM user u
    LEFT JOIN subscriptions s ON s.user_id = u.id
    LEFT JOIN subscription_plans sp ON s.plan_id = sp.id
    ${whereClause}
  `).bind(...bindings).first<{ total: number }>()

  const total = countResult?.total ?? 0
  const now = Date.now()

  // Get paginated results with subscription and ban info
  const results = await c.env.DB.prepare(`
    SELECT
      u.id, u.email, u.name, u.created_at, u.updated_at, u.deleted_at,
      sp.name as plan_name, sp.id as plan_id,
      s.status as subscription_status,
      s.current_period_end as subscription_expires_at,
      (SELECT COUNT(*) FROM apps WHERE owner_id = u.id AND deleted_at IS NULL) as app_count,
      (SELECT COUNT(*) FROM devices d
       JOIN apps a ON d.app_id = a.id
       WHERE a.owner_id = u.id) as device_count,
      (SELECT reason FROM user_suspensions
       WHERE user_id = u.id AND lifted_at IS NULL
       AND (until IS NULL OR until > ?) LIMIT 1) as ban_reason
    FROM user u
    LEFT JOIN subscriptions s ON s.user_id = u.id
    LEFT JOIN subscription_plans sp ON s.plan_id = sp.id
    ${whereClause}
    GROUP BY u.id
    ORDER BY ${sortColumn} ${sortOrder.toUpperCase()}
    LIMIT ? OFFSET ?
  `).bind(...bindings, now, limit, offset).all<{
    id: string
    email: string
    name: string | null
    created_at: number
    updated_at: number | null
    deleted_at: number | null
    plan_name: string | null
    plan_id: string | null
    subscription_status: string | null
    subscription_expires_at: number | null
    app_count: number
    device_count: number
    ban_reason: string | null
  }>()

  // Filter by ban status if requested
  let users = results.results
  if (status === 'banned') {
    users = users.filter(u => u.ban_reason !== null)
  } else if (status === 'active') {
    users = users.filter(u => u.ban_reason === null)
  }

  // Log view action
  await logAdminAction(c.env.DB, {
    adminId,
    action: 'view_user',
    details: { search, plan, status, sortBy, sortOrder, count: users.length },
  })

  return c.json({
    users: users.map(u => ({
      id: u.id,
      email: u.email,
      name: u.name,
      status: u.deleted_at ? 'deleted' : (u.ban_reason ? 'banned' : 'active'),
      subscription: u.plan_id ? {
        planId: u.plan_id,
        planName: u.plan_name,
        status: u.subscription_status,
        expiresAt: u.subscription_expires_at,
      } : null,
      stats: {
        appCount: u.app_count,
        deviceCount: u.device_count,
      },
      createdAt: u.created_at,
      lastLoginAt: u.updated_at,
    })),
    pagination: { total, limit, offset, hasMore: offset + users.length < total },
  })
})

/**
 * GET /admin/users/:userId
 * Get detailed user information with stats
 */
adminUsersRouter.get('/:userId', zValidator('param', userIdSchema), async (c) => {
  const { userId } = c.req.valid('param')
  const adminId = getAdminId(c)

  // Get user with subscription
  const user = await c.env.DB.prepare(`
    SELECT u.id, u.email, u.name, u.created_at, u.updated_at, u.deleted_at,
           s.id as subscription_id, s.status as subscription_status,
           s.current_period_end as subscription_expires_at,
           sp.id as plan_id, sp.name as plan_name, sp.display_name as plan_display
    FROM user u
    LEFT JOIN subscriptions s ON s.user_id = u.id
    LEFT JOIN subscription_plans sp ON s.plan_id = sp.id
    WHERE u.id = ?
  `).bind(userId).first<{
    id: string; email: string; name: string | null
    created_at: number; updated_at: number | null; deleted_at: number | null
    subscription_id: string | null; subscription_status: string | null
    subscription_expires_at: number | null
    plan_id: string | null; plan_name: string | null; plan_display: string | null
  }>()

  if (!user) {
    return c.json({ error: ERROR_CODES.NOT_FOUND, message: 'User not found' }, 404)
  }

  // Get stats
  const [appCount, deviceCount, releaseCount] = await Promise.all([
    c.env.DB.prepare(`
      SELECT COUNT(*) as cnt FROM apps WHERE owner_id = ? AND deleted_at IS NULL
    `).bind(userId).first<{ cnt: number }>(),
    c.env.DB.prepare(`
      SELECT COUNT(*) as cnt FROM devices d
      JOIN apps a ON d.app_id = a.id
      WHERE a.owner_id = ?
    `).bind(userId).first<{ cnt: number }>(),
    c.env.DB.prepare(`
      SELECT COUNT(*) as cnt FROM releases r
      JOIN apps a ON r.app_id = a.id
      WHERE a.owner_id = ?
    `).bind(userId).first<{ cnt: number }>(),
  ])

  // Get ban status
  const now = Date.now()
  const banRecord = await c.env.DB.prepare(`
    SELECT reason, until, suspended_by, created_at
    FROM user_suspensions
    WHERE user_id = ? AND lifted_at IS NULL
    AND (until IS NULL OR until > ?)
    ORDER BY created_at DESC LIMIT 1
  `).bind(userId, now).first<{
    reason: string; until: number | null; suspended_by: string; created_at: number
  }>()

  // Log view action
  await logAdminAction(c.env.DB, {
    adminId,
    action: 'view_user',
    targetUserId: userId,
  })

  // Determine status
  let status: 'active' | 'banned' | 'deleted' = 'active'
  if (user.deleted_at) {
    status = 'deleted'
  } else if (banRecord) {
    status = 'banned'
  }

  return c.json({
    id: user.id,
    email: user.email,
    name: user.name,
    status,
    subscription: user.subscription_id ? {
      planId: user.plan_id,
      planName: user.plan_name,
      status: user.subscription_status,
      expiresAt: user.subscription_expires_at,
    } : null,
    stats: {
      appCount: appCount?.cnt ?? 0,
      deviceCount: deviceCount?.cnt ?? 0,
      totalReleases: releaseCount?.cnt ?? 0,
    },
    createdAt: user.created_at,
    lastLoginAt: user.updated_at,
    banInfo: banRecord ? {
      reason: banRecord.reason,
      until: banRecord.until,
      bannedBy: banRecord.suspended_by,
      bannedAt: banRecord.created_at,
    } : null,
  })
})

/**
 * PATCH /admin/users/:userId
 * Update user status or subscription
 */
adminUsersRouter.patch(
  '/:userId',
  zValidator('param', userIdSchema),
  zValidator('json', updateUserSchema),
  async (c) => {
    const { userId } = c.req.valid('param')
    const body = c.req.valid('json')
    const adminId = getAdminId(c)

    // Don't allow self-modification
    if (userId === adminId) {
      return c.json(
        { error: ERROR_CODES.FORBIDDEN, message: 'Cannot modify yourself' },
        400
      )
    }

    // Verify user exists and is not deleted
    const user = await c.env.DB.prepare(
      'SELECT id, email, deleted_at FROM user WHERE id = ?'
    ).bind(userId).first<{ id: string; email: string; deleted_at: number | null }>()

    if (!user) {
      return c.json({ error: ERROR_CODES.NOT_FOUND, message: 'User not found' }, 404)
    }

    if (user.deleted_at) {
      return c.json(
        { error: ERROR_CODES.INVALID_STATE, message: 'Cannot modify deleted user' },
        400
      )
    }

    const now = Date.now()
    const changes: string[] = []

    // Handle status change (ban/unban)
    if (body.status) {
      if (body.status === 'banned') {
        if (!body.banReason) {
          return c.json(
            { error: ERROR_CODES.VALIDATION_ERROR, message: 'Ban reason required' },
            400
          )
        }

        // Create ban record
        const banId = crypto.randomUUID()
        await c.env.DB.prepare(`
          INSERT INTO user_suspensions (id, user_id, reason, suspended_by, created_at)
          VALUES (?, ?, ?, ?, ?)
        `).bind(banId, userId, body.banReason, adminId, now).run()

        await logAdminAction(c.env.DB, {
          adminId,
          action: 'ban_user',
          targetUserId: userId,
          details: { reason: body.banReason, email: user.email },
        })

        changes.push('User banned')
      } else {
        // Lift all active bans
        await c.env.DB.prepare(`
          UPDATE user_suspensions SET lifted_at = ?, lifted_by = ?
          WHERE user_id = ? AND lifted_at IS NULL
        `).bind(now, adminId, userId).run()

        await logAdminAction(c.env.DB, {
          adminId,
          action: 'unban_user',
          targetUserId: userId,
          details: { email: user.email },
        })

        changes.push('User unbanned')
      }
    }

    // Handle subscription update
    if (body.subscription) {
      // Verify plan exists
      const plan = await c.env.DB.prepare(
        'SELECT id, name FROM subscription_plans WHERE id = ?'
      ).bind(body.subscription.planId).first<{ id: string; name: string }>()

      if (!plan) {
        return c.json(
          { error: ERROR_CODES.NOT_FOUND, message: 'Plan not found' },
          404
        )
      }

      // Upsert subscription
      const subId = crypto.randomUUID()
      await c.env.DB.prepare(`
        INSERT INTO subscriptions (
          id, user_id, plan_id, status, current_period_end, created_at, updated_at
        )
        VALUES (?, ?, ?, 'active', ?, ?, ?)
        ON CONFLICT(user_id) DO UPDATE SET
          plan_id = excluded.plan_id,
          current_period_end = excluded.current_period_end,
          updated_at = excluded.updated_at
      `).bind(
        subId, userId, body.subscription.planId,
        body.subscription.expiresAt ?? null, now, now
      ).run()

      await logAdminAction(c.env.DB, {
        adminId,
        action: 'update_user',
        targetUserId: userId,
        details: {
          subscriptionChange: { planId: plan.id, planName: plan.name },
          email: user.email,
        },
      })

      changes.push(`Subscription updated to ${plan.name}`)
    }

    if (changes.length === 0) {
      return c.json(
        { error: ERROR_CODES.VALIDATION_ERROR, message: 'No changes provided' },
        400
      )
    }

    return c.json({
      success: true,
      message: changes.join(', '),
    })
  }
)

/**
 * DELETE /admin/users/:userId
 * Soft delete a user (set deleted_at timestamp)
 */
adminUsersRouter.delete('/:userId', zValidator('param', userIdSchema), async (c) => {
  const { userId } = c.req.valid('param')
  const adminId = getAdminId(c)

  // Don't allow self-deletion
  if (userId === adminId) {
    return c.json(
      { error: ERROR_CODES.FORBIDDEN, message: 'Cannot delete yourself' },
      400
    )
  }

  // Verify user exists
  const user = await c.env.DB.prepare(
    'SELECT id, email, deleted_at FROM user WHERE id = ?'
  ).bind(userId).first<{ id: string; email: string; deleted_at: number | null }>()

  if (!user) {
    return c.json({ error: ERROR_CODES.NOT_FOUND, message: 'User not found' }, 404)
  }

  if (user.deleted_at) {
    return c.json(
      { error: ERROR_CODES.INVALID_STATE, message: 'User already deleted' },
      400
    )
  }

  const now = Date.now()

  // Soft delete the user
  await c.env.DB.prepare(
    'UPDATE user SET deleted_at = ? WHERE id = ?'
  ).bind(now, userId).run()

  // Also soft delete all user's apps
  await c.env.DB.prepare(
    'UPDATE apps SET deleted_at = ? WHERE owner_id = ? AND deleted_at IS NULL'
  ).bind(now, userId).run()

  // Get counts for audit
  const appCount = await c.env.DB.prepare(
    'SELECT COUNT(*) as cnt FROM apps WHERE owner_id = ?'
  ).bind(userId).first<{ cnt: number }>()

  await logAdminAction(c.env.DB, {
    adminId,
    action: 'delete_user',
    targetUserId: userId,
    details: {
      email: user.email,
      appsDeleted: appCount?.cnt ?? 0,
    },
  })

  return c.json({
    success: true,
    message: 'User deactivated successfully',
  })
})
