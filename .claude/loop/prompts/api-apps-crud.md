# Feature: api/apps-crud

Implement CRUD operations for apps.

## Knowledge Docs to Read First

- `.claude/knowledge/API_FEATURES.md` → Apps endpoints
- `.claude/knowledge/IMPLEMENTATION_DETAILS.md` → Database schema

## Dependencies

- `api/database-schema` (must complete first)
- `api/auth-middleware` (must complete first)

## What to Implement

### 1. Apps Router

```typescript
// packages/api/src/routes/apps/index.ts
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { authMiddleware } from '../../middleware/auth'
import { createAppSchema, updateAppSchema } from '@bundlenudge/shared'
import { nanoid } from 'nanoid'

const apps = new Hono()

// All routes require authentication
apps.use('*', authMiddleware)

// List user's apps
apps.get('/', async (c) => {
  const user = c.get('user')

  const results = await c.env.DB.prepare(`
    SELECT
      a.*,
      (SELECT COUNT(*) FROM releases WHERE app_id = a.id) as release_count,
      (SELECT COUNT(*) FROM devices WHERE app_id = a.id) as device_count
    FROM apps a
    WHERE a.user_id = ?
    ORDER BY a.created_at DESC
  `).bind(user.id).all()

  return c.json({ apps: results.results })
})

// Get single app
apps.get('/:appId', async (c) => {
  const user = c.get('user')
  const appId = c.req.param('appId')

  const app = await c.env.DB.prepare(`
    SELECT
      a.*,
      (SELECT COUNT(*) FROM releases WHERE app_id = a.id) as release_count,
      (SELECT COUNT(*) FROM devices WHERE app_id = a.id) as device_count
    FROM apps a
    WHERE a.id = ? AND a.user_id = ?
  `).bind(appId, user.id).first()

  if (!app) {
    return c.json({ error: 'NOT_FOUND', message: 'App not found' }, 404)
  }

  return c.json({ app })
})

// Create app
apps.post('/', zValidator('json', createAppSchema), async (c) => {
  const user = c.get('user')
  const data = c.req.valid('json')

  // Check plan limits
  const appCount = await c.env.DB.prepare(
    'SELECT COUNT(*) as count FROM apps WHERE user_id = ?'
  ).bind(user.id).first()

  const subscription = await getUserSubscription(c.env.DB, user.id)
  const limits = PLAN_LIMITS[subscription?.planId || 'free']

  if (appCount.count >= limits.appsLimit) {
    return c.json(
      { error: 'PLAN_LIMIT_EXCEEDED', message: 'App limit reached for your plan' },
      402
    )
  }

  const appId = crypto.randomUUID()
  const apiKey = `bn_${nanoid(32)}`

  await c.env.DB.prepare(`
    INSERT INTO apps (id, user_id, name, platform, bundle_id, api_key, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `).bind(
    appId,
    user.id,
    data.name,
    data.platform,
    data.bundleId || null,
    apiKey
  ).run()

  const app = await c.env.DB.prepare(
    'SELECT * FROM apps WHERE id = ?'
  ).bind(appId).first()

  return c.json({ app }, 201)
})

// Update app
apps.patch('/:appId', zValidator('json', updateAppSchema), async (c) => {
  const user = c.get('user')
  const appId = c.req.param('appId')
  const data = c.req.valid('json')

  // Verify ownership
  const existing = await c.env.DB.prepare(
    'SELECT * FROM apps WHERE id = ? AND user_id = ?'
  ).bind(appId, user.id).first()

  if (!existing) {
    return c.json({ error: 'NOT_FOUND', message: 'App not found' }, 404)
  }

  const updates: string[] = []
  const values: unknown[] = []

  if (data.name !== undefined) {
    updates.push('name = ?')
    values.push(data.name)
  }
  if (data.bundleId !== undefined) {
    updates.push('bundle_id = ?')
    values.push(data.bundleId)
  }

  if (updates.length === 0) {
    return c.json({ app: existing })
  }

  updates.push('updated_at = datetime("now")')
  values.push(appId, user.id)

  await c.env.DB.prepare(`
    UPDATE apps SET ${updates.join(', ')} WHERE id = ? AND user_id = ?
  `).bind(...values).run()

  const app = await c.env.DB.prepare(
    'SELECT * FROM apps WHERE id = ?'
  ).bind(appId).first()

  return c.json({ app })
})

// Delete app
apps.delete('/:appId', async (c) => {
  const user = c.get('user')
  const appId = c.req.param('appId')

  // Verify ownership
  const existing = await c.env.DB.prepare(
    'SELECT * FROM apps WHERE id = ? AND user_id = ?'
  ).bind(appId, user.id).first()

  if (!existing) {
    return c.json({ error: 'NOT_FOUND', message: 'App not found' }, 404)
  }

  // Delete related data (cascading)
  await c.env.DB.batch([
    c.env.DB.prepare('DELETE FROM releases WHERE app_id = ?').bind(appId),
    c.env.DB.prepare('DELETE FROM devices WHERE app_id = ?').bind(appId),
    c.env.DB.prepare('DELETE FROM webhooks WHERE app_id = ?').bind(appId),
    c.env.DB.prepare('DELETE FROM apps WHERE id = ?').bind(appId),
  ])

  // Delete bundles from R2
  const bundles = await c.env.BUNDLES.list({ prefix: `${appId}/` })
  for (const object of bundles.objects) {
    await c.env.BUNDLES.delete(object.key)
  }

  return c.json({ success: true })
})

// Regenerate API key
apps.post('/:appId/regenerate-key', async (c) => {
  const user = c.get('user')
  const appId = c.req.param('appId')

  const existing = await c.env.DB.prepare(
    'SELECT * FROM apps WHERE id = ? AND user_id = ?'
  ).bind(appId, user.id).first()

  if (!existing) {
    return c.json({ error: 'NOT_FOUND', message: 'App not found' }, 404)
  }

  const newApiKey = `bn_${nanoid(32)}`

  await c.env.DB.prepare(
    'UPDATE apps SET api_key = ?, updated_at = datetime("now") WHERE id = ?'
  ).bind(newApiKey, appId).run()

  return c.json({ apiKey: newApiKey })
})

export default apps
```

### 2. App Statistics

```typescript
// packages/api/src/routes/apps/stats.ts
import { Hono } from 'hono'
import { authMiddleware } from '../../middleware/auth'

const appStats = new Hono()

apps.use('*', authMiddleware)

// Get app statistics
appStats.get('/:appId/stats', async (c) => {
  const user = c.get('user')
  const appId = c.req.param('appId')
  const period = c.req.query('period') || '7d'

  const app = await verifyAppOwnership(c.env.DB, appId, user.id)
  if (!app) {
    return c.json({ error: 'NOT_FOUND' }, 404)
  }

  const days = period === '30d' ? 30 : period === '24h' ? 1 : 7

  const stats = await c.env.DB.prepare(`
    SELECT
      DATE(timestamp) as date,
      event,
      COUNT(*) as count
    FROM device_events
    WHERE app_id = ? AND timestamp >= datetime('now', '-${days} days')
    GROUP BY DATE(timestamp), event
    ORDER BY date DESC
  `).bind(appId).all()

  const mau = await c.env.DB.prepare(`
    SELECT COUNT(DISTINCT device_id) as count
    FROM device_events
    WHERE app_id = ? AND timestamp >= datetime('now', '-30 days')
  `).bind(appId).first()

  return c.json({
    stats: stats.results,
    mau: mau?.count || 0,
  })
})

export default appStats
```

## Files to Create

1. `packages/api/src/routes/apps/index.ts` - CRUD
2. `packages/api/src/routes/apps/stats.ts` - Statistics

## Tests Required

```typescript
// packages/api/src/routes/apps/__tests__/apps.test.ts
describe('Apps CRUD', () => {
  it('creates an app', async () => {
    const response = await authedRequest('POST', '/apps', {
      name: 'My App',
      platform: 'ios',
    })
    expect(response.status).toBe(201)
    expect(response.body.app.name).toBe('My App')
  })

  it('enforces plan limits', async () => {
    // Create max apps for free plan
    for (let i = 0; i < 2; i++) {
      await authedRequest('POST', '/apps', { name: `App ${i}`, platform: 'ios' })
    }

    const response = await authedRequest('POST', '/apps', {
      name: 'One Too Many',
      platform: 'ios',
    })
    expect(response.status).toBe(402)
  })
})
```

## Acceptance Criteria

- [ ] List apps returns all user's apps
- [ ] Create app generates API key
- [ ] Create app enforces plan limits
- [ ] Update app validates ownership
- [ ] Delete app cascades to releases, devices, webhooks
- [ ] Delete app removes R2 bundles
- [ ] Regenerate API key works
- [ ] Tests pass
