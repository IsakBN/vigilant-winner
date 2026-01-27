/**
 * Realtime broadcast utilities
 *
 * Helper functions for sending real-time updates to connected WebSocket clients.
 *
 * @agent websocket-realtime
 * @created 2026-01-27
 */

import type { Env } from '../types/env'
import type { BroadcastUpdate } from '../durable-objects'

// =============================================================================
// Types
// =============================================================================

export interface BuildStatusData {
  status: 'queued' | 'building' | 'signing' | 'uploading' | 'complete' | 'failed'
  progress?: number
  error?: string
  artifactUrl?: string
}

export interface UploadProgressData {
  status: 'uploading' | 'processing' | 'complete' | 'failed'
  bytesUploaded?: number
  totalBytes?: number
  progress?: number
  error?: string
}

export interface ReleaseRolloutData {
  rolloutPercentage: number
  status: 'active' | 'paused' | 'rolled_back'
}

// =============================================================================
// Broadcast Functions
// =============================================================================

/**
 * Send an update to all subscribed WebSocket clients
 *
 * @param env - Environment bindings
 * @param userId - User ID to route to their DO instance
 * @param update - The update to broadcast
 */
export async function broadcastUpdate(
  env: Env,
  userId: string,
  update: BroadcastUpdate
): Promise<{ sent: number }> {
  const doId = env.REALTIME.idFromName(userId)
  const stub = env.REALTIME.get(doId)

  const response = await stub.fetch(new Request('http://internal/broadcast', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(update),
  }))

  if (!response.ok) {
    return { sent: 0 }
  }

  const result = (await response.json()) as { sent: number }
  return result
}

/**
 * Broadcast a build status update
 */
export async function broadcastBuildStatus(
  env: Env,
  userId: string,
  buildId: string,
  data: BuildStatusData
): Promise<{ sent: number }> {
  return broadcastUpdate(env, userId, {
    type: 'build_status',
    resource: 'build',
    id: buildId,
    data,
  })
}

/**
 * Broadcast an upload progress update
 */
export async function broadcastUploadProgress(
  env: Env,
  userId: string,
  uploadId: string,
  data: UploadProgressData
): Promise<{ sent: number }> {
  return broadcastUpdate(env, userId, {
    type: 'upload_progress',
    resource: 'upload',
    id: uploadId,
    data,
  })
}

/**
 * Broadcast a release rollout update
 */
export async function broadcastReleaseRollout(
  env: Env,
  userId: string,
  releaseId: string,
  data: ReleaseRolloutData
): Promise<{ sent: number }> {
  return broadcastUpdate(env, userId, {
    type: 'release_rollout',
    resource: 'release',
    id: releaseId,
    data,
  })
}

/**
 * Get active session count for a user
 */
export async function getSessionCount(
  env: Env,
  userId: string
): Promise<number> {
  const doId = env.REALTIME.idFromName(userId)
  const stub = env.REALTIME.get(doId)

  const response = await stub.fetch(new Request('http://internal/sessions', {
    method: 'GET',
  }))

  if (!response.ok) {
    return 0
  }

  const result = (await response.json()) as { count: number }
  return result.count
}
