/**
 * Integrations API for BundleNudge App Dashboard
 *
 * Provides typed API methods for third-party integrations.
 */

import { apiClient } from './client'

// =============================================================================
// Types
// =============================================================================

export interface GitHubStatus {
    connected: boolean
    username: string | null
    avatarUrl: string | null
    connectedAt: number | null
}

export interface GitHubRepository {
    id: number
    name: string
    fullName: string
    owner: string
    description: string | null
    private: boolean
    defaultBranch: string
    language: string | null
    url: string
}

export interface ListGitHubReposResponse {
    repos: GitHubRepository[]
}

export interface SlackStatus {
    connected: boolean
    workspaceName: string | null
    channelName: string | null
    connectedAt: number | null
}

export interface DiscordStatus {
    connected: boolean
    serverName: string | null
    channelName: string | null
    connectedAt: number | null
}

export type CrashProvider = 'sentry' | 'bugsnag' | 'crashlytics'

export interface CrashIntegrationStatus {
    provider: CrashProvider
    connected: boolean
    projectName: string | null
    connectedAt: number | null
}

export interface IntegrationsStatus {
    github: GitHubStatus
    slack: SlackStatus
    discord: DiscordStatus
    crashIntegrations: CrashIntegrationStatus[]
}

// =============================================================================
// API Methods
// =============================================================================

export const integrations = {
    /**
     * Get GitHub connection status for current user
     */
    getGitHubStatus(): Promise<GitHubStatus> {
        return apiClient.get('/auth/github/status')
    },

    /**
     * Disconnect GitHub account from current user
     */
    disconnectGitHub(): Promise<{ success: boolean }> {
        return apiClient.delete('/auth/github')
    },

    /**
     * List GitHub repositories for the connected user
     */
    listGitHubRepos(): Promise<ListGitHubReposResponse> {
        return apiClient.get('/github/repos')
    },

    /**
     * Get Slack connection status for an account
     */
    getSlackStatus(accountId: string): Promise<SlackStatus> {
        return apiClient.get(`/accounts/${accountId}/integrations/slack/status`)
    },

    /**
     * Disconnect Slack from an account
     */
    disconnectSlack(accountId: string): Promise<{ success: boolean }> {
        return apiClient.delete(`/accounts/${accountId}/integrations/slack`)
    },

    /**
     * Get Discord connection status for an account
     */
    getDiscordStatus(accountId: string): Promise<DiscordStatus> {
        return apiClient.get(`/accounts/${accountId}/integrations/discord/status`)
    },

    /**
     * Disconnect Discord from an account
     */
    disconnectDiscord(accountId: string): Promise<{ success: boolean }> {
        return apiClient.delete(`/accounts/${accountId}/integrations/discord`)
    },
}
