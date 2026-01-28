'use client'

/**
 * useReleases Hook
 *
 * TanStack Query hooks for fetching and managing releases.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
    releases,
    type Release,
    type ReleaseWithStats,
    type ReleaseStatus,
    type ListReleasesParams,
    type CreateReleaseInput,
    type UpdateReleaseInput,
} from '@/lib/api'

// =============================================================================
// Query Keys
// =============================================================================

export const releasesKeys = {
    all: ['releases'] as const,
    lists: () => [...releasesKeys.all, 'list'] as const,
    list: (accountId: string, appId: string, params?: ListReleasesParams) =>
        [...releasesKeys.lists(), accountId, appId, params] as const,
    details: () => [...releasesKeys.all, 'detail'] as const,
    detail: (accountId: string, appId: string, releaseId: string) =>
        [...releasesKeys.details(), accountId, appId, releaseId] as const,
}

// =============================================================================
// Query Options
// =============================================================================

interface UseReleasesOptions {
    enabled?: boolean
    refetchOnWindowFocus?: boolean
    refetchInterval?: number
}

interface UseReleaseOptions {
    enabled?: boolean
    refetchOnWindowFocus?: boolean
    refetchInterval?: number
}

// =============================================================================
// List Releases Hook
// =============================================================================

/**
 * Hook to fetch releases list for an app
 */
export function useReleases(
    accountId: string,
    appId: string,
    params?: ListReleasesParams,
    options?: UseReleasesOptions
) {
    return useQuery({
        queryKey: releasesKeys.list(accountId, appId, params),
        queryFn: () => releases.list(accountId, appId, params),
        enabled:
            Boolean(accountId) && Boolean(appId) && (options?.enabled ?? true),
        refetchOnWindowFocus: options?.refetchOnWindowFocus ?? true,
        refetchInterval: options?.refetchInterval,
        staleTime: 30 * 1000,
        select: (data) => ({
            releases: data.releases,
            pagination: data.pagination,
        }),
    })
}

// =============================================================================
// Single Release Hook
// =============================================================================

/**
 * Hook to fetch a single release with stats
 */
export function useRelease(
    accountId: string,
    appId: string,
    releaseId: string,
    options?: UseReleaseOptions
) {
    return useQuery({
        queryKey: releasesKeys.detail(accountId, appId, releaseId),
        queryFn: () => releases.get(accountId, appId, releaseId),
        enabled:
            Boolean(accountId) &&
            Boolean(appId) &&
            Boolean(releaseId) &&
            (options?.enabled ?? true),
        refetchOnWindowFocus: options?.refetchOnWindowFocus ?? true,
        refetchInterval: options?.refetchInterval,
        staleTime: 30 * 1000,
        select: (data) => data.release,
    })
}

// =============================================================================
// Create Release Mutation
// =============================================================================

/**
 * Hook to create a new release
 */
export function useCreateRelease(accountId: string, appId: string) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (data: CreateReleaseInput) =>
            releases.create(accountId, appId, data),
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: releasesKeys.lists(),
            })
        },
    })
}

// =============================================================================
// Update Release Mutation
// =============================================================================

/**
 * Hook to update a release
 */
export function useUpdateRelease(accountId: string, appId: string) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({
            releaseId,
            data,
        }: {
            releaseId: string
            data: UpdateReleaseInput
        }) => releases.update(accountId, appId, releaseId, data),
        onSuccess: (_, variables) => {
            void queryClient.invalidateQueries({
                queryKey: releasesKeys.detail(accountId, appId, variables.releaseId),
            })
            void queryClient.invalidateQueries({
                queryKey: releasesKeys.lists(),
            })
        },
    })
}

// =============================================================================
// Delete Release Mutation
// =============================================================================

/**
 * Hook to delete a release
 */
export function useDeleteRelease(accountId: string, appId: string) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (releaseId: string) =>
            releases.delete(accountId, appId, releaseId),
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: releasesKeys.lists(),
            })
        },
    })
}

// =============================================================================
// Upload Bundle Mutation
// =============================================================================

/**
 * Hook to upload a bundle file for a release
 */
export function useUploadBundle(accountId: string, appId: string) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ releaseId, file }: { releaseId: string; file: File }) =>
            releases.uploadBundle(accountId, appId, releaseId, file),
        onSuccess: (_, variables) => {
            void queryClient.invalidateQueries({
                queryKey: releasesKeys.detail(accountId, appId, variables.releaseId),
            })
        },
    })
}

// =============================================================================
// Rollback Release Mutation
// =============================================================================

/**
 * Hook to rollback a release
 */
export function useRollbackRelease(accountId: string, appId: string) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (releaseId: string) =>
            releases.rollback(accountId, appId, releaseId),
        onSuccess: (_, releaseId) => {
            void queryClient.invalidateQueries({
                queryKey: releasesKeys.detail(accountId, appId, releaseId),
            })
            void queryClient.invalidateQueries({
                queryKey: releasesKeys.lists(),
            })
        },
    })
}

// =============================================================================
// Re-exports for convenience
// =============================================================================

export type {
    Release,
    ReleaseWithStats,
    ReleaseStatus,
    ListReleasesParams,
    CreateReleaseInput,
    UpdateReleaseInput,
}
