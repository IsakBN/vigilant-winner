/**
 * CrashDetector
 *
 * Detects crashes after update and triggers rollback.
 * Free/Pro tier: 60-second verification window, then cleanup.
 */

import type { Storage } from './storage'

/** Default number of crashes before triggering rollback */
export const DEFAULT_CRASH_THRESHOLD = 3

/** Default time window for crash counting (10 seconds) */
export const DEFAULT_CRASH_WINDOW_MS = 10_000

/** Default verification window (60 seconds) */
export const DEFAULT_VERIFICATION_WINDOW_MS = 60_000

export interface CrashDetectorConfig {
  /** Verification window in ms (default: 60000 = 60 seconds) */
  verificationWindowMs?: number

  /** Number of crashes before rollback (default: 3) */
  crashThreshold?: number

  /** Time window for crash counting in ms (default: 10000 = 10 seconds) */
  crashWindowMs?: number

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
   * If we crashed after an update within the time window and
   * exceed the threshold, trigger rollback.
   */
  async checkForCrash(): Promise<boolean> {
    const metadata = this.storage.getMetadata()
    const threshold = this.config.crashThreshold ?? DEFAULT_CRASH_THRESHOLD
    const windowMs = this.config.crashWindowMs ?? DEFAULT_CRASH_WINDOW_MS

    // Check if we have a previous version to rollback to
    if (!metadata.previousVersion) {
      return false
    }

    // If we have a pending update flag but no pending version,
    // it means we crashed before applying the update properly
    if (metadata.pendingUpdateFlag && !metadata.pendingVersion) {
      return false // No crash, just incomplete state
    }

    // Check if last crash was within the window
    const now = Date.now()
    const lastCrashTime = metadata.lastCrashTime

    if (lastCrashTime && (now - lastCrashTime) < windowMs) {
      // Crash within window - increment and check threshold
      const crashCount = await this.storage.recordCrash()

      if (this.config.onCrashReported) {
        this.config.onCrashReported(crashCount)
      }

      if (crashCount >= threshold) {
        await this.config.onRollback()
        return true
      }
    } else if (lastCrashTime) {
      // Crash outside window - reset count
      await this.storage.clearCrashCount()
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
    const windowMs = this.config.verificationWindowMs ?? DEFAULT_VERIFICATION_WINDOW_MS

    this.verificationTimer = setTimeout(() => {
      void this.handleVerificationTimeout()
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
