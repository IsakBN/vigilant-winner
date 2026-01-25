## Feature: api/release-management

Implement release CRUD and rollback endpoints for dashboard.

### Files to Modify/Create

`packages/api/src/routes/releases.ts` - Implement release endpoints
`packages/api/src/lib/bundles/index.ts` - Bundle upload utilities
`packages/api/src/routes/releases.test.ts` - Tests

### Implementation

```typescript
// releases.ts
import { getDb } from '../db'
import { releases, releaseStats, apps } from '../db/schema'
import { dashboardAuth } from '../middleware/auth'  // Different from device auth
import { eq, desc, and } from 'drizzle-orm'
import { randomUUID } from 'crypto'

releasesRouter.get('/', dashboardAuth, async (c) => {
  const appId = c.req.query('appId')
  if (!appId) {
    return c.json({ error: 'appId is required' }, 400)
  }

  const db = getDb(c.env.DB)
  const page = parseInt(c.req.query('page') || '1')
  const pageSize = parseInt(c.req.query('pageSize') || '20')

  const results = await db.select()
    .from(releases)
    .where(eq(releases.appId, appId))
    .orderBy(desc(releases.createdAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize)

  // Get stats for each release
  const releaseIds = results.map(r => r.id)
  const stats = await db.select()
    .from(releaseStats)
    .where(sql`${releaseStats.releaseId} IN ${releaseIds}`)

  const statsMap = new Map(stats.map(s => [s.releaseId, s]))

  const releasesWithStats = results.map(r => ({
    ...r,
    stats: statsMap.get(r.id) || { totalDownloads: 0, totalInstalls: 0, totalCrashes: 0 },
  }))

  return c.json({
    releases: releasesWithStats,
    pagination: { page, pageSize, total: results.length },
  })
})

releasesRouter.post('/', dashboardAuth, async (c) => {
  const formData = await c.req.formData()
  const appId = formData.get('appId') as string
  const version = formData.get('version') as string
  const bundle = formData.get('bundle') as File
  const targetingRules = formData.get('targetingRules') as string | null
  const releaseNotes = formData.get('releaseNotes') as string | null
  const minAppVersion = formData.get('minAppVersion') as string | null
  const maxAppVersion = formData.get('maxAppVersion') as string | null

  if (!appId || !version || !bundle) {
    return c.json({ error: 'Missing required fields' }, 400)
  }

  const db = getDb(c.env.DB)
  const releaseId = randomUUID()

  // 1. Calculate bundle hash
  const bundleBuffer = await bundle.arrayBuffer()
  const hashBuffer = await crypto.subtle.digest('SHA-256', bundleBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const bundleHash = 'sha256:' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

  // 2. Upload to R2
  const bundleKey = `bundles/${appId}/${releaseId}/bundle.js`
  await c.env.BUNDLES.put(bundleKey, bundleBuffer, {
    httpMetadata: { contentType: 'application/javascript' },
  })
  const bundleUrl = `https://bundles.bundlenudge.com/${bundleKey}`

  // 3. Create release record
  const now = new Date()
  await db.insert(releases).values({
    id: releaseId,
    appId,
    version,
    bundleUrl,
    bundleSize: bundle.size,
    bundleHash,
    targetingRules: targetingRules ? JSON.parse(targetingRules) : null,
    releaseNotes,
    minAppVersion,
    maxAppVersion,
    status: 'active',
    createdAt: now,
    updatedAt: now,
  })

  // 4. Initialize stats
  await db.insert(releaseStats).values({
    releaseId,
    lastUpdatedAt: now,
  })

  return c.json({
    id: releaseId,
    version,
    bundleHash,
    status: 'active',
  })
})

releasesRouter.get('/:id', dashboardAuth, async (c) => {
  const id = c.req.param('id')
  const db = getDb(c.env.DB)

  const release = await db.select()
    .from(releases)
    .where(eq(releases.id, id))
    .get()

  if (!release) {
    return c.json({ error: 'not_found' }, 404)
  }

  const stats = await db.select()
    .from(releaseStats)
    .where(eq(releaseStats.releaseId, id))
    .get()

  return c.json({
    ...release,
    stats: stats || { totalDownloads: 0, totalInstalls: 0, totalCrashes: 0 },
  })
})

releasesRouter.patch('/:id', dashboardAuth, async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()
  const db = getDb(c.env.DB)

  const updates: Record<string, any> = { updatedAt: new Date() }

  if (body.status !== undefined) updates.status = body.status
  if (body.targetingRules !== undefined) updates.targetingRules = body.targetingRules
  if (body.releaseNotes !== undefined) updates.releaseNotes = body.releaseNotes

  await db.update(releases)
    .set(updates)
    .where(eq(releases.id, id))

  return c.json({ id, ...updates })
})

releasesRouter.post('/:id/rollback', dashboardAuth, async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()
  const db = getDb(c.env.DB)

  await db.update(releases)
    .set({
      status: 'rolled_back',
      rollbackReason: body.reason || 'Manual rollback',
      updatedAt: new Date(),
    })
    .where(eq(releases.id, id))

  return c.json({ id, status: 'rolled_back' })
})
```

### Tests Required

1. **List releases**
   - Returns paginated releases
   - Includes stats for each

2. **Create release**
   - Uploads bundle to R2
   - Creates release record
   - Calculates hash correctly

3. **Get release**
   - Returns release with stats
   - Returns 404 for unknown

4. **Update release**
   - Updates specified fields
   - Doesn't change unspecified fields

5. **Rollback**
   - Sets status to rolled_back
   - Records reason
