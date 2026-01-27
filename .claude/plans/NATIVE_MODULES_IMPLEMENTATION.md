# Native Modules Implementation Plan

> **Goal:** Complete iOS (Swift) and Android (Kotlin) native modules for production-ready BundleNudge SDK.
>
> **Date:** 2026-01-26
> **Estimated Effort:** 3-4 hours (2 parallel tracks)
> **Agents:** 6 total (3 iOS + 3 Android, running in parallel)

---

## Current State Assessment

### What's Already Implemented ✅

Both iOS and Android modules already have:

| Method | iOS (Swift) | Android (Kotlin) | Status |
|--------|-------------|------------------|--------|
| `getConfiguration()` | ✅ | ✅ | Complete |
| `getCurrentBundleInfo()` | ✅ | ✅ | Complete |
| `getBundlePath()` | ✅ | ✅ | Complete |
| `notifyAppReady()` | ✅ | ✅ | Complete |
| `restartApp()` | ✅ | ✅ | Complete |
| `clearUpdates()` | ✅ | ✅ | Complete |
| `saveBundleToStorage()` | ✅ | ✅ | Complete |
| Static `bundleURL()` | ✅ | ✅ | Complete |

### What's Missing ❌

| Method | Purpose | Priority |
|--------|---------|----------|
| `hashFile(path)` | SHA-256 hash for BundleValidator | 🔴 HIGH |
| `getAppVersionInfo()` | Structured version info for VersionGuard | 🟡 MEDIUM |
| Native hash validation | Double-check hash before loading bundle | 🟡 MEDIUM |
| Rollback telemetry | Send rollback report from native side | 🟢 LOW |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        NATIVE MODULE                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  React Native (JavaScript)                                           │
│  └─ NativeModules.BundleNudge                                       │
│       │                                                              │
│       ▼                                                              │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    NATIVE BRIDGE                             │   │
│  ├─────────────────────────────────────────────────────────────┤   │
│  │                                                              │   │
│  │  iOS (Swift)              │    Android (Kotlin)             │   │
│  │  ────────────────────────  │    ────────────────────────    │   │
│  │  BundleNudge.swift        │    BundleNudgeModule.kt         │   │
│  │  BundleNudge.m (bridge)   │    BundleNudgePackage.kt        │   │
│  │                           │                                  │   │
│  │  Methods:                 │    Methods:                      │   │
│  │  • getConfiguration       │    • getConfiguration            │   │
│  │  • hashFile (NEW)         │    • hashFile (NEW)              │   │
│  │  • saveBundleToStorage    │    • saveBundleToStorage         │   │
│  │  • restartApp             │    • restartApp                  │   │
│  │  • bundleURL() (static)   │    • getBundlePath() (static)    │   │
│  │                           │                                  │   │
│  └───────────────────────────┴──────────────────────────────────┘   │
│                                                                      │
│  AppDelegate / MainApplication                                       │
│  └─ sourceURL() / getJSBundleFile()                                 │
│       └─ BundleNudge.bundleURL() ?? embedded                        │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Wave Structure

### Wave 1: Hash File Implementation (CRITICAL)

Add `hashFile(path)` method for bundle validation.

**iOS Agent 1A:**
```swift
@objc
func hashFile(_ path: String,
              resolve: @escaping RCTPromiseResolveBlock,
              reject: @escaping RCTPromiseRejectBlock) {
    DispatchQueue.global(qos: .userInitiated).async {
        do {
            let url = URL(fileURLWithPath: path)
            let data = try Data(contentsOf: url)
            let hash = SHA256.hash(data: data)
            let hashString = hash.compactMap { String(format: "%02x", $0) }.joined()
            resolve(hashString)
        } catch {
            reject("E_HASH_FAILED", "Failed to hash file: \(error.localizedDescription)", error)
        }
    }
}
```

**Android Agent 1B:**
```kotlin
@ReactMethod
fun hashFile(path: String, promise: Promise) {
    try {
        val file = File(path)
        val digest = MessageDigest.getInstance("SHA-256")
        FileInputStream(file).use { fis ->
            val buffer = ByteArray(8192)
            var read: Int
            while (fis.read(buffer).also { read = it } != -1) {
                digest.update(buffer, 0, read)
            }
        }
        val hash = digest.digest().joinToString("") { "%02x".format(it) }
        promise.resolve(hash)
    } catch (e: Exception) {
        promise.reject("E_HASH_FAILED", "Failed to hash file: ${e.message}", e)
    }
}
```

### Wave 2: Native Hash Validation (SECURITY)

Validate bundle hash BEFORE loading in `bundleURL()` / `getBundlePath()`.

