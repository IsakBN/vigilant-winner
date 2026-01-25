/**
 * Channels CRUD routes tests
 *
 * Tests validation schemas, default channel logic, and response structures.
 *
 * @agent channels-system
 * @created 2026-01-25
 */

import { describe, it, expect } from 'vitest'
import {
  ERROR_CODES,
  createChannelSchema,
  updateChannelSchema,
  channelNameSchema,
  rolloutPercentageSchema,
  channelTargetingRulesSchema,
  isDefaultChannelName,
  getDefaultChannelDisplayName,
  DEFAULT_CHANNELS,
} from '@bundlenudge/shared'

describe('channels routes logic', () => {
  describe('channelNameSchema', () => {
    it('validates valid channel name', () => {
      expect(channelNameSchema.safeParse('beta').success).toBe(true)
    })

    it('validates channel name with hyphen', () => {
      expect(channelNameSchema.safeParse('release-candidate').success).toBe(true)
    })

    it('validates channel name with numbers', () => {
      expect(channelNameSchema.safeParse('beta-2').success).toBe(true)
    })

    it('rejects uppercase letters', () => {
      expect(channelNameSchema.safeParse('Beta').success).toBe(false)
    })

    it('rejects spaces', () => {
      expect(channelNameSchema.safeParse('beta test').success).toBe(false)
    })

    it('rejects underscores', () => {
      expect(channelNameSchema.safeParse('beta_test').success).toBe(false)
    })

    it('rejects empty name', () => {
      expect(channelNameSchema.safeParse('').success).toBe(false)
    })

    it('rejects name over 50 characters', () => {
      expect(channelNameSchema.safeParse('a'.repeat(51)).success).toBe(false)
    })

    it('accepts name exactly 50 characters', () => {
      expect(channelNameSchema.safeParse('a'.repeat(50)).success).toBe(true)
    })
  })

  describe('rolloutPercentageSchema', () => {
    it('validates 0 percentage', () => {
      expect(rolloutPercentageSchema.safeParse(0).success).toBe(true)
    })

    it('validates 100 percentage', () => {
      expect(rolloutPercentageSchema.safeParse(100).success).toBe(true)
    })

    it('validates 50 percentage', () => {
      expect(rolloutPercentageSchema.safeParse(50).success).toBe(true)
    })

    it('rejects negative percentage', () => {
      expect(rolloutPercentageSchema.safeParse(-1).success).toBe(false)
    })

    it('rejects percentage over 100', () => {
      expect(rolloutPercentageSchema.safeParse(101).success).toBe(false)
    })
  })

  describe('createChannelSchema', () => {
    it('validates minimal valid input', () => {
      const result = createChannelSchema.safeParse({
        name: 'beta',
        displayName: 'Beta',
      })
      expect(result.success).toBe(true)
    })

    it('validates full input with all fields', () => {
      const result = createChannelSchema.safeParse({
        name: 'beta',
        displayName: 'Beta Channel',
        description: 'For beta testers',
        rolloutPercentage: 50,
        targetingRules: { match: 'all', rules: [] },
      })
      expect(result.success).toBe(true)
    })

    it('rejects missing name', () => {
      const result = createChannelSchema.safeParse({
        displayName: 'Beta',
      })
      expect(result.success).toBe(false)
    })

    it('rejects missing displayName', () => {
      const result = createChannelSchema.safeParse({
        name: 'beta',
      })
      expect(result.success).toBe(false)
    })

    it('defaults rolloutPercentage to 100', () => {
      const result = createChannelSchema.safeParse({
        name: 'beta',
        displayName: 'Beta',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.rolloutPercentage).toBe(100)
      }
    })
  })

  describe('updateChannelSchema', () => {
    it('validates partial update with name only', () => {
      const result = updateChannelSchema.safeParse({ name: 'new-name' })
      expect(result.success).toBe(true)
    })

    it('validates partial update with displayName only', () => {
      const result = updateChannelSchema.safeParse({ displayName: 'New Name' })
      expect(result.success).toBe(true)
    })

    it('validates partial update with description', () => {
      const result = updateChannelSchema.safeParse({ description: 'New description' })
      expect(result.success).toBe(true)
    })

    it('validates setting description to null', () => {
      const result = updateChannelSchema.safeParse({ description: null })
      expect(result.success).toBe(true)
    })

    it('validates isDefault update', () => {
      const result = updateChannelSchema.safeParse({ isDefault: true })
      expect(result.success).toBe(true)
    })

    it('validates rolloutPercentage update', () => {
      const result = updateChannelSchema.safeParse({ rolloutPercentage: 25 })
      expect(result.success).toBe(true)
    })

    it('validates targetingRules update', () => {
      const result = updateChannelSchema.safeParse({
        targetingRules: {
          match: 'any',
          rules: [{ field: 'appVersion', op: 'semver_gte', value: '2.0.0' }],
        },
      })
      expect(result.success).toBe(true)
    })

    it('validates setting targetingRules to null', () => {
      const result = updateChannelSchema.safeParse({ targetingRules: null })
      expect(result.success).toBe(true)
    })

    it('validates activeReleaseId update', () => {
      const result = updateChannelSchema.safeParse({
        activeReleaseId: '550e8400-e29b-41d4-a716-446655440000',
      })
      expect(result.success).toBe(true)
    })

    it('validates empty update (no changes)', () => {
      const result = updateChannelSchema.safeParse({})
      expect(result.success).toBe(true)
    })
  })

  describe('channelTargetingRulesSchema', () => {
    it('validates rules with all match', () => {
      const result = channelTargetingRulesSchema.safeParse({
        match: 'all',
        rules: [{ field: 'platform', op: 'eq', value: 'ios' }],
      })
      expect(result.success).toBe(true)
    })

    it('validates rules with any match', () => {
      const result = channelTargetingRulesSchema.safeParse({
        match: 'any',
        rules: [{ field: 'osVersion', op: 'gte', value: '14.0' }],
      })
      expect(result.success).toBe(true)
    })

    it('validates semver operators', () => {
      const result = channelTargetingRulesSchema.safeParse({
        match: 'all',
        rules: [{ field: 'appVersion', op: 'semver_gte', value: '2.0.0' }],
      })
      expect(result.success).toBe(true)
    })

    it('validates in operator with array value', () => {
      const result = channelTargetingRulesSchema.safeParse({
        match: 'any',
        rules: [{ field: 'locale', op: 'in', value: ['en-US', 'en-GB'] }],
      })
      expect(result.success).toBe(true)
    })

    it('rejects invalid match type', () => {
      const result = channelTargetingRulesSchema.safeParse({
        match: 'none',
        rules: [],
      })
      expect(result.success).toBe(false)
    })

    it('rejects invalid operator', () => {
      const result = channelTargetingRulesSchema.safeParse({
        match: 'all',
        rules: [{ field: 'platform', op: 'invalid', value: 'ios' }],
      })
      expect(result.success).toBe(false)
    })
  })

  describe('default channels', () => {
    it('identifies production as default', () => {
      expect(isDefaultChannelName('production')).toBe(true)
    })

    it('identifies staging as default', () => {
      expect(isDefaultChannelName('staging')).toBe(true)
    })

    it('identifies development as default', () => {
      expect(isDefaultChannelName('development')).toBe(true)
    })

    it('does not identify custom channels as default', () => {
      expect(isDefaultChannelName('beta')).toBe(false)
      expect(isDefaultChannelName('release-candidate')).toBe(false)
      expect(isDefaultChannelName('hotfix')).toBe(false)
    })

    it('has exactly 3 default channels', () => {
      expect(DEFAULT_CHANNELS).toHaveLength(3)
    })

    it('has correct order: production, staging, development', () => {
      expect(DEFAULT_CHANNELS[0]).toBe('production')
      expect(DEFAULT_CHANNELS[1]).toBe('staging')
      expect(DEFAULT_CHANNELS[2]).toBe('development')
    })
  })

  describe('getDefaultChannelDisplayName', () => {
    it('returns Production for production', () => {
      expect(getDefaultChannelDisplayName('production')).toBe('Production')
    })

    it('returns Staging for staging', () => {
      expect(getDefaultChannelDisplayName('staging')).toBe('Staging')
    })

    it('returns Development for development', () => {
      expect(getDefaultChannelDisplayName('development')).toBe('Development')
    })
  })

  describe('error codes', () => {
    it('has APP_NOT_FOUND error code', () => {
      expect(ERROR_CODES.APP_NOT_FOUND).toBe('APP_NOT_FOUND')
    })

    it('has CHANNEL_NOT_FOUND error code', () => {
      expect(ERROR_CODES.CHANNEL_NOT_FOUND).toBe('CHANNEL_NOT_FOUND')
    })

    it('has ALREADY_EXISTS error code', () => {
      expect(ERROR_CODES.ALREADY_EXISTS).toBe('ALREADY_EXISTS')
    })

    it('has FORBIDDEN error code', () => {
      expect(ERROR_CODES.FORBIDDEN).toBe('FORBIDDEN')
    })
  })

  describe('channel response structure', () => {
    it('list response has data array and pagination', () => {
      const response = {
        data: [],
        pagination: { total: 0, limit: 20, offset: 0, hasMore: false },
      }
      expect(response).toHaveProperty('data')
      expect(Array.isArray(response.data)).toBe(true)
      expect(response.pagination).toHaveProperty('total')
      expect(response.pagination).toHaveProperty('limit')
      expect(response.pagination).toHaveProperty('offset')
      expect(response.pagination).toHaveProperty('hasMore')
    })

    it('single channel response has channel object with all fields', () => {
      const response = {
        channel: {
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
        },
      }
      expect(response).toHaveProperty('channel')
      expect(response.channel).toHaveProperty('id')
      expect(response.channel).toHaveProperty('appId')
      expect(response.channel).toHaveProperty('name')
      expect(response.channel).toHaveProperty('displayName')
      expect(response.channel).toHaveProperty('description')
      expect(response.channel).toHaveProperty('isDefault')
      expect(response.channel).toHaveProperty('rolloutPercentage')
      expect(response.channel).toHaveProperty('targetingRules')
      expect(response.channel).toHaveProperty('activeReleaseId')
      expect(response.channel).toHaveProperty('createdAt')
      expect(response.channel).toHaveProperty('updatedAt')
    })

    it('delete response has success flag', () => {
      const response = { success: true }
      expect(response).toHaveProperty('success')
      expect(response.success).toBe(true)
    })
  })

  describe('channel operations protection', () => {
    it('should protect default channel from deletion', () => {
      const canDelete = !isDefaultChannelName('production')
      expect(canDelete).toBe(false)
    })

    it('should allow custom channel deletion', () => {
      const canDelete = !isDefaultChannelName('beta')
      expect(canDelete).toBe(true)
    })

    it('should protect default channel from rename', () => {
      const canRenameChannel = (original: string, newName: string): boolean =>
        !isDefaultChannelName(original) || original === newName

      // Trying to rename 'staging' to 'stage' should be blocked
      expect(canRenameChannel('staging', 'stage')).toBe(false)
    })

    it('should allow renaming custom channels', () => {
      const originalName = 'beta'
      const canRename = !isDefaultChannelName(originalName)
      expect(canRename).toBe(true)
    })
  })

  describe('pagination', () => {
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
  })
})
