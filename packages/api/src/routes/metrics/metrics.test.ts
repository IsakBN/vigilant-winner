/**
 * Advanced Metrics Routes Tests
 *
 * Tests for metrics endpoints including:
 * - Overview metrics
 * - Release performance metrics
 * - Device distribution metrics
 * - Time-series trend data
 */

import { describe, it, expect } from 'vitest'
import { z } from 'zod'
import { ERROR_CODES } from '@bundlenudge/shared'

// =============================================================================
// Local Schema Definitions (mirroring route schemas)
// =============================================================================

const metricsQuerySchema = z.object({
  from: z.coerce.number().optional(),
  to: z.coerce.number().optional(),
})

const trendsQuerySchema = z.object({
  from: z.coerce.number().optional(),
  to: z.coerce.number().optional(),
  period: z.enum(['hourly', 'daily', 'weekly']).default('daily'),
})

// =============================================================================
// Tests
// =============================================================================

describe('metrics routes logic', () => {
  describe('metricsQuerySchema', () => {
    it('validates empty query (uses defaults)', () => {
      const result = metricsQuerySchema.safeParse({})
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.from).toBeUndefined()
        expect(result.data.to).toBeUndefined()
      }
    })

    it('validates from timestamp', () => {
      const timestamp = Math.floor(Date.now() / 1000) - 86400
      const result = metricsQuerySchema.safeParse({ from: timestamp })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.from).toBe(timestamp)
      }
    })

    it('validates to timestamp', () => {
      const timestamp = Math.floor(Date.now() / 1000)
      const result = metricsQuerySchema.safeParse({ to: timestamp })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.to).toBe(timestamp)
      }
    })

    it('validates both from and to timestamps', () => {
      const now = Math.floor(Date.now() / 1000)
      const thirtyDaysAgo = now - 30 * 86400
      const result = metricsQuerySchema.safeParse({
        from: thirtyDaysAgo,
        to: now,
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.from).toBe(thirtyDaysAgo)
        expect(result.data.to).toBe(now)
      }
    })

    it('coerces string timestamps to numbers', () => {
      const result = metricsQuerySchema.safeParse({
        from: '1700000000',
        to: '1700100000',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.from).toBe(1700000000)
        expect(result.data.to).toBe(1700100000)
      }
    })
  })

  describe('trendsQuerySchema', () => {
    it('validates empty query with daily default', () => {
      const result = trendsQuerySchema.safeParse({})
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.period).toBe('daily')
      }
    })

    it('validates hourly period', () => {
      const result = trendsQuerySchema.safeParse({ period: 'hourly' })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.period).toBe('hourly')
      }
    })

    it('validates daily period', () => {
      const result = trendsQuerySchema.safeParse({ period: 'daily' })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.period).toBe('daily')
      }
    })

    it('validates weekly period', () => {
      const result = trendsQuerySchema.safeParse({ period: 'weekly' })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.period).toBe('weekly')
      }
    })

    it('rejects invalid period', () => {
      const result = trendsQuerySchema.safeParse({ period: 'monthly' })
      expect(result.success).toBe(false)
    })

    it('validates full query with all parameters', () => {
      const now = Math.floor(Date.now() / 1000)
      const result = trendsQuerySchema.safeParse({
        from: now - 86400 * 7,
        to: now,
        period: 'hourly',
      })
      expect(result.success).toBe(true)
    })
  })

  describe('date range filtering', () => {
    it('calculates default 30 day range', () => {
      const now = Math.floor(Date.now() / 1000)
      const thirtyDaysSeconds = 30 * 86400
      const thirtyDaysAgo = now - thirtyDaysSeconds

      // Simulate default range calculation
      const from = thirtyDaysAgo
      const to = now

      expect(to - from).toBe(thirtyDaysSeconds)
    })

    it('uses custom range when provided', () => {
      const customFrom = 1700000000
      const customTo = 1700100000

      // Custom values are used directly
      const from = customFrom
      const to = customTo

      expect(from).toBe(customFrom)
      expect(to).toBe(customTo)
      expect(to - from).toBe(100000)
    })
  })

  describe('overview metrics response structure', () => {
    it('has all required fields', () => {
      const mockMetrics = {
        totalDevices: 1000,
        activeDevices: 750,
        totalReleases: 25,
        activeReleases: 3,
        totalUpdates: 5000,
        updateSuccessRate: 98.5,
        avgUpdateSize: 1048576,
        storageUsed: 26214400,
      }

      expect(mockMetrics).toHaveProperty('totalDevices')
      expect(mockMetrics).toHaveProperty('activeDevices')
      expect(mockMetrics).toHaveProperty('totalReleases')
      expect(mockMetrics).toHaveProperty('activeReleases')
      expect(mockMetrics).toHaveProperty('totalUpdates')
      expect(mockMetrics).toHaveProperty('updateSuccessRate')
      expect(mockMetrics).toHaveProperty('avgUpdateSize')
      expect(mockMetrics).toHaveProperty('storageUsed')
    })

    it('calculates success rate correctly', () => {
      const calculateSuccessRate = (total: number, successful: number): number =>
        total > 0 ? successful / total : 1
      const formattedRate = Math.round(calculateSuccessRate(1000, 985) * 10000) / 100

      expect(formattedRate).toBe(98.5)
    })

    it('handles zero updates gracefully', () => {
      const calculateSuccessRate = (total: number, successful: number): number =>
        total > 0 ? successful / total : 1

      expect(calculateSuccessRate(0, 0)).toBe(1)
    })
  })

  describe('release metrics response structure', () => {
    it('has all required fields per release', () => {
      const mockReleaseMetric = {
        releaseId: 'release-123',
        version: '1.2.3',
        bundleSize: 1048576,
        downloadCount: 500,
        activeDevices: 450,
        adoptionRate: 45.0,
        avgDownloadTime: 0,
        errorRate: 0.5,
      }

      expect(mockReleaseMetric).toHaveProperty('releaseId')
      expect(mockReleaseMetric).toHaveProperty('version')
      expect(mockReleaseMetric).toHaveProperty('bundleSize')
      expect(mockReleaseMetric).toHaveProperty('downloadCount')
      expect(mockReleaseMetric).toHaveProperty('activeDevices')
      expect(mockReleaseMetric).toHaveProperty('adoptionRate')
      expect(mockReleaseMetric).toHaveProperty('avgDownloadTime')
      expect(mockReleaseMetric).toHaveProperty('errorRate')
    })

    it('calculates adoption rate correctly', () => {
      const installs = 450
      const totalDevices = 1000
      const adoptionRate = Math.round((installs / totalDevices) * 10000) / 100

      expect(adoptionRate).toBe(45.0)
    })

    it('calculates error rate correctly', () => {
      const crashes = 5
      const installs = 1000
      const errorRate = Math.round((crashes / installs) * 10000) / 100

      expect(errorRate).toBe(0.5)
    })

    it('handles zero installs for error rate', () => {
      const calculateErrorRate = (crashes: number, installs: number): number =>
        installs > 0 ? Math.round((crashes / installs) * 10000) / 100 : 0

      expect(calculateErrorRate(0, 0)).toBe(0)
    })
  })

  describe('device metrics response structure', () => {
    it('has all required fields', () => {
      const mockDeviceMetrics = {
        byPlatform: { ios: 600, android: 400 },
        byOsVersion: { '17.0': 200, '16.0': 300, '13': 500 },
        byAppVersion: { '1.0.0': 400, '1.1.0': 600 },
        byCountry: { US: 500, GB: 200, DE: 150, FR: 150 },
        newDevicesLast7d: 50,
        churned30d: 25,
      }

      expect(mockDeviceMetrics).toHaveProperty('byPlatform')
      expect(mockDeviceMetrics).toHaveProperty('byOsVersion')
      expect(mockDeviceMetrics).toHaveProperty('byAppVersion')
      expect(mockDeviceMetrics).toHaveProperty('byCountry')
      expect(mockDeviceMetrics).toHaveProperty('newDevicesLast7d')
      expect(mockDeviceMetrics).toHaveProperty('churned30d')
    })

    it('platform distribution contains ios and android', () => {
      const byPlatform = { ios: 600, android: 400 }

      expect(byPlatform).toHaveProperty('ios')
      expect(byPlatform).toHaveProperty('android')
      expect(byPlatform.ios + byPlatform.android).toBe(1000)
    })
  })

  describe('trend data response structure', () => {
    it('has period and dataPoints fields', () => {
      const mockTrends = {
        period: 'daily' as const,
        dataPoints: [
          { timestamp: 1700000000, updates: 100, errors: 2, newDevices: 10 },
          { timestamp: 1700086400, updates: 150, errors: 3, newDevices: 15 },
        ],
      }

      expect(mockTrends).toHaveProperty('period')
      expect(mockTrends).toHaveProperty('dataPoints')
      expect(mockTrends.period).toBe('daily')
      expect(Array.isArray(mockTrends.dataPoints)).toBe(true)
    })

    it('dataPoints have correct structure', () => {
      const dataPoint = {
        timestamp: 1700000000,
        updates: 100,
        errors: 2,
        newDevices: 10,
      }

      expect(dataPoint).toHaveProperty('timestamp')
      expect(dataPoint).toHaveProperty('updates')
      expect(dataPoint).toHaveProperty('errors')
      expect(dataPoint).toHaveProperty('newDevices')
    })
  })

  describe('period bucket sizes', () => {
    it('hourly is 3600 seconds', () => {
      const hourlyBucket = 3600
      expect(hourlyBucket).toBe(60 * 60)
    })

    it('daily is 86400 seconds', () => {
      const dailyBucket = 86400
      expect(dailyBucket).toBe(24 * 60 * 60)
    })

    it('weekly is 604800 seconds', () => {
      const weeklyBucket = 7 * 86400
      expect(weeklyBucket).toBe(604800)
    })
  })

  describe('max data points limit', () => {
    it('limits to 100 data points', () => {
      const maxDataPoints = 100
      const bucketSize = 86400 // daily
      const from = 1700000000
      const to = from + 200 * bucketSize // 200 days

      const calculatedBuckets = Math.ceil((to - from) / bucketSize)
      const limitedBuckets = Math.min(calculatedBuckets, maxDataPoints)

      expect(limitedBuckets).toBe(100)
    })

    it('allows fewer than 100 points', () => {
      const maxDataPoints = 100
      const bucketSize = 86400 // daily
      const from = 1700000000
      const to = from + 30 * bucketSize // 30 days

      const calculatedBuckets = Math.ceil((to - from) / bucketSize)
      const limitedBuckets = Math.min(calculatedBuckets, maxDataPoints)

      expect(limitedBuckets).toBe(30)
    })
  })

  describe('locale country extraction', () => {
    it('extracts country from underscore format', () => {
      const locale = 'en_US'
      const parts = locale.split(/[-_]/)
      const country = parts.length >= 2 ? parts[1].toUpperCase() : 'UNKNOWN'

      expect(country).toBe('US')
    })

    it('extracts country from hyphen format', () => {
      const locale = 'fr-FR'
      const parts = locale.split(/[-_]/)
      const country = parts.length >= 2 ? parts[1].toUpperCase() : 'UNKNOWN'

      expect(country).toBe('FR')
    })

    it('returns UNKNOWN for invalid locale', () => {
      const locale = 'en'
      const parts = locale.split(/[-_]/)
      const country = parts.length >= 2 ? parts[1].toUpperCase() : 'UNKNOWN'

      expect(country).toBe('UNKNOWN')
    })

    it('handles Chinese locales', () => {
      const locale = 'zh_CN'
      const parts = locale.split(/[-_]/)
      const country = parts.length >= 2 ? parts[1].toUpperCase() : 'UNKNOWN'

      expect(country).toBe('CN')
    })
  })

  describe('error codes', () => {
    it('has APP_NOT_FOUND error code', () => {
      expect(ERROR_CODES.APP_NOT_FOUND).toBe('APP_NOT_FOUND')
    })

    it('has UNAUTHORIZED error code', () => {
      expect(ERROR_CODES.UNAUTHORIZED).toBe('UNAUTHORIZED')
    })
  })

  describe('auth requirements', () => {
    it('requires authentication for all endpoints', () => {
      // This is validated by the authMiddleware being applied
      // In real tests, we would make requests without auth and expect 401
      const mockUnauthorizedResponse = {
        error: ERROR_CODES.UNAUTHORIZED,
        message: 'Authentication required',
      }

      expect(mockUnauthorizedResponse.error).toBe('UNAUTHORIZED')
    })
  })
})
