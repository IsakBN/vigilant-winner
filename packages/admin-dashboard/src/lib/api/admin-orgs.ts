/**
 * Admin Organizations API
 *
 * Provides methods for managing organizations as an admin.
 */

import { apiClient, buildQueryString } from './client'
import type {
    ListAdminOrgsParams,
    ListAdminOrgsResponse,
    GetAdminOrgResponse,
    UpdateAdminOrgInput,
} from './types'

/**
 * Admin Organizations API methods
 */
export const adminOrgs = {
    /**
     * List all organizations with filtering
     */
    list(params?: ListAdminOrgsParams): Promise<ListAdminOrgsResponse> {
        const query = buildQueryString({
            search: params?.search,
            plan: params?.plan === 'all' ? undefined : params?.plan,
            limit: params?.limit,
            offset: params?.offset,
        })
        return apiClient.get(`/admin/organizations${query}`)
    },

    /**
     * Get organization details
     */
    get(orgId: string): Promise<GetAdminOrgResponse> {
        return apiClient.get(`/admin/organizations/${orgId}`)
    },

    /**
     * Update organization (plan, active status)
     */
    update(orgId: string, data: UpdateAdminOrgInput): Promise<void> {
        return apiClient.patch(`/admin/organizations/${orgId}`, data)
    },

    /**
     * Suspend an organization
     */
    suspend(orgId: string): Promise<void> {
        return apiClient.post(`/admin/organizations/${orgId}/suspend`)
    },

    /**
     * Reactivate a suspended organization
     */
    reactivate(orgId: string): Promise<void> {
        return apiClient.post(`/admin/organizations/${orgId}/reactivate`)
    },

    /**
     * Delete an organization (admin only)
     */
    delete(orgId: string): Promise<void> {
        return apiClient.delete(`/admin/organizations/${orgId}`)
    },
}
