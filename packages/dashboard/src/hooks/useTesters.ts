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
    list: (appId: string) => [...testersKeys.all, 'list', appId] as const,
    detail: (appId: string, testerId: string) =>
        [...testersKeys.all, 'detail', appId, testerId] as const,
}

// =============================================================================
// Tester Queries
// =============================================================================

/**
 * Hook to fetch all testers for an app
 */
export function useTesters(appId: string) {
    const query = useQuery({
        queryKey: testersKeys.list(appId),
        queryFn: () => testers.list(appId),
        enabled: Boolean(appId),
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
export function useTester(appId: string, testerId: string) {
    return useQuery({
        queryKey: testersKeys.detail(appId, testerId),
        queryFn: () => testers.get(appId, testerId),
        enabled: Boolean(appId) && Boolean(testerId),
    })
}

// =============================================================================
// Tester Mutations
// =============================================================================

/**
 * Hook to create a new tester
 */
export function useCreateTester(appId: string) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (data: CreateTesterInput) => testers.create(appId, data),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: testersKeys.list(appId) })
        },
    })
}

/**
 * Hook to delete a tester
 */
export function useDeleteTester(appId: string) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (testerId: string) => testers.delete(appId, testerId),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: testersKeys.list(appId) })
        },
    })
}

/**
 * Hook to bulk import testers from CSV
 */
export function useImportTesters(appId: string) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (csv: string) => testers.importCsv(appId, csv),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: testersKeys.list(appId) })
        },
    })
}

/**
 * Hook to export testers as CSV
 */
export function useExportTesters(appId: string) {
    return useMutation({
        mutationFn: () => testers.exportCsv(appId),
    })
}
