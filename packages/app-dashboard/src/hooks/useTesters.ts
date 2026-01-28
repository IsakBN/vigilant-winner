'use client'

/**
 * useTesters Hooks
 *
 * TanStack Query hooks for tester management.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { testers, type CreateTesterInput } from '@/lib/api'

// =============================================================================
// Query Key Factory
// =============================================================================

export const testersKeys = {
    all: ['testers'] as const,
    list: (accountId: string, appId: string) =>
        [...testersKeys.all, 'list', accountId, appId] as const,
    detail: (accountId: string, appId: string, testerId: string) =>
        [...testersKeys.all, 'detail', accountId, appId, testerId] as const,
}

// =============================================================================
// Tester Queries
// =============================================================================

/**
 * Hook to fetch all testers for an app
 */
export function useTesters(accountId: string, appId: string) {
    const query = useQuery({
        queryKey: testersKeys.list(accountId, appId),
        queryFn: () => testers.list(accountId, appId),
        enabled: Boolean(accountId) && Boolean(appId),
    })

    return {
        testers: query.data?.testers ?? [],
        isLoading: query.isLoading,
        isError: query.isError,
        error: query.error,
        refetch: query.refetch,
    }
}

/**
 * Hook to fetch a single tester
 */
export function useTester(accountId: string, appId: string, testerId: string) {
    return useQuery({
        queryKey: testersKeys.detail(accountId, appId, testerId),
        queryFn: () => testers.get(accountId, appId, testerId),
        enabled: Boolean(accountId) && Boolean(appId) && Boolean(testerId),
    })
}

// =============================================================================
// Tester Mutations
// =============================================================================

/**
 * Hook to create a new tester
 */
export function useCreateTester(accountId: string, appId: string) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (data: CreateTesterInput) => testers.create(accountId, appId, data),
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: testersKeys.list(accountId, appId),
            })
        },
    })
}

/**
 * Hook to delete a tester
 */
export function useDeleteTester(accountId: string, appId: string) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (testerId: string) => testers.delete(accountId, appId, testerId),
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: testersKeys.list(accountId, appId),
            })
        },
    })
}

/**
 * Hook to bulk import testers from CSV
 */
export function useImportTesters(accountId: string, appId: string) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (csv: string) => testers.importCsv(accountId, appId, csv),
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: testersKeys.list(accountId, appId),
            })
        },
    })
}

/**
 * Hook to export testers as CSV
 */
export function useExportTesters(accountId: string, appId: string) {
    return useMutation({
        mutationFn: () => testers.exportCsv(accountId, appId),
    })
}
