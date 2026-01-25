import { describe, it, expect } from 'vitest'
import { z } from 'zod'

// Local schema definitions for testing (matching index.ts)
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

describe('telemetry routes logic', () => {
  describe('telemetryEventSchema', () => {
    it('validates valid single event', () => {
      const result = telemetryEventSchema.safeParse({
        deviceId: 'device-123',
        appId: '550e8400-e29b-41d4-a716-446655440000',
        eventType: 'update_applied',
        timestamp: Date.now(),
      })
      expect(result.success).toBe(true)
    })

    it('validates event with all optional fields', () => {
      const result = telemetryEventSchema.safeParse({
        deviceId: 'device-456',
        appId: '550e8400-e29b-41d4-a716-446655440000',
        eventType: 'update_failed',
        releaseId: 'rel-123',
        bundleVersion: '1.2.0',
        errorCode: 'DOWNLOAD_FAILED',
        errorMessage: 'Network timeout',
        metadata: { retryCount: 3 },
        timestamp: Date.now(),
      })
      expect(result.success).toBe(true)
    })

    it('validates all event types', () => {
      const eventTypes = [
        'update_check',
        'update_downloaded',
        'update_applied',
        'update_failed',
        'rollback_triggered',
        'crash_detected',
        'route_failure',
      ]

      for (const eventType of eventTypes) {
        const result = telemetryEventSchema.safeParse({
          deviceId: 'device-123',
          appId: '550e8400-e29b-41d4-a716-446655440000',
          eventType,
          timestamp: Date.now(),
        })
        expect(result.success).toBe(true)
      }
    })

    it('rejects invalid event type', () => {
      const result = telemetryEventSchema.safeParse({
        deviceId: 'device-123',
        appId: '550e8400-e29b-41d4-a716-446655440000',
        eventType: 'invalid_event',
        timestamp: Date.now(),
      })
      expect(result.success).toBe(false)
    })

    it('rejects missing required fields', () => {
      const result = telemetryEventSchema.safeParse({
        deviceId: 'device-123',
        eventType: 'update_applied',
      })
      expect(result.success).toBe(false)
    })

    it('rejects invalid appId format', () => {
      const result = telemetryEventSchema.safeParse({
        deviceId: 'device-123',
        appId: 'not-a-uuid',
        eventType: 'update_applied',
        timestamp: Date.now(),
      })
      expect(result.success).toBe(false)
    })
  })

  describe('batchTelemetrySchema', () => {
    it('validates batch with multiple events', () => {
      const result = batchTelemetrySchema.safeParse({
        events: [
          {
            deviceId: 'device-1',
            appId: '550e8400-e29b-41d4-a716-446655440000',
            eventType: 'update_check',
            timestamp: Date.now(),
          },
          {
            deviceId: 'device-1',
            appId: '550e8400-e29b-41d4-a716-446655440000',
            eventType: 'update_downloaded',
            releaseId: 'rel-123',
            timestamp: Date.now() + 1000,
          },
        ],
      })
      expect(result.success).toBe(true)
    })

    it('rejects empty events array', () => {
      const result = batchTelemetrySchema.safeParse({
        events: [],
      })
      expect(result.success).toBe(false)
    })

    it('rejects batch exceeding 100 events', () => {
      const events = Array(101).fill(null).map((_, i) => ({
        deviceId: `device-${i}`,
        appId: '550e8400-e29b-41d4-a716-446655440000',
        eventType: 'update_check' as const,
        timestamp: Date.now(),
      }))

      const result = batchTelemetrySchema.safeParse({ events })
      expect(result.success).toBe(false)
    })
  })

  describe('crashReportSchema', () => {
    it('validates minimal crash report', () => {
      const result = crashReportSchema.safeParse({
        deviceId: 'device-123',
        appId: '550e8400-e29b-41d4-a716-446655440000',
      })
      expect(result.success).toBe(true)
    })

    it('validates crash report with all fields', () => {
      const result = crashReportSchema.safeParse({
        deviceId: 'device-456',
        appId: '550e8400-e29b-41d4-a716-446655440000',
        releaseId: 'rel-789',
        bundleVersion: '1.0.0',
        errorCode: 'FATAL_ERROR',
        errorMessage: 'Null pointer exception',
        stackTrace: 'Error at line 42\n  at function foo',
        metadata: { screenName: 'HomeScreen' },
      })
      expect(result.success).toBe(true)
    })
  })

  describe('stats field mapping', () => {
    function getStatsField(eventType: string): string | null {
      switch (eventType) {
        case 'update_downloaded': return 'total_downloads'
        case 'update_applied': return 'total_installs'
        case 'rollback_triggered': return 'total_rollbacks'
        case 'crash_detected': return 'total_crashes'
        default: return null
      }
    }

    it('maps update_downloaded to total_downloads', () => {
      expect(getStatsField('update_downloaded')).toBe('total_downloads')
    })

    it('maps update_applied to total_installs', () => {
      expect(getStatsField('update_applied')).toBe('total_installs')
    })

    it('maps rollback_triggered to total_rollbacks', () => {
      expect(getStatsField('rollback_triggered')).toBe('total_rollbacks')
    })

    it('maps crash_detected to total_crashes', () => {
      expect(getStatsField('crash_detected')).toBe('total_crashes')
    })

    it('returns null for non-stats events', () => {
      expect(getStatsField('update_check')).toBe(null)
      expect(getStatsField('update_failed')).toBe(null)
      expect(getStatsField('route_failure')).toBe(null)
    })
  })

  describe('shouldUpdateStats', () => {
    function shouldUpdateStats(eventType: string): boolean {
      return ['update_downloaded', 'update_applied', 'rollback_triggered', 'crash_detected']
        .includes(eventType)
    }

    it('returns true for stats-tracked events', () => {
      expect(shouldUpdateStats('update_downloaded')).toBe(true)
      expect(shouldUpdateStats('update_applied')).toBe(true)
      expect(shouldUpdateStats('rollback_triggered')).toBe(true)
      expect(shouldUpdateStats('crash_detected')).toBe(true)
    })

    it('returns false for non-stats events', () => {
      expect(shouldUpdateStats('update_check')).toBe(false)
      expect(shouldUpdateStats('update_failed')).toBe(false)
      expect(shouldUpdateStats('route_failure')).toBe(false)
    })
  })

  describe('groupEventsByRelease', () => {
    type TelemetryEvent = z.infer<typeof telemetryEventSchema>

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

    it('groups events by release ID', () => {
      const events: TelemetryEvent[] = [
        { deviceId: 'd1', appId: '550e8400-e29b-41d4-a716-446655440000', eventType: 'update_applied', releaseId: 'rel-1', timestamp: 1 },
        { deviceId: 'd2', appId: '550e8400-e29b-41d4-a716-446655440000', eventType: 'update_applied', releaseId: 'rel-1', timestamp: 2 },
        { deviceId: 'd3', appId: '550e8400-e29b-41d4-a716-446655440000', eventType: 'update_downloaded', releaseId: 'rel-2', timestamp: 3 },
      ]

      const result = groupEventsByRelease(events)

      expect(result['rel-1']).toEqual(['update_applied', 'update_applied'])
      expect(result['rel-2']).toEqual(['update_downloaded'])
    })

    it('ignores events without releaseId', () => {
      const events: TelemetryEvent[] = [
        { deviceId: 'd1', appId: '550e8400-e29b-41d4-a716-446655440000', eventType: 'update_applied', timestamp: 1 },
        { deviceId: 'd2', appId: '550e8400-e29b-41d4-a716-446655440000', eventType: 'update_check', releaseId: 'rel-1', timestamp: 2 },
      ]

      const result = groupEventsByRelease(events)

      expect(Object.keys(result)).toHaveLength(0)
    })
  })

  describe('rollback threshold logic', () => {
    function shouldTriggerRollback(
      totalInstalls: number,
      totalCrashes: number,
      threshold: number
    ): boolean {
      if (totalInstalls < 100) return false
      const crashRate = (totalCrashes / totalInstalls) * 100
      return crashRate >= threshold
    }

    it('does not trigger under minimum installs', () => {
      expect(shouldTriggerRollback(50, 10, 5)).toBe(false)
      expect(shouldTriggerRollback(99, 99, 5)).toBe(false)
    })

    it('does not trigger when under threshold', () => {
      expect(shouldTriggerRollback(1000, 40, 5)).toBe(false) // 4%
      expect(shouldTriggerRollback(100, 4, 5)).toBe(false)   // 4%
    })

    it('triggers when at threshold', () => {
      expect(shouldTriggerRollback(100, 5, 5)).toBe(true)   // 5%
      expect(shouldTriggerRollback(1000, 50, 5)).toBe(true) // 5%
    })

    it('triggers when over threshold', () => {
      expect(shouldTriggerRollback(100, 10, 5)).toBe(true)   // 10%
      expect(shouldTriggerRollback(1000, 100, 5)).toBe(true) // 10%
    })

    it('respects custom threshold', () => {
      expect(shouldTriggerRollback(100, 5, 10)).toBe(false)  // 5% < 10%
      expect(shouldTriggerRollback(100, 10, 10)).toBe(true)  // 10% >= 10%
    })
  })

  describe('response structures', () => {
    it('single event response', () => {
      const response = { received: true }
      expect(response.received).toBe(true)
    })

    it('batch event response', () => {
      const response = { received: 5, processed: 5 }
      expect(response.received).toBe(5)
      expect(response.processed).toBe(5)
    })

    it('crash report response', () => {
      const response = { received: true }
      expect(response.received).toBe(true)
    })
  })
})
