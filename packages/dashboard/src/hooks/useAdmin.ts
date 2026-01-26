'use client'

/**
 * useAdmin Hooks
 *
 * TanStack Query hooks for admin system configuration, audit logs,
 * organization management, and feature flags.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
    admin,
    adminOrgs,
    adminDashboard,
    adminUsers,
    featureFlags,
    type UpdateEmailConfigInput,
    type UpdateRateLimitConfigInput,
    type UpdateSecurityConfigInput,
    type UpdateStorageConfigInput,
    type ListAuditLogsParams,
    type ListAdminOrgsParams,
    type UpdateAdminOrgInput,
    type CreateFeatureFlagInput,
    type UpdateFeatureFlagInput,
    type ActivityParams,
    type AlertsParams,
    type ListUsersParams,
} from '@/lib/api'

/**
 * Query key factory for admin
 */
export const adminKeys = {
    all: ['admin'] as const,
    config: () => [...adminKeys.all, 'config'] as const,
    dashboard: () => [...adminKeys.all, 'dashboard'] as const,
    overview: () => [...adminKeys.dashboard(), 'overview'] as const,
    activity: (params?: ActivityParams) => [...adminKeys.dashboard(), 'activity', params] as const,
    alerts: (params?: AlertsParams) => [...adminKeys.dashboard(), 'alerts', params] as const,
    auditLogs: (params: ListAuditLogsParams) =>
        [...adminKeys.all, 'audit', params] as const,
    orgs: () => [...adminKeys.all, 'orgs'] as const,
    orgsList: (params?: ListAdminOrgsParams) =>
        [...adminKeys.orgs(), 'list', params] as const,
    orgDetail: (orgId: string) => [...adminKeys.orgs(), 'detail', orgId] as const,
    flags: () => [...adminKeys.all, 'flags'] as const,
    flagsList: () => [...adminKeys.flags(), 'list'] as const,
    flagDetail: (flagId: string) => [...adminKeys.flags(), 'detail', flagId] as const,
    users: () => [...adminKeys.all, 'users'] as const,
    usersList: (params: ListUsersParams) => [...adminKeys.users(), 'list', params] as const,
    userDetail: (userId: string) => [...adminKeys.users(), 'detail', userId] as const,
}

// =============================================================================
// Dashboard Hooks
// =============================================================================

/**
 * Hook to fetch dashboard overview metrics
 * Metrics are cached for 5 minutes server-side
 */
export function useAdminStats() {
    return useQuery({
        queryKey: adminKeys.overview(),
        queryFn: () => adminDashboard.getOverview(),
        staleTime: 5 * 60 * 1000, // Match server-side cache TTL
    })
}

/**
 * Hook to fetch system health alerts
 */
export function useSystemHealth(params?: AlertsParams) {
    return useQuery({
        queryKey: adminKeys.alerts(params),
        queryFn: () => adminDashboard.getAlerts(params),
        refetchInterval: 60 * 1000, // Refresh every minute for alerts
    })
}

/**
 * Hook to fetch recent activity feed
 */
export function useRecentActivity(params?: ActivityParams) {
    return useQuery({
        queryKey: adminKeys.activity(params),
        queryFn: () => adminDashboard.getActivity(params),
    })
}

// =============================================================================
// System Configuration Hooks
// =============================================================================

/**
 * Hook to fetch system configuration
 */
export function useSystemConfig() {
    return useQuery({
        queryKey: adminKeys.config(),
        queryFn: () => admin.getConfig(),
    })
}

/**
 * Hook to update email configuration
 */
export function useUpdateEmailConfig() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (data: UpdateEmailConfigInput) =>
            admin.updateEmailConfig(data),
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: adminKeys.config(),
            })
        },
    })
}

/**
 * Hook to update rate limit configuration
 */
export function useUpdateRateLimitConfig() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (data: UpdateRateLimitConfigInput) =>
            admin.updateRateLimitConfig(data),
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: adminKeys.config(),
            })
        },
    })
}

/**
 * Hook to update security configuration
 */
export function useUpdateSecurityConfig() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (data: UpdateSecurityConfigInput) =>
            admin.updateSecurityConfig(data),
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: adminKeys.config(),
            })
        },
    })
}

/**
 * Hook to update storage configuration
 */
export function useUpdateStorageConfig() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (data: UpdateStorageConfigInput) =>
            admin.updateStorageConfig(data),
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: adminKeys.config(),
            })
        },
    })
}

/**
 * Hook to test email configuration
 */
export function useTestEmailConfig() {
    return useMutation({
        mutationFn: () => admin.testEmailConfig(),
    })
}

/**
 * Hook to fetch audit logs
 */
