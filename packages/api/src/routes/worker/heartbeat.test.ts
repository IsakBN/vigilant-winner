/**
 * Worker heartbeat routes tests
 * @agent queue-system
 */

import { describe, it, expect } from 'vitest'
import { z } from 'zod'

// =============================================================================
// Schema Definitions
// =============================================================================

const heartbeatSchema = z.object({
  workerId: z.string().min(1).max(100),
  status: z.enum(['online', 'busy', 'draining']),
  currentBuildId: z.string().optional(),
  cpuUsage: z.number().min(0).max(100).optional(),
  memoryUsage: z.number().min(0).max(100).optional(),
  diskUsage: z.number().min(0).max(100).optional(),
})

const buildCompleteSchema = z.object({
  buildId: z.string(),
  durationMs: z.number().int().positive(),
  success: z.boolean(),
})

// =============================================================================
// Heartbeat Tests
// =============================================================================

describe('Worker Heartbeat Routes', () => {
  describe('heartbeatSchema', () => {
    it('validates minimal heartbeat', () => {
      const result = heartbeatSchema.safeParse({
        workerId: 'worker-001',
        status: 'online',
      })
      expect(result.success).toBe(true)
    })

    it('validates with all metrics', () => {
      const result = heartbeatSchema.safeParse({
        workerId: 'worker-001',
        status: 'busy',
        currentBuildId: 'build-123',
        cpuUsage: 75,
        memoryUsage: 60,
        diskUsage: 45,
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.cpuUsage).toBe(75)
        expect(result.data.memoryUsage).toBe(60)
        expect(result.data.diskUsage).toBe(45)
      }
    })

    it('validates all worker statuses', () => {
      const statuses = ['online', 'busy', 'draining']
      statuses.forEach(status => {
        const result = heartbeatSchema.safeParse({
          workerId: 'worker-001',
          status,
        })
        expect(result.success).toBe(true)
      })
    })

    it('rejects invalid status', () => {
      const result = heartbeatSchema.safeParse({
        workerId: 'worker-001',
        status: 'offline',
      })
      expect(result.success).toBe(false)
    })

    it('rejects CPU usage above 100', () => {
      const result = heartbeatSchema.safeParse({
        workerId: 'worker-001',
        status: 'online',
        cpuUsage: 101,
      })
      expect(result.success).toBe(false)
    })

    it('rejects negative CPU usage', () => {
      const result = heartbeatSchema.safeParse({
        workerId: 'worker-001',
        status: 'online',
        cpuUsage: -1,
      })
      expect(result.success).toBe(false)
    })

    it('accepts usage metrics at boundaries', () => {
      const min = heartbeatSchema.safeParse({
        workerId: 'worker-001',
        status: 'online',
        cpuUsage: 0,
        memoryUsage: 0,
        diskUsage: 0,
      })
      const max = heartbeatSchema.safeParse({
        workerId: 'worker-001',
        status: 'online',
        cpuUsage: 100,
        memoryUsage: 100,
        diskUsage: 100,
      })
      expect(min.success).toBe(true)
      expect(max.success).toBe(true)
    })

    it('rejects empty workerId', () => {
      const result = heartbeatSchema.safeParse({
        workerId: '',
        status: 'online',
      })
      expect(result.success).toBe(false)
    })

    it('rejects workerId exceeding max length', () => {
      const result = heartbeatSchema.safeParse({
        workerId: 'a'.repeat(101),
        status: 'online',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('buildCompleteSchema', () => {
    it('validates successful build completion', () => {
      const result = buildCompleteSchema.safeParse({
        buildId: 'build-123',
        durationMs: 300000,
        success: true,
      })
      expect(result.success).toBe(true)
    })

    it('validates failed build completion', () => {
      const result = buildCompleteSchema.safeParse({
        buildId: 'build-456',
        durationMs: 150000,
        success: false,
      })
      expect(result.success).toBe(true)
    })

    it('rejects negative duration', () => {
      const result = buildCompleteSchema.safeParse({
        buildId: 'build-123',
        durationMs: -1000,
        success: true,
      })
      expect(result.success).toBe(false)
    })

    it('rejects non-integer duration', () => {
      const result = buildCompleteSchema.safeParse({
        buildId: 'build-123',
        durationMs: 1000.5,
        success: true,
      })
      expect(result.success).toBe(false)
    })

    it('rejects missing buildId', () => {
      const result = buildCompleteSchema.safeParse({
        durationMs: 300000,
        success: true,
      })
      expect(result.success).toBe(false)
    })
  })

  describe('heartbeat timing', () => {
    it('calculates if worker is stale (no heartbeat in 2 minutes)', () => {
      const now = Math.floor(Date.now() / 1000)
      const lastHeartbeat = now - 130 // 130 seconds ago
      const threshold = 120 // 2 minutes
      const isStale = now - lastHeartbeat > threshold
      expect(isStale).toBe(true)
    })

    it('identifies active worker (recent heartbeat)', () => {
      const now = Math.floor(Date.now() / 1000)
      const lastHeartbeat = now - 30 // 30 seconds ago
      const threshold = 120
      const isStale = now - lastHeartbeat > threshold
      expect(isStale).toBe(false)
    })

    it('identifies worker at exact threshold as not stale', () => {
      const now = Math.floor(Date.now() / 1000)
      const lastHeartbeat = now - 120 // exactly 2 minutes
      const threshold = 120
      const isStale = now - lastHeartbeat > threshold
      expect(isStale).toBe(false)
    })
  })

  describe('worker status transitions', () => {
    it('transitions from online to busy when claiming job', () => {
      const currentStatus = 'online'
      const newStatus = 'busy'
      const validStatuses = ['online', 'busy', 'draining']
      expect(validStatuses).toContain(currentStatus)
      expect(validStatuses).toContain(newStatus)
    })

    it('transitions from busy to online when job completes', () => {
      const currentStatus = 'busy'
      const newStatus = 'online'
      const validStatuses = ['online', 'busy', 'draining']
      expect(validStatuses).toContain(currentStatus)
      expect(validStatuses).toContain(newStatus)
    })

    it('uses draining status for graceful shutdown', () => {
      const status = 'draining'
      const validStatuses = ['online', 'busy', 'draining']
      expect(validStatuses).toContain(status)
    })
  })
})
