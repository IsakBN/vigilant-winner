import Foundation
import React
import CommonCrypto

/**
 * BundleNudge Native Module for iOS
 *
 * Provides native functionality for:
 * - Getting the JS bundle path (embedded or downloaded)
 * - Reloading the app with a new bundle
 * - Managing bundle metadata
 */
@objc(BundleNudge)
class BundleNudge: NSObject, RCTBridgeModule {

    // MARK: - RCTBridgeModule

    static func moduleName() -> String! {
        return "BundleNudge"
    }

    static func requiresMainQueueSetup() -> Bool {
        return true
    }

    // MARK: - Constants

    private static let bundleNudgeDirectory = "bundlenudge"
    private static let bundlesDirectory = "bundles"
    private static let metadataFile = "metadata.json"

    // MARK: - Shared State

    /// The bridge instance, set by React Native
    @objc var bridge: RCTBridge?

    /// Singleton instance for accessing the module
    private static var sharedInstance: BundleNudge?

    override init() {
        super.init()
        BundleNudge.sharedInstance = self
    }

    // MARK: - Static Bundle URL API

    /**
     * Get the JS bundle URL to load on app start.
     * Returns the downloaded bundle if available, otherwise the embedded bundle.
     *
     * Call this from AppDelegate's sourceURL method:
     * ```swift
     * return BundleNudge.bundleURL() ?? Bundle.main.url(forResource: "main", withExtension: "jsbundle")
     * ```
     */
    @objc
    static func bundleURL() -> URL? {
        // Check for pending update first
        if let pendingPath = getPendingBundlePath() {
            NSLog("[BundleNudge] Loading pending bundle: %@", pendingPath)
            return URL(fileURLWithPath: pendingPath)
        }

        // Check for current version
        if let currentPath = getCurrentBundlePath() {
            NSLog("[BundleNudge] Loading current bundle: %@", currentPath)
            return URL(fileURLWithPath: currentPath)
        }

        NSLog("[BundleNudge] No BundleNudge bundle found, using embedded bundle")
        // Fall back to embedded bundle
        return nil
    }

    /**
     * Get the path to the BundleNudge directory
     */
    @objc
    static func bundleNudgePath() -> String {
        let documentsPath = NSSearchPathForDirectoriesInDomains(
            .documentDirectory,
            .userDomainMask,
            true
        ).first!
        return (documentsPath as NSString).appendingPathComponent(bundleNudgeDirectory)
    }

    // MARK: - React Native Module Methods

    @objc
    func getConfiguration(_ resolve: @escaping RCTPromiseResolveBlock,
                          reject: @escaping RCTPromiseRejectBlock) {
        var config: [String: Any] = [:]

        // App version from Info.plist
        if let appVersion = Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String {
            config["appVersion"] = appVersion
        } else {
            config["appVersion"] = "0.0.0"
        }

        // Build number
        if let buildNumber = Bundle.main.infoDictionary?["CFBundleVersion"] as? String {
            config["buildNumber"] = buildNumber
        } else {
            config["buildNumber"] = "0"
        }

        // Bundle identifier
        if let bundleId = Bundle.main.bundleIdentifier {
            config["bundleId"] = bundleId
        } else {
            config["bundleId"] = "unknown"
        }

        resolve(config)
    }

    @objc
    func getCurrentBundleInfo(_ resolve: @escaping RCTPromiseResolveBlock,
                              reject: @escaping RCTPromiseRejectBlock) {
        guard let metadata = BundleNudge.loadMetadata() else {
            resolve(nil)
            return
        }

        var info: [String: Any?] = [:]
        info["currentVersion"] = metadata["currentVersion"]
        info["currentVersionHash"] = metadata["currentVersionHash"]
        info["pendingVersion"] = metadata["pendingVersion"]
        info["previousVersion"] = metadata["previousVersion"]

        // Filter out nil values for cleaner JS object
        let filtered = info.compactMapValues { $0 }
        resolve(filtered.isEmpty ? nil : filtered)
    }

    @objc
    func getBundlePath(_ resolve: @escaping RCTPromiseResolveBlock,
                       reject: @escaping RCTPromiseRejectBlock) {
        if let url = BundleNudge.bundleURL() {
            resolve(url.path)
        } else if let embeddedURL = Bundle.main.url(forResource: "main", withExtension: "jsbundle") {
            resolve(embeddedURL.path)
        } else {
            resolve(nil)
        }
    }

