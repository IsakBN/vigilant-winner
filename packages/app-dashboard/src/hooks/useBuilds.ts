'use client'

/**
 * useBuilds Hook
 *
 * TanStack Query hooks for fetching and managing builds.
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
} from '@/lib/api/builds'

// =============================================================================
// Query Keys
// =============================================================================

export const buildsKeys = {
    all: ['builds'] as const,
    lists: () => [...buildsKeys.all, 'list'] as const,
    list: (accountId: string, appId: string, params?: ListBuildsParams) =>
        [...buildsKeys.lists(), accountId, appId, params] as const,
    details: () => [...buildsKeys.all, 'detail'] as const,
    detail: (accountId: string, appId: string, buildId: string) =>
        [...buildsKeys.details(), accountId, appId, buildId] as const,
    logs: (accountId: string, appId: string, buildId: string) =>
        [...buildsKeys.all, 'logs', accountId, appId, buildId] as const,
}

// =============================================================================
// Query Options
// =============================================================================

interface UseBuildsOptions {
    enabled?: boolean
    refetchOnWindowFocus?: boolean
    refetchInterval?: number
}

interface UseBuildOptions {
    enabled?: boolean
    refetchOnWindowFocus?: boolean
    refetchInterval?: number
}

interface UseBuildLogsOptions {
    enabled?: boolean
    refetchInterval?: number
}

// =============================================================================
// List Builds Hook
// =============================================================================

/**
 * Hook to fetch builds list for an app
 */
export function useBuilds(
    accountId: string,
    appId: string,
    params?: ListBuildsParams,
    options?: UseBuildsOptions
) {
    return useQuery({
        queryKey: buildsKeys.list(accountId, appId, params),
        queryFn: () => builds.list(accountId, appId, params),
        enabled:
            Boolean(accountId) && Boolean(appId) && (options?.enabled ?? true),
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

/**
 * Hook to fetch a single build with details
 */
export function useBuild(
    accountId: string,
    appId: string,
    buildId: string,
    options?: UseBuildOptions
) {
    return useQuery({
        queryKey: buildsKeys.detail(accountId, appId, buildId),
        queryFn: () => builds.get(accountId, appId, buildId),
        enabled:
            Boolean(accountId) &&
            Boolean(appId) &&
            Boolean(buildId) &&
            (options?.enabled ?? true),
        refetchOnWindowFocus: options?.refetchOnWindowFocus ?? true,
        refetchInterval: options?.refetchInterval,
        staleTime: 30 * 1000,
        select: (data) => data.build,
    })
}

// =============================================================================
// Build Logs Hook
// =============================================================================

/**
 * Hook to fetch build logs
 */
export function useBuildLogs(
    accountId: string,
    appId: string,
    buildId: string,
    options?: UseBuildLogsOptions
) {
    return useQuery({
        queryKey: buildsKeys.logs(accountId, appId, buildId),
        queryFn: () => builds.getLogs(accountId, appId, buildId),
        enabled:
            Boolean(accountId) &&
            Boolean(appId) &&
            Boolean(buildId) &&
            (options?.enabled ?? true),
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

/**
 * Hook to trigger a new build
 */
export function useTriggerBuild(accountId: string, appId: string) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (data: TriggerBuildInput) =>
            builds.trigger(accountId, appId, data),
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: buildsKeys.lists(),
            })
        },
    })
}

// =============================================================================
// Cancel Build Mutation
// =============================================================================

/**
 * Hook to cancel a build
 */
export function useCancelBuild(accountId: string, appId: string) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (buildId: string) =>
            builds.cancel(accountId, appId, buildId),
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: buildsKeys.lists(),
            })
        },
    })
}

// =============================================================================
// Retry Build Mutation
// =============================================================================

/**
 * Hook to retry a failed build
 */
export function useRetryBuild(accountId: string, appId: string) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (buildId: string) =>
            builds.retry(accountId, appId, buildId),
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: buildsKeys.lists(),
            })
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
}
