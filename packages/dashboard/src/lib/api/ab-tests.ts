/**
 * A/B Tests API for BundleNudge Dashboard
 *
 * Provides typed API methods for A/B test management, rollout control,
 * and version distribution analytics.
 */

import { apiClient, buildQueryString } from './client'
import type {
    ABTestResults,
    RolloutProgress,
    VersionDistribution,
    ABTestListResponse,
    CreateABTestRequest,
    CreateABTestResponse,
} from './types/ab-tests'

// =============================================================================
// API Methods
// =============================================================================

export const abTests = {
    /**
     * Get A/B test results for a release
     *
     * @param releaseId - Release ID to get test results for
     * @returns A/B test results with variants and metrics
     */
    getResults(releaseId: string): Promise<ABTestResults> {
        return apiClient.get(`/releases/${releaseId}/ab-test`)
    },

    /**
     * Get rollout progress for a release
     *
     * @param releaseId - Release ID to get rollout progress for
     * @returns Rollout progress with adoption stats
     */
    getRolloutProgress(releaseId: string): Promise<RolloutProgress> {
        return apiClient.get(`/releases/${releaseId}/rollout`)
    },

    /**
     * Update rollout percentage for a release
     *
     * @param releaseId - Release ID to update rollout for
     * @param percentage - New rollout percentage (0-100)
     */
    updateRollout(releaseId: string, percentage: number): Promise<void> {
        return apiClient.patch(`/releases/${releaseId}/rollout`, { percentage })
    },

    /**
     * Declare a winner for an A/B test
     *
     * @param releaseId - Release ID for the A/B test
     * @param variantId - Variant ID to declare as winner
     */
    declareWinner(releaseId: string, variantId: string): Promise<void> {
        return apiClient.post(`/releases/${releaseId}/ab-test/winner`, { variantId })
    },

    /**
     * Rollback a release with reason
     *
     * @param releaseId - Release ID to rollback
     * @param reason - Reason for rollback
     */
    rollback(releaseId: string, reason: string): Promise<void> {
        return apiClient.post(`/releases/${releaseId}/rollback`, { reason })
    },

    /**
     * Create a new A/B test for an app
     *
     * @param appId - App ID to create A/B test for
     * @param data - A/B test configuration
     * @returns Created A/B test info
     */
    createAbTest(appId: string, data: CreateABTestRequest): Promise<CreateABTestResponse> {
        return apiClient.post(`/apps/${appId}/ab-tests`, data)
    },

    /**
     * Get version distribution for an app
     *
     * @param appId - App ID to get version distribution for
     * @returns Array of version distributions
     */
    getVersionDistribution(appId: string): Promise<VersionDistribution[]> {
        return apiClient.get(`/apps/${appId}/versions`)
    },

    /**
     * List A/B tests for an app with optional pagination
     *
     * @param appId - App ID to list A/B tests for
     * @param params - Optional pagination parameters
     * @returns Paginated list of A/B tests
     */
    listAbTests(
        appId: string,
        params?: { page?: number; limit?: number }
    ): Promise<ABTestListResponse> {
        const query = buildQueryString(params ?? {})
        return apiClient.get(`/apps/${appId}/ab-tests${query}`)
    },
}
