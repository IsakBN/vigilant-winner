/**
 * Channel schema tests
 *
 * @agent channels-system
 * @created 2026-01-25
 */

import { describe, it, expect } from 'vitest'
import {
  channelNameSchema,
  channelDisplayNameSchema,
  rolloutPercentageSchema,
  channelTargetingRuleSchema,
  channelTargetingRulesSchema,
  createChannelSchema,
  updateChannelSchema,
  channelSchema,
  isDefaultChannelName,
  getDefaultChannelDisplayName,
  DEFAULT_CHANNELS,
} from './channels'

describe('channelNameSchema', () => {
  it('accepts valid lowercase names', () => {
    expect(channelNameSchema.safeParse('production').success).toBe(true)
    expect(channelNameSchema.safeParse('staging').success).toBe(true)
    expect(channelNameSchema.safeParse('beta').success).toBe(true)
  })

  it('accepts names with hyphens', () => {
    expect(channelNameSchema.safeParse('release-candidate').success).toBe(true)
    expect(channelNameSchema.safeParse('pre-release').success).toBe(true)
  })

  it('accepts names with numbers', () => {
    expect(channelNameSchema.safeParse('beta1').success).toBe(true)
    expect(channelNameSchema.safeParse('v2-beta').success).toBe(true)
  })

  it('rejects uppercase', () => {
    expect(channelNameSchema.safeParse('Production').success).toBe(false)
    expect(channelNameSchema.safeParse('BETA').success).toBe(false)
  })

  it('rejects spaces', () => {
    expect(channelNameSchema.safeParse('my channel').success).toBe(false)
  })

  it('rejects underscores', () => {
    expect(channelNameSchema.safeParse('my_channel').success).toBe(false)
  })

  it('rejects empty string', () => {
    expect(channelNameSchema.safeParse('').success).toBe(false)
  })

  it('rejects strings longer than 50 chars', () => {
    expect(channelNameSchema.safeParse('a'.repeat(51)).success).toBe(false)
    expect(channelNameSchema.safeParse('a'.repeat(50)).success).toBe(true)
  })
})

describe('channelDisplayNameSchema', () => {
  it('accepts valid display names', () => {
    expect(channelDisplayNameSchema.safeParse('Production').success).toBe(true)
    expect(channelDisplayNameSchema.safeParse('Beta Channel').success).toBe(true)
    expect(channelDisplayNameSchema.safeParse('Release Candidate 2').success).toBe(true)
  })

  it('rejects empty string', () => {
    expect(channelDisplayNameSchema.safeParse('').success).toBe(false)
  })

  it('rejects strings longer than 100 chars', () => {
    expect(channelDisplayNameSchema.safeParse('a'.repeat(101)).success).toBe(false)
    expect(channelDisplayNameSchema.safeParse('a'.repeat(100)).success).toBe(true)
  })
})

describe('rolloutPercentageSchema', () => {
  it('accepts valid percentages', () => {
    expect(rolloutPercentageSchema.safeParse(0).success).toBe(true)
    expect(rolloutPercentageSchema.safeParse(50).success).toBe(true)
    expect(rolloutPercentageSchema.safeParse(100).success).toBe(true)
  })

  it('rejects negative numbers', () => {
    expect(rolloutPercentageSchema.safeParse(-1).success).toBe(false)
    expect(rolloutPercentageSchema.safeParse(-100).success).toBe(false)
  })

  it('rejects numbers over 100', () => {
    expect(rolloutPercentageSchema.safeParse(101).success).toBe(false)
    expect(rolloutPercentageSchema.safeParse(200).success).toBe(false)
  })
})

describe('channelTargetingRuleSchema', () => {
  it('validates basic equality rule', () => {
    const rule = { field: 'platform', op: 'eq' as const, value: 'ios' }
    expect(channelTargetingRuleSchema.safeParse(rule).success).toBe(true)
  })

  it('validates semver comparison rule', () => {
    const rule = { field: 'appVersion', op: 'semver_gte' as const, value: '2.0.0' }
    expect(channelTargetingRuleSchema.safeParse(rule).success).toBe(true)
  })

  it('validates array value for in operator', () => {
    const rule = { field: 'locale', op: 'in' as const, value: ['en-US', 'en-GB'] }
    expect(channelTargetingRuleSchema.safeParse(rule).success).toBe(true)
  })

  it('validates numeric value', () => {
    const rule = { field: 'minVersion', op: 'gte' as const, value: 10 }
    expect(channelTargetingRuleSchema.safeParse(rule).success).toBe(true)
  })
})

