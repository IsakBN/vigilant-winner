# Feature: api/teams-crud

Implement team (organization) CRUD operations.

## Knowledge Docs to Read First

- `.claude/knowledge/IMPLEMENTATION_DETAILS.md` → Teams/organizations schema
- `.claude/knowledge/API_FEATURES.md` → Teams endpoints

## Dependencies

- `api/auth-middleware` (must complete first)
- `api/database-schema` (must complete first)

## What to Implement

### 1. Teams Router

```typescript
// packages/api/src/routes/teams/index.ts
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { authMiddleware } from '../../middleware/auth'
import { createTeamSchema } from '@bundlenudge/shared'

const teams = new Hono()

teams.use('*', authMiddleware)

// List user's teams
teams.get('/', async (c) => {
  const user = c.get('user')

  const results = await c.env.DB.prepare(`
    SELECT
      o.*,
      om.role,
      (SELECT COUNT(*) FROM organization_members WHERE organization_id = o.id) as member_count
    FROM organizations o
    JOIN organization_members om ON om.organization_id = o.id
    WHERE om.user_id = ?
    ORDER BY o.created_at DESC
  `).bind(user.id).all()

  return c.json({ teams: results.results })
})

// Get single team
teams.get('/:teamId', async (c) => {
  const user = c.get('user')
  const teamId = c.req.param('teamId')

  const team = await c.env.DB.prepare(`
    SELECT
      o.*,
      om.role
    FROM organizations o
    JOIN organization_members om ON om.organization_id = o.id
    WHERE o.id = ? AND om.user_id = ?
  `).bind(teamId, user.id).first()

  if (!team) {
    return c.json({ error: 'NOT_FOUND', message: 'Team not found' }, 404)
  }

  return c.json({ team })
})

// Create team
teams.post('/', zValidator('json', createTeamSchema), async (c) => {
  const user = c.get('user')
  const data = c.req.valid('json')

  // Check plan allows teams
  const subscription = await getUserSubscription(c.env.DB, user.id)
  const plan = subscription?.planId || 'free'

  if (plan === 'free') {
    return c.json(
      { error: 'PLAN_LIMIT_EXCEEDED', message: 'Teams require Pro plan or higher' },
      402
    )
  }

  const teamId = crypto.randomUUID()

  // Create organization
  await c.env.DB.prepare(`
    INSERT INTO organizations (id, name, owner_id, created_at, updated_at)
    VALUES (?, ?, ?, datetime('now'), datetime('now'))
  `).bind(teamId, data.name, user.id).run()

  // Add creator as owner
  await c.env.DB.prepare(`
    INSERT INTO organization_members (id, organization_id, user_id, role, created_at)
    VALUES (?, ?, ?, 'owner', datetime('now'))
  `).bind(crypto.randomUUID(), teamId, user.id).run()

  // Log audit event
  await logAuditEvent(c.env.DB, {
    organizationId: teamId,
    userId: user.id,
    event: 'team.created',
    metadata: { name: data.name },
  })

  const team = await c.env.DB.prepare(
    'SELECT * FROM organizations WHERE id = ?'
  ).bind(teamId).first()

  return c.json({ team }, 201)
})

// Update team
teams.patch('/:teamId', zValidator('json', createTeamSchema.partial()), async (c) => {
  const user = c.get('user')
  const teamId = c.req.param('teamId')
  const data = c.req.valid('json')

  // Check user is owner or admin
  const membership = await c.env.DB.prepare(`
    SELECT role FROM organization_members
    WHERE organization_id = ? AND user_id = ?
  `).bind(teamId, user.id).first()

  if (!membership || (membership.role !== 'owner' && membership.role !== 'admin')) {
    return c.json({ error: 'FORBIDDEN', message: 'Requires owner or admin role' }, 403)
  }

  if (data.name) {
    await c.env.DB.prepare(`
      UPDATE organizations SET name = ?, updated_at = datetime('now') WHERE id = ?
    `).bind(data.name, teamId).run()
  }

  const team = await c.env.DB.prepare(
    'SELECT * FROM organizations WHERE id = ?'
  ).bind(teamId).first()

  return c.json({ team })
})

// Delete team
teams.delete('/:teamId', async (c) => {
  const user = c.get('user')
  const teamId = c.req.param('teamId')

  // Only owner can delete
  const membership = await c.env.DB.prepare(`
    SELECT role FROM organization_members
    WHERE organization_id = ? AND user_id = ?
  `).bind(teamId, user.id).first()

  if (!membership || membership.role !== 'owner') {
    return c.json({ error: 'FORBIDDEN', message: 'Only owner can delete team' }, 403)
  }

  // Delete all related data
  await c.env.DB.batch([
    c.env.DB.prepare('DELETE FROM team_invitations WHERE organization_id = ?').bind(teamId),
    c.env.DB.prepare('DELETE FROM organization_members WHERE organization_id = ?').bind(teamId),
    c.env.DB.prepare('DELETE FROM team_audit_log WHERE organization_id = ?').bind(teamId),
    c.env.DB.prepare('DELETE FROM organizations WHERE id = ?').bind(teamId),
  ])

  return c.json({ success: true })
})

export default teams
```

