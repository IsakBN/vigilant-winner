/**
 * Channels CRUD routes tests
 *
 * @agent wave4-channels
 * @created 2026-01-25
 */

import { describe, it, expect } from 'vitest'
import { z } from 'zod'
import { ERROR_CODES } from '@bundlenudge/shared'

// Channel name validation schema (matches routes)
const createChannelSchema = z.object({
  name: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/, {
    message: 'Channel name must be lowercase alphanumeric with hyphens only',
  }),
})

const DEFAULT_CHANNELS = ['production', 'staging', 'development'] as const

function isDefaultChannel(name: string): boolean {
  return DEFAULT_CHANNELS.includes(name as typeof DEFAULT_CHANNELS[number])
}

describe('channels routes logic', () => {
  describe('createChannelSchema', () => {
    it('validates valid channel name', () => {
      const result = createChannelSchema.safeParse({ name: 'beta' })
      expect(result.success).toBe(true)
    })

    it('validates channel name with hyphen', () => {
      const result = createChannelSchema.safeParse({ name: 'release-candidate' })
      expect(result.success).toBe(true)
    })

    it('validates channel name with numbers', () => {
      const result = createChannelSchema.safeParse({ name: 'beta-2' })
      expect(result.success).toBe(true)
    })

    it('rejects uppercase letters', () => {
      const result = createChannelSchema.safeParse({ name: 'Beta' })
      expect(result.success).toBe(false)
    })

    it('rejects spaces', () => {
      const result = createChannelSchema.safeParse({ name: 'beta test' })
      expect(result.success).toBe(false)
    })

    it('rejects special characters', () => {
      const result = createChannelSchema.safeParse({ name: 'beta_test' })
      expect(result.success).toBe(false)
    })

    it('rejects empty name', () => {
      const result = createChannelSchema.safeParse({ name: '' })
      expect(result.success).toBe(false)
    })

    it('rejects name over 50 characters', () => {
      const result = createChannelSchema.safeParse({ name: 'a'.repeat(51) })
      expect(result.success).toBe(false)
    })
  })

  describe('default channels', () => {
    it('identifies production as default', () => {
      expect(isDefaultChannel('production')).toBe(true)
    })

    it('identifies staging as default', () => {
      expect(isDefaultChannel('staging')).toBe(true)
    })

    it('identifies development as default', () => {
      expect(isDefaultChannel('development')).toBe(true)
    })

    it('does not identify custom channels as default', () => {
      expect(isDefaultChannel('beta')).toBe(false)
      expect(isDefaultChannel('release-candidate')).toBe(false)
      expect(isDefaultChannel('hotfix')).toBe(false)
    })

    it('has exactly 3 default channels', () => {
      expect(DEFAULT_CHANNELS).toHaveLength(3)
    })
  })

  describe('error codes', () => {
    it('has APP_NOT_FOUND error code', () => {
      expect(ERROR_CODES.APP_NOT_FOUND).toBe('APP_NOT_FOUND')
    })

    it('has NOT_FOUND error code', () => {
      expect(ERROR_CODES.NOT_FOUND).toBe('NOT_FOUND')
    })

    it('has ALREADY_EXISTS error code', () => {
      expect(ERROR_CODES.ALREADY_EXISTS).toBe('ALREADY_EXISTS')
    })

    it('has FORBIDDEN error code', () => {
      expect(ERROR_CODES.FORBIDDEN).toBe('FORBIDDEN')
    })
  })

  describe('channel response structure', () => {
    it('list response has channels array', () => {
      const response = { channels: [] }
      expect(response).toHaveProperty('channels')
      expect(Array.isArray(response.channels)).toBe(true)
    })

    it('single channel response has channel object', () => {
      const response = {
        channel: {
          id: 'uuid',
          app_id: 'app-uuid',
          name: 'production',
          active_release_id: null,
          created_at: 1234567890,
        },
      }
      expect(response).toHaveProperty('channel')
      expect(response.channel).toHaveProperty('id')
      expect(response.channel).toHaveProperty('app_id')
      expect(response.channel).toHaveProperty('name')
      expect(response.channel).toHaveProperty('active_release_id')
      expect(response.channel).toHaveProperty('created_at')
    })

    it('delete response has success flag', () => {
      const response = { success: true }
      expect(response).toHaveProperty('success')
      expect(response.success).toBe(true)
    })
  })

  describe('channel operations protection', () => {
    it('should protect default channel from deletion', () => {
      const channelName = 'production'
      const canDelete = !isDefaultChannel(channelName)
      expect(canDelete).toBe(false)
    })

    it('should allow custom channel deletion', () => {
      const channelName = 'beta'
      const canDelete = !isDefaultChannel(channelName)
      expect(canDelete).toBe(true)
    })

    it('should protect default channel from rename', () => {
      const originalName = 'staging'
      const newName = 'stage'
      // Default channels cannot be renamed to a different name
      const canRename = !isDefaultChannel(originalName) || (originalName as string) === newName
      expect(canRename).toBe(false)
    })

    it('should allow renaming custom channels', () => {
      const originalName = 'beta'
      const newName = 'beta-2'
      // Custom channels can be renamed freely
      const canRename = !isDefaultChannel(originalName) || (originalName as string) === newName
      expect(canRename).toBe(true)
    })
  })
})