    @objc
    func notifyAppReady(_ resolve: @escaping RCTPromiseResolveBlock,
                        reject: @escaping RCTPromiseRejectBlock) {
        // Mark the current update as successful
        // This prevents automatic rollback
        BundleNudge.markUpdateSuccessful()
        NSLog("[BundleNudge] App marked as ready")
        resolve(true)
    }

    @objc
    func restartApp(_ onlyIfUpdateIsPending: Bool,
                    resolve: @escaping RCTPromiseResolveBlock,
                    reject: @escaping RCTPromiseRejectBlock) {

        if onlyIfUpdateIsPending && !BundleNudge.hasPendingUpdate() {
            NSLog("[BundleNudge] No pending update, skipping restart")
            resolve(false)
            return
        }

        // Apply pending update if exists
        BundleNudge.applyPendingUpdate()

        // Get the new bundle URL
        guard let bundleURL = BundleNudge.bundleURL() ?? Bundle.main.url(forResource: "main", withExtension: "jsbundle") else {
            reject("E_NO_BUNDLE", "No bundle URL available", nil)
            return
        }

        NSLog("[BundleNudge] Restarting app with bundle: %@", bundleURL.path)

        // Trigger reload on main thread
        DispatchQueue.main.async { [weak self] in
            guard let bridge = self?.bridge else {
                // Try to get bridge from shared instance
                if let sharedBridge = BundleNudge.sharedInstance?.bridge {
                    self?.performReload(bridge: sharedBridge, bundleURL: bundleURL, resolve: resolve, reject: reject)
                } else {
                    reject("E_NO_BRIDGE", "React Native bridge not available", nil)
                }
                return
            }
            self?.performReload(bridge: bridge, bundleURL: bundleURL, resolve: resolve, reject: reject)
        }
    }

    private func performReload(bridge: RCTBridge,
                               bundleURL: URL,
                               resolve: @escaping RCTPromiseResolveBlock,
                               reject: @escaping RCTPromiseRejectBlock) {
        // Method 1: Try using the bundleURL setter if available (RN 0.71+)
        if bridge.responds(to: Selector(("setBundleURL:"))) {
            bridge.perform(Selector(("setBundleURL:")), with: bundleURL)
        }

        // Reload the bridge
        bridge.reload()
        resolve(true)
    }

    @objc
    func clearUpdates(_ resolve: @escaping RCTPromiseResolveBlock,
                      reject: @escaping RCTPromiseRejectBlock) {
        do {
            let bundlesPath = (BundleNudge.bundleNudgePath() as NSString)
                .appendingPathComponent(BundleNudge.bundlesDirectory)

            if FileManager.default.fileExists(atPath: bundlesPath) {
                try FileManager.default.removeItem(atPath: bundlesPath)
            }

            // Reset metadata but preserve deviceId
            var metadata = BundleNudge.loadMetadata() ?? [:]
            let deviceId = metadata["deviceId"]
            metadata["currentVersion"] = nil
            metadata["currentVersionHash"] = nil
            metadata["pendingVersion"] = nil
            metadata["pendingVersionHash"] = nil
            metadata["previousVersion"] = nil
            metadata["previousVersionHash"] = nil
            metadata["crashCount"] = 0
            metadata["lastCrashTime"] = nil
            if deviceId != nil {
                metadata["deviceId"] = deviceId
            }
            BundleNudge.saveMetadata(metadata)

            NSLog("[BundleNudge] All updates cleared")
            resolve(true)
        } catch {
            NSLog("[BundleNudge] Failed to clear updates: %@", error.localizedDescription)
            reject("E_CLEAR_FAILED", "Failed to clear updates: \(error.localizedDescription)", error)
        }
    }

    // MARK: - Version Validation

    /// Regex pattern for valid version strings (alphanumeric, dots, hyphens, underscores only)
    private static let versionPattern = "^[a-zA-Z0-9._-]+$"

    /// Sanitize version string to prevent path traversal attacks
    private func sanitizeVersion(_ version: String) -> String {
        return version
            .replacingOccurrences(of: "/", with: "_")
            .replacingOccurrences(of: "\\", with: "_")
            .replacingOccurrences(of: "..", with: "")
    }

