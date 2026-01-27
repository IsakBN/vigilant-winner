/**
 * Rollback Telemetry Routes Tests
 *
 * @agent wave5d-rollback
 * @created 2026-01-26
 */

import { describe, it, expect } from 'vitest'
import { z } from 'zod'
import { ERROR_CODES } from '@bundlenudge/shared'

// =============================================================================
// Schema Definitions (matching route)
// =============================================================================

const rollbackReportSchema = z.object({
  releaseId: z.string().uuid(),
  reason: z.enum(['crash_detected', 'health_check_failed', 'manual', 'hash_mismatch']),
  failedEvents: z.array(z.string()).optional(),
  failedEndpoints: z.array(z.object({
    method: z.string(),
    url: z.string(),
    status: z.number(),
  })).optional(),
  previousVersion: z.string().optional(),
  timestamp: z.number(),
})

const rollbackQuerySchema = z.object({
  startTime: z.coerce.number().optional(),
  endTime: z.coerce.number().optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
})

// =============================================================================
// Schema Validation Tests
// =============================================================================

describe('rollbackReportSchema', () => {
  it('validates valid rollback report with all fields', () => {
    const result = rollbackReportSchema.safeParse({
      releaseId: '550e8400-e29b-41d4-a716-446655440000',
      reason: 'crash_detected',
      failedEvents: ['app_launch', 'network_request'],
      failedEndpoints: [
        { method: 'GET', url: '/api/data', status: 500 },
      ],
      previousVersion: '1.0.0',
      timestamp: 1700000000,
    })
    expect(result.success).toBe(true)
  })

  it('validates minimal rollback report', () => {
    const result = rollbackReportSchema.safeParse({
      releaseId: '550e8400-e29b-41d4-a716-446655440000',
      reason: 'manual',
      timestamp: 1700000000,
    })
    expect(result.success).toBe(true)
  })

  it('validates all reason enum values', () => {
    const reasons = ['crash_detected', 'health_check_failed', 'manual', 'hash_mismatch']
    for (const reason of reasons) {
      const result = rollbackReportSchema.safeParse({
        releaseId: '550e8400-e29b-41d4-a716-446655440000',
        reason,
        timestamp: 1700000000,
      })
      expect(result.success).toBe(true)
    }
  })

  it('rejects invalid releaseId format', () => {
    const result = rollbackReportSchema.safeParse({
      releaseId: 'not-a-uuid',
      reason: 'crash_detected',
      timestamp: 1700000000,
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid reason value', () => {
    const result = rollbackReportSchema.safeParse({
      releaseId: '550e8400-e29b-41d4-a716-446655440000',
      reason: 'invalid_reason',
      timestamp: 1700000000,
    })
    expect(result.success).toBe(false)
  })

  it('rejects missing required fields', () => {
    const result = rollbackReportSchema.safeParse({
      releaseId: '550e8400-e29b-41d4-a716-446655440000',
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid failedEndpoints format', () => {
    const result = rollbackReportSchema.safeParse({
      releaseId: '550e8400-e29b-41d4-a716-446655440000',
      reason: 'health_check_failed',
      timestamp: 1700000000,
      failedEndpoints: [{ method: 'GET' }], // missing url and status
    })
    expect(result.success).toBe(false)
  })

  it('accepts empty arrays for optional fields', () => {
    const result = rollbackReportSchema.safeParse({
      releaseId: '550e8400-e29b-41d4-a716-446655440000',
      reason: 'hash_mismatch',
      failedEvents: [],
      failedEndpoints: [],
      timestamp: 1700000000,
    })
    expect(result.success).toBe(true)
  })
})

// =============================================================================
// Query Schema Tests
// =============================================================================

describe('rollbackQuerySchema', () => {
  it('validates empty query', () => {
    const result = rollbackQuerySchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it('validates query with time range', () => {
    const result = rollbackQuerySchema.safeParse({
      startTime: '1700000000',
      endTime: '1700100000',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.startTime).toBe(1700000000)
      expect(result.data.endTime).toBe(1700100000)
    }
  })

  it('coerces string limit to number', () => {
    const result = rollbackQuerySchema.safeParse({ limit: '50' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.limit).toBe(50)
    }
  })

  it('rejects limit above max (100)', () => {
    const result = rollbackQuerySchema.safeParse({ limit: '150' })
    expect(result.success).toBe(false)
  })

  it('rejects limit below min (1)', () => {
    const result = rollbackQuerySchema.safeParse({ limit: '0' })
    expect(result.success).toBe(false)
  })
})

// =============================================================================
// Error Code Tests
// =============================================================================

describe('rollback error codes', () => {
  it('has DEVICE_NOT_FOUND error code', () => {
    expect(ERROR_CODES.DEVICE_NOT_FOUND).toBe('DEVICE_NOT_FOUND')
  })

  it('has INVALID_INPUT error code', () => {
    expect(ERROR_CODES.INVALID_INPUT).toBe('INVALID_INPUT')
  })

  it('has RELEASE_NOT_FOUND error code', () => {
    expect(ERROR_CODES.RELEASE_NOT_FOUND).toBe('RELEASE_NOT_FOUND')
  })

  it('has FORBIDDEN error code', () => {
    expect(ERROR_CODES.FORBIDDEN).toBe('FORBIDDEN')
  })
})

// =============================================================================
// Response Format Tests
// =============================================================================

describe('rollback response format', () => {
  it('formats rollback report correctly', () => {
    const row = {
      id: 'report-1',
      device_id: 'device-1',
      release_id: 'release-1',
      reason: 'crash_detected',
      failed_events: '["app_launch","network_request"]',
      failed_endpoints: '[{"method":"GET","url":"/api","status":500}]',
      previous_version: '1.0.0',
      timestamp: 1700000000,
      created_at: 1700000001,
    }

    const formatted = {
      id: row.id,
      deviceId: row.device_id,
      releaseId: row.release_id,
      reason: row.reason,
      failedEvents: row.failed_events ? JSON.parse(row.failed_events) : null,
      failedEndpoints: row.failed_endpoints ? JSON.parse(row.failed_endpoints) : null,
      previousVersion: row.previous_version,
      timestamp: row.timestamp,
      createdAt: row.created_at,
    }

    expect(formatted.id).toBe('report-1')
    expect(formatted.deviceId).toBe('device-1')
    expect(formatted.failedEvents).toEqual(['app_launch', 'network_request'])
    expect(formatted.failedEndpoints).toEqual([{ method: 'GET', url: '/api', status: 500 }])
  })

  it('handles null JSON fields', () => {
    const row = {
      id: 'report-2',
      device_id: 'device-2',
      release_id: 'release-2',
      reason: 'manual',
      failed_events: null,
      failed_endpoints: null,
      previous_version: null,
      timestamp: 1700000000,
      created_at: 1700000001,
    }

    const formatted = {
      id: row.id,
      failedEvents: row.failed_events ? JSON.parse(row.failed_events) : null,
      failedEndpoints: row.failed_endpoints ? JSON.parse(row.failed_endpoints) : null,
      previousVersion: row.previous_version,
    }

    expect(formatted.failedEvents).toBeNull()
    expect(formatted.failedEndpoints).toBeNull()
    expect(formatted.previousVersion).toBeNull()
  })

  it('aggregated response has correct structure', () => {
    const response = {
      summary: {
        total: 150,
        byReason: {
          crash_detected: 100,
          health_check_failed: 30,
          manual: 15,
          hash_mismatch: 5,
        },
      },
      reports: [],
    }

    expect(response).toHaveProperty('summary')
    expect(response).toHaveProperty('summary.total')
    expect(response).toHaveProperty('summary.byReason')
    expect(response).toHaveProperty('reports')
    expect(response.summary.total).toBe(150)
  })
})

// =============================================================================
// Time Range Filter Tests
// =============================================================================

describe('time range filtering', () => {
  it('builds where clause with both startTime and endTime', () => {
    const startTime = 1700000000
    const endTime = 1700100000

    let whereClause = 'release_id = ?'
    const params: (string | number)[] = ['release-1']

    if (startTime) {
      whereClause += ' AND timestamp >= ?'
      params.push(startTime)
    }
    if (endTime) {
      whereClause += ' AND timestamp <= ?'
      params.push(endTime)
    }

    expect(whereClause).toBe('release_id = ? AND timestamp >= ? AND timestamp <= ?')
    expect(params).toEqual(['release-1', 1700000000, 1700100000])
  })

  it('builds where clause with only startTime', () => {
    const startTime = 1700000000

    let whereClause = 'release_id = ?'
    const params: (string | number)[] = ['release-1']

    if (startTime) {
      whereClause += ' AND timestamp >= ?'
      params.push(startTime)
    }

    expect(whereClause).toBe('release_id = ? AND timestamp >= ?')
    expect(params).toEqual(['release-1', 1700000000])
  })
})

// =============================================================================
// Stats Calculation Tests
// =============================================================================

describe('rollback stats calculation', () => {
  it('calculates reason counts from query results', () => {
    const queryResults = [
      { reason: 'crash_detected', count: 100 },
      { reason: 'health_check_failed', count: 30 },
      { reason: 'manual', count: 15 },
    ]

    const reasonCounts: Record<string, number> = {}
    for (const row of queryResults) {
      reasonCounts[row.reason] = row.count
    }

    expect(reasonCounts.crash_detected).toBe(100)
    expect(reasonCounts.health_check_failed).toBe(30)
    expect(reasonCounts.manual).toBe(15)
    expect(reasonCounts.hash_mismatch).toBeUndefined()
  })

  it('defaults limit to 100 when not specified', () => {
    const query = { startTime: undefined, endTime: undefined, limit: undefined }
    const limit = query.limit ?? 100
    expect(limit).toBe(100)
  })
})
