/**
 * Hooks Barrel Export
 *
 * Re-exports all hooks from a single entry point.
 */

// Admin Dashboard, Config, Audit Logs hooks
export {
    adminKeys,
    useAdminStats,
    useSystemHealth,
    useRecentActivity,
    useSystemConfig,
    useUpdateEmailConfig,
    useUpdateRateLimitConfig,
    useUpdateSecurityConfig,
    useUpdateStorageConfig,
    useTestEmailConfig,
    useAuditLogs,
    useExportAuditLogs,
} from './useAdmin'

// User management hooks
export {
    useAdminUsers,
    useAdminUser,
    useSuspendUser,
    useUnsuspendUser,
    useBanUser,
    useUnbanUser,
    useVerifyEmail,
    useSendPasswordReset,
    useRevokeAllSessions,
    useDeleteUser,
    useUserActions,
} from './useAdminUsers'

// Organization management hooks
export {
    useAdminOrgs,
    useAdminOrg,
    useUpdateAdminOrg,
    useSuspendOrg,
    useReactivateOrg,
    useDeleteAdminOrg,
    useOrgActions,
} from './useAdminOrgs'

// Feature flag hooks
export {
    useFeatureFlags,
    useFeatureFlag,
    useCreateFeatureFlag,
    useUpdateFeatureFlag,
    useDeleteFeatureFlag,
    useToggleFeatureFlag,
    useFeatureFlagActions,
} from './useFeatureFlags'

// Admin operations hooks (OTA, builds, storage, logs, database, apps)
export {
    adminOpsKeys,
    useOtaMetrics,
    useBuildQueue,
    useCancelBuild,
    useRetryBuild,
    useApiHealth,
    useStorageMetrics,
    useCleanupOrphanedBundles,
    useSystemLogs,
    useExportLogs,
    useDatabaseStats,
    useAdminApps,
    useAdminOpsApp,
    useUpdateAppStatus,
    useDeleteAdminApp,
} from './useAdminOps'

// Newsletter hooks
export {
    newsletterKeys,
    useSubscribers,
    useImportSubscribers,
    useExportSubscribers,
    useCampaigns,
    useCampaign,
    useCampaignPreview,
    useCampaignStats,
    useCreateCampaign,
    useUpdateCampaign,
    useDeleteCampaign,
    useSendTestEmail,
    useSendCampaign,
    useCampaignActions,
} from './useNewsletter'
