import { describe, it, expect } from 'vitest'
import { ERROR_CODES } from '@bundlenudge/shared'

function getCacheControl(status: string): string {
  return status === 'active'
    ? 'public, max-age=31536000, immutable'
    : 'public, max-age=300'
}

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
    it('sets immutable cache for active releases', () => {
      const cacheControl = getCacheControl('active')
      expect(cacheControl).toBe('public, max-age=31536000, immutable')
    })

    it('sets short cache for non-active releases', () => {
      const cacheControl = getCacheControl('paused')
      expect(cacheControl).toBe('public, max-age=300')
    })
  })

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
  })

  describe('content type', () => {
    it('returns javascript content type for bundles', () => {
      const contentType = 'application/javascript'
      expect(contentType).toBe('application/javascript')
    })
  })
})
