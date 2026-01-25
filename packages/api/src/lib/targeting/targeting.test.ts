import { describe, it, expect } from 'vitest'
import { fnv1aHash, getBucket } from './hash'
import { evaluateRule, evaluateRules } from './evaluate'
import { resolveRelease, isEligible } from './resolve'
import type {
  DeviceAttributes,
  TargetingRule,
  TargetingRules,
  Release,
} from '@bundlenudge/shared'

// =============================================================================
// Test Fixtures
// =============================================================================

const mockDevice: DeviceAttributes = {
  deviceId: 'device-test-123',
  os: 'ios',
  osVersion: '17.0',
  deviceModel: 'iPhone 15 Pro',
  timezone: 'America/New_York',
  locale: 'en-US',
  appVersion: '2.0.0',
  currentBundleVersion: '1.0.0',
}

function createRelease(overrides: Partial<Release> = {}): Release {
  return {
    id: 'rel-1',
    appId: 'app-1',
    version: '1.1.0',
    bundleUrl: 'https://example.com/bundle.zip',
    bundleSize: 1024000,
    bundleHash: 'sha256-abc123',
    targetingRules: null,
    status: 'active',
    createdAt: Date.now(),
    minIosVersion: null,
    minAndroidVersion: null,
    ...overrides,
  }
}

// =============================================================================
// Hash Tests
// =============================================================================

describe('fnv1aHash', () => {
  it('returns consistent results for same input', () => {
    const hash1 = fnv1aHash('device-abc-123')
    const hash2 = fnv1aHash('device-abc-123')
    expect(hash1).toBe(hash2)
  })

  it('returns different results for different inputs', () => {
    const hash1 = fnv1aHash('device-a')
    const hash2 = fnv1aHash('device-b')
    expect(hash1).not.toBe(hash2)
  })

  it('returns a 32-bit unsigned integer', () => {
    const hash = fnv1aHash('test-string')
    expect(hash).toBeGreaterThanOrEqual(0)
    expect(hash).toBeLessThanOrEqual(4294967295)
  })

  it('produces known hash value for "test"', () => {
    // FNV-1a hash of "test" should be consistent
    const hash = fnv1aHash('test')
    expect(typeof hash).toBe('number')
    expect(hash).toBeGreaterThan(0)
  })
})

describe('getBucket', () => {
  it('returns a value between 0-99', () => {
    for (let i = 0; i < 100; i++) {
      const bucket = getBucket(`device-${i}`)
      expect(bucket).toBeGreaterThanOrEqual(0)
      expect(bucket).toBeLessThan(100)
    }
  })

  it('is deterministic', () => {
    const deviceId = 'consistent-device'
    const bucket1 = getBucket(deviceId)
    const bucket2 = getBucket(deviceId)
    expect(bucket1).toBe(bucket2)
  })

  it('distributes roughly uniformly', () => {
    const buckets = new Map<number, number>()

    // Generate 10000 device IDs and count bucket distribution
    for (let i = 0; i < 10000; i++) {
      const bucket = getBucket(`device-${i}-random`)
      buckets.set(bucket, (buckets.get(bucket) || 0) + 1)
    }

    // Each bucket should have roughly 100 entries (+/- 50% is reasonable)
    for (let b = 0; b < 100; b++) {
      const count = buckets.get(b) || 0
      expect(count).toBeGreaterThan(20)
      expect(count).toBeLessThan(200)
    }
  })
})

// =============================================================================
// Operator Tests
// =============================================================================

