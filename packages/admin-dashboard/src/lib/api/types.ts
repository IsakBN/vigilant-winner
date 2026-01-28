/**
 * Common API Types for BundleNudge Admin Dashboard
 */

// Re-export all types from the types/ directory
export * from './types/index'

/**
 * Standard API error response shape
 */
export interface ApiError {
    error: string
    details?: string
    code?: string
}

/**
 * Standard pagination shape
 */
export interface Pagination {
    total: number
    limit: number
    offset: number
    hasMore: boolean
}

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
        active: number
        byPlan: Record<string, number>
        mrr: number
        churnRate: number
    }
    cached?: boolean
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

export interface GetSystemConfigResponse {
    config: SystemConfig
}

export interface UpdateConfigResponse {
    config: SystemConfig
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

export interface ListAuditLogsResponse {
    logs: AuditLogEntry[]
    total: number
    page: number
    limit: number
    hasMore: boolean
}

// =============================================================================
// Newsletter Types
// =============================================================================

export type CampaignStatus = 'draft' | 'scheduled' | 'sending' | 'sent'

export interface NewsletterSubscriber {
    id: string
    email: string
    name: string | null
    subscribedAt: number
    unsubscribedAt: number | null
    source: string | null
    isActive: boolean
}

export interface NewsletterCampaign {
    id: string
    subject: string
    content?: string
    previewText: string | null
    status: CampaignStatus
    scheduledFor: number | null
    sentAt: number | null
    recipientCount: number | null
    openCount: number
    clickCount: number
    createdBy: string
    createdAt: number
    updatedAt: number | null
}

export interface CampaignStats {
    recipientCount: number
    openCount: number
    clickCount: number
    openRate: number
    clickRate: number
    sentAt: number | null
}

export interface ListSubscribersParams {
    limit?: number
    offset?: number
    search?: string
    active?: boolean
}

export interface ListSubscribersResponse {
    subscribers: NewsletterSubscriber[]
    pagination: Pagination
}

export interface ListCampaignsParams {
    limit?: number
    offset?: number
    status?: CampaignStatus
}

export interface ListCampaignsResponse {
    campaigns: NewsletterCampaign[]
    pagination: Pagination
}

export interface GetCampaignResponse {
    campaign: NewsletterCampaign & { content: string }
}

export interface CampaignPreviewResponse {
    subject: string
    html: string
}

export interface CreateCampaignInput {
    subject: string
    content: string
    previewText?: string
}

export interface UpdateCampaignInput {
    subject?: string
    content?: string
    previewText?: string
}

export interface SendCampaignInput {
    scheduledFor?: number
}

export interface ImportSubscribersInput {
    csv: string
    source?: string
}

export interface ImportSubscribersResponse {
    success: boolean
    imported: number
    skipped: number
}

export interface SendCampaignResponse {
    success: boolean
    sent?: number
    failed?: number
    scheduled?: boolean
    scheduledFor?: number
}
