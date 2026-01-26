package com.bundlenudge

import android.content.Context
import android.os.Build
import android.util.Base64
import android.util.Log
import com.facebook.react.ReactApplication
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import org.json.JSONObject
import java.io.File

/**
 * BundleNudge Native Module for Android
 *
 * Provides native functionality for:
 * - Getting the JS bundle path (embedded or downloaded)
 * - Reloading the app with a new bundle
 * - Managing bundle metadata
 */
class BundleNudgeModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    companion object {
        private const val TAG = "BundleNudge"
        private const val MODULE_NAME = "BundleNudge"
        private const val BUNDLENUDGE_DIR = "bundlenudge"
        private const val BUNDLES_DIR = "bundles"
        private const val METADATA_FILE = "metadata.json"

        /**
         * Get the JS bundle path to load on app start.
         * Returns the downloaded bundle if available, otherwise null (use embedded).
         *
         * Call this from MainApplication's getJSBundleFile():
         * ```kotlin
         * override fun getJSBundleFile(): String? {
         *     return BundleNudgeModule.getBundlePath(applicationContext)
         * }
         * ```
         */
        @JvmStatic
        fun getBundlePath(context: Context): String? {
            // Check for pending update first
            getPendingBundlePath(context)?.let {
                Log.d(TAG, "Loading pending bundle: $it")
                return it
            }

            // Check for current version
            getCurrentBundlePath(context)?.let {
                Log.d(TAG, "Loading current bundle: $it")
                return it
            }

            Log.d(TAG, "No BundleNudge bundle found, using embedded bundle")
            // Return null to use embedded bundle
            return null
        }

        /**
         * Get the BundleNudge directory path
         */
        @JvmStatic
        fun getBundleNudgePath(context: Context): File {
            return File(context.filesDir, BUNDLENUDGE_DIR)
        }

        private fun getCurrentBundlePath(context: Context): String? {
            val metadata = loadMetadata(context) ?: return null
            val currentVersion = metadata.optString("currentVersion", null) ?: return null

            val bundlePath = File(
                getBundleNudgePath(context),
                "$BUNDLES_DIR/$currentVersion/bundle.js"
            )

            return if (bundlePath.exists()) bundlePath.absolutePath else null
        }

        private fun getPendingBundlePath(context: Context): String? {
            val metadata = loadMetadata(context) ?: return null
            val pendingVersion = metadata.optString("pendingVersion", null) ?: return null

            val bundlePath = File(
                getBundleNudgePath(context),
                "$BUNDLES_DIR/$pendingVersion/bundle.js"
            )

            return if (bundlePath.exists()) bundlePath.absolutePath else null
        }

