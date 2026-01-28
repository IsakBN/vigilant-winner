/**
 * Admin Dashboard API
 *
 * Provides methods for dashboard overview, activity, and alerts.
 */

import { apiClient, buildQueryString } from './client'
import type {
    DashboardOverview,
    ActivityResponse,
    AlertsResponse,
    ActivityParams,
    AlertsParams,
} from './types'

/**
 * Admin Dashboard API methods
 */
export const adminDashboard = {
    /**
     * Fetch dashboard overview metrics
     * Metrics are cached for 5 minutes server-side
     */
    getOverview(): Promise<DashboardOverview> {
        return apiClient.get('/admin/dashboard/overview')
    },

    /**
     * Fetch recent activity feed
     */
    getActivity(params?: ActivityParams): Promise<ActivityResponse> {
        const query = buildQueryString({
            limit: params?.limit,
            offset: params?.offset,
            type: params?.type,
        })
        return apiClient.get(`/admin/dashboard/activity${query}`)
    },

    /**
     * Fetch system alerts
     */
    getAlerts(params?: AlertsParams): Promise<AlertsResponse> {
        const query = buildQueryString({
            limit: params?.limit,
            offset: params?.offset,
            severity: params?.severity,
            resolved: params?.resolved?.toString(),
        })
        return apiClient.get(`/admin/dashboard/alerts${query}`)
    },
}

/**
 * Check if current user is an admin
 * Returns true if user has @bundlenudge.com email
 */
export function checkAdminAccess(email: string | null | undefined): boolean {
    if (!email) return false
    return email.endsWith('@bundlenudge.com')
}
