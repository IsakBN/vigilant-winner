/**
 * RollbackManager
 *
 * Manages rollback logic for both device-level and server-triggered rollbacks.
 */

import type { Storage } from './storage'
import type { BundleNudgeConfig, NativeModuleInterface } from './types'

export type RollbackReason =
  | 'crash_detected'
  | 'route_failure'
  | 'server_triggered'
  | 'manual'

export interface RollbackManagerConfig {
  storage: Storage
  config: BundleNudgeConfig
  nativeModule: NativeModuleInterface

  /** Report rollback to server */
  onRollbackReported?: (reason: RollbackReason, version: string) => void
}

export class RollbackManager {
  private storage: Storage
  private config: BundleNudgeConfig
  private nativeModule: NativeModuleInterface
  private onRollbackReported?: (reason: RollbackReason, version: string) => void

  constructor(deps: RollbackManagerConfig) {
    this.storage = deps.storage
    this.config = deps.config
    this.nativeModule = deps.nativeModule
    this.onRollbackReported = deps.onRollbackReported
  }

  /**
   * Check if rollback is available.
   */
  canRollback(): boolean {
    const metadata = this.storage.getMetadata()
    return metadata.previousVersion !== null
  }

  /**
   * Get the version we would rollback to.
   */
  getRollbackVersion(): string | null {
    return this.storage.getMetadata().previousVersion
  }

  /**
   * Trigger a rollback.
   */
  async rollback(reason: RollbackReason): Promise<void> {
    const metadata = this.storage.getMetadata()
    const currentVersion = metadata.currentVersion
    const previousVersion = metadata.previousVersion

    if (!previousVersion) {
      throw new Error('No previous version to rollback to')
    }

    // Update storage state
    await this.storage.rollback()

    // Report rollback to server
    if (this.onRollbackReported && currentVersion) {
      this.onRollbackReported(reason, currentVersion)
    }

    await this.reportRollback(reason, currentVersion, previousVersion)

    // Restart app with previous bundle
    await this.nativeModule.restartApp(false)
  }

  /**
   * Mark current update as verified and clean up previous version.
   */
  async markUpdateVerified(): Promise<void> {
    await this.storage.clearPreviousVersion()

    // TODO: Delete old bundle files from filesystem
    // This would be done via native module
  }

  private async reportRollback(
    reason: RollbackReason,
    fromVersion: string | null,
    toVersion: string
  ): Promise<void> {
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
          eventType: 'rollback_triggered',
          bundleVersion: fromVersion,
          metadata: {
            reason,
            rolledBackTo: toVersion,
          },
          timestamp: Date.now(),
        }),
      })
    } catch {
      // Telemetry failure is non-fatal
    }
  }
}
