'use client'

/**
 * Build Hooks for BundleNudge Dashboard
 *
 * TanStack Query hooks for build management.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
    builds,
    type Build,
    type BuildStatus,
    type BuildPlatform,
    type BuildLog,
    type ListBuildsParams,
    type TriggerBuildInput,
    type UploadProgressEvent,
} from '@/lib/api/builds'

// =============================================================================
// Query Keys
// =============================================================================

export const buildKeys = {
    all: ['builds'] as const,
    lists: () => [...buildKeys.all, 'list'] as const,
    list: (appId: string, params?: ListBuildsParams) =>
        [...buildKeys.lists(), appId, params] as const,
    details: () => [...buildKeys.all, 'detail'] as const,
    detail: (appId: string, buildId: string) =>
        [...buildKeys.details(), appId, buildId] as const,
    logs: (appId: string, buildId: string) =>
        [...buildKeys.all, 'logs', appId, buildId] as const,
}

// =============================================================================
// List Builds Hook
// =============================================================================

interface UseBuildsOptions {
    enabled?: boolean
    refetchOnWindowFocus?: boolean
    refetchInterval?: number
}

export function useBuilds(
    appId: string,
    params?: ListBuildsParams,
    options?: UseBuildsOptions
) {
    return useQuery({
        queryKey: buildKeys.list(appId, params),
        queryFn: () => builds.list(appId, params),
        enabled: Boolean(appId) && (options?.enabled ?? true),
        refetchOnWindowFocus: options?.refetchOnWindowFocus ?? true,
        refetchInterval: options?.refetchInterval,
        staleTime: 30 * 1000,
        select: (data) => ({
            builds: data.builds,
            pagination: data.pagination,
        }),
    })
}

// =============================================================================
// Single Build Hook
// =============================================================================

interface UseBuildOptions {
    enabled?: boolean
    refetchOnWindowFocus?: boolean
    refetchInterval?: number
}

export function useBuild(
    appId: string,
    buildId: string,
    options?: UseBuildOptions
) {
    return useQuery({
        queryKey: buildKeys.detail(appId, buildId),
        queryFn: () => builds.get(appId, buildId),
        enabled: Boolean(appId) && Boolean(buildId) && (options?.enabled ?? true),
        refetchOnWindowFocus: options?.refetchOnWindowFocus ?? true,
        refetchInterval: options?.refetchInterval,
        staleTime: 30 * 1000,
        select: (data) => data.build,
    })
}

// =============================================================================
// Build Logs Hook
// =============================================================================

interface UseBuildLogsOptions {
    enabled?: boolean
    refetchInterval?: number
}

export function useBuildLogs(
    appId: string,
    buildId: string,
    options?: UseBuildLogsOptions
) {
    return useQuery({
        queryKey: buildKeys.logs(appId, buildId),
        queryFn: () => builds.getLogs(appId, buildId),
        enabled: Boolean(appId) && Boolean(buildId) && (options?.enabled ?? true),
        refetchInterval: options?.refetchInterval,
        staleTime: 10 * 1000,
        select: (data) => ({
            logs: data.logs,
            hasMore: data.hasMore,
            nextCursor: data.nextCursor,
        }),
    })
}

// =============================================================================
// Trigger Build Mutation
// =============================================================================

export function useTriggerBuild(appId: string) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (data: TriggerBuildInput) => builds.trigger(appId, data),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: buildKeys.lists() })
        },
    })
}

// =============================================================================
// Cancel Build Mutation
// =============================================================================

export function useCancelBuild(appId: string) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (buildId: string) => builds.cancel(appId, buildId),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: buildKeys.lists() })
        },
    })
}

// =============================================================================
// Retry Build Mutation
// =============================================================================

export function useRetryBuild(appId: string) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (buildId: string) => builds.retry(appId, buildId),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: buildKeys.lists() })
        },
    })
}

// =============================================================================
// Upload Bundle Mutation
// =============================================================================

interface UploadBundleParams {
    file: File
    platform: BuildPlatform
    version: string
    onProgress?: (event: UploadProgressEvent) => void
}

export function useUploadBundleBuild(appId: string) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ file, platform, version, onProgress }: UploadBundleParams) =>
            builds.uploadBundle(appId, file, platform, version, onProgress),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: buildKeys.lists() })
        },
    })
}

// =============================================================================
// Re-exports for convenience
// =============================================================================

export type {
    Build,
    BuildStatus,
    BuildPlatform,
    BuildLog,
    ListBuildsParams,
    TriggerBuildInput,
    UploadProgressEvent,
}
