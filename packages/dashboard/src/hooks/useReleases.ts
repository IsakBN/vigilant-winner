'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
    releases,
    type Release,
    type ReleaseStatus,
    type ReleaseWithStats,
    type ListReleasesParams,
    type CreateReleaseInput,
    type UpdateReleaseInput,
    type Channel,
} from '@/lib/api/releases'

// =============================================================================
// Query Keys
// =============================================================================

export const releaseKeys = {
    all: ['releases'] as const,
    lists: () => [...releaseKeys.all, 'list'] as const,
    list: (appId: string, params?: ListReleasesParams) =>
        [...releaseKeys.lists(), appId, params] as const,
    details: () => [...releaseKeys.all, 'detail'] as const,
    detail: (appId: string, releaseId: string) =>
        [...releaseKeys.details(), appId, releaseId] as const,
    channels: (appId: string) => [...releaseKeys.all, 'channels', appId] as const,
}

// =============================================================================
// List Releases Hook
// =============================================================================

interface UseReleasesOptions {
    enabled?: boolean
    refetchOnWindowFocus?: boolean
    refetchInterval?: number
}

export function useReleases(
    appId: string,
    params?: ListReleasesParams,
    options?: UseReleasesOptions
) {
    return useQuery({
        queryKey: releaseKeys.list(appId, params),
        queryFn: () => releases.list(appId, params),
        enabled: Boolean(appId) && (options?.enabled ?? true),
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

interface UseReleaseOptions {
    enabled?: boolean
    refetchOnWindowFocus?: boolean
    refetchInterval?: number
}

export function useRelease(
    appId: string,
    releaseId: string,
    options?: UseReleaseOptions
) {
    return useQuery({
        queryKey: releaseKeys.detail(appId, releaseId),
        queryFn: () => releases.get(appId, releaseId),
        enabled: Boolean(appId) && Boolean(releaseId) && (options?.enabled ?? true),
        refetchOnWindowFocus: options?.refetchOnWindowFocus ?? true,
        refetchInterval: options?.refetchInterval,
        staleTime: 30 * 1000,
        select: (data) => data.release,
    })
}

// =============================================================================
// Create Release Mutation
// =============================================================================

export function useCreateRelease(appId: string) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (data: CreateReleaseInput) => releases.create(appId, data),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: releaseKeys.lists() })
        },
    })
}

// =============================================================================
// Update Release Mutation
// =============================================================================

export function useUpdateRelease(appId: string, releaseId: string) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (data: UpdateReleaseInput) => releases.update(appId, releaseId, data),
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: releaseKeys.detail(appId, releaseId),
            })
            void queryClient.invalidateQueries({ queryKey: releaseKeys.lists() })
        },
    })
}

// =============================================================================
// Delete Release Mutation
// =============================================================================

export function useDeleteRelease(appId: string) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (releaseId: string) => releases.delete(appId, releaseId),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: releaseKeys.lists() })
        },
    })
}

// =============================================================================
// Upload Bundle Mutation
// =============================================================================

export function useUploadBundle(appId: string, releaseId: string) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (file: File) => releases.uploadBundle(appId, releaseId, file),
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: releaseKeys.detail(appId, releaseId),
            })
        },
    })
}

// =============================================================================
// Channels Hook
// =============================================================================

export function useChannels(appId: string, options?: { enabled?: boolean }) {
    return useQuery({
        queryKey: releaseKeys.channels(appId),
        queryFn: () => releases.listChannels(appId),
        enabled: Boolean(appId) && (options?.enabled ?? true),
        staleTime: 60 * 1000,
        select: (data) => data.channels,
    })
}

// =============================================================================
// Re-exports for convenience
// =============================================================================

export type {
    Release,
    ReleaseStatus,
    ReleaseWithStats,
    ListReleasesParams,
    CreateReleaseInput,
    UpdateReleaseInput,
    Channel,
}
