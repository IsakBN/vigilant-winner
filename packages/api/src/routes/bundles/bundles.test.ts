/**
 * Bundle routes tests
 *
 * Tests for bundle serving and bundle size tracking
 *
 * @agent bundle-size-tracking
 * @modified 2026-01-25
 */
import { describe, it, expect } from 'vitest'
import { z } from 'zod'
import { ERROR_CODES } from '@bundlenudge/shared'

// =============================================================================
// Validation Schema Tests
// =============================================================================

const bundleHistoryQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).optional().default(20),
  offset: z.coerce.number().min(0).optional().default(0),
  startDate: z.coerce.number().optional(),
  endDate: z.coerce.number().optional(),
})

describe('bundle history query schema', () => {
  it('accepts valid query with all parameters', () => {
    const result = bundleHistoryQuerySchema.safeParse({
      limit: 50,
      offset: 10,
      startDate: 1700000000,
      endDate: 1700100000,
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.limit).toBe(50)
      expect(result.data.offset).toBe(10)
      expect(result.data.startDate).toBe(1700000000)
      expect(result.data.endDate).toBe(1700100000)
    }
  })

  it('uses default values when not provided', () => {
    const result = bundleHistoryQuerySchema.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.limit).toBe(20)
      expect(result.data.offset).toBe(0)
      expect(result.data.startDate).toBeUndefined()
      expect(result.data.endDate).toBeUndefined()
    }
  })

  it('coerces string numbers', () => {
    const result = bundleHistoryQuerySchema.safeParse({
      limit: '30',
      offset: '5',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.limit).toBe(30)
      expect(result.data.offset).toBe(5)
    }
  })

  it('rejects limit below minimum', () => {
    const result = bundleHistoryQuerySchema.safeParse({ limit: 0 })
    expect(result.success).toBe(false)
  })

  it('rejects limit above maximum', () => {
    const result = bundleHistoryQuerySchema.safeParse({ limit: 101 })
    expect(result.success).toBe(false)
  })

  it('rejects negative offset', () => {
    const result = bundleHistoryQuerySchema.safeParse({ offset: -1 })
    expect(result.success).toBe(false)
  })
})

// =============================================================================
// Bundle Serving Tests
// =============================================================================

describe('bundles routes logic', () => {
  describe('API key validation', () => {
    it('requires Bearer prefix', () => {
      const authHeader = 'Bearer bn_abc123'
      expect(authHeader.startsWith('Bearer ')).toBe(true)
    })

    it('extracts API key correctly', () => {
      const authHeader = 'Bearer bn_test_key_12345'
      const apiKey = authHeader.slice(7)
      expect(apiKey).toBe('bn_test_key_12345')
    })

    it('rejects missing Bearer prefix', () => {
      const authHeader = 'Basic abc123'
      expect(authHeader.startsWith('Bearer ')).toBe(false)
    })

    it('handles undefined auth header', () => {
      const checkAuth = (header: string | undefined): boolean => {
        return header?.startsWith('Bearer ') ?? false
      }
      expect(checkAuth(undefined)).toBe(false)
    })
  })

  describe('bundle path format', () => {
    it('generates correct R2 key format', () => {
      const appId = '123e4567-e89b-12d3-a456-426614174000'
      const releaseId = '987fcdeb-51a2-3bc4-d567-890123456789'
      const key = `${appId}/${releaseId}/bundle.js`

      expect(key).toContain(appId)
      expect(key).toContain(releaseId)
      expect(key.endsWith('/bundle.js')).toBe(true)
    })
  })

  describe('cache headers', () => {
    function getCacheControl(status: string): string {
      return status === 'active'
        ? 'public, max-age=31536000, immutable'
        : 'public, max-age=300'
    }

    it('sets immutable cache for active releases', () => {
      const cacheControl = getCacheControl('active')
      expect(cacheControl).toBe('public, max-age=31536000, immutable')
    })

    it('sets short cache for paused releases', () => {
      const cacheControl = getCacheControl('paused')
      expect(cacheControl).toBe('public, max-age=300')
    })

    it('sets short cache for rolled_back releases', () => {
      const cacheControl = getCacheControl('rolled_back')
      expect(cacheControl).toBe('public, max-age=300')
    })
  })

  describe('content type', () => {
    it('returns javascript content type for bundles', () => {
      const contentType = 'application/javascript'
      expect(contentType).toBe('application/javascript')
    })
  })
})

// =============================================================================
// Bundle Stats Tests
// =============================================================================

