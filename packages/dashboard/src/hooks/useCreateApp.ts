'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apps, type CreateAppInput, type CreateAppResponse } from '@/lib/api'
import { ApiClientError } from '@/lib/api/client'

interface UseCreateAppOptions {
    accountId: string
    onSuccess?: (data: CreateAppResponse) => void
    onError?: (error: ApiClientError) => void
}

/**
 * Hook to create a new app with TanStack Query mutation.
 *
 * Automatically invalidates the apps list cache on success.
 */
export function useCreateApp({ accountId, onSuccess, onError }: UseCreateAppOptions) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (data: CreateAppInput) => apps.create(accountId, data),
        onSuccess: (data) => {
            // Invalidate apps list to refetch with new app
            void queryClient.invalidateQueries({ queryKey: ['apps', accountId] })
            onSuccess?.(data)
        },
        onError: (error) => {
            if (error instanceof ApiClientError) {
                onError?.(error)
            }
        },
    })
}
