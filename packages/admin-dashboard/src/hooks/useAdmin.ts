'use client'

/**
 * useAdmin Hooks
 *
 * TanStack Query hooks for admin dashboard, system configuration, and audit logs.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
    admin,
    adminDashboard,
    type UpdateEmailConfigInput,
    type UpdateRateLimitConfigInput,
    type UpdateSecurityConfigInput,
    type UpdateStorageConfigInput,
    type ListAuditLogsParams,
    type ListAdminOrgsParams,
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
        staleTime: 5 * 60 * 1000,
    })
}

/**
 * Hook to fetch system health alerts
 */
export function useSystemHealth(params?: AlertsParams) {
    return useQuery({
        queryKey: adminKeys.alerts(params),
        queryFn: () => adminDashboard.getAlerts(params),
        refetchInterval: 60 * 1000,
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
            link.download = `audit-logs-${String(Date.now())}.csv`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            URL.revokeObjectURL(url)
        },
    })
}