**iOS Agent 2A:**
```swift
private static func validateBundleHash(_ bundlePath: String) -> Bool {
    guard let metadata = loadMetadata(),
          let expectedHash = metadata["currentVersionHash"] as? String else {
        return true // No hash stored, skip validation (legacy)
    }

    guard let data = FileManager.default.contents(atPath: bundlePath) else {
        return false
    }

    let actualHash = SHA256.hash(data: data)
        .compactMap { String(format: "%02x", $0) }
        .joined()

    if actualHash != expectedHash {
        NSLog("[BundleNudge] Hash mismatch! Expected: %@, Got: %@", expectedHash, actualHash)
        // Remove corrupt bundle
        try? FileManager.default.removeItem(atPath: bundlePath)
        return false
    }

    return true
}
```

**Android Agent 2B:**
```kotlin
private fun validateBundleHash(bundlePath: String, context: Context): Boolean {
    val metadata = loadMetadata(context) ?: return true
    val expectedHash = metadata.optString("currentVersionHash", null) ?: return true

    val file = File(bundlePath)
    if (!file.exists()) return false

    val digest = MessageDigest.getInstance("SHA-256")
    FileInputStream(file).use { fis ->
        val buffer = ByteArray(8192)
        var read: Int
        while (fis.read(buffer).also { read = it } != -1) {
            digest.update(buffer, 0, read)
        }
    }
    val actualHash = digest.digest().joinToString("") { "%02x".format(it) }

    if (actualHash != expectedHash) {
        Log.e(TAG, "Hash mismatch! Expected: $expectedHash, Got: $actualHash")
        file.delete() // Remove corrupt bundle
        return false
    }

    return true
}
```

### Wave 3: Testing & Documentation

**iOS Agent 3A:** iOS tests and documentation
**Android Agent 3B:** Android tests and documentation

---

## Agent Assignments

### iOS Track (Swift)

#### Agent iOS-1A: Hash File Method
```
File: packages/sdk/ios/BundleNudge.swift

Tasks:
1. Import CryptoKit for SHA-256
2. Add hashFile(_:resolve:reject:) method
3. Run hash computation on background thread
4. Export method to React Native via BundleNudge.m

Acceptance:
- [ ] hashFile returns SHA-256 hex string
- [ ] Handles file not found gracefully
- [ ] Runs on background thread (non-blocking)
```

#### Agent iOS-2A: Native Hash Validation
```
File: packages/sdk/ios/BundleNudge.swift

Tasks:
1. Add validateBundleHash(_:) private method
2. Call validation in bundleURL() before returning path
3. On hash mismatch: log, delete bundle, return nil (fallback to embedded)
4. Store bundle hash when saving via saveBundleToStorage

Acceptance:
- [ ] Corrupt bundles detected before loading
- [ ] Corrupt bundles removed automatically
- [ ] Falls back to embedded bundle on mismatch
- [ ] Hash stored when bundle saved
```

#### Agent iOS-3A: Tests & Documentation
```
Files:
- packages/sdk/ios/BundleNudgeTests.swift (NEW)
- packages/sdk/ios/README.md (NEW)

Tasks:
1. Create XCTest unit tests for:
   - hashFile computation
   - Hash validation pass/fail
   - Bundle path resolution
2. Write integration guide for iOS

Acceptance:
- [ ] 10+ unit tests
- [ ] Clear README with setup instructions
- [ ] Code comments updated
```

### Android Track (Kotlin)

#### Agent Android-1B: Hash File Method
```
File: packages/sdk/android/src/main/java/com/bundlenudge/BundleNudgeModule.kt

Tasks:
1. Add hashFile(path, promise) method with @ReactMethod
2. Use MessageDigest for SHA-256
3. Stream file for memory efficiency

Acceptance:
- [ ] hashFile returns SHA-256 hex string
- [ ] Handles file not found gracefully
- [ ] Memory efficient (streaming)
```

#### Agent Android-2B: Native Hash Validation
```
File: packages/sdk/android/src/main/java/com/bundlenudge/BundleNudgeModule.kt

Tasks:
1. Add validateBundleHash(path, context) private method
2. Call validation in getBundlePath() before returning path
3. On hash mismatch: log, delete bundle, return null (fallback to embedded)
4. Store bundle hash when saving via saveBundleToStorage

Acceptance:
- [ ] Corrupt bundles detected before loading
- [ ] Corrupt bundles removed automatically
- [ ] Falls back to embedded bundle on mismatch
- [ ] Hash stored when bundle saved
```

#### Agent Android-3B: Tests & Documentation
```
Files:
- packages/sdk/android/src/test/java/com/bundlenudge/BundleNudgeModuleTest.kt (NEW)
- packages/sdk/android/README.md (NEW)

Tasks:
1. Create JUnit tests for:
   - hashFile computation
   - Hash validation pass/fail
   - Bundle path resolution
2. Write integration guide for Android

Acceptance:
- [ ] 10+ unit tests
- [ ] Clear README with setup instructions
- [ ] Code comments updated
```

---

## Execution Plan

### Parallel Tracks

