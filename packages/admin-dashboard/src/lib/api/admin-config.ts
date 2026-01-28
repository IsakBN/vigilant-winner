/**
 * Admin Config API
 *
 * Provides methods for system configuration and audit logs.
 */

import { apiClient, buildQueryString, API_URL } from './client'
import type {
    GetSystemConfigResponse,
    UpdateConfigResponse,
    UpdateEmailConfigInput,
    UpdateRateLimitConfigInput,
    UpdateSecurityConfigInput,
    UpdateStorageConfigInput,
    ListAuditLogsParams,
    ListAuditLogsResponse,
} from './types'

/**
 * Admin Config API methods
 */
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
    updateRateLimitConfig(data: UpdateRateLimitConfigInput): Promise<UpdateConfigResponse> {
        return apiClient.patch('/admin/config/rate-limit', data)
    },

    /**
     * Update security configuration
     */
    updateSecurityConfig(data: UpdateSecurityConfigInput): Promise<UpdateConfigResponse> {
        return apiClient.patch('/admin/config/security', data)
    },

    /**
     * Update storage configuration
     */
    updateStorageConfig(data: UpdateStorageConfigInput): Promise<UpdateConfigResponse> {
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
        const response = await fetch(`${API_URL}/admin/audit/export${query}`, {
            credentials: 'include',
        })
        return response.blob()
    },
}

/**
 * Audit Logs API (standalone)
 */
export const auditLogs = {
    /**
     * List audit logs with filtering
     */
    list(params: ListAuditLogsParams = {}): Promise<ListAuditLogsResponse> {
        return admin.listAuditLogs(params)
    },

    /**
     * Export audit logs as CSV
     */
    exportCsv(params: ListAuditLogsParams = {}): Promise<Blob> {
        return admin.exportAuditLogs(params)
    },
}
