/**
 * Test Helpers
 *
 * Export all test utilities for device tests.
 */

export {
  TestIds,
  launchApp,
  relaunchApp,
  reloadApp,
  waitForUpdateCheck,
  checkForUpdate,
  waitForUpdateAvailable,
  downloadUpdate,
  installUpdate,
  syncUpdate,
  waitForDownloadComplete,
  clearUpdates,
  notifyAppReady,
  triggerRollback,
  simulateCrash,
  getBundleVersion,
  getContentText,
  getUpdateStatus,
  verifyBundleVersion,
  verifyContent,
  verifyError,
  verifyUpToDate,
  setOffline,
  setOnline,
  wait,
  takeScreenshot,
  getPlatform,
  isIOS,
  isAndroid,
} from './app'
