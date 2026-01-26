/**
 * Native Module Bridge
 *
 * Provides access to the native BundleNudge module with graceful fallback.
 */

import { NativeModules, Platform } from 'react-native'
import type { NativeModuleInterface } from './types'

/**
 * Access the native BundleNudge module with proper typing.
 * Returns null if the native module is not linked.
 */
export function getNativeModule(): NativeModuleInterface | null {
  const nativeModule = NativeModules.BundleNudge as NativeModuleInterface | undefined

  if (!nativeModule) {
    if (__DEV__) {
      console.warn(
        '[BundleNudge] Native module not found. ' +
        'Make sure you have linked the native module correctly. ' +
        'Run "pod install" for iOS or rebuild for Android.'
      )
    }
    return null
  }

  return nativeModule
}

/**
 * Create a fallback module for when native module is unavailable.
 * This allows the SDK to work in JS-only environments (e.g., Expo Go).
 */
export function createFallbackModule(): NativeModuleInterface {
  return {
    getConfiguration: () =>
      Promise.resolve({
        appVersion: '1.0.0',
        buildNumber: '1',
        bundleId: Platform.OS === 'ios' ? 'com.unknown.app' : 'com.unknown.app',
      }),
    getCurrentBundleInfo: () => Promise.resolve(null),
    getBundlePath: () => Promise.resolve(null),
    notifyAppReady: () => Promise.resolve(true),
    restartApp: () => {
      if (__DEV__) {
        console.warn('[BundleNudge] restartApp called but native module not available')
      }
      return Promise.resolve(false)
    },
    clearUpdates: () => {
      if (__DEV__) {
        console.warn('[BundleNudge] clearUpdates called but native module not available')
      }
      return Promise.resolve(false)
    },
    saveBundleToStorage: () => {
      if (__DEV__) {
        console.warn('[BundleNudge] saveBundleToStorage called but native module not available')
      }
      return Promise.resolve('')
    },
  }
}

/**
 * Get native module or fallback.
 * Returns a tuple of [module, isNative] to indicate whether native is available.
 */
export function getModuleWithFallback(): {
  module: NativeModuleInterface
  isNative: boolean
} {
  const nativeModule = getNativeModule()

  if (nativeModule) {
    return { module: nativeModule, isNative: true }
  }

  return { module: createFallbackModule(), isNative: false }
}
