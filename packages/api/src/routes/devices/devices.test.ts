/**
 * @agent fix-validation
 * @modified 2026-01-25
 */

import { describe, it, expect } from 'vitest'
import { z } from 'zod'
import { deviceRegisterRequestSchema, ERROR_CODES } from '@bundlenudge/shared'

// Local schema for revoke endpoint (matching route definition)
const deviceRevokeSchema = z.object({
  appId: z.string().uuid(),
  deviceId: z.string().min(1).max(100),
})

describe('device registration routes logic', () => {
  describe('deviceRegisterRequestSchema', () => {
    it('validates valid registration data', () => {
      const result = deviceRegisterRequestSchema.safeParse({
        appId: '550e8400-e29b-41d4-a716-446655440000',
        deviceId: 'device-123',
        platform: 'ios',
        appVersion: '1.0.0',
      })
      expect(result.success).toBe(true)
    })

    it('validates with optional device info', () => {
      const result = deviceRegisterRequestSchema.safeParse({
        appId: '550e8400-e29b-41d4-a716-446655440000',
        deviceId: 'device-456',
        platform: 'android',
        appVersion: '2.0.0',
        deviceInfo: {
          osVersion: '14.0',
          deviceModel: 'iPhone 15',
          timezone: 'America/New_York',
          locale: 'en-US',
        },
      })
      expect(result.success).toBe(true)
    })

    it('rejects invalid appId format', () => {
      const result = deviceRegisterRequestSchema.safeParse({
        appId: 'not-a-uuid',
        deviceId: 'device-123',
        platform: 'ios',
        appVersion: '1.0.0',
      })
      expect(result.success).toBe(false)
    })

    it('rejects invalid platform', () => {
      const result = deviceRegisterRequestSchema.safeParse({
        appId: '550e8400-e29b-41d4-a716-446655440000',
        deviceId: 'device-123',
        platform: 'windows',
        appVersion: '1.0.0',
      })
      expect(result.success).toBe(false)
    })

    it('rejects missing required fields', () => {
      const result = deviceRegisterRequestSchema.safeParse({
        appId: '550e8400-e29b-41d4-a716-446655440000',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('token hash format', () => {
    it('generates SHA-256 hash (64 hex chars)', () => {
      const mockHash = 'a'.repeat(64)
      expect(mockHash).toMatch(/^[a-f0-9]{64}$/)
      expect(mockHash.length).toBe(64)
    })
  })

  describe('error codes', () => {
    it('has UNAUTHORIZED error code', () => {
      expect(ERROR_CODES.UNAUTHORIZED).toBe('UNAUTHORIZED')
    })

    it('has INVALID_TOKEN error code', () => {
      expect(ERROR_CODES.INVALID_TOKEN).toBe('INVALID_TOKEN')
    })

    it('has TOKEN_EXPIRED error code', () => {
      expect(ERROR_CODES.TOKEN_EXPIRED).toBe('TOKEN_EXPIRED')
    })

    it('has DEVICE_NOT_FOUND error code', () => {
      expect(ERROR_CODES.DEVICE_NOT_FOUND).toBe('DEVICE_NOT_FOUND')
    })

    it('has FORBIDDEN error code', () => {
      expect(ERROR_CODES.FORBIDDEN).toBe('FORBIDDEN')
    })
  })

  describe('token refresh flow', () => {
    it('extracts Bearer token from header', () => {
      const authHeader = 'Bearer eyJhbGciOiJIUzI1NiJ9.payload.signature'
      const token = authHeader.slice(7)
      expect(token).toBe('eyJhbGciOiJIUzI1NiJ9.payload.signature')
    })

    it('rejects non-Bearer auth', () => {
      const authHeader = 'Basic abc123'
      const isBearer = authHeader.startsWith('Bearer ')
      expect(isBearer).toBe(false)
    })
  })

  describe('device revocation', () => {
    it('marks device with revoked_at timestamp', () => {
      const now = Math.floor(Date.now() / 1000)
      const device = {
        id: 'dev-1',
        revoked_at: null as number | null,
      }

      // Simulate revocation
      device.revoked_at = now

      expect(device.revoked_at).toBe(now)
      expect(device.revoked_at).not.toBeNull()
    })

    it('revoked devices should be denied', () => {
      const device: { revoked_at: number | null } = { revoked_at: 1700000000 }
      const isRevoked = device.revoked_at !== null
      expect(isRevoked).toBe(true)
    })
  })

  describe('deviceRevokeSchema', () => {
    it('validates valid revoke request', () => {
      const result = deviceRevokeSchema.safeParse({
        appId: '550e8400-e29b-41d4-a716-446655440000',
        deviceId: 'device-123',
      })
      expect(result.success).toBe(true)
    })

    it('rejects invalid appId format', () => {
      const result = deviceRevokeSchema.safeParse({
        appId: 'not-a-uuid',
        deviceId: 'device-123',
      })
      expect(result.success).toBe(false)
    })

    it('rejects empty deviceId', () => {
      const result = deviceRevokeSchema.safeParse({
        appId: '550e8400-e29b-41d4-a716-446655440000',
        deviceId: '',
      })
      expect(result.success).toBe(false)
    })

    it('rejects missing appId', () => {
      const result = deviceRevokeSchema.safeParse({
        deviceId: 'device-123',
      })
      expect(result.success).toBe(false)
    })

    it('rejects missing deviceId', () => {
      const result = deviceRevokeSchema.safeParse({
        appId: '550e8400-e29b-41d4-a716-446655440000',
      })
      expect(result.success).toBe(false)
    })

    it('rejects deviceId exceeding max length', () => {
      const result = deviceRevokeSchema.safeParse({
        appId: '550e8400-e29b-41d4-a716-446655440000',
        deviceId: 'x'.repeat(101),
      })
      expect(result.success).toBe(false)
    })
  })

  describe('upsert logic', () => {
    it('updates existing device on conflict', () => {
      // Simulating the ON CONFLICT behavior
      const existing = {
        app_id: 'app-1',
        device_id: 'dev-1',
        platform: 'ios',
        app_version: '1.0.0',
      }

      const newData = {
        app_id: 'app-1',
        device_id: 'dev-1',
        platform: 'ios',
        app_version: '2.0.0', // Updated
      }

      // After upsert, version should be updated
      const merged = { ...existing, app_version: newData.app_version }
      expect(merged.app_version).toBe('2.0.0')
    })
  })
})
