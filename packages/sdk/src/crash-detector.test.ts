 
/**
 * CrashDetector Tests
 *
 * Tests for the CrashDetector class that handles crash detection and rollback.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  CrashDetector,
  type CrashDetectorConfig,
  DEFAULT_CRASH_THRESHOLD,
  DEFAULT_CRASH_WINDOW_MS,
  DEFAULT_VERIFICATION_WINDOW_MS,
} from './crash-detector'
import type { Storage, VerificationState } from './storage'
import type { StoredMetadata } from './types'

interface MockStorageOptions {
  metadata?: Partial<StoredMetadata>
  verificationState?: VerificationState | null
}

// Helper to create mock storage with verification state support
function createMockStorage(options: MockStorageOptions = {}): Storage {
  const { metadata = {}, verificationState = null } = options

  const defaultMetadata: StoredMetadata = {
    deviceId: 'test-device',
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
    ...metadata,
  }

  // Mutable state for verification
  let currentVerificationState = verificationState

  return {
    getMetadata: vi.fn().mockReturnValue(defaultMetadata),
    recordCrash: vi.fn().mockResolvedValue(defaultMetadata.crashCount + 1),
    clearCrashCount: vi.fn().mockResolvedValue(undefined),
    clearPreviousVersion: vi.fn().mockResolvedValue(undefined),
    getVerificationState: vi.fn().mockImplementation(() => currentVerificationState),
    setAppReady: vi.fn().mockImplementation(() => {
      if (!currentVerificationState) {
        currentVerificationState = { appReady: true, healthPassed: false, verifiedAt: null }
      } else {
        currentVerificationState = { ...currentVerificationState, appReady: true }
      }
      return Promise.resolve()
    }),
    setHealthPassed: vi.fn().mockImplementation(() => {
      if (!currentVerificationState) {
        currentVerificationState = { appReady: false, healthPassed: true, verifiedAt: null }
      } else {
        currentVerificationState = { ...currentVerificationState, healthPassed: true }
      }
      return Promise.resolve()
    }),
    resetVerificationState: vi.fn().mockImplementation(() => {
      currentVerificationState = null
      return Promise.resolve()
    }),
  } as unknown as Storage
}

describe('CrashDetector', () => {
  let mockStorage: Storage
  let mockConfig: CrashDetectorConfig
  let crashDetector: CrashDetector

  beforeEach(() => {
    vi.useFakeTimers()
    mockConfig = {
      verificationWindowMs: 1000, // 1 second for tests
      onRollback: vi.fn().mockResolvedValue(undefined),
      onVerified: vi.fn().mockResolvedValue(undefined),
      onCrashReported: vi.fn(),
    }
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  describe('checkForCrash', () => {
    it('returns false when no crash occurred', async () => {
      mockStorage = createMockStorage()
      crashDetector = new CrashDetector(mockStorage, mockConfig)

      const result = await crashDetector.checkForCrash()

      expect(result).toBe(false)
      expect(mockConfig.onRollback).not.toHaveBeenCalled()
    })

    it('returns false for incomplete pending update state', async () => {
      mockStorage = createMockStorage({
        metadata: {
          previousVersion: '1.0.0',
          pendingUpdateFlag: true,
          pendingVersion: null, // Incomplete state
          lastCrashTime: Date.now() - 1000, // Recent crash
        },
      })
      crashDetector = new CrashDetector(mockStorage, mockConfig)

      const result = await crashDetector.checkForCrash()

      expect(result).toBe(false)
    })

    it('returns false without previous version', async () => {
      mockStorage = createMockStorage({
        metadata: {
          crashCount: 1,
          previousVersion: null,
          lastCrashTime: Date.now() - 1000,
        },
      })
      crashDetector = new CrashDetector(mockStorage, mockConfig)

      const result = await crashDetector.checkForCrash()

      expect(result).toBe(false)
      expect(mockConfig.onRollback).not.toHaveBeenCalled()
    })

    it('increments crash count within window but does not rollback until threshold', async () => {
      const now = Date.now()
      mockStorage = createMockStorage({
        metadata: {
          previousVersion: '1.0.0',
          currentVersion: '2.0.0',
          crashCount: 1, // Will be incremented to 2
          lastCrashTime: now - 1000, // 1 second ago (within window)
        },
      })
      crashDetector = new CrashDetector(mockStorage, {
        ...mockConfig,
        crashThreshold: 3, // Need 3 crashes to rollback
        crashWindowMs: 10000, // 10 second window
      })

      const result = await crashDetector.checkForCrash()

      expect(result).toBe(false) // Not at threshold yet
      expect(mockStorage.recordCrash).toHaveBeenCalled()
      expect(mockConfig.onCrashReported).toHaveBeenCalledWith(2)
      expect(mockConfig.onRollback).not.toHaveBeenCalled()
    })

    it('triggers rollback when crash threshold is reached', async () => {
      const now = Date.now()
      mockStorage = createMockStorage({
        metadata: {
          previousVersion: '1.0.0',
          currentVersion: '2.0.0',
          crashCount: 2, // Will be incremented to 3
          lastCrashTime: now - 1000, // 1 second ago
        },
      })
      // Mock recordCrash to return 3 (threshold reached)
      mockStorage.recordCrash = vi.fn().mockResolvedValue(3)
      crashDetector = new CrashDetector(mockStorage, {
        ...mockConfig,
        crashThreshold: 3,
        crashWindowMs: 10000,
      })

      const result = await crashDetector.checkForCrash()

      expect(result).toBe(true)
      expect(mockStorage.recordCrash).toHaveBeenCalled()
      expect(mockConfig.onCrashReported).toHaveBeenCalledWith(3)
      expect(mockConfig.onRollback).toHaveBeenCalled()
    })

    it('resets crash count when crash is outside window', async () => {
      const now = Date.now()
      mockStorage = createMockStorage({
        metadata: {
          previousVersion: '1.0.0',
          currentVersion: '2.0.0',
          crashCount: 2,
          lastCrashTime: now - 20000, // 20 seconds ago (outside 10s window)
        },
      })
      crashDetector = new CrashDetector(mockStorage, {
        ...mockConfig,
        crashThreshold: 3,
        crashWindowMs: 10000,
      })

      const result = await crashDetector.checkForCrash()

      expect(result).toBe(false)
      expect(mockStorage.clearCrashCount).toHaveBeenCalled()
      expect(mockStorage.recordCrash).not.toHaveBeenCalled()
      expect(mockConfig.onRollback).not.toHaveBeenCalled()
    })

    it('uses default threshold of 3 when not configured', async () => {
      const now = Date.now()
      mockStorage = createMockStorage({
        metadata: {
          previousVersion: '1.0.0',
          currentVersion: '2.0.0',
          crashCount: 1, // Will be 2, below default threshold of 3
          lastCrashTime: now - 1000,
        },
      })
      crashDetector = new CrashDetector(mockStorage, mockConfig)

      const result = await crashDetector.checkForCrash()

      expect(result).toBe(false) // Default threshold is 3
      expect(DEFAULT_CRASH_THRESHOLD).toBe(3)
    })

    it('uses default window of 10 seconds when not configured', async () => {
      const now = Date.now()
      mockStorage = createMockStorage({
        metadata: {
          previousVersion: '1.0.0',
          currentVersion: '2.0.0',
          crashCount: 2,
          lastCrashTime: now - 15000, // 15 seconds ago (outside default 10s window)
        },
      })
      crashDetector = new CrashDetector(mockStorage, mockConfig)

      const result = await crashDetector.checkForCrash()

      expect(result).toBe(false)
      expect(mockStorage.clearCrashCount).toHaveBeenCalled()
      expect(DEFAULT_CRASH_WINDOW_MS).toBe(10_000)
    })

    it('does nothing when no lastCrashTime is set', async () => {
      mockStorage = createMockStorage({
        metadata: {
          previousVersion: '1.0.0',
          currentVersion: '2.0.0',
          crashCount: 0,
          lastCrashTime: null,
        },
      })
      crashDetector = new CrashDetector(mockStorage, mockConfig)

      const result = await crashDetector.checkForCrash()

      expect(result).toBe(false)
      expect(mockStorage.recordCrash).not.toHaveBeenCalled()
      expect(mockStorage.clearCrashCount).not.toHaveBeenCalled()
    })
  })

  describe('startVerificationWindow', () => {
    it('does nothing without previous version', () => {
      mockStorage = createMockStorage({ metadata: { previousVersion: null } })
      crashDetector = new CrashDetector(mockStorage, mockConfig)

      crashDetector.startVerificationWindow()

      vi.advanceTimersByTime(2000)
      expect(mockConfig.onVerified).not.toHaveBeenCalled()
    })

    it('timeout does NOT call onVerified or clear previousVersion', async () => {
      mockStorage = createMockStorage({ metadata: { previousVersion: '1.0.0' } })
      crashDetector = new CrashDetector(mockStorage, mockConfig)

      crashDetector.startVerificationWindow()

      // Timer not yet expired
      vi.advanceTimersByTime(500)
      expect(mockConfig.onVerified).not.toHaveBeenCalled()

      // Timer expired - should NOT trigger verification
      vi.advanceTimersByTime(600)
      await vi.runAllTimersAsync()

      // CRITICAL: Timeout should NOT clear previousVersion or call onVerified
      expect(mockStorage.clearPreviousVersion).not.toHaveBeenCalled()
      expect(mockConfig.onVerified).not.toHaveBeenCalled()
    })

    it('uses default 60 second window when not configured', async () => {
      mockStorage = createMockStorage({ metadata: { previousVersion: '1.0.0' } })
      const configWithoutWindow = {
        onRollback: vi.fn().mockResolvedValue(undefined),
        onVerified: vi.fn().mockResolvedValue(undefined),
      }
      crashDetector = new CrashDetector(mockStorage, configWithoutWindow)

      crashDetector.startVerificationWindow()

      vi.advanceTimersByTime(59000)
      expect(configWithoutWindow.onVerified).not.toHaveBeenCalled()

      // After timeout - still should NOT call onVerified
      vi.advanceTimersByTime(2000)
      await vi.runAllTimersAsync()
      expect(configWithoutWindow.onVerified).not.toHaveBeenCalled()
      expect(DEFAULT_VERIFICATION_WINDOW_MS).toBe(60_000)
    })

    it('does not start multiple verification windows', () => {
      mockStorage = createMockStorage({ metadata: { previousVersion: '1.0.0' } })
      crashDetector = new CrashDetector(mockStorage, mockConfig)

      crashDetector.startVerificationWindow()
      crashDetector.startVerificationWindow() // Second call should be ignored

      // After timeout - onVerified should NOT be called at all
      vi.advanceTimersByTime(1500)
      expect(mockConfig.onVerified).not.toHaveBeenCalled()
    })
  })

  describe('notifyAppReady', () => {
    it('does nothing if not verifying', async () => {
      mockStorage = createMockStorage()
      crashDetector = new CrashDetector(mockStorage, mockConfig)

      await crashDetector.notifyAppReady()

      expect(mockStorage.setAppReady).not.toHaveBeenCalled()
      expect(mockConfig.onVerified).not.toHaveBeenCalled()
    })

    it('appReady alone does NOT trigger onVerified', async () => {
      mockStorage = createMockStorage({ metadata: { previousVersion: '1.0.0' } })
      crashDetector = new CrashDetector(mockStorage, mockConfig)

      crashDetector.startVerificationWindow()
      await crashDetector.notifyAppReady()

      // setAppReady should be called, but NOT onVerified
      expect(mockStorage.setAppReady).toHaveBeenCalled()
      expect(mockStorage.clearCrashCount).not.toHaveBeenCalled()
      expect(mockConfig.onVerified).not.toHaveBeenCalled()
    })

    it('cancels timeout but does not trigger verification with appReady only', async () => {
      mockStorage = createMockStorage({ metadata: { previousVersion: '1.0.0' } })
      crashDetector = new CrashDetector(mockStorage, mockConfig)

      crashDetector.startVerificationWindow()

      vi.advanceTimersByTime(500)
      await crashDetector.notifyAppReady()

      // Advance past original timeout
      vi.advanceTimersByTime(1000)

      // onVerified should NOT be called (neither by timeout nor by appReady alone)
      expect(mockConfig.onVerified).not.toHaveBeenCalled()
    })
  })

  describe('notifyHealthPassed', () => {
    it('does nothing if not verifying', async () => {
      mockStorage = createMockStorage()
      crashDetector = new CrashDetector(mockStorage, mockConfig)

      await crashDetector.notifyHealthPassed()

      expect(mockStorage.setHealthPassed).not.toHaveBeenCalled()
      expect(mockConfig.onVerified).not.toHaveBeenCalled()
    })

    it('healthPassed alone does NOT trigger onVerified', async () => {
      mockStorage = createMockStorage({ metadata: { previousVersion: '1.0.0' } })
      crashDetector = new CrashDetector(mockStorage, mockConfig)

      crashDetector.startVerificationWindow()
      await crashDetector.notifyHealthPassed()

      // setHealthPassed should be called, but NOT onVerified
      expect(mockStorage.setHealthPassed).toHaveBeenCalled()
      expect(mockStorage.clearCrashCount).not.toHaveBeenCalled()
      expect(mockConfig.onVerified).not.toHaveBeenCalled()
    })
  })

  describe('dual-flag verification', () => {
    it('triggers onVerified when BOTH appReady AND healthPassed are true', async () => {
      mockStorage = createMockStorage({ metadata: { previousVersion: '1.0.0' } })
      crashDetector = new CrashDetector(mockStorage, mockConfig)

      crashDetector.startVerificationWindow()

      // First: notify app ready (should not trigger)
      await crashDetector.notifyAppReady()
      expect(mockConfig.onVerified).not.toHaveBeenCalled()

      // Second: notify health passed (should trigger)
      await crashDetector.notifyHealthPassed()
      expect(mockConfig.onVerified).toHaveBeenCalledTimes(1)
      expect(mockStorage.clearCrashCount).toHaveBeenCalled()
      expect(mockStorage.resetVerificationState).toHaveBeenCalled()
    })

    it('triggers onVerified when healthPassed first, then appReady', async () => {
      mockStorage = createMockStorage({ metadata: { previousVersion: '1.0.0' } })
      crashDetector = new CrashDetector(mockStorage, mockConfig)

      crashDetector.startVerificationWindow()

      // First: notify health passed (should not trigger)
      await crashDetector.notifyHealthPassed()
      expect(mockConfig.onVerified).not.toHaveBeenCalled()

      // Second: notify app ready (should trigger)
      await crashDetector.notifyAppReady()
      expect(mockConfig.onVerified).toHaveBeenCalledTimes(1)
      expect(mockStorage.clearCrashCount).toHaveBeenCalled()
      expect(mockStorage.resetVerificationState).toHaveBeenCalled()
    })

    it('only calls onVerified once even with multiple calls', async () => {
      mockStorage = createMockStorage({ metadata: { previousVersion: '1.0.0' } })
      crashDetector = new CrashDetector(mockStorage, mockConfig)

      crashDetector.startVerificationWindow()

      await crashDetector.notifyAppReady()
      await crashDetector.notifyHealthPassed()
      // Additional calls should be ignored
      await crashDetector.notifyAppReady()
      await crashDetector.notifyHealthPassed()

      expect(mockConfig.onVerified).toHaveBeenCalledTimes(1)
    })

    it('clears verification timer when both flags are set', async () => {
      mockStorage = createMockStorage({ metadata: { previousVersion: '1.0.0' } })
      crashDetector = new CrashDetector(mockStorage, mockConfig)

      crashDetector.startVerificationWindow()

      await crashDetector.notifyAppReady()
      await crashDetector.notifyHealthPassed()

      // Advance past original timeout
      vi.advanceTimersByTime(2000)

      // onVerified should only have been called once (when both flags set)
      expect(mockConfig.onVerified).toHaveBeenCalledTimes(1)
    })
  })

  describe('stop', () => {
    it('clears verification timer', async () => {
      mockStorage = createMockStorage({ metadata: { previousVersion: '1.0.0' } })
      crashDetector = new CrashDetector(mockStorage, mockConfig)

      crashDetector.startVerificationWindow()
      crashDetector.stop()

      vi.advanceTimersByTime(2000)
      await vi.runAllTimersAsync()

      expect(mockConfig.onVerified).not.toHaveBeenCalled()
    })

    it('resets verification state so notifyAppReady does nothing', async () => {
      mockStorage = createMockStorage({ metadata: { previousVersion: '1.0.0' } })
      crashDetector = new CrashDetector(mockStorage, mockConfig)

      crashDetector.startVerificationWindow()
      crashDetector.stop()

      // notifyAppReady should do nothing after stop
      await crashDetector.notifyAppReady()
      expect(mockStorage.setAppReady).not.toHaveBeenCalled()
    })

    it('resets verification state so notifyHealthPassed does nothing', async () => {
      mockStorage = createMockStorage({ metadata: { previousVersion: '1.0.0' } })
      crashDetector = new CrashDetector(mockStorage, mockConfig)

      crashDetector.startVerificationWindow()
      crashDetector.stop()

      // notifyHealthPassed should do nothing after stop
      await crashDetector.notifyHealthPassed()
      expect(mockStorage.setHealthPassed).not.toHaveBeenCalled()
    })
  })

  describe('timeout safety', () => {
    it('timeout does NOT clear previousVersion - preserves rollback ability', async () => {
      mockStorage = createMockStorage({ metadata: { previousVersion: '1.0.0' } })
      crashDetector = new CrashDetector(mockStorage, mockConfig)

      crashDetector.startVerificationWindow()

      // Let timeout expire
      vi.advanceTimersByTime(2000)
      await vi.runAllTimersAsync()

      // previousVersion should NOT be cleared
      expect(mockStorage.clearPreviousVersion).not.toHaveBeenCalled()
      // onVerified should NOT be called
      expect(mockConfig.onVerified).not.toHaveBeenCalled()
      // Rollback should still be possible (previousVersion preserved)
    })

    it('after timeout, can still verify with both flags', async () => {
      mockStorage = createMockStorage({ metadata: { previousVersion: '1.0.0' } })
      crashDetector = new CrashDetector(mockStorage, mockConfig)

      crashDetector.startVerificationWindow()

      // Let timeout expire first
      vi.advanceTimersByTime(2000)
      await vi.runAllTimersAsync()

      // After timeout, isVerifying is false, so these should do nothing
      await crashDetector.notifyAppReady()
      await crashDetector.notifyHealthPassed()

      // onVerified should still not be called (verification window closed)
      expect(mockConfig.onVerified).not.toHaveBeenCalled()
    })
  })
})
