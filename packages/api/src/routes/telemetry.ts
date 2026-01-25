/**
 * Telemetry endpoints
 *
 * Receives telemetry data from SDKs for monitoring and analytics.
 */

import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'

import type { Env } from '../types/env'

const telemetryEventSchema = z.object({
  deviceId: z.string().min(1),
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
  errorMessage: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
  timestamp: z.number(),
})

const batchTelemetrySchema = z.object({
  events: z.array(telemetryEventSchema).min(1).max(100),
})

export const telemetryRouter = new Hono<{ Bindings: Env }>()

/**
 * POST /v1/telemetry
 *
 * Record a single telemetry event.
 */
telemetryRouter.post('/', zValidator('json', telemetryEventSchema), async (c) => {
  const event = c.req.valid('json')

  // TODO: Implement telemetry recording
  // 1. Validate device/app relationship
  // 2. Store event in D1 or analytics service
  // 3. Update device status if needed (crash count, etc)

  console.log('[telemetry] Event:', event.eventType, 'device:', event.deviceId)

  return c.json({ received: true })
})

/**
 * POST /v1/telemetry/batch
 *
 * Record multiple telemetry events (for offline sync).
 */
telemetryRouter.post('/batch', zValidator('json', batchTelemetrySchema), async (c) => {
  const { events } = c.req.valid('json')

  // TODO: Implement batch telemetry
  // 1. Validate all events
  // 2. Batch insert into D1
  // 3. Update device statuses

  return c.json({
    received: events.length,
    processed: events.length,
  })
})

/**
 * POST /v1/telemetry/crash
 *
 * Report a crash event (prioritized endpoint).
 */
telemetryRouter.post('/crash', async (c) => {
  // TODO: Implement crash reporting
  // 1. Record crash event
  // 2. Update device crash count
  // 3. Check if global rollback threshold exceeded
  // 4. Trigger rollback if needed

  return c.json({ received: true })
})
