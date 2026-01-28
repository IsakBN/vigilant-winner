'use client'

/**
 * useChannels Hook
 *
 * TanStack Query hooks for fetching and managing channels.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
    channels,
    type Channel,
    type CreateChannelInput,
    type UpdateChannelInput,
    type ListChannelsParams,
} from '@/lib/api'

// =============================================================================
// Query Keys
// =============================================================================

export const channelsKeys = {
    all: ['channels'] as const,
    list: (accountId: string, appId: string) =>
        [...channelsKeys.all, 'list', accountId, appId] as const,
    detail: (accountId: string, appId: string, channelId: string) =>
        [...channelsKeys.all, 'detail', accountId, appId, channelId] as const,
}

// =============================================================================
// List Channels Hook
// =============================================================================

/**
 * Hook to fetch channels list for an app
 */
export function useChannels(
    accountId: string,
    appId: string,
    params?: ListChannelsParams
) {
    const query = useQuery({
        queryKey: channelsKeys.list(accountId, appId),
        queryFn: () => channels.list(accountId, appId, params),
        enabled: Boolean(accountId) && Boolean(appId),
    })

    return {
        channels: query.data?.data ?? [],
        pagination: query.data?.pagination,
        isLoading: query.isLoading,
        isError: query.isError,
        error: query.error,
        refetch: query.refetch,
    }
}

// =============================================================================
// Single Channel Hook
// =============================================================================

/**
 * Hook to fetch a single channel
 */
export function useChannel(
    accountId: string,
    appId: string,
    channelId: string
) {
    return useQuery({
        queryKey: channelsKeys.detail(accountId, appId, channelId),
        queryFn: async () => {
            const response = await channels.get(accountId, appId, channelId)
            return response.channel
        },
        enabled: Boolean(accountId) && Boolean(appId) && Boolean(channelId),
        staleTime: 30 * 1000,
    })
}

// =============================================================================
// Create Channel Mutation
// =============================================================================

/**
 * Hook to create a new channel
 */
export function useCreateChannel(accountId: string, appId: string) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (data: CreateChannelInput) =>
            channels.create(accountId, appId, data),
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: channelsKeys.list(accountId, appId),
            })
        },
    })
}

// =============================================================================
// Update Channel Mutation
// =============================================================================

/**
 * Hook to update a channel
 */
export function useUpdateChannel(accountId: string, appId: string) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({
            channelId,
            data,
        }: {
            channelId: string
            data: UpdateChannelInput
        }) => channels.update(accountId, appId, channelId, data),
        onSuccess: (_, variables) => {
            void queryClient.invalidateQueries({
                queryKey: channelsKeys.list(accountId, appId),
            })
            void queryClient.invalidateQueries({
                queryKey: channelsKeys.detail(accountId, appId, variables.channelId),
            })
        },
    })
}

// =============================================================================
// Delete Channel Mutation
// =============================================================================

/**
 * Hook to delete a channel
 */
export function useDeleteChannel(accountId: string, appId: string) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (channelId: string) =>
            channels.delete(accountId, appId, channelId),
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: channelsKeys.list(accountId, appId),
            })
        },
    })
}

// =============================================================================
// Re-exports for convenience
// =============================================================================

export type { Channel, CreateChannelInput, UpdateChannelInput, ListChannelsParams }
