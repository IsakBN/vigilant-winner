/**
 * Channels API for BundleNudge Dashboard
 *
 * Provides typed API methods for channel management.
 * Channels are named release tracks (production, staging, beta) for different audiences.
 */

import { apiClient, buildQueryString } from './client'

// =============================================================================
// Types
// =============================================================================

export interface ChannelTargetingRule {
  field: string
  op: string
  value: string | number | string[]
}

export interface ChannelTargetingRules {
  match: 'all' | 'any'
  rules: ChannelTargetingRule[]
}

export interface Channel {
  id: string
  appId: string
  name: string
  displayName: string
  description: string | null
  isDefault: boolean
  rolloutPercentage: number
  targetingRules: ChannelTargetingRules | null
  activeReleaseId: string | null
  createdAt: number
  updatedAt: number
}

export interface CreateChannelInput {
  name: string
  displayName: string
  description?: string
  rolloutPercentage?: number
  targetingRules?: ChannelTargetingRules
}

export interface UpdateChannelInput {
  name?: string
  displayName?: string
  description?: string | null
  isDefault?: boolean
  rolloutPercentage?: number
  targetingRules?: ChannelTargetingRules | null
  activeReleaseId?: string | null
}

export interface ListChannelsResponse {
  data: Channel[]
  pagination: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
}

export interface GetChannelResponse {
  channel: Channel
}

export interface CreateChannelResponse {
  channel: Channel
}

export interface UpdateChannelResponse {
  channel: Channel
}

export interface ListChannelsParams {
  limit?: number
  offset?: number
}

// =============================================================================
// API Methods
// =============================================================================

export const channels = {
  /**
   * List all channels for an app
   */
  list(appId: string, params?: ListChannelsParams): Promise<ListChannelsResponse> {
    const query = buildQueryString({
      limit: params?.limit,
      offset: params?.offset,
    })
    return apiClient.get(`/v1/apps/${appId}/channels${query}`)
  },

  /**
   * Get a single channel by ID
   */
  get(appId: string, channelId: string): Promise<GetChannelResponse> {
    return apiClient.get(`/v1/apps/${appId}/channels/${channelId}`)
  },

  /**
   * Create a new channel
   */
  create(appId: string, data: CreateChannelInput): Promise<CreateChannelResponse> {
    return apiClient.post(`/v1/apps/${appId}/channels`, data)
  },

  /**
   * Update a channel
   */
  update(appId: string, channelId: string, data: UpdateChannelInput): Promise<UpdateChannelResponse> {
    return apiClient.patch(`/v1/apps/${appId}/channels/${channelId}`, data)
  },

  /**
   * Delete a channel
   */
  delete(appId: string, channelId: string): Promise<void> {
    return apiClient.delete(`/v1/apps/${appId}/channels/${channelId}`)
  },
}
