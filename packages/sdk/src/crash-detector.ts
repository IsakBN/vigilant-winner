/**
 * CrashDetector
 *
 * Detects crashes after update and triggers rollback.
 * Free/Pro tier: 60-second verification window, then cleanup.
 */

import type { Storage } from './storage'

export interface CrashDetectorConfig {
  /** Verification window in ms (default: 60000 = 60 seconds) */
  verificationWindowMs?: number

  /** Callback when rollback is needed */
  onRollback: () => Promise<void>

  /** Callback when update is verified */
  onVerified: () => Promise<void>

  /** Report crash to server */
  onCrashReported?: (crashCount: number) => void
}

export class CrashDetector {
  private storage: Storage
  private config: CrashDetectorConfig
  private verificationTimer: ReturnType<typeof setTimeout> | null = null
  private isVerifying = false

  constructor(storage: Storage, config: CrashDetectorConfig) {
    this.storage = storage
    this.config = config
  }

  /**
   * Check for crash on app start.
   * If we crashed after an update, trigger rollback.
   */
  async checkForCrash(): Promise<boolean> {
    const metadata = this.storage.getMetadata()

    // If we have a pending update flag but no pending version,
    // it means we crashed before applying the update properly
    if (metadata.pendingUpdateFlag && !metadata.pendingVersion) {
      return false // No crash, just incomplete state
    }

    // If we have a previous version and the app didn't call notifyAppReady
    // within the verification window, it likely crashed
    if (metadata.previousVersion && metadata.crashCount > 0) {
      // Record crash
      const crashCount = await this.storage.recordCrash()

      if (this.config.onCrashReported) {
        this.config.onCrashReported(crashCount)
      }

      // Trigger rollback on first crash
      await this.config.onRollback()
      return true
    }

    return false
  }

  /**
   * Start the verification window.
   * Call this after loading a new bundle.
   */
  startVerificationWindow(): void {
    if (this.isVerifying) return

    const metadata = this.storage.getMetadata()

    // Only verify if we have a previous version to rollback to
    if (!metadata.previousVersion) {
      return
    }

    this.isVerifying = true
    const windowMs = this.config.verificationWindowMs ?? 60000

    this.verificationTimer = setTimeout(() => {
      this.handleVerificationTimeout()
    }, windowMs)
  }

  /**
   * Mark the current update as successful.
   * Call this when the app is ready (e.g., after rendering main screen).
   */
  async notifyAppReady(): Promise<void> {
    if (!this.isVerifying) return

    // Clear verification timer
    if (this.verificationTimer) {
      clearTimeout(this.verificationTimer)
      this.verificationTimer = null
    }

    this.isVerifying = false

    // Clear crash count and trigger verified callback
    await this.storage.clearCrashCount()
    await this.config.onVerified()
  }

  /**
   * Stop verification (cleanup on unmount).
   */
  stop(): void {
    if (this.verificationTimer) {
      clearTimeout(this.verificationTimer)
      this.verificationTimer = null
    }
    this.isVerifying = false
  }

  private async handleVerificationTimeout(): Promise<void> {
    this.isVerifying = false

    // If we got here without crash, the update is verified
    // Clear previous version and call verified callback
    await this.storage.clearPreviousVersion()
    await this.config.onVerified()
  }
}
