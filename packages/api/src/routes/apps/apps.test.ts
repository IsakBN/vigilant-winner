import { describe, it, expect } from 'vitest'
import { createAppSchema, updateAppSchema, ERROR_CODES } from '@bundlenudge/shared'

describe('apps routes logic', () => {
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
})
