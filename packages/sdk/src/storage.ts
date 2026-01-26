/**
 * Storage
 *
 * Manages SDK metadata persistence using AsyncStorage.
 */

import AsyncStorage from '@react-native-async-storage/async-storage'
import { z } from 'zod'
import { generateDeviceId } from './utils'

/**
 * Verification state for safe rollback.
 * Both flags must be true before clearing previousVersion.
 */
export interface VerificationState {
  appReady: boolean          // Set when notifyAppReady() called
  healthPassed: boolean      // Set when all critical events/endpoints pass
  verifiedAt: number | null  // Timestamp when both conditions met
}

/**
 * App version info for detecting App Store updates.
 * When app version changes, all bundles should be cleared.
 */
export interface AppVersionInfo {
  appVersion: string   // e.g., "2.1.0"
  buildNumber: string  // e.g., "142"
  recordedAt: number   // timestamp
}

/**
 * Zod schema for verification state validation.
 */
const verificationStateSchema = z.object({
  appReady: z.boolean(),
  healthPassed: z.boolean(),
  verifiedAt: z.number().nullable(),
})

/**
 * Zod schema for app version info validation.
 */
const appVersionInfoSchema = z.object({
  appVersion: z.string().min(1),
  buildNumber: z.string().min(1),
  recordedAt: z.number(),
})

/**
 * Zod schema for stored metadata validation.
 * Validates data loaded from AsyncStorage to ensure integrity.
 */
const storedMetadataSchema = z.object({
  deviceId: z.string().min(1),
  accessToken: z.string().nullable(),
  currentVersion: z.string().nullable(),
  currentVersionHash: z.string().nullable(),
  previousVersion: z.string().nullable(),
  pendingVersion: z.string().nullable(),
  pendingUpdateFlag: z.boolean(),
  lastCheckTime: z.number().nullable(),
  crashCount: z.number().int().min(0).max(100), // Cap at 100
  lastCrashTime: z.number().nullable(),
  verificationState: verificationStateSchema.nullable(),
  appVersionInfo: appVersionInfoSchema.nullable(),
  bundleHashes: z.record(z.string(), z.string()).optional().default({}),
})

export type StoredMetadata = z.infer<typeof storedMetadataSchema>

const STORAGE_KEY = '@bundlenudge:metadata'

export class Storage {
  private metadata: StoredMetadata | null = null

  /**
   * Initialize storage and load existing metadata.
   * Uses Zod validation to ensure data integrity.
   */
  async initialize(): Promise<void> {
    try {
      const stored = await this.getItem(STORAGE_KEY)
      if (stored) {
        const parsed: unknown = JSON.parse(stored)
        const result = storedMetadataSchema.safeParse(parsed)

        if (result.success) {
          this.metadata = result.data
        } else {
          // Schema validation failed - corrupted metadata, reset
          console.warn('[BundleNudge] Corrupted metadata detected, resetting')
          this.metadata = this.getDefaultMetadata()
          await this.persist()
        }
      } else {
        // First launch - generate device ID
        this.metadata = this.getDefaultMetadata()
        await this.persist()
      }
    } catch {
      // JSON parse error or storage error - reset
      console.warn('[BundleNudge] Storage error, resetting to defaults')
      this.metadata = this.getDefaultMetadata()
      await this.persist()
    }
  }

  /**
   * Get current metadata.
   */
  getMetadata(): StoredMetadata {
    if (!this.metadata) {
      throw new Error('Storage not initialized. Call initialize() first.')
    }
    return this.metadata
  }

  /**
   * Update metadata and persist.
   */
  async updateMetadata(updates: Partial<StoredMetadata>): Promise<void> {
    if (!this.metadata) {
      throw new Error('Storage not initialized. Call initialize() first.')
    }

    this.metadata = { ...this.metadata, ...updates }
    await this.persist()
  }

  /**
   * Get device ID (stable across sessions).
   */
  getDeviceId(): string {
    return this.getMetadata().deviceId
  }

  /**
   * Get access token for API calls.
   */
  getAccessToken(): string | null {
    return this.getMetadata().accessToken
  }

  /**
   * Set access token after registration.
   */
  async setAccessToken(token: string): Promise<void> {
    await this.updateMetadata({ accessToken: token })
  }

  /**
   * Get current bundle version.
   */
  getCurrentVersion(): string | null {
    return this.getMetadata().currentVersion
  }

  /**
   * Set pending update flag.
   */
  async setPendingUpdate(
    version: string,
    _hash: string
  ): Promise<void> {
    await this.updateMetadata({
      pendingVersion: version,
      pendingUpdateFlag: true,
    })
  }

  /**
   * Apply pending update (move pending to current).
   */
  async applyPendingUpdate(): Promise<void> {
    const metadata = this.getMetadata()
    if (!metadata.pendingVersion) return

    await this.updateMetadata({
      previousVersion: metadata.currentVersion,
      currentVersion: metadata.pendingVersion,
      pendingVersion: null,
      pendingUpdateFlag: false,
      crashCount: 0,
      lastCrashTime: null,
    })
  }

  /**
   * Record a crash.
   */
  async recordCrash(): Promise<number> {
    const metadata = this.getMetadata()
    const newCount = metadata.crashCount + 1

    await this.updateMetadata({
      crashCount: newCount,
      lastCrashTime: Date.now(),
    })

    return newCount
  }

