/**
 * Admin Operations API for BundleNudge Admin Dashboard
 *
 * Provides typed API methods for OTA metrics, build queue, API health,
 * storage metrics, system logs, database stats, and admin app management.
 */

import { apiClient, buildQueryString, API_URL } from './client'
import type {
  OtaMetrics,
  OtaMetricsPeriod,
  BuildQueueStats,
  BuildJob,
  ApiHealthStats,
  StorageMetrics,
  LogsResponse,
  ListLogsParams,
  DatabaseStats,
  AdminAppsResponse,
  ListAdminAppsParams,
  AdminApp,
  AdminAppStatus,
} from './types/admin'

const BASE = '/admin'

// =============================================================================
// OTA Metrics
// =============================================================================

/**
 * Get OTA update metrics for a given period
 */
export function getOtaMetrics(period: OtaMetricsPeriod = '24h'): Promise<OtaMetrics> {
  return apiClient.get(`${BASE}/metrics/ota?period=${period}`)
}

// =============================================================================
// Build Queue
// =============================================================================

/**
 * Get build queue statistics and current jobs
 */
export function getBuildQueue(): Promise<BuildQueueStats> {
  return apiClient.get(`${BASE}/builds/queue`)
}

/**
 * Cancel a build job
 */
export function cancelBuild(jobId: string): Promise<{ success: boolean }> {
  return apiClient.post(`${BASE}/builds/${jobId}/cancel`)
}

/**
 * Retry a failed build job
 */
export function retryBuild(jobId: string): Promise<{ job: BuildJob }> {
  return apiClient.post(`${BASE}/builds/${jobId}/retry`)
}

// =============================================================================
// API Health
// =============================================================================

/**
 * Get API health statistics
 */
export function getApiHealth(): Promise<ApiHealthStats> {
  return apiClient.get(`${BASE}/health/api`)
}

// =============================================================================
// Storage Metrics
// =============================================================================

/**
 * Get storage metrics including bundle sizes and growth
 */
export function getStorageMetrics(): Promise<StorageMetrics> {
  return apiClient.get(`${BASE}/metrics/storage`)
}

/**
 * Clean up orphaned bundles
 */
export function cleanupOrphanedBundles(): Promise<{ deleted: number }> {
  return apiClient.post(`${BASE}/storage/cleanup`)
}

// =============================================================================
// System Logs
// =============================================================================

/**
 * Get system logs with filtering
 */
export function getSystemLogs(params: ListLogsParams = {}): Promise<LogsResponse> {
  const query = buildQueryString({
    level: params.level,
    service: params.service,
    search: params.search,
    startTime: params.startTime,
    endTime: params.endTime,
    page: params.page,
    limit: params.limit,
  })
  return apiClient.get(`${BASE}/logs${query}`)
}

/**
 * Export logs as a downloadable file
 */
export async function exportLogs(params: ListLogsParams = {}): Promise<Blob> {
  const query = buildQueryString({
    level: params.level,
    service: params.service,
    search: params.search,
    startTime: params.startTime,
    endTime: params.endTime,
  })
  const response = await fetch(`${API_URL}${BASE}/logs/export${query}`, {
    credentials: 'include',
  })
  return response.blob()
}

// =============================================================================
// Database Stats
// =============================================================================

/**
 * Get database statistics
 */
export function getDatabaseStats(): Promise<DatabaseStats> {
  return apiClient.get(`${BASE}/metrics/database`)
}

// =============================================================================
// Admin Apps
// =============================================================================

/**
 * List all apps with admin-level filtering
 */
export function listAdminApps(params: ListAdminAppsParams = {}): Promise<AdminAppsResponse> {
  const query = buildQueryString({
    search: params.search,
    status: params.status,
    orgId: params.orgId,
    page: params.page,
    limit: params.limit,
    sortBy: params.sortBy,
    sortOrder: params.sortOrder,
  })
  return apiClient.get(`${BASE}/apps${query}`)
}

/**
 * Get a single app with admin details
 */
export function getAdminApp(appId: string): Promise<AdminApp> {
  return apiClient.get(`${BASE}/apps/${appId}`)
}

/**
 * Update an app's status (active/disabled)
 */
export function updateAppStatus(
  appId: string,
  status: AdminAppStatus
): Promise<{ success: boolean }> {
  return apiClient.patch(`${BASE}/apps/${appId}`, { status })
}

/**
 * Delete an app (admin only)
 */
export function deleteAdminApp(appId: string): Promise<{ success: boolean }> {
  return apiClient.delete(`${BASE}/apps/${appId}`)
}

// =============================================================================
// Aggregated Admin Ops Object
// =============================================================================

export const adminOps = {
  // OTA Metrics
  getOtaMetrics,

  // Build Queue
  getBuildQueue,
  cancelBuild,
  retryBuild,

  // API Health
  getApiHealth,

  // Storage
  getStorageMetrics,
  cleanupOrphanedBundles,

  // Logs
  getSystemLogs,
  exportLogs,

  // Database
  getDatabaseStats,

  // Apps
  listAdminApps,
  getAdminApp,
  updateAppStatus,
  deleteAdminApp,
}
