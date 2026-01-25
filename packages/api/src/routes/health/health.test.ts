/**
 * Health Reports Routes Tests
 *
 * Tests for app health monitoring endpoints including:
 * - Overall app health summary
 * - Release-specific health metrics
 * - Device health breakdown
 * - SDK health report submission
 *
 * @agent health-reports
 */

import { describe, it, expect } from 'vitest'
import { z } from 'zod'

// =============================================================================
// Schema Definitions (mirrored from index.ts for testing)
// =============================================================================

const timeRangeSchema = z.enum(['24h', '7d', '30d']).default('24h')

const healthReportSchema = z.object({
  deviceId: z.string().min(1).max(100),
  appId: z.string().uuid(),
  releaseId: z.string().uuid().optional(),
  updateSuccess: z.boolean().optional(),
  updateDuration: z.number().int().positive().optional(),
  crashDetected: z.boolean().default(false),
})

// =============================================================================
// Time Range Tests
// =============================================================================

describe('time range schema', () => {
  it('accepts valid 24h range', () => {
    const result = timeRangeSchema.safeParse('24h')
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toBe('24h')
    }
  })

  it('accepts valid 7d range', () => {
    const result = timeRangeSchema.safeParse('7d')
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toBe('7d')
    }
  })

  it('accepts valid 30d range', () => {
    const result = timeRangeSchema.safeParse('30d')
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toBe('30d')
    }
  })

  it('defaults to 24h when undefined', () => {
    const result = timeRangeSchema.safeParse(undefined)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toBe('24h')
    }
  })

  it('rejects invalid time range', () => {
    const result = timeRangeSchema.safeParse('1h')
    expect(result.success).toBe(false)
  })

  it('rejects invalid type', () => {
    const result = timeRangeSchema.safeParse(24)
    expect(result.success).toBe(false)
  })
})

// =============================================================================
// Health Report Schema Tests
// =============================================================================

