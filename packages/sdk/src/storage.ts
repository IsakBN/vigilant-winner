/**
 * Storage
 *
 * Manages SDK metadata persistence using AsyncStorage.
 */

import AsyncStorage from '@react-native-async-storage/async-storage'
import { z } from 'zod'
import { generateDeviceId } from './utils'

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
