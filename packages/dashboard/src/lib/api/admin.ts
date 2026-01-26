/**
 * Admin API for BundleNudge Dashboard
 *
 * Provides typed API methods for admin dashboard, organization, and feature flag management.
 */

import { apiClient, buildQueryString } from './client'

// =============================================================================
// Dashboard Types
// =============================================================================

export type ActivityType =
  | 'user_signup'
  | 'app_created'
  | 'release_published'
  | 'subscription_started'
  | 'subscription_cancelled'

export type AlertSeverity = 'info' | 'warning' | 'critical'

export interface DashboardOverview {
  users: {
    total: number
    active: number
    newToday: number
    newThisWeek: number
    newThisMonth: number
  }
  apps: {
    total: number
    active: number
    newThisWeek: number
  }
  devices: {
    total: number
    active: number
    byPlatform: { ios: number; android: number }
  }
  releases: {
    total: number
    thisWeek: number
    avgBundleSize: number
  }
  subscriptions: {
    byPlan: Record<string, number>
    mrr: number
    churnRate: number
  }
  cached: boolean
  generatedAt?: number
}

export interface ActivityItem {
  id: string
  type: ActivityType
  userId: string
  userEmail: string
  metadata: Record<string, unknown>
  createdAt: number
}

export interface SystemAlert {
  id: string
  severity: AlertSeverity
  type: string
  message: string
  metadata: Record<string, unknown>
  createdAt: number
  resolvedAt: number | null
}

export interface Pagination {
  total: number
  limit: number
  offset: number
  hasMore: boolean
}

export interface ActivityResponse {
  items: ActivityItem[]
  pagination: Pagination
}

export interface AlertsResponse {
  items: SystemAlert[]
  pagination: Pagination
}

export interface ActivityParams {
  limit?: number
  offset?: number
  type?: ActivityType
}

export interface AlertsParams {
  limit?: number
  offset?: number
  severity?: AlertSeverity
  resolved?: boolean
}

// =============================================================================
// Organization Types
// =============================================================================

export type OrgPlan = 'free' | 'pro' | 'enterprise'

export interface AdminOrg {
    id: string
    name: string
    slug: string
    email: string | null
    plan: OrgPlan
    memberCount: number
    appCount: number
    createdAt: number
    updatedAt?: number
    isActive: boolean
    lastActiveAt?: number
}

export interface AdminOrgDetails extends AdminOrg {
    members: AdminOrgMember[]
    apps: AdminOrgApp[]
    billingEmail?: string
    domain?: string
    stripeCustomerId?: string
}

export interface AdminOrgMember {
    id: string
    userId: string
    email: string
    name: string | null
    role: 'owner' | 'admin' | 'member'
    joinedAt: number
}

export interface AdminOrgApp {
    id: string
    name: string
    platform: 'ios' | 'android'
    bundleId: string | null
    activeDevices: number
    lastReleaseAt?: number
}

export interface ListAdminOrgsParams {
    search?: string
    plan?: OrgPlan | 'all'
    limit?: number
    offset?: number
}

export interface ListAdminOrgsResponse {
    organizations: AdminOrg[]
    total: number
}

export interface GetAdminOrgResponse {
    organization: AdminOrgDetails
}

export interface UpdateAdminOrgInput {
    plan?: OrgPlan
    isActive?: boolean
}

// =============================================================================
// Feature Flag Types
// =============================================================================

export type FeatureFlagType = 'boolean' | 'percentage' | 'json'
export type FeatureFlagStatus = 'active' | 'inactive'

export interface FeatureFlag {
    id: string
    key: string
    name: string
    description: string | null
    type: FeatureFlagType
    status: FeatureFlagStatus
    enabled: boolean
    rolloutPercentage: number
    targetOrgIds: string[]
    targetPlanTypes: OrgPlan[]
    jsonValue?: Record<string, unknown>
    createdAt: number
    updatedAt?: number
}

export interface CreateFeatureFlagInput {
    key: string
    name: string
    description?: string
    type: FeatureFlagType
}

export interface UpdateFeatureFlagInput {
    name?: string
    description?: string
    enabled?: boolean
    rolloutPercentage?: number
    targetOrgIds?: string[]
    targetPlanTypes?: OrgPlan[]
    jsonValue?: Record<string, unknown>
}

export interface ListFeatureFlagsResponse {
    flags: FeatureFlag[]
}

export interface GetFeatureFlagResponse {
    flag: FeatureFlag
}

export interface CreateFeatureFlagResponse {
    flag: FeatureFlag
}

// =============================================================================
// Admin Organizations API
// =============================================================================

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

// =============================================================================
// Feature Flags API
// =============================================================================

