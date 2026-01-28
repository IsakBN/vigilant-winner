/**
 * Feature Flags API
 *
 * Provides methods for managing feature flags.
 */

import { apiClient } from './client'
import type {
    ListFeatureFlagsResponse,
    GetFeatureFlagResponse,
    CreateFeatureFlagInput,
    CreateFeatureFlagResponse,
    UpdateFeatureFlagInput,
} from './types'

/**
 * Feature Flags API methods
 */
export const featureFlags = {
    /**
     * List all feature flags
     */
    list(): Promise<ListFeatureFlagsResponse> {
        return apiClient.get('/admin/feature-flags')
    },

    /**
     * Get a single feature flag
     */
    get(flagId: string): Promise<GetFeatureFlagResponse> {
        return apiClient.get(`/admin/feature-flags/${flagId}`)
    },

    /**
     * Create a new feature flag
     */
    create(data: CreateFeatureFlagInput): Promise<CreateFeatureFlagResponse> {
        return apiClient.post('/admin/feature-flags', data)
    },

    /**
     * Update a feature flag
     */
    update(flagId: string, data: UpdateFeatureFlagInput): Promise<void> {
        return apiClient.patch(`/admin/feature-flags/${flagId}`, data)
    },

    /**
     * Delete a feature flag
     */
    delete(flagId: string): Promise<void> {
        return apiClient.delete(`/admin/feature-flags/${flagId}`)
    },

    /**
     * Toggle a feature flag on/off
     */
    toggle(flagId: string, enabled: boolean): Promise<void> {
        return apiClient.patch(`/admin/feature-flags/${flagId}`, { enabled })
    },
}
