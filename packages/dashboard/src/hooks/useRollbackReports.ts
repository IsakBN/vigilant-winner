'use client'

import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'

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

async function fetchRollbackReports(releaseId: string): Promise<RollbackReport> {
    const response = await apiClient.get<RollbackReportsResponse>(
        `/v1/releases/${releaseId}/rollback-reports`
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
    releaseId: string,
    options?: UseRollbackReportsOptions
) {
    return useQuery({
        queryKey: rollbackReportKeys.detail(releaseId),
        queryFn: () => fetchRollbackReports(releaseId),
        enabled: Boolean(releaseId) && (options?.enabled ?? true),
        refetchOnWindowFocus: options?.refetchOnWindowFocus ?? true,
        refetchInterval: 30000, // Poll every 30s for updates
        staleTime: 15 * 1000,
        retry: (failureCount, error) => {
            // Don't retry on 404 (endpoint may not exist yet)
            if (error instanceof Error && error.message.includes('404')) {
                return false
            }
            return failureCount < 2
        },
    })
}
