/**
 * Updater
 *
 * Handles update checking, downloading, and installation.
 */

import { Platform } from 'react-native'
import type {
  UpdateInfo,
  UpdateCheckResult,
  DownloadProgress,
  BundleNudgeConfig,
  NativeModuleInterface,
} from './types'
import type { Storage } from './storage'
import { retry, sha256, arrayBufferToBase64 } from './utils'

/**
 * Threshold for warning about large bundle downloads.
 * Bundles above this size may cause memory pressure on low-end devices.
 */
const LARGE_BUNDLE_WARNING_SIZE = 5 * 1024 * 1024 // 5MB

export interface UpdaterDependencies {
  storage: Storage
  config: BundleNudgeConfig
  nativeModule: NativeModuleInterface
  onProgress?: (progress: DownloadProgress) => void
}

interface UpdateCheckResponse {
  updateAvailable: boolean
  requiresAppStoreUpdate?: boolean
  appStoreMessage?: string
  release?: {
    version: string
    bundleUrl: string
    bundleSize: number
    bundleHash: string
    releaseId: string
    releaseNotes?: string
  }
}

export class Updater {
  private storage: Storage
  private config: BundleNudgeConfig
  private nativeModule: NativeModuleInterface
  private onProgress?: (progress: DownloadProgress) => void

  constructor(deps: UpdaterDependencies) {
    this.storage = deps.storage
    this.config = deps.config
    this.nativeModule = deps.nativeModule
    this.onProgress = deps.onProgress
  }

  /**
   * Check for available updates.
   */
  async checkForUpdate(): Promise<UpdateCheckResult> {
    const apiUrl = this.config.apiUrl ?? 'https://api.bundlenudge.com'
    const deviceId = this.storage.getDeviceId()
    const accessToken = this.storage.getAccessToken()
    const currentVersion = this.storage.getCurrentVersion()

    const appVersion = await this.getAppVersion()

    const response = await retry(() =>
      fetch(`${apiUrl}/v1/updates/check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
        },
        body: JSON.stringify({
          appId: this.config.appId,
          deviceId,
          platform: this.getPlatform(),
          appVersion,
          currentBundleVersion: currentVersion,
        }),
      })
    )

    if (!response.ok) {
      throw new Error(`Update check failed: ${String(response.status)}`)
    }

    const data = (await response.json()) as UpdateCheckResponse

    if (data.updateAvailable && data.release) {
      return {
        updateAvailable: true,
        update: {
          version: data.release.version,
          bundleUrl: data.release.bundleUrl,
          bundleSize: data.release.bundleSize,
          bundleHash: data.release.bundleHash,
          releaseId: data.release.releaseId,
          releaseNotes: data.release.releaseNotes,
        },
      }
    }

    if (data.requiresAppStoreUpdate) {
      return {
        updateAvailable: false,
        requiresAppStoreUpdate: true,
        appStoreMessage: data.appStoreMessage,
      }
    }

    return { updateAvailable: false }
  }

  /**
   * Download and install an update.
   *
   * NOTE: Memory usage considerations
   * Currently, the bundle is loaded entirely into memory as an ArrayBuffer,
   * then converted to base64 (adding ~33% overhead) for passing to the native module.
   * For a 10MB bundle, this can result in 23MB+ memory usage with JS thread blocking.
   *
   * TODO: Implement streaming download directly to native filesystem
   * - Use native module to handle HTTP download and file write
   * - Avoid JS memory pressure for large bundles
   * - Enable chunk-based progress reporting
   * - This requires native code changes on both iOS and Android
   */
  async downloadAndInstall(update: UpdateInfo): Promise<void> {
    // Download bundle
    const bundle = await this.downloadBundle(update)

    // Warn about large bundle sizes that may cause memory pressure
    if (bundle.byteLength > LARGE_BUNDLE_WARNING_SIZE) {
      const sizeMB = (bundle.byteLength / (1024 * 1024)).toFixed(2)
      console.warn(
        `[BundleNudge] Large bundle detected (${sizeMB}MB). ` +
          'Consider reducing bundle size to improve download performance ' +
          'and reduce memory pressure on low-end devices.'
      )
    }

    // Verify hash
    const actualHash = await sha256(bundle)
    if (actualHash !== update.bundleHash) {
      throw new Error('Bundle hash mismatch')
    }

    // Save bundle to filesystem
    await this.saveBundle(update.version, bundle)

    // Mark as pending update
    await this.storage.setPendingUpdate(update.version, update.bundleHash)

    // Report success to server
    await this.reportUpdateDownloaded(update)
  }

  /**
   * Downloads the bundle into memory.
   *
   * TODO: Replace with native streaming implementation
   * Current limitations:
   * - Entire bundle loaded into JS memory as ArrayBuffer
   * - Progress reporting only shows 0% -> 100% (no incremental updates)
   * - Large bundles (>5MB) may cause memory pressure on low-end devices
   *
   * Future implementation should:
   * - Use native HTTP client for streaming download
   * - Write chunks directly to filesystem
   * - Report progress incrementally during download
   * - Never hold full bundle in JS memory
   */
  private async downloadBundle(update: UpdateInfo): Promise<ArrayBuffer> {
    const response = await fetch(update.bundleUrl)

    if (!response.ok) {
      throw new Error(`Bundle download failed: ${String(response.status)}`)
    }

    // Get content length for progress reporting
    const contentLength = parseInt(
      response.headers.get('content-length') ?? '0',
      10
    )

    // Report initial progress
    if (this.onProgress && contentLength > 0) {
      this.onProgress({
        bytesDownloaded: 0,
        totalBytes: contentLength,
        percentage: 0,
      })
    }

    // Download as ArrayBuffer (streaming not reliably available in RN)
    // TODO: This loads the entire bundle into memory. For large bundles,
    // implement native streaming to write directly to filesystem.
    const buffer = await response.arrayBuffer()

    // Report completion
    if (this.onProgress) {
      this.onProgress({
        bytesDownloaded: buffer.byteLength,
        totalBytes: buffer.byteLength,
        percentage: 100,
      })
    }

    return buffer
  }

  private async saveBundle(
    version: string,
    bundle: ArrayBuffer
  ): Promise<string> {
    // Convert ArrayBuffer to base64 for passing to native module
    // TODO: This conversion adds ~33% memory overhead and blocks the JS thread.
    // Future native streaming implementation should eliminate this step.
    const base64Data = arrayBufferToBase64(bundle)

    // Save to native filesystem via native module
    const savedPath = await this.nativeModule.saveBundleToStorage(
      version,
      base64Data
    )

    return savedPath
  }

  private async reportUpdateDownloaded(update: UpdateInfo): Promise<void> {
    const apiUrl = this.config.apiUrl ?? 'https://api.bundlenudge.com'
    const accessToken = this.storage.getAccessToken()

    try {
      await fetch(`${apiUrl}/v1/telemetry`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
        },
        body: JSON.stringify({
          deviceId: this.storage.getDeviceId(),
          appId: this.config.appId,
          eventType: 'update_downloaded',
          releaseId: update.releaseId,
          bundleVersion: update.version,
          timestamp: Date.now(),
        }),
      })
    } catch {
      // Telemetry failure is non-fatal
    }
  }

  private getPlatform(): 'ios' | 'android' {
    return Platform.OS as 'ios' | 'android'
  }

  private async getAppVersion(): Promise<string> {
    const config = await this.nativeModule.getConfiguration()
    return config.appVersion
  }
}