```
TIME ──────────────────────────────────────────────────────────────►

Hour 0              Hour 1              Hour 2              Hour 3-4
  │                   │                   │                   │
  ▼                   ▼                   ▼                   ▼

┌─────────────────────────────────────────────────────────────────┐
│ iOS TRACK                                                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Wave 1 (iOS-1A)    Wave 2 (iOS-2A)    Wave 3 (iOS-3A)         │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐         │
│  │ hashFile    │───►│ Validation  │───►│ Tests/Docs  │         │
│  │ method      │    │ + storage   │    │             │         │
│  └─────────────┘    └─────────────┘    └─────────────┘         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ ANDROID TRACK                                                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Wave 1 (Android-1B) Wave 2 (Android-2B) Wave 3 (Android-3B)   │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐         │
│  │ hashFile    │───►│ Validation  │───►│ Tests/Docs  │         │
│  │ method      │    │ + storage   │    │             │         │
│  └─────────────┘    └─────────────┘    └─────────────┘         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

TOTAL TIME: ~3-4 hours (parallel)
```

### Launch Sequence

1. **Hour 0:** Launch Wave 1 agents (iOS-1A + Android-1B) in parallel
2. **Hour 1:** Launch Wave 2 agents (iOS-2A + Android-2B) in parallel
3. **Hour 2:** Launch Wave 3 agents (iOS-3A + Android-3B) in parallel
4. **Hour 3-4:** Integration testing + final verification

---

## Files to Modify

### iOS Files

| File | Lines | Action |
|------|-------|--------|
| `ios/BundleNudge.swift` | 409 | Add hashFile, validateBundleHash |
| `ios/BundleNudge.m` | ~20 | Export hashFile to RN |
| `ios/BundleNudgeTests.swift` | NEW | Unit tests |
| `ios/README.md` | NEW | Integration guide |

### Android Files

| File | Lines | Action |
|------|-------|--------|
| `android/.../BundleNudgeModule.kt` | 397 | Add hashFile, validateBundleHash |
| `android/.../BundleNudgeModuleTest.kt` | NEW | Unit tests |
| `android/README.md` | NEW | Integration guide |

---

## TypeScript Interface Update

Update `packages/sdk/src/types.ts` to include hashFile:

```typescript
export interface NativeModuleInterface {
  // ... existing methods ...

  /**
   * Calculate SHA-256 hash of a file.
   * @param path - Absolute path to the file
   * @returns Hex-encoded SHA-256 hash
   */
  hashFile(path: string): Promise<string>
}
```

Update `packages/sdk/src/native-module.ts` fallback:

```typescript
hashFile: async (path: string) => {
  if (__DEV__) {
    console.warn('[BundleNudge] hashFile called but native module not available')
  }
  return '' // Return empty string - JS validation will handle
}
```

---

## Verification Commands

### iOS
```bash
# Build iOS
cd packages/sdk/ios
pod install
xcodebuild -workspace BundleNudge.xcworkspace -scheme BundleNudge

# Run tests
xcodebuild test -workspace BundleNudge.xcworkspace -scheme BundleNudgeTests
```

### Android
```bash
# Build Android
cd packages/sdk/android
./gradlew build

# Run tests
./gradlew test
```

### Full Verification
```bash
# Run SDK tests (JS side)
pnpm --filter @bundlenudge/sdk test

# TypeScript check
pnpm --filter @bundlenudge/sdk typecheck
```

---

## Success Criteria

### Wave 1 Success
- [ ] hashFile works on iOS (returns SHA-256 hex)
- [ ] hashFile works on Android (returns SHA-256 hex)
- [ ] Both handle errors gracefully

### Wave 2 Success
- [ ] Native hash validation works on iOS
- [ ] Native hash validation works on Android
- [ ] Corrupt bundles removed before loading
- [ ] Falls back to embedded bundle on mismatch

### Wave 3 Success
- [ ] 10+ iOS unit tests passing
- [ ] 10+ Android unit tests passing
- [ ] README documentation complete
- [ ] Integration guide written

### Final Success
- [ ] SDK tests still pass (508+)
- [ ] Native modules build without errors
- [ ] TypeScript interface updated
- [ ] E2E test with real device works

---

## Rollback Plan

If any wave fails:
1. Revert native file changes
2. Keep existing fallback behavior in JS
3. Fix issues and re-run wave

```bash
# Revert iOS
git checkout -- packages/sdk/ios/

# Revert Android
git checkout -- packages/sdk/android/
```

---

## Security Considerations

1. **Path traversal prevention:** Already implemented (sanitizeVersion)
2. **Hash validation:** Double-check before loading (native + JS)
3. **Secure storage:** Using app's private Documents/files directory
4. **Memory safety:** Stream large files instead of loading entirely

---

## Commands Reference

```bash
# iOS development
cd packages/sdk/ios
open BundleNudge.xcworkspace

# Android development
cd packages/sdk/android
./gradlew assembleDebug

# Run all SDK tests
pnpm --filter @bundlenudge/sdk test

# Build everything
pnpm build
```
