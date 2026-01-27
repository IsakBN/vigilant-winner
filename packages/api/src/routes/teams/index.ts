/**
 * Teams (Organizations) Routes
 *
 * Handles team CRUD operations and membership management.
 *
 * @agent remediate-pagination
 * @modified 2026-01-25
 */

import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import type { Env } from '../../types/env'
import { invitationsRouter } from './invitations'
import { auditRouter } from './audit'

// =============================================================================
// Schemas
// =============================================================================

const createTeamSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/).optional(),
})

const updateTeamSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/).optional(),
})

const updateMemberRoleSchema = z.object({
  role: z.enum(['admin', 'member']),
})

// =============================================================================
// Router
// =============================================================================

export const teamsRouter = new Hono<{ Bindings: Env }>()

/**
 * GET /v1/teams
 * List user's teams with pagination
 */
teamsRouter.get('/', async (c) => {
  const userId = c.req.header('X-User-Id')
  const limit = Math.min(Number(c.req.query('limit')) || 20, 100)
  const offset = Number(c.req.query('offset')) || 0

  if (!userId) {
    return c.json({ error: 'unauthorized', message: 'Authentication required' }, 401)
  }

  // Get total count
  const countResult = await c.env.DB.prepare(`
    SELECT COUNT(*) as total
    FROM organizations o
    JOIN organization_members om ON om.organization_id = o.id
    WHERE om.user_id = ?
  `).bind(userId).first<{ total: number }>()
  const total = countResult?.total ?? 0

  // Get paginated results
  const results = await c.env.DB.prepare(`
    SELECT
      o.id, o.name, o.slug, o.owner_id, o.created_at, o.updated_at,
      om.role,
      (SELECT COUNT(*) FROM organization_members WHERE organization_id = o.id) as member_count
    FROM organizations o
    JOIN organization_members om ON om.organization_id = o.id
    WHERE om.user_id = ?
    ORDER BY o.created_at DESC
    LIMIT ? OFFSET ?
  `).bind(userId, limit, offset).all()

  const data = (results.results as unknown as TeamRecord[]).map(formatTeam)

  return c.json({
    data,
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + data.length < total,
    },
  })
})

/**
 * GET /v1/teams/:teamId
 * Get single team
 */
teamsRouter.get('/:teamId', async (c) => {
  const userId = c.req.header('X-User-Id')
  const teamId = c.req.param('teamId')

  if (!userId) {
    return c.json({ error: 'unauthorized', message: 'Authentication required' }, 401)
  }

  const team = await c.env.DB.prepare(`
    SELECT
      o.id, o.name, o.slug, o.owner_id, o.created_at, o.updated_at,
      om.role
    FROM organizations o
    JOIN organization_members om ON om.organization_id = o.id
    WHERE o.id = ? AND om.user_id = ?
  `).bind(teamId, userId).first()

  if (!team) {
    return c.json({ error: 'not_found', message: 'Team not found' }, 404)
  }

  return c.json({ team: formatTeam(team as unknown as TeamRecord) })
})

/**
 * POST /v1/teams
 * Create a new team (requires Pro+ plan)
 */
