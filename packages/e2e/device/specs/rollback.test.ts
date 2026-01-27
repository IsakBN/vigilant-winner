/**
 * Rollback Tests
 *
 * Tests the automatic rollback functionality:
 * 1. Deploy a "bad" update that crashes
 * 2. SDK detects crash on launch
 * 3. Automatic rollback to previous bundle
 * 4. App restarts with working bundle
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
  notifyAppReady,
  simulateCrash,
  triggerRollback,
  verifyBundleVersion,
  verifyContent,
  waitForUpdateAvailable,
  waitForDownloadComplete,
  clearUpdates,
  wait,
  takeScreenshot,
} from '../helpers'

describe('Rollback', () => {
  beforeAll(async () => {
    // Ensure clean state
    await launchApp()
    await clearUpdates()
    await relaunchApp()
  })

  beforeEach(async () => {
    await device.reloadReactNative()
  })

  afterAll(async () => {
    // Cleanup
    await launchApp()
    await clearUpdates()
  })

  describe('Automatic Rollback', () => {
    it('should rollback after crash on launch', async () => {
      // Install an update first (the "good" version)
      await launchApp()
      await checkForUpdate()
      await waitForUpdateAvailable()
      await downloadUpdate()
      await waitForDownloadComplete()
      await installUpdate()
      await wait(3000)

      // Mark it as verified (good)
      await notifyAppReady()
      await wait(1000)

      const goodVersion = await element(by.id(TestIds.BUNDLE_VERSION_TEXT)).getAttributes()
      await takeScreenshot('good-version-installed')

      // Now install a "bad" update
      // Note: This test requires a "bad" bundle published to the test environment
      await checkForUpdate()
      await waitForUpdateAvailable()
      await downloadUpdate()
      await waitForDownloadComplete()
      await installUpdate()
      await wait(3000)

      // Simulate the "bad" bundle crashing on launch
      // In real scenario, the bad bundle would crash automatically
      await simulateCrash()

      // App should restart and rollback
      await wait(3000)

      // Should be back on the previous good version
      await expect(element(by.id(TestIds.MAIN_SCREEN))).toBeVisible()
      await expect(element(by.id(TestIds.BUNDLE_VERSION_TEXT))).toHaveText(
        (goodVersion as { text?: string }).text ?? ''
      )

      await takeScreenshot('after-automatic-rollback')
    })

    it('should rollback after multiple crashes within window', async () => {
      // Install a "somewhat bad" bundle that crashes intermittently
      await launchApp()
      await checkForUpdate()
      await waitForUpdateAvailable()
      await downloadUpdate()
      await waitForDownloadComplete()
      await installUpdate()
      await wait(3000)

      // Don't call notifyAppReady (simulating crashes before ready)

      // Crash the app multiple times
      await simulateCrash()
      await wait(1000)
      await launchApp()
      await simulateCrash()
      await wait(1000)
      await launchApp()
      await simulateCrash()

      // After crash threshold reached, should rollback
      await wait(3000)

      await expect(element(by.id(TestIds.MAIN_SCREEN))).toBeVisible()
      await verifyBundleVersion('bundled')

      await takeScreenshot('rollback-after-multiple-crashes')
    })

    it('should not rollback if notifyAppReady called before crash', async () => {
      await launchApp()
      await checkForUpdate()
      await waitForUpdateAvailable()
      await downloadUpdate()
      await waitForDownloadComplete()
      await installUpdate()
      await wait(3000)

      // Mark as verified BEFORE any crash
      await notifyAppReady()
      await wait(2000)

      // Get current version (should stay)
      const currentVersion = await element(by.id(TestIds.BUNDLE_VERSION_TEXT)).getAttributes()

      // Now if app crashes, it should NOT rollback (already verified)
      await simulateCrash()
      await wait(2000)
      await launchApp()

      // Should still be on the same version
      await expect(element(by.id(TestIds.BUNDLE_VERSION_TEXT))).toHaveText(
        (currentVersion as { text?: string }).text ?? ''
      )

      await takeScreenshot('no-rollback-after-verified')
    })
  })

  describe('Manual Rollback', () => {
    it('should allow manual rollback', async () => {
      // Install an update
      await launchApp()
      await checkForUpdate()
      await waitForUpdateAvailable()
      await downloadUpdate()
      await waitForDownloadComplete()
      await installUpdate()
      await wait(3000)

      // Verify update installed
      await expect(element(by.id(TestIds.MAIN_SCREEN))).toBeVisible()
      await verifyContent('Updated Content v2')

      // Trigger manual rollback
      await triggerRollback()
      await wait(3000)

      // Should be back on bundled version
      await verifyBundleVersion('bundled')
      await verifyContent('Welcome to TestApp')

      await takeScreenshot('manual-rollback')
    })

    it('should not rollback if no previous version', async () => {
      // Start fresh with no updates
      await launchApp()
      await clearUpdates()
      await relaunchApp()

      // Try to rollback - should have no effect
      await triggerRollback()
      await wait(1000)

      // Should still be on bundled version
      await verifyBundleVersion('bundled')

      await takeScreenshot('rollback-no-previous')
    })
  })

  describe('Crash Detection', () => {
    it('should detect crash within verification window', async () => {
      // Install update
      await launchApp()
      await checkForUpdate()
      await waitForUpdateAvailable()
      await downloadUpdate()
      await waitForDownloadComplete()
      await installUpdate()
      await wait(3000)

      // Crash immediately (within verification window)
      await simulateCrash()
      await wait(1000)
      await launchApp()

      // SDK should detect the crash pattern
      // After threshold, should rollback
      await simulateCrash()
      await wait(1000)
      await launchApp()
      await simulateCrash()
      await wait(3000)

      await expect(element(by.id(TestIds.MAIN_SCREEN))).toBeVisible()

      await takeScreenshot('crash-detection')
    })

    it('should reset crash count after successful verification', async () => {
      await launchApp()
      await checkForUpdate()
      await waitForUpdateAvailable()
      await downloadUpdate()
      await waitForDownloadComplete()
      await installUpdate()
      await wait(3000)

      // Notify app ready (resets crash count)
      await notifyAppReady()
      await wait(2000)

      // Crash after verification - should not trigger rollback
      await simulateCrash()
      await wait(2000)
      await launchApp()

      // Should still be on updated version
      await verifyContent('Updated Content v2')

      await takeScreenshot('crash-after-verification')
    })
  })

  describe('Rollback History', () => {
    it('should report rollback to server', async () => {
      // Install and rollback
      await launchApp()
      await checkForUpdate()
      await waitForUpdateAvailable()
      await downloadUpdate()
      await waitForDownloadComplete()
      await installUpdate()
      await wait(3000)

      // Force rollback via crash
      await simulateCrash()
      await wait(1000)
      await launchApp()
      await simulateCrash()
      await wait(1000)
      await launchApp()
      await simulateCrash()
      await wait(3000)

      // Rollback happened
      await expect(element(by.id(TestIds.MAIN_SCREEN))).toBeVisible()

      // On next launch, SDK should report rollback to backend
      await relaunchApp()
      await wait(2000)

      // Note: Actual verification would require checking backend logs
      await takeScreenshot('rollback-reported')
    })
  })

  describe('Edge Cases', () => {
    it('should handle rollback during download', async () => {
      await launchApp()
      await checkForUpdate()
      await waitForUpdateAvailable()

      // Start download
      await element(by.id(TestIds.DOWNLOAD_BUTTON)).tap()

      // Trigger rollback mid-download (edge case)
      await wait(500)
      await triggerRollback()

      // Should handle gracefully
      await wait(2000)
      await expect(element(by.id(TestIds.MAIN_SCREEN))).toBeVisible()

      await takeScreenshot('rollback-during-download')
    })

    it('should preserve rollback state across cold starts', async () => {
      // Install update then force rollback
      await launchApp()
      await checkForUpdate()
      await waitForUpdateAvailable()
      await downloadUpdate()
      await waitForDownloadComplete()
      await installUpdate()
      await wait(3000)

      // Trigger rollback
      await triggerRollback()
      await wait(3000)

      await verifyBundleVersion('bundled')

      // Cold restart
      await device.terminateApp()
      await wait(1000)
      await device.launchApp({ newInstance: true })
      await wait(3000)

      // Should still be on bundled version
      await verifyBundleVersion('bundled')

      await takeScreenshot('rollback-persisted')
    })
  })
})
