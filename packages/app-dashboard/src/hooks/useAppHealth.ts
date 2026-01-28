'use client'

import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'

// ============================================================================
// Types
// ============================================================================

export interface AppHealth {
    overallScore: number // 0-100
    activeDevices: number
    crashFreeRate: number // percentage
    updateSuccessRate: number // percentage
    avgUpdateTime: number // milliseconds
}

interface GetHealthResponse {
    health: AppHealth
}

// ============================================================================
// Query Keys
// ============================================================================

export const healthKeys = {
    all: ['app-health'] as const,
    detail: (accountId: string, appId: string) =>
        [...healthKeys.all, accountId, appId] as const,
}

// ============================================================================
// Hooks
// ============================================================================

export function useAppHealth(accountId: string, appId: string) {
    return useQuery({
        queryKey: healthKeys.detail(accountId, appId),
        queryFn: () =>
            apiClient.get<GetHealthResponse>(
                `/v1/apps/${appId}/health?range=24h`
            ),
        enabled: Boolean(accountId) && Boolean(appId),
        staleTime: 60 * 1000, // 1 minute
        retry: 1,
    })
}
