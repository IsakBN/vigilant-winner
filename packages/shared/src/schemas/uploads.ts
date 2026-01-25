/**
 * Upload status schemas for real-time upload progress tracking
 */

import { z } from 'zod'

// =============================================================================
// Upload Status Types
// =============================================================================

/**
 * Upload status enum representing the lifecycle of an upload
 */
export const uploadStatusSchema = z.enum([
  'pending',     // Upload received, queued
  'processing',  // Currently being processed
  'validating',  // Bundle validation in progress
  'storing',     // Storing to R2
  'complete',    // Successfully completed
  'failed',      // Failed with error
])

export type UploadStatus = z.infer<typeof uploadStatusSchema>

/**
 * Full upload status response
 */
export const uploadStatusResponseSchema = z.object({
  uploadId: z.string().uuid(),
  status: uploadStatusSchema,
  progress: z.number().min(0).max(100),
  message: z.string().nullable(),
  error: z.string().nullable(),
  releaseId: z.string().uuid().nullable(),
  startedAt: z.number(),
  completedAt: z.number().nullable(),
})

export type UploadStatusResponse = z.infer<typeof uploadStatusResponseSchema>

/**
 * WebSocket message types for real-time updates
 */
export const uploadWsMessageSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('status_update'),
    data: uploadStatusResponseSchema,
  }),
  z.object({
    type: z.literal('error'),
    error: z.string(),
    code: z.string().optional(),
  }),
  z.object({
    type: z.literal('connected'),
    uploadId: z.string().uuid(),
  }),
])

export type UploadWsMessage = z.infer<typeof uploadWsMessageSchema>

// =============================================================================
// KV Key Helpers
// =============================================================================

/** TTL for upload status in KV (24 hours in seconds) */
export const UPLOAD_STATUS_TTL_SECONDS = 24 * 60 * 60

/**
 * Generate KV key for upload status
 */
export function getUploadStatusKey(uploadId: string): string {
  return `upload:${uploadId}`
}
