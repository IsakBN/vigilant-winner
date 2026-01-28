/**
 * Hooks Barrel Export
 */

export { useApps, useApp, useCreateApp, useDeleteApp, appsKeys } from './useApps'
export type { AppFilters } from './useApps'

export { useAppDetails, useUpdateApp, useDeleteAppById, useRegenerateApiKey } from './useApp'

// Releases hooks
export {
    useReleases,
    useRelease,
    useCreateRelease,
    useUpdateRelease,
    useDeleteRelease,
    useUploadBundle,
    useRollbackRelease,
    releasesKeys,
} from './useReleases'
export type {
    Release,
    ReleaseWithStats,
    ReleaseStatus,
    ListReleasesParams,
    CreateReleaseInput,
    UpdateReleaseInput,
} from './useReleases'

// Channels hooks
export {
    useChannels,
    useChannel,
    useCreateChannel,
    useUpdateChannel,
    useDeleteChannel,
    channelsKeys,
} from './useChannels'
export type {
    Channel,
    CreateChannelInput,
    UpdateChannelInput,
    ListChannelsParams,
} from './useChannels'

// Rollback reports hooks
export {
    useRollbackReports,
    rollbackReportKeys,
} from './useRollbackReports'
export type {
    RollbackReport,
    RollbackReportSummary,
    FailureBreakdown,
    RecentRollback,
} from './useRollbackReports'

// Devices hooks
export {
    useDevices,
    useDevice,
    useRevokeDevice,
    devicesKeys,
} from './useDevices'
export type {
    Device,
    DeviceWithRelease,
    DeviceUpdateEvent,
    DevicePlatform,
    ListDevicesParams,
    DeviceFilters,
} from './useDevices'

// Builds hooks
export {
    useBuilds,
    useBuild,
    useBuildLogs,
    useTriggerBuild,
    useCancelBuild,
    useRetryBuild,
    buildsKeys,
} from './useBuilds'
export type {
    Build,
    BuildStatus,
    BuildPlatform,
    BuildLog,
    ListBuildsParams,
    TriggerBuildInput,
} from './useBuilds'

// Teams hooks
export {
    useTeams,
    useTeam,
    useTeamMembers,
    useInvitations,
    useCreateTeam,
    useUpdateTeam,
    useDeleteTeam,
    useInviteMember,
    useUpdateMemberRole,
    useRemoveMember,
    useLeaveTeam,
    useResendInvitation,
    useCancelInvitation,
    teamsKeys,
} from './useTeams'

// Billing hooks
export {
    useSubscription,
    usePlans,
    useInvoices,
    useUsage,
    useCreateCheckout,
    useCreatePortal,
    useCancelSubscription,
    useResumeSubscription,
    billingKeys,
} from './useBilling'

// Webhooks hooks
export {
    useWebhooks,
    useWebhook,
    useWebhookDeliveries,
    useCreateWebhook,
    useUpdateWebhook,
    useDeleteWebhook,
    useTestWebhook,
    useRegenerateWebhookSecret,
    webhooksKeys,
} from './useWebhooks'
export type {
    Webhook,
    WebhookEvent,
    WebhookDelivery,
    CreateWebhookInput,
    UpdateWebhookInput,
    TestWebhookResponse,
} from './useWebhooks'

// Settings hooks
export {
    useProfile,
    useUpdateProfile,
    useChangePassword,
    useUploadAvatar,
    useDeleteAccount,
    settingsKeys,
} from './useSettings'

// Testers hooks
export {
    useTesters,
    useTester,
    useCreateTester,
    useDeleteTester,
    useImportTesters,
    useExportTesters,
    testersKeys,
} from './useTesters'

// Health hooks
export { useAppHealth, healthKeys } from './useAppHealth'
export type { AppHealth } from './useAppHealth'

// Activity hooks
export { useRecentActivity, activityKeys } from './useRecentActivity'
export type { ActivityItem, ActivityType } from './useRecentActivity'

// App Metrics hooks
export { useAppMetrics, appMetricsKeys } from './useAppMetrics'
export type {
    AppMetrics,
    TrendDataPoint,
    DeviceDistribution,
} from './useAppMetrics'