export function useAuditLogs(params: ListAuditLogsParams = {}) {
    return useQuery({
        queryKey: adminKeys.auditLogs(params),
        queryFn: () => admin.listAuditLogs(params),
    })
}

/**
 * Hook to export audit logs
 */
export function useExportAuditLogs() {
    return useMutation({
        mutationFn: (params: ListAuditLogsParams) =>
            admin.exportAuditLogs(params),
        onSuccess: (blob) => {
            const url = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = `audit-logs-${Date.now()}.csv`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            URL.revokeObjectURL(url)
        },
    })
}

// =============================================================================
// User Management Hooks
// =============================================================================

/**
 * Hook to fetch paginated list of users with filtering
 */
export function useAdminUsers(params: ListUsersParams = {}) {
    const query = useQuery({
        queryKey: adminKeys.usersList(params),
        queryFn: () => adminUsers.list(params),
    })

    return {
        users: query.data?.users ?? [],
        total: query.data?.total ?? 0,
        page: query.data?.page ?? 1,
        limit: query.data?.limit ?? 20,
        totalPages: query.data?.totalPages ?? 0,
        isLoading: query.isLoading,
        isError: query.isError,
        error: query.error,
        refetch: query.refetch,
    }
}

/**
 * Hook to fetch a single user with full details
 */
export function useAdminUser(userId: string) {
    const query = useQuery({
        queryKey: adminKeys.userDetail(userId),
        queryFn: () => adminUsers.get(userId),
        enabled: Boolean(userId),
    })

    return {
        user: query.data?.user,
        isLoading: query.isLoading,
        isError: query.isError,
        error: query.error,
        refetch: query.refetch,
    }
}

/**
 * Hook for suspending a user
 */
export function useSuspendUser() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ userId, reason }: { userId: string; reason?: string }) =>
            adminUsers.suspend(userId, reason),
        onSuccess: (_, { userId }) => {
            void queryClient.invalidateQueries({ queryKey: adminKeys.users() })
            void queryClient.invalidateQueries({ queryKey: adminKeys.userDetail(userId) })
        },
    })
}

/**
 * Hook for unsuspending a user
 */
export function useUnsuspendUser() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (userId: string) => adminUsers.unsuspend(userId),
        onSuccess: (_, userId) => {
            void queryClient.invalidateQueries({ queryKey: adminKeys.users() })
            void queryClient.invalidateQueries({ queryKey: adminKeys.userDetail(userId) })
        },
    })
}

/**
 * Hook for banning a user
 */
export function useBanUser() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ userId, reason }: { userId: string; reason: string }) =>
            adminUsers.ban(userId, reason),
        onSuccess: (_, { userId }) => {
            void queryClient.invalidateQueries({ queryKey: adminKeys.users() })
            void queryClient.invalidateQueries({ queryKey: adminKeys.userDetail(userId) })
        },
    })
}

/**
 * Hook for unbanning a user
 */
export function useUnbanUser() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (userId: string) => adminUsers.unban(userId),
        onSuccess: (_, userId) => {
            void queryClient.invalidateQueries({ queryKey: adminKeys.users() })
            void queryClient.invalidateQueries({ queryKey: adminKeys.userDetail(userId) })
        },
    })
}

/**
 * Hook for verifying user email
 */
export function useVerifyEmail() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (userId: string) => adminUsers.verifyEmail(userId),
        onSuccess: (_, userId) => {
            void queryClient.invalidateQueries({ queryKey: adminKeys.users() })
            void queryClient.invalidateQueries({ queryKey: adminKeys.userDetail(userId) })
        },
    })
}

/**
 * Hook for sending password reset
 */
export function useSendPasswordReset() {
    return useMutation({
        mutationFn: (userId: string) => adminUsers.sendPasswordReset(userId),
    })
}

/**
 * Hook for revoking all sessions
 */
export function useRevokeAllSessions() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (userId: string) => adminUsers.revokeAllSessions(userId),
        onSuccess: (_, userId) => {
            void queryClient.invalidateQueries({ queryKey: adminKeys.userDetail(userId) })
        },
    })
}

/**
 * Hook for deleting a user
 */
export function useDeleteUser() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (userId: string) => adminUsers.delete(userId),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: adminKeys.users() })
        },
    })
}

/**
 * Combined hook for all user actions
 */
export function useUserActions() {
    return {
        suspend: useSuspendUser(),
        unsuspend: useUnsuspendUser(),
        ban: useBanUser(),
        unban: useUnbanUser(),
        verifyEmail: useVerifyEmail(),
        sendPasswordReset: useSendPasswordReset(),
        revokeAllSessions: useRevokeAllSessions(),
        deleteUser: useDeleteUser(),
    }
}

