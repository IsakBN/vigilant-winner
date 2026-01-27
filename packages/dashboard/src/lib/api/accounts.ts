/**
 * Accounts API for BundleNudge Dashboard
 *
 * Provides typed API methods for account-level operations and dashboard overview.
 */

import { apiClient } from './client'

// =============================================================================
// Types
// =============================================================================

export type PlanType = 'free' | 'pro' | 'team' | 'enterprise'

/**
 * Usage statistics for the account
 */
export interface AccountUsage {
    appsUsed: number
    appsLimit: number
    updatesThisMonth: number
    updatesLimit: number
    bandwidthUsedMB: number
    bandwidthLimitMB: number
}

/**
 * Billing information for the account
 */
export interface AccountBilling {
    plan: PlanType
    nextBillingDate: number | null
}

/**
 * Aggregate statistics for the account
 */
export interface AccountStats {
    totalApps: number
    totalDevices: number
    totalReleases: number
}

/**
 * Complete dashboard overview data
 */
export interface AccountDashboardOverview {
    usage: AccountUsage
    billing: AccountBilling
    stats: AccountStats
}

/**
 * API response for dashboard overview
 */
export interface GetDashboardOverviewResponse {
    overview: AccountDashboardOverview
}

// =============================================================================
// API Methods
// =============================================================================

export const accounts = {
    /**
     * Get dashboard overview for an account
     *
     * Returns aggregated usage, billing, and statistics for the account.
     */
    getDashboardOverview(accountId: string): Promise<GetDashboardOverviewResponse> {
        return apiClient.get(`/accounts/${accountId}/dashboard/overview`)
    },
}
