# BundleNudge SDK - Product Requirements Document

> **Version:** 1.0
> **Last Updated:** 2026-01-26
> **Status:** Approved

---

## Overview

OTA JavaScript updates for React Native apps. Push changes directly to users without App Store review.

## Target Platforms

| Platform | Support Level |
|----------|---------------|
| React Native (bare) | Full - v0.72+ |
| React Native (Hermes) | Full - v0.73+ with bytecode |
| Expo (bare workflow) | Full |
| Expo (managed) | Via expo-updates compatibility layer |

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                      BundleNudge SDK                         │
├──────────────────────────────────────────────────────────────┤
│  JavaScript Layer (works everywhere)                         │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐            │
│  │ Check API   │ │ Download    │ │ Store       │            │
│  │ for updates │ │ bundles     │ │ locally     │            │
│  └─────────────┘ └─────────────┘ └─────────────┘            │
├──────────────────────────────────────────────────────────────┤
│  Native Layer (required for bundle loading)                  │
│  ┌─────────────────────┐ ┌─────────────────────┐            │
│  │ iOS (Swift)         │ │ Android (Kotlin)    │            │
│  │ - bundleURL()       │ │ - getBundlePath()   │            │
│  │ - bridge.reload()   │ │ - recreateContext() │            │
│  └─────────────────────┘ └─────────────────────┘            │
└──────────────────────────────────────────────────────────────┘
```

## Bundle Compilation

### Strategy: Server-Side Hermes Bytecode

```
Developer Upload          Server Processing           Device Download
      │                         │                          │
      ▼                         ▼                          ▼
┌───────────┐           ┌───────────────┐           ┌───────────┐
│ JS Bundle │ ────────▶ │ hermesc       │ ────────▶ │ .hbc file │
│ (Metro)   │           │ (per RN ver)  │           │ (ready)   │
└───────────┘           └───────────────┘           └───────────┘
```

### Hermes Version Matrix

| RN Version | Hermes Version | Bytecode Format |
|------------|----------------|-----------------|
| 0.73.x     | 0.12.0         | v96            |
| 0.74.x     | 0.12.0         | v96            |
| 0.75.x+    | TBD            | TBD            |

### Server Requirements

1. Store multiple bytecode versions per release
2. Detect device RN version from SDK request
3. Serve matching bytecode
4. Fallback: plain JS bundle (slower but works)

## Install Modes

### v1.0 - Launch

| Mode | Description | Implementation |
|------|-------------|----------------|
| `onNextRestart` | Download now, apply on next cold start | JS download + native bundleURL check |

### v1.1 - Post-Launch

| Mode | Description | Implementation |
|------|-------------|----------------|
| `onNextResume` | Apply when app returns from background | Native listener for app state |
| `immediate` | Hot reload now | Native bridge.reload() |

### Rationale

- `onNextRestart` is safest - user controls when update applies
- `immediate` needs thorough testing - can disrupt user mid-action
- Start simple, add complexity after real-device validation

## Native Module Implementation

### iOS (Swift)

```swift
// AppDelegate.swift integration
func sourceURL() -> URL? {
    return BundleNudge.bundleURL()
        ?? Bundle.main.url(forResource: "main", withExtension: "jsbundle")
}
```

**Key Methods:**
- `bundleURL()` - Returns downloaded bundle or nil
- `restartApp()` - Triggers bridge.reload()
- `notifyAppReady()` - Marks update successful (prevents rollback)

### Android (Kotlin)

```kotlin
// MainApplication.kt integration
override fun getJSBundleFile(): String? {
    return BundleNudge.getBundlePath(applicationContext)
}
```

**Key Methods:**
- `getBundlePath()` - Returns downloaded bundle or null
- `restartApp()` - Triggers recreateReactContextInBackground()
- `notifyAppReady()` - Marks update successful

## SDK API

### JavaScript Interface

```typescript
import { BundleNudge } from '@bundlenudge/sdk'

// Initialize
BundleNudge.init({
  appId: 'app_xxx',
  channel: 'production',
})

