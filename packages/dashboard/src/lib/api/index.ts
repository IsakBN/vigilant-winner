/**
 * API Client for BundleNudge Dashboard
 *
 * Central export for all API functionality.
 * Import from '@/lib/api' to use any API function or type.
 */

// Re-export all types
export * from './types'

// Re-export client utilities
export {
    API_URL,
    ApiClientError,
    apiFetch,
    apiClient,
    buildQueryString,
} from './client'

export type { ApiFetchOptions } from './client'

// Re-export auth API
export { auth, github } from './auth'
export type { User, GitHubStatus } from './auth'

// Re-export accounts API
export { accounts } from './accounts'
export type {
    PlanType,
    AccountUsage,
    AccountBilling,
    AccountStats,
    AccountDashboardOverview,
    GetDashboardOverviewResponse,
} from './accounts'

// Re-export apps API
export { apps } from './apps'
export type {
    App,
    Platform,
    CreateAppInput,
    CreateAppResponse,
    ListAppsResponse,
    GetAppResponse,
    GitHubRepo,
    ListReposResponse,
    ListContentsResponse,
    AppStats,
    AppWithStats,
    GetAppWithStatsResponse,
    SetupStatus,
    GetSetupStatusResponse,
} from './apps'

// Re-export channels API
export { channels } from './channels'
export type {
    Channel,
    ChannelTargetingRule,
    ChannelTargetingRules,
    CreateChannelInput,
    UpdateChannelInput,
    ListChannelsResponse,
    GetChannelResponse,
    CreateChannelResponse,
    UpdateChannelResponse,
    ListChannelsParams,
} from './channels'

// Re-export releases API
export { releases } from './releases'
export type {
    Release,
    ReleaseStatus,
    ReleaseStats,
    ReleaseWithStats,
    CreateReleaseInput,
    UpdateReleaseInput,
    ListReleasesParams,
    ListReleasesResponse,
    GetReleaseResponse,
    CreateReleaseResponse,
    UpdateReleaseResponse,
} from './releases'

// Re-export teams API
export { teams } from './teams'
export type {
    Team,
    TeamRole,
    TeamMember,
    TeamInvitation,
    InvitationStatus,
    CreateTeamInput,
    UpdateTeamInput,
    InviteMemberInput,
    UpdateMemberRoleInput,
    ListTeamsResponse,
    GetTeamResponse,
    CreateTeamResponse,
    ListMembersResponse,
    ListInvitationsResponse,
    InviteMemberResponse,
} from './teams'

// Re-export devices API
export { devices } from './devices'
export type {
    Device,
    DevicePlatform,
    DeviceWithRelease,
    DeviceUpdateEvent,
    ListDevicesParams,
    ListDevicesResponse,
    GetDeviceResponse,
    RevokeDeviceResponse,
} from './devices'

// Re-export settings API
export { settings } from './settings'
export type {
    UserProfile,
    UpdateProfileInput,
    ChangePasswordInput,
    GetProfileResponse,
    UpdateProfileResponse,
} from './settings'

// Re-export billing API
export { billing } from './billing'
export type {
    SubscriptionStatus,
    SubscriptionPlan,
    PlanLimits,
    Subscription,
    Invoice,
    UsageStats,
    GetSubscriptionResponse,
    ListPlansResponse,
    ListInvoicesResponse,
    GetUsageResponse,
    CreateCheckoutResponse,
    CreatePortalResponse,
} from './billing'

// Re-export webhooks API
export { webhooks, WEBHOOK_EVENTS } from './webhooks'
export type {
    WebhookEvent,
    Webhook,
    WebhookDelivery,
    CreateWebhookInput,
    UpdateWebhookInput,
    ListWebhooksResponse,
    GetWebhookResponse,
    CreateWebhookResponse,
    UpdateWebhookResponse,
    ListDeliveriesResponse,
    TestWebhookResponse,
} from './webhooks'

// Re-export builds API
export { builds } from './builds'
export type {
    Build,
    BuildStatus,
    BuildPlatform,
    BuildArtifact,
    BuildLog,
    ListBuildsParams,
    ListBuildsResponse,
    GetBuildResponse,
    GetBuildLogsResponse,
    TriggerBuildInput,
    TriggerBuildResponse,
    UploadProgressEvent,
} from './builds'

// Re-export testers API
export { testers } from './testers'
export type {
    Tester,
    TesterStats,
    CreateTesterInput,
    ImportCsvResult,
    ExportCsvResult,
    ListTestersResponse,
    GetTesterResponse,
    CreateTesterResponse,
    ImportTestersResponse,
    ExportTestersResponse,
} from './testers'

