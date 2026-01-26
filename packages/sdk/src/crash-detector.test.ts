/* eslint-disable @typescript-eslint/unbound-method */
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
import type { Storage } from './storage'
import type { StoredMetadata } from './types'

// Helper to create mock storage
function createMockStorage(metadata: Partial<StoredMetadata> = {}): Storage {
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
    ...metadata,
  }

  return {
    getMetadata: vi.fn().mockReturnValue(defaultMetadata),
    recordCrash: vi.fn().mockResolvedValue(defaultMetadata.crashCount + 1),
    clearCrashCount: vi.fn().mockResolvedValue(undefined),
    clearPreviousVersion: vi.fn().mockResolvedValue(undefined),
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
        previousVersion: '1.0.0',
        pendingUpdateFlag: true,
        pendingVersion: null, // Incomplete state
        lastCrashTime: Date.now() - 1000, // Recent crash
      })
      crashDetector = new CrashDetector(mockStorage, mockConfig)

      const result = await crashDetector.checkForCrash()

      expect(result).toBe(false)
    })

    it('returns false without previous version', async () => {
      mockStorage = createMockStorage({
        crashCount: 1,
        previousVersion: null,
        lastCrashTime: Date.now() - 1000,
      })
      crashDetector = new CrashDetector(mockStorage, mockConfig)

      const result = await crashDetector.checkForCrash()

      expect(result).toBe(false)
      expect(mockConfig.onRollback).not.toHaveBeenCalled()
    })

    it('increments crash count within window but does not rollback until threshold', async () => {
      const now = Date.now()
      mockStorage = createMockStorage({
        previousVersion: '1.0.0',
        currentVersion: '2.0.0',
        crashCount: 1, // Will be incremented to 2
        lastCrashTime: now - 1000, // 1 second ago (within window)
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
        previousVersion: '1.0.0',
        currentVersion: '2.0.0',
        crashCount: 2, // Will be incremented to 3
        lastCrashTime: now - 1000, // 1 second ago
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
        previousVersion: '1.0.0',
        currentVersion: '2.0.0',
        crashCount: 2,
        lastCrashTime: now - 20000, // 20 seconds ago (outside 10s window)
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
        previousVersion: '1.0.0',
        currentVersion: '2.0.0',
        crashCount: 1, // Will be 2, below default threshold of 3
        lastCrashTime: now - 1000,
      })
      crashDetector = new CrashDetector(mockStorage, mockConfig)

      const result = await crashDetector.checkForCrash()

      expect(result).toBe(false) // Default threshold is 3
      expect(DEFAULT_CRASH_THRESHOLD).toBe(3)
    })

    it('uses default window of 10 seconds when not configured', async () => {
      const now = Date.now()
      mockStorage = createMockStorage({
        previousVersion: '1.0.0',
        currentVersion: '2.0.0',
        crashCount: 2,
        lastCrashTime: now - 15000, // 15 seconds ago (outside default 10s window)
      })
      crashDetector = new CrashDetector(mockStorage, mockConfig)

      const result = await crashDetector.checkForCrash()

      expect(result).toBe(false)
      expect(mockStorage.clearCrashCount).toHaveBeenCalled()
      expect(DEFAULT_CRASH_WINDOW_MS).toBe(10_000)
    })

    it('does nothing when no lastCrashTime is set', async () => {
      mockStorage = createMockStorage({
        previousVersion: '1.0.0',
        currentVersion: '2.0.0',
        crashCount: 0,
        lastCrashTime: null,
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
      mockStorage = createMockStorage({ previousVersion: null })
      crashDetector = new CrashDetector(mockStorage, mockConfig)

      crashDetector.startVerificationWindow()

      vi.advanceTimersByTime(2000)
      expect(mockConfig.onVerified).not.toHaveBeenCalled()
    })

    it('starts verification timer with previous version', async () => {
      mockStorage = createMockStorage({ previousVersion: '1.0.0' })
      crashDetector = new CrashDetector(mockStorage, mockConfig)

      crashDetector.startVerificationWindow()

      // Timer not yet expired
      vi.advanceTimersByTime(500)
      expect(mockConfig.onVerified).not.toHaveBeenCalled()

      // Timer expired
      vi.advanceTimersByTime(600)
      await vi.runAllTimersAsync()

      expect(mockStorage.clearPreviousVersion).toHaveBeenCalled()
      expect(mockConfig.onVerified).toHaveBeenCalled()
    })

    it('uses default 60 second window when not configured', async () => {
      mockStorage = createMockStorage({ previousVersion: '1.0.0' })
      const configWithoutWindow = {
        onRollback: vi.fn().mockResolvedValue(undefined),
        onVerified: vi.fn().mockResolvedValue(undefined),
      }
      crashDetector = new CrashDetector(mockStorage, configWithoutWindow)

      crashDetector.startVerificationWindow()

      vi.advanceTimersByTime(59000)
      expect(configWithoutWindow.onVerified).not.toHaveBeenCalled()

      vi.advanceTimersByTime(2000)
      await vi.runAllTimersAsync()
      expect(configWithoutWindow.onVerified).toHaveBeenCalled()
      expect(DEFAULT_VERIFICATION_WINDOW_MS).toBe(60_000)
    })

    it('does not start multiple verification windows', async () => {
      mockStorage = createMockStorage({ previousVersion: '1.0.0' })
      crashDetector = new CrashDetector(mockStorage, mockConfig)

      crashDetector.startVerificationWindow()
      crashDetector.startVerificationWindow() // Second call should be ignored

      vi.advanceTimersByTime(1500)
      await vi.runAllTimersAsync()
      // onVerified should only be called once
      expect(mockConfig.onVerified).toHaveBeenCalledTimes(1)
    })
  })

  describe('notifyAppReady', () => {
    it('does nothing if not verifying', async () => {
      mockStorage = createMockStorage()
      crashDetector = new CrashDetector(mockStorage, mockConfig)

      await crashDetector.notifyAppReady()

      expect(mockStorage.clearCrashCount).not.toHaveBeenCalled()
      expect(mockConfig.onVerified).not.toHaveBeenCalled()
    })

    it('clears verification and marks as verified', async () => {
      mockStorage = createMockStorage({ previousVersion: '1.0.0' })
      crashDetector = new CrashDetector(mockStorage, mockConfig)

      crashDetector.startVerificationWindow()
      await crashDetector.notifyAppReady()

      expect(mockStorage.clearCrashCount).toHaveBeenCalled()
      expect(mockConfig.onVerified).toHaveBeenCalled()

      // Timer should be cleared - advancing should not call verified again
      vi.advanceTimersByTime(2000)
      expect(mockConfig.onVerified).toHaveBeenCalledTimes(1)
    })

    it('cancels pending timeout when called', async () => {
      mockStorage = createMockStorage({ previousVersion: '1.0.0' })
      crashDetector = new CrashDetector(mockStorage, mockConfig)

      crashDetector.startVerificationWindow()

      vi.advanceTimersByTime(500)
      await crashDetector.notifyAppReady()

      // Advance past original timeout
      vi.advanceTimersByTime(1000)

      // onVerified called only once by notifyAppReady
      expect(mockConfig.onVerified).toHaveBeenCalledTimes(1)
    })
  })

  describe('stop', () => {
    it('clears verification timer', async () => {
      mockStorage = createMockStorage({ previousVersion: '1.0.0' })
      crashDetector = new CrashDetector(mockStorage, mockConfig)

      crashDetector.startVerificationWindow()
      crashDetector.stop()

      vi.advanceTimersByTime(2000)
      await vi.runAllTimersAsync()

      expect(mockConfig.onVerified).not.toHaveBeenCalled()
    })

    it('resets verification state', async () => {
      mockStorage = createMockStorage({ previousVersion: '1.0.0' })
      crashDetector = new CrashDetector(mockStorage, mockConfig)

      crashDetector.startVerificationWindow()
      crashDetector.stop()

      // notifyAppReady should do nothing after stop
      await crashDetector.notifyAppReady()
      expect(mockStorage.clearCrashCount).not.toHaveBeenCalled()
    })
  })
})
