/**
 * Team permission middleware
 *
 * Checks user's role within a team/organization
 */

import { createMiddleware } from 'hono/factory'
import { ERROR_CODES } from '@bundlenudge/shared'
import type { Env } from '../types/env'
import type { AuthUser } from './auth'

type TeamRole = 'owner' | 'admin' | 'member'

interface TeamMembership {
  orgId: string
  userId: string
  role: TeamRole
}

interface TeamPermissionVariables {
  user: AuthUser
  teamMembership: TeamMembership
}

const ROLE_HIERARCHY: Record<TeamRole, number> = {
  member: 1,
  admin: 2,
  owner: 3,
}

/**
 * Create middleware that requires a minimum team role
 * Must be used after authMiddleware
 * Expects :teamId param in the route
 */
export function requireTeamRole(minRole: TeamRole): ReturnType<typeof createMiddleware> {
  return createMiddleware<{
    Bindings: Env
    Variables: TeamPermissionVariables
  }>(async (c, next) => {
    const user = c.get('user') as AuthUser | undefined
    const teamId = c.req.param('teamId')

    if (!user) {
      return c.json(
        { error: ERROR_CODES.UNAUTHORIZED, message: 'Authentication required' },
        401
      )
    }

    if (!teamId) {
      return c.json(
        { error: ERROR_CODES.INVALID_INPUT, message: 'Team ID required' },
        400
      )
    }

    const membership = await c.env.DB.prepare(
      'SELECT org_id, user_id, role FROM organization_members WHERE org_id = ? AND user_id = ?'
    ).bind(teamId, user.id).first<{ org_id: string; user_id: string; role: TeamRole }>()

    if (!membership) {
      return c.json(
        { error: ERROR_CODES.FORBIDDEN, message: 'Not a member of this team' },
        403
      )
    }

    const userRoleLevel = ROLE_HIERARCHY[membership.role]
    const requiredRoleLevel = ROLE_HIERARCHY[minRole]

    if (userRoleLevel < requiredRoleLevel) {
      return c.json(
        { error: ERROR_CODES.FORBIDDEN, message: `Requires ${minRole} role or higher` },
        403
      )
    }

    c.set('teamMembership', {
      orgId: membership.org_id,
      userId: membership.user_id,
      role: membership.role,
    })

    return next()
  })
}

/**
 * Check if a user has at least the specified role level
 */
export function hasMinRole(userRole: TeamRole, minRole: TeamRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[minRole]
}
