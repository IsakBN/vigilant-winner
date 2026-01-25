/**
 * Permission middleware for RBAC
 *
 * Provides middleware for checking organization and project permissions.
 */

import type { MiddlewareHandler } from 'hono'
import { createMiddleware } from 'hono/factory'
import { ERROR_CODES } from '@bundlenudge/shared'
import type { Env } from '../types/env'
import type { AuthUser } from './auth'
import {
  ORG_PERMISSIONS,
  PROJECT_PERMISSIONS,
  type OrgRole,
  type OrgPermission,
  type ProjectRole,
  type ProjectPermission,
  getDefaultProjectRole,
} from '../lib/permissions'

// =============================================================================
// Types
// =============================================================================

interface OrgPermissionVariables {
  user: AuthUser
  teamMembership: {
    orgId: string
    userId: string
    role: OrgRole
  }
}

interface ProjectPermissionVariables {
  user: AuthUser
  projectRole: ProjectRole
  appOwnerId?: string
  appTeamId?: string
}

// =============================================================================
// Organization Permission Middleware
// =============================================================================

/**
 * Middleware that requires a specific organization permission
 * Must be used after authMiddleware
 * Expects :teamId param in the route
 */
export function requireOrgPermission(
  permission: OrgPermission
): MiddlewareHandler<{ Bindings: Env; Variables: OrgPermissionVariables }> {
  return createMiddleware<{
    Bindings: Env
    Variables: OrgPermissionVariables
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
      'SELECT organization_id, user_id, role FROM organization_members WHERE organization_id = ? AND user_id = ?'
    ).bind(teamId, user.id).first<{ organization_id: string; user_id: string; role: OrgRole }>()

    if (!membership) {
      return c.json(
        { error: ERROR_CODES.FORBIDDEN, message: 'Not a member of this team' },
        403
      )
    }

    const permissions = ORG_PERMISSIONS[membership.role]
    if (!permissions[permission]) {
      return c.json(
        { error: ERROR_CODES.FORBIDDEN, message: `Permission denied: ${permission}` },
        403
      )
    }

    c.set('teamMembership', {
      orgId: membership.organization_id,
      userId: membership.user_id,
      role: membership.role,
    })

    return next()
  })
}

// =============================================================================
// Project Permission Middleware
// =============================================================================

/**
 * Middleware that requires a specific project permission
 * Must be used after authMiddleware
 * Expects :appId param in the route
 *
 * Permission resolution order:
 * 1. If personal app (no team), only owner has access (all permissions)
 * 2. Check project-level role in project_members table
 * 3. Fall back to organization-level role with default project permissions
 */
export function requireProjectPermission(
  permission: ProjectPermission
): MiddlewareHandler<{ Bindings: Env; Variables: ProjectPermissionVariables }> {
  return createMiddleware<{
    Bindings: Env
    Variables: ProjectPermissionVariables
  }>(async (c, next) => {
    const user = c.get('user') as AuthUser | undefined
    const appId = c.req.param('appId')

    if (!user) {
      return c.json(
        { error: ERROR_CODES.UNAUTHORIZED, message: 'Authentication required' },
        401
      )
    }

    if (!appId) {
      return c.json(
        { error: ERROR_CODES.INVALID_INPUT, message: 'App ID required' },
        400
      )
    }

    // Get app with team info
    const app = await c.env.DB.prepare(`
      SELECT id, owner_id, organization_id
      FROM apps
      WHERE id = ? AND deleted_at IS NULL
    `).bind(appId).first<{ id: string; owner_id: string; organization_id: string | null }>()

    if (!app) {
      return c.json({ error: ERROR_CODES.NOT_FOUND, message: 'App not found' }, 404)
    }

    c.set('appOwnerId', app.owner_id)
    c.set('appTeamId', app.organization_id ?? undefined)

    // Case 1: Personal app (no team)
    if (!app.organization_id) {
      if (app.owner_id !== user.id) {
        return c.json({ error: ERROR_CODES.FORBIDDEN, message: 'Access denied' }, 403)
      }
      // Owner has all permissions
      c.set('projectRole', 'admin')
      return next()
    }

    // Case 2: Check project-level role
    const projectMember = await c.env.DB.prepare(`
      SELECT role FROM project_members
      WHERE app_id = ? AND user_id = ?
    `).bind(appId, user.id).first<{ role: ProjectRole }>()

    if (projectMember) {
      const projectPerms = PROJECT_PERMISSIONS[projectMember.role]
      if (projectPerms[permission]) {
        c.set('projectRole', projectMember.role)
        return next()
      }
      // Has project role but not the required permission
      return c.json(
        { error: ERROR_CODES.FORBIDDEN, message: `Permission denied: ${permission}` },
        403
      )
    }

    // Case 3: Fall back to organization-level role
    const orgMember = await c.env.DB.prepare(`
      SELECT role FROM organization_members
      WHERE organization_id = ? AND user_id = ?
    `).bind(app.organization_id, user.id).first<{ role: OrgRole }>()

    if (!orgMember) {
      return c.json(
        { error: ERROR_CODES.FORBIDDEN, message: 'Not a member of this team' },
        403
      )
    }

    // Get default project role based on org role
    const defaultProjectRole = getDefaultProjectRole(orgMember.role)
    const projectPerms = PROJECT_PERMISSIONS[defaultProjectRole]

    if (!projectPerms[permission]) {
      return c.json(
        { error: ERROR_CODES.FORBIDDEN, message: `Permission denied: ${permission}` },
        403
      )
    }

    c.set('projectRole', defaultProjectRole)
    return next()
  })
}
