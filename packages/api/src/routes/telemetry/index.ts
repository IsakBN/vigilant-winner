/**
 * Telemetry Routes
 *
 * Receives telemetry data from SDKs for monitoring, analytics,
 * and automatic crash-based rollback detection.
 */

import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import type { Env } from '../../types/env'

// =============================================================================
// Schemas
// =============================================================================

const telemetryEventSchema = z.object({
  deviceId: z.string().min(1).max(100),
  appId: z.string().uuid(),
  eventType: z.enum([
    'update_check',
    'update_downloaded',
    'update_applied',
    'update_failed',
    'rollback_triggered',
    'crash_detected',
    'route_failure',
  ]),
  releaseId: z.string().optional(),
  bundleVersion: z.string().optional(),
  errorCode: z.string().optional(),
  errorMessage: z.string().max(1000).optional(),
  metadata: z.record(z.unknown()).optional(),
  timestamp: z.number(),
})

const batchTelemetrySchema = z.object({
  events: z.array(telemetryEventSchema).min(1).max(100),
})

const crashReportSchema = z.object({
  deviceId: z.string().min(1).max(100),
  appId: z.string().uuid(),
  releaseId: z.string().optional(),
  bundleVersion: z.string().optional(),
  errorCode: z.string().optional(),
  errorMessage: z.string().max(5000).optional(),
  stackTrace: z.string().max(10000).optional(),
  metadata: z.record(z.unknown()).optional(),
})

export type TelemetryEvent = z.infer<typeof telemetryEventSchema>

// =============================================================================
// Router
// =============================================================================

export const telemetryRouter = new Hono<{ Bindings: Env }>()

/**
 * POST /v1/telemetry
 * Record a single telemetry event
 */
telemetryRouter.post('/', zValidator('json', telemetryEventSchema), (c) => {
  const event = c.req.valid('json')
  const eventId = crypto.randomUUID()
  const now = Math.floor(Date.now() / 1000)

  // Store event asynchronously (don't block response)
  c.executionCtx.waitUntil(
    storeTelemetryEvent(c.env.DB, eventId, event, now)
  )

  // Update release stats if applicable
  if (event.releaseId && shouldUpdateStats(event.eventType)) {
    c.executionCtx.waitUntil(
      updateReleaseStats(c.env.DB, event.releaseId, event.eventType)
    )
  }

  return c.json({ received: true })
})

/**
 * POST /v1/telemetry/batch
 * Record multiple telemetry events (for offline sync)
 */
telemetryRouter.post('/batch', zValidator('json', batchTelemetrySchema), (c) => {
  const { events } = c.req.valid('json')
  const now = Math.floor(Date.now() / 1000)

  // Store all events asynchronously
  const storePromises = events.map((event) => {
    const eventId = crypto.randomUUID()
    return storeTelemetryEvent(c.env.DB, eventId, event, now)
  })
  c.executionCtx.waitUntil(Promise.all(storePromises))

  // Update stats for each unique releaseId
  const releaseStats = groupEventsByRelease(events)
  const statsPromises = Object.entries(releaseStats).map(([releaseId, eventTypes]) => {
    return Promise.all(
      eventTypes.map((eventType) => updateReleaseStats(c.env.DB, releaseId, eventType))
    )
  })
  c.executionCtx.waitUntil(Promise.all(statsPromises))

  return c.json({
    received: events.length,
    processed: events.length,
  })
})

/**
 * POST /v1/telemetry/crash
 * Report a crash event (prioritized endpoint)
 */
