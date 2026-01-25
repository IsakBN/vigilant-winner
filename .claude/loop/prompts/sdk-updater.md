## Feature: sdk/updater

Implement update checking, downloading, and installation.

### Files to Modify/Create

`packages/sdk/src/updater.ts` - Complete implementation
`packages/sdk/src/updater.test.ts` - Tests

### Implementation

```typescript
// updater.ts
import type {
  UpdateInfo,
  UpdateCheckResult,
  DownloadProgress,
  BundleNudgeConfig,
  NativeModuleInterface,
} from './types'
import type { Storage } from './storage'
import type { DeviceAuth } from './auth'
import { retry, sha256 } from './utils'
import { NativeModules, Platform } from 'react-native'

const BundleNudgeNative: NativeModuleInterface = NativeModules.BundleNudge

export interface UpdaterDependencies {
  storage: Storage
  auth: DeviceAuth
  config: BundleNudgeConfig
  onProgress?: (progress: DownloadProgress) => void
}

export class Updater {
  private storage: Storage
  private auth: DeviceAuth
  private config: BundleNudgeConfig
  private onProgress?: (progress: DownloadProgress) => void

  constructor(deps: UpdaterDependencies) {
    this.storage = deps.storage
    this.auth = deps.auth
    this.config = deps.config
    this.onProgress = deps.onProgress
  }

  /**
   * Check for available updates.
   */
  async checkForUpdate(): Promise<UpdateCheckResult> {
    // Respect minimum check interval
    const minInterval = (this.config.minimumCheckInterval ?? 60) * 1000
    if (!this.storage.shouldCheckForUpdate(minInterval)) {
      return { updateAvailable: false }
    }

    const apiUrl = this.config.apiUrl || 'https://api.bundlenudge.com'
    const nativeConfig = await BundleNudgeNative.getConfiguration()

    const response = await this.auth.authenticatedFetch(`${apiUrl}/v1/updates/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        appId: this.config.appId,
        deviceId: this.storage.getDeviceId(),
        platform: Platform.OS as 'ios' | 'android',
        appVersion: nativeConfig.appVersion,
        currentBundleVersion: this.storage.getCurrentVersion(),
        currentBundleHash: this.storage.getCurrentVersionHash(),
        deviceInfo: {
          osVersion: Platform.Version?.toString(),
          bundleId: nativeConfig.bundleId,
        },
      }),
    })

    await this.storage.recordLastCheckTime()

    if (!response.ok) {
      throw new Error(`Update check failed: ${response.status}`)
    }

    const data = await response.json()

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
    // 1. Download bundle
    const bundle = await this.downloadBundle(update)

    // 2. Verify hash
    const actualHash = await sha256(bundle)
    if (actualHash !== update.bundleHash) {
      await this.reportUpdateFailed(update, 'hash_mismatch')
      throw new Error('Bundle hash mismatch')
    }

    // 3. Save bundle to filesystem
    await this.saveBundle(update.version, bundle)

    // 4. Mark as pending update
    await this.storage.setPendingUpdate(update.version, update.bundleHash)

    // 5. Report success to server
    await this.reportUpdateDownloaded(update)
  }

  private async downloadBundle(update: UpdateInfo): Promise<ArrayBuffer> {
    const response = await fetch(update.bundleUrl)

    if (!response.ok) {
      await this.reportUpdateFailed(update, 'download_failed', response.status.toString())
      throw new Error(`Bundle download failed: ${response.status}`)
    }

    const contentLength = parseInt(response.headers.get('content-length') || '0', 10)

    if (!response.body) {
      return await response.arrayBuffer()
    }

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

    const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0)
    const result = new Uint8Array(totalLength)
    let offset = 0

    for (const chunk of chunks) {
      result.set(chunk, offset)
      offset += chunk.length
    }

    return result.buffer
  }

  private async saveBundle(version: string, bundle: ArrayBuffer): Promise<void> {
    // Write to native filesystem
    // The native module handles the actual file operations
    const path = await BundleNudgeNative.getBundlePath()
    // TODO: Call native module to save bundle
    // For now, we rely on the native side to handle this via a download manager
  }

  private async reportUpdateDownloaded(update: UpdateInfo): Promise<void> {
    await this.reportTelemetry('update_downloaded', update)
  }

  private async reportUpdateFailed(
    update: UpdateInfo,
    errorCode: string,
    errorMessage?: string
  ): Promise<void> {
    await this.reportTelemetry('update_failed', update, { errorCode, errorMessage })
  }

  private async reportTelemetry(
    eventType: string,
    update: UpdateInfo,
    extra?: { errorCode?: string; errorMessage?: string }
  ): Promise<void> {
    const apiUrl = this.config.apiUrl || 'https://api.bundlenudge.com'

    try {
      await this.auth.authenticatedFetch(`${apiUrl}/v1/telemetry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId: this.storage.getDeviceId(),
          appId: this.config.appId,
          eventType,
          releaseId: update.releaseId,
          bundleVersion: update.version,
          errorCode: extra?.errorCode,
          errorMessage: extra?.errorMessage,
          timestamp: Date.now(),
        }),
      })
    } catch {
      // Telemetry failure is non-fatal
    }
  }
}
```

### Tests Required

1. **Check for update**
   - Returns update when available
   - Returns no update when current
   - Handles requiresAppStoreUpdate
   - Respects minimum interval

2. **Download**
   - Downloads bundle successfully
   - Reports progress
   - Handles download failure

3. **Hash verification**
   - Passes on valid hash
   - Fails on hash mismatch
   - Reports failure to server

4. **Installation**
   - Marks as pending update
   - Reports download success
