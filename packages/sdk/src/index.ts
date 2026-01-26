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

// React hooks
export { useBundleNudge, useCodePush } from './hooks'
export type { UseBundleNudgeResult, BundleNudgeStatus } from './hooks'

// Setup utilities
export {
  setupBundleNudge,
  setupCodePush,
  getBundleNudgeStatus,
  recordCrash,
} from './setup'
export { withBundleNudge, withCodePush } from './setup/hoc'
export type { SetupOptions, BundleNudgeDebugStatus } from './setup'

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

// Crash reporter integrations
export {
  tagCrashReporters,
  tagSentry,
  tagBugsnag,
  tagCrashlytics,
  clearCrashReporterTags,
} from './integrations'
export type { ReleaseMetadata, TaggingResult } from './integrations'

// Metrics tracking
export { MetricsTracker } from './metrics'
export { startSessionTracking } from './metrics'
export type {
  MetricEventType,
  MetricEvent,
  VariantInfo,
  MetricsConfig,
} from './metrics'

// Background/preload downloads
export { PreloadManager, preloadUpdate } from './background'
export { getDeviceConditions, shouldDownload } from './background'
export type { DeviceConditions, PreloadConfig, PreloadResult } from './background'

// Upload client (CLI/CI)
export { UploadClient, uploadBundle } from './upload'
export type {
  UploadConfig,
  UploadOptions,
  UploadResult,
  UploadJobStatus,
} from './upload'

// Debug utilities
export {
  setDebugEnabled,
  isDebugEnabled,
  logDebug,
  logInfo,
  logWarn,
  logError,
  getRecentLogs,
  clearLogs,
} from './debug'
export type { LogLevel, LogEntry } from './debug'

// Native helpers
export {
  restartApp,
  clearAllUpdates,
  notifyAppReady,
  getCurrentBundlePath,
  hasPendingUpdate,
  getNativeInfo,
} from './native'
export type { RestartOptions, NativeInfo } from './native'
