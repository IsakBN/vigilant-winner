/**
 * Devices API for BundleNudge App Dashboard
 *
 * Provides typed API methods for device management.
 */

import { apiClient } from './client'
import type {
    ListDevicesParams,
    ListDevicesResponse,
    GetDeviceResponse,
    RevokeDeviceResponse,
} from './types'

/**
 * Build query string from params
 */
function buildQueryString(params: Record<string, unknown>): string {
    const entries = Object.entries(params)
        .filter(([, value]) => value !== undefined && value !== null)
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)

    return entries.length > 0 ? `?${entries.join('&')}` : ''
}

export const devices = {
    /**
     * List all devices for an app
     */
    list(
        accountId: string,
        appId: string,
        params?: ListDevicesParams
    ): Promise<ListDevicesResponse> {
        const query = buildQueryString({
            limit: params?.limit,
            offset: params?.offset,
            platform: params?.platform,
            search: params?.search,
        })
        return apiClient.get(`/accounts/${accountId}/apps/${appId}/devices${query}`)
    },

    /**
     * Get a single device by ID
     */
    get(
        accountId: string,
        appId: string,
        deviceId: string
    ): Promise<GetDeviceResponse> {
        return apiClient.get(`/accounts/${accountId}/apps/${appId}/devices/${deviceId}`)
    },

    /**
     * Revoke a device's access
     */
    revoke(
        accountId: string,
        appId: string,
        deviceId: string
    ): Promise<RevokeDeviceResponse> {
        return apiClient.post(`/accounts/${accountId}/apps/${appId}/devices/${deviceId}/revoke`)
    },
}
