# Feature: api/admin-dashboard

Implement admin dashboard overview and statistics.

## Knowledge Docs to Read First

- `.claude/knowledge/API_FEATURES.md` → Admin endpoints
- `.claude/knowledge/CODEBASE_DEEP_DIVE.md` → Dashboard components

## Dependencies

- `api/admin-auth` (must complete first)
- `api/admin-users` (must complete first)
- `api/admin-subscriptions` (must complete first)

## What to Implement

### 1. Admin Overview Routes

```typescript
// packages/api/src/routes/admin/overview.ts
import { Hono } from 'hono'
import { adminMiddleware } from '../../middleware/admin'

const overview = new Hono()

overview.use('*', adminMiddleware)

// Get dashboard overview stats
overview.get('/stats', async (c) => {
  const [
    userStats,
    appStats,
    releaseStats,
    revenueStats,
    mauStats,
  ] = await Promise.all([
    getUserStats(c.env.DB),
    getAppStats(c.env.DB),
    getReleaseStats(c.env.DB),
    getRevenueStats(c.env.DB),
    getMauStats(c.env.DB),
  ])

  return c.json({
    users: userStats,
    apps: appStats,
    releases: releaseStats,
    revenue: revenueStats,
    mau: mauStats,
  })
})

async function getUserStats(db: D1Database) {
  const [total, today, week, month] = await Promise.all([
    db.prepare('SELECT COUNT(*) as count FROM users').first(),
    db.prepare('SELECT COUNT(*) as count FROM users WHERE created_at >= datetime("now", "-1 day")').first(),
    db.prepare('SELECT COUNT(*) as count FROM users WHERE created_at >= datetime("now", "-7 days")').first(),
    db.prepare('SELECT COUNT(*) as count FROM users WHERE created_at >= datetime("now", "-30 days")').first(),
  ])

  return {
    total: total?.count || 0,
    newToday: today?.count || 0,
    newThisWeek: week?.count || 0,
    newThisMonth: month?.count || 0,
  }
}

async function getAppStats(db: D1Database) {
  const [total, active] = await Promise.all([
    db.prepare('SELECT COUNT(*) as count FROM apps').first(),
    db.prepare(`
      SELECT COUNT(DISTINCT app_id) as count
      FROM device_events
      WHERE timestamp >= datetime('now', '-30 days')
    `).first(),
  ])

  return {
    total: total?.count || 0,
    activeThisMonth: active?.count || 0,
  }
}

async function getReleaseStats(db: D1Database) {
  const [total, today, week] = await Promise.all([
    db.prepare('SELECT COUNT(*) as count FROM releases').first(),
    db.prepare('SELECT COUNT(*) as count FROM releases WHERE created_at >= datetime("now", "-1 day")').first(),
    db.prepare('SELECT COUNT(*) as count FROM releases WHERE created_at >= datetime("now", "-7 days")').first(),
  ])

  return {
    total: total?.count || 0,
    today: today?.count || 0,
    thisWeek: week?.count || 0,
  }
}

async function getRevenueStats(db: D1Database) {
  const subscriptionCounts = await db.prepare(`
    SELECT plan_id, COUNT(*) as count
    FROM subscriptions WHERE status = 'active'
    GROUP BY plan_id
  `).all()

  // Calculate MRR based on plan prices
  const planPrices = { free: 0, pro: 29, team: 99, enterprise: 499 }
  let mrr = 0
  for (const row of subscriptionCounts.results) {
    mrr += (planPrices[row.plan_id as keyof typeof planPrices] || 0) * (row.count as number)
  }

  return {
    mrr,
    subscriptionsByPlan: Object.fromEntries(
      subscriptionCounts.results.map(r => [r.plan_id, r.count])
    ),
  }
}

async function getMauStats(db: D1Database) {
  const mau = await db.prepare(`
    SELECT COUNT(DISTINCT device_id) as count
    FROM device_events
    WHERE timestamp >= datetime('now', '-30 days')
  `).first()

  return {
    total: mau?.count || 0,
  }
}

// Get daily metrics for charts
overview.get('/metrics', async (c) => {
  const days = parseInt(c.req.query('days') || '30')

  const [userMetrics, eventMetrics] = await Promise.all([
    getDailyUserMetrics(c.env.DB, days),
    getDailyEventMetrics(c.env.DB, days),
  ])

  return c.json({
    users: userMetrics,
    events: eventMetrics,
  })
})

async function getDailyUserMetrics(db: D1Database, days: number) {
  const results = await db.prepare(`
    SELECT DATE(created_at) as date, COUNT(*) as count
    FROM users
    WHERE created_at >= datetime('now', '-${days} days')
    GROUP BY DATE(created_at)
    ORDER BY date ASC
  `).all()

  return results.results
}

async function getDailyEventMetrics(db: D1Database, days: number) {
  const results = await db.prepare(`
    SELECT DATE(timestamp) as date, event, COUNT(*) as count
    FROM device_events
    WHERE timestamp >= datetime('now', '-${days} days')
    GROUP BY DATE(timestamp), event
    ORDER BY date ASC
  `).all()

  return results.results
}

// Get system health
overview.get('/health', async (c) => {
  const [dbHealth, r2Health, kvHealth] = await Promise.all([
    checkDbHealth(c.env.DB),
    checkR2Health(c.env.BUNDLES),
    checkKvHealth(c.env.KV),
  ])

  const overall = dbHealth.ok && r2Health.ok && kvHealth.ok ? 'healthy' : 'degraded'

  return c.json({
    status: overall,
    services: {
      database: dbHealth,
      storage: r2Health,
      cache: kvHealth,
    },
    timestamp: new Date().toISOString(),
  })
})

async function checkDbHealth(db: D1Database) {
  try {
    const start = Date.now()
    await db.prepare('SELECT 1').first()
    return { ok: true, latencyMs: Date.now() - start }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Unknown' }
  }
}

async function checkR2Health(r2: R2Bucket) {
  try {
    const start = Date.now()
    await r2.head('health-check')
    return { ok: true, latencyMs: Date.now() - start }
  } catch (error) {
    // R2 head on non-existent key returns null, not error
    return { ok: true, latencyMs: Date.now() }
  }
}

async function checkKvHealth(kv: KVNamespace) {
  try {
    const start = Date.now()
    await kv.get('health-check')
    return { ok: true, latencyMs: Date.now() - start }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Unknown' }
  }
}

// Get recent activity feed
overview.get('/activity', async (c) => {
  const limit = parseInt(c.req.query('limit') || '50')

  // Combine recent events from multiple sources
  const [recentUsers, recentReleases, recentErrors] = await Promise.all([
    c.env.DB.prepare(`
      SELECT 'user_created' as type, id, email as detail, created_at
      FROM users ORDER BY created_at DESC LIMIT 10
    `).all(),
    c.env.DB.prepare(`
      SELECT 'release_created' as type, r.id, a.name as detail, r.created_at
      FROM releases r JOIN apps a ON a.id = r.app_id
      ORDER BY r.created_at DESC LIMIT 10
    `).all(),
    c.env.DB.prepare(`
      SELECT 'error' as type, id, message as detail, created_at
      FROM error_logs ORDER BY created_at DESC LIMIT 10
    `).all(),
  ])

  // Merge and sort
  const all = [
    ...recentUsers.results.map(r => ({ ...r, type: 'user_created' })),
    ...recentReleases.results.map(r => ({ ...r, type: 'release_created' })),
    ...recentErrors.results.map(r => ({ ...r, type: 'error' })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, limit)

  return c.json({ activity: all })
})

// Get admin audit log
overview.get('/audit-log', async (c) => {
  const limit = parseInt(c.req.query('limit') || '100')
  const offset = parseInt(c.req.query('offset') || '0')

  const results = await c.env.DB.prepare(`
    SELECT * FROM admin_audit_log
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `).bind(limit, offset).all()

  return c.json({
    entries: results.results.map(e => ({
      ...e,
      metadata: JSON.parse(e.metadata as string || '{}'),
    })),
  })
})

export default overview
```

