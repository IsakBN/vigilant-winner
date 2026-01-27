'use client'

/**
 * useCrashIntegrations Hook
 *
 * TanStack Query hooks for crash reporting integration management.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
    crashIntegrations,
    type CreateCrashIntegrationInput,
    type UpdateCrashIntegrationInput,
} from '@/lib/api'

/**
 * Query key factory for crash integrations
 */
export const crashIntegrationsKeys = {
    all: ['crashIntegrations'] as const,
    list: (accountId: string, appId: string) =>
        [...crashIntegrationsKeys.all, 'list', accountId, appId] as const,
    detail: (accountId: string, appId: string, integrationId: string) =>
        [...crashIntegrationsKeys.all, 'detail', accountId, appId, integrationId] as const,
}

/**
 * Hook to fetch crash integrations list for an app
 */
export function useCrashIntegrations(accountId: string, appId: string) {
    return useQuery({
        queryKey: crashIntegrationsKeys.list(accountId, appId),
        queryFn: () => crashIntegrations.list(accountId, appId),
        enabled: Boolean(accountId) && Boolean(appId),
    })
}

/**
 * Hook to create a crash integration
 */
export function useCreateCrashIntegration(accountId: string, appId: string) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (data: CreateCrashIntegrationInput) =>
            crashIntegrations.create(accountId, appId, data),
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: crashIntegrationsKeys.list(accountId, appId),
            })
        },
    })
}

/**
 * Hook to update a crash integration
 */
export function useUpdateCrashIntegration(accountId: string, appId: string) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({
            integrationId,
            data,
        }: {
            integrationId: string
            data: UpdateCrashIntegrationInput
        }) => crashIntegrations.update(accountId, appId, integrationId, data),
        onSuccess: (_, { integrationId }) => {
            void queryClient.invalidateQueries({
                queryKey: crashIntegrationsKeys.detail(accountId, appId, integrationId),
            })
            void queryClient.invalidateQueries({
                queryKey: crashIntegrationsKeys.list(accountId, appId),
            })
        },
    })
}

/**
 * Hook to delete a crash integration
 */
export function useDeleteCrashIntegration(accountId: string, appId: string) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (integrationId: string) =>
            crashIntegrations.delete(accountId, appId, integrationId),
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: crashIntegrationsKeys.list(accountId, appId),
            })
        },
    })
}

/**
 * Hook to test a crash integration
 */
export function useTestCrashIntegration(accountId: string, appId: string) {
    return useMutation({
        mutationFn: (integrationId: string) =>
            crashIntegrations.test(accountId, appId, integrationId),
    })
}
