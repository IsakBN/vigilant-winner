/**
 * BundleNudge SDK
 *
 * React Native SDK for OTA updates.
 */

export { BundleNudge } from './bundlenudge'
export { Storage } from './storage'
export { Updater } from './updater'
export { RollbackManager } from './rollback-manager'
export { CrashDetector } from './crash-detector'

// Health monitoring exports
export {
  startHealthMonitoring,
  reportHealthEvent,
  stopHealthMonitoring,
  isHealthMonitoringActive,
  getHealthMonitoringState,
  DEFAULT_HEALTH_WINDOW_MS,
  DEFAULT_HEALTH_FAILURE_THRESHOLD,
} from './health'

// Endpoint health check exports
export {
  HealthCheckService,
  createHealthCheckService,
  DEFAULT_TIMEOUT_MS,
  DEFAULT_RETRY_COUNT,
  DEFAULT_RETRY_DELAY_MS,
} from './health-check'

export type { BundleNudgeCallbacks } from './bundlenudge'
export type {
  BundleNudgeConfig,
  UpdateStatus,
  UpdateInfo,
  DownloadProgress,
  UpdateCheckResult,
} from './types'
export type {
  HealthCheckConfig,
  HealthFailureReport,
  HealthMonitoringState,
} from './health'

// Endpoint health check types
export type {
  EndpointHealthCheckConfig,
  EndpointConfig,
  EndpointResult,
  EndpointHealthCheckResult,
  HealthCheckServiceConfig,
} from './health-check'
