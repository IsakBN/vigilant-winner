/**
 * Apps API for BundleNudge App Dashboard
 */

import { apiClient } from './client'
import type {
    CreateAppInput,
    CreateAppResponse,
    ListAppsResponse,
    GetAppResponse,
    GetAppWithStatsResponse,
    UpdateAppInput,
    UpdateAppResponse,
    RegenerateApiKeyResponse,
} from './types'

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
     * Update an app
     */
    update(accountId: string, appId: string, data: UpdateAppInput): Promise<UpdateAppResponse> {
        return apiClient.patch(`/accounts/${accountId}/apps/${appId}`, data)
    },

    /**
     * Delete an app
     */
    delete(accountId: string, appId: string): Promise<void> {
        return apiClient.delete(`/accounts/${accountId}/apps/${appId}`)
    },

    /**
     * Regenerate API key for an app
     */
    regenerateApiKey(accountId: string, appId: string): Promise<RegenerateApiKeyResponse> {
        return apiClient.post(`/accounts/${accountId}/apps/${appId}/api-key`)
    },
}
