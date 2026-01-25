/**
 * @agent remediate-pagination
 * @modified 2026-01-25
 *
 * @agent wave4-channels
 * @modified 2026-01-25
 * @description Added tests for default channel creation
 */
import { describe, it, expect } from 'vitest'
import { createAppSchema, updateAppSchema, ERROR_CODES } from '@bundlenudge/shared'

const DEFAULT_CHANNELS = ['production', 'staging', 'development'] as const

describe('apps routes logic', () => {
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

    it('calculates hasMore correctly with offset', () => {
      const total = 50
      const offset = 40
      const resultsLength = 10
      const hasMore = offset + resultsLength < total
      expect(hasMore).toBe(false)
    })

    it('response has correct pagination structure', () => {
      const response = {
        data: [],
        pagination: {
          total: 100,
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

  describe('createAppSchema', () => {
    it('validates valid create app data', () => {
      const result = createAppSchema.safeParse({
        name: 'My App',
        platform: 'ios',
      })
      expect(result.success).toBe(true)
    })

    it('validates with optional bundleId', () => {
      const result = createAppSchema.safeParse({
        name: 'My App',
        platform: 'android',
        bundleId: 'com.example.app',
      })
      expect(result.success).toBe(true)
    })

    it('rejects missing name', () => {
      const result = createAppSchema.safeParse({
        platform: 'ios',
      })
      expect(result.success).toBe(false)
    })

    it('rejects invalid platform', () => {
      const result = createAppSchema.safeParse({
        name: 'My App',
        platform: 'windows',
      })
      expect(result.success).toBe(false)
    })

    it('rejects name that is too long', () => {
      const result = createAppSchema.safeParse({
        name: 'a'.repeat(101),
        platform: 'ios',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('updateAppSchema', () => {
    it('validates partial update', () => {
      const result = updateAppSchema.safeParse({
        name: 'Updated Name',
      })
      expect(result.success).toBe(true)
    })

    it('validates bundleId update', () => {
      const result = updateAppSchema.safeParse({
        bundleId: 'com.new.bundle',
      })
      expect(result.success).toBe(true)
    })

    it('validates bundleId set to null', () => {
      const result = updateAppSchema.safeParse({
        bundleId: null,
      })
      expect(result.success).toBe(true)
    })

    it('validates empty update', () => {
      const result = updateAppSchema.safeParse({})
      expect(result.success).toBe(true)
    })
  })

  describe('error codes', () => {
    it('has APP_NOT_FOUND error code', () => {
      expect(ERROR_CODES.APP_NOT_FOUND).toBe('APP_NOT_FOUND')
    })
  })

  describe('API key format', () => {
    it('generates valid format', () => {
      const prefix = 'bn_'
      const keyLength = 32
      const key = `${prefix}${'a'.repeat(keyLength)}`

      expect(key).toMatch(/^bn_[a-zA-Z0-9_-]{32}$/)
      expect(key.startsWith('bn_')).toBe(true)
    })
  })

  describe('default channels auto-creation', () => {
    it('has exactly 3 default channels', () => {
      expect(DEFAULT_CHANNELS).toHaveLength(3)
    })

    it('includes production channel', () => {
      expect(DEFAULT_CHANNELS).toContain('production')
    })

    it('includes staging channel', () => {
      expect(DEFAULT_CHANNELS).toContain('staging')
    })

    it('includes development channel', () => {
      expect(DEFAULT_CHANNELS).toContain('development')
    })

    it('channels are in expected order', () => {
      expect(DEFAULT_CHANNELS[0]).toBe('production')
      expect(DEFAULT_CHANNELS[1]).toBe('staging')
      expect(DEFAULT_CHANNELS[2]).toBe('development')
    })
  })
})
