# Feature: api/admin-users

Implement admin user management endpoints.

## Knowledge Docs to Read First

- `.claude/knowledge/API_FEATURES.md` → Admin endpoints
- `.claude/knowledge/IMPLEMENTATION_DETAILS.md` → Admin auth

## Dependencies

- `api/admin-auth` (must complete first)
- `api/database-schema` (must complete first)

## What to Implement

### 1. Admin Users Routes

```typescript
// packages/api/src/routes/admin/users.ts
import { Hono } from 'hono'
import { adminMiddleware } from '../../middleware/admin'

const users = new Hono()

users.use('*', adminMiddleware)

// List all users with pagination
users.get('/', async (c) => {
  const limit = parseInt(c.req.query('limit') || '50')
  const offset = parseInt(c.req.query('offset') || '0')
  const search = c.req.query('search')
  const sortBy = c.req.query('sortBy') || 'created_at'
  const sortOrder = c.req.query('sortOrder') || 'desc'

  let query = `
    SELECT
      u.id,
      u.email,
      u.name,
      u.email_verified,
      u.created_at,
      (SELECT COUNT(*) FROM apps WHERE user_id = u.id) as app_count,
      s.plan_id,
      s.status as subscription_status
    FROM users u
    LEFT JOIN subscriptions s ON s.user_id = u.id
  `

  const params: unknown[] = []

  if (search) {
    query += ' WHERE u.email LIKE ? OR u.name LIKE ?'
    params.push(`%${search}%`, `%${search}%`)
  }

  const validSortColumns = ['created_at', 'email', 'name']
  const column = validSortColumns.includes(sortBy) ? sortBy : 'created_at'
  const order = sortOrder === 'asc' ? 'ASC' : 'DESC'

  query += ` ORDER BY u.${column} ${order} LIMIT ? OFFSET ?`
  params.push(limit, offset)

  const results = await c.env.DB.prepare(query).bind(...params).all()

  // Get total count
  const countQuery = search
    ? 'SELECT COUNT(*) as total FROM users WHERE email LIKE ? OR name LIKE ?'
    : 'SELECT COUNT(*) as total FROM users'
  const countParams = search ? [`%${search}%`, `%${search}%`] : []
  const count = await c.env.DB.prepare(countQuery).bind(...countParams).first()

  return c.json({
    users: results.results,
    total: count?.total || 0,
    limit,
    offset,
  })
})

// Get single user with full details
users.get('/:userId', async (c) => {
  const userId = c.req.param('userId')

  const user = await c.env.DB.prepare(`
    SELECT
      u.*,
      s.plan_id,
      s.status as subscription_status,
      s.current_period_end,
      s.stripe_customer_id
    FROM users u
    LEFT JOIN subscriptions s ON s.user_id = u.id
    WHERE u.id = ?
  `).bind(userId).first()

  if (!user) {
    return c.json({ error: 'NOT_FOUND' }, 404)
  }

  // Get user's apps
  const apps = await c.env.DB.prepare(`
    SELECT id, name, platform, created_at
    FROM apps WHERE user_id = ?
    ORDER BY created_at DESC
  `).bind(userId).all()

  // Get user's team memberships
  const teams = await c.env.DB.prepare(`
    SELECT o.id, o.name, om.role
    FROM organization_members om
    JOIN organizations o ON o.id = om.organization_id
    WHERE om.user_id = ?
  `).bind(userId).all()

  // Get user's accounts (OAuth providers)
  const accounts = await c.env.DB.prepare(`
    SELECT provider, created_at FROM accounts WHERE user_id = ?
  `).bind(userId).all()

  return c.json({
    user: {
      ...user,
      apps: apps.results,
      teams: teams.results,
      accounts: accounts.results,
    },
  })
})

// Update user (admin override)
users.patch('/:userId', async (c) => {
  const userId = c.req.param('userId')
  const data = await c.req.json()
  const admin = c.get('adminUser')

  const updates: string[] = []
  const values: unknown[] = []

  if (data.email !== undefined) {
    updates.push('email = ?')
    values.push(data.email)
  }
  if (data.name !== undefined) {
    updates.push('name = ?')
    values.push(data.name)
  }
  if (data.email_verified !== undefined) {
    updates.push('email_verified = ?')
    values.push(data.email_verified ? 1 : 0)
  }

  if (updates.length === 0) {
    return c.json({ error: 'No updates provided' }, 400)
  }

  updates.push('updated_at = datetime("now")')
  values.push(userId)

  await c.env.DB.prepare(
    `UPDATE users SET ${updates.join(', ')} WHERE id = ?`
  ).bind(...values).run()

  // Log admin action
  await logAdminAction(c.env, admin.email, 'user.updated', { userId, changes: data })

  const user = await c.env.DB.prepare(
    'SELECT * FROM users WHERE id = ?'
  ).bind(userId).first()

  return c.json({ user })
})

// Impersonate user (get session token)
users.post('/:userId/impersonate', async (c) => {
  const userId = c.req.param('userId')
  const admin = c.get('adminUser')

  const user = await c.env.DB.prepare(
    'SELECT * FROM users WHERE id = ?'
  ).bind(userId).first()

  if (!user) {
    return c.json({ error: 'NOT_FOUND' }, 404)
  }

  // Create temporary impersonation session
  const sessionId = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

  await c.env.DB.prepare(`
    INSERT INTO sessions (id, user_id, expires_at, ip_address, user_agent, created_at)
    VALUES (?, ?, ?, 'admin-impersonation', 'Admin Dashboard', datetime('now'))
  `).bind(sessionId, userId, expiresAt.toISOString()).run()

  // Log admin action
  await logAdminAction(c.env, admin.email, 'user.impersonated', { userId, userEmail: user.email })

  return c.json({
    sessionId,
    expiresAt: expiresAt.toISOString(),
    warning: 'This is an impersonation session. It will expire in 1 hour.',
  })
})

// Delete user (soft delete or full)
users.delete('/:userId', async (c) => {
  const userId = c.req.param('userId')
  const admin = c.get('adminUser')
  const hardDelete = c.req.query('hard') === 'true'

  const user = await c.env.DB.prepare(
    'SELECT * FROM users WHERE id = ?'
  ).bind(userId).first()

  if (!user) {
    return c.json({ error: 'NOT_FOUND' }, 404)
  }

  if (hardDelete) {
    // Delete all user data
    await c.env.DB.batch([
      c.env.DB.prepare('DELETE FROM apps WHERE user_id = ?').bind(userId),
      c.env.DB.prepare('DELETE FROM sessions WHERE user_id = ?').bind(userId),
      c.env.DB.prepare('DELETE FROM accounts WHERE user_id = ?').bind(userId),
      c.env.DB.prepare('DELETE FROM subscriptions WHERE user_id = ?').bind(userId),
      c.env.DB.prepare('DELETE FROM organization_members WHERE user_id = ?').bind(userId),
      c.env.DB.prepare('DELETE FROM users WHERE id = ?').bind(userId),
    ])
  } else {
    // Soft delete - anonymize
    await c.env.DB.prepare(`
      UPDATE users SET
        email = ?,
        name = 'Deleted User',
        deleted_at = datetime('now')
      WHERE id = ?
    `).bind(`deleted-${userId}@deleted.local`, userId).run()
  }

  // Log admin action
  await logAdminAction(c.env, admin.email, hardDelete ? 'user.hard_deleted' : 'user.soft_deleted', {
    userId,
    userEmail: user.email,
  })

  return c.json({ success: true, hardDelete })
})

// Set user limit overrides
users.post('/:userId/limits', async (c) => {
  const userId = c.req.param('userId')
  const admin = c.get('adminUser')
  const data = await c.req.json()

  // Upsert limit overrides
  await c.env.DB.prepare(`
    INSERT INTO user_limit_overrides (id, user_id, mau_limit, storage_limit, apps_limit, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    ON CONFLICT (user_id) DO UPDATE SET
      mau_limit = COALESCE(?, mau_limit),
      storage_limit = COALESCE(?, storage_limit),
      apps_limit = COALESCE(?, apps_limit),
      updated_at = datetime('now')
  `).bind(
    crypto.randomUUID(),
    userId,
    data.mauLimit || null,
    data.storageLimit || null,
    data.appsLimit || null,
    data.mauLimit,
    data.storageLimit,
    data.appsLimit
  ).run()

  // Log admin action
  await logAdminAction(c.env, admin.email, 'user.limits_updated', { userId, limits: data })

  return c.json({ success: true })
})

export default users
```

### 2. Admin Action Logging

```typescript
// packages/api/src/lib/admin-audit.ts
export async function logAdminAction(
  env: Env,
  adminEmail: string,
  action: string,
  metadata?: Record<string, unknown>
) {
  await env.DB.prepare(`
    INSERT INTO admin_audit_log (id, admin_email, action, metadata, created_at)
    VALUES (?, ?, ?, ?, datetime('now'))
  `).bind(
    crypto.randomUUID(),
    adminEmail,
    action,
    JSON.stringify(metadata || {})
  ).run()
}
```

## Files to Create

1. `packages/api/src/routes/admin/users.ts`
2. `packages/api/src/lib/admin-audit.ts`

## Tests Required

```typescript
describe('Admin Users', () => {
  it('lists users with pagination', async () => {
    const response = await adminRequest('GET', '/admin/users?limit=10')
    expect(response.status).toBe(200)
    expect(response.body.users).toBeDefined()
    expect(response.body.total).toBeDefined()
  })

  it('searches users by email', async () => {
    const response = await adminRequest('GET', '/admin/users?search=test@')
    expect(response.body.users.every(u => u.email.includes('test@'))).toBe(true)
  })

  it('gets user details', async () => {
    const response = await adminRequest('GET', `/admin/users/${userId}`)
    expect(response.body.user.apps).toBeDefined()
    expect(response.body.user.teams).toBeDefined()
  })

  it('creates impersonation session', async () => {
    const response = await adminRequest('POST', `/admin/users/${userId}/impersonate`)
    expect(response.body.sessionId).toBeDefined()
    expect(response.body.warning).toContain('impersonation')
  })

  it('logs admin actions', async () => {
    await adminRequest('PATCH', `/admin/users/${userId}`, { name: 'New Name' })

    const logs = await db.prepare(
      'SELECT * FROM admin_audit_log WHERE action = ?'
    ).bind('user.updated').all()

    expect(logs.results).toHaveLength(1)
  })
})
```

## Acceptance Criteria

- [ ] List users with pagination
- [ ] Search by email/name
- [ ] Get user details with apps/teams
- [ ] Update user fields
- [ ] Impersonate user (creates session)
- [ ] Soft delete (anonymize)
- [ ] Hard delete (cascade)
- [ ] Set limit overrides
- [ ] All actions logged
- [ ] Tests pass
