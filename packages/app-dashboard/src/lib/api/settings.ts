/**
 * Settings API for BundleNudge App Dashboard
 *
 * Provides typed API methods for user settings management.
 */

import { apiClient } from './client'
import type { BaseEntity } from './types'

// =============================================================================
// Types
// =============================================================================

export interface UserProfile extends BaseEntity {
    email: string
    name: string | null
    image: string | null
    emailVerified: boolean
}

export interface UpdateProfileInput {
    name?: string
    image?: string
}

export interface ChangePasswordInput {
    currentPassword: string
    newPassword: string
}

export interface GetProfileResponse {
    profile: UserProfile
}

export interface UpdateProfileResponse {
    profile: UserProfile
}

export interface SuccessResponse {
    success: boolean
}

// =============================================================================
// API Methods
// =============================================================================

export const settings = {
    /**
     * Get current user profile
     */
    getProfile(accountId: string): Promise<GetProfileResponse> {
        return apiClient.get(`/accounts/${accountId}/settings/profile`)
    },

    /**
     * Update user profile
     */
    updateProfile(
        accountId: string,
        data: UpdateProfileInput
    ): Promise<UpdateProfileResponse> {
        return apiClient.patch(`/accounts/${accountId}/settings/profile`, data)
    },

    /**
     * Change password (uses better-auth directly, but kept for API consistency)
     */
    changePassword(
        accountId: string,
        data: ChangePasswordInput
    ): Promise<SuccessResponse> {
        return apiClient.post(
            `/accounts/${accountId}/settings/change-password`,
            data
        )
    },

    /**
     * Upload avatar image
     */
    uploadAvatar(
        accountId: string,
        file: File
    ): Promise<{ url: string }> {
        const formData = new FormData()
        formData.append('avatar', file)

        return apiClient.post(
            `/accounts/${accountId}/settings/avatar`,
            formData,
            {
                headers: { 'Content-Type': 'multipart/form-data' },
            }
        )
    },

    /**
     * Delete account
     */
    deleteAccount(accountId: string): Promise<SuccessResponse> {
        return apiClient.delete(`/accounts/${accountId}`)
    },
}
