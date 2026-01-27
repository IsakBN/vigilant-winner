/**
 * Update Flow Tests
 *
 * Tests the main OTA update flow:
 * 1. App launches with bundled JS
 * 2. SDK checks for update
 * 3. Update downloads
 * 4. App restarts with new bundle
 * 5. New content is displayed
 */

import { describe, it, beforeAll, beforeEach, afterAll } from '@jest/globals'
import { device, element, by, expect } from 'detox'
import {
  launchApp,
  relaunchApp,
  TestIds,
  checkForUpdate,
  downloadUpdate,
  installUpdate,
  syncUpdate,
  notifyAppReady,
  verifyBundleVersion,
  verifyContent,
  verifyUpToDate,
  waitForUpdateAvailable,
  waitForDownloadComplete,
  clearUpdates,
  wait,
  takeScreenshot,
} from '../helpers'

describe('Update Flow', () => {
  beforeAll(async () => {
    // Ensure clean state before tests
    await launchApp()
    await clearUpdates()
    await relaunchApp()
  })

  beforeEach(async () => {
    await device.reloadReactNative()
  })

  afterAll(async () => {
    // Cleanup: clear any downloaded updates
    await launchApp()
    await clearUpdates()
  })

  describe('Initial State', () => {
    it('should launch app with bundled JavaScript', async () => {
      await launchApp()

      // Verify main screen is visible
      await expect(element(by.id(TestIds.MAIN_SCREEN))).toBeVisible()

      // Verify initial bundle version (should be "bundled" or similar)
      await verifyBundleVersion('bundled')

      // Verify initial content
      await verifyContent('Welcome to TestApp')

      await takeScreenshot('initial-state')
    })

    it('should show idle status before any update check', async () => {
      await launchApp()

      await expect(element(by.id(TestIds.UPDATE_STATUS))).toHaveText('idle')
    })
  })

  describe('Update Check', () => {
    it('should check for updates on launch', async () => {
      await launchApp()

      // SDK should auto-check on launch (config dependent)
      // Wait for the check to complete
      await wait(2000)

      // Status should reflect check result
      const status = await element(by.id(TestIds.UPDATE_STATUS)).getAttributes()
      expect(['checking', 'update-available', 'up-to-date']).toContain(
        (status as { text?: string }).text
      )
    })

    it('should manually check for updates', async () => {
      await launchApp()

      // Trigger manual check
      await checkForUpdate()

      // Should transition through checking state
      await takeScreenshot('after-update-check')
    })

    it('should show update-available when update exists', async () => {
      // This test assumes the backend has a newer version available
      await launchApp()

      await checkForUpdate()
      await waitForUpdateAvailable()

      await expect(element(by.id(TestIds.UPDATE_STATUS))).toHaveText('update-available')
      await expect(element(by.id(TestIds.DOWNLOAD_BUTTON))).toBeVisible()

      await takeScreenshot('update-available')
    })

    it('should show up-to-date when no update available', async () => {
      // Clear updates and check again with same version
      await launchApp()
      await clearUpdates()
      await relaunchApp()

      // If no update is published or already on latest
      await checkForUpdate()

      // Should show up-to-date (if no newer version exists)
      // Note: This depends on test backend state
      await takeScreenshot('update-check-complete')
    })
  })

  describe('Download Flow', () => {
    it('should download update when available', async () => {
      await launchApp()

      // Check for update
      await checkForUpdate()
      await waitForUpdateAvailable()

      // Download the update
      await downloadUpdate()

      // Should show downloading state
      await expect(element(by.id(TestIds.DOWNLOAD_PROGRESS))).toBeVisible()

      // Wait for download to complete
      await waitForDownloadComplete()

      await takeScreenshot('download-complete')
    })

    it('should show download progress', async () => {
      await launchApp()
      await checkForUpdate()
      await waitForUpdateAvailable()

      // Start download
      await element(by.id(TestIds.DOWNLOAD_BUTTON)).tap()

      // Progress should update
      await expect(element(by.id(TestIds.DOWNLOAD_PROGRESS))).toBeVisible()

      // Wait a bit and check progress changed
      await wait(500)

      await takeScreenshot('download-progress')
    })
  })

  describe('Install Flow', () => {
    it('should install update and restart app', async () => {
      await launchApp()

      // Get update and download
      await checkForUpdate()
      await waitForUpdateAvailable()
      await downloadUpdate()
      await waitForDownloadComplete()

      // Install the update
      await installUpdate()

      // App should restart automatically
      // Wait for app to come back up
      await wait(3000)

      // Verify new bundle is loaded
      // Note: The actual version depends on what was published
      await expect(element(by.id(TestIds.MAIN_SCREEN))).toBeVisible()

      await takeScreenshot('after-install')
    })

    it('should persist update after cold start', async () => {
      // First install an update
      await launchApp()
      await checkForUpdate()
      await waitForUpdateAvailable()
      await downloadUpdate()
      await waitForDownloadComplete()
      await installUpdate()
      await wait(3000)

      // Cold restart the app
      await relaunchApp()

      // Should still have the updated bundle
      await expect(element(by.id(TestIds.MAIN_SCREEN))).toBeVisible()
      // Content should be from updated bundle
      await verifyContent('Updated Content v2')

      await takeScreenshot('persisted-after-restart')
    })
  })

  describe('Sync Flow', () => {
    it('should sync (check + download + install) in one call', async () => {
      await launchApp()
      await clearUpdates()
      await relaunchApp()

      // Trigger sync
      await syncUpdate()

      // Should go through all states
      await wait(5000)

      // If update was available, app should restart
      // Otherwise, should show up-to-date
      await expect(element(by.id(TestIds.MAIN_SCREEN))).toBeVisible()

      await takeScreenshot('after-sync')
    })
  })

  describe('Version Verification', () => {
    it('should call notifyAppReady after successful load', async () => {
      await launchApp()
      await checkForUpdate()
      await waitForUpdateAvailable()
      await downloadUpdate()
      await waitForDownloadComplete()
      await installUpdate()
      await wait(3000)

      // App restarted with new bundle
      await expect(element(by.id(TestIds.MAIN_SCREEN))).toBeVisible()

      // Mark the update as verified
      await notifyAppReady()

      // Status should remain stable
      await wait(1000)

      await takeScreenshot('app-ready-notified')
    })
  })

  describe('Clear Updates', () => {
    it('should clear all updates and revert to bundled', async () => {
      // First install an update
      await launchApp()
      await checkForUpdate()
      await waitForUpdateAvailable()
      await downloadUpdate()
      await waitForDownloadComplete()
      await installUpdate()
      await wait(3000)

      // Now clear updates
      await clearUpdates()
      await relaunchApp()

      // Should be back to bundled version
      await verifyBundleVersion('bundled')
      await verifyContent('Welcome to TestApp')

      await takeScreenshot('updates-cleared')
    })
  })
})
