/**
 * Offline Behavior Tests
 *
 * Tests SDK behavior when offline:
 * 1. App works without network
 * 2. Update check fails gracefully
 * 3. Cached bundle is used
 * 4. Updates resume when online
 */

import { describe, it, beforeAll, beforeEach, afterAll, afterEach } from '@jest/globals'
import { device, element, by, expect } from 'detox'
import {
  launchApp,
  relaunchApp,
  TestIds,
  checkForUpdate,
  downloadUpdate,
  syncUpdate,
  verifyBundleVersion,
  verifyContent,
  verifyError,
  verifyUpToDate,
  waitForUpdateAvailable,
  waitForDownloadComplete,
  clearUpdates,
  setOffline,
  setOnline,
  wait,
  takeScreenshot,
  installUpdate,
} from '../helpers'

describe('Offline Behavior', () => {
  beforeAll(async () => {
    // Ensure clean state and online
    await setOnline()
    await launchApp()
    await clearUpdates()
    await relaunchApp()
  })

  beforeEach(async () => {
    await device.reloadReactNative()
    await setOnline()
  })

  afterEach(async () => {
    // Always restore network after each test
    await setOnline()
  })

  afterAll(async () => {
    await setOnline()
    await launchApp()
    await clearUpdates()
  })

  describe('Offline App Launch', () => {
    it('should launch app offline with bundled JS', async () => {
      await setOffline()
      await launchApp()

      // App should work with bundled JavaScript
      await expect(element(by.id(TestIds.MAIN_SCREEN))).toBeVisible()
      await verifyBundleVersion('bundled')
      await verifyContent('Welcome to TestApp')

      await takeScreenshot('offline-bundled-launch')
    })

    it('should launch app offline with cached update', async () => {
      // First, install an update while online
      await setOnline()
      await launchApp()
      await checkForUpdate()
      await waitForUpdateAvailable()
      await downloadUpdate()
      await waitForDownloadComplete()
      await installUpdate()
      await wait(3000)

      // Verify update installed
      await verifyContent('Updated Content v2')

      // Now go offline and restart
      await setOffline()
      await relaunchApp()

      // Should still have cached update
      await expect(element(by.id(TestIds.MAIN_SCREEN))).toBeVisible()
      await verifyContent('Updated Content v2')

      await takeScreenshot('offline-cached-launch')
    })
  })

  describe('Offline Update Check', () => {
    it('should handle update check gracefully when offline', async () => {
      await launchApp()
      await setOffline()

      // Attempt to check for updates
      await checkForUpdate()

      // Should show error state but not crash
      await verifyError()

      await takeScreenshot('offline-update-check')
    })

    it('should not show update-available when offline', async () => {
      await launchApp()
      await setOffline()

      await checkForUpdate()

      // Should NOT show update-available (can't reach server)
      const status = await element(by.id(TestIds.UPDATE_STATUS)).getAttributes()
      expect((status as { text?: string }).text).not.toBe('update-available')

      await takeScreenshot('offline-no-update-available')
    })

    it('should retry update check when back online', async () => {
      await launchApp()
      await setOffline()

      // Failed check while offline
      await checkForUpdate()
      await verifyError()

      // Go back online
      await setOnline()
      await wait(1000)

      // Retry check - should work now
      await checkForUpdate()

      // Should get actual result (either update-available or up-to-date)
      const status = await element(by.id(TestIds.UPDATE_STATUS)).getAttributes()
      expect(['update-available', 'up-to-date']).toContain((status as { text?: string }).text)

      await takeScreenshot('online-retry-check')
    })
  })

  describe('Offline Download', () => {
    it('should fail download gracefully when offline', async () => {
      // Start online, find update
      await launchApp()
      await checkForUpdate()
      await waitForUpdateAvailable()

      // Go offline before download
      await setOffline()

      // Attempt download
      await element(by.id(TestIds.DOWNLOAD_BUTTON)).tap()

      // Should fail gracefully
      await wait(5000)
      await verifyError()

      await takeScreenshot('offline-download-failed')
    })

    it('should resume download when back online', async () => {
      // Start online, find update
      await launchApp()
      await checkForUpdate()
      await waitForUpdateAvailable()

      // Go offline before download
      await setOffline()
      await element(by.id(TestIds.DOWNLOAD_BUTTON)).tap()
      await wait(2000)

      // Go back online
      await setOnline()
      await wait(1000)

      // Retry - should complete
      await checkForUpdate()
      await waitForUpdateAvailable()
      await downloadUpdate()
      await waitForDownloadComplete()

      await takeScreenshot('online-download-resumed')
    })

    it('should handle network loss during download', async () => {
      await launchApp()
      await checkForUpdate()
      await waitForUpdateAvailable()

      // Start download
      await element(by.id(TestIds.DOWNLOAD_BUTTON)).tap()
      await wait(500)

      // Kill network mid-download
      await setOffline()
      await wait(5000)

      // Should fail gracefully
      const status = await element(by.id(TestIds.UPDATE_STATUS)).getAttributes()
      expect(['error', 'update-available']).toContain((status as { text?: string }).text)

      await takeScreenshot('network-loss-during-download')
    })
  })

  describe('Offline Sync', () => {
    it('should handle sync gracefully when offline', async () => {
      await launchApp()
      await setOffline()

      // Attempt sync
      await syncUpdate()

      // Should fail but not crash
      await wait(5000)
      await expect(element(by.id(TestIds.MAIN_SCREEN))).toBeVisible()

      await takeScreenshot('offline-sync')
    })
  })

  describe('Network Transitions', () => {
    it('should recover from intermittent network', async () => {
      await launchApp()

      // Offline -> check fails
      await setOffline()
      await checkForUpdate()
      await verifyError()

      // Online -> check works
      await setOnline()
      await wait(1000)
      await checkForUpdate()

      // Offline -> download fails
      await waitForUpdateAvailable()
      await setOffline()
      await element(by.id(TestIds.DOWNLOAD_BUTTON)).tap()
      await wait(3000)

      // Online -> download works
      await setOnline()
      await wait(1000)
      await checkForUpdate()
      await waitForUpdateAvailable()
      await downloadUpdate()
      await waitForDownloadComplete()

      await takeScreenshot('intermittent-network-recovery')
    })

    it('should handle airplane mode toggle', async () => {
      await launchApp()

      // Check update while online
      await checkForUpdate()

      // Toggle airplane mode
      await setOffline()
      await wait(1000)
      await setOnline()
      await wait(1000)

      // Should still work
      await checkForUpdate()
      await expect(element(by.id(TestIds.MAIN_SCREEN))).toBeVisible()

      await takeScreenshot('airplane-mode-toggle')
    })
  })

  describe('Cached Data', () => {
    it('should use cached bundle when offline', async () => {
      // Install update while online
      await setOnline()
      await launchApp()
      await checkForUpdate()
      await waitForUpdateAvailable()
      await downloadUpdate()
      await waitForDownloadComplete()
      await installUpdate()
      await wait(3000)

      const version = await element(by.id(TestIds.BUNDLE_VERSION_TEXT)).getAttributes()

      // Multiple offline restarts should use cached bundle
      await setOffline()

      await relaunchApp()
      await expect(element(by.id(TestIds.BUNDLE_VERSION_TEXT))).toHaveText(
        (version as { text?: string }).text ?? ''
      )

      await relaunchApp()
      await expect(element(by.id(TestIds.BUNDLE_VERSION_TEXT))).toHaveText(
        (version as { text?: string }).text ?? ''
      )

      await takeScreenshot('cached-bundle-offline')
    })

    it('should preserve device token across offline sessions', async () => {
      // First launch online (device gets registered)
      await setOnline()
      await launchApp()
      await wait(2000)

      // Go offline and restart multiple times
      await setOffline()
      await relaunchApp()
      await relaunchApp()

      // Go back online
      await setOnline()
      await wait(1000)

      // Should not need to re-register
      // Check should work immediately
      await checkForUpdate()

      const status = await element(by.id(TestIds.UPDATE_STATUS)).getAttributes()
      expect(['update-available', 'up-to-date']).toContain((status as { text?: string }).text)

      await takeScreenshot('token-preserved-offline')
    })
  })

  describe('Error Messages', () => {
    it('should show user-friendly offline error', async () => {
      await launchApp()
      await setOffline()

      await checkForUpdate()

      // Should show appropriate error
      await expect(element(by.id(TestIds.ERROR_TEXT))).toBeVisible()

      await takeScreenshot('offline-error-message')
    })

    it('should clear error when operation succeeds', async () => {
      await launchApp()

      // Fail while offline
      await setOffline()
      await checkForUpdate()
      await verifyError()

      // Succeed when online
      await setOnline()
      await wait(1000)
      await checkForUpdate()

      // Error should be cleared
      const errorElement = element(by.id(TestIds.ERROR_TEXT))
      await expect(errorElement).not.toBeVisible()

      await takeScreenshot('error-cleared')
    })
  })
})
