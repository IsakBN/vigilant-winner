/**
 * BundleNudge
 *
 * Main SDK class - public API for React Native apps.
 */

import { Platform } from 'react-native'
import type {
  BundleNudgeConfig,
  UpdateStatus,
  UpdateInfo,
  DownloadProgress,
  NativeModuleInterface,
} from './types'
import { Storage } from './storage'
import { Updater } from './updater'
import { CrashDetector } from './crash-detector'
import { RollbackManager } from './rollback-manager'
import { getModuleWithFallback } from './native-module'

export interface BundleNudgeCallbacks {
  onStatusChange?: (status: UpdateStatus) => void
  onDownloadProgress?: (progress: DownloadProgress) => void
  onUpdateAvailable?: (update: UpdateInfo) => void
  onError?: (error: Error) => void
}

interface DeviceRegisterResponse {
  accessToken: string
  expiresAt: number
}

export class BundleNudge {
  private static instance: BundleNudge | null = null

  private config: BundleNudgeConfig
  private callbacks: BundleNudgeCallbacks
  private storage: Storage
  private updater: Updater
  private crashDetector: CrashDetector
  private rollbackManager: RollbackManager
  private nativeModule: NativeModuleInterface | null = null

  private status: UpdateStatus = 'idle'
  private isInitialized = false

  private constructor(
    config: BundleNudgeConfig,
    callbacks: BundleNudgeCallbacks = {}
  ) {
    this.config = config
    this.callbacks = callbacks

    this.storage = new Storage()

    // Initialize native module first (needed by Updater and RollbackManager)
    const nativeModuleProxy = this.createNativeModuleProxy()

    this.updater = new Updater({
      storage: this.storage,
      config: this.config,
      nativeModule: nativeModuleProxy,
      onProgress: (progress) => {
        this.callbacks.onDownloadProgress?.(progress)
      },
    })

    this.crashDetector = new CrashDetector(this.storage, {
      verificationWindowMs: this.config.verificationWindowMs,
      crashThreshold: this.config.crashThreshold,
      crashWindowMs: this.config.crashWindowMs,
      onRollback: async () => {
        await this.rollbackManager.rollback('crash_detected')
      },
      onVerified: async () => {
        await this.rollbackManager.markUpdateVerified()
      },
    })

    this.rollbackManager = new RollbackManager({
      storage: this.storage,
      config: this.config,
      nativeModule: nativeModuleProxy,
    })
  }

  /** Initialize the SDK. Call this in your app's entry point. */
  static async initialize(
    config: BundleNudgeConfig,
    callbacks?: BundleNudgeCallbacks
  ): Promise<BundleNudge> {
    if (BundleNudge.instance) return BundleNudge.instance
    const instance = new BundleNudge(config, callbacks)
    await instance.init()
    BundleNudge.instance = instance
    return instance
  }

  /** Get the singleton instance. */
  static getInstance(): BundleNudge {
    if (!BundleNudge.instance) {
      throw new Error('BundleNudge not initialized. Call initialize() first.')
    }
    return BundleNudge.instance
  }

  /** Check for updates. */
  async checkForUpdate(): Promise<UpdateInfo | null> {
    this.setStatus('checking')
    try {
      const result = await this.updater.checkForUpdate()
      if (result.updateAvailable && result.update) {
        this.setStatus('update-available')
        this.callbacks.onUpdateAvailable?.(result.update)
        return result.update
      }
      this.setStatus('up-to-date')
      return null
    } catch (error) {
      this.setStatus('error')
      this.callbacks.onError?.(error as Error)
      throw error
    }
  }

  /** Download and install an update. */
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

  /** Sync: check for update and install if available. */
  async sync(): Promise<void> {
    const update = await this.checkForUpdate()
    if (update) await this.downloadAndInstall(update)
  }

  /** Notify the SDK that the app is ready. Call after main UI renders. */
  async notifyAppReady(): Promise<void> {
    await this.crashDetector.notifyAppReady()
    await this.nativeModule?.notifyAppReady()
  }

  /** Restart the app to apply pending update. */
  async restartApp(): Promise<void> {
    await this.nativeModule?.restartApp(true)
  }

  /** Clear all downloaded updates. */
  async clearUpdates(): Promise<void> {
    await this.nativeModule?.clearUpdates()
  }

  /** Get current update status. */
  getStatus(): UpdateStatus { return this.status }

  /** Get current bundle version. */
  getCurrentVersion(): string | null { return this.storage.getCurrentVersion() }

  /** Check if rollback is available. */
  canRollback(): boolean { return this.rollbackManager.canRollback() }

  /** Manually trigger rollback. */
  async rollback(): Promise<void> {
    await this.rollbackManager.rollback('manual')
  }

  private async init(): Promise<void> {
    if (this.isInitialized) return

    // Initialize storage
    await this.storage.initialize()

    // Register device if needed
    if (!this.storage.getAccessToken()) {
      await this.registerDevice()
    }

    // Check for crashes
    await this.crashDetector.checkForCrash()

    // Start verification window if we have a previous version
    this.crashDetector.startVerificationWindow()

    // Auto-check on launch if configured
    if (this.config.checkOnLaunch !== false) {
      // Run in background, don't await
      this.checkForUpdate().catch(() => {
        // Ignore errors on background check
      })
    }

    this.isInitialized = true
  }

  private async registerDevice(): Promise<void> {
    const apiUrl = this.config.apiUrl ?? 'https://api.bundlenudge.com'
    const nativeConfig = await this.nativeModule?.getConfiguration()

    const response = await fetch(`${apiUrl}/v1/devices/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        appId: this.config.appId,
        deviceId: this.storage.getDeviceId(),
        platform: Platform.OS,
        appVersion: nativeConfig?.appVersion ?? '1.0.0',
      }),
    })

    if (!response.ok) {
      throw new Error(`Device registration failed: ${String(response.status)}`)
    }

    const data = (await response.json()) as DeviceRegisterResponse
    await this.storage.setAccessToken(data.accessToken)
  }

  private setStatus(status: UpdateStatus): void {
    this.status = status
    this.callbacks.onStatusChange?.(status)
  }

  private createNativeModuleProxy(): NativeModuleInterface {
    const { module } = getModuleWithFallback()
    this.nativeModule = module
    return module
  }
}
