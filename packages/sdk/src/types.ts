/**
 * SDK Types
 *
 * Type definitions for the BundleNudge SDK.
 */

export interface BundleNudgeConfig {
  /** App ID from BundleNudge dashboard */
  appId: string

  /** API base URL (defaults to production) */
  apiUrl?: string

  /** Enable debug logging */
  debug?: boolean

  /** Check for updates on app launch (default: true) */
  checkOnLaunch?: boolean

  /** Check for updates when app comes to foreground (default: true) */
  checkOnForeground?: boolean

  /** Install update immediately or on next launch (default: 'nextLaunch') */
  installMode?: 'immediate' | 'nextLaunch'

  /** Minimum seconds between update checks (default: 60) */
  minimumCheckInterval?: number
}

export type UpdateStatus =
  | 'idle'
  | 'checking'
  | 'downloading'
  | 'installing'
  | 'up-to-date'
  | 'update-available'
  | 'error'

export interface UpdateInfo {
  version: string
  bundleUrl: string
  bundleSize: number
  bundleHash: string
  releaseId: string
  releaseNotes?: string
}

export interface DownloadProgress {
  bytesDownloaded: number
  totalBytes: number
  percentage: number
}

export interface UpdateCheckResult {
  updateAvailable: boolean
  requiresAppStoreUpdate?: boolean
  appStoreMessage?: string
  update?: UpdateInfo
}

export interface StoredMetadata {
  deviceId: string
  accessToken: string | null
  currentVersion: string | null
  currentVersionHash: string | null
  previousVersion: string | null
  pendingVersion: string | null
  pendingUpdateFlag: boolean
  lastCheckTime: number | null
  crashCount: number
  lastCrashTime: number | null
}

export interface NativeModuleInterface {
  getConfiguration(): Promise<{
    appVersion: string
    buildNumber: string
    bundleId: string
  }>

  getCurrentBundleInfo(): Promise<{
    currentVersion: string | null
    currentVersionHash: string | null
    pendingVersion: string | null
    previousVersion: string | null
  } | null>

  getBundlePath(): Promise<string | null>

  notifyAppReady(): Promise<boolean>

  restartApp(onlyIfUpdateIsPending: boolean): Promise<boolean>

  clearUpdates(): Promise<boolean>
}
