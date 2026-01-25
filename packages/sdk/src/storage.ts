/**
 * Storage
 *
 * Manages SDK metadata persistence using AsyncStorage.
 */

import type { StoredMetadata } from './types'
import { generateDeviceId } from './utils'

const STORAGE_KEY = '@bundlenudge:metadata'

export class Storage {
  private metadata: StoredMetadata | null = null

  /**
   * Initialize storage and load existing metadata.
   */
  async initialize(): Promise<void> {
    try {
      const stored = await this.getItem(STORAGE_KEY)
      if (stored) {
        this.metadata = JSON.parse(stored)
      } else {
        // First launch - generate device ID
        this.metadata = this.getDefaultMetadata()
        await this.persist()
      }
    } catch {
      // Corrupted storage - reset
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

  // Abstract storage methods - will be implemented with AsyncStorage
  private async getItem(_key: string): Promise<string | null> {
    // TODO: Use AsyncStorage
    return null
  }

  private async setItem(_key: string, _value: string): Promise<void> {
    // TODO: Use AsyncStorage
  }
}
