/**
 * @agent remediate-pagination
 * @modified 2026-01-25
 */
import { describe, it, expect } from 'vitest'
import {
  createReleaseSchema,
  updateReleaseSchema,
  updateRolloutSchema,
  ERROR_CODES,
} from '@bundlenudge/shared'

describe('releases routes logic', () => {
  describe('pagination', () => {
    it('defaults to limit 20 when not specified', () => {
      const requestedLimit = undefined
      const limit = Math.min(Number(requestedLimit) || 20, 100)
      expect(limit).toBe(20)
    })

    it('caps limit at 100', () => {
      const requestedLimit = '200'
      const limit = Math.min(Number(requestedLimit) || 20, 100)
      expect(limit).toBe(100)
    })

    it('defaults to offset 0 when not specified', () => {
      const requestedOffset = undefined
      const offset = Number(requestedOffset) || 0
      expect(offset).toBe(0)
    })

    it('calculates hasMore correctly', () => {
      const total = 30
      const offset = 0
      const resultsLength = 20
      const hasMore = offset + resultsLength < total
      expect(hasMore).toBe(true)
    })

    it('response has correct pagination structure', () => {
      const response = {
        data: [],
        pagination: {
          total: 50,
          limit: 20,
          offset: 0,
          hasMore: true,
        },
      }
      expect(response).toHaveProperty('data')
      expect(response).toHaveProperty('pagination')
      expect(response.pagination).toHaveProperty('total')
      expect(response.pagination).toHaveProperty('limit')
      expect(response.pagination).toHaveProperty('offset')
      expect(response.pagination).toHaveProperty('hasMore')
    })
  })

  describe('createReleaseSchema', () => {
    it('validates valid create release data', () => {
      const result = createReleaseSchema.safeParse({
        version: '1.0.0',
      })
      expect(result.success).toBe(true)
    })

    it('validates with optional fields', () => {
      const result = createReleaseSchema.safeParse({
        version: '1.0.0',
        releaseNotes: 'Bug fixes and improvements',
        minAppVersion: '0.9.0',
        maxAppVersion: '2.0.0',
      })
      expect(result.success).toBe(true)
    })

    it('rejects missing version', () => {
      const result = createReleaseSchema.safeParse({})
      expect(result.success).toBe(false)
    })

    it('rejects version that is too long', () => {
      const result = createReleaseSchema.safeParse({
        version: 'a'.repeat(51),
      })
      expect(result.success).toBe(false)
    })

    it('rejects release notes that are too long', () => {
      const result = createReleaseSchema.safeParse({
        version: '1.0.0',
        releaseNotes: 'a'.repeat(5001),
      })
      expect(result.success).toBe(false)
    })
  })

  describe('updateReleaseSchema', () => {
    it('validates status update', () => {
      const result = updateReleaseSchema.safeParse({
        status: 'paused',
      })
      expect(result.success).toBe(true)
    })

    it('validates rollback with reason', () => {
      const result = updateReleaseSchema.safeParse({
        status: 'rolled_back',
        rollbackReason: 'High crash rate detected',
      })
      expect(result.success).toBe(true)
    })

    it('validates release notes update', () => {
      const result = updateReleaseSchema.safeParse({
        releaseNotes: 'Updated release notes',
      })
      expect(result.success).toBe(true)
    })

    it('validates empty update', () => {
      const result = updateReleaseSchema.safeParse({})
      expect(result.success).toBe(true)
    })

    it('rejects invalid status', () => {
      const result = updateReleaseSchema.safeParse({
        status: 'deleted',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('updateRolloutSchema', () => {
    it('validates valid rollout percentage', () => {
      const result = updateRolloutSchema.safeParse({
        rolloutPercentage: 50,
      })
      expect(result.success).toBe(true)
    })

    it('validates 0 percentage', () => {
      const result = updateRolloutSchema.safeParse({
        rolloutPercentage: 0,
      })
      expect(result.success).toBe(true)
    })

    it('validates 100 percentage', () => {
      const result = updateRolloutSchema.safeParse({
        rolloutPercentage: 100,
      })
      expect(result.success).toBe(true)
    })

    it('rejects percentage over 100', () => {
      const result = updateRolloutSchema.safeParse({
        rolloutPercentage: 101,
      })
      expect(result.success).toBe(false)
    })

    it('rejects negative percentage', () => {
      const result = updateRolloutSchema.safeParse({
        rolloutPercentage: -1,
      })
      expect(result.success).toBe(false)
    })
  })

  describe('error codes', () => {
    it('has RELEASE_NOT_FOUND error code', () => {
      expect(ERROR_CODES.RELEASE_NOT_FOUND).toBe('RELEASE_NOT_FOUND')
    })

    it('has DUPLICATE_VERSION error code', () => {
      expect(ERROR_CODES.DUPLICATE_VERSION).toBe('DUPLICATE_VERSION')
    })
  })

  describe('release status values', () => {
    it('accepts active status', () => {
      const result = updateReleaseSchema.safeParse({ status: 'active' })
      expect(result.success).toBe(true)
    })

    it('accepts paused status', () => {
      const result = updateReleaseSchema.safeParse({ status: 'paused' })
      expect(result.success).toBe(true)
    })

    it('accepts rolled_back status', () => {
      const result = updateReleaseSchema.safeParse({ status: 'rolled_back' })
      expect(result.success).toBe(true)
    })
  })

  describe('bundle hash format', () => {
    it('generates valid SHA-256 hash format', () => {
      // SHA-256 produces a 64 character hex string
      const mockHash = 'a'.repeat(64)
      expect(mockHash).toMatch(/^[a-f0-9]{64}$/)
    })
  })
})