// =============================================================================
// Organization Hooks
// =============================================================================

/**
 * Hook to fetch all organizations with filtering
 */
export function useAdminOrgs(params?: ListAdminOrgsParams) {
    const query = useQuery({
        queryKey: adminKeys.orgsList(params),
        queryFn: () => adminOrgs.list(params),
    })

    return {
        organizations: query.data?.organizations ?? [],
        total: query.data?.total ?? 0,
        isLoading: query.isLoading,
        isError: query.isError,
        error: query.error,
        refetch: query.refetch,
    }
}

/**
 * Hook to fetch a single organization with details
 */
export function useAdminOrg(orgId: string) {
    const query = useQuery({
        queryKey: adminKeys.orgDetail(orgId),
        queryFn: () => adminOrgs.get(orgId),
        enabled: Boolean(orgId),
    })

    return {
        organization: query.data?.organization,
        isLoading: query.isLoading,
        isError: query.isError,
        error: query.error,
        refetch: query.refetch,
    }
}

/**
 * Hook to update an organization
 */
export function useUpdateAdminOrg(orgId: string) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (data: UpdateAdminOrgInput) => adminOrgs.update(orgId, data),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: adminKeys.orgDetail(orgId) })
            void queryClient.invalidateQueries({ queryKey: adminKeys.orgs() })
        },
    })
}

/**
 * Hook to suspend an organization
 */
export function useSuspendOrg() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (orgId: string) => adminOrgs.suspend(orgId),
        onSuccess: (_data, orgId) => {
            void queryClient.invalidateQueries({ queryKey: adminKeys.orgDetail(orgId) })
            void queryClient.invalidateQueries({ queryKey: adminKeys.orgs() })
        },
    })
}

/**
 * Hook to reactivate an organization
 */
export function useReactivateOrg() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (orgId: string) => adminOrgs.reactivate(orgId),
        onSuccess: (_data, orgId) => {
            void queryClient.invalidateQueries({ queryKey: adminKeys.orgDetail(orgId) })
            void queryClient.invalidateQueries({ queryKey: adminKeys.orgs() })
        },
    })
}

/**
 * Hook to delete an organization
 */
export function useDeleteAdminOrg() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (orgId: string) => adminOrgs.delete(orgId),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: adminKeys.orgs() })
        },
    })
}

// =============================================================================
// Feature Flag Hooks
// =============================================================================

/**
 * Hook to fetch all feature flags
 */
export function useFeatureFlags() {
    const query = useQuery({
        queryKey: adminKeys.flagsList(),
        queryFn: () => featureFlags.list(),
    })

    return {
        flags: query.data?.flags ?? [],
        isLoading: query.isLoading,
        isError: query.isError,
        error: query.error,
        refetch: query.refetch,
    }
}

/**
 * Hook to fetch a single feature flag
 */
export function useFeatureFlag(flagId: string) {
    const query = useQuery({
        queryKey: adminKeys.flagDetail(flagId),
        queryFn: () => featureFlags.get(flagId),
        enabled: Boolean(flagId),
    })

    return {
        flag: query.data?.flag,
        isLoading: query.isLoading,
        isError: query.isError,
        error: query.error,
        refetch: query.refetch,
    }
}

/**
 * Hook for feature flag actions (create, update, delete, toggle)
 */
export function useFeatureFlagActions() {
    const queryClient = useQueryClient()

    const createFlag = useMutation({
        mutationFn: (data: CreateFeatureFlagInput) => featureFlags.create(data),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: adminKeys.flagsList() })
        },
    })

    const updateFlag = useMutation({
        mutationFn: ({ flagId, data }: { flagId: string; data: UpdateFeatureFlagInput }) =>
            featureFlags.update(flagId, data),
        onSuccess: (_data, { flagId }) => {
            void queryClient.invalidateQueries({ queryKey: adminKeys.flagDetail(flagId) })
            void queryClient.invalidateQueries({ queryKey: adminKeys.flagsList() })
        },
    })

    const deleteFlag = useMutation({
        mutationFn: (flagId: string) => featureFlags.delete(flagId),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: adminKeys.flagsList() })
        },
    })

    const toggleFlag = useMutation({
        mutationFn: ({ flagId, enabled }: { flagId: string; enabled: boolean }) =>
            featureFlags.toggle(flagId, enabled),
        onSuccess: (_data, { flagId }) => {
            void queryClient.invalidateQueries({ queryKey: adminKeys.flagDetail(flagId) })
            void queryClient.invalidateQueries({ queryKey: adminKeys.flagsList() })
        },
    })

    return {
        createFlag,
        updateFlag,
        deleteFlag,
        toggleFlag,
    }
}
