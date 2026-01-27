/**
 * Crash Integrations API for BundleNudge Dashboard
 *
 * Provides typed API methods for crash reporting integration management.
 */

import { apiClient } from './client'
import type { BaseEntity, SuccessResponse } from './types'

// =============================================================================
// Types
// =============================================================================

export type CrashProvider = 'sentry' | 'bugsnag' | 'crashlytics'

export interface SentryConfig {
    dsn: string
    organization: string
    project: string
    authToken?: string
}

export interface BugsnagConfig {
    apiKey: string
    projectId?: string
}

export interface CrashlyticsConfig {
    projectId: string
    serviceAccountJson?: string
}

export type CrashIntegrationConfig =
    | SentryConfig
    | BugsnagConfig
    | CrashlyticsConfig

export interface CrashIntegration extends BaseEntity {
    accountId: string
    appId: string
    provider: CrashProvider
    config: Partial<CrashIntegrationConfig>
    enabled: boolean
}

export interface CreateCrashIntegrationInput {
    provider: CrashProvider
    config: CrashIntegrationConfig
    enabled?: boolean
}

export interface UpdateCrashIntegrationInput {
    config?: Partial<CrashIntegrationConfig>
    enabled?: boolean
}

export interface ListCrashIntegrationsResponse {
    integrations: CrashIntegration[]
}

export interface GetCrashIntegrationResponse {
    integration: CrashIntegration
}

export interface CreateCrashIntegrationResponse {
    integration: CrashIntegration
}

export interface UpdateCrashIntegrationResponse {
    integration: CrashIntegration
}

export interface TestCrashIntegrationResponse {
    success: boolean
    error?: string
}

// =============================================================================
// Constants
// =============================================================================

export const CRASH_PROVIDERS: {
    value: CrashProvider
    label: string
    description: string
}[] = [
    {
        value: 'sentry',
        label: 'Sentry',
        description: 'Error tracking and performance monitoring',
    },
    {
        value: 'bugsnag',
        label: 'Bugsnag',
        description: 'Application stability management',
    },
    {
        value: 'crashlytics',
        label: 'Firebase Crashlytics',
        description: "Google's crash reporting solution",
    },
]

// =============================================================================
// API Methods
// =============================================================================

export const crashIntegrations = {
    /**
     * List all crash integrations for an app
     */
    list(
        accountId: string,
        appId: string
    ): Promise<ListCrashIntegrationsResponse> {
        return apiClient.get(
            `/accounts/${accountId}/apps/${appId}/crash-integrations`
        )
    },

    /**
     * Get a single crash integration
     */
    get(
        accountId: string,
        appId: string,
        integrationId: string
    ): Promise<GetCrashIntegrationResponse> {
        return apiClient.get(
            `/accounts/${accountId}/apps/${appId}/crash-integrations/${integrationId}`
        )
    },

    /**
     * Create a new crash integration
     */
    create(
        accountId: string,
        appId: string,
        data: CreateCrashIntegrationInput
    ): Promise<CreateCrashIntegrationResponse> {
        return apiClient.post(
            `/accounts/${accountId}/apps/${appId}/crash-integrations`,
            data
        )
    },

    /**
     * Update a crash integration
     */
    update(
        accountId: string,
        appId: string,
        integrationId: string,
        data: UpdateCrashIntegrationInput
    ): Promise<UpdateCrashIntegrationResponse> {
        return apiClient.patch(
            `/accounts/${accountId}/apps/${appId}/crash-integrations/${integrationId}`,
            data
        )
    },

    /**
     * Delete a crash integration
     */
    delete(
        accountId: string,
        appId: string,
        integrationId: string
    ): Promise<SuccessResponse> {
        return apiClient.delete(
            `/accounts/${accountId}/apps/${appId}/crash-integrations/${integrationId}`
        )
    },

    /**
     * Test a crash integration
     */
    test(
        accountId: string,
        appId: string,
        integrationId: string
    ): Promise<TestCrashIntegrationResponse> {
        return apiClient.post(
            `/accounts/${accountId}/apps/${appId}/crash-integrations/${integrationId}/test`
        )
    },
}