export const featureFlags = {
    /**
     * List all feature flags
     */
    list(): Promise<ListFeatureFlagsResponse> {
        return apiClient.get('/admin/feature-flags')
    },

    /**
     * Get a single feature flag
     */
    get(flagId: string): Promise<GetFeatureFlagResponse> {
        return apiClient.get(`/admin/feature-flags/${flagId}`)
    },

    /**
     * Create a new feature flag
     */
    create(data: CreateFeatureFlagInput): Promise<CreateFeatureFlagResponse> {
        return apiClient.post('/admin/feature-flags', data)
    },

    /**
     * Update a feature flag
     */
    update(flagId: string, data: UpdateFeatureFlagInput): Promise<void> {
        return apiClient.patch(`/admin/feature-flags/${flagId}`, data)
    },

    /**
     * Delete a feature flag
     */
    delete(flagId: string): Promise<void> {
        return apiClient.delete(`/admin/feature-flags/${flagId}`)
    },

    /**
     * Toggle a feature flag on/off
     */
    toggle(flagId: string, enabled: boolean): Promise<void> {
        return apiClient.patch(`/admin/feature-flags/${flagId}`, { enabled })
    },
}

// =============================================================================
// Admin Dashboard API
// =============================================================================

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

// =============================================================================
// User Management Types
// =============================================================================

export type UserStatus = 'active' | 'suspended' | 'banned'

export interface AdminUser {
    id: string
    email: string
    name: string | null
    avatarUrl: string | null
    status: UserStatus
    emailVerified: boolean
    createdAt: number
    lastLoginAt: number | null
    appsCount: number
    teamsCount: number
}

export interface AdminUserDetail extends AdminUser {
    metadata: Record<string, unknown>
    sessions: UserSession[]
    recentActivity: UserActivity[]
}

export interface UserSession {
    id: string
    ipAddress: string
    userAgent: string
    createdAt: number
    lastActiveAt: number
}

export interface UserActivity {
    id: string
    action: string
    resource: string
    resourceId: string | null
    metadata: Record<string, unknown>
    createdAt: number
}

export interface ListUsersParams {
    search?: string
    status?: UserStatus
    page?: number
    limit?: number
    sortBy?: 'createdAt' | 'lastLoginAt' | 'email' | 'name'
    sortOrder?: 'asc' | 'desc'
}

export interface ListUsersResponse {
    users: AdminUser[]
    total: number
    page: number
    limit: number
    totalPages: number
}

export interface GetUserResponse {
    user: AdminUserDetail
}

export interface UserActionResponse {
    success: boolean
    message: string
}

// =============================================================================
// User Management API
// =============================================================================

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

// =============================================================================
// System Config Types
// =============================================================================

export interface EmailConfig {
    provider: 'sendgrid' | 'ses' | 'resend' | 'smtp'
    fromEmail: string
    fromName: string
    replyToEmail: string | null
    enabled: boolean
}

export interface RateLimitConfig {
    globalRateLimit: number
    globalRateWindow: number
    authRateLimit: number
    authRateWindow: number
    uploadRateLimit: number
    uploadRateWindow: number
    enabled: boolean
}

export interface SecurityConfig {
    maxLoginAttempts: number
    lockoutDuration: number
    sessionTimeout: number
    requireMfa: boolean
    allowedIpRanges: string[]
    corsOrigins: string[]
}

export interface StorageConfig {
    provider: 'r2' | 's3' | 'gcs'
    bucketName: string
    region: string
    maxBundleSize: number
    retentionDays: number
    cdnEnabled: boolean
    cdnUrl: string | null
}

export interface SystemConfig {
    email: EmailConfig
    rateLimit: RateLimitConfig
    security: SecurityConfig
    storage: StorageConfig
    updatedAt: number
    updatedBy: string | null
}

export interface UpdateEmailConfigInput {
    provider?: EmailConfig['provider']
    fromEmail?: string
    fromName?: string
    replyToEmail?: string | null
    enabled?: boolean
}

export interface UpdateRateLimitConfigInput {
    globalRateLimit?: number
    globalRateWindow?: number
    authRateLimit?: number
    authRateWindow?: number
    uploadRateLimit?: number
    uploadRateWindow?: number
    enabled?: boolean
}

export interface UpdateSecurityConfigInput {
    maxLoginAttempts?: number
    lockoutDuration?: number
    sessionTimeout?: number
    requireMfa?: boolean
    allowedIpRanges?: string[]
    corsOrigins?: string[]
}

export interface UpdateStorageConfigInput {
    provider?: StorageConfig['provider']
    bucketName?: string
    region?: string
    maxBundleSize?: number
    retentionDays?: number
    cdnEnabled?: boolean
    cdnUrl?: string | null
}

