/* eslint-disable @typescript-eslint/no-empty-function */
/**
 * Native Module Tests
 *
 * Tests for the native module bridge and fallback behavior.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { GlobalWithDev } from './global'

// Typed global reference for __DEV__ access
const typedGlobal = globalThis as unknown as GlobalWithDev

// Store original __DEV__ value
const originalDev = typedGlobal.__DEV__

// Default mock for react-native - null module
const mockNativeModules: { BundleNudge: unknown } = { BundleNudge: null }
vi.mock('react-native', () => ({
  NativeModules: mockNativeModules,
  Platform: { OS: 'ios' },
}))

describe('native-module', () => {
  beforeEach(() => {
    vi.resetModules()
    typedGlobal.__DEV__ = true
  })

  afterEach(() => {
    typedGlobal.__DEV__ = originalDev
    vi.clearAllMocks()
  })

  describe('getNativeModule', () => {
    it('returns null when native module not available', async () => {
      mockNativeModules.BundleNudge = null
      vi.resetModules()
      const { getNativeModule } = await import('./native-module')
      const result = getNativeModule()

      expect(result).toBeNull()
    })

    it('logs warning in dev mode when module not available', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      typedGlobal.__DEV__ = true
      mockNativeModules.BundleNudge = null

      vi.resetModules()
      const { getNativeModule } = await import('./native-module')
      getNativeModule()

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[BundleNudge] Native module not found')
      )
      consoleSpy.mockRestore()
    })

    it('does not log warning in production mode', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      typedGlobal.__DEV__ = false
      mockNativeModules.BundleNudge = null

      vi.resetModules()
      const { getNativeModule } = await import('./native-module')
      getNativeModule()

      expect(consoleSpy).not.toHaveBeenCalled()
      consoleSpy.mockRestore()
    })

    it('returns native module when available', async () => {
      const mockModule = {
        getConfiguration: vi.fn(),
        getCurrentBundleInfo: vi.fn(),
        getBundlePath: vi.fn(),
        notifyAppReady: vi.fn(),
        restartApp: vi.fn(),
        clearUpdates: vi.fn(),
        saveBundleToStorage: vi.fn(),
      }

      mockNativeModules.BundleNudge = mockModule
      vi.resetModules()
      const { getNativeModule } = await import('./native-module')
      const result = getNativeModule()

      expect(result).toBe(mockModule)
    })
  })

  describe('createFallbackModule', () => {
    it('returns configuration with default values', async () => {
      vi.resetModules()
      const { createFallbackModule } = await import('./native-module')
      const fallback = createFallbackModule()

      const config = await fallback.getConfiguration()
      expect(config.appVersion).toBe('1.0.0')
      expect(config.buildNumber).toBe('1')
      expect(config.bundleId).toBe('com.unknown.app')
    })

    it('returns null for getCurrentBundleInfo', async () => {
      const { createFallbackModule } = await import('./native-module')
      const fallback = createFallbackModule()

      const result = await fallback.getCurrentBundleInfo()
      expect(result).toBeNull()
    })

    it('returns null for getBundlePath', async () => {
      const { createFallbackModule } = await import('./native-module')
      const fallback = createFallbackModule()

      const result = await fallback.getBundlePath()
      expect(result).toBeNull()
    })

    it('notifyAppReady returns true', async () => {
      const { createFallbackModule } = await import('./native-module')
      const fallback = createFallbackModule()

      const result = await fallback.notifyAppReady()
      expect(result).toBe(true)
    })

    it('restartApp logs warning and returns false', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      typedGlobal.__DEV__ = true

      const { createFallbackModule } = await import('./native-module')
      const fallback = createFallbackModule()

      const result = await fallback.restartApp(true)

      expect(result).toBe(false)
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('restartApp called but native module not available')
      )
      consoleSpy.mockRestore()
    })

    it('clearUpdates logs warning and returns false', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      typedGlobal.__DEV__ = true

      const { createFallbackModule } = await import('./native-module')
      const fallback = createFallbackModule()

      const result = await fallback.clearUpdates()

      expect(result).toBe(false)
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('clearUpdates called but native module not available')
      )
      consoleSpy.mockRestore()
    })

    it('saveBundleToStorage logs warning and returns empty string', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      typedGlobal.__DEV__ = true

      const { createFallbackModule } = await import('./native-module')
      const fallback = createFallbackModule()

      const result = await fallback.saveBundleToStorage('1.0.0', 'base64data')

      expect(result).toBe('')
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('saveBundleToStorage called but native module not available')
      )
      consoleSpy.mockRestore()
    })
  })

  describe('getModuleWithFallback', () => {
    it('returns fallback when native not available', async () => {
      mockNativeModules.BundleNudge = null
      vi.resetModules()
      const { getModuleWithFallback } = await import('./native-module')
      const { module, isNative } = getModuleWithFallback()

      expect(isNative).toBe(false)
      expect(module).toBeDefined()

      const config = await module.getConfiguration()
      expect(config.appVersion).toBe('1.0.0')
    })

    it('returns native module when available', async () => {
      const mockModule = {
        getConfiguration: vi.fn().mockResolvedValue({
          appVersion: '2.0.0',
          buildNumber: '10',
          bundleId: 'com.native.app',
        }),
        getCurrentBundleInfo: vi.fn(),
        getBundlePath: vi.fn(),
        notifyAppReady: vi.fn(),
        restartApp: vi.fn(),
        clearUpdates: vi.fn(),
        saveBundleToStorage: vi.fn(),
      }

      mockNativeModules.BundleNudge = mockModule
      vi.resetModules()
      const { getModuleWithFallback } = await import('./native-module')
      const { module, isNative } = getModuleWithFallback()

      expect(isNative).toBe(true)
      expect(module).toBe(mockModule)
    })
  })
})
