/**
 * API Module Barrel Export
 *
 * Re-exports all API modules from a single entry point.
 */

// Client exports
export { apiClient, apiFetch, buildQueryString, API_URL, ApiClientError } from './client'
export type { ApiFetchOptions } from './client'

// Admin Dashboard
export { adminDashboard, checkAdminAccess } from './admin-dashboard'

// Admin Users
export { adminUsers } from './admin-users'

// Admin Organizations
export { adminOrgs } from './admin-orgs'

// Feature Flags
export { featureFlags } from './feature-flags'

// Admin Config & Audit Logs
export { admin, auditLogs } from './admin-config'

// Newsletter
export { newsletter } from './newsletter'

// Admin operations
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

// Type exports from types.ts (legacy)
export * from './types'

// Type exports from types/ directory (includes all types from ./types/admin, ./types/admin-users, etc.)
export * from './types/index'
