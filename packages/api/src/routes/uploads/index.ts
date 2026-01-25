/**
 * Upload Status Routes
 *
 * Provides real-time upload progress tracking via HTTP polling and WebSocket.
 *
 * Routes:
 * - GET /v1/uploads/:uploadId/status - HTTP polling for upload status
 * - GET /v1/uploads/:uploadId/ws - WebSocket for real-time status (stub)
 */

import { Hono } from 'hono'
import {
  ERROR_CODES,
  uploadStatusResponseSchema,
  getUploadStatusKey,
  type UploadStatusResponse,
} from '@bundlenudge/shared'
import { authMiddleware, type AuthUser } from '../../middleware/auth'
import type { Env } from '../../types/env'

interface AuthVariables {
  user: AuthUser
}

export const uploadsRouter = new Hono<{
  Bindings: Env
  Variables: AuthVariables
}>()

// All routes require authentication
uploadsRouter.use('*', authMiddleware)

/**
 * Get upload status (HTTP polling fallback)
 *
 * Returns the current status of an upload including:
 * - status: pending, processing, validating, storing, complete, failed
 * - progress: 0-100 percentage
 * - message: human-readable status message
 * - error: error message if failed
 * - releaseId: the created release ID when complete
 */
uploadsRouter.get('/:uploadId/status', async (c) => {
  const uploadId = c.req.param('uploadId')

  // Validate uploadId format (UUID)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(uploadId)) {
    return c.json(
      { error: ERROR_CODES.VALIDATION_ERROR, message: 'Invalid upload ID format' },
      400
    )
  }

  // Get status from KV
  const kvKey = getUploadStatusKey(uploadId)
  const statusJson = await c.env.RATE_LIMIT.get(kvKey)

  if (!statusJson) {
    return c.json(
      { error: ERROR_CODES.NOT_FOUND, message: 'Upload not found' },
      404
    )
  }

  // Parse and validate the stored status
  const parsed: unknown = JSON.parse(statusJson)
  const result = uploadStatusResponseSchema.safeParse(parsed)

  if (!result.success) {
    return c.json(
      { error: ERROR_CODES.INTERNAL_ERROR, message: 'Invalid status data' },
      500
    )
  }

  return c.json(result.data)
})

/**
 * WebSocket endpoint for real-time upload status
 *
 * Returns 501 Not Implemented as Durable Objects are not available.
 * Clients should fall back to polling the /status endpoint.
 */
uploadsRouter.get('/:uploadId/ws', (c) => {
  const uploadId = c.req.param('uploadId')

  // Validate uploadId format (UUID)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(uploadId)) {
    return c.json(
      { error: ERROR_CODES.VALIDATION_ERROR, message: 'Invalid upload ID format' },
      400
    )
  }

  // WebSocket not available - return stub response
  return c.json(
    {
      error: 'WEBSOCKET_NOT_AVAILABLE',
      message: 'Use polling endpoint instead',
      pollingUrl: `/v1/uploads/${uploadId}/status`,
    },
    501
  )
})

// =============================================================================
// Helper Functions for Upload Status Management
// =============================================================================

/**
 * Create a new upload status entry in KV
 */
export async function createUploadStatus(
  kv: KVNamespace,
  uploadId: string
): Promise<UploadStatusResponse> {
  const now = Math.floor(Date.now() / 1000)
  const status: UploadStatusResponse = {
    uploadId,
    status: 'pending',
    progress: 0,
    message: 'Upload queued for processing',
    error: null,
    releaseId: null,
    startedAt: now,
    completedAt: null,
  }

  const kvKey = getUploadStatusKey(uploadId)
  await kv.put(kvKey, JSON.stringify(status), {
    expirationTtl: 24 * 60 * 60, // 24 hours
  })

  return status
}

/**
 * Update upload status in KV
 */
export async function updateUploadStatus(
  kv: KVNamespace,
  uploadId: string,
  update: Partial<Omit<UploadStatusResponse, 'uploadId' | 'startedAt'>>
): Promise<UploadStatusResponse | null> {
  const kvKey = getUploadStatusKey(uploadId)
  const statusJson = await kv.get(kvKey)

  if (!statusJson) {
    return null
  }

  const current = JSON.parse(statusJson) as UploadStatusResponse
  const updated: UploadStatusResponse = {
    ...current,
    ...update,
  }

  // Set completedAt when status is complete or failed
  if (
    (update.status === 'complete' || update.status === 'failed') &&
    !updated.completedAt
  ) {
    updated.completedAt = Math.floor(Date.now() / 1000)
  }

  await kv.put(kvKey, JSON.stringify(updated), {
    expirationTtl: 24 * 60 * 60,
  })

  return updated
}

/**
 * Get upload status from KV
 */
export async function getUploadStatus(
  kv: KVNamespace,
  uploadId: string
): Promise<UploadStatusResponse | null> {
  const kvKey = getUploadStatusKey(uploadId)
  const statusJson = await kv.get(kvKey)

  if (!statusJson) {
    return null
  }

  return JSON.parse(statusJson) as UploadStatusResponse
}
