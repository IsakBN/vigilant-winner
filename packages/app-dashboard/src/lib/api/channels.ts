/**
 * Channels API for BundleNudge App Dashboard
 *
 * Provides typed API methods for channel management.
 * Channels are named release tracks (production, staging, beta) for different audiences.
 */

import { apiClient } from './client'
import type {
    ListChannelsParams,
    ListChannelsResponse,
    GetChannelResponse,
    CreateChannelInput,
    CreateChannelResponse,
    UpdateChannelInput,
    UpdateChannelResponse,
} from './types'

/**
 * Build query string from params object
 */
function buildQueryString(
    params: Record<string, string | number | boolean | undefined>
): string {
    const entries = Object.entries(params).filter(
        ([, value]) => value !== undefined
    )
    if (entries.length === 0) return ''
    const searchParams = new URLSearchParams()
    entries.forEach(([key, value]) => {
        searchParams.append(key, String(value))
    })
    return `?${searchParams.toString()}`
}

export const channels = {
    /**
     * List all channels for an app
     */
    list(
        accountId: string,
        appId: string,
        params?: ListChannelsParams
    ): Promise<ListChannelsResponse> {
        const query = buildQueryString({
            limit: params?.limit,
            offset: params?.offset,
        })
        return apiClient.get(`/accounts/${accountId}/apps/${appId}/channels${query}`)
    },

    /**
     * Get a single channel by ID
     */
    get(
        accountId: string,
        appId: string,
        channelId: string
    ): Promise<GetChannelResponse> {
        return apiClient.get(
            `/accounts/${accountId}/apps/${appId}/channels/${channelId}`
        )
    },

    /**
     * Create a new channel
     */
    create(
        accountId: string,
        appId: string,
        data: CreateChannelInput
    ): Promise<CreateChannelResponse> {
        return apiClient.post(`/accounts/${accountId}/apps/${appId}/channels`, data)
    },

    /**
     * Update a channel
     */
    update(
        accountId: string,
        appId: string,
        channelId: string,
        data: UpdateChannelInput
    ): Promise<UpdateChannelResponse> {
        return apiClient.patch(
            `/accounts/${accountId}/apps/${appId}/channels/${channelId}`,
            data
        )
    },

    /**
     * Delete a channel
     */
    delete(accountId: string, appId: string, channelId: string): Promise<void> {
        return apiClient.delete(
            `/accounts/${accountId}/apps/${appId}/channels/${channelId}`
        )
    },
}
