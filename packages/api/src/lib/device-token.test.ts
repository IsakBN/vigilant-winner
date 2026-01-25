import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import {
  generateDeviceToken,
  verifyDeviceToken,
  shouldRefreshToken,
  decodeJwtPayload,
} from './device-token'

const TEST_SECRET = 'test-secret-key-for-jwt-signing'

describe('device-token', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-25T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('generateDeviceToken', () => {
    it('generates a valid JWT token', async () => {
      const payload = {
        deviceId: 'device-123',
        appId: 'app-456',
        bundleId: 'com.example.app',
        platform: 'ios' as const,
      }

      const result = await generateDeviceToken(payload, TEST_SECRET)

      expect(result.token).toBeDefined()
      expect(result.token.split('.')).toHaveLength(3)
      expect(result.expiresAt).toBeGreaterThan(Date.now())
    })

    it('sets expiration to 30 days from now', async () => {
      const payload = {
        deviceId: 'device-123',
        appId: 'app-456',
        bundleId: 'com.example.app',
        platform: 'android' as const,
      }

      const result = await generateDeviceToken(payload, TEST_SECRET)
      const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000

      expect(result.expiresAt).toBe(Date.now() + thirtyDaysMs)
    })
  })

  describe('verifyDeviceToken', () => {
    it('verifies a valid token', async () => {
      const payload = {
        deviceId: 'device-123',
        appId: 'app-456',
        bundleId: 'com.example.app',
        platform: 'ios' as const,
      }

      const { token } = await generateDeviceToken(payload, TEST_SECRET)
      const verified = await verifyDeviceToken(token, TEST_SECRET)

      expect(verified).not.toBeNull()
      expect(verified?.deviceId).toBe('device-123')
      expect(verified?.appId).toBe('app-456')
    })

    it('returns null for invalid secret', async () => {
      const payload = {
        deviceId: 'device-123',
        appId: 'app-456',
        bundleId: 'com.example.app',
        platform: 'ios' as const,
      }

      const { token } = await generateDeviceToken(payload, TEST_SECRET)
      const verified = await verifyDeviceToken(token, 'wrong-secret')

      expect(verified).toBeNull()
    })

    it('returns null for expired token', async () => {
      const payload = {
        deviceId: 'device-123',
        appId: 'app-456',
        bundleId: 'com.example.app',
        platform: 'ios' as const,
      }

      const { token } = await generateDeviceToken(payload, TEST_SECRET)

      // Advance time past expiration
      vi.advanceTimersByTime(31 * 24 * 60 * 60 * 1000)

      const verified = await verifyDeviceToken(token, TEST_SECRET)
      expect(verified).toBeNull()
    })

    it('returns null for malformed token', async () => {
      const verified = await verifyDeviceToken('not.a.valid.token', TEST_SECRET)
      expect(verified).toBeNull()
    })
  })

  describe('shouldRefreshToken', () => {
    it('returns false when token has more than 7 days left', () => {
      const payload = {
        deviceId: 'device-123',
        appId: 'app-456',
        bundleId: 'com.example.app',
        platform: 'ios' as const,
        iat: Date.now(),
        exp: Date.now() + 20 * 24 * 60 * 60 * 1000, // 20 days
      }

      expect(shouldRefreshToken(payload)).toBe(false)
    })

    it('returns true when token has less than 7 days left', () => {
      const payload = {
        deviceId: 'device-123',
        appId: 'app-456',
        bundleId: 'com.example.app',
        platform: 'ios' as const,
        iat: Date.now(),
        exp: Date.now() + 5 * 24 * 60 * 60 * 1000, // 5 days
      }

      expect(shouldRefreshToken(payload)).toBe(true)
    })
  })

  describe('decodeJwtPayload', () => {
    it('decodes payload without verification', async () => {
      const payload = {
        deviceId: 'device-123',
        appId: 'app-456',
        bundleId: 'com.example.app',
        platform: 'ios' as const,
      }

      const { token } = await generateDeviceToken(payload, TEST_SECRET)
      const decoded = decodeJwtPayload(token)

      expect(decoded).not.toBeNull()
      expect(decoded?.deviceId).toBe('device-123')
      expect(decoded?.appId).toBe('app-456')
    })

    it('returns null for malformed token', () => {
      expect(decodeJwtPayload('invalid')).toBeNull()
      expect(decodeJwtPayload('a.b')).toBeNull()
      expect(decodeJwtPayload('')).toBeNull()
    })
  })
})
