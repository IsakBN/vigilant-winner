/**
 * @agent fix-validation
 * @modified 2026-01-25
 *
 * Body Size Limit Middleware
 *
 * Enforces request body size limits to prevent oversized payloads.
 * Returns 413 Payload Too Large for requests exceeding limits.
 */

import type { MiddlewareHandler } from 'hono'
import { createMiddleware } from 'hono/factory'
import type { Env } from '../types/env'

// =============================================================================
// Constants
// =============================================================================

/** Default body size limit: 1MB for JSON payloads */
export const DEFAULT_BODY_SIZE_LIMIT = 1 * 1024 * 1024

/** Bundle upload size limit: 50MB */
export const BUNDLE_UPLOAD_SIZE_LIMIT = 50 * 1024 * 1024

/** Error response for oversized payloads */
const PAYLOAD_TOO_LARGE_ERROR = {
  error: 'PAYLOAD_TOO_LARGE',
  message: 'Request body exceeds maximum allowed size',
} as const

// =============================================================================
// Middleware Factory
// =============================================================================

/**
 * Create body size limit middleware with custom limit
 *
 * @param maxBytes - Maximum allowed body size in bytes
 * @returns Hono middleware that rejects oversized requests
 */
export function createBodySizeMiddleware(maxBytes: number): MiddlewareHandler<{ Bindings: Env }> {
  return createMiddleware<{ Bindings: Env }>(async (c, next) => {
    // Check Content-Length header first (fast path)
    // If Content-Length is present and valid, we can skip body reading
    const contentLength = c.req.header('Content-Length')
    if (contentLength) {
      const length = parseInt(contentLength, 10)
      if (!isNaN(length)) {
        if (length > maxBytes) {
          return c.json(
            { ...PAYLOAD_TOO_LARGE_ERROR, maxBytes },
            413
          )
        }
        // Content-Length is present and within limits, skip body reading
        return next()
      }
    }

    // For chunked transfers or missing Content-Length, we need to check body size
    // We'll do this by cloning the request and checking the body
    // This is only done for POST/PUT/PATCH methods
    const method = c.req.method
    if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
      try {
        // Clone the request to read body without consuming it
        const clonedReq = c.req.raw.clone()
        const body = await clonedReq.arrayBuffer()

        if (body.byteLength > maxBytes) {
          return c.json(
            { ...PAYLOAD_TOO_LARGE_ERROR, maxBytes },
            413
          )
        }
      } catch {
        // If we can't read the body, let it through for the route handler to deal with
      }
    }

    return next()
  })
}

// =============================================================================
// Pre-configured Middlewares
// =============================================================================

/**
 * Standard body size limit (1MB) for JSON API endpoints
 */
export const bodySizeLimit = createBodySizeMiddleware(DEFAULT_BODY_SIZE_LIMIT)

/**
 * Large body size limit (50MB) for bundle uploads
 */
export const bundleUploadSizeLimit = createBodySizeMiddleware(BUNDLE_UPLOAD_SIZE_LIMIT)
