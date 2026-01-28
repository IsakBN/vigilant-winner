/**
 * Releases API for BundleNudge App Dashboard
 *
 * Provides typed API methods for release management.
 */

import { apiClient, API_URL } from './client'
import type {
    ListReleasesParams,
    ListReleasesResponse,
    GetReleaseResponse,
    CreateReleaseInput,
    CreateReleaseResponse,
    UpdateReleaseInput,
    UpdateReleaseResponse,
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

export const releases = {
    /**
     * List releases for an app with optional filters
     */
    list(
        accountId: string,
        appId: string,
        params?: ListReleasesParams
    ): Promise<ListReleasesResponse> {
        const query = buildQueryString(
            (params as Record<string, string | number | boolean | undefined>) ?? {}
        )
        return apiClient.get(`/accounts/${accountId}/apps/${appId}/releases${query}`)
    },

    /**
     * Get a single release with stats
     */
    get(
        accountId: string,
        appId: string,
        releaseId: string
    ): Promise<GetReleaseResponse> {
        return apiClient.get(
            `/accounts/${accountId}/apps/${appId}/releases/${releaseId}`
        )
    },

    /**
     * Create a new release
     */
    create(
        accountId: string,
        appId: string,
        data: CreateReleaseInput
    ): Promise<CreateReleaseResponse> {
        return apiClient.post(`/accounts/${accountId}/apps/${appId}/releases`, data)
    },

    /**
     * Update a release
     */
    update(
        accountId: string,
        appId: string,
        releaseId: string,
        data: UpdateReleaseInput
    ): Promise<UpdateReleaseResponse> {
        return apiClient.patch(
            `/accounts/${accountId}/apps/${appId}/releases/${releaseId}`,
            data
        )
    },

    /**
     * Delete a release
     */
    delete(accountId: string, appId: string, releaseId: string): Promise<void> {
        return apiClient.delete(
            `/accounts/${accountId}/apps/${appId}/releases/${releaseId}`
        )
    },

    /**
     * Upload bundle file for a release
     */
    async uploadBundle(
        accountId: string,
        appId: string,
        releaseId: string,
        file: File
    ): Promise<{ bundleUrl: string }> {
        const formData = new FormData()
        formData.append('bundle', file)

        const response = await fetch(
            `${API_URL}/accounts/${accountId}/apps/${appId}/releases/${releaseId}/bundle`,
            {
                method: 'POST',
                body: formData,
                credentials: 'include',
            }
        )

        if (!response.ok) {
            throw new Error('Failed to upload bundle')
        }

        return response.json() as Promise<{ bundleUrl: string }>
    },

    /**
     * Rollback a release
     */
    rollback(
        accountId: string,
        appId: string,
        releaseId: string
    ): Promise<UpdateReleaseResponse> {
        return apiClient.post(
            `/accounts/${accountId}/apps/${appId}/releases/${releaseId}/rollback`,
            {}
        )
    },
}