  /**
   * Clear crash count (after successful verification).
   */
  async clearCrashCount(): Promise<void> {
    await this.updateMetadata({
      crashCount: 0,
      lastCrashTime: null,
    })
  }

  /**
   * Rollback to previous version.
   */
  async rollback(): Promise<void> {
    const metadata = this.getMetadata()
    if (!metadata.previousVersion) return

    await this.updateMetadata({
      currentVersion: metadata.previousVersion,
      previousVersion: null,
      pendingVersion: null,
      pendingUpdateFlag: false,
      crashCount: 0,
      lastCrashTime: null,
    })
  }

  /**
   * Clear previous version after verification window.
   */
  async clearPreviousVersion(): Promise<void> {
    await this.updateMetadata({ previousVersion: null })
  }

  /**
   * Get current verification state.
   */
  getVerificationState(): VerificationState | null {
    return this.getMetadata().verificationState
  }

  /**
   * Set verification state directly.
   */
  async setVerificationState(state: VerificationState): Promise<void> {
    await this.updateMetadata({ verificationState: state })
  }

  /**
   * Set app ready flag (called when notifyAppReady is invoked).
   * Sets verifiedAt timestamp when both flags become true.
   */
  async setAppReady(): Promise<void> {
    const current = this.getVerificationState()
    const healthPassed = current?.healthPassed ?? false

    await this.updateMetadata({
      verificationState: {
        appReady: true,
        healthPassed,
        verifiedAt: healthPassed ? Date.now() : (current?.verifiedAt ?? null),
      },
    })
  }

  /**
   * Set health passed flag (called when health checks pass).
   * Sets verifiedAt timestamp when both flags become true.
   */
  async setHealthPassed(): Promise<void> {
    const current = this.getVerificationState()
    const appReady = current?.appReady ?? false
    const healthPassed = true
    const bothTrue = appReady && healthPassed

    await this.updateMetadata({
      verificationState: {
        appReady,
        healthPassed,
        verifiedAt: bothTrue ? Date.now() : (current?.verifiedAt ?? null),
      },
    })
  }

  /**
   * Check if update is fully verified (both appReady and healthPassed).
   */
  isFullyVerified(): boolean {
    const state = this.getVerificationState()
    if (!state) return false
    return state.appReady && state.healthPassed
  }

  /**
   * Reset verification state (called after verification complete or rollback).
   */
  async resetVerificationState(): Promise<void> {
    await this.updateMetadata({ verificationState: null })
  }

  /**
   * Get current app version info.
   */
  getAppVersionInfo(): AppVersionInfo | null {
    return this.getMetadata().appVersionInfo
  }

  /**
   * Set app version info (called on app launch to track native version).
   */
  async setAppVersionInfo(info: AppVersionInfo): Promise<void> {
    await this.updateMetadata({ appVersionInfo: info })
  }

  /**
   * Clear all bundle versions (called when App Store update detected).
   * Removes currentVersion, previousVersion, and pendingVersion.
   */
  async clearAllBundles(): Promise<void> {
    await this.updateMetadata({
      currentVersion: null,
      currentVersionHash: null,
      previousVersion: null,
      pendingVersion: null,
      pendingUpdateFlag: false,
      bundleHashes: {},
    })
  }

  /**
   * Get stored hash for a bundle version.
   */
  getBundleHash(version: string): string | null {
    return this.getMetadata().bundleHashes[version] ?? null
  }

  /**
   * Store hash for a bundle version.
   */
  async setBundleHash(version: string, hash: string): Promise<void> {
    const hashes = { ...this.getMetadata().bundleHashes, [version]: hash }
    await this.updateMetadata({ bundleHashes: hashes })
  }

  /**
   * Remove a bundle version and its hash.
   */
  async removeBundleVersion(version: string): Promise<void> {
    const metadata = this.getMetadata()
    const updates: Partial<StoredMetadata> = {}
    // Filter out the version instead of using delete
    const hashes = Object.fromEntries(
      Object.entries(metadata.bundleHashes).filter(([key]) => key !== version)
    )
    updates.bundleHashes = hashes

    if (metadata.currentVersion === version) updates.currentVersion = null
    if (metadata.previousVersion === version) updates.previousVersion = null
    if (metadata.pendingVersion === version) updates.pendingVersion = null

    await this.updateMetadata(updates)
  }

  private getDefaultMetadata(): StoredMetadata {
    return {
      deviceId: generateDeviceId(),
      accessToken: null,
      currentVersion: null,
      currentVersionHash: null,
      previousVersion: null,
      pendingVersion: null,
      pendingUpdateFlag: false,
      lastCheckTime: null,
      crashCount: 0,
      lastCrashTime: null,
      verificationState: null,
      appVersionInfo: null,
      bundleHashes: {},
    }
  }

  private async persist(): Promise<void> {
    if (!this.metadata) return
    await this.setItem(STORAGE_KEY, JSON.stringify(this.metadata))
  }

  /**
   * Get item from AsyncStorage.
   */
  private async getItem(key: string): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(key)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      throw new Error(`Failed to read from storage: ${message}`)
    }
  }

  /**
   * Set item in AsyncStorage.
   */
  private async setItem(key: string, value: string): Promise<void> {
    try {
      await AsyncStorage.setItem(key, value)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      throw new Error(`Failed to write to storage: ${message}`)
    }
  }
}
