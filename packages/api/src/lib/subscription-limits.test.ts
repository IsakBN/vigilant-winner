/**
 * Tests for subscription limit enforcement
 *
 * @agent fix-subscription-enforcement
 * @modified 2026-01-25
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { checkMAULimit, checkStorageLimit, checkStorageLimitWithAddition } from './subscription-limits'
import type { Env } from '../types/env'

// =============================================================================
// Test Helpers
// =============================================================================

function createMockEnv(
  subscriptionRow: Record<string, unknown> | null,
  planRow: Record<string, unknown> | null,
  usageValue: number
): Env {
  const prepareResults: Record<string, unknown> = {}
  let queryIndex = 0

  return {
    DB: {
      prepare: vi.fn(() => ({
        bind: vi.fn(() => ({
          first: vi.fn(async () => {
            queryIndex++
            // First query: subscription lookup
            if (queryIndex === 1) return subscriptionRow
            // Second query: plan lookup (if subscription found)
            if (queryIndex === 2 && subscriptionRow) return planRow
            // Second/Third query: usage count (MAU or storage)
            return { mau: usageValue, storage_bytes: usageValue }
          }),
          all: vi.fn(),
          run: vi.fn(),
        })),
        first: vi.fn(),
        all: vi.fn(),
        run: vi.fn(),
      })),
    } as unknown as D1Database,
    BUNDLES: {} as R2Bucket,
    RATE_LIMIT: {} as KVNamespace,
    ENVIRONMENT: 'development',
    DATABASE_URL: '',
    BETTER_AUTH_SECRET: '',
    GITHUB_CLIENT_ID: '',
    GITHUB_CLIENT_SECRET: '',
    RESEND_API_KEY: '',
    STRIPE_SECRET_KEY: '',
    STRIPE_WEBHOOK_SECRET: '',
    ENCRYPTION_KEY: '',
    GITHUB_APP_ID: '',
    GITHUB_APP_NAME: '',
    GITHUB_PRIVATE_KEY: '',
    GITHUB_WEBHOOK_SECRET: '',
    DASHBOARD_URL: '',
    API_URL: '',
  }
}

// =============================================================================
// MAU Limit Tests
// =============================================================================

describe('checkMAULimit', () => {
  it('allows when under limit', async () => {
    const env = createMockEnv(
      { plan_id: 'plan_pro', status: 'active' },
      { mau_limit: 50000, storage_gb: 100 },
      10000 // 20% usage
    )

    const result = await checkMAULimit(env, 'user_123')

    expect(result.allowed).toBe(true)
    expect(result.percentage).toBe(20)
    expect(result.warning).toBeFalsy()
  })

  it('allows with warning when approaching limit (90%+)', async () => {
    const env = createMockEnv(
      { plan_id: 'plan_pro', status: 'active' },
      { mau_limit: 10000, storage_gb: 100 },
      9500 // 95% usage
    )

    const result = await checkMAULimit(env, 'user_123')

    expect(result.allowed).toBe(true)
    expect(result.percentage).toBe(95)
    expect(result.warning).toBe(true)
    expect(result.message).toContain('Approaching MAU limit')
  })

  it('allows at exactly 100% (graceful)', async () => {
    const env = createMockEnv(
      { plan_id: 'plan_pro', status: 'active' },
      { mau_limit: 10000, storage_gb: 100 },
      10000 // 100% usage
    )

    const result = await checkMAULimit(env, 'user_123')

    expect(result.allowed).toBe(true)
    expect(result.percentage).toBe(100)
    expect(result.warning).toBe(true)
  })

  it('blocks when over 110% limit', async () => {
    const env = createMockEnv(
      { plan_id: 'plan_free', status: 'active' },
      { mau_limit: 10000, storage_gb: 20 },
      11500 // 115% usage
    )

    const result = await checkMAULimit(env, 'user_123')

    expect(result.allowed).toBe(false)
    expect(result.percentage).toBe(115)
    expect(result.message).toContain('MAU limit exceeded')
    expect(result.message).toContain('upgrade your plan')
  })

  it('uses free plan limits when no subscription', async () => {
    const env = createMockEnv(
      null, // No subscription
      null,
      5000 // 50% of free tier
    )

    const result = await checkMAULimit(env, 'user_123')

    expect(result.allowed).toBe(true)
    expect(result.limit).toBe(10000) // Default free plan limit
    expect(result.percentage).toBe(50)
  })

  it('blocks free tier user over 110%', async () => {
    const env = createMockEnv(
      null, // No subscription (free tier)
      null,
      12000 // 120% of free tier limit (10000)
    )

    const result = await checkMAULimit(env, 'user_123')

    expect(result.allowed).toBe(false)
    expect(result.limit).toBe(10000)
    expect(result.percentage).toBe(120)
    expect(result.message).toContain('MAU limit exceeded')
  })
})

// =============================================================================
// Storage Limit Tests
// =============================================================================

describe('checkStorageLimit', () => {
  it('allows when under storage limit', async () => {
    const oneGb = 1024 * 1024 * 1024
    const env = createMockEnv(
      { plan_id: 'plan_pro', status: 'active' },
      { mau_limit: 50000, storage_gb: 100 },
      10 * oneGb // 10 GB used (10% of 100 GB)
    )

    const result = await checkStorageLimit(env, 'user_123')

    expect(result.allowed).toBe(true)
    expect(result.percentage).toBe(10)
  })

  it('warns when approaching storage limit', async () => {
    const oneGb = 1024 * 1024 * 1024
    const env = createMockEnv(
      { plan_id: 'plan_pro', status: 'active' },
      { mau_limit: 50000, storage_gb: 100 },
      95 * oneGb // 95 GB used (95% of 100 GB)
    )

    const result = await checkStorageLimit(env, 'user_123')

    expect(result.allowed).toBe(true)
    expect(result.warning).toBe(true)
    expect(result.message).toContain('Approaching storage limit')
  })

  it('blocks when storage exceeds 110%', async () => {
    const oneGb = 1024 * 1024 * 1024
    const env = createMockEnv(
      { plan_id: 'plan_free', status: 'active' },
      { mau_limit: 10000, storage_gb: 20 },
      23 * oneGb // 23 GB used (115% of 20 GB)
    )

    const result = await checkStorageLimit(env, 'user_123')

    expect(result.allowed).toBe(false)
    expect(result.message).toContain('Storage limit exceeded')
    expect(result.message).toContain('GB')
  })

  it('uses free plan storage limit when no subscription', async () => {
    const oneGb = 1024 * 1024 * 1024
    const env = createMockEnv(
      null,
      null,
      5 * oneGb // 5 GB (25% of 20 GB free limit)
    )

    const result = await checkStorageLimit(env, 'user_123')

    expect(result.allowed).toBe(true)
    expect(result.limit).toBe(20 * oneGb) // 20 GB in bytes
    expect(result.percentage).toBe(25)
  })
})

// =============================================================================
// Storage With Addition Tests
// =============================================================================

describe('checkStorageLimitWithAddition', () => {
  it('allows when addition keeps under limit', async () => {
    const oneGb = 1024 * 1024 * 1024
    const oneMb = 1024 * 1024
    const env = createMockEnv(
      { plan_id: 'plan_pro', status: 'active' },
      { mau_limit: 50000, storage_gb: 100 },
      50 * oneGb // 50 GB current usage
    )

    const result = await checkStorageLimitWithAddition(env, 'user_123', 10 * oneMb)

    expect(result.allowed).toBe(true)
    // Should be slightly over 50% after addition
    expect(result.percentage).toBe(50)
  })

  it('blocks when addition would exceed 110%', async () => {
    const oneGb = 1024 * 1024 * 1024
    const env = createMockEnv(
      { plan_id: 'plan_free', status: 'active' },
      { mau_limit: 10000, storage_gb: 20 },
      20 * oneGb // 20 GB current (100%)
    )

    const result = await checkStorageLimitWithAddition(env, 'user_123', 3 * oneGb)

    // 23 GB total would be 115% of 20 GB limit
    expect(result.allowed).toBe(false)
    expect(result.message).toContain('Storage limit exceeded')
  })

  it('warns when addition approaches limit', async () => {
    const oneGb = 1024 * 1024 * 1024
    const env = createMockEnv(
      { plan_id: 'plan_pro', status: 'active' },
      { mau_limit: 50000, storage_gb: 100 },
      85 * oneGb // 85 GB current
    )

    const result = await checkStorageLimitWithAddition(env, 'user_123', 10 * oneGb)

    // 95 GB total would be 95%
    expect(result.allowed).toBe(true)
    expect(result.warning).toBe(true)
    expect(result.percentage).toBe(95)
  })
})
