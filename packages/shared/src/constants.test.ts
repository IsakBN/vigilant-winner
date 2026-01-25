import { describe, it, expect } from 'vitest'
import {
  PLAN_LIMITS,
  RATE_LIMITS,
  ERROR_CODES,
  type PlanId,
  type PlanLimits,
  type RateLimitKey,
  type RateLimitConfig,
} from './constants'

describe('constants', () => {
  describe('PLAN_LIMITS', () => {
    it('defines all expected plan tiers', () => {
      const planIds: PlanId[] = ['free', 'pro', 'team', 'enterprise']
      expect(Object.keys(PLAN_LIMITS)).toEqual(planIds)
    })

    it('free tier has strict limits', () => {
      const { free } = PLAN_LIMITS
      expect(free.mauLimit).toBe(1_000)
      expect(free.storageGb).toBe(1)
      expect(free.appsLimit).toBe(2)
      expect(free.teamMembersLimit).toBe(1)
      expect(free.buildsPerMonth).toBe(10)
      expect(free.hasAnalytics).toBe(false)
      expect(free.hasWebhooks).toBe(false)
      expect(free.hasPrioritySupport).toBe(false)
    })

    it('pro tier has increased limits with analytics', () => {
      const { pro } = PLAN_LIMITS
      expect(pro.mauLimit).toBe(10_000)
      expect(pro.storageGb).toBe(10)
      expect(pro.appsLimit).toBe(10)
      expect(pro.teamMembersLimit).toBe(5)
      expect(pro.buildsPerMonth).toBe(100)
      expect(pro.hasAnalytics).toBe(true)
      expect(pro.hasWebhooks).toBe(true)
      expect(pro.hasPrioritySupport).toBe(false)
    })

    it('team tier has team features with priority support', () => {
      const { team } = PLAN_LIMITS
      expect(team.mauLimit).toBe(100_000)
      expect(team.storageGb).toBe(50)
      expect(team.appsLimit).toBe(50)
      expect(team.teamMembersLimit).toBe(20)
      expect(team.buildsPerMonth).toBe(500)
      expect(team.hasAnalytics).toBe(true)
      expect(team.hasWebhooks).toBe(true)
      expect(team.hasPrioritySupport).toBe(true)
    })

    it('enterprise tier has unlimited limits', () => {
      const { enterprise } = PLAN_LIMITS
      expect(enterprise.mauLimit).toBe(Infinity)
      expect(enterprise.storageGb).toBe(Infinity)
      expect(enterprise.appsLimit).toBe(Infinity)
      expect(enterprise.teamMembersLimit).toBe(Infinity)
      expect(enterprise.buildsPerMonth).toBe(Infinity)
      expect(enterprise.hasAnalytics).toBe(true)
      expect(enterprise.hasWebhooks).toBe(true)
      expect(enterprise.hasPrioritySupport).toBe(true)
    })

    it('plan limits increase progressively', () => {
      const tiers: PlanId[] = ['free', 'pro', 'team', 'enterprise']

      for (let i = 1; i < tiers.length; i++) {
        const prevTierId = tiers[i - 1]
        const currTierId = tiers[i]
        if (!prevTierId || !currTierId) continue

        const prevTier = PLAN_LIMITS[prevTierId]
        const currTier = PLAN_LIMITS[currTierId]

        expect(currTier.mauLimit).toBeGreaterThanOrEqual(prevTier.mauLimit)
        expect(currTier.storageGb).toBeGreaterThanOrEqual(prevTier.storageGb)
        expect(currTier.appsLimit).toBeGreaterThanOrEqual(prevTier.appsLimit)
        expect(currTier.teamMembersLimit).toBeGreaterThanOrEqual(prevTier.teamMembersLimit)
        expect(currTier.buildsPerMonth).toBeGreaterThanOrEqual(prevTier.buildsPerMonth)
      }
    })

    it('PlanId type matches expected values', () => {
      const ids: PlanId[] = ['free', 'pro', 'team', 'enterprise']
      expect(ids.length).toBe(4)
    })

    it('PlanLimits type has correct shape', () => {
      const limits: PlanLimits = PLAN_LIMITS.free
      expect(limits).toHaveProperty('mauLimit')
      expect(limits).toHaveProperty('storageGb')
      expect(limits).toHaveProperty('appsLimit')
      expect(limits).toHaveProperty('teamMembersLimit')
      expect(limits).toHaveProperty('buildsPerMonth')
      expect(limits).toHaveProperty('hasAnalytics')
      expect(limits).toHaveProperty('hasWebhooks')
      expect(limits).toHaveProperty('hasPrioritySupport')
    })
  })

  describe('RATE_LIMITS', () => {
    it('defines all expected rate limit keys', () => {
      const expectedKeys = [
        'default',
        'auth',
        'updateCheck',
        'devices',
        'telemetry',
        'upload',
        'adminOtpSend',
        'adminOtpVerify',
        'webhookRetry',
      ]

      expect(Object.keys(RATE_LIMITS)).toEqual(expectedKeys)
    })

    it('has valid default rate limit', () => {
      expect(RATE_LIMITS.default.requests).toBe(100)
      expect(RATE_LIMITS.default.windowSeconds).toBe(60)
    })

    it('has strict auth rate limit to prevent brute force', () => {
      expect(RATE_LIMITS.auth.requests).toBe(10)
      expect(RATE_LIMITS.auth.windowSeconds).toBe(60)
    })

    it('has relaxed update check limit for SDK', () => {
      expect(RATE_LIMITS.updateCheck.requests).toBe(60)
      expect(RATE_LIMITS.updateCheck.windowSeconds).toBe(60)
    })

    it('has strict device registration limit', () => {
      expect(RATE_LIMITS.devices.requests).toBe(10)
      expect(RATE_LIMITS.devices.windowSeconds).toBe(60)
    })

    it('has high telemetry limit for event batching', () => {
      expect(RATE_LIMITS.telemetry.requests).toBe(100)
      expect(RATE_LIMITS.telemetry.windowSeconds).toBe(60)
    })

    it('has strict upload limit for expensive operations', () => {
      expect(RATE_LIMITS.upload.requests).toBe(10)
      expect(RATE_LIMITS.upload.windowSeconds).toBe(60)
    })

    it('has very strict admin OTP send limit (3 per 15min)', () => {
      expect(RATE_LIMITS.adminOtpSend.requests).toBe(3)
      expect(RATE_LIMITS.adminOtpSend.windowSeconds).toBe(900)
    })

    it('allows retry attempts for admin OTP verify', () => {
      expect(RATE_LIMITS.adminOtpVerify.requests).toBe(5)
      expect(RATE_LIMITS.adminOtpVerify.windowSeconds).toBe(60)
    })

    it('has webhook retry configuration with backoff', () => {
      expect(RATE_LIMITS.webhookRetry.maxAttempts).toBe(3)
      expect(RATE_LIMITS.webhookRetry.backoffMs).toEqual([1000, 5000, 30000])
    })
  })

  describe('type exports', () => {
    it('RateLimitKey includes all rate limit keys', () => {
      // Type check - this ensures the type is correctly exported
      const keys: RateLimitKey[] = [
        'default',
        'auth',
        'updateCheck',
        'devices',
        'telemetry',
        'upload',
        'adminOtpSend',
        'adminOtpVerify',
        'webhookRetry',
      ]
      expect(keys.length).toBe(9)
    })

    it('RateLimitConfig has correct shape', () => {
      // Type check - this ensures the type is correctly exported
      const config: RateLimitConfig = RATE_LIMITS.default
      expect(config.requests).toBeDefined()
      expect(config.windowSeconds).toBeDefined()
    })
  })

  describe('ERROR_CODES', () => {
    it('includes RATE_LIMITED error code', () => {
      expect(ERROR_CODES.RATE_LIMITED).toBe('RATE_LIMITED')
    })

    it('includes QUOTA_EXCEEDED error code', () => {
      expect(ERROR_CODES.QUOTA_EXCEEDED).toBe('QUOTA_EXCEEDED')
    })
  })
})