## Files to Create

1. `packages/api/src/routes/admin/overview.ts`

## Tests Required

```typescript
describe('Admin Dashboard', () => {
  it('returns overview stats', async () => {
    const response = await adminRequest('GET', '/admin/overview/stats')
    expect(response.body.users.total).toBeDefined()
    expect(response.body.apps.total).toBeDefined()
    expect(response.body.revenue.mrr).toBeDefined()
  })

  it('returns daily metrics', async () => {
    const response = await adminRequest('GET', '/admin/overview/metrics?days=7')
    expect(response.body.users).toBeInstanceOf(Array)
    expect(response.body.events).toBeInstanceOf(Array)
  })

  it('returns system health', async () => {
    const response = await adminRequest('GET', '/admin/overview/health')
    expect(response.body.status).toMatch(/healthy|degraded/)
    expect(response.body.services.database).toBeDefined()
  })

  it('returns activity feed', async () => {
    const response = await adminRequest('GET', '/admin/overview/activity')
    expect(response.body.activity).toBeInstanceOf(Array)
  })
})
```

## Acceptance Criteria

- [ ] Overview stats (users, apps, releases, revenue, MAU)
- [ ] Daily metrics for charting
- [ ] System health checks (DB, R2, KV)
- [ ] Activity feed (combined recent events)
- [ ] Admin audit log
- [ ] MRR calculation
- [ ] All data paginated where appropriate
- [ ] Tests pass
