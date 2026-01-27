'use client'

/**
 * useDashboardOverview Hook
 *
 * TanStack Query hook for fetching account-level dashboard overview data.
 * Provides usage metrics, billing info, and aggregate statistics.
 */

import { useQuery, keepPreviousData } from '@tanstack/react-query'
import {
    accounts,
    type AccountDashboardOverview,
    type AccountUsage,
    type AccountBilling,
    type AccountStats,
    type PlanType,
} from '@/lib/api'

/**
 * Query key factory for dashboard overview
 */
export const dashboardOverviewKeys = {
    all: ['dashboard', 'overview'] as const,
    byAccount: (accountId: string) =>
        [...dashboardOverviewKeys.all, accountId] as const,
}

/**
 * Options for useDashboardOverview hook
 */
export interface UseDashboardOverviewOptions {
    /** Whether the query should execute */
    enabled?: boolean
    /** Refetch interval in milliseconds */
    refetchInterval?: number
}

/**
 * Return type for useDashboardOverview hook
 */
export interface UseDashboardOverviewResult {
    /** The dashboard overview data */
    data: AccountDashboardOverview | undefined
    /** Whether the initial data is loading */
    isLoading: boolean
    /** Whether there was an error fetching data */
    isError: boolean
    /** The error object if isError is true */
    error: Error | null
    /** Whether data is being refetched in the background */
    isFetching: boolean
    /** Manually refetch the data */
    refetch: () => void
}

/**
 * Hook to fetch and cache the dashboard overview data using TanStack Query.
 *
 * Returns aggregated usage, billing, and statistics for the specified account.
 *
 * @param accountId - The account ID to fetch overview for
 * @param options - Optional configuration for the query
 * @returns Dashboard overview data with loading and error states
 *
 * @example
 * ```tsx
 * function DashboardPage({ accountId }: { accountId: string }) {
 *   const { data, isLoading, error } = useDashboardOverview(accountId)
 *
 *   if (isLoading) return <Skeleton />
 *   if (error) return <ErrorState error={error} />
 *
 *   return (
 *     <div>
 *       <UsageCard usage={data.usage} />
 *       <StatsCard stats={data.stats} />
 *     </div>
 *   )
 * }
 * ```
 */
export function useDashboardOverview(
    accountId: string,
    options: UseDashboardOverviewOptions = {}
): UseDashboardOverviewResult {
    const { enabled = true, refetchInterval } = options

    const query = useQuery({
        queryKey: dashboardOverviewKeys.byAccount(accountId),
        queryFn: () => accounts.getDashboardOverview(accountId),
        enabled: Boolean(accountId) && enabled,
        // Keep showing previous data while refetching to prevent loading flickers
        placeholderData: keepPreviousData,
        // Optional auto-refresh for real-time updates
        refetchInterval,
        // Stale time of 30 seconds for reasonable freshness
        staleTime: 30_000,
    })

    return {
        data: query.data?.overview,
        isLoading: query.isLoading,
        isError: query.isError,
        error: query.error,
        isFetching: query.isFetching,
        refetch: query.refetch,
    }
}

// Re-export types for convenience
export type {
    AccountDashboardOverview,
    AccountUsage,
    AccountBilling,
    AccountStats,
    PlanType,
}