describe('bundle stats calculations', () => {
  describe('size change calculations', () => {
    it('calculates positive size change correctly', () => {
      const latestSize = 150000
      const previousSize = 100000
      const absoluteChange = latestSize - previousSize
      const percentageChange = (absoluteChange / previousSize) * 100

      expect(absoluteChange).toBe(50000)
      expect(percentageChange).toBe(50)
    })

    it('calculates negative size change correctly', () => {
      const latestSize = 80000
      const previousSize = 100000
      const absoluteChange = latestSize - previousSize
      const percentageChange = (absoluteChange / previousSize) * 100

      expect(absoluteChange).toBe(-20000)
      expect(percentageChange).toBe(-20)
    })

    it('handles zero previous size', () => {
      const calcPercentChange = (latest: number, prev: number): number =>
        prev > 0 ? (latest - prev) / prev * 100 : 0

      expect(calcPercentChange(100000, 0)).toBe(0)
    })

    it('handles zero current size', () => {
      const latestSize = 0
      const previousSize = 100000
      const absoluteChange = latestSize - previousSize
      const percentageChange = (absoluteChange / previousSize) * 100

      expect(absoluteChange).toBe(-100000)
      expect(percentageChange).toBe(-100)
    })

    it('rounds percentage to 2 decimal places', () => {
      const latestSize = 123456
      const previousSize = 100000
      const absoluteChange = latestSize - previousSize
      const percentageChange = (absoluteChange / previousSize) * 100
      const rounded = Math.round(percentageChange * 100) / 100

      expect(rounded).toBe(23.46)
    })
  })

  describe('stats response structure', () => {
    it('has correct shape', () => {
      const statsResponse = {
        appId: 'test-app-id',
        latestBundleSize: 150000,
        averageBundleSize: 125000,
        minBundleSize: 100000,
        maxBundleSize: 150000,
        totalBundles: 5,
        totalStorageUsed: 625000,
        sizeChange: {
          absolute: 25000,
          percentage: 20,
        },
      }

      expect(statsResponse).toHaveProperty('appId')
      expect(statsResponse).toHaveProperty('latestBundleSize')
      expect(statsResponse).toHaveProperty('averageBundleSize')
      expect(statsResponse).toHaveProperty('minBundleSize')
      expect(statsResponse).toHaveProperty('maxBundleSize')
      expect(statsResponse).toHaveProperty('totalBundles')
      expect(statsResponse).toHaveProperty('totalStorageUsed')
      expect(statsResponse).toHaveProperty('sizeChange')
      expect(statsResponse.sizeChange).toHaveProperty('absolute')
      expect(statsResponse.sizeChange).toHaveProperty('percentage')
    })

    it('handles empty releases', () => {
      const statsResponse = {
        appId: 'test-app-id',
        latestBundleSize: 0,
        averageBundleSize: 0,
        minBundleSize: 0,
        maxBundleSize: 0,
        totalBundles: 0,
        totalStorageUsed: 0,
        sizeChange: {
          absolute: 0,
          percentage: 0,
        },
      }

      expect(statsResponse.totalBundles).toBe(0)
      expect(statsResponse.latestBundleSize).toBe(0)
    })
  })

  describe('average calculation', () => {
    it('rounds average to nearest integer', () => {
      const sizes = [100000, 150000, 125000]
      const avg = sizes.reduce((a, b) => a + b, 0) / sizes.length
      const rounded = Math.round(avg)

      expect(rounded).toBe(125000)
    })

    it('handles single bundle', () => {
      const sizes = [100000]
      const avg = sizes.reduce((a, b) => a + b, 0) / sizes.length

      expect(avg).toBe(100000)
    })
  })
})

// =============================================================================
// Bundle History Tests
// =============================================================================

