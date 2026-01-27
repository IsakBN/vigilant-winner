/**
 * Storage Tests
 *
 * Tests for the Storage class that manages SDK metadata persistence.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Storage } from './storage'

// Mock AsyncStorage
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(),
    setItem: vi.fn(),
  },
}))

// Mock utils for stable device ID
vi.mock('./utils', () => ({
  generateDeviceId: () => 'test-device-id-123',
}))

const STORAGE_KEY = '@bundlenudge:metadata'

describe('Storage', () => {
  let storage: Storage

  beforeEach(() => {
    vi.clearAllMocks()
    storage = new Storage()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('initialize', () => {
    it('creates default metadata on first launch', async () => {
      vi.mocked(AsyncStorage.getItem).mockResolvedValue(null)
      vi.mocked(AsyncStorage.setItem).mockResolvedValue()

      await storage.initialize()

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        STORAGE_KEY,
        expect.stringContaining('test-device-id-123')
      )
    })

    it('loads existing metadata from storage', async () => {
      const existingMetadata = {
        deviceId: 'existing-device-123',
        accessToken: 'token-abc',
        currentVersion: '1.0.0',
        currentVersionHash: 'hash123',
        previousVersion: null,
        pendingVersion: null,
        pendingUpdateFlag: false,
        lastCheckTime: null,
        crashCount: 0,
        lastCrashTime: null,
        verificationState: null,
        appVersionInfo: null,
      }
      vi.mocked(AsyncStorage.getItem).mockResolvedValue(JSON.stringify(existingMetadata))

      await storage.initialize()

      expect(storage.getDeviceId()).toBe('existing-device-123')
      expect(storage.getAccessToken()).toBe('token-abc')
      expect(storage.getCurrentVersion()).toBe('1.0.0')
    })

    it('resets corrupted storage to defaults', async () => {
      vi.mocked(AsyncStorage.getItem).mockResolvedValue('invalid-json{{{')
      vi.mocked(AsyncStorage.setItem).mockResolvedValue()

      await storage.initialize()

      expect(AsyncStorage.setItem).toHaveBeenCalled()
      expect(storage.getDeviceId()).toBe('test-device-id-123')
    })

    it('resets metadata when schema validation fails (invalid type)', async () => {
      const invalidMetadata = {
        deviceId: 123, // Should be string
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
      vi.mocked(AsyncStorage.getItem).mockResolvedValue(JSON.stringify(invalidMetadata))
      vi.mocked(AsyncStorage.setItem).mockResolvedValue()

      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
      await storage.initialize()

      expect(warnSpy).toHaveBeenCalledWith('[BundleNudge] Corrupted metadata detected, resetting')
      expect(storage.getDeviceId()).toBe('test-device-id-123')
      warnSpy.mockRestore()
    })

    it('resets metadata when crashCount exceeds max (100)', async () => {
      const invalidMetadata = {
        deviceId: 'valid-device-id',
        accessToken: null,
        currentVersion: null,
        currentVersionHash: null,
        previousVersion: null,
        pendingVersion: null,
        pendingUpdateFlag: false,
        lastCheckTime: null,
        crashCount: 150, // Exceeds max of 100
        lastCrashTime: null,
      }
      vi.mocked(AsyncStorage.getItem).mockResolvedValue(JSON.stringify(invalidMetadata))
      vi.mocked(AsyncStorage.setItem).mockResolvedValue()

      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
      await storage.initialize()

      expect(warnSpy).toHaveBeenCalledWith('[BundleNudge] Corrupted metadata detected, resetting')
      expect(storage.getMetadata().crashCount).toBe(0)
      warnSpy.mockRestore()
    })

    it('resets metadata when crashCount is negative', async () => {
      const invalidMetadata = {
        deviceId: 'valid-device-id',
        accessToken: null,
        currentVersion: null,
        currentVersionHash: null,
        previousVersion: null,
        pendingVersion: null,
        pendingUpdateFlag: false,
        lastCheckTime: null,
        crashCount: -5, // Negative is invalid
        lastCrashTime: null,
      }
      vi.mocked(AsyncStorage.getItem).mockResolvedValue(JSON.stringify(invalidMetadata))
      vi.mocked(AsyncStorage.setItem).mockResolvedValue()

      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
      await storage.initialize()

      expect(warnSpy).toHaveBeenCalledWith('[BundleNudge] Corrupted metadata detected, resetting')
      expect(storage.getMetadata().crashCount).toBe(0)
      warnSpy.mockRestore()
    })

    it('resets metadata when required field is missing', async () => {
      const invalidMetadata = {
        // Missing deviceId
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
      vi.mocked(AsyncStorage.getItem).mockResolvedValue(JSON.stringify(invalidMetadata))
      vi.mocked(AsyncStorage.setItem).mockResolvedValue()

      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
      await storage.initialize()

      expect(warnSpy).toHaveBeenCalledWith('[BundleNudge] Corrupted metadata detected, resetting')
      expect(storage.getDeviceId()).toBe('test-device-id-123')
      warnSpy.mockRestore()
    })

    it('resets metadata when deviceId is empty string', async () => {
      const invalidMetadata = {
        deviceId: '', // Empty string is invalid (min 1)
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
      vi.mocked(AsyncStorage.getItem).mockResolvedValue(JSON.stringify(invalidMetadata))
      vi.mocked(AsyncStorage.setItem).mockResolvedValue()

      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
      await storage.initialize()

      expect(warnSpy).toHaveBeenCalledWith('[BundleNudge] Corrupted metadata detected, resetting')
      expect(storage.getDeviceId()).toBe('test-device-id-123')
      warnSpy.mockRestore()
    })

    it('accepts valid metadata at crashCount boundary (100)', async () => {
      const validMetadata = {
        deviceId: 'valid-device-id',
        accessToken: null,
        currentVersion: null,
        currentVersionHash: null,
        previousVersion: null,
        pendingVersion: null,
        pendingUpdateFlag: false,
        lastCheckTime: null,
        crashCount: 100, // Exactly at max
        lastCrashTime: null,
        verificationState: null,
        appVersionInfo: null,
      }
      vi.mocked(AsyncStorage.getItem).mockResolvedValue(JSON.stringify(validMetadata))

      await storage.initialize()

      expect(storage.getMetadata().crashCount).toBe(100)
    })
  })

  describe('getMetadata', () => {
    it('throws if not initialized', () => {
      expect(() => storage.getMetadata()).toThrow('Storage not initialized')
    })

    it('returns metadata after initialization', async () => {
      vi.mocked(AsyncStorage.getItem).mockResolvedValue(null)
      vi.mocked(AsyncStorage.setItem).mockResolvedValue()

      await storage.initialize()
      const metadata = storage.getMetadata()

      expect(metadata.deviceId).toBe('test-device-id-123')
      expect(metadata.crashCount).toBe(0)
    })
  })

  describe('updateMetadata', () => {
    it('throws if not initialized', async () => {
      await expect(storage.updateMetadata({ crashCount: 1 })).rejects.toThrow(
        'Storage not initialized'
      )
    })

    it('updates and persists metadata', async () => {
      vi.mocked(AsyncStorage.getItem).mockResolvedValue(null)
      vi.mocked(AsyncStorage.setItem).mockResolvedValue()

      await storage.initialize()
      vi.clearAllMocks()

      await storage.updateMetadata({ currentVersion: '2.0.0' })

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        STORAGE_KEY,
        expect.stringContaining('"currentVersion":"2.0.0"')
      )
    })
  })

  describe('access token', () => {
    beforeEach(async () => {
      vi.mocked(AsyncStorage.getItem).mockResolvedValue(null)
      vi.mocked(AsyncStorage.setItem).mockResolvedValue()
      await storage.initialize()
    })

    it('returns null when no token set', () => {
      expect(storage.getAccessToken()).toBeNull()
    })

    it('sets and retrieves access token', async () => {
      await storage.setAccessToken('new-token-xyz')
      expect(storage.getAccessToken()).toBe('new-token-xyz')
    })
  })

  describe('pending update', () => {
    beforeEach(async () => {
      vi.mocked(AsyncStorage.getItem).mockResolvedValue(null)
      vi.mocked(AsyncStorage.setItem).mockResolvedValue()
      await storage.initialize()
    })

    it('sets pending update flag', async () => {
      await storage.setPendingUpdate('1.1.0', 'hash456')

      const metadata = storage.getMetadata()
      expect(metadata.pendingVersion).toBe('1.1.0')
      expect(metadata.pendingUpdateFlag).toBe(true)
    })

    it('applies pending update', async () => {
      await storage.updateMetadata({ currentVersion: '1.0.0' })
      await storage.setPendingUpdate('1.1.0', 'hash456')
      await storage.applyPendingUpdate()

      const metadata = storage.getMetadata()
      expect(metadata.currentVersion).toBe('1.1.0')
      expect(metadata.previousVersion).toBe('1.0.0')
      expect(metadata.pendingVersion).toBeNull()
      expect(metadata.pendingUpdateFlag).toBe(false)
    })
  })

  describe('crash tracking', () => {
    beforeEach(async () => {
      vi.mocked(AsyncStorage.getItem).mockResolvedValue(null)
      vi.mocked(AsyncStorage.setItem).mockResolvedValue()
      await storage.initialize()
    })

    it('records crash and increments count', async () => {
      const count1 = await storage.recordCrash()
      expect(count1).toBe(1)

      const count2 = await storage.recordCrash()
      expect(count2).toBe(2)

      expect(storage.getMetadata().lastCrashTime).not.toBeNull()
    })

    it('clears crash count', async () => {
      await storage.recordCrash()
      await storage.recordCrash()
      await storage.clearCrashCount()

      const metadata = storage.getMetadata()
      expect(metadata.crashCount).toBe(0)
      expect(metadata.lastCrashTime).toBeNull()
    })
  })

  describe('rollback', () => {
    beforeEach(async () => {
      vi.mocked(AsyncStorage.getItem).mockResolvedValue(null)
      vi.mocked(AsyncStorage.setItem).mockResolvedValue()
      await storage.initialize()
    })

    it('rolls back to previous version', async () => {
      await storage.updateMetadata({
        currentVersion: '2.0.0',
        previousVersion: '1.0.0',
        crashCount: 2,
      })

      await storage.rollback()

      const metadata = storage.getMetadata()
      expect(metadata.currentVersion).toBe('1.0.0')
      expect(metadata.previousVersion).toBeNull()
      expect(metadata.crashCount).toBe(0)
    })

    it('does nothing if no previous version', async () => {
      await storage.updateMetadata({ currentVersion: '1.0.0' })
      await storage.rollback()

      expect(storage.getCurrentVersion()).toBe('1.0.0')
    })

    it('clears previous version', async () => {
      await storage.updateMetadata({ previousVersion: '0.9.0' })
      await storage.clearPreviousVersion()

      expect(storage.getMetadata().previousVersion).toBeNull()
    })
  })

  describe('verification state', () => {
    beforeEach(async () => {
      vi.mocked(AsyncStorage.getItem).mockResolvedValue(null)
      vi.mocked(AsyncStorage.setItem).mockResolvedValue()
      await storage.initialize()
    })

    it('returns null for initial verification state', () => {
      expect(storage.getVerificationState()).toBeNull()
    })

    it('setAppReady sets appReady flag correctly', async () => {
      await storage.setAppReady()

      const state = storage.getVerificationState()
      expect(state).not.toBeNull()
      expect(state?.appReady).toBe(true)
      expect(state?.healthPassed).toBe(false)
      expect(state?.verifiedAt).toBeNull()
    })

    it('setHealthPassed sets healthPassed flag correctly', async () => {
      await storage.setHealthPassed()

      const state = storage.getVerificationState()
      expect(state).not.toBeNull()
      expect(state?.appReady).toBe(false)
      expect(state?.healthPassed).toBe(true)
      expect(state?.verifiedAt).toBeNull()
    })

    it('isFullyVerified returns false when only appReady is true', async () => {
      await storage.setAppReady()

      expect(storage.isFullyVerified()).toBe(false)
    })

    it('isFullyVerified returns false when only healthPassed is true', async () => {
      await storage.setHealthPassed()

      expect(storage.isFullyVerified()).toBe(false)
    })

    it('isFullyVerified returns true when both flags are true', async () => {
      await storage.setAppReady()
      await storage.setHealthPassed()

      expect(storage.isFullyVerified()).toBe(true)
    })

    it('sets verifiedAt timestamp when both flags become true (appReady first)', async () => {
      const beforeTime = Date.now()
      await storage.setAppReady()

      // verifiedAt should not be set yet
      expect(storage.getVerificationState()?.verifiedAt).toBeNull()

      await storage.setHealthPassed()
      const afterTime = Date.now()

      const state = storage.getVerificationState()
      expect(state?.verifiedAt).not.toBeNull()
      expect(state?.verifiedAt).toBeGreaterThanOrEqual(beforeTime)
      expect(state?.verifiedAt).toBeLessThanOrEqual(afterTime)
    })

    it('sets verifiedAt timestamp when both flags become true (healthPassed first)', async () => {
      const beforeTime = Date.now()
      await storage.setHealthPassed()

      // verifiedAt should not be set yet
      expect(storage.getVerificationState()?.verifiedAt).toBeNull()

      await storage.setAppReady()
      const afterTime = Date.now()

      const state = storage.getVerificationState()
      expect(state?.verifiedAt).not.toBeNull()
      expect(state?.verifiedAt).toBeGreaterThanOrEqual(beforeTime)
      expect(state?.verifiedAt).toBeLessThanOrEqual(afterTime)
    })

    it('resetVerificationState clears state to null', async () => {
      await storage.setAppReady()
      await storage.setHealthPassed()

      expect(storage.isFullyVerified()).toBe(true)

      await storage.resetVerificationState()

      expect(storage.getVerificationState()).toBeNull()
      expect(storage.isFullyVerified()).toBe(false)
    })

    it('setVerificationState sets state directly', async () => {
      const timestamp = Date.now()
      await storage.setVerificationState({
        appReady: true,
        healthPassed: true,
        verifiedAt: timestamp,
      })

      const state = storage.getVerificationState()
      expect(state?.appReady).toBe(true)
      expect(state?.healthPassed).toBe(true)
      expect(state?.verifiedAt).toBe(timestamp)
    })

    it('isFullyVerified returns false when state is null', () => {
      expect(storage.isFullyVerified()).toBe(false)
    })

    it('loads existing verification state from storage', async () => {
      // Reset and reinitialize with existing verification state
      vi.clearAllMocks()
      storage = new Storage()

      const existingMetadata = {
        deviceId: 'existing-device-123',
        accessToken: null,
        currentVersion: '1.0.0',
        currentVersionHash: null,
        previousVersion: null,
        pendingVersion: null,
        pendingUpdateFlag: false,
        lastCheckTime: null,
        crashCount: 0,
        lastCrashTime: null,
        verificationState: {
          appReady: true,
          healthPassed: true,
          verifiedAt: 1700000000000,
        },
        appVersionInfo: null,
      }
      vi.mocked(AsyncStorage.getItem).mockResolvedValue(JSON.stringify(existingMetadata))

      await storage.initialize()

      const state = storage.getVerificationState()
      expect(state?.appReady).toBe(true)
      expect(state?.healthPassed).toBe(true)
      expect(state?.verifiedAt).toBe(1700000000000)
      expect(storage.isFullyVerified()).toBe(true)
    })
  })

  describe('error handling', () => {
    it('resets to defaults on AsyncStorage.getItem error', async () => {
      // Storage.initialize catches parse errors and resets to defaults
      vi.mocked(AsyncStorage.getItem).mockRejectedValue(new Error('Storage read error'))
      vi.mocked(AsyncStorage.setItem).mockResolvedValue()

      await storage.initialize()

      // Should reset to defaults and persist
      expect(storage.getDeviceId()).toBe('test-device-id-123')
      expect(AsyncStorage.setItem).toHaveBeenCalled()
    })

    it('throws on AsyncStorage.setItem error during persist', async () => {
      vi.mocked(AsyncStorage.getItem).mockResolvedValue(null)
      vi.mocked(AsyncStorage.setItem).mockRejectedValue(new Error('Storage write error'))

      await expect(storage.initialize()).rejects.toThrow('Failed to write to storage')
    })
  })

  describe('app version info', () => {
    beforeEach(async () => {
      vi.mocked(AsyncStorage.getItem).mockResolvedValue(null)
      vi.mocked(AsyncStorage.setItem).mockResolvedValue()
      await storage.initialize()
    })

    it('returns null for initial app version info', () => {
      expect(storage.getAppVersionInfo()).toBeNull()
    })

    it('sets and retrieves app version info', async () => {
      const versionInfo = {
        appVersion: '2.1.0',
        buildNumber: '142',
        recordedAt: 1700000000000,
      }
      await storage.setAppVersionInfo(versionInfo)

      const retrieved = storage.getAppVersionInfo()
      expect(retrieved?.appVersion).toBe('2.1.0')
      expect(retrieved?.buildNumber).toBe('142')
      expect(retrieved?.recordedAt).toBe(1700000000000)
    })

    it('clearAllBundles removes currentVersion, previousVersion, and pendingVersion', async () => {
      await storage.updateMetadata({
        currentVersion: '1.0.0',
        currentVersionHash: 'hash123',
        previousVersion: '0.9.0',
        pendingVersion: '1.1.0',
        pendingUpdateFlag: true,
      })

      await storage.clearAllBundles()

      const metadata = storage.getMetadata()
      expect(metadata.currentVersion).toBeNull()
      expect(metadata.currentVersionHash).toBeNull()
      expect(metadata.previousVersion).toBeNull()
      expect(metadata.pendingVersion).toBeNull()
      expect(metadata.pendingUpdateFlag).toBe(false)
    })

    it('clearAllBundles preserves other metadata', async () => {
      const versionInfo = {
        appVersion: '2.0.0',
        buildNumber: '100',
        recordedAt: Date.now(),
      }
      await storage.setAppVersionInfo(versionInfo)
      await storage.setAccessToken('my-token')
      await storage.updateMetadata({ currentVersion: '1.0.0' })

      await storage.clearAllBundles()

      expect(storage.getAppVersionInfo()?.appVersion).toBe('2.0.0')
      expect(storage.getAccessToken()).toBe('my-token')
      expect(storage.getDeviceId()).toBe('test-device-id-123')
    })

    it('app version info persists across initialization', async () => {
      vi.clearAllMocks()
      storage = new Storage()

      const existingMetadata = {
        deviceId: 'existing-device-123',
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
        appVersionInfo: {
          appVersion: '3.0.0',
          buildNumber: '200',
          recordedAt: 1700000000000,
        },
      }
      vi.mocked(AsyncStorage.getItem).mockResolvedValue(JSON.stringify(existingMetadata))

      await storage.initialize()

      const versionInfo = storage.getAppVersionInfo()
      expect(versionInfo?.appVersion).toBe('3.0.0')
      expect(versionInfo?.buildNumber).toBe('200')
      expect(versionInfo?.recordedAt).toBe(1700000000000)
    })
  })

  describe('bundle hashes', () => {
    beforeEach(async () => {
      vi.mocked(AsyncStorage.getItem).mockResolvedValue(null)
      vi.mocked(AsyncStorage.setItem).mockResolvedValue()
      await storage.initialize()
    })

    it('gets and sets bundle hash', async () => {
      await storage.setBundleHash('1.0.0', 'abc123')
      expect(storage.getBundleHash('1.0.0')).toBe('abc123')
    })

    it('returns null for unknown version hash', () => {
      expect(storage.getBundleHash('unknown-version')).toBeNull()
    })

    it('removeBundleVersion clears version and hash', async () => {
      await storage.updateMetadata({ currentVersion: '1.0.0' })
      await storage.setBundleHash('1.0.0', 'hash123')

      await storage.removeBundleVersion('1.0.0')

      expect(storage.getCurrentVersion()).toBeNull()
      expect(storage.getBundleHash('1.0.0')).toBeNull()
    })

    it('stores multiple hashes correctly', async () => {
      await storage.setBundleHash('1.0.0', 'hash1')
      await storage.setBundleHash('2.0.0', 'hash2')
      await storage.setBundleHash('3.0.0', 'hash3')

      expect(storage.getBundleHash('1.0.0')).toBe('hash1')
      expect(storage.getBundleHash('2.0.0')).toBe('hash2')
      expect(storage.getBundleHash('3.0.0')).toBe('hash3')
    })

    it('hashes persist across initialization', async () => {
      vi.clearAllMocks()
      storage = new Storage()

      const existingMetadata = {
        deviceId: 'existing-device-123',
        accessToken: null,
        currentVersion: '1.0.0',
        currentVersionHash: null,
        previousVersion: null,
        pendingVersion: null,
        pendingUpdateFlag: false,
        lastCheckTime: null,
        crashCount: 0,
        lastCrashTime: null,
        verificationState: null,
        appVersionInfo: null,
        bundleHashes: { '1.0.0': 'persisted-hash' },
      }
      vi.mocked(AsyncStorage.getItem).mockResolvedValue(JSON.stringify(existingMetadata))

      await storage.initialize()

      expect(storage.getBundleHash('1.0.0')).toBe('persisted-hash')
    })

    it('removeBundleVersion clears previousVersion when matched', async () => {
      await storage.updateMetadata({ previousVersion: '0.9.0' })
      await storage.setBundleHash('0.9.0', 'oldhash')

      await storage.removeBundleVersion('0.9.0')

      expect(storage.getMetadata().previousVersion).toBeNull()
      expect(storage.getBundleHash('0.9.0')).toBeNull()
    })

    it('removeBundleVersion clears pendingVersion when matched', async () => {
      await storage.updateMetadata({ pendingVersion: '2.0.0' })
      await storage.setBundleHash('2.0.0', 'pendinghash')

      await storage.removeBundleVersion('2.0.0')

      expect(storage.getMetadata().pendingVersion).toBeNull()
      expect(storage.getBundleHash('2.0.0')).toBeNull()
    })
  })
})