        private fun loadMetadata(context: Context): JSONObject? {
            val metadataFile = File(getBundleNudgePath(context), METADATA_FILE)
            if (!metadataFile.exists()) return null

            return try {
                JSONObject(metadataFile.readText())
            } catch (e: Exception) {
                Log.e(TAG, "Failed to load metadata: ${e.message}")
                null
            }
        }
    }

    override fun getName(): String = MODULE_NAME

    /**
     * Get device configuration information
     */
    @ReactMethod
    fun getConfiguration(promise: Promise) {
        try {
            val config = Arguments.createMap()
            val context = reactApplicationContext

            // App version from package info
            val packageInfo = context.packageManager.getPackageInfo(context.packageName, 0)
            config.putString("appVersion", packageInfo.versionName ?: "0.0.0")

            // Build number (handle API level differences)
            val versionCode = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                packageInfo.longVersionCode.toInt()
            } else {
                @Suppress("DEPRECATION")
                packageInfo.versionCode
            }
            config.putInt("buildNumber", versionCode)
            config.putString("bundleId", context.packageName)

            promise.resolve(config)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to get configuration: ${e.message}")
            promise.reject("E_CONFIG_ERROR", "Failed to get configuration: ${e.message}", e)
        }
    }

    /**
     * Get current bundle information
     */
    @ReactMethod
    fun getCurrentBundleInfo(promise: Promise) {
        try {
            val metadata = loadMetadata(reactApplicationContext)
            if (metadata == null) {
                promise.resolve(null)
                return
            }

            val info = Arguments.createMap()
            metadata.optString("currentVersion", null)?.let { info.putString("currentVersion", it) }
            metadata.optString("currentVersionHash", null)?.let { info.putString("currentVersionHash", it) }
            metadata.optString("pendingVersion", null)?.let { info.putString("pendingVersion", it) }
            metadata.optString("previousVersion", null)?.let { info.putString("previousVersion", it) }

            promise.resolve(if (info.toHashMap().isEmpty()) null else info)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to get bundle info: ${e.message}")
            promise.reject("E_BUNDLE_INFO_ERROR", "Failed to get bundle info: ${e.message}", e)
        }
    }

    /**
     * Get the current bundle path
     */
    @ReactMethod
    fun getBundlePath(promise: Promise) {
        try {
            val path = getBundlePath(reactApplicationContext)
            promise.resolve(path)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to get bundle path: ${e.message}")
            promise.reject("E_PATH_ERROR", "Failed to get bundle path: ${e.message}", e)
        }
    }

    /**
     * Mark the current update as successful (prevents rollback)
     */
    @ReactMethod
    fun notifyAppReady(promise: Promise) {
        try {
            markUpdateSuccessful()
            Log.d(TAG, "App marked as ready")
            promise.resolve(true)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to notify app ready: ${e.message}")
            promise.reject("E_NOTIFY_ERROR", "Failed to notify app ready: ${e.message}", e)
        }
    }

    /**
     * Restart the app, optionally only if an update is pending
     */
    @ReactMethod
    fun restartApp(onlyIfUpdateIsPending: Boolean, promise: Promise) {
        try {
            if (onlyIfUpdateIsPending && !hasPendingUpdate()) {
                Log.d(TAG, "No pending update, skipping restart")
                promise.resolve(false)
                return
            }

            // Apply pending update
            applyPendingUpdate()

            // Get the new bundle path for logging
            val bundlePath = getBundlePath(reactApplicationContext)
            Log.d(TAG, "Restarting app with bundle: $bundlePath")

            // Reload the React Native bridge
            val activity = currentActivity
            if (activity == null) {
                promise.reject("E_NO_ACTIVITY", "Current activity not available", null)
                return
            }

            val application = activity.application
            if (application !is ReactApplication) {
                promise.reject("E_NOT_REACT_APP", "Application does not implement ReactApplication", null)
                return
            }

            val reactInstanceManager = application.reactNativeHost.reactInstanceManager

            // Run on UI thread
            UiThreadUtil.runOnUiThread {
                try {
                    reactInstanceManager.recreateReactContextInBackground()
                    Log.d(TAG, "React context recreation triggered")
                } catch (e: Exception) {
                    Log.e(TAG, "Failed to recreate React context: ${e.message}")
                }
            }

            promise.resolve(true)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to restart app: ${e.message}")
            promise.reject("E_RESTART_ERROR", "Failed to restart app: ${e.message}", e)
        }
    }

    /**
     * Clear all downloaded updates
     */
    @ReactMethod
    fun clearUpdates(promise: Promise) {
        try {
            val bundlesDir = File(getBundleNudgePath(reactApplicationContext), BUNDLES_DIR)
            if (bundlesDir.exists()) {
                bundlesDir.deleteRecursively()
            }

            // Reset metadata but preserve deviceId
            val metadata = loadMetadata(reactApplicationContext) ?: JSONObject()
            val deviceId = metadata.optString("deviceId", null)

            metadata.remove("currentVersion")
            metadata.remove("currentVersionHash")
            metadata.remove("pendingVersion")
            metadata.remove("previousVersion")
            metadata.put("crashCount", 0)
            metadata.remove("lastCrashTime")

            // Preserve deviceId if it existed
            if (deviceId != null) {
                metadata.put("deviceId", deviceId)
            }

            saveMetadata(metadata)

            Log.d(TAG, "All updates cleared")
            promise.resolve(true)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to clear updates: ${e.message}")
            promise.reject("E_CLEAR_ERROR", "Failed to clear updates: ${e.message}", e)
        }
    }

    /**
     * Regex pattern for valid version strings (alphanumeric, dots, hyphens, underscores only)
     */
    private val versionPattern = Regex("^[a-zA-Z0-9._-]+$")

    /**
     * Sanitize version string to prevent path traversal attacks
     */
    private fun sanitizeVersion(version: String): String {
        return version
            .replace(Regex("[/\\\\]"), "_")
            .replace("..", "")
    }

    /**
     * Validate version string matches expected pattern
     */
    private fun isValidVersion(version: String): Boolean {
        return versionPattern.matches(version)
    }

    /**
     * Save a bundle to native filesystem storage
     * @param version The version identifier for the bundle
     * @param bundleData Base64 encoded bundle data
     */
    @ReactMethod
    fun saveBundleToStorage(version: String, bundleData: String, promise: Promise) {
        try {
            // Sanitize version to prevent path traversal
            val sanitizedVersion = sanitizeVersion(version)

            // Validate version format
            if (!isValidVersion(sanitizedVersion)) {
                Log.e(TAG, "Invalid version format: $version")
                promise.reject("E_INVALID_VERSION", "Invalid version format. Only alphanumeric, dots, hyphens, and underscores allowed.", null)
                return
            }

            // Decode base64 data
            val data = Base64.decode(bundleData, Base64.DEFAULT)

            // Create bundle directory path: bundlenudge/bundles/{version}/
            val bundleDir = File(getBundleNudgePath(reactApplicationContext), "$BUNDLES_DIR/$sanitizedVersion")

            // Create directory if it doesn't exist
            if (!bundleDir.exists()) {
                bundleDir.mkdirs()
            }

            // Write bundle to file
            val bundleFile = File(bundleDir, "bundle.js")
            bundleFile.writeBytes(data)

            Log.d(TAG, "Bundle saved to: ${bundleFile.absolutePath}")
            promise.resolve(bundleFile.absolutePath)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to save bundle: ${e.message}")
            promise.reject("E_SAVE_ERROR", "Failed to save bundle: ${e.message}", e)
        }
    }

    // MARK: - Private Helpers

    private fun hasPendingUpdate(): Boolean {
        val metadata = loadMetadata(reactApplicationContext) ?: return false
        val pendingVersion = metadata.optString("pendingVersion", null)
        return pendingVersion != null && pendingVersion.isNotEmpty()
    }

    private fun applyPendingUpdate() {
        val metadata = loadMetadata(reactApplicationContext) ?: return
        val pendingVersion = metadata.optString("pendingVersion", null) ?: return

        Log.d(TAG, "Applying pending update: $pendingVersion")

        // Move current to previous, pending to current
        metadata.optString("currentVersion", null)?.let {
            metadata.put("previousVersion", it)
        }
        metadata.put("currentVersion", pendingVersion)
        metadata.remove("pendingVersion")
        metadata.put("crashCount", 0)
        metadata.remove("lastCrashTime")

        saveMetadata(metadata)
    }

    private fun markUpdateSuccessful() {
        val metadata = loadMetadata(reactApplicationContext) ?: return
        metadata.put("crashCount", 0)
        metadata.remove("lastCrashTime")
        saveMetadata(metadata)
    }

    private fun saveMetadata(metadata: JSONObject) {
        try {
            val bundleNudgeDir = getBundleNudgePath(reactApplicationContext)
            if (!bundleNudgeDir.exists()) {
                bundleNudgeDir.mkdirs()
            }

            val metadataFile = File(bundleNudgeDir, METADATA_FILE)
            metadataFile.writeText(metadata.toString(2))
            Log.d(TAG, "Metadata saved")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to save metadata: ${e.message}")
        }
    }

    /**
     * Send an event to JavaScript
     */
    private fun sendEvent(eventName: String, params: WritableMap?) {
        reactApplicationContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(eventName, params)
    }
}
