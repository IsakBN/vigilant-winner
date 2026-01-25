/**
 * Updater
 *
 * Handles update checking, downloading, and installation.
 */

import type {
  UpdateInfo,
  UpdateCheckResult,
  DownloadProgress,
  BundleNudgeConfig,
} from './types'
import type { Storage } from './storage'
import { retry, sha256 } from './utils'

export interface UpdaterDependencies {
  storage: Storage
  config: BundleNudgeConfig
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
  private onProgress?: (progress: DownloadProgress) => void

  constructor(deps: UpdaterDependencies) {
    this.storage = deps.storage
    this.config = deps.config
    this.onProgress = deps.onProgress
  }

  /**
   * Check for available updates.
   */
  async checkForUpdate(): Promise<UpdateCheckResult> {
    const apiUrl = this.config.apiUrl || 'https://api.bundlenudge.com'
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
      throw new Error(`Update check failed: ${response.status}`)
    }

    const data: UpdateCheckResponse = await response.json()

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
   */
  async downloadAndInstall(update: UpdateInfo): Promise<void> {
    // Download bundle
    const bundle = await this.downloadBundle(update)

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

  private async downloadBundle(update: UpdateInfo): Promise<ArrayBuffer> {
    const response = await fetch(update.bundleUrl)

    if (!response.ok) {
      throw new Error(`Bundle download failed: ${response.status}`)
    }

    const contentLength = parseInt(
      response.headers.get('content-length') || '0',
      10
    )

    if (!response.body) {
      return await response.arrayBuffer()
    }

    // Stream download with progress
    const reader = response.body.getReader()
    const chunks: Uint8Array[] = []
    let bytesDownloaded = 0

    while (true) {
      const { done, value } = await reader.read()

      if (done) break

      chunks.push(value)
      bytesDownloaded += value.length

      if (this.onProgress && contentLength > 0) {
        this.onProgress({
          bytesDownloaded,
          totalBytes: contentLength,
          percentage: Math.round((bytesDownloaded / contentLength) * 100),
        })
      }
    }

    // Combine chunks
    const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0)
    const result = new Uint8Array(totalLength)
    let offset = 0

    for (const chunk of chunks) {
      result.set(chunk, offset)
      offset += chunk.length
    }

    return result.buffer
  }

  private async saveBundle(
    _version: string,
    _bundle: ArrayBuffer
  ): Promise<void> {
    // TODO: Save to native filesystem via native module
    // The native module will handle writing to the correct location
  }

  private async reportUpdateDownloaded(update: UpdateInfo): Promise<void> {
    const apiUrl = this.config.apiUrl || 'https://api.bundlenudge.com'
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
    // TODO: Get from React Native Platform module
    return 'ios'
  }

  private async getAppVersion(): Promise<string> {
    // TODO: Get from native module
    return '1.0.0'
  }
}
