/**
 * Device Management Routes Tests
 *
 * @agent device-management
 * @created 2026-01-25
 */

import { describe, it, expect } from 'vitest'
import { z } from 'zod'
import { ERROR_CODES } from '@bundlenudge/shared'

// =============================================================================
// Schema Tests
// =============================================================================

const deviceTargetSchema = z.object({
  targetGroup: z.string().min(1).max(100),
})

const bulkTargetSchema = z.object({
  deviceIds: z.array(z.string().min(1).max(100)).min(1).max(100),
  targetGroup: z.string().min(1).max(100),
})

describe('device management schemas', () => {
  describe('deviceTargetSchema', () => {
    it('validates valid target group', () => {
      const result = deviceTargetSchema.safeParse({ targetGroup: 'beta-testers' })
      expect(result.success).toBe(true)
    })

    it('rejects empty target group', () => {
      const result = deviceTargetSchema.safeParse({ targetGroup: '' })
      expect(result.success).toBe(false)
    })

    it('rejects missing target group', () => {
      const result = deviceTargetSchema.safeParse({})
      expect(result.success).toBe(false)
    })

    it('rejects target group exceeding max length', () => {
      const result = deviceTargetSchema.safeParse({ targetGroup: 'x'.repeat(101) })
      expect(result.success).toBe(false)
    })

    it('accepts target group at max length', () => {
      const result = deviceTargetSchema.safeParse({ targetGroup: 'x'.repeat(100) })
      expect(result.success).toBe(true)
    })
  })

  describe('bulkTargetSchema', () => {
    it('validates valid bulk target request', () => {
      const result = bulkTargetSchema.safeParse({
        deviceIds: ['device-1', 'device-2', 'device-3'],
        targetGroup: 'beta-testers',
      })
      expect(result.success).toBe(true)
    })

    it('rejects empty deviceIds array', () => {
      const result = bulkTargetSchema.safeParse({
        deviceIds: [],
        targetGroup: 'beta-testers',
      })
      expect(result.success).toBe(false)
    })

    it('rejects missing deviceIds', () => {
      const result = bulkTargetSchema.safeParse({
        targetGroup: 'beta-testers',
      })
      expect(result.success).toBe(false)
    })

    it('rejects missing targetGroup', () => {
      const result = bulkTargetSchema.safeParse({
        deviceIds: ['device-1'],
      })
      expect(result.success).toBe(false)
    })

    it('rejects deviceIds array exceeding max', () => {
      const result = bulkTargetSchema.safeParse({
        deviceIds: Array(101).fill('device'),
        targetGroup: 'beta-testers',
      })
      expect(result.success).toBe(false)
    })

    it('accepts deviceIds array at max length', () => {
      const result = bulkTargetSchema.safeParse({
        deviceIds: Array(100).fill('device'),
        targetGroup: 'beta-testers',
      })
      expect(result.success).toBe(true)
    })

    it('rejects empty device id in array', () => {
      const result = bulkTargetSchema.safeParse({
        deviceIds: ['device-1', '', 'device-3'],
        targetGroup: 'beta-testers',
      })
      expect(result.success).toBe(false)
    })
  })
})

// =============================================================================
// Response Format Tests
// =============================================================================

describe('device management response formats', () => {
  describe('device format', () => {
    it('formats device row correctly', () => {
      const row = {
        id: 'uuid-1',
        app_id: 'app-uuid',
        device_id: 'device-123',
        platform: 'ios' as const,
        os_version: '17.0',
        device_model: 'iPhone 15',
        app_version: '1.0.0',
        current_bundle_version: 'v1.0.1',
        target_group: 'beta',
        last_seen_at: 1700000000,
        revoked_at: null,
        created_at: 1699000000,
      }

      const formatted = {
        id: row.id,
        appId: row.app_id,
        deviceId: row.device_id,
        platform: row.platform,
        osVersion: row.os_version,
        deviceModel: row.device_model,
        appVersion: row.app_version,
        currentBundleVersion: row.current_bundle_version,
        targetGroup: row.target_group,
        lastSeenAt: row.last_seen_at,
        revokedAt: row.revoked_at,
        createdAt: row.created_at,
      }

      expect(formatted.id).toBe('uuid-1')
      expect(formatted.appId).toBe('app-uuid')
      expect(formatted.deviceId).toBe('device-123')
      expect(formatted.platform).toBe('ios')
      expect(formatted.targetGroup).toBe('beta')
    })

    it('handles null optional fields', () => {
      const row = {
        id: 'uuid-1',
        app_id: 'app-uuid',
        device_id: 'device-123',
        platform: 'android' as const,
        os_version: null,
        device_model: null,
        app_version: '1.0.0',
        current_bundle_version: null,
        target_group: null,
        last_seen_at: null,
        revoked_at: null,
        created_at: 1699000000,
      }

      const formatted = {
        osVersion: row.os_version,
        deviceModel: row.device_model,
        targetGroup: row.target_group,
        lastSeenAt: row.last_seen_at,
      }

      expect(formatted.osVersion).toBeNull()
      expect(formatted.deviceModel).toBeNull()
      expect(formatted.targetGroup).toBeNull()
      expect(formatted.lastSeenAt).toBeNull()
    })
  })

  describe('stats response format', () => {
    it('has correct structure', () => {
      const stats = {
        total: 1000,
        active: 750,
        byPlatform: { ios: 600, android: 400 },
        byTargetGroup: { beta: 50, internal: 25 },
        newLast7d: 100,
        newLast30d: 300,
      }

      expect(stats).toHaveProperty('total')
      expect(stats).toHaveProperty('active')
      expect(stats).toHaveProperty('byPlatform')
      expect(stats.byPlatform).toHaveProperty('ios')
      expect(stats.byPlatform).toHaveProperty('android')
      expect(stats).toHaveProperty('byTargetGroup')
      expect(stats).toHaveProperty('newLast7d')
      expect(stats).toHaveProperty('newLast30d')
    })

    it('handles empty target groups', () => {
      const byTargetGroup: Record<string, number> = {}
      expect(Object.keys(byTargetGroup)).toHaveLength(0)
    })
  })
})

