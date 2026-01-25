/**
 * Project Members Routes
 *
 * Manages per-project access control beyond organization membership.
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
  email: z.string().email(),
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
  email?: string
  name?: string
}

interface ProjectMemberVariables {
  user: AuthUser
  projectRole: ProjectRole
}

// =============================================================================
// Router
// =============================================================================

export const projectMembersRouter = new Hono<{ Bindings: Env; Variables: ProjectMemberVariables }>()

// All routes require authentication
projectMembersRouter.use('*', authMiddleware)

/**
 * GET /v1/apps/:appId/members
 * List project members
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
        pm.created_at
      FROM project_members pm
      WHERE pm.app_id = ?
      ORDER BY pm.created_at ASC
    `).bind(appId).all<MemberRow>()

    return c.json({
      members: results.results.map(formatMember),
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

    // Find user by email
    const targetUser = await c.env.DB.prepare(
      'SELECT id FROM users WHERE email = ?'
    ).bind(body.email).first<{ id: string }>()

    if (!targetUser) {
      return c.json(
        { error: ERROR_CODES.NOT_FOUND, message: 'User not found' },
        404
      )
    }

    // Check if already a member
    const existing = await c.env.DB.prepare(
      'SELECT id FROM project_members WHERE app_id = ? AND user_id = ?'
    ).bind(appId, targetUser.id).first()

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
    `).bind(memberId, appId, targetUser.id, body.role, now).run()

    return c.json({ success: true, memberId }, 201)
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

    return c.json({ success: true })
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

    return c.json({ success: true })
  }
)

// =============================================================================
// Helpers
// =============================================================================

interface FormattedMember {
  id: string
  appId: string
  userId: string
  role: ProjectRole
  createdAt: number
}

function formatMember(member: MemberRow): FormattedMember {
  return {
    id: member.id,
    appId: member.app_id,
    userId: member.user_id,
    role: member.role,
    createdAt: member.created_at,
  }
}
