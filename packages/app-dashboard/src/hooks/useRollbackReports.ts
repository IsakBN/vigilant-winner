'use client'

/**
 * useRollbackReports Hook
 *
 * TanStack Query hook for fetching rollback reports for a release.
 */

import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'

// =============================================================================
// Types
// =============================================================================

export interface RollbackReportSummary {
    healthy: number
    rolledBack: number
    failureRate: number
}

export interface FailureBreakdown {
    reason: string
    count: number
}

export interface RecentRollback {
    deviceId: string
    reason: string
    timestamp: number
}

export interface RollbackReport {
    summary: RollbackReportSummary
    failureBreakdown: FailureBreakdown[]
    recentRollbacks: RecentRollback[]
}

interface RollbackReportsResponse {
    report: RollbackReport
}

// =============================================================================
// Query Keys
// =============================================================================

export const rollbackReportKeys = {
    all: ['rollback-reports'] as const,
    detail: (releaseId: string) => [...rollbackReportKeys.all, releaseId] as const,
}

// =============================================================================
// API Method
// =============================================================================

async function fetchRollbackReports(
    accountId: string,
    appId: string,
    releaseId: string
): Promise<RollbackReport> {
    const response = await apiClient.get<RollbackReportsResponse>(
        `/accounts/${accountId}/apps/${appId}/releases/${releaseId}/rollback-reports`
    )
    return response.report
}

// =============================================================================
// Hook
// =============================================================================

interface UseRollbackReportsOptions {
    enabled?: boolean
    refetchOnWindowFocus?: boolean
}

export function useRollbackReports(
    accountId: string,
    appId: string,
    releaseId: string,
    options?: UseRollbackReportsOptions
) {
    return useQuery({
        queryKey: rollbackReportKeys.detail(releaseId),
        queryFn: () => fetchRollbackReports(accountId, appId, releaseId),
        enabled:
            Boolean(accountId) &&
            Boolean(appId) &&
            Boolean(releaseId) &&
            (options?.enabled ?? true),
        refetchOnWindowFocus: options?.refetchOnWindowFocus ?? true,
        refetchInterval: 30000,
        staleTime: 15 * 1000,
        retry: (failureCount, error) => {
            if (error instanceof Error && error.message.includes('404')) {
                return false
            }
            return failureCount < 2
        },
    })
}
