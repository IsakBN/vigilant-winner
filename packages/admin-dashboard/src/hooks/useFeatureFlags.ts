'use client'

/**
 * useFeatureFlags Hooks
 *
 * TanStack Query hooks for feature flag management.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
    featureFlags,
    type CreateFeatureFlagInput,
    type UpdateFeatureFlagInput,
} from '@/lib/api'
import { adminKeys } from './useAdmin'

/**
 * Hook to fetch all feature flags
 */
export function useFeatureFlags() {
    const query = useQuery({
        queryKey: adminKeys.flagsList(),
        queryFn: () => featureFlags.list(),
    })

    return {
        flags: query.data?.flags ?? [],
        isLoading: query.isLoading,
        isError: query.isError,
        error: query.error,
        refetch: query.refetch,
    }
}

/**
 * Hook to fetch a single feature flag
 */
export function useFeatureFlag(flagId: string) {
    const query = useQuery({
        queryKey: adminKeys.flagDetail(flagId),
        queryFn: () => featureFlags.get(flagId),
        enabled: Boolean(flagId),
    })

    return {
        flag: query.data?.flag,
        isLoading: query.isLoading,
        isError: query.isError,
        error: query.error,
        refetch: query.refetch,
    }
}

/**
 * Hook for creating a feature flag
 */
export function useCreateFeatureFlag() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (data: CreateFeatureFlagInput) => featureFlags.create(data),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: adminKeys.flagsList() })
        },
    })
}

/**
 * Hook for updating a feature flag
 */
export function useUpdateFeatureFlag() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ flagId, data }: { flagId: string; data: UpdateFeatureFlagInput }) =>
            featureFlags.update(flagId, data),
        onSuccess: (_data, { flagId }) => {
            void queryClient.invalidateQueries({ queryKey: adminKeys.flagDetail(flagId) })
            void queryClient.invalidateQueries({ queryKey: adminKeys.flagsList() })
        },
    })
}

/**
 * Hook for deleting a feature flag
 */
export function useDeleteFeatureFlag() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (flagId: string) => featureFlags.delete(flagId),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: adminKeys.flagsList() })
        },
    })
}

/**
 * Hook for toggling a feature flag
 */
export function useToggleFeatureFlag() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ flagId, enabled }: { flagId: string; enabled: boolean }) =>
            featureFlags.toggle(flagId, enabled),
        onSuccess: (_data, { flagId }) => {
            void queryClient.invalidateQueries({ queryKey: adminKeys.flagDetail(flagId) })
            void queryClient.invalidateQueries({ queryKey: adminKeys.flagsList() })
        },
    })
}

/**
 * Hook for all feature flag actions
 */
export function useFeatureFlagActions() {
    return {
        createFlag: useCreateFeatureFlag(),
        updateFlag: useUpdateFeatureFlag(),
        deleteFlag: useDeleteFeatureFlag(),
        toggleFlag: useToggleFeatureFlag(),
    }
}
