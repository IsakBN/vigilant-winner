'use client'

/**
 * Admin Operations Hooks
 *
 * TanStack Query hooks for OTA operations monitoring including metrics,
 * build queue, API health, storage, logs, database stats, and admin apps.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
    getOtaMetrics,
    getBuildQueue,
    cancelBuild,
    retryBuild,
    getApiHealth,
    getStorageMetrics,
    cleanupOrphanedBundles,
    getSystemLogs,
    exportLogs,
    getDatabaseStats,
    listAdminApps,
    getAdminApp,
    updateAppStatus,
    deleteAdminApp,
} from '@/lib/api'
import type { ListLogsParams, ListAdminAppsParams } from '@/lib/api/types/admin'

// Query keys factory
export const adminOpsKeys = {
    all: ['admin-ops'] as const,
    otaMetrics: (period: string) => [...adminOpsKeys.all, 'ota-metrics', period] as const,
    buildQueue: () => [...adminOpsKeys.all, 'build-queue'] as const,
    apiHealth: () => [...adminOpsKeys.all, 'api-health'] as const,
    storage: () => [...adminOpsKeys.all, 'storage'] as const,
    logs: (params: ListLogsParams) => [...adminOpsKeys.all, 'logs', params] as const,
    database: () => [...adminOpsKeys.all, 'database'] as const,
    apps: (params: ListAdminAppsParams) => [...adminOpsKeys.all, 'apps', params] as const,
    app: (id: string) => [...adminOpsKeys.all, 'app', id] as const,
}

// =============================================================================
// OTA Metrics
// =============================================================================

/** Hook to fetch OTA metrics for a given time period */
export function useOtaMetrics(period: '24h' | '7d' | '30d' = '24h') {
    return useQuery({
        queryKey: adminOpsKeys.otaMetrics(period),
        queryFn: () => getOtaMetrics(period),
        refetchInterval: 30000,
    })
}

// =============================================================================
// Build Queue
// =============================================================================

/** Hook to fetch the current build queue */
export function useBuildQueue() {
    return useQuery({
        queryKey: adminOpsKeys.buildQueue(),
        queryFn: getBuildQueue,
        refetchInterval: 5000,
    })
}

/** Hook to cancel a build in the queue */
export function useCancelBuild() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: cancelBuild,
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: adminOpsKeys.buildQueue() })
        },
    })
}

/** Hook to retry a failed build */
export function useRetryBuild() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: retryBuild,
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: adminOpsKeys.buildQueue() })
        },
    })
}

// =============================================================================
// API Health
// =============================================================================

/** Hook to fetch API health status */
export function useApiHealth() {
    return useQuery({
        queryKey: adminOpsKeys.apiHealth(),
        queryFn: getApiHealth,
        refetchInterval: 10000,
    })
}

// =============================================================================
// Storage Metrics
// =============================================================================

/** Hook to fetch storage metrics */
export function useStorageMetrics() {
    return useQuery({
        queryKey: adminOpsKeys.storage(),
        queryFn: getStorageMetrics,
        refetchInterval: 60000,
    })
}

/** Hook to cleanup orphaned bundles from storage */
export function useCleanupOrphanedBundles() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: cleanupOrphanedBundles,
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: adminOpsKeys.storage() })
        },
    })
}

// =============================================================================
// System Logs
// =============================================================================

/** Hook to fetch system logs with filtering */
export function useSystemLogs(params: ListLogsParams = {}) {
    return useQuery({
        queryKey: adminOpsKeys.logs(params),
        queryFn: () => getSystemLogs(params),
        refetchInterval: params.level === 'error' ? 5000 : 15000,
    })
}

/** Hook to export system logs as a downloadable file */
export function useExportLogs() {
    return useMutation({
        mutationFn: async (params: ListLogsParams) => {
            const blob = await exportLogs(params)
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `logs-${new Date().toISOString()}.json`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)
            return { success: true }
        },
    })
}

// =============================================================================
// Database Stats
// =============================================================================

/** Hook to fetch database statistics */
export function useDatabaseStats() {
    return useQuery({
        queryKey: adminOpsKeys.database(),
        queryFn: getDatabaseStats,
        refetchInterval: 60000,
    })
}

// =============================================================================
// Admin Apps
// =============================================================================

/** Hook to fetch paginated list of apps for admin management */
export function useAdminApps(params: ListAdminAppsParams = {}) {
    const query = useQuery({
        queryKey: adminOpsKeys.apps(params),
        queryFn: () => listAdminApps(params),
    })

    return {
        apps: query.data?.apps ?? [],
        total: query.data?.total ?? 0,
        page: query.data?.page ?? 1,
        totalPages: query.data?.totalPages ?? 1,
        isLoading: query.isLoading,
        isError: query.isError,
        error: query.error,
        refetch: query.refetch,
    }
}

/** Hook to fetch a single app for admin management */
export function useAdminOpsApp(appId: string) {
    return useQuery({
        queryKey: adminOpsKeys.app(appId),
        queryFn: () => getAdminApp(appId),
        enabled: Boolean(appId),
    })
}

/** Hook to update an app's status (active/disabled) */
export function useUpdateAppStatus() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ appId, status }: { appId: string; status: 'active' | 'disabled' }) =>
            updateAppStatus(appId, status),
        onSuccess: (_, { appId }) => {
            void queryClient.invalidateQueries({ queryKey: adminOpsKeys.apps({}) })
            void queryClient.invalidateQueries({ queryKey: adminOpsKeys.app(appId) })
        },
    })
}

/** Hook to delete an app (admin only) */
export function useDeleteAdminApp() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: deleteAdminApp,
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: adminOpsKeys.apps({}) })
        },
    })
}
