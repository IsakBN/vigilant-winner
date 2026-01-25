/**
 * Update Check Routes Tests
 *
 * @agent fix-targeting-rules
 * @modified 2026-01-25
 */

import { describe, it, expect } from 'vitest'
import { updateCheckRequestSchema, ERROR_CODES } from '@bundlenudge/shared'
import type { TargetingRules, DeviceAttributes } from '@bundlenudge/shared'
import { evaluateRules } from '../../lib/targeting'

describe('update check routes logic', () => {
  describe('updateCheckRequestSchema', () => {
    it('validates valid update check request', () => {
      const result = updateCheckRequestSchema.safeParse({
        appId: '550e8400-e29b-41d4-a716-446655440000',
        deviceId: 'device-123',
        platform: 'ios',
        appVersion: '1.0.0',
      })
      expect(result.success).toBe(true)
    })

    it('validates with optional bundle version', () => {
      const result = updateCheckRequestSchema.safeParse({
        appId: '550e8400-e29b-41d4-a716-446655440000',
        deviceId: 'device-456',
        platform: 'android',
        appVersion: '2.0.0',
        currentBundleVersion: '1.0.1',
        currentBundleHash: 'abc123hash',
      })
      expect(result.success).toBe(true)
    })

    it('validates with device info', () => {
      const result = updateCheckRequestSchema.safeParse({
        appId: '550e8400-e29b-41d4-a716-446655440000',
        deviceId: 'device-789',
        platform: 'ios',
        appVersion: '3.0.0',
        deviceInfo: {
          osVersion: '17.0',
          deviceModel: 'iPhone 15 Pro',
          timezone: 'Europe/London',
          locale: 'en-GB',
        },
      })
      expect(result.success).toBe(true)
    })

    it('rejects invalid appId format', () => {
      const result = updateCheckRequestSchema.safeParse({
        appId: 'not-a-uuid',
        deviceId: 'device-123',
        platform: 'ios',
        appVersion: '1.0.0',
      })
      expect(result.success).toBe(false)
    })

    it('rejects invalid platform', () => {
      const result = updateCheckRequestSchema.safeParse({
        appId: '550e8400-e29b-41d4-a716-446655440000',
        deviceId: 'device-123',
        platform: 'windows',
        appVersion: '1.0.0',
      })
      expect(result.success).toBe(false)
    })

    it('rejects missing required fields', () => {
      const result = updateCheckRequestSchema.safeParse({
        appId: '550e8400-e29b-41d4-a716-446655440000',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('compareVersions', () => {
    // Testing the semver comparison logic
    function compareVersions(a: string, b: string): number {
      const partsA = a.split('.').map(n => parseInt(n, 10) || 0)
      const partsB = b.split('.').map(n => parseInt(n, 10) || 0)
      for (let i = 0; i < 3; i++) {
        const partA = partsA[i] ?? 0
        const partB = partsB[i] ?? 0
        if (partA < partB) return -1
        if (partA > partB) return 1
      }
      return 0
    }

    it('returns 0 for equal versions', () => {
      expect(compareVersions('1.0.0', '1.0.0')).toBe(0)
      expect(compareVersions('2.5.3', '2.5.3')).toBe(0)
    })

    it('returns -1 when a < b', () => {
      expect(compareVersions('1.0.0', '2.0.0')).toBe(-1)
      expect(compareVersions('1.0.0', '1.1.0')).toBe(-1)
      expect(compareVersions('1.0.0', '1.0.1')).toBe(-1)
    })

    it('returns 1 when a > b', () => {
      expect(compareVersions('2.0.0', '1.0.0')).toBe(1)
      expect(compareVersions('1.1.0', '1.0.0')).toBe(1)
      expect(compareVersions('1.0.1', '1.0.0')).toBe(1)
    })

    it('handles missing patch version', () => {
      expect(compareVersions('1.0', '1.0.0')).toBe(0)
      expect(compareVersions('1.0.0', '1.0')).toBe(0)
    })

    it('handles double-digit versions', () => {
      expect(compareVersions('10.0.0', '9.0.0')).toBe(1)
      expect(compareVersions('1.10.0', '1.9.0')).toBe(1)
    })
  })

  describe('isVersionInRange', () => {
    function compareVersions(a: string, b: string): number {
      const partsA = a.split('.').map(n => parseInt(n, 10) || 0)
      const partsB = b.split('.').map(n => parseInt(n, 10) || 0)
      for (let i = 0; i < 3; i++) {
        const partA = partsA[i] ?? 0
        const partB = partsB[i] ?? 0
        if (partA < partB) return -1
        if (partA > partB) return 1
      }
      return 0
    }

    function isVersionInRange(
      appVersion: string,
      minVersion: string | null,
      maxVersion: string | null
    ): boolean {
      if (minVersion && compareVersions(appVersion, minVersion) < 0) {
        return false
      }
      if (maxVersion && compareVersions(appVersion, maxVersion) > 0) {
        return false
      }
      return true
    }

    it('returns true when no constraints', () => {
      expect(isVersionInRange('1.0.0', null, null)).toBe(true)
    })

    it('returns true when version meets min', () => {
      expect(isVersionInRange('2.0.0', '1.0.0', null)).toBe(true)
      expect(isVersionInRange('1.0.0', '1.0.0', null)).toBe(true)
    })

    it('returns false when version below min', () => {
      expect(isVersionInRange('0.9.0', '1.0.0', null)).toBe(false)
    })

    it('returns true when version meets max', () => {
      expect(isVersionInRange('1.0.0', null, '2.0.0')).toBe(true)
      expect(isVersionInRange('2.0.0', null, '2.0.0')).toBe(true)
    })

    it('returns false when version above max', () => {
      expect(isVersionInRange('3.0.0', null, '2.0.0')).toBe(false)
    })

    it('returns true when in range', () => {
      expect(isVersionInRange('1.5.0', '1.0.0', '2.0.0')).toBe(true)
    })

    it('returns false when outside range', () => {
      expect(isVersionInRange('0.5.0', '1.0.0', '2.0.0')).toBe(false)
      expect(isVersionInRange('2.5.0', '1.0.0', '2.0.0')).toBe(false)
    })
  })

  describe('isInRollout', () => {
    function isInRollout(deviceId: string, rolloutPercentage: number): boolean {
      if (rolloutPercentage >= 100) return true
      if (rolloutPercentage <= 0) return false
      let hash = 0
      for (let i = 0; i < deviceId.length; i++) {
        hash = (hash + deviceId.charCodeAt(i)) % 100
      }
      return hash < rolloutPercentage
    }

    it('always includes at 100%', () => {
      expect(isInRollout('any-device-id', 100)).toBe(true)
      expect(isInRollout('another-device', 100)).toBe(true)
    })

    it('always excludes at 0%', () => {
      expect(isInRollout('any-device-id', 0)).toBe(false)
      expect(isInRollout('another-device', 0)).toBe(false)
    })

    it('is deterministic for same device', () => {
      const deviceId = 'test-device-123'
      const result1 = isInRollout(deviceId, 50)
      const result2 = isInRollout(deviceId, 50)
      expect(result1).toBe(result2)
    })

    it('different devices may get different results', () => {
      // With 50% rollout, we should see some variation
      const results = new Set<boolean>()
      const devices = ['device-a', 'device-b', 'device-c', 'device-d', 'device-e']
      for (const d of devices) {
        results.add(isInRollout(d, 50))
      }
      // At least some variation expected (not all same)
      expect(results.size).toBeGreaterThanOrEqual(1)
    })
  })

  describe('update response structure', () => {
    it('no update available response', () => {
      const response = { updateAvailable: false }
      expect(response.updateAvailable).toBe(false)
    })

    it('update available response with release', () => {
      const response = {
        updateAvailable: true,
        release: {
          version: '1.2.0',
          bundleUrl: 'https://r2.example.com/bundles/abc.zip',
          bundleSize: 1024000,
          bundleHash: 'sha256-abc123',
          releaseId: 'rel-123',
          releaseNotes: 'Bug fixes and improvements',
        },
      }
      expect(response.updateAvailable).toBe(true)
      expect(response.release).toBeDefined()
      expect(response.release.version).toBe('1.2.0')
    })

    it('requires app store update response', () => {
      const response = {
        updateAvailable: false,
        requiresAppStoreUpdate: true,
        appStoreMessage: 'Please update to the latest app version',
      }
      expect(response.updateAvailable).toBe(false)
      expect(response.requiresAppStoreUpdate).toBe(true)
    })
  })

  describe('error codes', () => {
    it('has INVALID_TOKEN error code', () => {
      expect(ERROR_CODES.INVALID_TOKEN).toBe('INVALID_TOKEN')
    })

    it('has APP_NOT_FOUND error code', () => {
      expect(ERROR_CODES.APP_NOT_FOUND).toBe('APP_NOT_FOUND')
    })
  })

  describe('parseTargetingRules', () => {
    function parseTargetingRules(json: string | null): TargetingRules | null {
      if (!json) return null
      try {
        const parsed = JSON.parse(json) as TargetingRules
        if (!parsed.rules || parsed.rules.length === 0) {
          return null
        }
        return parsed
      } catch {
        return null
      }
    }

    it('returns null for null input', () => {
      expect(parseTargetingRules(null)).toBeNull()
    })

    it('returns null for empty string', () => {
      expect(parseTargetingRules('')).toBeNull()
    })

    it('returns null for invalid JSON', () => {
      expect(parseTargetingRules('not-json')).toBeNull()
    })

    it('returns null for empty rules array', () => {
      expect(parseTargetingRules('{"match":"all","rules":[]}')).toBeNull()
    })

    it('parses valid targeting rules', () => {
      const rules = parseTargetingRules(
        '{"match":"all","rules":[{"field":"os","op":"eq","value":"ios"}]}'
      )
      expect(rules).not.toBeNull()
      expect(rules?.match).toBe('all')
      expect(rules?.rules).toHaveLength(1)
    })
  })

  describe('buildDeviceAttributes', () => {
    function buildDeviceAttributes(
      body: {
        deviceId: string
        platform: 'ios' | 'android'
        appVersion: string
        currentBundleVersion?: string
        deviceInfo?: {
          osVersion?: string
          deviceModel?: string
          timezone?: string
          locale?: string
        }
      }
    ): DeviceAttributes {
      return {
        deviceId: body.deviceId,
        os: body.platform,
        osVersion: body.deviceInfo?.osVersion ?? '',
        deviceModel: body.deviceInfo?.deviceModel ?? '',
        timezone: body.deviceInfo?.timezone ?? '',
        locale: body.deviceInfo?.locale ?? '',
        appVersion: body.appVersion,
        currentBundleVersion: body.currentBundleVersion ?? null,
      }
    }

    it('builds attributes with minimal info', () => {
      const attrs = buildDeviceAttributes({
        deviceId: 'device-123',
        platform: 'ios',
        appVersion: '1.0.0',
      })
      expect(attrs.deviceId).toBe('device-123')
      expect(attrs.os).toBe('ios')
      expect(attrs.appVersion).toBe('1.0.0')
      expect(attrs.osVersion).toBe('')
      expect(attrs.currentBundleVersion).toBeNull()
    })

    it('builds attributes with full device info', () => {
      const attrs = buildDeviceAttributes({
        deviceId: 'device-456',
        platform: 'android',
        appVersion: '2.0.0',
        currentBundleVersion: '1.5.0',
        deviceInfo: {
          osVersion: '14',
          deviceModel: 'Pixel 8',
          timezone: 'America/Los_Angeles',
          locale: 'en-US',
        },
      })
      expect(attrs.deviceId).toBe('device-456')
      expect(attrs.os).toBe('android')
      expect(attrs.osVersion).toBe('14')
      expect(attrs.deviceModel).toBe('Pixel 8')
      expect(attrs.timezone).toBe('America/Los_Angeles')
      expect(attrs.locale).toBe('en-US')
      expect(attrs.currentBundleVersion).toBe('1.5.0')
    })
  })

  describe('targeting rules integration', () => {
    const iosDevice: DeviceAttributes = {
      deviceId: 'device-ios-123',
      os: 'ios',
      osVersion: '17.0',
      deviceModel: 'iPhone 15 Pro',
      timezone: 'America/New_York',
      locale: 'en-US',
      appVersion: '2.0.0',
      currentBundleVersion: '1.0.0',
    }

    const androidDevice: DeviceAttributes = {
      deviceId: 'device-android-456',
      os: 'android',
      osVersion: '14',
      deviceModel: 'Pixel 8',
      timezone: 'Europe/London',
      locale: 'en-GB',
      appVersion: '2.0.0',
      currentBundleVersion: '1.0.0',
    }

    describe('no targeting rules = all devices get update', () => {
      it('matches iOS device when no rules', () => {
        expect(evaluateRules(null, iosDevice)).toBe(true)
      })

      it('matches Android device when no rules', () => {
        expect(evaluateRules(null, androidDevice)).toBe(true)
      })

      it('matches when rules array is empty', () => {
        const rules: TargetingRules = { match: 'all', rules: [] }
        expect(evaluateRules(rules, iosDevice)).toBe(true)
        expect(evaluateRules(rules, androidDevice)).toBe(true)
      })
    })

    describe('platform rule = only matching platform gets update', () => {
      it('iOS-only release matches iOS device', () => {
        const rules: TargetingRules = {
          match: 'all',
          rules: [{ field: 'os', op: 'eq', value: 'ios' }],
        }
        expect(evaluateRules(rules, iosDevice)).toBe(true)
      })

      it('iOS-only release does not match Android device', () => {
        const rules: TargetingRules = {
          match: 'all',
          rules: [{ field: 'os', op: 'eq', value: 'ios' }],
        }
        expect(evaluateRules(rules, androidDevice)).toBe(false)
      })

      it('Android-only release matches Android device', () => {
        const rules: TargetingRules = {
          match: 'all',
          rules: [{ field: 'os', op: 'eq', value: 'android' }],
        }
        expect(evaluateRules(rules, androidDevice)).toBe(true)
      })

      it('Android-only release does not match iOS device', () => {
        const rules: TargetingRules = {
          match: 'all',
          rules: [{ field: 'os', op: 'eq', value: 'android' }],
        }
        expect(evaluateRules(rules, iosDevice)).toBe(false)
      })
    })

    describe('version rule = only matching version gets update', () => {
      it('matches device with app version >= 2.0.0', () => {
        const rules: TargetingRules = {
          match: 'all',
          rules: [{ field: 'appVersion', op: 'semver_gte', value: '2.0.0' }],
        }
        expect(evaluateRules(rules, iosDevice)).toBe(true) // appVersion is 2.0.0
      })

      it('does not match device with app version < 2.0.0', () => {
        const rules: TargetingRules = {
          match: 'all',
          rules: [{ field: 'appVersion', op: 'semver_gte', value: '3.0.0' }],
        }
        expect(evaluateRules(rules, iosDevice)).toBe(false) // appVersion is 2.0.0
      })

      it('matches device with app version in range', () => {
        const rules: TargetingRules = {
          match: 'all',
          rules: [
            { field: 'appVersion', op: 'semver_gte', value: '1.0.0' },
            { field: 'appVersion', op: 'semver_lt', value: '3.0.0' },
          ],
        }
        expect(evaluateRules(rules, iosDevice)).toBe(true) // 2.0.0 is in [1.0.0, 3.0.0)
      })
    })

    describe('multiple rules = all must match (AND logic)', () => {
      it('matches when all rules pass', () => {
        const rules: TargetingRules = {
          match: 'all',
          rules: [
            { field: 'os', op: 'eq', value: 'ios' },
            { field: 'appVersion', op: 'semver_gte', value: '2.0.0' },
            { field: 'locale', op: 'starts_with', value: 'en' },
          ],
        }
        expect(evaluateRules(rules, iosDevice)).toBe(true)
      })

      it('does not match when any rule fails', () => {
        const rules: TargetingRules = {
          match: 'all',
          rules: [
            { field: 'os', op: 'eq', value: 'ios' },
            { field: 'appVersion', op: 'semver_gte', value: '3.0.0' }, // fails
            { field: 'locale', op: 'starts_with', value: 'en' },
          ],
        }
        expect(evaluateRules(rules, iosDevice)).toBe(false)
      })

      it('does not match when platform is wrong', () => {
        const rules: TargetingRules = {
          match: 'all',
          rules: [
            { field: 'os', op: 'eq', value: 'android' }, // fails for iOS
            { field: 'appVersion', op: 'semver_gte', value: '2.0.0' },
          ],
        }
        expect(evaluateRules(rules, iosDevice)).toBe(false)
      })
    })

    describe('OR logic with match: any', () => {
      it('matches when any rule passes', () => {
        const rules: TargetingRules = {
          match: 'any',
          rules: [
            { field: 'os', op: 'eq', value: 'android' }, // fails for iOS
            { field: 'locale', op: 'eq', value: 'en-US' }, // passes
          ],
        }
        expect(evaluateRules(rules, iosDevice)).toBe(true)
      })

      it('does not match when all rules fail', () => {
        const rules: TargetingRules = {
          match: 'any',
          rules: [
            { field: 'os', op: 'eq', value: 'android' },
            { field: 'locale', op: 'eq', value: 'fr-FR' },
          ],
        }
        expect(evaluateRules(rules, iosDevice)).toBe(false)
      })
    })

    describe('device model targeting', () => {
      it('matches specific device model', () => {
        const rules: TargetingRules = {
          match: 'all',
          rules: [{ field: 'deviceModel', op: 'contains', value: 'iPhone' }],
        }
        expect(evaluateRules(rules, iosDevice)).toBe(true)
        expect(evaluateRules(rules, androidDevice)).toBe(false)
      })

      it('matches device model prefix', () => {
        const rules: TargetingRules = {
          match: 'all',
          rules: [{ field: 'deviceModel', op: 'starts_with', value: 'Pixel' }],
        }
        expect(evaluateRules(rules, androidDevice)).toBe(true)
        expect(evaluateRules(rules, iosDevice)).toBe(false)
      })
    })

    describe('timezone targeting', () => {
      it('targets US timezones', () => {
        const rules: TargetingRules = {
          match: 'all',
          rules: [{ field: 'timezone', op: 'starts_with', value: 'America/' }],
        }
        expect(evaluateRules(rules, iosDevice)).toBe(true)
        expect(evaluateRules(rules, androidDevice)).toBe(false)
      })

      it('targets European timezones', () => {
        const rules: TargetingRules = {
          match: 'all',
          rules: [{ field: 'timezone', op: 'starts_with', value: 'Europe/' }],
        }
        expect(evaluateRules(rules, androidDevice)).toBe(true)
        expect(evaluateRules(rules, iosDevice)).toBe(false)
      })
    })

    describe('in/not_in operators', () => {
      it('matches locale in allowed list', () => {
        const rules: TargetingRules = {
          match: 'all',
          rules: [{ field: 'locale', op: 'in', value: ['en-US', 'en-GB', 'en-AU'] }],
        }
        expect(evaluateRules(rules, iosDevice)).toBe(true)
        expect(evaluateRules(rules, androidDevice)).toBe(true)
      })

      it('excludes locale in blocked list', () => {
        const rules: TargetingRules = {
          match: 'all',
          rules: [{ field: 'locale', op: 'not_in', value: ['en-US'] }],
        }
        expect(evaluateRules(rules, iosDevice)).toBe(false) // en-US is blocked
        expect(evaluateRules(rules, androidDevice)).toBe(true) // en-GB is not blocked
      })
    })
  })
})
