'use client'

import { useQuery } from '@tanstack/react-query'

// ============================================================================
// Types
// ============================================================================

export interface TrendDataPoint {
    date: string
    updates: number
    failures: number
}

export interface DeviceDistribution {
    osVersion: string
    count: number
    percentage: number
}

export interface AppMetrics {
    trends: TrendDataPoint[]
    deviceDistribution: DeviceDistribution[]
}

// ============================================================================
// Query Keys
// ============================================================================

export const appMetricsKeys = {
    all: ['app-metrics'] as const,
    overview: (accountId: string, appId: string, period: '7d' | '30d') =>
        [...appMetricsKeys.all, accountId, appId, period] as const,
}

// ============================================================================
// Hooks
// ============================================================================

export function useAppMetrics(
    accountId: string,
    appId: string,
    period: '7d' | '30d' = '7d'
) {
    return useQuery({
        queryKey: appMetricsKeys.overview(accountId, appId, period),
        queryFn: async () => {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/v1/apps/${appId}/metrics/overview?from=${period}`,
                { credentials: 'include' }
            )
            if (!response.ok) {
                throw new Error('Failed to fetch metrics')
            }
            return (await response.json()) as AppMetrics
        },
        enabled: Boolean(accountId) && Boolean(appId),
        staleTime: 60 * 1000, // 1 minute
    })
}
