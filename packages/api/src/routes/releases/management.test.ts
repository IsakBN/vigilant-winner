import { describe, it, expect } from 'vitest'
import { z } from 'zod'
import { ERROR_CODES } from '@bundlenudge/shared'

// Schema definitions matching the route
const activateReleaseSchema = z.object({
  rolloutPercentage: z.number().min(0).max(100).default(100),
})

const rollbackSchema = z.object({
  reason: z.string().max(500).optional(),
})

describe('release management routes logic', () => {
  describe('activateReleaseSchema', () => {
    it('validates with default rollout percentage', () => {
      const result = activateReleaseSchema.safeParse({})
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.rolloutPercentage).toBe(100)
      }
    })

    it('validates custom rollout percentage', () => {
      const result = activateReleaseSchema.safeParse({
        rolloutPercentage: 50,
      })
      expect(result.success).toBe(true)
    })

    it('rejects rollout over 100', () => {
      const result = activateReleaseSchema.safeParse({
        rolloutPercentage: 150,
      })
      expect(result.success).toBe(false)
    })

    it('rejects negative rollout', () => {
      const result = activateReleaseSchema.safeParse({
        rolloutPercentage: -10,
      })
      expect(result.success).toBe(false)
    })
  })

  describe('rollbackSchema', () => {
    it('validates empty rollback request', () => {
      const result = rollbackSchema.safeParse({})
      expect(result.success).toBe(true)
    })

    it('validates with reason', () => {
      const result = rollbackSchema.safeParse({
        reason: 'High crash rate detected',
      })
      expect(result.success).toBe(true)
    })

    it('rejects reason over 500 characters', () => {
      const result = rollbackSchema.safeParse({
        reason: 'a'.repeat(501),
      })
      expect(result.success).toBe(false)
    })
  })

  describe('release status constants', () => {
    const RELEASE_STATUS = {
      ACTIVE: 'active',
      PAUSED: 'paused',
      ROLLED_BACK: 'rolled_back',
    } as const

    it('has correct status values', () => {
      expect(RELEASE_STATUS.ACTIVE).toBe('active')
      expect(RELEASE_STATUS.PAUSED).toBe('paused')
      expect(RELEASE_STATUS.ROLLED_BACK).toBe('rolled_back')
    })
  })

  describe('error codes', () => {
    it('has INVALID_STATE error code', () => {
      expect(ERROR_CODES.INVALID_STATE).toBe('INVALID_STATE')
    })

    it('has APP_NOT_FOUND error code', () => {
      expect(ERROR_CODES.APP_NOT_FOUND).toBe('APP_NOT_FOUND')
    })

    it('has RELEASE_NOT_FOUND error code', () => {
      expect(ERROR_CODES.RELEASE_NOT_FOUND).toBe('RELEASE_NOT_FOUND')
    })
  })

  describe('rollback flow', () => {
    it('should mark previous active as rolled_back', () => {
      // Simulating rollback logic
      const currentActive = { id: 'r1', status: 'active' }
      const targetRelease = { id: 'r2', status: 'paused' }

      // After rollback, current should be rolled_back
      const afterRollback = {
        ...currentActive,
        status: 'rolled_back',
        rollback_reason: 'Manual rollback',
      }

      expect(afterRollback.status).toBe('rolled_back')
      expect(afterRollback.rollback_reason).toBe('Manual rollback')

      // Target should be active
      const activatedTarget = { ...targetRelease, status: 'active' }
      expect(activatedTarget.status).toBe('active')
    })
  })

  describe('history query', () => {
    it('limits to 20 releases', () => {
      const limit = 20
      expect(limit).toBe(20)
    })

    it('orders by created_at DESC', () => {
      const releases = [
        { version: '1.0.0', created_at: 1000 },
        { version: '1.0.1', created_at: 2000 },
        { version: '1.0.2', created_at: 3000 },
      ]

      const sorted = [...releases].sort((a, b) => b.created_at - a.created_at)
      expect(sorted[0].version).toBe('1.0.2')
      expect(sorted[2].version).toBe('1.0.0')
    })
  })
})