    /// Validate version string matches expected pattern
    private func isValidVersion(_ version: String) -> Bool {
        guard let regex = try? NSRegularExpression(pattern: BundleNudge.versionPattern) else {
            return false
        }
        let range = NSRange(location: 0, length: version.utf16.count)
        return regex.firstMatch(in: version, range: range) != nil
    }

    @objc
    func hashFile(_ path: String,
                  resolve: @escaping RCTPromiseResolveBlock,
                  reject: @escaping RCTPromiseRejectBlock) {
        // Run on background thread to avoid blocking UI
        DispatchQueue.global(qos: .userInitiated).async {
            do {
                let url = URL(fileURLWithPath: path)

                // Check if file exists
                guard FileManager.default.fileExists(atPath: path) else {
                    DispatchQueue.main.async {
                        reject("E_FILE_NOT_FOUND", "File not found: \(path)", nil)
                    }
                    return
                }

                // Check if file is readable
                guard FileManager.default.isReadableFile(atPath: path) else {
                    DispatchQueue.main.async {
                        reject("E_PERMISSION_DENIED", "Cannot read file: \(path)", nil)
                    }
                    return
                }

                let data = try Data(contentsOf: url)

                // Use CommonCrypto for SHA-256
                var hash = [UInt8](repeating: 0, count: Int(CC_SHA256_DIGEST_LENGTH))
                data.withUnsafeBytes {
                    _ = CC_SHA256($0.baseAddress, CC_LONG(data.count), &hash)
                }

                let hashString = hash.map { String(format: "%02x", $0) }.joined()

                DispatchQueue.main.async {
                    resolve(hashString)
                }
            } catch {
                DispatchQueue.main.async {
                    reject("E_HASH_FAILED", "Failed to hash file: \(error.localizedDescription)", error)
                }
            }
        }
    }

    @objc
    func saveBundleToStorage(_ version: String,
                              bundleData: String,
                              resolve: @escaping RCTPromiseResolveBlock,
                              reject: @escaping RCTPromiseRejectBlock) {
        do {
            // Sanitize version to prevent path traversal
            let sanitizedVersion = sanitizeVersion(version)

            // Validate version format
            guard isValidVersion(sanitizedVersion) else {
                NSLog("[BundleNudge] Invalid version format: %@", version)
                reject("E_INVALID_VERSION", "Invalid version format. Only alphanumeric, dots, hyphens, and underscores allowed.", nil)
                return
            }

            // Decode base64 data
            guard let data = Data(base64Encoded: bundleData) else {
                reject("E_DECODE_FAILED", "Failed to decode base64 bundle data", nil)
                return
            }

            // Create bundle directory path: bundlenudge/bundles/{version}/
            let bundleDir = (BundleNudge.bundleNudgePath() as NSString)
                .appendingPathComponent(BundleNudge.bundlesDirectory)
                .appending("/\(sanitizedVersion)")

            // Create directory if it doesn't exist
            try FileManager.default.createDirectory(
                atPath: bundleDir,
                withIntermediateDirectories: true
            )

            // Write bundle to file
            let bundlePath = (bundleDir as NSString).appendingPathComponent("bundle.js")
            try data.write(to: URL(fileURLWithPath: bundlePath))

            // Calculate SHA-256 hash of the saved bundle
            var hash = [UInt8](repeating: 0, count: Int(CC_SHA256_DIGEST_LENGTH))
            data.withUnsafeBytes {
                _ = CC_SHA256($0.baseAddress, CC_LONG(data.count), &hash)
            }
            let bundleHash = hash.map { String(format: "%02x", $0) }.joined()

            // Save hash in metadata under pendingVersionHash
            var metadata = BundleNudge.loadMetadata() ?? [:]
            metadata["pendingVersionHash"] = bundleHash
            BundleNudge.saveMetadata(metadata)

            NSLog("[BundleNudge] Bundle saved to: %@ with hash: %@", bundlePath, bundleHash)
            resolve(bundlePath)
        } catch {
            NSLog("[BundleNudge] Failed to save bundle: %@", error.localizedDescription)
            reject("E_SAVE_FAILED", "Failed to save bundle: \(error.localizedDescription)", error)
        }
    }

    // MARK: - Private Static Helpers

