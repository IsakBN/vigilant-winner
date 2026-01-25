## Feature: sdk/public-api

Complete the public BundleNudge class API.

### Files to Modify/Create

`packages/sdk/src/bundlenudge.ts` - Complete implementation
`packages/sdk/src/index.ts` - Exports
`packages/sdk/src/bundlenudge.test.ts` - Tests

### Implementation

```typescript
// bundlenudge.ts
import { NativeModules, AppState, Platform } from 'react-native'
import type {
  BundleNudgeConfig,
  UpdateStatus,
  UpdateInfo,
  DownloadProgress,
  NativeModuleInterface,
} from './types'
import { Storage } from './storage'
import { DeviceAuth } from './auth'
import { Updater } from './updater'
import { CrashDetector } from './crash-detector'
import { RollbackManager, type TierType } from './rollback-manager'

const BundleNudgeNative: NativeModuleInterface = NativeModules.BundleNudge

export interface BundleNudgeCallbacks {
  onStatusChange?: (status: UpdateStatus) => void
  onDownloadProgress?: (progress: DownloadProgress) => void
  onUpdateAvailable?: (update: UpdateInfo) => void
  onError?: (error: Error) => void
}

export class BundleNudge {
  private static instance: BundleNudge | null = null

  private config: BundleNudgeConfig
  private callbacks: BundleNudgeCallbacks
  private storage: Storage
  private auth: DeviceAuth
  private updater: Updater
  private rollbackManager: RollbackManager

  private status: UpdateStatus = 'idle'
  private isInitialized = false
  private appStateSubscription: any = null

  private constructor(config: BundleNudgeConfig, callbacks: BundleNudgeCallbacks = {}) {
    this.config = {
      checkOnLaunch: true,
      checkOnForeground: true,
      installMode: 'nextLaunch',
      minimumCheckInterval: 60,
      ...config,
    }
    this.callbacks = callbacks

    this.storage = new Storage()
    this.auth = new DeviceAuth({ storage: this.storage, config: this.config })
    this.updater = new Updater({
      storage: this.storage,
      auth: this.auth,
      config: this.config,
      onProgress: (progress) => this.callbacks.onDownloadProgress?.(progress),
    })
    this.rollbackManager = new RollbackManager({
      storage: this.storage,
      auth: this.auth,
      config: this.config,
      tier: 'free' as TierType, // TODO: Get from server
    })
  }

  /**
   * Initialize the SDK. Must be called before any other method.
   */
  static async initialize(
    config: BundleNudgeConfig,
    callbacks?: BundleNudgeCallbacks
  ): Promise<BundleNudge> {
    if (BundleNudge.instance) {
      console.warn('[BundleNudge] Already initialized')
      return BundleNudge.instance
    }

    const instance = new BundleNudge(config, callbacks)
    await instance.init()
    BundleNudge.instance = instance
    return instance
  }

  /**
   * Get the singleton instance.
   */
  static getInstance(): BundleNudge {
    if (!BundleNudge.instance) {
      throw new Error('BundleNudge not initialized. Call initialize() first.')
    }
    return BundleNudge.instance
  }

  /**
   * Check for available updates.
   */
  async checkForUpdate(): Promise<UpdateInfo | null> {
    this.setStatus('checking')

    try {
      const result = await this.updater.checkForUpdate()

      if (result.updateAvailable && result.update) {
        this.setStatus('update-available')
        this.callbacks.onUpdateAvailable?.(result.update)
        return result.update
      }

      if (result.requiresAppStoreUpdate) {
        // Could trigger a callback here if needed
        console.log('[BundleNudge] App store update required:', result.appStoreMessage)
      }

      this.setStatus('up-to-date')
      return null
    } catch (error) {
      this.setStatus('error')
      this.callbacks.onError?.(error as Error)
      throw error
    }
  }

  /**
   * Download and install an update.
   */
  async downloadAndInstall(update: UpdateInfo): Promise<void> {
    this.setStatus('downloading')

    try {
      await this.updater.downloadAndInstall(update)
      this.setStatus('installing')

      if (this.config.installMode === 'immediate') {
        await this.restartApp()
      } else {
        this.setStatus('idle')
      }
    } catch (error) {
      this.setStatus('error')
      this.callbacks.onError?.(error as Error)
      throw error
    }
  }

  /**
   * Sync: check for update and install if available.
   */
  async sync(): Promise<void> {
    const update = await this.checkForUpdate()
    if (update) {
      await this.downloadAndInstall(update)
    }
  }

  /**
   * Notify the SDK that the app is ready.
   * Call after main UI renders to confirm update works.
   */
  async notifyAppReady(): Promise<void> {
    await this.rollbackManager.notifyAppReady()
  }

  /**
   * Restart app to apply pending update.
   */
  async restartApp(): Promise<void> {
    await BundleNudgeNative.restartApp(true)
  }

  /**
   * Clear all downloaded updates.
   */
  async clearUpdates(): Promise<void> {
    await BundleNudgeNative.clearUpdates()
    await this.storage.clear()
    await this.storage.initialize() // Reinitialize with defaults
  }

  /**
   * Get current update status.
   */
  getStatus(): UpdateStatus {
    return this.status
  }

  /**
   * Get current bundle version.
   */
  getCurrentVersion(): string | null {
    return this.storage.getCurrentVersion()
  }

  /**
   * Check if there's a pending update.
   */
  hasPendingUpdate(): boolean {
    return this.storage.hasPendingUpdate()
  }

  /**
   * Check if rollback is available.
   */
  canRollback(): boolean {
    return this.rollbackManager.canRollback()
  }

  /**
   * Manually trigger rollback.
   */
  async rollback(): Promise<void> {
    await this.rollbackManager.triggerRollback('manual')
  }

  /**
   * Cleanup on unmount.
   */
  destroy(): void {
    this.rollbackManager.stop()
    if (this.appStateSubscription) {
      this.appStateSubscription.remove()
    }
  }

  // Private methods

  private async init(): Promise<void> {
    if (this.isInitialized) return

    // Initialize storage
    await this.storage.initialize()

    // Register device if needed
    if (!this.auth.isRegistered()) {
      await this.auth.register()
    }

    // Check for crashes on startup
    const hadCrash = await this.rollbackManager.checkForCrash()
    if (hadCrash) {
      console.log('[BundleNudge] Rolled back after crash')
    }

    // Start verification if we have a previous version
    this.rollbackManager.start()

    // Setup foreground check
    if (this.config.checkOnForeground) {
      this.setupForegroundCheck()
    }

    // Auto-check on launch
    if (this.config.checkOnLaunch) {
      this.checkForUpdate().catch(() => {
        // Ignore errors on background check
      })
    }

    this.isInitialized = true
  }

  private setupForegroundCheck(): void {
    this.appStateSubscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        this.checkForUpdate().catch(() => {
          // Ignore errors
        })
      }
    })
  }

  private setStatus(status: UpdateStatus): void {
    this.status = status
    this.callbacks.onStatusChange?.(status)
  }
}
```

### Exports

```typescript
// index.ts
export { BundleNudge, type BundleNudgeCallbacks } from './bundlenudge'
export { Storage } from './storage'
export { Updater } from './updater'
export { RollbackManager } from './rollback-manager'
export { CrashDetector } from './crash-detector'
export { RouteMonitor } from './route-monitor'
export type {
  BundleNudgeConfig,
  UpdateStatus,
  UpdateInfo,
  DownloadProgress,
  UpdateCheckResult,
} from './types'
```

### Tests Required

1. **Initialization**
   - Creates singleton
   - Initializes storage
   - Registers device
   - Checks for crashes

2. **Check for update**
   - Calls updater
   - Updates status
   - Triggers callbacks

3. **Download and install**
   - Calls updater
   - Handles install mode
   - Triggers callbacks

4. **Sync**
   - Combines check and install
   - Handles no update

5. **Lifecycle**
   - Foreground check works
   - Destroy cleans up
