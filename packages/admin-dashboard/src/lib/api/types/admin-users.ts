/**
 * Admin User Management Types
 *
 * Types for admin user list and user detail views.
 */

// =============================================================================
// User List Types
// =============================================================================

import type { SortOrder } from './admin'

export type AdminUserPlanName = 'free' | 'starter' | 'pro' | 'team' | 'enterprise'
export type AdminUserSubscriptionStatus =
    | 'active'
    | 'trialing'
    | 'past_due'
    | 'cancelled'
    | 'expired'
    | 'none'
export type AdminUserSortBy = 'created_at' | 'email' | 'app_count' | 'mau'

/** Parameters for filtering the admin user list */
export interface AdminUserListParams {
    limit?: number
    offset?: number
    planName?: AdminUserPlanName
    subscriptionStatus?: AdminUserSubscriptionStatus
    hasOverride?: boolean
    isSuspended?: boolean
    search?: string
    sortBy?: AdminUserSortBy
    sortOrder?: SortOrder
}

/** Single user item in the admin list view */
export interface AdminUserListItem {
    id: string
    email: string | null
    name: string | null
    createdAt: number
    githubConnected: boolean
    githubUsername: string | null
    avatarUrl: string | null
    appCount: number
    planName: string | null
    planDisplayName: string | null
    subscriptionStatus: string | null
    hasOverride: boolean
    isSuspended: boolean
    teamCount: number
}

/** Response for the admin user list endpoint */
export interface AdminUserListResponse {
    users: AdminUserListItem[]
    total: number
}

// =============================================================================
// User Detail Types
// =============================================================================

/** Plan limits information */
export interface AdminUserPlanLimits {
    monthlyBuilds: number | null
    concurrentBuilds: number | null
    buildTimeoutMinutes: number | null
    mauLimit: number | null
    storageGb: number | null
}

/** User subscription information */
export interface AdminUserSubscription {
    id: string
    user_id: string
    plan_id: string
    status: string
    stripe_subscription_id: string | null
    stripe_customer_id: string | null
    current_period_start: number
    current_period_end: number
    trial_end: number | null
    created_at: number
    updated_at: number
    plan: {
        name: string | null
        displayName: string | null
        monthlyPriceCents: number | null
        limits: AdminUserPlanLimits
    }
}

/** User usage statistics */
export interface AdminUserUsage {
    current: { build_count: number; build_minutes: number }
    history: { month: string; build_count: number; build_minutes: number }[]
}

/** User app information */
export interface AdminUserApp {
    id: string
    name: string
    github_repo: string
    created_at: number
    release_count: number
}

/** Team membership information */
export interface AdminUserTeamMembership {
    role: string
    joined_at: number
    org_id: string
    org_name: string
    org_slug: string
    member_count: number
    app_count: number
}

/** Project access information */
export interface AdminUserProjectAccess {
    role: string
    created_at: number
    app_id: string
    app_name: string
    org_id: string | null
    org_name: string | null
}

/** User teams information */
export interface AdminUserTeams {
    memberships: AdminUserTeamMembership[]
    projectAccess: AdminUserProjectAccess[]
}

/** User limit overrides */
export interface AdminUserOverrides {
    id: string
    user_id: string
    monthly_build_limit: number | null
    concurrent_builds: number | null
    build_timeout_minutes: number | null
    mau_limit: number | null
    mau_multiplier: number | null
    storage_gb: number | null
    storage_multiplier: number | null
    expires_at: number | null
    reason: string | null
    created_by: string | null
    created_at: number
    updated_at: number
}

/** Effective limits after applying overrides */
export interface AdminUserEffectiveLimits {
    mauLimit: number
    storageGb: number
    monthlyBuildLimit: number
    concurrentBuilds: number
    buildTimeoutMinutes: number
    hasOverrides: boolean
    overrideExpiresAt: number | null
}

/** User credits information */
export interface AdminUserCredits {
    active: number
}

/** User suspension information */
export interface AdminUserSuspension {
    id: string
    reason: string
    until: number | null
    suspended_by: string
    created_at: number
}

/** Admin audit log entry for user activity */
export interface AdminUserAuditLogEntry {
    id: string
    adminId: string
    adminEmail: string | null
    action: string
    targetUserId: string | null
    targetEmail?: string | null
    targetAppId?: string | null
    targetSubscriptionId?: string | null
    details: Record<string, unknown> | null
    createdAt: number
}

/** Full user detail for admin view */
export interface AdminUserDetail {
    user: {
        id: string
        email: string | null
        name: string | null
        created_at: number
        github_id: string | null
        github_username: string | null
        avatar_url: string | null
    }
    subscription: AdminUserSubscription | null
    usage: AdminUserUsage
    apps: AdminUserApp[]
    teams: AdminUserTeams
    overrides: AdminUserOverrides | null
    effectiveLimits: AdminUserEffectiveLimits
    credits: AdminUserCredits
    suspension: AdminUserSuspension | null
    activity: AdminUserAuditLogEntry[]
}

/** Response for getting user detail */
export interface AdminUserDetailResponse {
    user: AdminUserDetail
}