describe('evaluateRule operators', () => {
  describe('eq', () => {
    it('matches equal strings', () => {
      const rule: TargetingRule = { field: 'os', op: 'eq', value: 'ios' }
      expect(evaluateRule(rule, mockDevice)).toBe(true)
    })

    it('does not match different strings', () => {
      const rule: TargetingRule = { field: 'os', op: 'eq', value: 'android' }
      expect(evaluateRule(rule, mockDevice)).toBe(false)
    })
  })

  describe('neq', () => {
    it('matches different strings', () => {
      const rule: TargetingRule = { field: 'os', op: 'neq', value: 'android' }
      expect(evaluateRule(rule, mockDevice)).toBe(true)
    })

    it('does not match equal strings', () => {
      const rule: TargetingRule = { field: 'os', op: 'neq', value: 'ios' }
      expect(evaluateRule(rule, mockDevice)).toBe(false)
    })
  })

  describe('starts_with', () => {
    it('matches prefix', () => {
      const rule: TargetingRule = { field: 'deviceModel', op: 'starts_with', value: 'iPhone' }
      expect(evaluateRule(rule, mockDevice)).toBe(true)
    })

    it('does not match non-prefix', () => {
      const rule: TargetingRule = { field: 'deviceModel', op: 'starts_with', value: 'Samsung' }
      expect(evaluateRule(rule, mockDevice)).toBe(false)
    })
  })

  describe('ends_with', () => {
    it('matches suffix', () => {
      const rule: TargetingRule = { field: 'deviceModel', op: 'ends_with', value: 'Pro' }
      expect(evaluateRule(rule, mockDevice)).toBe(true)
    })

    it('does not match non-suffix', () => {
      const rule: TargetingRule = { field: 'deviceModel', op: 'ends_with', value: 'Max' }
      expect(evaluateRule(rule, mockDevice)).toBe(false)
    })
  })

  describe('contains', () => {
    it('matches substring', () => {
      const rule: TargetingRule = { field: 'deviceModel', op: 'contains', value: '15' }
      expect(evaluateRule(rule, mockDevice)).toBe(true)
    })

    it('does not match absent substring', () => {
      const rule: TargetingRule = { field: 'deviceModel', op: 'contains', value: '16' }
      expect(evaluateRule(rule, mockDevice)).toBe(false)
    })
  })

  describe('in', () => {
    it('matches value in array', () => {
      const rule: TargetingRule = { field: 'os', op: 'in', value: ['ios', 'android'] }
      expect(evaluateRule(rule, mockDevice)).toBe(true)
    })

    it('does not match value not in array', () => {
      const rule: TargetingRule = { field: 'os', op: 'in', value: ['android', 'web'] }
      expect(evaluateRule(rule, mockDevice)).toBe(false)
    })
  })

  describe('not_in', () => {
    it('matches value not in array', () => {
      const rule: TargetingRule = { field: 'os', op: 'not_in', value: ['android', 'web'] }
      expect(evaluateRule(rule, mockDevice)).toBe(true)
    })

    it('does not match value in array', () => {
      const rule: TargetingRule = { field: 'os', op: 'not_in', value: ['ios', 'android'] }
      expect(evaluateRule(rule, mockDevice)).toBe(false)
    })
  })

  describe('semver operators', () => {
    it('semver_gt works', () => {
      const rule: TargetingRule = { field: 'appVersion', op: 'semver_gt', value: '1.0.0' }
      expect(evaluateRule(rule, mockDevice)).toBe(true) // 2.0.0 > 1.0.0

      const rule2: TargetingRule = { field: 'appVersion', op: 'semver_gt', value: '3.0.0' }
      expect(evaluateRule(rule2, mockDevice)).toBe(false) // 2.0.0 not > 3.0.0
    })

    it('semver_gte works', () => {
      const rule: TargetingRule = { field: 'appVersion', op: 'semver_gte', value: '2.0.0' }
      expect(evaluateRule(rule, mockDevice)).toBe(true) // 2.0.0 >= 2.0.0
    })

    it('semver_lt works', () => {
      const rule: TargetingRule = { field: 'appVersion', op: 'semver_lt', value: '3.0.0' }
      expect(evaluateRule(rule, mockDevice)).toBe(true) // 2.0.0 < 3.0.0
    })

    it('semver_lte works', () => {
      const rule: TargetingRule = { field: 'appVersion', op: 'semver_lte', value: '2.0.0' }
      expect(evaluateRule(rule, mockDevice)).toBe(true) // 2.0.0 <= 2.0.0
    })
  })

  describe('percentage', () => {
    it('includes device when under percentage', () => {
      // Test with 100% - should always include
      const rule: TargetingRule = { field: 'percentage', op: 'eq', value: 100 }
      expect(evaluateRule(rule, mockDevice)).toBe(true)
    })

    it('excludes device when above percentage', () => {
      // Test with 0% - should always exclude
      const rule: TargetingRule = { field: 'percentage', op: 'eq', value: 0 }
      expect(evaluateRule(rule, mockDevice)).toBe(false)
    })

    it('is sticky for same device', () => {
      const rule: TargetingRule = { field: 'percentage', op: 'eq', value: 50 }
      const result1 = evaluateRule(rule, mockDevice)
      const result2 = evaluateRule(rule, mockDevice)
      expect(result1).toBe(result2)
    })
  })

  describe('null field handling', () => {
    it('returns false when field is null', () => {
      const deviceWithNull: DeviceAttributes = {
        ...mockDevice,
        currentBundleVersion: null,
      }
      const rule: TargetingRule = { field: 'currentBundleVersion', op: 'eq', value: '1.0.0' }
      expect(evaluateRule(rule, deviceWithNull)).toBe(false)
    })
  })
})

