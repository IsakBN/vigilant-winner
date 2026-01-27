'use client'

/**
 * useCredentials Hook
 *
 * TanStack Query hooks for Apple credential management.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { credentials, type CreateCredentialInput } from '@/lib/api'

/**
 * Query key factory for credentials
 */
export const credentialsKeys = {
    all: ['credentials'] as const,
    list: (accountId: string, appId: string) =>
        [...credentialsKeys.all, 'list', accountId, appId] as const,
    detail: (accountId: string, appId: string, credentialId: string) =>
        [...credentialsKeys.all, 'detail', accountId, appId, credentialId] as const,
}

/**
 * Hook to fetch credentials list for an app
 */
export function useCredentials(accountId: string, appId: string) {
    return useQuery({
        queryKey: credentialsKeys.list(accountId, appId),
        queryFn: () => credentials.list(accountId, appId),
        enabled: Boolean(accountId) && Boolean(appId),
    })
}

/**
 * Hook to create a credential
 */
export function useCreateCredential(accountId: string, appId: string) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (data: CreateCredentialInput) =>
            credentials.create(accountId, appId, data),
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: credentialsKeys.list(accountId, appId),
            })
        },
    })
}

/**
 * Hook to delete a credential
 */
export function useDeleteCredential(accountId: string, appId: string) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (credentialId: string) =>
            credentials.delete(accountId, appId, credentialId),
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: credentialsKeys.list(accountId, appId),
            })
        },
    })
}

/**
 * Hook to verify a credential
 */
export function useVerifyCredential(accountId: string, appId: string) {
    return useMutation({
        mutationFn: (credentialId: string) =>
            credentials.verify(accountId, appId, credentialId),
    })
}