// Re-export credentials API
export { credentials } from './credentials'
export type {
    AppleCredential,
    CreateCredentialInput,
    ListCredentialsResponse,
    GetCredentialResponse,
    CreateCredentialResponse,
    VerifyCredentialResponse,
} from './credentials'

// Re-export crash integrations API
export { crashIntegrations, CRASH_PROVIDERS } from './crash-integrations'
export type {
    CrashProvider,
    SentryConfig,
    BugsnagConfig,
    CrashlyticsConfig,
    CrashIntegrationConfig,
    CrashIntegration,
    CreateCrashIntegrationInput,
    UpdateCrashIntegrationInput,
    ListCrashIntegrationsResponse,
    GetCrashIntegrationResponse,
    CreateCrashIntegrationResponse,
    UpdateCrashIntegrationResponse,
    TestCrashIntegrationResponse,
} from './crash-integrations'

// Re-export admin API
export {
    admin,
    adminDashboard,
    adminOrgs,
    adminUsers,
    auditLogs,
    featureFlags,
    newsletter,
    checkAdminAccess,
} from './admin'
export type {
    ActivityType,
    AlertSeverity,
    DashboardOverview,
    ActivityItem,
    SystemAlert,
    Pagination,
    ActivityResponse,
    AlertsResponse,
    ActivityParams,
    AlertsParams,
    OrgPlan,
    AdminOrg,
    AdminOrgDetails,
    AdminOrgMember,
    AdminOrgApp,
    ListAdminOrgsParams,
    ListAdminOrgsResponse,
    GetAdminOrgResponse,
    UpdateAdminOrgInput,
    FeatureFlagType,
    FeatureFlagStatus,
    FeatureFlag,
    CreateFeatureFlagInput,
    UpdateFeatureFlagInput,
    ListFeatureFlagsResponse,
    GetFeatureFlagResponse,
    CreateFeatureFlagResponse,
    UserStatus,
    AdminUser,
    AdminUserDetail,
    UserSession,
    UserActivity,
    ListUsersParams,
    ListUsersResponse,
    GetUserResponse,
    UserActionResponse,
    // System Config types
    EmailConfig,
    RateLimitConfig,
    SecurityConfig,
    StorageConfig,
    SystemConfig,
    UpdateEmailConfigInput,
    UpdateRateLimitConfigInput,
    UpdateSecurityConfigInput,
    UpdateStorageConfigInput,
    GetSystemConfigResponse,
    UpdateConfigResponse,
    // Audit Log types
    AuditAction,
    AuditLogEntry,
    ListAuditLogsParams,
    ListAuditLogsResponse,
    // Newsletter types
    CampaignStatus,
    NewsletterSubscriber,
    NewsletterCampaign,
    CampaignStats,
    ListSubscribersParams,
    ListSubscribersResponse,
    ListCampaignsParams,
    ListCampaignsResponse,
    GetCampaignResponse,
    CampaignPreviewResponse,
    CreateCampaignInput,
    UpdateCampaignInput,
    SendCampaignInput,
    ImportSubscribersInput,
    ImportSubscribersResponse,
    SendCampaignResponse,
} from './admin'

// Re-export admin ops API
export {
    adminOps,
    getOtaMetrics,
    getBuildQueue,
    cancelBuild,
    retryBuild,
    getApiHealth,
    getStorageMetrics,
    cleanupOrphanedBundles,
    getSystemLogs,
    exportLogs,
    getDatabaseStats,
    listAdminApps,
    getAdminApp,
    updateAppStatus,
    deleteAdminApp,
} from './admin-ops'

// Re-export admin ops types from types/admin
export type {
    OtaMetrics,
    OtaMetricsPeriod,
    OtaMetricsAppBreakdown,
    OtaMetricsHourlyBreakdown,
    BuildJobStatus,
    BuildJob,
    WorkerStatus,
    BuildWorker,
    BuildQueueStats,
    ApiEndpointStats,
    ApiRecentError,
    ApiHealthStats,
    StorageAppMetrics,
    StorageLargestBundle,
    StorageGrowthEntry,
    StorageMetrics,
    LogLevel,
    LogService,
    LogEntry,
    LogsResponse,
    ListLogsParams,
    DatabaseTable,
    SlowQuery,
    DatabaseStats,
    AdminAppPlatform,
    AdminAppStatus,
    AdminApp as AdminOpsApp,
    AdminAppSortBy,
    SortOrder,
    ListAdminAppsParams,
    AdminAppsResponse,
} from './types/admin'
