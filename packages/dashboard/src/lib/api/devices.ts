/**
 * Devices API for BundleNudge Dashboard
 *
 * Provides typed API methods for device management.
 * Devices are registered mobile devices that receive OTA updates.
 */

import { apiClient, buildQueryString } from './client'

// =============================================================================
// Types
// =============================================================================

export type DevicePlatform = 'ios' | 'android'

export interface Device {
  id: string
  deviceId: string
  appId: string
  platform: DevicePlatform
  osVersion: string | null
  deviceModel: string | null
  appVersion: string | null
  currentBundleVersion: string | null
  timezone: string | null
  locale: string | null
  lastSeenAt: number | null
  revokedAt: number | null
  createdAt: number
}

export interface DeviceWithRelease extends Device {
  currentRelease?: {
    id: string
    version: string
    channelId: string
    channelName: string
  } | null
}

export interface DeviceUpdateEvent {
  id: string
  deviceId: string
  releaseId: string
  releaseVersion: string
  status: 'checking' | 'downloading' | 'installing' | 'installed' | 'failed'
  errorMessage: string | null
  createdAt: number
}

export interface ListDevicesParams {
  limit?: number
  offset?: number
  platform?: DevicePlatform
  search?: string
}

export interface ListDevicesResponse {
  data: Device[]
  pagination: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
}

export interface GetDeviceResponse {
  device: DeviceWithRelease
  updateHistory: DeviceUpdateEvent[]
}

export interface RevokeDeviceResponse {
  success: boolean
  revokedAt: number
}

// =============================================================================
// API Methods
// =============================================================================

export const devices = {
  /**
   * List all devices for an app
   */
  list(appId: string, params?: ListDevicesParams): Promise<ListDevicesResponse> {
    const query = buildQueryString({
      appId,
      limit: params?.limit,
      offset: params?.offset,
      platform: params?.platform,
      search: params?.search,
    })
    return apiClient.get(`/v1/devices${query}`)
  },

  /**
   * Get a single device by ID
   */
  get(appId: string, deviceId: string): Promise<GetDeviceResponse> {
    return apiClient.get(`/v1/apps/${appId}/devices/${deviceId}`)
  },

  /**
   * Revoke a device's access token
   */
  revoke(appId: string, deviceId: string): Promise<RevokeDeviceResponse> {
    return apiClient.post('/v1/devices/revoke', { appId, deviceId })
  },
}
