# Feature: api/teams-rbac

Implement role-based access control for teams and projects.

## Knowledge Docs to Read First

- `.claude/knowledge/IMPLEMENTATION_DETAILS.md` → RBAC permissions table
- `.claude/knowledge/API_FEATURES.md` → Authorization patterns

## Dependencies

- `api/teams-crud` (must complete first)
- `api/apps-crud` (must complete first)

## What to Implement

### 1. Permission Definitions

```typescript
// packages/api/src/lib/permissions.ts
export const ORG_PERMISSIONS = {
  owner: {
    // Full control
    canManageOrg: true,
    canDeleteOrg: true,
    canManageMembers: true,
    canManageAdmins: true,
    canManageBilling: true,
    canManageProjects: true,
    canViewAuditLog: true,
  },
  admin: {
    canManageOrg: false,
    canDeleteOrg: false,
    canManageMembers: true,
    canManageAdmins: false,
    canManageBilling: false,
    canManageProjects: true,
    canViewAuditLog: true,
  },
  member: {
    canManageOrg: false,
    canDeleteOrg: false,
    canManageMembers: false,
    canManageAdmins: false,
    canManageBilling: false,
    canManageProjects: false,
    canViewAuditLog: false,
  },
} as const

export const PROJECT_PERMISSIONS = {
  admin: {
    canManageProject: true,
    canManageReleases: true,
    canManageCredentials: true,
    canViewAnalytics: true,
    canTriggerBuilds: true,
  },
  developer: {
    canManageProject: false,
    canManageReleases: true,
    canManageCredentials: false,
    canViewAnalytics: true,
    canTriggerBuilds: true,
  },
  viewer: {
    canManageProject: false,
    canManageReleases: false,
    canManageCredentials: false,
    canViewAnalytics: true,
    canTriggerBuilds: false,
  },
} as const

export type OrgRole = keyof typeof ORG_PERMISSIONS
export type ProjectRole = keyof typeof PROJECT_PERMISSIONS
```

### 2. Permission Checking Middleware

```typescript
// packages/api/src/middleware/permissions.ts
import { Context, Next } from 'hono'
import { ORG_PERMISSIONS, PROJECT_PERMISSIONS } from '../lib/permissions'

type OrgPermission = keyof typeof ORG_PERMISSIONS.owner
type ProjectPermission = keyof typeof PROJECT_PERMISSIONS.admin

export function requireOrgPermission(permission: OrgPermission) {
  return async (c: Context, next: Next) => {
    const user = c.get('user')
    const teamId = c.req.param('teamId')

    const membership = await c.env.DB.prepare(`
      SELECT role FROM organization_members
      WHERE organization_id = ? AND user_id = ?
    `).bind(teamId, user.id).first()

    if (!membership) {
      return c.json({ error: 'FORBIDDEN', message: 'Not a team member' }, 403)
    }

    const permissions = ORG_PERMISSIONS[membership.role as keyof typeof ORG_PERMISSIONS]

    if (!permissions[permission]) {
      return c.json(
        { error: 'FORBIDDEN', message: `Permission denied: ${permission}` },
        403
      )
    }

    c.set('teamMembership', { role: membership.role })
    await next()
  }
}

export function requireProjectPermission(permission: ProjectPermission) {
  return async (c: Context, next: Next) => {
    const user = c.get('user')
    const appId = c.req.param('appId')

    // Get app with team info
    const app = await c.env.DB.prepare(`
      SELECT a.*, a.organization_id as team_id
      FROM apps a
      WHERE a.id = ?
    `).bind(appId).first()

    if (!app) {
      return c.json({ error: 'NOT_FOUND' }, 404)
    }

    // Check if personal app (no team)
    if (!app.team_id) {
      // Only owner can access
      if (app.user_id !== user.id) {
        return c.json({ error: 'FORBIDDEN' }, 403)
      }
      // Owner has all permissions
      c.set('projectRole', 'admin')
      await next()
      return
    }

    // Check project-level role first
    const projectMember = await c.env.DB.prepare(`
      SELECT role FROM project_members
      WHERE app_id = ? AND user_id = ?
    `).bind(appId, user.id).first()

    if (projectMember) {
      const permissions = PROJECT_PERMISSIONS[projectMember.role as keyof typeof PROJECT_PERMISSIONS]
      if (permissions[permission]) {
        c.set('projectRole', projectMember.role)
        await next()
        return
      }
    }

    // Fall back to org-level role
    const orgMember = await c.env.DB.prepare(`
      SELECT role FROM organization_members
      WHERE organization_id = ? AND user_id = ?
    `).bind(app.team_id, user.id).first()

    if (!orgMember) {
      return c.json({ error: 'FORBIDDEN', message: 'Not a team member' }, 403)
    }

    // Org owners/admins get admin project access
    if (orgMember.role === 'owner' || orgMember.role === 'admin') {
      c.set('projectRole', 'admin')
      await next()
      return
    }

    // Org members get viewer access by default
    const viewerPerms = PROJECT_PERMISSIONS.viewer
    if (viewerPerms[permission]) {
      c.set('projectRole', 'viewer')
      await next()
      return
    }

    return c.json(
      { error: 'FORBIDDEN', message: `Permission denied: ${permission}` },
      403
    )
  }
}
```

