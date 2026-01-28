'use client'

/**
 * useAppHealth Hook
 *
 * TanStack Query hook for fetching and caching per-app health data.
 * Provides health status, metrics, funnel data, and recent issues.
 */

import { useQuery } from '@tanstack/react-query'
import { apps } from '@/lib/api'
import type { AppHealth, AppHealthStatus } from '@/lib/api'

// Re-export types for convenience
export type { AppHealth, AppHealthStatus }

/**
 * Query key factory for app health
 */
export const appHealthKeys = {
    all: ['app-health'] as const,
    detail: (accountId: string, appId: string) =>
        [...appHealthKeys.all, accountId, appId] as const,
}

/**
 * Default stale time for health data (1 minute)
 * Health data is semi-real-time but doesn't need constant refreshing
 */
const HEALTH_STALE_TIME = 60_000

/**
 * Hook to fetch and cache per-app health data using TanStack Query.
 * Returns health status, metrics, funnel data, and recent issues for an app.
 *
 * @param accountId - The account ID the app belongs to
 * @param appId - The app ID to fetch health data for
 * @returns Query result with health data, loading state, error, and refetch
 *
 * @example
 * ```tsx
 * function AppHealthDisplay({ accountId, appId }) {
 *   const { health, isLoading, error } = useAppHealth(accountId, appId)
 *
 *   if (isLoading) return <Spinner />
 *   if (error) return <ErrorState error={error} />
 *   if (!health) return null
 *
 *   return (
 *     <div>
 *       <StatusBadge status={health.status} />
 *       <MetricsDisplay metrics={health.metrics} />
 *       <FunnelChart funnel={health.funnel} />
 *       <IssuesList issues={health.recentIssues} />
 *     </div>
 *   )
 * }
 * ```
 */
export function useAppHealth(accountId: string, appId: string) {
    const query = useQuery({
        queryKey: appHealthKeys.detail(accountId, appId),
        queryFn: () => apps.getHealth(accountId, appId),
        enabled: Boolean(accountId) && Boolean(appId),
        staleTime: HEALTH_STALE_TIME,
    })

    return {
        health: query.data?.health,
        isLoading: query.isLoading,
        isError: query.isError,
        error: query.error,
        refetch: query.refetch,
        isFetching: query.isFetching,
    }
}

/**
 * Helper to determine if health status indicates a problem
 */
export function isHealthCritical(status: AppHealthStatus): boolean {
    return status === 'critical'
}

/**
 * Helper to determine if health needs attention (warning or critical)
 */
export function isHealthWarningOrWorse(status: AppHealthStatus): boolean {
    return status === 'warning' || status === 'critical'
}

/**
 * Get display color for health status (Tailwind classes)
 */
export function getHealthStatusColor(status: AppHealthStatus): string {
    switch (status) {
        case 'healthy':
            return 'text-green-600'
        case 'warning':
            return 'text-amber-600'
        case 'critical':
            return 'text-red-600'
        case 'setup_required':
            return 'text-gray-500'
        default:
            return 'text-gray-400'
    }
}

/**
 * Get human-readable label for health status
 */
export function getHealthStatusLabel(status: AppHealthStatus): string {
    switch (status) {
        case 'healthy':
            return 'Healthy'
        case 'warning':
            return 'Warning'
        case 'critical':
            return 'Critical'
        case 'setup_required':
            return 'Setup Required'
        default:
            return 'Unknown'
    }
}