    /// Validate bundle hash matches stored hash
    /// Returns true if valid or no hash stored (legacy), false if mismatch
    private static func validateBundleHash(_ bundlePath: String) -> Bool {
        guard let metadata = loadMetadata(),
              let expectedHash = metadata["currentVersionHash"] as? String,
              !expectedHash.isEmpty else {
            // No hash stored - skip validation (legacy bundle)
            return true
        }

        guard let data = FileManager.default.contents(atPath: bundlePath) else {
            NSLog("[BundleNudge] Cannot read bundle for hash validation: %@", bundlePath)
            return false
        }

        // Calculate SHA-256
        var hash = [UInt8](repeating: 0, count: Int(CC_SHA256_DIGEST_LENGTH))
        data.withUnsafeBytes {
            _ = CC_SHA256($0.baseAddress, CC_LONG(data.count), &hash)
        }
        let actualHash = hash.map { String(format: "%02x", $0) }.joined()

        if actualHash != expectedHash {
            NSLog("[BundleNudge] Hash mismatch! Expected: %@, Got: %@", expectedHash, actualHash)
            // Remove corrupt bundle
            try? FileManager.default.removeItem(atPath: bundlePath)
            return false
        }

        NSLog("[BundleNudge] Bundle hash validated successfully")
        return true
    }

    private static func getCurrentBundlePath() -> String? {
        guard let metadata = loadMetadata(),
              let currentVersion = metadata["currentVersion"] as? String else {
            return nil
        }

        let bundlePath = (bundleNudgePath() as NSString)
            .appendingPathComponent(bundlesDirectory)
            .appending("/\(currentVersion)/bundle.js")

        guard FileManager.default.fileExists(atPath: bundlePath) else {
            return nil
        }

        // Validate hash before returning
        guard validateBundleHash(bundlePath) else {
            NSLog("[BundleNudge] Bundle failed hash validation, falling back to embedded")
            return nil
        }

        return bundlePath
    }

    private static func getPendingBundlePath() -> String? {
        guard let metadata = loadMetadata(),
              let pendingVersion = metadata["pendingVersion"] as? String else {
            return nil
        }

        let bundlePath = (bundleNudgePath() as NSString)
            .appendingPathComponent(bundlesDirectory)
            .appending("/\(pendingVersion)/bundle.js")

        if FileManager.default.fileExists(atPath: bundlePath) {
            return bundlePath
        }

        return nil
    }

    private static func hasPendingUpdate() -> Bool {
        guard let metadata = loadMetadata(),
              let _ = metadata["pendingVersion"] as? String else {
            return false
        }
        return true
    }

    private static func applyPendingUpdate() {
        guard var metadata = loadMetadata(),
              let pendingVersion = metadata["pendingVersion"] as? String else {
            return
        }

        NSLog("[BundleNudge] Applying pending update: %@", pendingVersion)

        // Move current to previous, pending to current
        metadata["previousVersion"] = metadata["currentVersion"]
        metadata["previousVersionHash"] = metadata["currentVersionHash"]
        metadata["currentVersion"] = pendingVersion
        metadata["currentVersionHash"] = metadata["pendingVersionHash"]
        metadata["pendingVersion"] = nil
        metadata["pendingVersionHash"] = nil
        metadata["crashCount"] = 0
        metadata["lastCrashTime"] = nil

        saveMetadata(metadata)
    }

    private static func markUpdateSuccessful() {
        guard var metadata = loadMetadata() else { return }
        metadata["crashCount"] = 0
        metadata["lastCrashTime"] = nil
        saveMetadata(metadata)
    }

    // MARK: - Metadata Persistence

    private static func loadMetadata() -> [String: Any]? {
        let metadataPath = (bundleNudgePath() as NSString)
            .appendingPathComponent(metadataFile)

        guard let data = FileManager.default.contents(atPath: metadataPath),
              let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else {
            return nil
        }

        return json
    }

    private static func saveMetadata(_ metadata: [String: Any]) {
        let path = bundleNudgePath()

        // Ensure directory exists
        try? FileManager.default.createDirectory(
            atPath: path,
            withIntermediateDirectories: true
        )

        let metadataPath = (path as NSString)
            .appendingPathComponent(metadataFile)

        if let data = try? JSONSerialization.data(withJSONObject: metadata, options: .prettyPrinted) {
            try? data.write(to: URL(fileURLWithPath: metadataPath))
        }
    }
}