### 2. Team Members

```typescript
// packages/api/src/routes/teams/members.ts
import { Hono } from 'hono'
import { authMiddleware } from '../../middleware/auth'
import { requireTeamRole } from '../../middleware/team-permission'

const members = new Hono()

members.use('*', authMiddleware)

// List team members
members.get('/:teamId/members', requireTeamRole('member'), async (c) => {
  const teamId = c.req.param('teamId')

  const results = await c.env.DB.prepare(`
    SELECT
      om.id,
      om.role,
      om.created_at,
      u.id as user_id,
      u.email,
      u.name
    FROM organization_members om
    JOIN users u ON u.id = om.user_id
    WHERE om.organization_id = ?
    ORDER BY om.created_at ASC
  `).bind(teamId).all()

  return c.json({ members: results.results })
})

// Update member role
members.patch('/:teamId/members/:memberId', requireTeamRole('admin'), async (c) => {
  const teamId = c.req.param('teamId')
  const memberId = c.req.param('memberId')
  const { role } = await c.req.json()

  if (!['admin', 'member'].includes(role)) {
    return c.json({ error: 'INVALID_INPUT', message: 'Invalid role' }, 400)
  }

  const member = await c.env.DB.prepare(
    'SELECT * FROM organization_members WHERE id = ? AND organization_id = ?'
  ).bind(memberId, teamId).first()

  if (!member) {
    return c.json({ error: 'NOT_FOUND' }, 404)
  }

  // Can't change owner role
  if (member.role === 'owner') {
    return c.json({ error: 'FORBIDDEN', message: 'Cannot change owner role' }, 403)
  }

  const user = c.get('user')
  const actorMembership = c.get('teamMembership')

  // Admins can't promote to admin
  if (actorMembership.role === 'admin' && role === 'admin') {
    return c.json({ error: 'FORBIDDEN', message: 'Only owners can promote to admin' }, 403)
  }

  await c.env.DB.prepare(
    'UPDATE organization_members SET role = ? WHERE id = ?'
  ).bind(role, memberId).run()

  await logAuditEvent(c.env.DB, {
    organizationId: teamId,
    userId: user.id,
    event: 'team.role_changed',
    metadata: { memberId, newRole: role, oldRole: member.role },
  })

  return c.json({ success: true })
})

// Remove member
members.delete('/:teamId/members/:memberId', requireTeamRole('admin'), async (c) => {
  const teamId = c.req.param('teamId')
  const memberId = c.req.param('memberId')
  const user = c.get('user')

  const member = await c.env.DB.prepare(
    'SELECT * FROM organization_members WHERE id = ? AND organization_id = ?'
  ).bind(memberId, teamId).first()

  if (!member) {
    return c.json({ error: 'NOT_FOUND' }, 404)
  }

  // Can't remove owner
  if (member.role === 'owner') {
    return c.json({ error: 'FORBIDDEN', message: 'Cannot remove owner' }, 403)
  }

  // Admins can't remove other admins
  const actorMembership = c.get('teamMembership')
  if (actorMembership.role === 'admin' && member.role === 'admin') {
    return c.json({ error: 'FORBIDDEN', message: 'Only owners can remove admins' }, 403)
  }

  await c.env.DB.prepare(
    'DELETE FROM organization_members WHERE id = ?'
  ).bind(memberId).run()

  await logAuditEvent(c.env.DB, {
    organizationId: teamId,
    userId: user.id,
    event: 'team.member_removed',
    metadata: { memberId, memberUserId: member.user_id },
  })

  return c.json({ success: true })
})

export default members
```

## Files to Create

1. `packages/api/src/routes/teams/index.ts`
2. `packages/api/src/routes/teams/members.ts`

## Tests Required

```typescript
describe('Teams', () => {
  it('creates a team (pro plan)', async () => {
    // Setup pro subscription
    const response = await authedRequest('POST', '/teams', { name: 'My Team' })
    expect(response.status).toBe(201)
  })

  it('rejects team creation on free plan', async () => {
    const response = await authedRequest('POST', '/teams', { name: 'My Team' })
    expect(response.status).toBe(402)
  })

  it('owner can update team', async () => {
    const response = await authedRequest('PATCH', `/teams/${teamId}`, { name: 'New Name' })
    expect(response.status).toBe(200)
  })

  it('member cannot delete team', async () => {
    // Login as member
    const response = await memberRequest('DELETE', `/teams/${teamId}`)
    expect(response.status).toBe(403)
  })
})
```

## Acceptance Criteria

- [ ] Create team requires Pro+ plan
- [ ] Creator becomes owner
- [ ] Owner can delete team
- [ ] Owner can update roles
- [ ] Admin can remove members (not admins)
- [ ] Audit logging for all actions
- [ ] Tests pass
