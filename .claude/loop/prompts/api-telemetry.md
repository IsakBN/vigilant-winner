## Feature: api/telemetry

Implement telemetry endpoints for event collection and crash reporting.

### Critical Decision (from DECISIONS.md)
- Silent failures - SDK retries with exponential backoff
- Report errors to server for dashboard visibility
- Track crash rates for global rollback threshold

### Files to Modify/Create

`packages/api/src/routes/telemetry.ts` - Implement telemetry endpoints
`packages/api/src/lib/telemetry/index.ts` - Telemetry helpers
`packages/api/src/routes/telemetry.test.ts` - Tests

### Implementation

```typescript
// telemetry.ts
import { getDb } from '../db'
import { telemetryEvents, devices, releaseStats, releases, apps } from '../db/schema'
import { deviceAuth } from '../middleware/auth'
import { eq, sql } from 'drizzle-orm'
import { randomUUID } from 'crypto'

telemetryRouter.post('/', deviceAuth, zValidator('json', telemetryEventSchema), async (c) => {
  const event = c.req.valid('json')
  const db = getDb(c.env.DB)
  const now = new Date()

  // Store event
  await db.insert(telemetryEvents).values({
    id: randomUUID(),
    deviceId: event.deviceId,
    appId: event.appId,
    eventType: event.eventType,
    releaseId: event.releaseId,
    bundleVersion: event.bundleVersion,
    errorCode: event.errorCode,
    errorMessage: event.errorMessage,
    metadata: event.metadata,
    timestamp: new Date(event.timestamp),
    createdAt: now,
  })

  // Update release stats if releaseId provided
  if (event.releaseId) {
    await updateReleaseStats(db, event.releaseId, event.eventType)
  }

  return c.json({ received: true })
})

telemetryRouter.post('/batch', deviceAuth, zValidator('json', batchTelemetrySchema), async (c) => {
  const { events } = c.req.valid('json')
  const db = getDb(c.env.DB)
  const now = new Date()

  // Batch insert all events
  const records = events.map(event => ({
    id: randomUUID(),
    deviceId: event.deviceId,
    appId: event.appId,
    eventType: event.eventType,
    releaseId: event.releaseId,
    bundleVersion: event.bundleVersion,
    errorCode: event.errorCode,
    errorMessage: event.errorMessage,
    metadata: event.metadata,
    timestamp: new Date(event.timestamp),
    createdAt: now,
  }))

  await db.insert(telemetryEvents).values(records)

  // Update stats for each unique releaseId
  const releaseIds = [...new Set(events.filter(e => e.releaseId).map(e => e.releaseId))]
  for (const releaseId of releaseIds) {
    const releaseEvents = events.filter(e => e.releaseId === releaseId)
    for (const event of releaseEvents) {
      await updateReleaseStats(db, releaseId!, event.eventType)
    }
  }

  return c.json({
    received: events.length,
    processed: events.length,
  })
})

telemetryRouter.post('/crash', deviceAuth, async (c) => {
  const body = await c.req.json()
  const db = getDb(c.env.DB)
  const now = new Date()

  // 1. Record crash event
  await db.insert(telemetryEvents).values({
    id: randomUUID(),
    deviceId: body.deviceId,
    appId: body.appId,
    eventType: 'crash_detected',
    releaseId: body.releaseId,
    bundleVersion: body.bundleVersion,
    errorCode: body.errorCode,
    errorMessage: body.errorMessage,
    metadata: body.metadata,
    timestamp: now,
    createdAt: now,
  })

  // 2. Update device crash count
  await db.update(devices)
    .set({
      crashCount: sql`${devices.crashCount} + 1`,
    })
    .where(eq(devices.id, body.deviceId))

  // 3. Update release stats
  if (body.releaseId) {
    await updateReleaseStats(db, body.releaseId, 'crash_detected')

    // 4. Check if global rollback threshold exceeded
    const shouldRollback = await checkRollbackThreshold(db, body.appId, body.releaseId)
    if (shouldRollback) {
      await triggerGlobalRollback(db, body.releaseId)
    }
  }

  return c.json({ received: true })
})

async function updateReleaseStats(db: any, releaseId: string, eventType: string) {
  const field = getStatsField(eventType)
  if (!field) return

  await db.insert(releaseStats)
    .values({
      releaseId,
      [field]: 1,
      lastUpdatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: releaseStats.releaseId,
      set: {
        [field]: sql`${releaseStats[field]} + 1`,
        lastUpdatedAt: new Date(),
      },
    })
}

function getStatsField(eventType: string): string | null {
  switch (eventType) {
    case 'update_downloaded': return 'totalDownloads'
    case 'update_applied': return 'totalInstalls'
    case 'rollback_triggered': return 'totalRollbacks'
    case 'crash_detected': return 'totalCrashes'
    default: return null
  }
}

async function checkRollbackThreshold(db: any, appId: string, releaseId: string): Promise<boolean> {
  // Get app settings
  const app = await db.select().from(apps).where(eq(apps.id, appId)).get()
  const settings = app?.settings as { crashRollbackThreshold?: number } | null
  const threshold = settings?.crashRollbackThreshold ?? 5  // Default 5%

  // Get release stats
  const stats = await db.select().from(releaseStats).where(eq(releaseStats.releaseId, releaseId)).get()
  if (!stats || stats.totalInstalls < 100) {
    // Need at least 100 installs for meaningful threshold
    return false
  }

  const crashRate = (stats.totalCrashes / stats.totalInstalls) * 100
  return crashRate >= threshold
}

async function triggerGlobalRollback(db: any, releaseId: string) {
  await db.update(releases)
    .set({
      status: 'rolled_back',
      rollbackReason: 'Crash threshold exceeded',
      updatedAt: new Date(),
    })
    .where(eq(releases.id, releaseId))
}
```

### Tests Required

1. **Single event**
   - Event is stored in DB
   - Release stats updated

2. **Batch events**
   - All events stored
   - Stats updated for each release

3. **Crash reporting**
   - Crash event stored
   - Device crash count incremented
   - Release crash count incremented

4. **Rollback threshold**
   - No rollback under threshold
   - Rollback triggered when exceeded
   - Minimum installs required