telemetryRouter.post('/crash', zValidator('json', crashReportSchema), async (c) => {
  const body = c.req.valid('json')
  const eventId = crypto.randomUUID()
  const now = Math.floor(Date.now() / 1000)

  // 1. Record crash event
  await c.env.DB.prepare(`
    INSERT INTO telemetry_events (id, device_id, app_id, event_type, release_id,
      bundle_version, error_code, error_message, metadata, timestamp, created_at)
    VALUES (?, ?, ?, 'crash_detected', ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    eventId,
    body.deviceId,
    body.appId,
    body.releaseId ?? null,
    body.bundleVersion ?? null,
    body.errorCode ?? null,
    body.errorMessage ?? null,
    body.metadata ? JSON.stringify(body.metadata) : null,
    now,
    now
  ).run()

  // 2. Update device crash count
  c.executionCtx.waitUntil(
    c.env.DB.prepare(`
      UPDATE devices SET crash_count = crash_count + 1
      WHERE app_id = ? AND device_id = ?
    `).bind(body.appId, body.deviceId).run()
  )

  // 3. Update release crash stats
  if (body.releaseId) {
    c.executionCtx.waitUntil(
      updateReleaseStats(c.env.DB, body.releaseId, 'crash_detected')
    )

    // 4. Check rollback threshold
    c.executionCtx.waitUntil(
      checkAndTriggerRollback(c.env.DB, body.appId, body.releaseId)
    )
  }

  return c.json({ received: true })
})

// =============================================================================
// Helpers
// =============================================================================

async function storeTelemetryEvent(
  db: D1Database,
  eventId: string,
  event: TelemetryEvent,
  now: number
): Promise<void> {
  await db.prepare(`
    INSERT INTO telemetry_events (id, device_id, app_id, event_type, release_id,
      bundle_version, error_code, error_message, metadata, timestamp, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    eventId,
    event.deviceId,
    event.appId,
    event.eventType,
    event.releaseId ?? null,
    event.bundleVersion ?? null,
    event.errorCode ?? null,
    event.errorMessage ?? null,
    event.metadata ? JSON.stringify(event.metadata) : null,
    event.timestamp,
    now
  ).run()
}

function shouldUpdateStats(eventType: string): boolean {
  return ['update_downloaded', 'update_applied', 'rollback_triggered', 'crash_detected']
    .includes(eventType)
}

function groupEventsByRelease(events: TelemetryEvent[]): Record<string, string[]> {
  const result: Record<string, string[]> = {}

  for (const event of events) {
    if (event.releaseId && shouldUpdateStats(event.eventType)) {
      const releaseEvents = result[event.releaseId] ?? []
      releaseEvents.push(event.eventType)
      result[event.releaseId] = releaseEvents
    }
  }

  return result
}

async function updateReleaseStats(
  db: D1Database,
  releaseId: string,
  eventType: string
): Promise<void> {
  const field = getStatsField(eventType)
  if (!field) return

  // Upsert: insert or update on conflict
  await db.prepare(`
    INSERT INTO release_stats (release_id, ${field}, last_updated_at)
    VALUES (?, 1, ?)
    ON CONFLICT(release_id) DO UPDATE SET
      ${field} = ${field} + 1,
      last_updated_at = excluded.last_updated_at
  `).bind(releaseId, Math.floor(Date.now() / 1000)).run()
}

function getStatsField(eventType: string): string | null {
  switch (eventType) {
    case 'update_downloaded': return 'total_downloads'
    case 'update_applied': return 'total_installs'
    case 'rollback_triggered': return 'total_rollbacks'
    case 'crash_detected': return 'total_crashes'
    default: return null
  }
}

async function checkAndTriggerRollback(
  db: D1Database,
  appId: string,
  releaseId: string
): Promise<void> {
  // Get app settings for threshold
  const app = await db.prepare(
    'SELECT settings FROM apps WHERE id = ? AND deleted_at IS NULL'
  ).bind(appId).first<{ settings: string | null }>()

  const settings = app?.settings ? JSON.parse(app.settings) as { crashRollbackThreshold?: number } : {}
  const threshold = settings.crashRollbackThreshold ?? 5 // Default 5%

  // Get release stats
  const stats = await db.prepare(
    'SELECT total_installs, total_crashes FROM release_stats WHERE release_id = ?'
  ).bind(releaseId).first<{ total_installs: number; total_crashes: number }>()

  if (!stats || stats.total_installs < 100) {
    // Need at least 100 installs for meaningful threshold
    return
  }

  const crashRate = (stats.total_crashes / stats.total_installs) * 100

  if (crashRate >= threshold) {
    // Trigger global rollback
    await db.prepare(`
      UPDATE releases SET status = 'rolled_back',
        rollback_reason = 'Automatic rollback: crash rate exceeded threshold',
        updated_at = ?
      WHERE id = ? AND status = 'active'
    `).bind(Math.floor(Date.now() / 1000), releaseId).run()
  }
}
