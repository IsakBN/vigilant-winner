/**
 * App Helpers
 *
 * Common test utilities for interacting with the test application.
 */

import { device, element, by, waitFor, expect } from 'detox'

/** Test IDs used in the test app */
export const TestIds = {
  // Main screen
  MAIN_SCREEN: 'main-screen',
  VERSION_TEXT: 'version-text',
  BUNDLE_VERSION_TEXT: 'bundle-version-text',
  CONTENT_TEXT: 'content-text',

  // Update controls
  CHECK_UPDATE_BUTTON: 'check-update-button',
  DOWNLOAD_BUTTON: 'download-button',
  INSTALL_BUTTON: 'install-button',
  SYNC_BUTTON: 'sync-button',
  CLEAR_UPDATES_BUTTON: 'clear-updates-button',

  // Status indicators
  UPDATE_STATUS: 'update-status',
  DOWNLOAD_PROGRESS: 'download-progress',
  ERROR_TEXT: 'error-text',

  // Debug controls
  CRASH_BUTTON: 'crash-button',
  NOTIFY_READY_BUTTON: 'notify-ready-button',
  ROLLBACK_BUTTON: 'rollback-button',
} as const

/** Default timeout for waiting operations (ms) */
const DEFAULT_TIMEOUT = 30000

/** Extended timeout for network operations (ms) */
const NETWORK_TIMEOUT = 60000

/** Launch the app with optional launch arguments */
export async function launchApp(launchArgs?: Record<string, string>): Promise<void> {
  await device.launchApp({
    newInstance: true,
    launchArgs: launchArgs ?? {},
  })
  await waitFor(element(by.id(TestIds.MAIN_SCREEN)))
    .toBeVisible()
    .withTimeout(DEFAULT_TIMEOUT)
}

/** Relaunch the app (simulates kill and restart) */
export async function relaunchApp(): Promise<void> {
  await device.terminateApp()
  await device.launchApp({ newInstance: true })
  await waitFor(element(by.id(TestIds.MAIN_SCREEN)))
    .toBeVisible()
    .withTimeout(DEFAULT_TIMEOUT)
}

/** Reload the app (uses React Native reload) */
export async function reloadApp(): Promise<void> {
  await device.reloadReactNative()
  await waitFor(element(by.id(TestIds.MAIN_SCREEN)))
    .toBeVisible()
    .withTimeout(DEFAULT_TIMEOUT)
}

/** Wait for the SDK to check for updates */
export async function waitForUpdateCheck(): Promise<void> {
  await waitFor(element(by.id(TestIds.UPDATE_STATUS)))
    .toHaveText('checking')
    .withTimeout(DEFAULT_TIMEOUT)
  await waitFor(element(by.id(TestIds.UPDATE_STATUS)))
    .not.toHaveText('checking')
    .withTimeout(NETWORK_TIMEOUT)
}

/** Trigger an update check manually */
export async function checkForUpdate(): Promise<void> {
  await element(by.id(TestIds.CHECK_UPDATE_BUTTON)).tap()
  await waitForUpdateCheck()
}

/** Wait for an update to be available */
export async function waitForUpdateAvailable(): Promise<void> {
  await waitFor(element(by.id(TestIds.UPDATE_STATUS)))
    .toHaveText('update-available')
    .withTimeout(NETWORK_TIMEOUT)
}

/** Download the available update */
export async function downloadUpdate(): Promise<void> {
  await element(by.id(TestIds.DOWNLOAD_BUTTON)).tap()
  await waitFor(element(by.id(TestIds.UPDATE_STATUS)))
    .toHaveText('downloading')
    .withTimeout(DEFAULT_TIMEOUT)
  await waitFor(element(by.id(TestIds.UPDATE_STATUS)))
    .not.toHaveText('downloading')
    .withTimeout(NETWORK_TIMEOUT)
}

/** Install the downloaded update */
export async function installUpdate(): Promise<void> {
  await element(by.id(TestIds.INSTALL_BUTTON)).tap()
}

