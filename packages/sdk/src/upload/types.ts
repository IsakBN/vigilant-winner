/**
 * Upload Types
 *
 * Type definitions for the CLI/CI upload system.
 */

export type UploadJobStatus =
  | 'queued'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled'

export interface UploadResult {
  jobId: string
  status: UploadJobStatus
  releaseId?: string
  error?: string
  progress: number // 0-100
}

export interface UploadOptions {
  onProgress?: (progress: number) => void
  onStatusChange?: (status: UploadJobStatus) => void
  pollInterval?: number // default: 2000ms
  maxAttempts?: number // default: 60
}

export interface UploadConfig {
  apiUrl: string
  apiKey: string
  appId: string
}

export interface UploadResponse {
  jobId: string
}

export interface StatusResponse {
  status: UploadJobStatus
  releaseId?: string
  error?: string
  progress: number
}