describe('channelTargetingRulesSchema', () => {
  it('validates rules with all match', () => {
    const rules = {
      match: 'all' as const,
      rules: [
        { field: 'platform', op: 'eq' as const, value: 'ios' },
        { field: 'appVersion', op: 'semver_gte' as const, value: '2.0.0' },
      ],
    }
    expect(channelTargetingRulesSchema.safeParse(rules).success).toBe(true)
  })

  it('validates rules with any match', () => {
    const rules = {
      match: 'any' as const,
      rules: [{ field: 'locale', op: 'in' as const, value: ['en-US'] }],
    }
    expect(channelTargetingRulesSchema.safeParse(rules).success).toBe(true)
  })

  it('validates empty rules array', () => {
    const rules = { match: 'all' as const, rules: [] }
    expect(channelTargetingRulesSchema.safeParse(rules).success).toBe(true)
  })
})

describe('createChannelSchema', () => {
  it('validates minimal input', () => {
    const input = { name: 'beta', displayName: 'Beta' }
    expect(createChannelSchema.safeParse(input).success).toBe(true)
  })

  it('validates full input', () => {
    const input = {
      name: 'beta',
      displayName: 'Beta',
      description: 'For beta testers',
      rolloutPercentage: 50,
      targetingRules: { match: 'all' as const, rules: [] },
    }
    expect(createChannelSchema.safeParse(input).success).toBe(true)
  })

  it('applies default rolloutPercentage of 100', () => {
    const input = { name: 'beta', displayName: 'Beta' }
    const result = createChannelSchema.safeParse(input)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.rolloutPercentage).toBe(100)
    }
  })
})

describe('updateChannelSchema', () => {
  it('validates empty object (no updates)', () => {
    expect(updateChannelSchema.safeParse({}).success).toBe(true)
  })

  it('validates partial updates', () => {
    expect(updateChannelSchema.safeParse({ name: 'new-name' }).success).toBe(true)
    expect(updateChannelSchema.safeParse({ displayName: 'New Name' }).success).toBe(true)
    expect(updateChannelSchema.safeParse({ rolloutPercentage: 75 }).success).toBe(true)
  })

  it('validates null values for nullable fields', () => {
    expect(updateChannelSchema.safeParse({ description: null }).success).toBe(true)
    expect(updateChannelSchema.safeParse({ targetingRules: null }).success).toBe(true)
    expect(updateChannelSchema.safeParse({ activeReleaseId: null }).success).toBe(true)
  })
})

describe('channelSchema', () => {
  it('validates complete channel object', () => {
    const channel = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      appId: '550e8400-e29b-41d4-a716-446655440001',
      name: 'production',
      displayName: 'Production',
      description: null,
      isDefault: true,
      rolloutPercentage: 100,
      targetingRules: null,
      activeReleaseId: null,
      createdAt: 1234567890,
      updatedAt: 1234567890,
    }
    expect(channelSchema.safeParse(channel).success).toBe(true)
  })
})

describe('isDefaultChannelName', () => {
  it('returns true for default channels', () => {
    expect(isDefaultChannelName('production')).toBe(true)
    expect(isDefaultChannelName('staging')).toBe(true)
    expect(isDefaultChannelName('development')).toBe(true)
  })

  it('returns false for custom channels', () => {
    expect(isDefaultChannelName('beta')).toBe(false)
    expect(isDefaultChannelName('canary')).toBe(false)
    expect(isDefaultChannelName('hotfix')).toBe(false)
  })
})

describe('getDefaultChannelDisplayName', () => {
  it('returns correct display names', () => {
    expect(getDefaultChannelDisplayName('production')).toBe('Production')
    expect(getDefaultChannelDisplayName('staging')).toBe('Staging')
    expect(getDefaultChannelDisplayName('development')).toBe('Development')
  })
})

describe('DEFAULT_CHANNELS', () => {
  it('contains exactly 3 channels', () => {
    expect(DEFAULT_CHANNELS).toHaveLength(3)
  })

  it('has production first (for default)', () => {
    expect(DEFAULT_CHANNELS[0]).toBe('production')
  })
})
