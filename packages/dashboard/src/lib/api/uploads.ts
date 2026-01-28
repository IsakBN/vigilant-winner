/**
 * Uploads API for BundleNudge Dashboard
 *
 * Provides typed API methods for upload job management.
 */

import { apiClient, buildQueryString } from './client'

// =============================================================================
// Types
// =============================================================================

export type UploadJobStatus =
    | 'queued'
    | 'processing'
    | 'completed'
    | 'failed'
    | 'cancelled'

export interface UploadJob {
    id: string
    appId: string
    appName: string
    version: string
    status: UploadJobStatus
    queuedAt: string
    startedAt?: string
    completedAt?: string
    error?: string
}

export interface ListUploadJobsParams {
    status?: UploadJobStatus
    page?: number
    pageSize?: number
}

export interface ListUploadJobsResponse {
    jobs: UploadJob[]
    pagination: {
        page: number
        pageSize: number
        total: number
        totalPages: number
    }
}

export interface CancelUploadJobResponse {
    success: boolean
    message: string
}

// =============================================================================
// API Methods
// =============================================================================

export const uploads = {
    /**
     * List upload jobs for an account with optional filters
     */
    list(accountId: string, params?: ListUploadJobsParams): Promise<ListUploadJobsResponse> {
        const query = buildQueryString(
            params as Record<string, string | number | boolean | undefined> ?? {}
        )
        return apiClient.get(`/accounts/${accountId}/uploads${query}`)
    },

    /**
     * Cancel a queued upload job
     */
    cancel(accountId: string, jobId: string): Promise<CancelUploadJobResponse> {
        return apiClient.post(`/accounts/${accountId}/uploads/${jobId}/cancel`, {})
    },
}