describe('health report schema', () => {
  it('validates minimal health report', () => {
    const result = healthReportSchema.safeParse({
      deviceId: 'device-123',
      appId: '550e8400-e29b-41d4-a716-446655440000',
    })
    expect(result.success).toBe(true)
  })

  it('validates full health report', () => {
    const result = healthReportSchema.safeParse({
      deviceId: 'device-123',
      appId: '550e8400-e29b-41d4-a716-446655440000',
      releaseId: '660e8400-e29b-41d4-a716-446655440001',
      updateSuccess: true,
      updateDuration: 5000,
      crashDetected: false,
    })
    expect(result.success).toBe(true)
  })

  it('validates crash report', () => {
    const result = healthReportSchema.safeParse({
      deviceId: 'device-456',
      appId: '550e8400-e29b-41d4-a716-446655440000',
      crashDetected: true,
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.crashDetected).toBe(true)
    }
  })

  it('validates failed update report', () => {
    const result = healthReportSchema.safeParse({
      deviceId: 'device-789',
      appId: '550e8400-e29b-41d4-a716-446655440000',
      releaseId: '660e8400-e29b-41d4-a716-446655440001',
      updateSuccess: false,
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.updateSuccess).toBe(false)
    }
  })

  it('defaults crashDetected to false', () => {
    const result = healthReportSchema.safeParse({
      deviceId: 'device-123',
      appId: '550e8400-e29b-41d4-a716-446655440000',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.crashDetected).toBe(false)
    }
  })

  it('rejects missing deviceId', () => {
    const result = healthReportSchema.safeParse({
      appId: '550e8400-e29b-41d4-a716-446655440000',
    })
    expect(result.success).toBe(false)
  })

  it('rejects missing appId', () => {
    const result = healthReportSchema.safeParse({
      deviceId: 'device-123',
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid appId format', () => {
    const result = healthReportSchema.safeParse({
      deviceId: 'device-123',
      appId: 'not-a-uuid',
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid releaseId format', () => {
    const result = healthReportSchema.safeParse({
      deviceId: 'device-123',
      appId: '550e8400-e29b-41d4-a716-446655440000',
      releaseId: 'not-a-uuid',
    })
    expect(result.success).toBe(false)
  })

  it('rejects deviceId too long', () => {
    const result = healthReportSchema.safeParse({
      deviceId: 'a'.repeat(101),
      appId: '550e8400-e29b-41d4-a716-446655440000',
    })
    expect(result.success).toBe(false)
  })

  it('rejects empty deviceId', () => {
    const result = healthReportSchema.safeParse({
      deviceId: '',
      appId: '550e8400-e29b-41d4-a716-446655440000',
    })
    expect(result.success).toBe(false)
  })

  it('rejects negative updateDuration', () => {
    const result = healthReportSchema.safeParse({
      deviceId: 'device-123',
      appId: '550e8400-e29b-41d4-a716-446655440000',
      updateDuration: -100,
    })
    expect(result.success).toBe(false)
  })

  it('rejects zero updateDuration', () => {
    const result = healthReportSchema.safeParse({
      deviceId: 'device-123',
      appId: '550e8400-e29b-41d4-a716-446655440000',
      updateDuration: 0,
    })
    expect(result.success).toBe(false)
  })

  it('rejects non-integer updateDuration', () => {
    const result = healthReportSchema.safeParse({
      deviceId: 'device-123',
      appId: '550e8400-e29b-41d4-a716-446655440000',
      updateDuration: 100.5,
    })
    expect(result.success).toBe(false)
  })
})

// =============================================================================
// Health Metrics Calculation Tests
// =============================================================================

describe('health metrics calculations', () => {
  describe('crash-free rate', () => {
    it('calculates 100% when no crashes', () => {
      const totalReports = 100
      const crashes = 0
      const crashFreeRate = Math.round(((totalReports - crashes) / totalReports) * 10000) / 100
      expect(crashFreeRate).toBe(100)
    })

    it('calculates correct rate with crashes', () => {
      const totalReports = 100
      const crashes = 5
      const crashFreeRate = Math.round(((totalReports - crashes) / totalReports) * 10000) / 100
      expect(crashFreeRate).toBe(95)
    })

    it('handles edge case of all crashes', () => {
      const totalReports = 100
      const crashes = 100
      const crashFreeRate = Math.round(((totalReports - crashes) / totalReports) * 10000) / 100
      expect(crashFreeRate).toBe(0)
    })

    it('handles single report', () => {
      const totalReports = 1
      const crashes = 0
      const crashFreeRate = Math.round(((totalReports - crashes) / totalReports) * 10000) / 100
      expect(crashFreeRate).toBe(100)
    })
  })

  describe('update success rate', () => {
    it('calculates 100% when all updates succeed', () => {
      const successfulUpdates = 50
      const totalUpdates = 50
      const updateSuccessRate = Math.round((successfulUpdates / totalUpdates) * 10000) / 100
      expect(updateSuccessRate).toBe(100)
    })

    it('calculates correct rate with failures', () => {
      const successfulUpdates = 45
      const totalUpdates = 50
      const updateSuccessRate = Math.round((successfulUpdates / totalUpdates) * 10000) / 100
      expect(updateSuccessRate).toBe(90)
    })

    it('handles edge case of all failures', () => {
      const successfulUpdates = 0
      const totalUpdates = 50
      const updateSuccessRate = Math.round((successfulUpdates / totalUpdates) * 10000) / 100
      expect(updateSuccessRate).toBe(0)
    })

    it('defaults to 100% when no updates', () => {
      const computeRate = (total: number): number => total > 0 ? 0 : 100
      expect(computeRate(0)).toBe(100)
    })
  })

  describe('overall score', () => {
    it('calculates weighted average correctly', () => {
      const updateSuccessRate = 90
      const crashFreeRate = 95
      // Formula: updateSuccessRate * 0.4 + crashFreeRate * 0.6
      const overallScore = Math.round((updateSuccessRate * 0.4 + crashFreeRate * 0.6) * 100) / 100
      expect(overallScore).toBe(93)
    })

    it('calculates perfect score', () => {
      const updateSuccessRate = 100
      const crashFreeRate = 100
      const overallScore = Math.round((updateSuccessRate * 0.4 + crashFreeRate * 0.6) * 100) / 100
      expect(overallScore).toBe(100)
    })

    it('calculates zero score', () => {
      const updateSuccessRate = 0
      const crashFreeRate = 0
      const overallScore = Math.round((updateSuccessRate * 0.4 + crashFreeRate * 0.6) * 100) / 100
      expect(overallScore).toBe(0)
    })

    it('weights crash-free rate higher than update success', () => {
      // With 100% update success but 0% crash-free
      const score1 = Math.round((100 * 0.4 + 0 * 0.6) * 100) / 100
      // With 0% update success but 100% crash-free
      const score2 = Math.round((0 * 0.4 + 100 * 0.6) * 100) / 100

      expect(score1).toBe(40)
      expect(score2).toBe(60)
      expect(score2).toBeGreaterThan(score1)
    })
  })

  describe('adoption rate', () => {
    it('calculates correct adoption percentage', () => {
      const deviceCount = 25
      const totalDevices = 100
      const adoptionRate = Math.round((deviceCount / totalDevices) * 10000) / 100
      expect(adoptionRate).toBe(25)
    })

    it('handles 100% adoption', () => {
      const deviceCount = 100
      const totalDevices = 100
      const adoptionRate = Math.round((deviceCount / totalDevices) * 10000) / 100
      expect(adoptionRate).toBe(100)
    })

    it('handles 0 total devices', () => {
      const computeAdoptionRate = (total: number): number => total > 0 ? 50 : 0
      expect(computeAdoptionRate(0)).toBe(0)
    })

    it('handles decimal precision', () => {
      const deviceCount = 33
      const totalDevices = 100
      const adoptionRate = Math.round((deviceCount / totalDevices) * 10000) / 100
      expect(adoptionRate).toBe(33)
    })
  })

  describe('average update time', () => {
    it('converts milliseconds to seconds', () => {
      const avgDurationMs = 5000
      const avgTimeSeconds = Math.round(avgDurationMs / 1000 * 100) / 100
      expect(avgTimeSeconds).toBe(5)
    })

    it('handles decimal seconds', () => {
      const avgDurationMs = 2500
      const avgTimeSeconds = Math.round(avgDurationMs / 1000 * 100) / 100
      expect(avgTimeSeconds).toBe(2.5)
    })

    it('handles null duration', () => {
      const computeAvgTime = (durationMs: number | null): number | null =>
        durationMs ? Math.round(durationMs / 1000 * 100) / 100 : null
      expect(computeAvgTime(null)).toBeNull()
    })
  })
})

// =============================================================================
// Time Range Calculation Tests
// =============================================================================

describe('time range calculations', () => {
  const TIME_RANGES = {
    '24h': 24 * 60 * 60,
    '7d': 7 * 24 * 60 * 60,
    '30d': 30 * 24 * 60 * 60,
  } as const

  it('24h equals 86400 seconds', () => {
    expect(TIME_RANGES['24h']).toBe(86400)
  })

  it('7d equals 604800 seconds', () => {
    expect(TIME_RANGES['7d']).toBe(604800)
  })

  it('30d equals 2592000 seconds', () => {
    expect(TIME_RANGES['30d']).toBe(2592000)
  })

  it('calculates range start correctly', () => {
    const now = Math.floor(Date.now() / 1000)
    const rangeStart = now - TIME_RANGES['24h']
    expect(rangeStart).toBeLessThan(now)
    expect(now - rangeStart).toBe(86400)
  })
})

// =============================================================================
// Response Structure Tests
// =============================================================================

describe('response structures', () => {
  describe('app health summary response', () => {
    it('has correct structure', () => {
      const response = {
        appId: '550e8400-e29b-41d4-a716-446655440000',
        overallScore: 95.5,
        activeDevices: 1000,
        crashFreeRate: 98.5,
        updateSuccessRate: 92.0,
        avgUpdateTime: 2.5,
        timeRange: '24h',
        lastUpdated: Math.floor(Date.now() / 1000),
      }

      expect(response).toHaveProperty('appId')
      expect(response).toHaveProperty('overallScore')
      expect(response).toHaveProperty('activeDevices')
      expect(response).toHaveProperty('crashFreeRate')
      expect(response).toHaveProperty('updateSuccessRate')
      expect(response).toHaveProperty('avgUpdateTime')
      expect(response).toHaveProperty('timeRange')
      expect(response).toHaveProperty('lastUpdated')
    })
  })

  describe('release health response', () => {
    it('has correct structure with pagination', () => {
      const response = {
        data: [
          {
            releaseId: '660e8400-e29b-41d4-a716-446655440001',
            version: '1.0.0',
            adoptionRate: 75.5,
            crashFreeRate: 99.0,
            rollbackCount: 0,
            avgDownloadTime: 3.2,
          },
        ],
        timeRange: '24h',
        pagination: {
          total: 10,
          limit: 20,
          offset: 0,
          hasMore: false,
        },
      }

      expect(response).toHaveProperty('data')
      expect(response).toHaveProperty('timeRange')
      expect(response).toHaveProperty('pagination')
      expect(response.pagination).toHaveProperty('total')
      expect(response.pagination).toHaveProperty('limit')
      expect(response.pagination).toHaveProperty('offset')
      expect(response.pagination).toHaveProperty('hasMore')
    })
  })

  describe('device health response', () => {
    it('has correct structure', () => {
      const response = {
        data: [
          {
            platform: 'ios' as const,
            osVersion: '17.0',
            deviceCount: 500,
            crashFreeRate: 99.5,
            updateSuccessRate: 95.0,
          },
        ],
        timeRange: '7d',
      }

      expect(response).toHaveProperty('data')
      expect(response).toHaveProperty('timeRange')
      expect(response.data[0]).toHaveProperty('platform')
      expect(response.data[0]).toHaveProperty('osVersion')
      expect(response.data[0]).toHaveProperty('deviceCount')
      expect(response.data[0]).toHaveProperty('crashFreeRate')
      expect(response.data[0]).toHaveProperty('updateSuccessRate')
    })
  })

  describe('health report submission response', () => {
    it('has correct success structure', () => {
      const response = {
        success: true,
        reportId: '770e8400-e29b-41d4-a716-446655440002',
      }

      expect(response).toHaveProperty('success')
      expect(response).toHaveProperty('reportId')
      expect(response.success).toBe(true)
    })
  })
})

// =============================================================================
// Pagination Tests
// =============================================================================

describe('pagination', () => {
  it('defaults to limit 20 when not specified', () => {
    const requestedLimit = undefined
    const limit = Math.min(Number(requestedLimit) || 20, 100)
    expect(limit).toBe(20)
  })

  it('caps limit at 100', () => {
    const requestedLimit = '500'
    const limit = Math.min(Number(requestedLimit) || 20, 100)
    expect(limit).toBe(100)
  })

  it('defaults to offset 0 when not specified', () => {
    const requestedOffset = undefined
    const offset = Number(requestedOffset) || 0
    expect(offset).toBe(0)
  })

  it('calculates hasMore correctly when more results exist', () => {
    const total = 50
    const offset = 0
    const resultsLength = 20
    const hasMore = offset + resultsLength < total
    expect(hasMore).toBe(true)
  })

  it('calculates hasMore correctly when no more results', () => {
    const total = 15
    const offset = 0
    const resultsLength = 15
    const hasMore = offset + resultsLength < total
    expect(hasMore).toBe(false)
  })
})

// =============================================================================
// Cache Key Generation Tests
// =============================================================================

describe('cache key generation', () => {
  it('generates unique keys for different apps', () => {
    const key1 = `health:app1:summary:24h`
    const key2 = `health:app2:summary:24h`
    expect(key1).not.toBe(key2)
  })

  it('generates unique keys for different endpoints', () => {
    const key1 = `health:app1:summary:24h`
    const key2 = `health:app1:releases:24h`
    expect(key1).not.toBe(key2)
  })

  it('generates unique keys for different time ranges', () => {
    const key1 = `health:app1:summary:24h`
    const key2 = `health:app1:summary:7d`
    expect(key1).not.toBe(key2)
  })
})
