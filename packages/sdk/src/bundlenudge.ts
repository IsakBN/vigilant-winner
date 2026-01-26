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
import { VersionGuard } from './version-guard'
import { BundleValidator } from './bundle-validator'
import { HealthMonitor } from './health-monitor'
import { HealthConfigFetcher } from './health-config'
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
  private versionGuard: VersionGuard | null = null
  private bundleValidator: BundleValidator
  private healthMonitor: HealthMonitor | null = null
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
      storage: this.storage, config: this.config, nativeModule: nativeModuleProxy,
      onProgress: (progress) => this.callbacks.onDownloadProgress?.(progress),
    })

    this.crashDetector = new CrashDetector(this.storage, {
      verificationWindowMs: this.config.verificationWindowMs,
      crashThreshold: this.config.crashThreshold,
      crashWindowMs: this.config.crashWindowMs,
      onRollback: async () => this.rollbackManager.rollback('crash_detected'),
      onVerified: async () => this.rollbackManager.markUpdateVerified(),
    })

    this.rollbackManager = new RollbackManager({ storage: this.storage, config: this.config, nativeModule: nativeModuleProxy })

    this.bundleValidator = this.createBundleValidator()
  }

  private createBundleValidator(): BundleValidator {
    return new BundleValidator(this.storage, {
      hashFile: async (path: string) => {
        if (!this.nativeModule) return ''
        const mod = this.nativeModule as unknown as { hashFile?: (p: string) => Promise<string> }
        return mod.hashFile?.(path) ?? ''
      },
      onValidationFailed: (version) => { console.warn(`[BundleNudge] Bundle ${version} failed validation`); },
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

  async restartApp(): Promise<void> { await this.nativeModule?.restartApp(true) }
  async clearUpdates(): Promise<void> { await this.nativeModule?.clearUpdates() }
  getStatus(): UpdateStatus { return this.status }
  getCurrentVersion(): string | null { return this.storage.getCurrentVersion() }
  canRollback(): boolean { return this.rollbackManager.canRollback() }
  getBundleValidator(): BundleValidator { return this.bundleValidator }
  async rollback(): Promise<void> { await this.rollbackManager.rollback('manual') }
  trackEvent(name: string): void { this.healthMonitor?.reportEvent(name) }
  trackEndpoint(method: string, url: string, status: number): void { this.healthMonitor?.reportEndpoint(method, url, status) }
  isHealthVerified(): boolean { return this.healthMonitor?.isFullyVerified() ?? true }

  private async init(): Promise<void> {
    if (this.isInitialized) return
    await this.storage.initialize()
    this.versionGuard = this.createVersionGuard()
    await this.versionGuard.checkForNativeUpdate() // Clears bundles if App Store update
    if (!this.storage.getAccessToken()) await this.registerDevice()
    await this.initHealthMonitor()
    await this.crashDetector.checkForCrash()
    this.crashDetector.startVerificationWindow()
    if (this.config.checkOnLaunch !== false) void this.checkForUpdate().catch(() => undefined)
    this.isInitialized = true
  }

  private async initHealthMonitor(): Promise<void> {
    const apiUrl = this.config.apiUrl ?? 'https://api.bundlenudge.com'
    const fetcher = new HealthConfigFetcher({
      apiUrl, appId: this.config.appId, getAccessToken: () => this.storage.getAccessToken(),
    })
    const config = await fetcher.fetchConfig()
    if (config.events.length === 0 && config.endpoints.length === 0) return // No config, skip
    this.healthMonitor = new HealthMonitor({
      events: config.events, endpoints: config.endpoints, crashDetector: this.crashDetector,
      // eslint-disable-next-line no-console -- Intentional logging for debugging
      onAllPassed: () => { console.info('[BundleNudge] Health checks passed, update verified'); },
    })
  }

  private createVersionGuard(): VersionGuard {
    return new VersionGuard(this.storage, {
      getCurrentVersion: () => {
        if (!this.nativeModule) {
          return { appVersion: '1.0.0', buildNumber: '1', recordedAt: Date.now() }
        }
        type ConfigSync = { appVersion?: string; buildNumber?: string } | undefined
        const mod = this.nativeModule as unknown as { getConfiguration?: () => ConfigSync }
        const cfg = mod.getConfiguration?.()
        return { appVersion: cfg?.appVersion ?? '1.0.0', buildNumber: cfg?.buildNumber ?? '1', recordedAt: Date.now() }
      },
      // eslint-disable-next-line no-console -- Intentional logging for debugging
      onNativeUpdateDetected: () => { console.info('[BundleNudge] App Store update detected, cleared OTA bundles'); },
    })
  }

  private async registerDevice(): Promise<void> {
    const apiUrl = this.config.apiUrl ?? 'https://api.bundlenudge.com'
    const nativeConfig = await this.nativeModule?.getConfiguration()
    const body = { appId: this.config.appId, deviceId: this.storage.getDeviceId(), platform: Platform.OS, appVersion: nativeConfig?.appVersion ?? '1.0.0' }
    const response = await fetch(`${apiUrl}/v1/devices/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    if (!response.ok) throw new Error(`Device registration failed: ${String(response.status)}`)
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
