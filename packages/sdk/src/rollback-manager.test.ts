 
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/**
 * RollbackManager Tests
 *
 * Tests for the RollbackManager class that handles rollback operations.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { RollbackManager, type RollbackReason } from './rollback-manager'
import type { Storage } from './storage'
import type { BundleNudgeConfig, NativeModuleInterface, StoredMetadata } from './types'

// Mock global fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

// Helper to create mock storage
function createMockStorage(metadata: Partial<StoredMetadata> = {}): Storage {
  const defaultMetadata: StoredMetadata = {
    deviceId: 'test-device-id',
    accessToken: 'test-access-token',
    currentVersion: '2.0.0',
    currentVersionHash: 'hash200',
    previousVersion: '1.0.0',
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

  return {
    getMetadata: vi.fn().mockReturnValue(defaultMetadata),
    getDeviceId: vi.fn().mockReturnValue(defaultMetadata.deviceId),
    getAccessToken: vi.fn().mockReturnValue(defaultMetadata.accessToken),
    rollback: vi.fn().mockResolvedValue(undefined),
    clearPreviousVersion: vi.fn().mockResolvedValue(undefined),
  } as unknown as Storage
}

// Helper to create mock native module
function createMockNativeModule(): NativeModuleInterface {
  return {
    getConfiguration: vi.fn().mockResolvedValue({
      appVersion: '1.0.0',
      buildNumber: '1',
      bundleId: 'com.test.app',
    }),
    getCurrentBundleInfo: vi.fn().mockResolvedValue(null),
    getBundlePath: vi.fn().mockResolvedValue(null),
    notifyAppReady: vi.fn().mockResolvedValue(true),
    restartApp: vi.fn().mockResolvedValue(true),
    clearUpdates: vi.fn().mockResolvedValue(true),
    saveBundleToStorage: vi.fn().mockResolvedValue('/path/to/bundle'),
    hashFile: vi.fn().mockResolvedValue('mockhash'),
  }
}

describe('RollbackManager', () => {
  let mockStorage: Storage
  let mockConfig: BundleNudgeConfig
  let mockNativeModule: NativeModuleInterface
  let rollbackManager: RollbackManager
  let onRollbackReported: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockResolvedValue({ ok: true })

    mockStorage = createMockStorage()
    mockConfig = {
      appId: 'test-app-id',
      apiUrl: 'https://api.test.com',
    }
    mockNativeModule = createMockNativeModule()
    onRollbackReported = vi.fn()

    rollbackManager = new RollbackManager({
      storage: mockStorage,
      config: mockConfig,
      nativeModule: mockNativeModule,
      onRollbackReported,
    })
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('canRollback', () => {
    it('returns true when previous version exists', () => {
      expect(rollbackManager.canRollback()).toBe(true)
    })

    it('returns false when no previous version', () => {
      mockStorage = createMockStorage({ previousVersion: null })
      rollbackManager = new RollbackManager({
        storage: mockStorage,
        config: mockConfig,
        nativeModule: mockNativeModule,
      })

      expect(rollbackManager.canRollback()).toBe(false)
    })
  })

  describe('getRollbackVersion', () => {
    it('returns previous version', () => {
      expect(rollbackManager.getRollbackVersion()).toBe('1.0.0')
    })

    it('returns null when no previous version', () => {
      mockStorage = createMockStorage({ previousVersion: null })
      rollbackManager = new RollbackManager({
        storage: mockStorage,
        config: mockConfig,
        nativeModule: mockNativeModule,
      })

      expect(rollbackManager.getRollbackVersion()).toBeNull()
    })
  })

  describe('rollback', () => {
    it('throws when no previous version available', async () => {
      mockStorage = createMockStorage({ previousVersion: null })
      rollbackManager = new RollbackManager({
        storage: mockStorage,
        config: mockConfig,
        nativeModule: mockNativeModule,
      })

      await expect(rollbackManager.rollback('manual')).rejects.toThrow(
        'No previous version to rollback to'
      )
    })

    it('updates storage state on rollback', async () => {
      await rollbackManager.rollback('crash_detected')

      expect(mockStorage.rollback).toHaveBeenCalled()
    })

    it('calls onRollbackReported callback', async () => {
      await rollbackManager.rollback('crash_detected')

      expect(onRollbackReported).toHaveBeenCalledWith('crash_detected', '2.0.0')
    })

    it('reports rollback to server', async () => {
      await rollbackManager.rollback('crash_detected')

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/v1/telemetry',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            Authorization: 'Bearer test-access-token',
          }),
        })
      )

      // Verify request body
      const [, options] = mockFetch.mock.calls[0]
      const body = JSON.parse(options.body as string)
      expect(body.deviceId).toBe('test-device-id')
      expect(body.appId).toBe('test-app-id')
      expect(body.eventType).toBe('rollback_triggered')
      expect(body.metadata.reason).toBe('crash_detected')
      expect(body.metadata.rolledBackTo).toBe('1.0.0')
    })

    it('restarts app after rollback', async () => {
      await rollbackManager.rollback('manual')

      expect(mockNativeModule.restartApp).toHaveBeenCalledWith(false)
    })

    it('handles all rollback reasons', async () => {
      const reasons: RollbackReason[] = [
        'crash_detected',
        'route_failure',
        'server_triggered',
        'manual',
      ]

      for (const reason of reasons) {
        vi.clearAllMocks()
        mockStorage = createMockStorage()
        rollbackManager = new RollbackManager({
          storage: mockStorage,
          config: mockConfig,
          nativeModule: mockNativeModule,
          onRollbackReported,
        })

        await rollbackManager.rollback(reason)

        expect(onRollbackReported).toHaveBeenCalledWith(reason, '2.0.0')
      }
    })

    it('uses default API URL when not configured', async () => {
      rollbackManager = new RollbackManager({
        storage: mockStorage,
        config: { appId: 'test-app-id' }, // No apiUrl
        nativeModule: mockNativeModule,
      })

      await rollbackManager.rollback('manual')

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.bundlenudge.com/v1/telemetry',
        expect.any(Object)
      )
    })

    it('continues on telemetry failure', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))

      // Should not throw
      await rollbackManager.rollback('manual')

      expect(mockStorage.rollback).toHaveBeenCalled()
      expect(mockNativeModule.restartApp).toHaveBeenCalled()
    })

    it('does not call callback if no current version', async () => {
      mockStorage = createMockStorage({
        currentVersion: null,
        previousVersion: '1.0.0',
      })
      rollbackManager = new RollbackManager({
        storage: mockStorage,
        config: mockConfig,
        nativeModule: mockNativeModule,
        onRollbackReported,
      })

      await rollbackManager.rollback('manual')

      expect(onRollbackReported).not.toHaveBeenCalled()
    })
  })

  describe('markUpdateVerified', () => {
    it('clears previous version from storage', async () => {
      await rollbackManager.markUpdateVerified()

      expect(mockStorage.clearPreviousVersion).toHaveBeenCalled()
    })
  })
})
