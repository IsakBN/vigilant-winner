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

export const auth = {
    /**
     * Get current user from backend
     * Uses Better-Auth session cookies for authentication
     */
    async me(): Promise<{ user: User }> {
        return apiFetch('/auth/me')
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
