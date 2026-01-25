/**
 * Apps API for BundleNudge Dashboard
 *
 * Provides typed API methods for app management.
 */

import { apiClient } from './client'
import type { BaseEntity } from './types'

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
}