### 3. Project Members Management

```typescript
// packages/api/src/routes/apps/members.ts
import { Hono } from 'hono'
import { authMiddleware } from '../../middleware/auth'
import { requireProjectPermission } from '../../middleware/permissions'

const projectMembers = new Hono()

projectMembers.use('*', authMiddleware)

// List project members
projectMembers.get('/:appId/members', requireProjectPermission('canViewAnalytics'), async (c) => {
  const appId = c.req.param('appId')

  const results = await c.env.DB.prepare(`
    SELECT
      pm.id,
      pm.role,
      pm.created_at,
      u.id as user_id,
      u.email,
      u.name
    FROM project_members pm
    JOIN users u ON u.id = pm.user_id
    WHERE pm.app_id = ?
    ORDER BY pm.created_at ASC
  `).bind(appId).all()

  return c.json({ members: results.results })
})

// Add project member
projectMembers.post('/:appId/members', requireProjectPermission('canManageProject'), async (c) => {
  const appId = c.req.param('appId')
  const user = c.get('user')
  const { email, role } = await c.req.json()

  if (!['admin', 'developer', 'viewer'].includes(role)) {
    return c.json({ error: 'INVALID_INPUT', message: 'Invalid role' }, 400)
  }

  // Find user by email
  const targetUser = await c.env.DB.prepare(
    'SELECT id FROM users WHERE email = ?'
  ).bind(email).first()

  if (!targetUser) {
    return c.json({ error: 'NOT_FOUND', message: 'User not found' }, 404)
  }

  // Check if already a member
  const existing = await c.env.DB.prepare(
    'SELECT id FROM project_members WHERE app_id = ? AND user_id = ?'
  ).bind(appId, targetUser.id).first()

  if (existing) {
    return c.json({ error: 'ALREADY_EXISTS', message: 'Already a project member' }, 409)
  }

  await c.env.DB.prepare(`
    INSERT INTO project_members (id, app_id, user_id, role, created_at)
    VALUES (?, ?, ?, ?, datetime('now'))
  `).bind(crypto.randomUUID(), appId, targetUser.id, role).run()

  return c.json({ success: true }, 201)
})

// Update project member role
projectMembers.patch('/:appId/members/:memberId', requireProjectPermission('canManageProject'), async (c) => {
  const appId = c.req.param('appId')
  const memberId = c.req.param('memberId')
  const { role } = await c.req.json()

  if (!['admin', 'developer', 'viewer'].includes(role)) {
    return c.json({ error: 'INVALID_INPUT', message: 'Invalid role' }, 400)
  }

  await c.env.DB.prepare(
    'UPDATE project_members SET role = ? WHERE id = ? AND app_id = ?'
  ).bind(role, memberId, appId).run()

  return c.json({ success: true })
})

// Remove project member
projectMembers.delete('/:appId/members/:memberId', requireProjectPermission('canManageProject'), async (c) => {
  const appId = c.req.param('appId')
  const memberId = c.req.param('memberId')

  await c.env.DB.prepare(
    'DELETE FROM project_members WHERE id = ? AND app_id = ?'
  ).bind(memberId, appId).run()

  return c.json({ success: true })
})

export default projectMembers
```

## Files to Create

1. `packages/api/src/lib/permissions.ts`
2. `packages/api/src/middleware/permissions.ts`
3. `packages/api/src/routes/apps/members.ts`

## Tests Required

```typescript
describe('RBAC', () => {
  describe('Org permissions', () => {
    it('owner can manage billing', async () => {
      const response = await ownerRequest('GET', `/teams/${teamId}/billing`)
      expect(response.status).toBe(200)
    })

    it('admin cannot manage billing', async () => {
      const response = await adminRequest('GET', `/teams/${teamId}/billing`)
      expect(response.status).toBe(403)
    })
  })

  describe('Project permissions', () => {
    it('developer can create release', async () => {
      const response = await developerRequest('POST', `/apps/${appId}/releases`, { version: '1.0.0' })
      expect(response.status).toBe(201)
    })

    it('viewer cannot create release', async () => {
      const response = await viewerRequest('POST', `/apps/${appId}/releases`, { version: '1.0.0' })
      expect(response.status).toBe(403)
    })
  })
})
```

## Acceptance Criteria

- [ ] Permission definitions match spec
- [ ] Org-level permissions enforced
- [ ] Project-level permissions enforced
- [ ] Fallback from project to org roles
- [ ] Personal apps only accessible by owner
- [ ] Project members CRUD works
- [ ] Tests pass
