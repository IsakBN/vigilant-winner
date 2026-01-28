/**
 * Admin OTA Operations Types
 *
 * Types for OTA metrics, build queue, API health, storage, logs, and admin apps.
 */

// =============================================================================
// OTA Update Metrics
// =============================================================================

export type OtaMetricsPeriod = '24h' | '7d' | '30d'

export interface OtaMetricsAppBreakdown {
  appId: string
  appName: string
  updates: number
  failures: number
}

export interface OtaMetricsHourlyBreakdown {
  hour: string
  success: number
  failed: number
}

export interface OtaMetrics {
  period: OtaMetricsPeriod
  totalUpdates: number
  successfulUpdates: number
  failedUpdates: number
  successRate: number
  downloadBytes: number
  uniqueDevices: number
  byApp: OtaMetricsAppBreakdown[]
  hourlyBreakdown: OtaMetricsHourlyBreakdown[]
}

// =============================================================================
// Build Queue
// =============================================================================

export type BuildJobStatus =
  | 'queued'
  | 'building'
  | 'uploading'
  | 'completed'
  | 'failed'

export interface BuildJob {
  id: string
  appId: string
  appName: string
  version: string
  status: BuildJobStatus
  progress: number
  startedAt: number | null
  completedAt: number | null
  error: string | null
  workerId: string | null
}

export type WorkerStatus = 'idle' | 'busy' | 'offline'

export interface BuildWorker {
  id: string
  status: WorkerStatus
  currentJob: string | null
  jobsCompleted: number
}

export interface BuildQueueStats {
  queueDepth: number
  activeJobs: number
  completedToday: number
  failedToday: number
  avgBuildTime: number
  workers: BuildWorker[]
  jobs: BuildJob[]
}

// =============================================================================
// API Health
// =============================================================================

export interface ApiEndpointStats {
  path: string
  method: string
  avgLatency: number
  p95Latency: number
  requestCount: number
  errorCount: number
  errorRate: number
}

export interface ApiRecentError {
  id: string
  timestamp: number
  endpoint: string
  status: number
  message: string
  requestId: string
}

export interface ApiHealthStats {
  endpoints: ApiEndpointStats[]
  rateLimiting: {
    totalBlocked: number
    byEndpoint: Record<string, number>
  }
  activeConnections: number
  recentErrors: ApiRecentError[]
}

// =============================================================================
// Storage Metrics
// =============================================================================

export interface StorageAppMetrics {
  appId: string
  appName: string
  bytes: number
  bundleCount: number
}

export interface StorageLargestBundle {
  id: string
  appName: string
  version: string
  bytes: number
  createdAt: number
}

export interface StorageGrowthEntry {
  date: string
  totalBytes: number
}

export interface StorageMetrics {
  totalBytes: number
  totalBundles: number
  byApp: StorageAppMetrics[]
  largestBundles: StorageLargestBundle[]
  orphanedBundles: number
  growthHistory: StorageGrowthEntry[]
}

// =============================================================================
// System Logs
// =============================================================================

export type LogLevel = 'error' | 'warn' | 'info' | 'debug'
export type LogService = 'api' | 'worker' | 'dashboard'

export interface LogEntry {
  id: string
  timestamp: number
  level: LogLevel
  service: LogService
  message: string
  metadata: Record<string, unknown>
}

export interface LogsResponse {
  logs: LogEntry[]
  total: number
  hasMore: boolean
}

export interface ListLogsParams {
  level?: LogLevel
  service?: LogService
  search?: string
  startTime?: number
  endTime?: number
  page?: number
  limit?: number
}

// =============================================================================
// Database Stats
// =============================================================================

export interface DatabaseTable {
  name: string
  rowCount: number
  sizeBytes: number
}

export interface SlowQuery {
  query: string
  avgTime: number
  count: number
}

export interface DatabaseStats {
  tables: DatabaseTable[]
  totalSize: number
  queryMetrics: {
    avgQueryTime: number
    slowQueries: number
    queriesPerMinute: number
  }
  slowQueries: SlowQuery[]
}

// =============================================================================
// Admin Apps
// =============================================================================

export type AdminAppPlatform = 'ios' | 'android' | 'both'
export type AdminAppStatus = 'active' | 'disabled'

export interface AdminApp {
  id: string
  name: string
  orgId: string
  orgName: string
  platform: AdminAppPlatform
  bundleCount: number
  totalDownloads: number
  lastUpdate: number | null
  status: AdminAppStatus
  createdAt: number
}

export type AdminAppSortBy = 'name' | 'createdAt' | 'totalDownloads' | 'lastUpdate'
export type SortOrder = 'asc' | 'desc'

export interface ListAdminAppsParams {
  search?: string
  status?: AdminAppStatus
  orgId?: string
  page?: number
  limit?: number
  sortBy?: AdminAppSortBy
  sortOrder?: SortOrder
}

export interface AdminAppsResponse {
  apps: AdminApp[]
  total: number
  page: number
  totalPages: number
}