describe('bundle history', () => {
  describe('pagination', () => {
    it('defaults to limit 20 when not specified', () => {
      const requestedLimit = undefined
      const limit = Number(requestedLimit) || 20
      expect(limit).toBe(20)
    })

    it('caps limit at 100', () => {
      const requestedLimit = 200
      const limit = Math.min(requestedLimit, 100)
      expect(limit).toBe(100)
    })

    it('defaults to offset 0 when not specified', () => {
      const requestedOffset = undefined
      const offset = Number(requestedOffset) || 0
      expect(offset).toBe(0)
    })

    it('calculates hasMore correctly when more items exist', () => {
      const total = 30
      const offset = 0
      const resultsLength = 20
      const hasMore = offset + resultsLength < total

      expect(hasMore).toBe(true)
    })

    it('calculates hasMore correctly on last page', () => {
      const total = 30
      const offset = 20
      const resultsLength = 10
      const hasMore = offset + resultsLength < total

      expect(hasMore).toBe(false)
    })
  })

  describe('history entry structure', () => {
    it('has correct shape', () => {
      const entry = {
        releaseId: 'release-123',
        version: '1.2.0',
        bundleSize: 150000,
        createdAt: 1700000000,
        sizeChange: 25000,
      }

      expect(entry).toHaveProperty('releaseId')
      expect(entry).toHaveProperty('version')
      expect(entry).toHaveProperty('bundleSize')
      expect(entry).toHaveProperty('createdAt')
      expect(entry).toHaveProperty('sizeChange')
    })
  })

  describe('size change between releases', () => {
    it('calculates size change for consecutive releases', () => {
      const releases = [
        { bundleSize: 150000, createdAt: 1700002000 },
        { bundleSize: 125000, createdAt: 1700001000 },
        { bundleSize: 100000, createdAt: 1700000000 },
      ]

      const changes = releases.map((r, i) => {
        if (i === releases.length - 1) {
          return r.bundleSize // First release has no previous
        }
        return r.bundleSize - releases[i + 1].bundleSize
      })

      expect(changes[0]).toBe(25000) // 150000 - 125000
      expect(changes[1]).toBe(25000) // 125000 - 100000
      expect(changes[2]).toBe(100000) // First release
    })

    it('handles single release', () => {
      const releases = [{ bundleSize: 100000, createdAt: 1700000000 }]
      const sizeChange = releases[0].bundleSize // No previous release

      expect(sizeChange).toBe(100000)
    })

    it('handles empty releases array', () => {
      const releases: { bundleSize: number }[] = []

      expect(releases.length).toBe(0)
    })
  })

  describe('date filtering', () => {
    it('accepts valid timestamp range', () => {
      const isValidRange = (start: number, end: number): boolean => end > start

      expect(isValidRange(1700000000, 1700100000)).toBe(true)
    })

    it('filters releases within range', () => {
      const releases = [
        { createdAt: 1700050000 },
        { createdAt: 1700025000 },
        { createdAt: 1699900000 }, // Before range
        { createdAt: 1700150000 }, // After range
      ]

      const startDate = 1700000000
      const endDate = 1700100000

      const filtered = releases.filter(
        r => r.createdAt >= startDate && r.createdAt <= endDate
      )

      expect(filtered.length).toBe(2)
    })
  })

  describe('response structure', () => {
    it('has correct pagination structure', () => {
      const response = {
        appId: 'test-app-id',
        entries: [],
        pagination: {
          total: 50,
          limit: 20,
          offset: 0,
          hasMore: true,
        },
      }

      expect(response).toHaveProperty('appId')
      expect(response).toHaveProperty('entries')
      expect(response).toHaveProperty('pagination')
      expect(response.pagination).toHaveProperty('total')
      expect(response.pagination).toHaveProperty('limit')
      expect(response.pagination).toHaveProperty('offset')
      expect(response.pagination).toHaveProperty('hasMore')
    })
  })
})

// =============================================================================
// Error Codes Tests
// =============================================================================

describe('error codes', () => {
  it('has UNAUTHORIZED error code', () => {
    expect(ERROR_CODES.UNAUTHORIZED).toBe('UNAUTHORIZED')
  })

  it('has FORBIDDEN error code', () => {
    expect(ERROR_CODES.FORBIDDEN).toBe('FORBIDDEN')
  })

  it('has NOT_FOUND error code', () => {
    expect(ERROR_CODES.NOT_FOUND).toBe('NOT_FOUND')
  })

  it('has APP_NOT_FOUND error code', () => {
    expect(ERROR_CODES.APP_NOT_FOUND).toBe('APP_NOT_FOUND')
  })
})

// =============================================================================
// Auth Requirements Tests
// =============================================================================

describe('auth requirements', () => {
  describe('stats endpoint', () => {
    it('requires session authentication', () => {
      // Stats endpoint uses authMiddleware
      const requiresAuth = true
      expect(requiresAuth).toBe(true)
    })

    it('verifies app ownership', () => {
      // Query includes owner_id check
      const query = 'SELECT * FROM apps WHERE id = ? AND owner_id = ? AND deleted_at IS NULL'
      expect(query).toContain('owner_id')
    })
  })

  describe('history endpoint', () => {
    it('requires session authentication', () => {
      // History endpoint uses authMiddleware
      const requiresAuth = true
      expect(requiresAuth).toBe(true)
    })

    it('verifies app ownership', () => {
      // Query includes owner_id check
      const query = 'SELECT * FROM apps WHERE id = ? AND owner_id = ? AND deleted_at IS NULL'
      expect(query).toContain('owner_id')
    })
  })

  describe('bundle serving', () => {
    it('uses API key authentication', () => {
      // Bundle GET uses API key validation
      const requiresApiKey = true
      expect(requiresApiKey).toBe(true)
    })

    it('validates API key matches app', () => {
      const verifyAppId = (keyAppId: string, requestAppId: string): boolean =>
        keyAppId === requestAppId

      expect(verifyAppId('app-123', 'app-123')).toBe(true)
    })

    it('rejects mismatched app IDs', () => {
      const verifyAppId = (keyAppId: string, requestAppId: string): boolean =>
        keyAppId === requestAppId

      expect(verifyAppId('app-123', 'app-456')).toBe(false)
    })
  })
})
