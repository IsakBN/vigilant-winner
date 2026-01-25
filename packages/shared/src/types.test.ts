import { describe, it, expect } from 'vitest'
import {
  updateCheckRequestSchema,
  updateCheckResponseSchema,
  deviceRegisterRequestSchema,
  targetingRulesSchema,
  sdkMetadataSchema,
} from './schemas'

describe('schemas', () => {
  describe('updateCheckRequestSchema', () => {
    it('validates a valid request', () => {
      const validRequest = {
        appId: '550e8400-e29b-41d4-a716-446655440000',
        deviceId: 'device-123',
        platform: 'ios',
        appVersion: '1.0.0',
      }

      const result = updateCheckRequestSchema.safeParse(validRequest)
      expect(result.success).toBe(true)
    })

    it('validates request with optional fields', () => {
      const validRequest = {
        appId: '550e8400-e29b-41d4-a716-446655440000',
        deviceId: 'device-123',
        platform: 'android',
        appVersion: '2.1.0',
        currentBundleVersion: '1.5.0',
        currentBundleHash: 'sha256:abc123',
        deviceInfo: {
          osVersion: '14.0',
          timezone: 'America/New_York',
        },
      }

      const result = updateCheckRequestSchema.safeParse(validRequest)
      expect(result.success).toBe(true)
    })

    it('rejects invalid appId', () => {
      const invalidRequest = {
        appId: 'not-a-uuid',
        deviceId: 'device-123',
        platform: 'ios',
        appVersion: '1.0.0',
      }

      const result = updateCheckRequestSchema.safeParse(invalidRequest)
      expect(result.success).toBe(false)
    })

    it('rejects invalid platform', () => {
      const invalidRequest = {
        appId: '550e8400-e29b-41d4-a716-446655440000',
        deviceId: 'device-123',
        platform: 'windows',
        appVersion: '1.0.0',
      }

      const result = updateCheckRequestSchema.safeParse(invalidRequest)
      expect(result.success).toBe(false)
    })
  })

  describe('updateCheckResponseSchema', () => {
    it('validates no update response', () => {
      const response = {
        updateAvailable: false,
      }

      const result = updateCheckResponseSchema.safeParse(response)
      expect(result.success).toBe(true)
    })

    it('validates update available response', () => {
      const response = {
        updateAvailable: true,
        release: {
          version: '2.0.0',
          bundleUrl: 'https://api.bundlenudge.com/bundles/123',
          bundleSize: 50000,
          bundleHash: 'sha256:abc123',
          releaseId: 'release-123',
        },
      }

      const result = updateCheckResponseSchema.safeParse(response)
      expect(result.success).toBe(true)
    })

    it('validates app store update required', () => {
      const response = {
        updateAvailable: false,
        requiresAppStoreUpdate: true,
        appStoreMessage: 'Please update from the App Store',
      }

      const result = updateCheckResponseSchema.safeParse(response)
      expect(result.success).toBe(true)
    })
  })

  describe('targetingRulesSchema', () => {
    it('validates simple targeting rules', () => {
      const rules = {
        match: 'all',
        rules: [
          { field: 'os', op: 'eq', value: 'ios' },
          { field: 'percentage', op: 'lte', value: 50 },
        ],
      }

      const result = targetingRulesSchema.safeParse(rules)
      expect(result.success).toBe(true)
    })

    it('validates rules with array values', () => {
      const rules = {
        match: 'any',
        rules: [{ field: 'timezone', op: 'in', value: ['Europe/London', 'Europe/Paris'] }],
      }

      const result = targetingRulesSchema.safeParse(rules)
      expect(result.success).toBe(true)
    })
  })

  describe('deviceRegisterRequestSchema', () => {
    it('validates a valid registration request', () => {
      const request = {
        appId: '550e8400-e29b-41d4-a716-446655440000',
        deviceId: 'device-abc-123',
        platform: 'ios',
        appVersion: '1.0.0',
      }

      const result = deviceRegisterRequestSchema.safeParse(request)
      expect(result.success).toBe(true)
    })
  })

  describe('sdkMetadataSchema', () => {
    it('validates default metadata', () => {
      const metadata = {
        deviceId: 'device-123',
        accessToken: null,
        currentVersion: null,
        currentVersionHash: null,
        previousVersion: null,
        pendingUpdateFlag: false,
        lastSuccessTime: null,
      }

      const result = sdkMetadataSchema.safeParse(metadata)
      expect(result.success).toBe(true)
    })

    it('validates metadata with values', () => {
      const metadata = {
        deviceId: 'device-123',
        accessToken: 'token-abc',
        currentVersion: '1.5.0',
        currentVersionHash: 'sha256:abc123',
        previousVersion: '1.4.0',
        pendingUpdateFlag: true,
        lastSuccessTime: Date.now(),
      }

      const result = sdkMetadataSchema.safeParse(metadata)
      expect(result.success).toBe(true)
    })
  })
})
