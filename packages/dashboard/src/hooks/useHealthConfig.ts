'use client'

/**
 * useHealthConfig Hook
 *
 * TanStack Query hooks for health check configuration management.
 * Provides hooks to fetch and save critical events and endpoints.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'

// =============================================================================
// Types
// =============================================================================

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'

export interface CriticalEvent {
    id: string
    name: string
    required: boolean
    timeoutSeconds: number
}

export interface CriticalEndpoint {
    id: string
    method: HttpMethod
    url: string
    expectedStatusCodes: number[]
    required: boolean
}

export interface HealthConfig {
    criticalEvents: CriticalEvent[]
    criticalEndpoints: CriticalEndpoint[]
}

export interface HealthConfigResponse {
    config: HealthConfig
}

export interface SaveHealthConfigInput {
    criticalEvents: Omit<CriticalEvent, 'id'>[]
    criticalEndpoints: Omit<CriticalEndpoint, 'id'>[]
}

// =============================================================================
// Query Keys
// =============================================================================

export const healthConfigKeys = {
    all: ['health-config'] as const,
    detail: (appId: string) => [...healthConfigKeys.all, appId] as const,
}

// =============================================================================
// API Functions
// =============================================================================

async function getHealthConfig(appId: string): Promise<HealthConfigResponse> {
    return apiClient.get(`/v1/apps/${appId}/health-config`)
}

async function saveHealthConfig(
    appId: string,
    config: SaveHealthConfigInput
): Promise<HealthConfigResponse> {
    return apiClient.post(`/v1/apps/${appId}/health-config`, config)
}

// =============================================================================
// Hooks
// =============================================================================

/**
 * Hook to fetch health configuration for an app
 */
export function useHealthConfig(appId: string) {
    const queryClient = useQueryClient()

    const { data, isLoading, error } = useQuery({
        queryKey: healthConfigKeys.detail(appId),
        queryFn: () => getHealthConfig(appId),
        enabled: Boolean(appId),
    })

    const saveMutation = useMutation({
        mutationFn: (config: SaveHealthConfigInput) =>
            saveHealthConfig(appId, config),
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: healthConfigKeys.detail(appId),
            })
        },
    })

    return {
        config: data?.config,
        isLoading,
        error,
        saveConfig: saveMutation.mutateAsync,
        isSaving: saveMutation.isPending,
    }
}