teamsRouter.post('/', zValidator('json', createTeamSchema), async (c) => {
  const userId = c.req.header('X-User-Id')
  const body = c.req.valid('json')

  if (!userId) {
    return c.json({ error: 'unauthorized', message: 'Authentication required' }, 401)
  }

  // Check plan allows teams
  const subscription = await c.env.DB.prepare(`
    SELECT s.*, p.name as plan_name
    FROM subscriptions s
    JOIN subscription_plans p ON s.plan_id = p.id
    WHERE s.user_id = ? AND s.status IN ('active', 'trialing')
    ORDER BY s.created_at DESC LIMIT 1
  `).bind(userId).first<{ plan_name: string }>()

  const planName = subscription?.plan_name ?? 'free'

  if (planName === 'free') {
    return c.json(
      { error: 'plan_limit_exceeded', message: 'Teams require Pro plan or higher' },
      402
    )
  }

  const teamId = crypto.randomUUID()
  const now = Math.floor(Date.now() / 1000)
  const slug = body.slug ?? generateSlug(body.name)

  // Check slug uniqueness
  const existingSlug = await c.env.DB.prepare(
    'SELECT id FROM organizations WHERE slug = ?'
  ).bind(slug).first()

  if (existingSlug) {
    return c.json({ error: 'slug_taken', message: 'This slug is already taken' }, 409)
  }

  // Create organization
  await c.env.DB.prepare(`
    INSERT INTO organizations (id, name, slug, owner_id, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(teamId, body.name, slug, userId, now, now).run()

  // Add creator as owner
  await c.env.DB.prepare(`
    INSERT INTO organization_members (id, organization_id, user_id, role, created_at)
    VALUES (?, ?, ?, 'owner', ?)
  `).bind(crypto.randomUUID(), teamId, userId, now).run()

  // Log audit event
  await logAuditEvent(c.env.DB, teamId, userId, 'team.created', { name: body.name })

  const team = await c.env.DB.prepare(
    'SELECT * FROM organizations WHERE id = ?'
  ).bind(teamId).first()

  return c.json({ team: formatTeam(team as unknown as TeamRecord | null) }, 201)
})

/**
 * PATCH /v1/teams/:teamId
 * Update team (requires owner or admin)
 */
teamsRouter.patch('/:teamId', zValidator('json', updateTeamSchema), async (c) => {
  const userId = c.req.header('X-User-Id')
  const teamId = c.req.param('teamId')
  const body = c.req.valid('json')

  if (!userId) {
    return c.json({ error: 'unauthorized', message: 'Authentication required' }, 401)
  }

  // Check membership and role
  const membership = await c.env.DB.prepare(`
    SELECT role FROM organization_members
    WHERE organization_id = ? AND user_id = ?
  `).bind(teamId, userId).first<{ role: string }>()

  if (!membership) {
    return c.json({ error: 'not_found', message: 'Team not found' }, 404)
  }

  if (membership.role !== 'owner' && membership.role !== 'admin') {
    return c.json({ error: 'forbidden', message: 'Requires owner or admin role' }, 403)
  }

  const updates: string[] = []
  const values: (string | number)[] = []

  if (body.name) {
    updates.push('name = ?')
    values.push(body.name)
  }

  if (body.slug) {
    // Check slug uniqueness
    const existingSlug = await c.env.DB.prepare(
      'SELECT id FROM organizations WHERE slug = ? AND id != ?'
    ).bind(body.slug, teamId).first()

    if (existingSlug) {
      return c.json({ error: 'slug_taken', message: 'This slug is already taken' }, 409)
    }

    updates.push('slug = ?')
    values.push(body.slug)
  }

  if (updates.length > 0) {
    updates.push('updated_at = ?')
    values.push(Math.floor(Date.now() / 1000))
    values.push(teamId)

    await c.env.DB.prepare(`
      UPDATE organizations SET ${updates.join(', ')} WHERE id = ?
    `).bind(...values).run()
  }

  const team = await c.env.DB.prepare(
    'SELECT * FROM organizations WHERE id = ?'
  ).bind(teamId).first()

  return c.json({ team: formatTeam(team as unknown as TeamRecord | null) })
})

/**
 * DELETE /v1/teams/:teamId
 * Delete team (owner only)
 *
 * ONLY the organization owner can delete the organization.
 * Admins and members cannot delete organizations.
 *
 * @agent owner-only-deletion
 * @modified 2026-01-27
 */
teamsRouter.delete('/:teamId', async (c) => {
  const userId = c.req.header('X-User-Id')
  const teamId = c.req.param('teamId')

  if (!userId) {
    return c.json({ error: 'unauthorized', message: 'Authentication required' }, 401)
  }

  // Only owner can delete
  const membership = await c.env.DB.prepare(`
    SELECT role FROM organization_members
    WHERE organization_id = ? AND user_id = ?
  `).bind(teamId, userId).first<{ role: string }>()

  if (!membership) {
    return c.json({ error: 'not_found', message: 'Team not found' }, 404)
  }

  // Log deletion attempt for audit purposes (even failed ones)
  await logAuditEvent(c.env.DB, teamId, userId, 'team.delete_attempted', {
    allowed: membership.role === 'owner',
    reason: membership.role === 'owner' ? 'is_owner' : 'not_owner',
    actorRole: membership.role,
  })

  if (membership.role !== 'owner') {
    return c.json({
      error: 'OWNER_REQUIRED',
      code: 'OWNER_REQUIRED',
      message: 'Only the organization owner can delete the organization',
    }, 403)
  }

  // Get team name for audit log before deletion
  const team = await c.env.DB.prepare(
    'SELECT name FROM organizations WHERE id = ?'
  ).bind(teamId).first<{ name: string }>()

  // Log successful deletion before we delete the audit log
  await logAuditEvent(c.env.DB, teamId, userId, 'team.deleted', {
    teamName: team?.name,
  })

  // Delete all related data (including project access entries)
  await c.env.DB.batch([
    c.env.DB.prepare('DELETE FROM team_invitations WHERE organization_id = ?').bind(teamId),
    c.env.DB.prepare('DELETE FROM member_project_access WHERE organization_id = ?').bind(teamId),
    c.env.DB.prepare('DELETE FROM organization_members WHERE organization_id = ?').bind(teamId),
    c.env.DB.prepare('DELETE FROM team_audit_log WHERE organization_id = ?').bind(teamId),
    c.env.DB.prepare('DELETE FROM organizations WHERE id = ?').bind(teamId),
  ])

  return c.json({ success: true })
})

// =============================================================================
// Member Management
// =============================================================================

/**
 * GET /v1/teams/:teamId/members
 * List team members with pagination
 */
teamsRouter.get('/:teamId/members', async (c) => {
  const userId = c.req.header('X-User-Id')
  const teamId = c.req.param('teamId')
  const limit = Math.min(Number(c.req.query('limit')) || 20, 100)
  const offset = Number(c.req.query('offset')) || 0

  if (!userId) {
    return c.json({ error: 'unauthorized', message: 'Authentication required' }, 401)
  }

  // Verify membership
  const membership = await c.env.DB.prepare(`
    SELECT role FROM organization_members
    WHERE organization_id = ? AND user_id = ?
  `).bind(teamId, userId).first()

  if (!membership) {
    return c.json({ error: 'not_found', message: 'Team not found' }, 404)
  }

  // Get total count
  const countResult = await c.env.DB.prepare(
    'SELECT COUNT(*) as total FROM organization_members WHERE organization_id = ?'
  ).bind(teamId).first<{ total: number }>()
  const total = countResult?.total ?? 0

  // Get paginated results
  const results = await c.env.DB.prepare(`
    SELECT
      om.id, om.user_id, om.role, om.created_at
    FROM organization_members om
    WHERE om.organization_id = ?
    ORDER BY om.created_at ASC
    LIMIT ? OFFSET ?
  `).bind(teamId, limit, offset).all()

  const data = (results.results as unknown as MemberRecord[]).map(formatMember)

  return c.json({
    data,
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + data.length < total,
    },
  })
})

/**
 * GET /v1/teams/:teamId/members/:memberId
 * Get single member with project access info
 *
 * @agent per-project-invitations
 * @created 2026-01-27
 */
teamsRouter.get('/:teamId/members/:memberId', async (c) => {
  const userId = c.req.header('X-User-Id')
  const teamId = c.req.param('teamId')
  const memberId = c.req.param('memberId')

  if (!userId) {
    return c.json({ error: 'unauthorized', message: 'Authentication required' }, 401)
  }

  // Verify requester membership
  const membership = await c.env.DB.prepare(`
    SELECT role FROM organization_members
    WHERE organization_id = ? AND user_id = ?
  `).bind(teamId, userId).first()

  if (!membership) {
    return c.json({ error: 'not_found', message: 'Team not found' }, 404)
  }

  // Get target member
  const member = await c.env.DB.prepare(`
    SELECT om.id, om.user_id, om.role, om.created_at
    FROM organization_members om
    WHERE om.id = ? AND om.organization_id = ?
  `).bind(memberId, teamId).first<MemberRecord>()

  if (!member) {
    return c.json({ error: 'not_found', message: 'Member not found' }, 404)
  }

  // Get project access (empty array = full org access)
  const projectAccess = await c.env.DB.prepare(`
    SELECT mpa.app_id, mpa.granted_by, mpa.granted_at, a.name as app_name
    FROM member_project_access mpa
    JOIN apps a ON a.id = mpa.app_id
    WHERE mpa.organization_id = ? AND mpa.user_id = ?
  `).bind(teamId, member.user_id).all<{
    app_id: string
    granted_by: string
    granted_at: number
    app_name: string
  }>()

  const hasProjectScopedAccess = projectAccess.results.length > 0

  return c.json({
    member: {
      ...formatMember(member),
      scope: hasProjectScopedAccess ? 'projects' : 'full',
      projectAccess: projectAccess.results.map((pa) => ({
        appId: pa.app_id,
        appName: pa.app_name,
        grantedBy: pa.granted_by,
        grantedAt: pa.granted_at,
      })),
    },
  })
})

/**
 * PATCH /v1/teams/:teamId/members/:memberId
 * Update member role (admin+ only)
 *
 * Permission rules:
 * - Owner can change any member's role to admin or member
 * - Admins can only demote members (cannot promote to admin)
 * - Members CANNOT change anyone's role
 * - Nobody can change the owner's role
 *
 * @agent owner-only-deletion
 * @modified 2026-01-27
 */
teamsRouter.patch(
  '/:teamId/members/:memberId',
  zValidator('json', updateMemberRoleSchema),
  async (c) => {
    const userId = c.req.header('X-User-Id')
    const teamId = c.req.param('teamId')
    const memberId = c.req.param('memberId')
    const body = c.req.valid('json')

    if (!userId) {
      return c.json({ error: 'unauthorized', message: 'Authentication required' }, 401)
    }

    // Get actor's membership
    const actorMembership = await c.env.DB.prepare(`
      SELECT role FROM organization_members
      WHERE organization_id = ? AND user_id = ?
    `).bind(teamId, userId).first<{ role: string }>()

    if (!actorMembership) {
      return c.json({ error: 'not_found', message: 'Team not found' }, 404)
    }

    // Members cannot change anyone's role
    if (actorMembership.role === 'member') {
      return c.json({
        error: 'ADMIN_REQUIRED',
        code: 'ADMIN_REQUIRED',
        message: 'Only admins and owners can change member roles',
      }, 403)
    }

    if (actorMembership.role !== 'owner' && actorMembership.role !== 'admin') {
      return c.json({ error: 'forbidden', message: 'Requires admin or owner role' }, 403)
    }

    // Get target member
    const member = await c.env.DB.prepare(`
      SELECT * FROM organization_members WHERE id = ? AND organization_id = ?
    `).bind(memberId, teamId).first<{ role: string; user_id: string }>()

    if (!member) {
      return c.json({ error: 'not_found', message: 'Member not found' }, 404)
    }

    // Can't change owner role
    if (member.role === 'owner') {
      return c.json({
        error: 'CANNOT_CHANGE_OWNER',
        code: 'CANNOT_CHANGE_OWNER',
        message: 'Cannot change the organization owner role',
      }, 403)
    }

    // Admins can't promote to admin (only owners can)
    if (actorMembership.role === 'admin' && body.role === 'admin') {
      return c.json({
        error: 'OWNER_REQUIRED',
        code: 'OWNER_REQUIRED',
        message: 'Only the organization owner can promote members to admin',
      }, 403)
    }

    await c.env.DB.prepare(
      'UPDATE organization_members SET role = ? WHERE id = ?'
    ).bind(body.role, memberId).run()

    await logAuditEvent(c.env.DB, teamId, userId, 'team.role_changed', {
      memberId,
      oldRole: member.role,
      newRole: body.role,
    })

    return c.json({ success: true })
  }
)

/**
 * DELETE /v1/teams/:teamId/members/:memberId
 * Remove member (admin+ only)
 *
 * Permission rules:
 * - Owner can remove admins and members
 * - Admins can only remove members (not other admins)
 * - Members CANNOT remove anyone
 *
 * @agent owner-only-deletion
 * @modified 2026-01-27
 */
teamsRouter.delete('/:teamId/members/:memberId', async (c) => {
  const userId = c.req.header('X-User-Id')
  const teamId = c.req.param('teamId')
  const memberId = c.req.param('memberId')

  if (!userId) {
    return c.json({ error: 'unauthorized', message: 'Authentication required' }, 401)
  }

  // Get actor's membership
  const actorMembership = await c.env.DB.prepare(`
    SELECT role FROM organization_members
    WHERE organization_id = ? AND user_id = ?
  `).bind(teamId, userId).first<{ role: string }>()

  if (!actorMembership) {
    return c.json({ error: 'not_found', message: 'Team not found' }, 404)
  }

  // Members cannot remove anyone
  if (actorMembership.role === 'member') {
    return c.json({
      error: 'ADMIN_REQUIRED',
      code: 'ADMIN_REQUIRED',
      message: 'Only admins and owners can remove members',
    }, 403)
  }

  if (actorMembership.role !== 'owner' && actorMembership.role !== 'admin') {
    return c.json({ error: 'forbidden', message: 'Requires admin or owner role' }, 403)
  }

  // Get target member
  const member = await c.env.DB.prepare(`
    SELECT * FROM organization_members WHERE id = ? AND organization_id = ?
  `).bind(memberId, teamId).first<{ role: string; user_id: string }>()

  if (!member) {
    return c.json({ error: 'not_found', message: 'Member not found' }, 404)
  }

  // Can't remove owner
  if (member.role === 'owner') {
    return c.json({
      error: 'CANNOT_REMOVE_OWNER',
      code: 'CANNOT_REMOVE_OWNER',
      message: 'Cannot remove the organization owner',
    }, 403)
  }

  // Admins can't remove other admins - only owner can
  if (actorMembership.role === 'admin' && member.role === 'admin') {
    return c.json({
      error: 'OWNER_REQUIRED',
      code: 'OWNER_REQUIRED',
      message: 'Only the organization owner can remove admins',
    }, 403)
  }

  // Delete member and their project access entries
  await c.env.DB.batch([
    c.env.DB.prepare('DELETE FROM member_project_access WHERE organization_id = ? AND user_id = ?').bind(teamId, member.user_id),
    c.env.DB.prepare('DELETE FROM organization_members WHERE id = ?').bind(memberId),
  ])

  await logAuditEvent(c.env.DB, teamId, userId, 'team.member_removed', {
    memberId,
    memberUserId: member.user_id,
    memberRole: member.role,
  })

  return c.json({ success: true })
})

// =============================================================================
// Mount Sub-Routers
// =============================================================================

teamsRouter.route('/', invitationsRouter)
teamsRouter.route('/', auditRouter)

// =============================================================================
// Helpers
// =============================================================================

interface TeamRecord {
  id: string
  name: string
  slug: string
  owner_id: string
  role?: string
  member_count?: number
  created_at: number
  updated_at: number
}

interface MemberRecord {
  id: string
  user_id: string
  role: string
  created_at: number
}

function formatTeam(team: TeamRecord | null): {
  id: string
  name: string
  slug: string
  ownerId: string
  role?: string
  memberCount?: number
  createdAt: number
  updatedAt: number
} | null {
  if (!team) return null

  return {
    id: team.id,
    name: team.name,
    slug: team.slug,
    ownerId: team.owner_id,
    role: team.role,
    memberCount: team.member_count,
    createdAt: team.created_at,
    updatedAt: team.updated_at,
  }
}

function formatMember(member: MemberRecord): {
  id: string
  userId: string
  role: string
  createdAt: number
} {
  return {
    id: member.id,
    userId: member.user_id,
    role: member.role,
    createdAt: member.created_at,
  }
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50)
}

async function logAuditEvent(
  db: D1Database,
  organizationId: string,
  userId: string,
  event: string,
  metadata: Record<string, unknown>
): Promise<void> {
  await db.prepare(`
    INSERT INTO team_audit_log (id, organization_id, user_id, event, metadata, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(
    crypto.randomUUID(),
    organizationId,
    userId,
    event,
    JSON.stringify(metadata),
    Math.floor(Date.now() / 1000)
  ).run()
}
