'use client'

/**
 * useApps Hook
 *
 * TanStack Query hook for fetching and managing apps list.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apps, type App, type CreateAppInput, type Platform } from '@/lib/api'

/**
 * Query key factory for apps
 */
export const appsKeys = {
    all: ['apps'] as const,
    list: (accountId: string) => [...appsKeys.all, 'list', accountId] as const,
    detail: (accountId: string, appId: string) =>
        [...appsKeys.all, 'detail', accountId, appId] as const,
}

/**
 * Filter options for apps list
 */
export interface AppFilters {
    platform?: Platform | 'all'
    search?: string
}

/**
 * Filter apps client-side based on filters
 */
function filterApps(appList: App[], filters: AppFilters): App[] {
    let result = appList

    if (filters.platform && filters.platform !== 'all') {
        result = result.filter((app) => app.platform === filters.platform)
    }

    if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        result = result.filter(
            (app) =>
                app.name.toLowerCase().includes(searchLower) ||
                app.bundleId?.toLowerCase().includes(searchLower)
        )
    }

    return result
}

/**
 * Hook to fetch apps list
 */
export function useApps(accountId: string, filters?: AppFilters) {
    const query = useQuery({
        queryKey: appsKeys.list(accountId),
        queryFn: () => apps.list(accountId),
        enabled: Boolean(accountId),
    })

    const filteredApps = query.data?.apps
        ? filterApps(query.data.apps, filters ?? {})
        : []

    return {
        apps: filteredApps,
        total: query.data?.apps.length ?? 0,
        filteredCount: filteredApps.length,
        isLoading: query.isLoading,
        isError: query.isError,
        error: query.error,
        refetch: query.refetch,
    }
}

/**
 * Hook to fetch a single app
 */
export function useApp(accountId: string, appId: string) {
    return useQuery({
        queryKey: appsKeys.detail(accountId, appId),
        queryFn: () => apps.get(accountId, appId),
        enabled: Boolean(accountId) && Boolean(appId),
    })
}

/**
 * Hook to create a new app
 */
export function useCreateApp(accountId: string) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (data: CreateAppInput) => apps.create(accountId, data),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: appsKeys.list(accountId) })
        },
    })
}

/**
 * Hook to delete an app
 */
export function useDeleteApp(accountId: string) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (appId: string) => apps.delete(accountId, appId),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: appsKeys.list(accountId) })
        },
    })
}
