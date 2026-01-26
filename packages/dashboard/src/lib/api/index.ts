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

// Re-export apps API
export { apps } from './apps'
export type {
    App,
    Platform,
    CreateAppInput,
    CreateAppResponse,
    ListAppsResponse,
    GetAppResponse,
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
