'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apps } from '@/lib/api'
import type { UpdateAppInput, UpdateAppResponse, RegenerateApiKeyResponse } from '@/lib/api/types'

// ============================================================================
// Types
// ============================================================================

export interface App {
    id: string
    name: string
    platform: 'ios' | 'android' | 'both'
    bundleId: string
    createdAt: number
    updatedAt: number
}

export interface AppStats {
    activeDevices: number
    totalReleases: number
    downloadsThisMonth: number
}

export interface AppWithStats extends App {
    stats: AppStats
    apiKey?: string | null
}

// ============================================================================
// Hooks
// ============================================================================

export function useAppDetails(accountId: string, appId: string) {
    return useQuery({
        queryKey: ['app', accountId, appId],
        queryFn: () => apps.getWithStats(accountId, appId),
        enabled: Boolean(accountId) && Boolean(appId),
        staleTime: 30 * 1000,
    })
}

export function useUpdateApp(accountId: string, appId: string) {
    const queryClient = useQueryClient()

    return useMutation<UpdateAppResponse, Error, UpdateAppInput>({
        mutationFn: (data) => apps.update(accountId, appId, data),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ['app', accountId, appId] })
            void queryClient.invalidateQueries({ queryKey: ['apps'] })
        },
    })
}

export function useDeleteAppById(accountId: string, appId: string) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: () => apps.delete(accountId, appId),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ['apps'] })
        },
    })
}

export function useRegenerateApiKey(accountId: string, appId: string) {
    const queryClient = useQueryClient()

    return useMutation<RegenerateApiKeyResponse>({
        mutationFn: () => apps.regenerateApiKey(accountId, appId),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ['app', accountId, appId] })
        },
    })
}
