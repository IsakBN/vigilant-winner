/**
 * Apps API for BundleNudge Dashboard
 *
 * Provides typed API methods for app management.
 */

import { apiClient } from './client'
import type { BaseEntity, GetAppHealthResponse } from './types'

// =============================================================================
// Types
// =============================================================================

export type Platform = 'ios' | 'android'

export interface App extends BaseEntity {
    name: string
    platform: Platform
    bundleId: string | null
    accountId: string
    teamId: string | null
    iconUrl?: string | null
    activeDevices?: number
    lastReleaseAt?: number | null
    lastReleaseVersion?: string | null
}

export interface CreateAppInput {
    name: string
    platform: Platform
    bundleId?: string
}

export interface CreateAppResponse {
    app: App
}

export interface ListAppsResponse {
    apps: App[]
}

export interface GetAppResponse {
    app: App
}

// =============================================================================
// API Methods
// =============================================================================

// =============================================================================
// GitHub Types
// =============================================================================

export interface GitHubRepo {
    id: number
    full_name: string
    private: boolean
    installation_id: number
}

export interface ListReposResponse {
    repos: GitHubRepo[]
}

export interface ListContentsResponse {
    breadcrumbs: Array<{ name: string; path: string }>
    items: Array<{ name: string; path: string; type: 'dir' | 'file' }>
}

export interface AppStats {
    activeDevices: number
    totalReleases: number
    downloadsThisMonth: number
}

export interface AppWithStats extends App {
    stats: AppStats
}

export interface GetAppWithStatsResponse {
    app: AppWithStats
}

export interface SetupStatus {
    sdkConnected: boolean
    firstPingAt: number | null
}

export interface GetSetupStatusResponse extends SetupStatus {}

// =============================================================================
// API Methods
// =============================================================================

export const apps = {
    /**
     * List all apps for the current account
     */
    list(accountId: string): Promise<ListAppsResponse> {
        return apiClient.get(`/accounts/${accountId}/apps`)
    },

    /**
     * Get a single app by ID
     */
    get(accountId: string, appId: string): Promise<GetAppResponse> {
        return apiClient.get(`/accounts/${accountId}/apps/${appId}`)
    },

    /**
     * Get app with stats
     */
    getWithStats(accountId: string, appId: string): Promise<GetAppWithStatsResponse> {
        return apiClient.get(`/accounts/${accountId}/apps/${appId}?include=stats`)
    },

    /**
     * Create a new app
     */
    create(accountId: string, data: CreateAppInput): Promise<CreateAppResponse> {
        return apiClient.post(`/accounts/${accountId}/apps`, data)
    },

    /**
     * Delete an app
     */
    delete(accountId: string, appId: string): Promise<void> {
        return apiClient.delete(`/accounts/${accountId}/apps/${appId}`)
    },

    /**
     * List GitHub repositories available to the user
     */
    listRepos(): Promise<ListReposResponse> {
        return apiClient.get('/github/repos')
    },

    /**
     * List contents of a directory in a GitHub repository
     */
    listContents(
        installationId: number,
        owner: string,
        repo: string,
        path?: string
    ): Promise<ListContentsResponse> {
        const pathParam = path ? `&path=${encodeURIComponent(path)}` : ''
        return apiClient.get(
            `/github/contents?installationId=${installationId}&owner=${owner}&repo=${repo}${pathParam}`
        )
    },

    /**
     * Get app health metrics, funnel data, and recent issues
     */
    getHealth(accountId: string, appId: string): Promise<GetAppHealthResponse> {
        return apiClient.get(`/accounts/${accountId}/apps/${appId}/health`)
    },

    /**
     * Get SDK setup status for an app
     * Returns whether the SDK has connected and when it first pinged
     */
    getSetupStatus(accountId: string, appId: string): Promise<GetSetupStatusResponse> {
        return apiClient.get(`/accounts/${accountId}/apps/${appId}/setup-status`)
    },
}
