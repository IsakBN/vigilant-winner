/**
 * Releases API for BundleNudge Dashboard
 *
 * Provides typed API methods for release management.
 */

import { apiClient, buildQueryString } from './client'
import type { BaseEntity } from './types'

// =============================================================================
// Types
// =============================================================================

export type ReleaseStatus = 'draft' | 'active' | 'disabled' | 'rolling' | 'complete' | 'paused' | 'failed'

export interface Release extends BaseEntity {
    appId: string
    version: string
    description: string | null
    channel: string
    status: ReleaseStatus
    rolloutPercentage: number
    bundleUrl: string | null
    bundleSize: number | null
    minAppVersion: string | null
    maxAppVersion: string | null
    targetPlatform: string | null
    allowlist: string[] | null
    blocklist: string[] | null
}

export interface ReleaseStats {
    downloads: number
    activeDevices: number
    errors: number
    adoptionRate: number
}

export interface ReleaseWithStats extends Release {
    stats: ReleaseStats
}

export interface CreateReleaseInput {
    version: string
    description?: string
    channel?: string
    bundleFile?: File
    minAppVersion?: string
    maxAppVersion?: string
    rolloutPercentage?: number
}

export interface UpdateReleaseInput {
    description?: string
    channel?: string
    status?: ReleaseStatus
    rolloutPercentage?: number
    allowlist?: string[]
    blocklist?: string[]
}

export interface ListReleasesParams {
    status?: ReleaseStatus
    channel?: string
    search?: string
    page?: number
    pageSize?: number
    sortBy?: 'version' | 'createdAt' | 'rolloutPercentage'
    sortOrder?: 'asc' | 'desc'
}

export interface ListReleasesResponse {
    releases: Release[]
    pagination: {
        page: number
        pageSize: number
        total: number
        totalPages: number
    }
}

export interface GetReleaseResponse {
    release: ReleaseWithStats
}

export interface CreateReleaseResponse {
    release: Release
}

export interface UpdateReleaseResponse {
    release: Release
}

export interface Channel {
    id: string
    name: string
    description: string | null
    isDefault: boolean
}

export interface ListChannelsResponse {
    channels: Channel[]
}

// =============================================================================
// API Methods
// =============================================================================

export const releases = {
    /**
     * List releases for an app with optional filters
     */
    list(appId: string, params?: ListReleasesParams): Promise<ListReleasesResponse> {
        const query = buildQueryString(params as Record<string, string | number | boolean | undefined> ?? {})
        return apiClient.get(`/apps/${appId}/releases${query}`)
    },

    /**
     * Get a single release with stats
     */
    get(appId: string, releaseId: string): Promise<GetReleaseResponse> {
        return apiClient.get(`/apps/${appId}/releases/${releaseId}`)
    },

    /**
     * Create a new release
     */
    create(appId: string, data: CreateReleaseInput): Promise<CreateReleaseResponse> {
        return apiClient.post(`/apps/${appId}/releases`, data)
    },

    /**
     * Update a release
     */
    update(appId: string, releaseId: string, data: UpdateReleaseInput): Promise<UpdateReleaseResponse> {
        return apiClient.patch(`/apps/${appId}/releases/${releaseId}`, data)
    },

    /**
     * Delete a release
     */
    delete(appId: string, releaseId: string): Promise<void> {
        return apiClient.delete(`/apps/${appId}/releases/${releaseId}`)
    },

    /**
     * List available channels for an app
     */
    listChannels(appId: string): Promise<ListChannelsResponse> {
        return apiClient.get(`/apps/${appId}/channels`)
    },

    /**
     * Upload bundle file for a release
     */
    async uploadBundle(appId: string, releaseId: string, file: File): Promise<{ bundleUrl: string }> {
        const formData = new FormData()
        formData.append('bundle', file)

        const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/apps/${appId}/releases/${releaseId}/bundle`,
            {
                method: 'POST',
                body: formData,
                credentials: 'include',
            }
        )

        if (!response.ok) {
            throw new Error('Failed to upload bundle')
        }

        return response.json() as Promise<Release>
    },
}