/** Trigger sync (check + download + install if available) */
export async function syncUpdate(): Promise<void> {
  await element(by.id(TestIds.SYNC_BUTTON)).tap()
}

/** Wait for download to complete */
export async function waitForDownloadComplete(): Promise<void> {
  await waitFor(element(by.id(TestIds.UPDATE_STATUS)))
    .toHaveText('installing')
    .withTimeout(NETWORK_TIMEOUT)
}

/** Clear all downloaded updates */
export async function clearUpdates(): Promise<void> {
  await element(by.id(TestIds.CLEAR_UPDATES_BUTTON)).tap()
}

/** Notify SDK that app is ready */
export async function notifyAppReady(): Promise<void> {
  await element(by.id(TestIds.NOTIFY_READY_BUTTON)).tap()
}

/** Trigger a manual rollback */
export async function triggerRollback(): Promise<void> {
  await element(by.id(TestIds.ROLLBACK_BUTTON)).tap()
}

/** Simulate a crash in the app */
export async function simulateCrash(): Promise<void> {
  await element(by.id(TestIds.CRASH_BUTTON)).tap()
}

/** Get the current bundle version displayed */
export async function getBundleVersion(): Promise<string> {
  const attributes = await element(by.id(TestIds.BUNDLE_VERSION_TEXT)).getAttributes()
  return (attributes as { text?: string }).text ?? ''
}

/** Get the current content text displayed */
export async function getContentText(): Promise<string> {
  const attributes = await element(by.id(TestIds.CONTENT_TEXT)).getAttributes()
  return (attributes as { text?: string }).text ?? ''
}

/** Get the current update status */
export async function getUpdateStatus(): Promise<string> {
  const attributes = await element(by.id(TestIds.UPDATE_STATUS)).getAttributes()
  return (attributes as { text?: string }).text ?? ''
}

/** Verify the bundle version matches expected */
export async function verifyBundleVersion(expectedVersion: string): Promise<void> {
  await waitFor(element(by.id(TestIds.BUNDLE_VERSION_TEXT)))
    .toHaveText(expectedVersion)
    .withTimeout(DEFAULT_TIMEOUT)
}

/** Verify content text matches expected (for verifying update applied) */
export async function verifyContent(expectedContent: string): Promise<void> {
  await waitFor(element(by.id(TestIds.CONTENT_TEXT)))
    .toHaveText(expectedContent)
    .withTimeout(DEFAULT_TIMEOUT)
}

/** Verify app shows error state */
export async function verifyError(errorMessage?: string): Promise<void> {
  await waitFor(element(by.id(TestIds.UPDATE_STATUS)))
    .toHaveText('error')
    .withTimeout(DEFAULT_TIMEOUT)
  if (errorMessage) {
    await expect(element(by.id(TestIds.ERROR_TEXT))).toHaveText(errorMessage)
  }
}

/** Verify app is in up-to-date state */
export async function verifyUpToDate(): Promise<void> {
  await waitFor(element(by.id(TestIds.UPDATE_STATUS)))
    .toHaveText('up-to-date')
    .withTimeout(DEFAULT_TIMEOUT)
}

/** Set device to airplane mode (offline) */
export async function setOffline(): Promise<void> {
  await device.setURLBlacklist(['.*api.bundlenudge.com.*', '.*localhost.*'])
}

/** Restore network connectivity */
export async function setOnline(): Promise<void> {
  await device.setURLBlacklist([])
}

/** Wait for specified duration */
export async function wait(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms))
}

/** Take a screenshot with a descriptive name */
export async function takeScreenshot(name: string): Promise<void> {
  await device.takeScreenshot(name)
}

/** Get device platform */
export function getPlatform(): 'ios' | 'android' {
  return device.getPlatform() as 'ios' | 'android'
}

/** Check if running on iOS */
export function isIOS(): boolean {
  return getPlatform() === 'ios'
}

/** Check if running on Android */
export function isAndroid(): boolean {
  return getPlatform() === 'android'
}
