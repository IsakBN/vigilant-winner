/**
 * Builds API for BundleNudge App Dashboard
 *
 * Provides typed API methods for build management.
 */

import { apiClient, API_URL } from './client'

// =============================================================================
// Types
// =============================================================================

export type BuildStatus =
    | 'queued'
    | 'processing'
    | 'completed'
    | 'failed'
    | 'cancelled'

export type BuildPlatform = 'ios' | 'android'

export interface BuildArtifact {
    id: string
    name: string
    type: 'bundle' | 'sourcemap' | 'manifest' | 'log'
    url: string
    size: number
}

export interface Build {
    id: string
    appId: string
    version: string
    platform: BuildPlatform
    status: BuildStatus
    bundleUrl: string | null
    bundleSize: number | null
    sourceCommit: string | null
    sourceBranch: string | null
    startedAt: number | null
    completedAt: number | null
    errorMessage: string | null
    artifacts: BuildArtifact[]
    createdAt: number
    updatedAt?: number
}

export interface BuildLog {
    timestamp: number
    level: 'info' | 'warn' | 'error' | 'debug'
    message: string
}

export interface ListBuildsParams {
    platform?: BuildPlatform
    status?: BuildStatus
    search?: string
    page?: number
    pageSize?: number
    sortBy?: 'createdAt' | 'version' | 'status'
    sortOrder?: 'asc' | 'desc'
}

export interface ListBuildsResponse {
    builds: Build[]
    pagination: {
        page: number
        pageSize: number
        total: number
        totalPages: number
    }
}

export interface GetBuildResponse {
    build: Build
}

export interface GetBuildLogsResponse {
    logs: BuildLog[]
    hasMore: boolean
    nextCursor: string | null
}

export interface TriggerBuildInput {
    version: string
    platform: BuildPlatform
    sourceBranch?: string
    sourceCommit?: string
}

export interface TriggerBuildResponse {
    build: Build
}

// =============================================================================
// Helpers
// =============================================================================

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

// =============================================================================
// API Methods
// =============================================================================

export const builds = {
    /**
     * List builds for an app with optional filters
     */
    list(
        accountId: string,
        appId: string,
        params?: ListBuildsParams
    ): Promise<ListBuildsResponse> {
        const query = buildQueryString(
            (params as Record<string, string | number | boolean | undefined>) ?? {}
        )
        return apiClient.get(`/accounts/${accountId}/apps/${appId}/builds${query}`)
    },

    /**
     * Get a single build with details
     */
    get(
        accountId: string,
        appId: string,
        buildId: string
    ): Promise<GetBuildResponse> {
        return apiClient.get(
            `/accounts/${accountId}/apps/${appId}/builds/${buildId}`
        )
    },

    /**
     * Get build logs
     */
    getLogs(
        accountId: string,
        appId: string,
        buildId: string,
        cursor?: string
    ): Promise<GetBuildLogsResponse> {
        const query = cursor ? `?cursor=${cursor}` : ''
        return apiClient.get(
            `/accounts/${accountId}/apps/${appId}/builds/${buildId}/logs${query}`
        )
    },

    /**
     * Trigger a new build
     */
    trigger(
        accountId: string,
        appId: string,
        data: TriggerBuildInput
    ): Promise<TriggerBuildResponse> {
        return apiClient.post(`/accounts/${accountId}/apps/${appId}/builds`, data)
    },

    /**
     * Cancel a build
     */
    cancel(
        accountId: string,
        appId: string,
        buildId: string
    ): Promise<void> {
        return apiClient.post(
            `/accounts/${accountId}/apps/${appId}/builds/${buildId}/cancel`,
            {}
        )
    },

    /**
     * Retry a failed build
     */
    retry(
        accountId: string,
        appId: string,
        buildId: string
    ): Promise<TriggerBuildResponse> {
        return apiClient.post(
            `/accounts/${accountId}/apps/${appId}/builds/${buildId}/retry`,
            {}
        )
    },

    /**
     * Get artifact download URL
     */
    getArtifactUrl(
        accountId: string,
        appId: string,
        buildId: string,
        artifactId: string
    ): string {
        return `${API_URL}/accounts/${accountId}/apps/${appId}/builds/${buildId}/artifacts/${artifactId}`
    },
}