// =============================================================================
// Audit Log Types
// =============================================================================

export type AuditAction =
    | 'config.update'
    | 'user.create'
    | 'user.update'
    | 'user.delete'
    | 'user.suspend'
    | 'user.unsuspend'
    | 'app.create'
    | 'app.delete'
    | 'release.create'
    | 'release.rollback'
    | 'team.create'
    | 'team.delete'
    | 'admin.login'
    | 'admin.logout'

export interface AuditLogEntry {
    id: string
    action: AuditAction
    actorId: string
    actorEmail: string
    actorName: string | null
    targetType: 'user' | 'app' | 'release' | 'team' | 'config' | null
    targetId: string | null
    targetName: string | null
    metadata: Record<string, unknown>
    ipAddress: string | null
    userAgent: string | null
    createdAt: number
}

export interface ListAuditLogsParams {
    page?: number
    limit?: number
    action?: AuditAction
    actorId?: string
    targetType?: AuditLogEntry['targetType']
    startDate?: string
    endDate?: string
}

export interface GetSystemConfigResponse {
    config: SystemConfig
}

export interface UpdateConfigResponse {
    config: SystemConfig
}

export interface ListAuditLogsResponse {
    logs: AuditLogEntry[]
    total: number
    page: number
    limit: number
    hasMore: boolean
}

// =============================================================================
// System Config API
// =============================================================================

export const admin = {
    /**
     * Get system configuration
     */
    getConfig(): Promise<GetSystemConfigResponse> {
        return apiClient.get('/admin/config')
    },

    /**
     * Update email configuration
     */
    updateEmailConfig(data: UpdateEmailConfigInput): Promise<UpdateConfigResponse> {
        return apiClient.patch('/admin/config/email', data)
    },

    /**
     * Update rate limit configuration
     */
    updateRateLimitConfig(
        data: UpdateRateLimitConfigInput
    ): Promise<UpdateConfigResponse> {
        return apiClient.patch('/admin/config/rate-limit', data)
    },

    /**
     * Update security configuration
     */
    updateSecurityConfig(
        data: UpdateSecurityConfigInput
    ): Promise<UpdateConfigResponse> {
        return apiClient.patch('/admin/config/security', data)
    },

    /**
     * Update storage configuration
     */
    updateStorageConfig(
        data: UpdateStorageConfigInput
    ): Promise<UpdateConfigResponse> {
        return apiClient.patch('/admin/config/storage', data)
    },

    /**
     * Test email configuration
     */
    testEmailConfig(): Promise<{ success: boolean }> {
        return apiClient.post('/admin/config/email/test')
    },

    /**
     * List audit logs with filtering
     */
    listAuditLogs(params: ListAuditLogsParams = {}): Promise<ListAuditLogsResponse> {
        const query = buildQueryString({
            page: params.page,
            limit: params.limit,
            action: params.action,
            actorId: params.actorId,
            targetType: params.targetType ?? undefined,
            startDate: params.startDate,
            endDate: params.endDate,
        })
        return apiClient.get(`/admin/audit${query}`)
    },

    /**
     * Export audit logs as CSV
     */
    async exportAuditLogs(params: ListAuditLogsParams = {}): Promise<Blob> {
        const query = buildQueryString({
            action: params.action,
            actorId: params.actorId,
            targetType: params.targetType ?? undefined,
            startDate: params.startDate,
            endDate: params.endDate,
            format: 'csv',
        })
        const response = await fetch(`/admin/audit/export${query}`, {
            credentials: 'include',
        })
        return response.blob()
    },
}

// =============================================================================
// Audit Logs API (standalone)
// =============================================================================

export const auditLogs = {
    /**
     * List audit logs with filtering
     */
    list(params: ListAuditLogsParams = {}): Promise<ListAuditLogsResponse> {
        const query = buildQueryString({
            page: params.page,
            limit: params.limit,
            action: params.action,
            actorId: params.actorId,
            targetType: params.targetType ?? undefined,
            startDate: params.startDate,
            endDate: params.endDate,
        })
        return apiClient.get(`/admin/audit${query}`)
    },

    /**
     * Export audit logs as CSV
     */
    async exportCsv(params: ListAuditLogsParams = {}): Promise<Blob> {
        const query = buildQueryString({
            action: params.action,
            actorId: params.actorId,
            targetType: params.targetType ?? undefined,
            startDate: params.startDate,
            endDate: params.endDate,
            format: 'csv',
        })
        const response = await fetch(`/admin/audit/export${query}`, {
            credentials: 'include',
        })
        return response.blob()
    },
}
