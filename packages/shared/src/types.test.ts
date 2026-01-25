import { describe, it, expect } from 'vitest'
import {
  updateCheckRequestSchema,
  updateCheckResponseSchema,
  deviceRegisterRequestSchema,
  targetingRulesSchema,
  sdkMetadataSchema,
  planIdSchema,
  subscriptionStatusSchema,
  createCheckoutSchema,
  createPortalSessionSchema,
  stripeEventTypeSchema,
  stripeWebhookHeaderSchema,
  subscriptionSchema,
  usageStatsSchema,
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

  describe('billing schemas', () => {
    describe('planIdSchema', () => {
      it('accepts valid plan ids', () => {
        expect(planIdSchema.safeParse('free').success).toBe(true)
        expect(planIdSchema.safeParse('pro').success).toBe(true)
        expect(planIdSchema.safeParse('team').success).toBe(true)
        expect(planIdSchema.safeParse('enterprise').success).toBe(true)
      })

      it('rejects invalid plan ids', () => {
        expect(planIdSchema.safeParse('basic').success).toBe(false)
        expect(planIdSchema.safeParse('premium').success).toBe(false)
      })
    })

    describe('subscriptionStatusSchema', () => {
      it('accepts valid statuses', () => {
        expect(subscriptionStatusSchema.safeParse('active').success).toBe(true)
        expect(subscriptionStatusSchema.safeParse('past_due').success).toBe(true)
        expect(subscriptionStatusSchema.safeParse('canceled').success).toBe(true)
        expect(subscriptionStatusSchema.safeParse('expired').success).toBe(true)
        expect(subscriptionStatusSchema.safeParse('trialing').success).toBe(true)
      })

      it('rejects invalid statuses', () => {
        expect(subscriptionStatusSchema.safeParse('pending').success).toBe(false)
      })
    })

    describe('createCheckoutSchema', () => {
      it('validates checkout for paid plans', () => {
        const checkout = {
          planId: 'pro',
          successUrl: 'https://example.com/success',
          cancelUrl: 'https://example.com/cancel',
        }
        expect(createCheckoutSchema.safeParse(checkout).success).toBe(true)
      })

      it('rejects checkout for free plan', () => {
        const checkout = {
          planId: 'free',
          successUrl: 'https://example.com/success',
          cancelUrl: 'https://example.com/cancel',
        }
        expect(createCheckoutSchema.safeParse(checkout).success).toBe(false)
      })

      it('rejects invalid URLs', () => {
        const checkout = {
          planId: 'pro',
          successUrl: 'not-a-url',
          cancelUrl: 'https://example.com/cancel',
        }
        expect(createCheckoutSchema.safeParse(checkout).success).toBe(false)
      })
    })

    describe('createPortalSessionSchema', () => {
      it('validates portal session input', () => {
        const input = { returnUrl: 'https://example.com/billing' }
        expect(createPortalSessionSchema.safeParse(input).success).toBe(true)
      })

      it('rejects invalid return URL', () => {
        const input = { returnUrl: 'not-a-url' }
        expect(createPortalSessionSchema.safeParse(input).success).toBe(false)
      })
    })

    describe('stripeEventTypeSchema', () => {
      it('accepts valid Stripe event types', () => {
        expect(stripeEventTypeSchema.safeParse('checkout.session.completed').success).toBe(true)
        expect(stripeEventTypeSchema.safeParse('customer.subscription.updated').success).toBe(true)
        expect(stripeEventTypeSchema.safeParse('invoice.paid').success).toBe(true)
      })

      it('rejects unknown event types', () => {
        expect(stripeEventTypeSchema.safeParse('payment.created').success).toBe(false)
      })
    })

    describe('stripeWebhookHeaderSchema', () => {
      it('validates webhook headers', () => {
        const headers = { 'stripe-signature': 't=123,v1=abc' }
        expect(stripeWebhookHeaderSchema.safeParse(headers).success).toBe(true)
      })

      it('rejects missing signature', () => {
        expect(stripeWebhookHeaderSchema.safeParse({}).success).toBe(false)
      })
    })

    describe('subscriptionSchema', () => {
      it('validates a subscription object', () => {
        const subscription = {
          id: 'sub_123',
          planId: 'pro',
          status: 'active',
          currentPeriodStart: 1700000000,
          currentPeriodEnd: 1702592000,
          cancelAtPeriodEnd: false,
        }
        expect(subscriptionSchema.safeParse(subscription).success).toBe(true)
      })

      it('rejects invalid plan id in subscription', () => {
        const subscription = {
          id: 'sub_123',
          planId: 'basic',
          status: 'active',
          currentPeriodStart: 1700000000,
          currentPeriodEnd: 1702592000,
          cancelAtPeriodEnd: false,
        }
        expect(subscriptionSchema.safeParse(subscription).success).toBe(false)
      })
    })

    describe('usageStatsSchema', () => {
      it('validates usage stats', () => {
        const stats = {
          mau: { current: 500, limit: 1000, percentage: 50 },
          storage: { currentGb: 2.5, limitGb: 10, percentage: 25 },
          apps: { current: 3, limit: 5 },
        }
        expect(usageStatsSchema.safeParse(stats).success).toBe(true)
      })

      it('rejects incomplete usage stats', () => {
        const stats = {
          mau: { current: 500 },
        }
        expect(usageStatsSchema.safeParse(stats).success).toBe(false)
      })
    })
  })
})