// Check for updates
const update = await BundleNudge.checkForUpdate()
if (update.available) {
  await BundleNudge.downloadUpdate(update)
  // Update applies on next restart
}

// Mark update successful (call after app confirms working)
await BundleNudge.notifyAppReady()

// Manual restart (for immediate mode in v1.1)
await BundleNudge.restartApp()
```

### Configuration Options

```typescript
interface BundleNudgeConfig {
  appId: string
  channel?: string // default: 'production'
  checkOnLaunch?: boolean // default: true
  installMode?: 'onNextRestart' | 'onNextResume' | 'immediate'
  rollbackTimeout?: number // ms to wait before auto-rollback
}
```

## Rollback Strategy

### Automatic Rollback

1. App starts with new bundle
2. Timer starts (default 10 seconds)
3. If `notifyAppReady()` NOT called within timeout → count as failed start
4. Increment `crashCount` in metadata
5. After 3 failed starts → rollback to `previousVersion`
6. If no previous → fall back to embedded bundle

### Manual Rollback

```typescript
// Clear all updates, revert to embedded
await BundleNudge.clearUpdates()
```

## File Storage

### iOS
```
Documents/
└── bundlenudge/
    ├── metadata.json      # Version tracking
    └── bundles/
        ├── v1.2.3/
        │   └── bundle.hbc
        └── v1.2.4/
            └── bundle.hbc
```

### Android
```
files/
└── bundlenudge/
    ├── metadata.json
    └── bundles/
        ├── v1.2.3/
        │   └── bundle.hbc
        └── v1.2.4/
            └── bundle.hbc
```

## Testing Requirements (Pre-Launch)

### Manual Device Testing Matrix

| Test Case | iOS | Android |
|-----------|-----|---------|
| Cold start with downloaded bundle | ⬜ | ⬜ |
| Update download while app running | ⬜ | ⬜ |
| Bundle applies on restart | ⬜ | ⬜ |
| Rollback after crash | ⬜ | ⬜ |
| Clear updates reverts to embedded | ⬜ | ⬜ |
| Hermes bytecode loads correctly | ⬜ | ⬜ |
| Background download completes | ⬜ | ⬜ |

### Automated Testing

- Detox (iOS) / Maestro (cross-platform) for E2E
- Real bundle downloads from staging server
- Crash simulation for rollback testing

## Expo Support

### Bare Workflow
- Full support - same as React Native bare
- Native modules link normally

### Managed Workflow
- Compatibility layer with expo-updates
- Uses Expo's update infrastructure
- BundleNudge provides: targeting, channels, rollout %
- Expo provides: actual bundle loading

## Implementation Phases

### Phase 1: Core SDK (v1.0)
- [ ] JS layer: check, download, store
- [ ] iOS native module (copy from legacy, validate)
- [ ] Android native module (copy from legacy, validate)
- [ ] Server-side Hermes compilation
- [ ] `onNextRestart` install mode
- [ ] Manual device testing

### Phase 2: Enhanced (v1.1)
- [ ] `onNextResume` install mode
- [ ] `immediate` install mode
- [ ] Automated E2E tests (Detox/Maestro)
- [ ] Expo managed workflow support

### Phase 3: Advanced (v1.2)
- [ ] Differential updates (patches)
- [ ] Background download scheduling
- [ ] Battery/WiFi-aware downloading
- [ ] A/B testing support

---

## Legacy Reference

Native code to copy and adapt:
- iOS: `/Users/isaks_macbook/Desktop/Dev/codepush/packages/sdk/ios/CodePush.swift`
- Android: `/Users/isaks_macbook/Desktop/Dev/codepush/packages/sdk/android/src/main/java/com/codepush/CodePushModule.kt`
- JS Bridge: `/Users/isaks_macbook/Desktop/Dev/codepush/packages/sdk/src/native.ts`

Builder/Hermes integration:
- Check `/Users/isaks_macbook/Desktop/Dev/codepush/packages/builder/`
- Check `/Users/isaks_macbook/Desktop/Dev/codepush/packages/worker/`
