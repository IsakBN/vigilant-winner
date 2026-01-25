# Feature: api/teams-audit

Implement audit logging for team actions.

## Knowledge Docs to Read First

- `.claude/knowledge/IMPLEMENTATION_DETAILS.md` → Audit log table
- `.claude/knowledge/API_FEATURES.md` → Audit events

## Dependencies

- `api/teams-crud` (must complete first)
- `api/teams-rbac` (must complete first)

## What to Implement

### 1. Audit Logger

```typescript
// packages/api/src/lib/audit.ts
import { AUDIT_EVENTS } from '@bundlenudge/shared'

interface AuditLogEntry {
  organizationId: string
  userId: string
  event: string
  metadata?: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
}

export async function logAuditEvent(db: D1Database, entry: AuditLogEntry) {
  await db.prepare(`
    INSERT INTO team_audit_log (
      id, organization_id, user_id, event, metadata, ip_address, user_agent, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `).bind(
    crypto.randomUUID(),
    entry.organizationId,
    entry.userId,
    entry.event,
    JSON.stringify(entry.metadata || {}),
    entry.ipAddress || null,
    entry.userAgent || null
  ).run()
}

// Middleware to automatically capture IP and User-Agent
export function createAuditLogger(c: Context) {
  const ipAddress = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For')
  const userAgent = c.req.header('User-Agent')

  return async (
    organizationId: string,
    userId: string,
    event: string,
    metadata?: Record<string, unknown>
  ) => {
    await logAuditEvent(c.env.DB, {
      organizationId,
      userId,
      event,
      metadata,
      ipAddress,
      userAgent,
    })
  }
}
```

### 2. Audit Log Routes

```typescript
// packages/api/src/routes/teams/audit.ts
import { Hono } from 'hono'
import { authMiddleware } from '../../middleware/auth'
import { requireOrgPermission } from '../../middleware/permissions'

const audit = new Hono()

audit.use('*', authMiddleware)

// Get audit log
audit.get('/:teamId/audit-log', requireOrgPermission('canViewAuditLog'), async (c) => {
  const teamId = c.req.param('teamId')
  const limit = parseInt(c.req.query('limit') || '50')
  const offset = parseInt(c.req.query('offset') || '0')
  const event = c.req.query('event')

  let query = `
    SELECT
      al.*,
      u.name as user_name,
      u.email as user_email
    FROM team_audit_log al
    JOIN users u ON u.id = al.user_id
    WHERE al.organization_id = ?
  `

  const params: unknown[] = [teamId]

  if (event) {
    query += ' AND al.event = ?'
    params.push(event)
  }

  query += ' ORDER BY al.created_at DESC LIMIT ? OFFSET ?'
  params.push(limit, offset)

  const results = await c.env.DB.prepare(query).bind(...params).all()

  // Get total count
  const countQuery = `
    SELECT COUNT(*) as total FROM team_audit_log WHERE organization_id = ?
    ${event ? ' AND event = ?' : ''}
  `
  const countParams = event ? [teamId, event] : [teamId]
  const count = await c.env.DB.prepare(countQuery).bind(...countParams).first()

  return c.json({
    entries: results.results.map(entry => ({
      ...entry,
      metadata: JSON.parse(entry.metadata as string || '{}'),
    })),
    total: count?.total || 0,
    limit,
    offset,
  })
})

// Get single audit entry
audit.get('/:teamId/audit-log/:entryId', requireOrgPermission('canViewAuditLog'), async (c) => {
  const teamId = c.req.param('teamId')
  const entryId = c.req.param('entryId')

  const entry = await c.env.DB.prepare(`
    SELECT
      al.*,
      u.name as user_name,
      u.email as user_email
    FROM team_audit_log al
    JOIN users u ON u.id = al.user_id
    WHERE al.id = ? AND al.organization_id = ?
  `).bind(entryId, teamId).first()

  if (!entry) {
    return c.json({ error: 'NOT_FOUND' }, 404)
  }

  return c.json({
    entry: {
      ...entry,
      metadata: JSON.parse(entry.metadata as string || '{}'),
    },
  })
})

// Export audit log (CSV)
audit.get('/:teamId/audit-log/export', requireOrgPermission('canViewAuditLog'), async (c) => {
  const teamId = c.req.param('teamId')
  const startDate = c.req.query('start')
  const endDate = c.req.query('end')

  let query = `
    SELECT
      al.created_at,
      al.event,
      u.email as user_email,
      al.ip_address,
      al.metadata
    FROM team_audit_log al
    JOIN users u ON u.id = al.user_id
    WHERE al.organization_id = ?
  `

  const params: unknown[] = [teamId]

  if (startDate) {
    query += ' AND al.created_at >= ?'
    params.push(startDate)
  }
  if (endDate) {
    query += ' AND al.created_at <= ?'
    params.push(endDate)
  }

  query += ' ORDER BY al.created_at DESC LIMIT 10000'

  const results = await c.env.DB.prepare(query).bind(...params).all()

  // Build CSV
  const headers = ['Timestamp', 'Event', 'User', 'IP Address', 'Details']
  const rows = results.results.map(entry => [
    entry.created_at,
    entry.event,
    entry.user_email,
    entry.ip_address || '',
    JSON.stringify(JSON.parse(entry.metadata as string || '{}')),
  ])

  const csv = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
  ].join('\n')

  c.header('Content-Type', 'text/csv')
  c.header('Content-Disposition', `attachment; filename="audit-log-${teamId}.csv"`)

  return c.body(csv)
})

export default audit
```

### 3. Audit Event Types

```typescript
// packages/shared/src/constants/events.ts (add to existing)
export const AUDIT_EVENTS = {
  // Team events
  TEAM_CREATED: 'team.created',
  TEAM_UPDATED: 'team.updated',
  TEAM_DELETED: 'team.deleted',

  // Member events
  MEMBER_INVITED: 'team.member_invited',
  MEMBER_JOINED: 'team.member_joined',
  MEMBER_REMOVED: 'team.member_removed',
  ROLE_CHANGED: 'team.role_changed',

  // Project events
  PROJECT_CREATED: 'project.created',
  PROJECT_MEMBER_ADDED: 'project.member_added',
  PROJECT_MEMBER_REMOVED: 'project.member_removed',

  // Release events
  RELEASE_CREATED: 'release.created',
  RELEASE_UPDATED: 'release.updated',
  RELEASE_DISABLED: 'release.disabled',

  // Billing events
  SUBSCRIPTION_CREATED: 'subscription.created',
  SUBSCRIPTION_UPDATED: 'subscription.updated',
  SUBSCRIPTION_CANCELLED: 'subscription.cancelled',
} as const

export type AuditEvent = typeof AUDIT_EVENTS[keyof typeof AUDIT_EVENTS]
```

## Files to Create

1. `packages/api/src/lib/audit.ts`
2. `packages/api/src/routes/teams/audit.ts`
3. Update `packages/shared/src/constants/events.ts`

## Tests Required

```typescript
describe('Audit Log', () => {
  it('logs team creation', async () => {
    await authedRequest('POST', '/teams', { name: 'Test Team' })

    const response = await authedRequest('GET', `/teams/${teamId}/audit-log`)
    expect(response.body.entries).toContainEqual(
      expect.objectContaining({ event: 'team.created' })
    )
  })

  it('includes user info in entries', async () => {
    const response = await authedRequest('GET', `/teams/${teamId}/audit-log`)
    expect(response.body.entries[0]).toHaveProperty('user_email')
  })

  it('exports to CSV', async () => {
    const response = await authedRequest('GET', `/teams/${teamId}/audit-log/export`)
    expect(response.headers.get('Content-Type')).toBe('text/csv')
  })

  it('members cannot view audit log', async () => {
    const response = await memberRequest('GET', `/teams/${teamId}/audit-log`)
    expect(response.status).toBe(403)
  })
})
```

## Acceptance Criteria

- [ ] Audit events logged for all team actions
- [ ] IP address and user agent captured
- [ ] Audit log paginated
- [ ] Filter by event type
- [ ] Export to CSV
- [ ] Only owner/admin can view
- [ ] Tests pass
