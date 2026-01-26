/**
 * Builds API for BundleNudge Dashboard
 *
 * Provides typed API methods for build management.
 */

import { apiClient, buildQueryString, API_URL } from './client'
import type { BaseEntity } from './types'

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

export interface Build extends BaseEntity {
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
    logs: string | null
    artifacts: BuildArtifact[]
}

export interface BuildArtifact {
    id: string
    name: string
    type: 'bundle' | 'sourcemap' | 'manifest' | 'log'
    url: string
    size: number
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

export interface UploadProgressEvent {
    loaded: number
    total: number
    percentage: number
}

// =============================================================================
// API Methods
// =============================================================================

export const builds = {
    /**
     * List builds for an app with optional filters
     */
    list(appId: string, params?: ListBuildsParams): Promise<ListBuildsResponse> {
        const query = buildQueryString(
            params as Record<string, string | number | boolean | undefined> ?? {}
        )
        return apiClient.get(`/apps/${appId}/builds${query}`)
    },

    /**
     * Get a single build with details
     */
    get(appId: string, buildId: string): Promise<GetBuildResponse> {
        return apiClient.get(`/apps/${appId}/builds/${buildId}`)
    },

    /**
     * Get build logs
     */
    getLogs(
        appId: string,
        buildId: string,
        cursor?: string
    ): Promise<GetBuildLogsResponse> {
        const query = cursor ? `?cursor=${cursor}` : ''
        return apiClient.get(`/apps/${appId}/builds/${buildId}/logs${query}`)
    },

    /**
     * Trigger a new build
     */
    trigger(appId: string, data: TriggerBuildInput): Promise<TriggerBuildResponse> {
        return apiClient.post(`/apps/${appId}/builds`, data)
    },

    /**
     * Cancel a build
     */
    cancel(appId: string, buildId: string): Promise<void> {
        return apiClient.post(`/apps/${appId}/builds/${buildId}/cancel`, {})
    },

    /**
     * Retry a failed build
     */
    retry(appId: string, buildId: string): Promise<TriggerBuildResponse> {
        return apiClient.post(`/apps/${appId}/builds/${buildId}/retry`, {})
    },

    /**
     * Download a build artifact
     */
    getArtifactUrl(appId: string, buildId: string, artifactId: string): string {
        return `${API_URL}/apps/${appId}/builds/${buildId}/artifacts/${artifactId}`
    },

    /**
     * Upload a bundle file with progress tracking
     */
    async uploadBundle(
        appId: string,
        file: File,
        platform: BuildPlatform,
        version: string,
        onProgress?: (event: UploadProgressEvent) => void
    ): Promise<TriggerBuildResponse> {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest()
            const formData = new FormData()
            formData.append('bundle', file)
            formData.append('platform', platform)
            formData.append('version', version)

            xhr.upload.addEventListener('progress', (event) => {
                if (event.lengthComputable && onProgress) {
                    onProgress({
                        loaded: event.loaded,
                        total: event.total,
                        percentage: Math.round((event.loaded / event.total) * 100),
                    })
                }
            })

            xhr.addEventListener('load', () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    resolve(JSON.parse(xhr.responseText) as TriggerBuildResponse)
                } else {
                    reject(new Error(`Upload failed: ${xhr.statusText}`))
                }
            })

            xhr.addEventListener('error', () => {
                reject(new Error('Upload failed: Network error'))
            })

            xhr.open('POST', `${API_URL}/apps/${appId}/builds/upload`)
            xhr.withCredentials = true
            xhr.send(formData)
        })
    },
}
