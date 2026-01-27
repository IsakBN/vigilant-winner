/**
 * Auth API for BundleNudge Dashboard
 *
 * Provides typed API methods for authentication-related endpoints.
 * These work alongside the Better-Auth client for backend-specific operations.
 */

import { apiFetch } from './client'

// ============================================================================
// Types
// ============================================================================

export interface User {
    id: string
    email: string
    name: string | null
    image: string | null
    emailVerified: boolean
    createdAt: number
    updatedAt?: number
}

export interface GitHubStatus {
    connected: boolean
    username: string | null
    avatarUrl: string | null
    connectedAt: number | null
}

// ============================================================================
// Auth API
// ============================================================================

export interface LoginResponse {
    user: User
    token?: string
    redirect?: string
}

export interface SignupResponse {
    user: User
    message?: string
    requiresVerification?: boolean
}

export interface VerifyEmailResponse {
    success: boolean
    user?: User
}

export const auth = {
    /**
     * Get current user from backend
     * Uses Better-Auth session cookies for authentication
     */
    async me(): Promise<{ user: User }> {
        return apiFetch('/auth/me')
    },

    /**
     * Login with email and password
     */
    async login(email: string, password: string): Promise<LoginResponse> {
        return apiFetch('/api/auth/sign-in/email', {
            method: 'POST',
            body: { email, password },
        })
    },

    /**
     * Sign up with email and password
     */
    async signup(
        email: string,
        password: string,
        name?: string
    ): Promise<SignupResponse> {
        return apiFetch('/api/auth/sign-up/email', {
            method: 'POST',
            body: { email, password, name },
        })
    },

    /**
     * Verify email with OTP code
     */
    async verifyEmail(email: string, code: string): Promise<VerifyEmailResponse> {
        return apiFetch('/api/auth/verify-email', {
            method: 'POST',
            body: { email, code },
        })
    },

    /**
     * Resend verification email
     */
    async resendVerification(email: string): Promise<{ success: boolean }> {
        return apiFetch('/api/auth/resend-verification', {
            method: 'POST',
            body: { email },
        })
    },

    /**
     * Request password reset
     */
    async forgotPassword(email: string): Promise<{ success: boolean }> {
        return apiFetch('/api/auth/forgot-password', {
            method: 'POST',
            body: { email },
        })
    },

    /**
     * Reset password with token
     */
    async resetPassword(
        token: string,
        newPassword: string
    ): Promise<{ success: boolean }> {
        return apiFetch('/api/auth/reset-password', {
            method: 'POST',
            body: { token, newPassword },
        })
    },

    /**
     * Logout from backend
     */
    async logout(): Promise<void> {
        try {
            await apiFetch('/api/auth/sign-out', { method: 'POST' })
        } catch {
            // Ignore errors - user may already be logged out
        }
    },
}

// ============================================================================
// GitHub OAuth API
// ============================================================================

export const github = {
    /**
     * Get GitHub connection status for current user
     */
    async getStatus(): Promise<GitHubStatus> {
        return apiFetch('/auth/github/status')
    },

    /**
     * Get the GitHub OAuth URL to redirect the user to
     * Returns a URL that the frontend should navigate to
     */
    async getConnectUrl(): Promise<{ url: string }> {
        return apiFetch('/auth/github/connect', { method: 'POST' })
    },

    /**
     * Disconnect GitHub account from current user
     */
    async disconnect(): Promise<{ success: boolean }> {
        return apiFetch('/auth/github', { method: 'DELETE' })
    },
}