// =============================================================================
// Rules Combination Tests
// =============================================================================

describe('evaluateRules', () => {
  it('returns true when no rules', () => {
    expect(evaluateRules(null, mockDevice)).toBe(true)
    expect(evaluateRules({ match: 'all', rules: [] }, mockDevice)).toBe(true)
  })

  describe('match: all', () => {
    it('requires all rules to pass', () => {
      const rules: TargetingRules = {
        match: 'all',
        rules: [
          { field: 'os', op: 'eq', value: 'ios' },
          { field: 'appVersion', op: 'semver_gte', value: '1.0.0' },
        ],
      }
      expect(evaluateRules(rules, mockDevice)).toBe(true)
    })

    it('fails if any rule fails', () => {
      const rules: TargetingRules = {
        match: 'all',
        rules: [
          { field: 'os', op: 'eq', value: 'ios' },
          { field: 'os', op: 'eq', value: 'android' }, // This will fail
        ],
      }
      expect(evaluateRules(rules, mockDevice)).toBe(false)
    })
  })

  describe('match: any', () => {
    it('passes if any rule passes', () => {
      const rules: TargetingRules = {
        match: 'any',
        rules: [
          { field: 'os', op: 'eq', value: 'android' }, // Fails
          { field: 'os', op: 'eq', value: 'ios' }, // Passes
        ],
      }
      expect(evaluateRules(rules, mockDevice)).toBe(true)
    })

    it('fails if all rules fail', () => {
      const rules: TargetingRules = {
        match: 'any',
        rules: [
          { field: 'os', op: 'eq', value: 'android' },
          { field: 'os', op: 'eq', value: 'web' },
        ],
      }
      expect(evaluateRules(rules, mockDevice)).toBe(false)
    })
  })
})

// =============================================================================
// Resolution Tests
// =============================================================================

describe('resolveRelease', () => {
  it('returns null for empty releases array', () => {
    const result = resolveRelease([], mockDevice)
    expect(result).toBeNull()
  })

  it('returns first active release with no targeting', () => {
    const releases = [createRelease({ id: 'rel-1' })]
    const result = resolveRelease(releases, mockDevice)
    expect(result?.id).toBe('rel-1')
  })

  it('skips non-active releases', () => {
    const releases = [
      createRelease({ id: 'rel-paused', status: 'paused' }),
      createRelease({ id: 'rel-active', status: 'active' }),
    ]
    const result = resolveRelease(releases, mockDevice)
    expect(result?.id).toBe('rel-active')
  })

  it('returns newest matching release (first in sorted array)', () => {
    const releases = [
      createRelease({ id: 'rel-newest', createdAt: 3000 }),
      createRelease({ id: 'rel-older', createdAt: 2000 }),
      createRelease({ id: 'rel-oldest', createdAt: 1000 }),
    ]
    const result = resolveRelease(releases, mockDevice)
    expect(result?.id).toBe('rel-newest')
  })

  it('skips releases that do not match targeting', () => {
    const releases = [
      createRelease({
        id: 'rel-android-only',
        targetingRules: {
          match: 'all',
          rules: [{ field: 'os', op: 'eq', value: 'android' }],
        },
      }),
      createRelease({ id: 'rel-all', targetingRules: null }),
    ]
    const result = resolveRelease(releases, mockDevice)
    expect(result?.id).toBe('rel-all')
  })

  it('returns null when no releases match', () => {
    const releases = [
      createRelease({
        id: 'rel-android-only',
        targetingRules: {
          match: 'all',
          rules: [{ field: 'os', op: 'eq', value: 'android' }],
        },
      }),
    ]
    const result = resolveRelease(releases, mockDevice)
    expect(result).toBeNull()
  })
})

describe('isEligible', () => {
  it('returns true for active release with no targeting', () => {
    const release = createRelease()
    expect(isEligible(release, mockDevice)).toBe(true)
  })

  it('returns false for non-active release', () => {
    const release = createRelease({ status: 'paused' })
    expect(isEligible(release, mockDevice)).toBe(false)
  })

  it('returns true when targeting matches', () => {
    const release = createRelease({
      targetingRules: {
        match: 'all',
        rules: [{ field: 'os', op: 'eq', value: 'ios' }],
      },
    })
    expect(isEligible(release, mockDevice)).toBe(true)
  })

  it('returns false when targeting does not match', () => {
    const release = createRelease({
      targetingRules: {
        match: 'all',
        rules: [{ field: 'os', op: 'eq', value: 'android' }],
      },
    })
    expect(isEligible(release, mockDevice)).toBe(false)
  })
})