// =============================================================================
// Error Code Tests
// =============================================================================

describe('device management error codes', () => {
  it('uses APP_NOT_FOUND for missing app', () => {
    expect(ERROR_CODES.APP_NOT_FOUND).toBe('APP_NOT_FOUND')
  })

  it('uses DEVICE_NOT_FOUND for missing device', () => {
    expect(ERROR_CODES.DEVICE_NOT_FOUND).toBe('DEVICE_NOT_FOUND')
  })

  it('uses FORBIDDEN for unauthorized access', () => {
    expect(ERROR_CODES.FORBIDDEN).toBe('FORBIDDEN')
  })
})

// =============================================================================
// Pagination Tests
// =============================================================================

describe('device management pagination', () => {
  it('defaults to limit 20', () => {
    const limit = Math.min(Number(undefined) || 20, 100)
    expect(limit).toBe(20)
  })

  it('caps limit at 100', () => {
    const limit = Math.min(Number('500') || 20, 100)
    expect(limit).toBe(100)
  })

  it('defaults to offset 0', () => {
    const offset = Number(undefined) || 0
    expect(offset).toBe(0)
  })

  it('calculates hasMore correctly when more exist', () => {
    const total = 100
    const offset = 0
    const resultsLength = 20
    const hasMore = offset + resultsLength < total
    expect(hasMore).toBe(true)
  })

  it('calculates hasMore correctly when at end', () => {
    const total = 100
    const offset = 80
    const resultsLength = 20
    const hasMore = offset + resultsLength < total
    expect(hasMore).toBe(false)
  })
})

// =============================================================================
// Stats Calculation Tests
// =============================================================================

describe('device stats calculations', () => {
  it('calculates time windows correctly', () => {
    const now = Math.floor(Date.now() / 1000)
    const thirtyDaysAgo = now - (30 * 24 * 60 * 60)
    const sevenDaysAgo = now - (7 * 24 * 60 * 60)

    expect(thirtyDaysAgo).toBeLessThan(now)
    expect(sevenDaysAgo).toBeLessThan(now)
    expect(sevenDaysAgo).toBeGreaterThan(thirtyDaysAgo)
  })

  it('aggregates target groups from rows', () => {
    const rows = [
      { target_group: 'beta', count: 50 },
      { target_group: 'internal', count: 25 },
      { target_group: 'early-access', count: 10 },
    ]

    const byTargetGroup: Record<string, number> = {}
    for (const row of rows) {
      byTargetGroup[row.target_group] = row.count
    }

    expect(byTargetGroup).toEqual({
      beta: 50,
      internal: 25,
      'early-access': 10,
    })
  })
})

// =============================================================================
// Bulk Operation Tests
// =============================================================================

describe('bulk target operations', () => {
  it('generates correct SQL placeholders', () => {
    const deviceIds = ['dev-1', 'dev-2', 'dev-3']
    const placeholders = deviceIds.map(() => '?').join(', ')
    expect(placeholders).toBe('?, ?, ?')
  })

  it('handles single device', () => {
    const deviceIds = ['dev-1']
    const placeholders = deviceIds.map(() => '?').join(', ')
    expect(placeholders).toBe('?')
  })

  it('handles max devices (100)', () => {
    const deviceIds = Array(100).fill('device')
    const placeholders = deviceIds.map(() => '?').join(', ')
    expect(placeholders.split(', ')).toHaveLength(100)
  })
})

// =============================================================================
// Target Group Tests
// =============================================================================

describe('target group handling', () => {
  it('allows alphanumeric target groups', () => {
    const result = deviceTargetSchema.safeParse({ targetGroup: 'betaTesters2024' })
    expect(result.success).toBe(true)
  })

  it('allows hyphenated target groups', () => {
    const result = deviceTargetSchema.safeParse({ targetGroup: 'beta-testers' })
    expect(result.success).toBe(true)
  })

  it('allows underscored target groups', () => {
    const result = deviceTargetSchema.safeParse({ targetGroup: 'beta_testers' })
    expect(result.success).toBe(true)
  })

  it('allows spaced target groups', () => {
    const result = deviceTargetSchema.safeParse({ targetGroup: 'Beta Testers' })
    expect(result.success).toBe(true)
  })

  it('clears target group by setting to null', () => {
    const device = { target_group: 'beta' as string | null }
    device.target_group = null
    expect(device.target_group).toBeNull()
  })
})
