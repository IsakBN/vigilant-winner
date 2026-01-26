'use client'

/**
 * useDevices Hook
 *
 * TanStack Query hooks for fetching and managing devices.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  devices,
  type Device,
  type DeviceWithRelease,
  type DeviceUpdateEvent,
  type DevicePlatform,
  type ListDevicesParams,
} from '@/lib/api'

// =============================================================================
// Query Keys
// =============================================================================

export const devicesKeys = {
  all: ['devices'] as const,
  list: (appId: string, params?: ListDevicesParams) =>
    [...devicesKeys.all, 'list', appId, params] as const,
  detail: (appId: string, deviceId: string) =>
    [...devicesKeys.all, 'detail', appId, deviceId] as const,
}

// =============================================================================
// Filter Interface
// =============================================================================

export interface DeviceFilters {
  platform?: DevicePlatform | 'all'
  search?: string
}

// =============================================================================
// List Devices Hook
// =============================================================================

interface UseDevicesOptions {
  enabled?: boolean
  refetchOnWindowFocus?: boolean
}

export function useDevices(
  appId: string,
  params?: ListDevicesParams,
  options?: UseDevicesOptions
) {
  const query = useQuery({
    queryKey: devicesKeys.list(appId, params),
    queryFn: () => devices.list(appId, params),
    enabled: Boolean(appId) && (options?.enabled ?? true),
    refetchOnWindowFocus: options?.refetchOnWindowFocus ?? true,
    staleTime: 30 * 1000,
  })

  return {
    devices: query.data?.data ?? [],
    pagination: query.data?.pagination,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  }
}

// =============================================================================
// Single Device Hook
// =============================================================================

interface UseDeviceOptions {
  enabled?: boolean
  refetchOnWindowFocus?: boolean
  refetchInterval?: number
}

export function useDevice(
  appId: string,
  deviceId: string,
  options?: UseDeviceOptions
) {
  return useQuery({
    queryKey: devicesKeys.detail(appId, deviceId),
    queryFn: () => devices.get(appId, deviceId),
    enabled: Boolean(appId) && Boolean(deviceId) && (options?.enabled ?? true),
    refetchOnWindowFocus: options?.refetchOnWindowFocus ?? true,
    refetchInterval: options?.refetchInterval,
    staleTime: 30 * 1000,
    select: (data) => ({
      device: data.device,
      updateHistory: data.updateHistory,
    }),
  })
}

// =============================================================================
// Revoke Device Mutation
// =============================================================================

export function useRevokeDevice(appId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (deviceId: string) => devices.revoke(appId, deviceId),
    onSuccess: (_, deviceId) => {
      void queryClient.invalidateQueries({
        queryKey: devicesKeys.detail(appId, deviceId),
      })
      void queryClient.invalidateQueries({
        queryKey: devicesKeys.list(appId),
      })
    },
  })
}

// =============================================================================
// Re-exports
// =============================================================================

export type {
  Device,
  DeviceWithRelease,
  DeviceUpdateEvent,
  DevicePlatform,
  ListDevicesParams,
}
