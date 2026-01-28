/**
 * Admin Users API
 *
 * Provides methods for managing users as an admin.
 */

import { apiClient, buildQueryString } from './client'
import type {
    ListUsersParams,
    ListUsersResponse,
    GetUserResponse,
    UserActionResponse,
} from './types'

/**
 * Admin Users API methods
 */
export const adminUsers = {
    /**
     * List all users with pagination and filtering
     */
    list(params: ListUsersParams = {}): Promise<ListUsersResponse> {
        const query = buildQueryString({
            search: params.search,
            status: params.status,
            page: params.page,
            limit: params.limit,
            sortBy: params.sortBy,
            sortOrder: params.sortOrder,
        })
        return apiClient.get(`/admin/users${query}`)
    },

    /**
     * Get a single user by ID with full details
     */
    get(userId: string): Promise<GetUserResponse> {
        return apiClient.get(`/admin/users/${userId}`)
    },

    /**
     * Suspend a user account
     */
    suspend(userId: string, reason?: string): Promise<UserActionResponse> {
        return apiClient.post(`/admin/users/${userId}/suspend`, { reason })
    },

    /**
     * Unsuspend a user account
     */
    unsuspend(userId: string): Promise<UserActionResponse> {
        return apiClient.post(`/admin/users/${userId}/unsuspend`)
    },

    /**
     * Ban a user account permanently
     */
    ban(userId: string, reason: string): Promise<UserActionResponse> {
        return apiClient.post(`/admin/users/${userId}/ban`, { reason })
    },

    /**
     * Unban a user account
     */
    unban(userId: string): Promise<UserActionResponse> {
        return apiClient.post(`/admin/users/${userId}/unban`)
    },

    /**
     * Verify a user's email manually
     */
    verifyEmail(userId: string): Promise<UserActionResponse> {
        return apiClient.post(`/admin/users/${userId}/verify-email`)
    },

    /**
     * Send password reset email to user
     */
    sendPasswordReset(userId: string): Promise<UserActionResponse> {
        return apiClient.post(`/admin/users/${userId}/reset-password`)
    },

    /**
     * Revoke all sessions for a user
     */
    revokeAllSessions(userId: string): Promise<UserActionResponse> {
        return apiClient.post(`/admin/users/${userId}/revoke-sessions`)
    },

    /**
     * Delete a user account (soft delete)
     */
    delete(userId: string): Promise<UserActionResponse> {
        return apiClient.delete(`/admin/users/${userId}`)
    },
}
