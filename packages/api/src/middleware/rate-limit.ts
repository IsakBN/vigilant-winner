/**
 * @agent fix-rate-limiting
 * @created 2026-01-25
 * @description Rate limiting middleware for SDK endpoints
 */

/**
 * Rate Limiting Middleware
 *
 * Protects SDK endpoints from abuse using Cloudflare KV for
 * distributed rate limiting. Different endpoints have different
 * limits based on expected usage patterns.
 */

import type { MiddlewareHandler } from 'hono'
import { createMiddleware } from 'hono/factory'
import { ERROR_CODES } from '@bundlenudge/shared'
import type { Env } from '../types/env'

// =============================================================================
// Constants
// =============================================================================

/** Rate limit configurations by endpoint type */
export const RATE_LIMITS = {
  /** Update checks: SDK polls frequently */
  updates: { limit: 60, windowSeconds: 60 },
  /** Telemetry: batch events */
  telemetry: { limit: 100, windowSeconds: 60 },
  /** Device registration: rare operation */
  devices: { limit: 10, windowSeconds: 60 },
} as const

export type RateLimitType = keyof typeof RATE_LIMITS

// =============================================================================
// Types
// =============================================================================

export interface RateLimitInfo {
  limit: number
  remaining: number
  resetAt: number
}

interface RateLimitResult {
  allowed: boolean
  info: RateLimitInfo
}

// =============================================================================
// Core Functions
// =============================================================================

/**
 * Build rate limit key from identifier and endpoint
 */
export function buildRateLimitKey(identifier: string, endpoint: string): string {
  return `rate:${identifier}:${endpoint}`
}

/**
 * Extract identifier from request (device ID from header or IP)
 */
export function getIdentifier(
  deviceId: string | undefined,
  ip: string | undefined
): string {
  return deviceId ?? ip ?? 'unknown'
}

/**
 * Check and update rate limit for a given key
 * Returns whether request is allowed and current limit info
 */
export async function checkRateLimit(
  kv: KVNamespace,
  key: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  const now = Math.floor(Date.now() / 1000)
  const windowStart = now - (now % windowSeconds)
  const resetAt = windowStart + windowSeconds
  const windowKey = `${key}:${String(windowStart)}`

  // Get current count
  const current = await kv.get(windowKey)
  const count = current ? parseInt(current, 10) : 0

  // Check if over limit
  if (count >= limit) {
    return {
      allowed: false,
      info: { limit, remaining: 0, resetAt },
    }
  }

  // Increment count with TTL
  await kv.put(windowKey, String(count + 1), {
    expirationTtl: windowSeconds + 10, // Add buffer for clock skew
  })

  return {
    allowed: true,
    info: { limit, remaining: limit - count - 1, resetAt },
  }
}

/**
 * Set rate limit headers on response
 */
export function setRateLimitHeaders(
  headers: Headers,
  info: RateLimitInfo
): void {
  headers.set('X-RateLimit-Limit', String(info.limit))
  headers.set('X-RateLimit-Remaining', String(info.remaining))
  headers.set('X-RateLimit-Reset', String(info.resetAt))
}

// =============================================================================
// Middleware Factory
// =============================================================================

interface RateLimitVariables {
  rateLimitInfo?: RateLimitInfo
}

/**
 * Create rate limit middleware for a specific endpoint type
 *
 * @param type - The type of rate limit to apply
 * @returns Hono middleware that enforces rate limiting
 *
 * @example
 * ```ts
 * app.use('/v1/updates/*', createRateLimitMiddleware('updates'))
 * ```
 */
export function createRateLimitMiddleware(
  type: RateLimitType
): MiddlewareHandler<{ Bindings: Env; Variables: RateLimitVariables }> {
  const config = RATE_LIMITS[type]

  return createMiddleware<{
    Bindings: Env
    Variables: RateLimitVariables
  }>(async (c, next) => {
    // Get identifier: prefer device ID from header, fallback to IP
    const deviceId = c.req.header('X-Device-ID')
    const ip = c.req.header('CF-Connecting-IP') ?? c.req.header('X-Forwarded-For')
    const identifier = getIdentifier(deviceId, ip)

    // Build key and check limit
    const endpoint = `/v1/${type}`
    const key = buildRateLimitKey(identifier, endpoint)

    const result = await checkRateLimit(
      c.env.RATE_LIMIT,
      key,
      config.limit,
      config.windowSeconds
    )

    // Store info for use in handlers
    c.set('rateLimitInfo', result.info)

    // Set headers on all responses
    setRateLimitHeaders(c.res.headers, result.info)

    if (!result.allowed) {
      const retryAfter = result.info.resetAt - Math.floor(Date.now() / 1000)

      return c.json(
        {
          error: ERROR_CODES.RATE_LIMITED,
          message: 'Too many requests. Please try again later.',
          retryAfter: Math.max(1, retryAfter),
        },
        429,
        {
          'Retry-After': String(Math.max(1, retryAfter)),
        }
      )
    }

    return next()
  })
}

// =============================================================================
// Pre-built Middleware Instances
// =============================================================================

/** Rate limit middleware for update check endpoints */
export const rateLimitUpdates = createRateLimitMiddleware('updates')

/** Rate limit middleware for telemetry endpoints */
export const rateLimitTelemetry = createRateLimitMiddleware('telemetry')

/** Rate limit middleware for device registration endpoints */
export const rateLimitDevices = createRateLimitMiddleware('devices')
