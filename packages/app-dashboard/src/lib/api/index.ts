/**
 * API Client for BundleNudge App Dashboard
 */

// Re-export types
export * from './types'

// Re-export client utilities
export {
    API_URL,
    ApiClientError,
    apiFetch,
    apiClient,
} from './client'

export type { ApiFetchOptions } from './client'

// Re-export apps API
export { apps } from './apps'

// Re-export releases API
export { releases } from './releases'

// Re-export channels API
export { channels } from './channels'

// Re-export devices API
export { devices } from './devices'

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
} from './builds'

// Re-export teams API
export { teams } from './teams'
// Note: Team types are exported from './types' via `export * from './types'`

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

// Re-export integrations API
export { integrations } from './integrations'
export type {
    GitHubStatus,
    SlackStatus,
    DiscordStatus,
    CrashProvider,
    CrashIntegrationStatus,
    IntegrationsStatus,
} from './integrations'

// Re-export webhooks API
export { webhooks, WEBHOOK_EVENTS } from './webhooks'
export type {
    Webhook,
    WebhookEvent,
    WebhookDelivery,
    CreateWebhookInput,
    UpdateWebhookInput,
    ListWebhooksResponse,
    GetWebhookResponse,
    CreateWebhookResponse,
    UpdateWebhookResponse,
    ListDeliveriesResponse,
    TestWebhookResponse,
    RegenerateSecretResponse,
} from './webhooks'

// Re-export settings API
export { settings } from './settings'
export type {
    UserProfile,
    UpdateProfileInput,
    ChangePasswordInput,
    GetProfileResponse,
    UpdateProfileResponse,
    SuccessResponse,
} from './settings'

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
