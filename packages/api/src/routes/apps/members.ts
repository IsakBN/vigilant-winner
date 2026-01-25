/**
 * Project Members Routes
 *
 * Manages per-project access control beyond organization membership.
 *
 * @agent remediate-project-members
 * @modified 2026-01-25
 * @description Implemented project member CRUD with proper response formats
 */

import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { ERROR_CODES } from '@bundlenudge/shared'
import { authMiddleware, type AuthUser } from '../../middleware/auth'
import { requireProjectPermission } from '../../middleware/permissions'
import type { Env } from '../../types/env'
import type { ProjectRole } from '../../lib/permissions'

// =============================================================================
// Schemas
// =============================================================================

const addMemberSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(['admin', 'developer', 'viewer']),
})

const updateMemberSchema = z.object({
  role: z.enum(['admin', 'developer', 'viewer']),
})

// =============================================================================
// Types
// =============================================================================

interface MemberRow {
  id: string
  app_id: string
  user_id: string
  role: ProjectRole
  created_at: number
}

interface MemberWithUserRow extends MemberRow {
  user_name: string | null
  user_email: string
}

interface ProjectMemberVariables {
  user: AuthUser
  projectRole: ProjectRole
}

// =============================================================================
// Router
// =============================================================================

export const projectMembersRouter = new Hono<{
  Bindings: Env
  Variables: ProjectMemberVariables
}>()

// All routes require authentication
projectMembersRouter.use('*', authMiddleware)

/**
 * GET /v1/apps/:appId/members
 * List project members with user info
 */
projectMembersRouter.get(
  '/:appId/members',
  requireProjectPermission('canViewAnalytics'),
  async (c) => {
    const appId = c.req.param('appId')

    const results = await c.env.DB.prepare(`
      SELECT
        pm.id,
        pm.app_id,
        pm.user_id,
        pm.role,
        pm.created_at,
        u.name as user_name,
        u.email as user_email
      FROM project_members pm
      LEFT JOIN users u ON pm.user_id = u.id
      WHERE pm.app_id = ?
      ORDER BY pm.created_at ASC
    `).bind(appId).all<MemberWithUserRow>()

    return c.json({
      data: results.results.map(formatMemberWithUser),
    })
  }
)

/**
 * POST /v1/apps/:appId/members
 * Add a project member
 */
projectMembersRouter.post(
  '/:appId/members',
  requireProjectPermission('canManageProject'),
  zValidator('json', addMemberSchema),
  async (c) => {
    const appId = c.req.param('appId')
    const body = c.req.valid('json')

    // Verify user exists
    const targetUser = await c.env.DB.prepare(
      'SELECT id FROM users WHERE id = ?'
    ).bind(body.userId).first<{ id: string }>()

    if (!targetUser) {
      return c.json(
        { error: ERROR_CODES.NOT_FOUND, message: 'User not found' },
        404
      )
    }

    // Check if already a member
    const existing = await c.env.DB.prepare(
      'SELECT id FROM project_members WHERE app_id = ? AND user_id = ?'
    ).bind(appId, body.userId).first()

    if (existing) {
      return c.json(
        { error: 'already_member', message: 'User is already a project member' },
        409
      )
    }

    const now = Math.floor(Date.now() / 1000)
    const memberId = crypto.randomUUID()

    await c.env.DB.prepare(`
      INSERT INTO project_members (id, app_id, user_id, role, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).bind(memberId, appId, body.userId, body.role, now).run()

    return c.json({
      id: memberId,
      userId: body.userId,
      role: body.role,
      createdAt: now,
    }, 201)
  }
)

/**
 * PATCH /v1/apps/:appId/members/:memberId
 * Update a project member's role
 */
projectMembersRouter.patch(
  '/:appId/members/:memberId',
  requireProjectPermission('canManageProject'),
  zValidator('json', updateMemberSchema),
  async (c) => {
    const appId = c.req.param('appId')
    const memberId = c.req.param('memberId')
    const body = c.req.valid('json')

    const existing = await c.env.DB.prepare(
      'SELECT * FROM project_members WHERE id = ? AND app_id = ?'
    ).bind(memberId, appId).first<MemberRow>()

    if (!existing) {
      return c.json(
        { error: ERROR_CODES.NOT_FOUND, message: 'Member not found' },
        404
      )
    }

    await c.env.DB.prepare(
      'UPDATE project_members SET role = ? WHERE id = ?'
    ).bind(body.role, memberId).run()

    return c.json({
      id: memberId,
      userId: existing.user_id,
      role: body.role,
    })
  }
)

/**
 * DELETE /v1/apps/:appId/members/:memberId
 * Remove a project member
 */
projectMembersRouter.delete(
  '/:appId/members/:memberId',
  requireProjectPermission('canManageProject'),
  async (c) => {
    const appId = c.req.param('appId')
    const memberId = c.req.param('memberId')

    const result = await c.env.DB.prepare(
      'DELETE FROM project_members WHERE id = ? AND app_id = ?'
    ).bind(memberId, appId).run()

    if (!result.meta.changes) {
      return c.json(
        { error: ERROR_CODES.NOT_FOUND, message: 'Member not found' },
        404
      )
    }

    return c.body(null, 204)
  }
)

// =============================================================================
// Helpers
// =============================================================================

interface FormattedMember {
  id: string
  userId: string
  user: { name: string | null; email: string }
  role: ProjectRole
  createdAt: number
}

function formatMemberWithUser(member: MemberWithUserRow): FormattedMember {
  return {
    id: member.id,
    userId: member.user_id,
    user: {
      name: member.user_name,
      email: member.user_email,
    },
    role: member.role,
    createdAt: member.created_at,
  }
}
