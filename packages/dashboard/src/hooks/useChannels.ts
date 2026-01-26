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
  list: (appId: string) => [...channelsKeys.all, 'list', appId] as const,
  detail: (appId: string, channelId: string) =>
    [...channelsKeys.all, 'detail', appId, channelId] as const,
}

// =============================================================================
// Hooks
// =============================================================================

/**
 * Hook to fetch channels list for an app
 */
export function useChannels(appId: string, params?: ListChannelsParams) {
  const query = useQuery({
    queryKey: channelsKeys.list(appId),
    queryFn: () => channels.list(appId, params),
    enabled: Boolean(appId),
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

/**
 * Hook to fetch a single channel
 */
export function useChannel(appId: string, channelId: string) {
  return useQuery({
    queryKey: channelsKeys.detail(appId, channelId),
    queryFn: async () => {
      const response = await channels.get(appId, channelId)
      return response.channel
    },
    enabled: Boolean(appId) && Boolean(channelId),
    staleTime: 30 * 1000,
  })
}

/**
 * Hook to create a new channel
 */
export function useCreateChannel(appId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateChannelInput) => channels.create(appId, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: channelsKeys.list(appId) })
    },
  })
}

/**
 * Hook to update a channel
 */
export function useUpdateChannel(appId: string, channelId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: UpdateChannelInput) => channels.update(appId, channelId, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: channelsKeys.list(appId) })
      void queryClient.invalidateQueries({
        queryKey: channelsKeys.detail(appId, channelId),
      })
    },
  })
}

/**
 * Hook to delete a channel
 */
export function useDeleteChannel(appId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (channelId: string) => channels.delete(appId, channelId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: channelsKeys.list(appId) })
    },
  })
}

// =============================================================================
// Utility Types
// =============================================================================

export type { Channel, CreateChannelInput, UpdateChannelInput }
