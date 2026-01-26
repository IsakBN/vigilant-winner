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

  /** Verification window in ms (default: 60000 = 60 seconds) */
  verificationWindowMs?: number

  /** Number of crashes before rollback (default: 3) */
  crashThreshold?: number

  /** Time window for crash counting in ms (default: 10000 = 10 seconds) */
  crashWindowMs?: number
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

// StoredMetadata is now defined in storage.ts using Zod schema
// Re-export for backward compatibility
export type { StoredMetadata } from './storage'

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

  /**
   * Save a bundle to native filesystem storage.
   * @param version - The version identifier for the bundle
   * @param bundleData - Base64 encoded bundle data
   * @returns The path where the bundle was saved
   */
  saveBundleToStorage(version: string, bundleData: string): Promise<string>
}
