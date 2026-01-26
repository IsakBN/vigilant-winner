/* eslint-disable @typescript-eslint/require-await */
/**
 * Setup Utilities Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { GlobalWithDev } from '../global'

;(globalThis as unknown as GlobalWithDev).__DEV__ = true

const mockFetch = vi.fn()
global.fetch = mockFetch

vi.mock('react-native', () => ({
  NativeModules: { BundleNudge: null },
  Platform: { OS: 'ios' },
}))

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn().mockResolvedValue(null),
    setItem: vi.fn().mockResolvedValue(undefined),
  },
}))

vi.mock('../utils', () => ({
  generateDeviceId: () => 'mock-device-id',
  retry: async <T>(fn: () => Promise<T>) => fn(),
  sha256: async () => 'mock-hash',
  arrayBufferToBase64: () => 'base64data',
}))

function setupDefaultFetchMock(): void {
  mockFetch.mockImplementation((url: string) => {
    if (url.includes('/devices/register')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ accessToken: 'test-token', expiresAt: Date.now() + 3600000 }),
      })
    }
    if (url.includes('/updates/check')) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ updateAvailable: false }) })
    }
    return Promise.resolve({ ok: true })
  })
}

describe('Setup Utilities', () => {
  let setupBundleNudge: typeof import('./index').setupBundleNudge
  let setupCodePush: typeof import('./index').setupCodePush
  let getBundleNudgeStatus: typeof import('./index').getBundleNudgeStatus
  let recordCrash: typeof import('./index').recordCrash
  let BundleNudge: typeof import('../bundlenudge').BundleNudge

  beforeEach(async () => {
    vi.clearAllMocks()
    vi.resetModules()
    setupDefaultFetchMock()

    const setupModule = await import('./index')
    setupBundleNudge = setupModule.setupBundleNudge
    setupCodePush = setupModule.setupCodePush
    getBundleNudgeStatus = setupModule.getBundleNudgeStatus
    recordCrash = setupModule.recordCrash

    const bundleNudgeModule = await import('../bundlenudge')
    BundleNudge = bundleNudgeModule.BundleNudge
    // @ts-expect-error - accessing private static for testing
    BundleNudge.instance = null
  })

  afterEach(() => { vi.resetAllMocks() })

  describe('setupBundleNudge', () => {
    it('initializes SDK with options', async () => {
      await setupBundleNudge({ appId: 'test-app' })
      expect(BundleNudge.getInstance()).toBeDefined()
    })

    it('checkOnStart=true triggers update check', async () => {
      await setupBundleNudge({ appId: 'test-app', checkOnStart: true })
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/updates/check'), expect.any(Object))
    })

    it('checkOnStart=false skips update check', async () => {
      await setupBundleNudge({ appId: 'test-app', checkOnStart: false })
      const updateCheckCalls = mockFetch.mock.calls.filter((call: [string]) => call[0].includes('/updates/check'))
      expect(updateCheckCalls).toHaveLength(0)
    })

    it('calls onUpdateAvailable when update found', async () => {
      const onUpdateAvailable = vi.fn()
      mockFetch.mockImplementation((url: string) => {
        if (url.includes('/devices/register')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ accessToken: 'test-token', expiresAt: Date.now() + 3600000 }),
          })
        }
        if (url.includes('/updates/check')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              updateAvailable: true,
              release: { version: '2.0.0', bundleUrl: 'https://cdn.example.com/bundle.js', bundleSize: 1024, bundleHash: 'abc123', releaseId: 'release-1' },
            }),
          })
        }
        if (url.includes('cdn.example.com')) {
          return Promise.resolve({ ok: true, arrayBuffer: () => Promise.resolve(new ArrayBuffer(1024)) })
        }
        return Promise.resolve({ ok: true })
      })
      await setupBundleNudge({ appId: 'test-app', checkOnStart: true, onUpdateAvailable })
      expect(onUpdateAvailable).toHaveBeenCalledWith(expect.objectContaining({ version: '2.0.0' }))
    })

    it('calls onError on failure', async () => {
      const onError = vi.fn()
      mockFetch.mockImplementation((url: string) => {
        if (url.includes('/devices/register')) return Promise.reject(new Error('Network error'))
        return Promise.resolve({ ok: true })
      })
      await setupBundleNudge({ appId: 'test-app', checkOnStart: false, onError })
      expect(onError).toHaveBeenCalled()
    })
  })

  describe('getBundleNudgeStatus', () => {
    it('returns default state when not initialized', () => {
      expect(getBundleNudgeStatus().currentVersion).toBeNull()
    })

    it('returns state after init', async () => {
      await setupBundleNudge({ appId: 'test-app', checkOnStart: false })
      expect(getBundleNudgeStatus()).toBeDefined()
    })
  })

  describe('recordCrash', () => {
    it('does not throw', async () => { await expect(recordCrash()).resolves.not.toThrow() })
  })

  describe('deprecated aliases', () => {
    it('setupCodePush is alias', () => { expect(setupCodePush).toBe(setupBundleNudge) })
  })
})
