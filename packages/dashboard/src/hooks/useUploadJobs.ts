'use client'

/**
 * Upload Jobs Hooks for BundleNudge Dashboard
 *
 * TanStack Query hooks for upload job management.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
    uploads,
    type UploadJob,
    type UploadJobStatus,
    type ListUploadJobsParams,
} from '@/lib/api/uploads'

// =============================================================================
// Query Keys
// =============================================================================

export const uploadJobKeys = {
    all: ['upload-jobs'] as const,
    lists: () => [...uploadJobKeys.all, 'list'] as const,
    list: (accountId: string, status?: string) =>
        [...uploadJobKeys.lists(), accountId, status] as const,
}

// =============================================================================
// List Upload Jobs Hook
// =============================================================================

interface UseUploadJobsOptions {
    enabled?: boolean
    refetchOnWindowFocus?: boolean
}

export function useUploadJobs(
    accountId: string,
    status?: UploadJobStatus | 'all',
    options?: UseUploadJobsOptions
) {
    const params: ListUploadJobsParams = {
        status: status === 'all' ? undefined : status,
    }

    return useQuery({
        queryKey: uploadJobKeys.list(accountId, status),
        queryFn: () => uploads.list(accountId, params),
        enabled: Boolean(accountId) && (options?.enabled ?? true),
        refetchOnWindowFocus: options?.refetchOnWindowFocus ?? true,
        refetchInterval: 5000, // Poll every 5 seconds for real-time updates
        staleTime: 3000,
        select: (data) => ({
            jobs: data.jobs,
            pagination: data.pagination,
        }),
    })
}

// =============================================================================
// Cancel Upload Job Mutation
// =============================================================================

export function useCancelUploadJob(accountId: string) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (jobId: string) => uploads.cancel(accountId, jobId),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: uploadJobKeys.all })
        },
    })
}

// =============================================================================
// Re-exports for convenience
// =============================================================================

export type { UploadJob, UploadJobStatus, ListUploadJobsParams }
