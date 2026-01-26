# BundleNudge SDK - Complete Implementation Plan

## Current Status

**Completed Phases:**
- ✅ Phase 1: Core SDK (Wave 1) - Basic structure, update checking, storage
- ✅ Phase 2A: Security & Stability - Secure device ID, Zod validation, crash threshold
- ✅ Phase 2B: Event-Based Health Monitoring - Privacy-first, zero network when healthy
- ✅ Phase 2C: Endpoint Health Checks - HTTP verification, retries, local rollback

**Test Coverage:** 151 tests passing

---

## Gap Analysis: BundleNudge vs Legacy CodePush

| Feature | BundleNudge | CodePush | Priority |
|---------|-------------|----------|----------|
| Core update flow | ✅ | ✅ | - |
| Crash-based rollback | ✅ | ✅ | - |
| Health monitoring | ✅ | ✅ | - |
| Endpoint health checks | ✅ | ✅ | - |
| **Delta patching** | N/A | ✅ | N/A (see note) |
| **React hooks** | ✅ | ✅ | DONE |
| **Setup utilities** | ✅ | ✅ | DONE |
| **Crash reporter integration** | ✅ | ✅ | DONE |
| **Metrics & A/B testing** | ✅ | ✅ | DONE |
| **Background downloads** | ✅ | ✅ | DONE |
| **Upload system** | ✅ | ✅ | DONE |
| **Native streaming** | ✅ | ✅ | DONE |

> **Note on Delta Patching:** Not applicable for RN 0.73+. Hermes bytecode (.hbc) is binary
> and module boundaries are erased after compilation. Traditional JS module-level diffing
> doesn't work. Instead, we use Hermes compilation + gzip compression which achieves
> similar size reductions (~15-25% of original JS) without the complexity.

---

## Phase 2D: Delta Patching - NOT APPLICABLE

> **Status:** N/A - Intentionally skipped for RN 0.73+

### Why Delta Patching Doesn't Apply

React Native 0.73+ uses Hermes bytecode by default:

```
JS Bundle ──► hermesc compiler ──► .hbc bytecode (binary)
```

**Problems with traditional delta patching:**
1. Hermes bytecode is **binary** - not diffable at module level
2. Module boundaries are **erased** after compilation
3. Bytecode format is **version-specific**

**Our approach instead:**
1. Compile JS to optimized Hermes bytecode (already compact)
2. Apply gzip compression (significant size reduction)
3. Serve ready-to-run .hbc files

**Result:** ~15-25% of original JS size without delta complexity.

### Key Interfaces (ARCHIVED - Not Implemented)

```typescript
// These interfaces were planned but not needed for Hermes:
// - ParsedModule, ParsedBundle (JS module parsing)
// - PatchOperation, BundlePatch (diff operations)
  operations: PatchOperation[]
  preludeChanged?: string
  postludeChanged?: string
}

function diffBundles(oldBundle: ParsedBundle, newBundle: ParsedBundle): BundlePatch

// apply.ts
function applyPatch(bundle: ParsedBundle, patch: BundlePatch): ParsedBundle
function applyPatchWithVerification(
  bundleSource: string,
  patch: BundlePatch,
  expectedHash: string
): Promise<string>
```

### Implementation Notes

1. **Parser regex** for Metro format:
   ```
   __d(function(g,r,i,a,m,e,d){...},<id>,[<deps>]);
   ```

2. **Hash format:** `sha256:<64 hex chars>`

3. **Reference:** `/Users/isaks_macbook/Desktop/Dev/codepush/packages/sdk/src/patch/`

---

## Phase 2E: React Hooks (HIGH PRIORITY)

**Purpose:** Developer-friendly React integration

### Files to Create

| File | Lines | Purpose |
|------|-------|---------|
| `src/hooks/useBundleNudge.ts` | ~100 | Main hook |
| `src/hooks/index.ts` | ~20 | Exports |
| `src/hooks/useBundleNudge.test.ts` | ~200 | Hook tests |

### Key Interface

```typescript
interface UseBundleNudgeResult {
  // State
  status: 'idle' | 'checking' | 'downloading' | 'installing' | 'installed' | 'error'
  updateAvailable: boolean
  downloadProgress: number  // 0-100
  error: Error | null
  currentVersion: string | null

  // Methods
  checkForUpdate: () => Promise<void>
  downloadAndApply: () => Promise<void>
  sync: () => Promise<void>
}

function useBundleNudge(): UseBundleNudgeResult

// Deprecated alias
const useCodePush = useBundleNudge
```

### Implementation Notes

1. Uses `BundleNudge.getInstance()` internally
2. Subscribes to progress callbacks
3. Automatic cleanup on unmount
4. Error boundary friendly

---

## Phase 2F: Setup Utilities (HIGH PRIORITY)

**Purpose:** Simple initialization for common use cases

### Files to Create

| File | Lines | Purpose |
|------|-------|---------|
| `src/setup/index.ts` | ~120 | Setup utilities |
| `src/setup/hoc.tsx` | ~80 | withBundleNudge HOC |
| `src/setup/index.test.ts` | ~150 | Setup tests |

### Key Interfaces

```typescript
interface SetupOptions {
  appId: string
  apiUrl?: string
  channel?: string

  // Behavior
  checkOnStart?: boolean          // default: true
  installOnNextRestart?: boolean  // default: true

  // Rollback
  maxCrashesBeforeRollback?: number  // default: 3
  crashWindowMs?: number             // default: 10000

  // Callbacks
  onUpdateAvailable?: (update: UpdateInfo) => void
  onDownloadProgress?: (progress: number) => void
  onUpdateInstalled?: () => void
  onError?: (error: Error) => void
}

function setupBundleNudge(options: SetupOptions): Promise<void>

// HOC
function withBundleNudge<P>(
  Component: React.ComponentType<P>,
  options?: Partial<SetupOptions>
): React.ComponentType<P>

// Status
interface BundleNudgeStatus {
  currentVersion: string | null
  pendingVersion: string | null
  crashCount: number
  isNativeAvailable: boolean
}

function getBundleNudgeStatus(): BundleNudgeStatus
```

---

## Phase 2G: Crash Reporter Integration (MEDIUM PRIORITY)

**Purpose:** Automatic tagging for Sentry, Bugsnag, Firebase Crashlytics

### Files to Create

| File | Lines | Purpose |
|------|-------|---------|
| `src/integrations/crash-reporters.ts` | ~120 | All integrations |
| `src/integrations/index.ts` | ~20 | Exports |
| `src/integrations/crash-reporters.test.ts` | ~150 | Tests |

### Key Interfaces

```typescript
interface TaggingResult {
  tagged: boolean
  reporter: 'sentry' | 'bugsnag' | 'crashlytics' | null
  error?: string
}

// Auto-detect and tag all available reporters
function tagCrashReporters(metadata: {
  releaseId: string
  bundleVersion: string
  bundleHash?: string
  channel?: string
}): TaggingResult[]

// Individual reporters
function tagSentry(metadata: ReleaseMetadata): TaggingResult
function tagBugsnag(metadata: ReleaseMetadata): TaggingResult
function tagCrashlytics(metadata: ReleaseMetadata): TaggingResult

// Clear tags on rollback
function clearCrashReporterTags(): void
```

### Tags Applied

| Tag | Description |
|-----|-------------|
| `bundlenudge_release_id` | Release identifier |
| `bundlenudge_bundle_version` | Bundle version string |
| `bundlenudge_bundle_hash` | SHA-256 hash (optional) |
| `bundlenudge_channel` | Release channel (optional) |

---

## Phase 2H: Metrics & A/B Testing (MEDIUM PRIORITY)

**Purpose:** Analytics, session tracking, variant assignment

### Files to Create

| File | Lines | Purpose |
|------|-------|---------|
| `src/metrics/tracker.ts` | ~150 | MetricsTracker class |
| `src/metrics/session.ts` | ~80 | Session management |
| `src/metrics/types.ts` | ~50 | Type definitions |
| `src/metrics/index.ts` | ~20 | Exports |
| `src/metrics/tracker.test.ts` | ~200 | Tests |

### Key Interfaces

```typescript
type MetricEventType = 'session' | 'crash' | 'engagement' | 'custom' | 'performance'

interface MetricEvent {
  type: MetricEventType
  name: string
  value?: number
  metadata?: Record<string, unknown>
  timestamp: string
}

interface VariantInfo {
  id: string
  name: string
  isControl: boolean
}

class MetricsTracker {
  // Variant
  getVariant(): VariantInfo | null
  isControlGroup(): boolean

  // Events
  trackEvent(name: string, value?: number, metadata?: object): void
  trackPerformance(name: string, durationMs: number): void
  trackCrash(error: Error, metadata?: object): Promise<void>

  // Session
  startSession(): void
  endSession(): void

  // Flushing
  flush(): Promise<void>
}
```

### Implementation Notes

1. **Queue-based:** Batch events, flush every 30s or at 50 items
2. **Crash reports:** Immediate send (not queued)
3. **Session tracking:** AppState listener for foreground/background
4. **Variant:** Server-assigned, stored in metadata

---

## Phase 2I: Background Downloads (MEDIUM PRIORITY)

**Purpose:** Silent preloading with smart conditions

### Files to Create

| File | Lines | Purpose |
|------|-------|---------|
| `src/background/preload.ts` | ~100 | Preload manager |
| `src/background/conditions.ts` | ~60 | Device condition checks |
| `src/background/index.ts` | ~20 | Exports |
| `src/background/preload.test.ts` | ~150 | Tests |

### Key Interfaces

```typescript
interface PreloadConfig {
  enabled: boolean
  wifiOnly?: boolean           // default: true
  minBatteryPercent?: number   // default: 20
  respectLowPowerMode?: boolean // default: true
}

interface DeviceConditions {
  isWifi: boolean
  batteryLevel: number      // 0-100
  isLowPowerMode: boolean
  isCharging: boolean
}

function getDeviceConditions(): Promise<DeviceConditions>
function shouldPreload(config: PreloadConfig, conditions: DeviceConditions): boolean
function preloadUpdate(config: PreloadConfig): Promise<boolean>
```

### Implementation Notes

1. Uses native module for device conditions
2. Downloads without progress callbacks
3. Health check config persists for restart
4. Silent completion (no user notification)

---

## Phase 2J: Upload System (LOW PRIORITY)

**Purpose:** CLI/CI bundle uploads

### Files to Create

| File | Lines | Purpose |
|------|-------|---------|
| `src/upload/client.ts` | ~120 | UploadClient class |
| `src/upload/websocket.ts` | ~100 | WebSocket status |
| `src/upload/types.ts` | ~40 | Type definitions |
| `src/upload/index.ts` | ~20 | Exports |
| `src/upload/client.test.ts` | ~150 | Tests |

### Key Interfaces

```typescript
type UploadJobStatus = 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled'

interface UploadResult {
  jobId: string
  status: UploadJobStatus
  releaseId?: string
  error?: string
  progress: number
}

interface UploadOptions {
  onProgress?: (progress: number) => void
  onStatusChange?: (status: UploadJobStatus) => void
  pollInterval?: number    // default: 2000ms
  maxAttempts?: number     // default: 60
  useWebSocket?: boolean   // default: true
}

class UploadClient {
  upload(bundle: File | Buffer, options?: UploadOptions): Promise<UploadResult>
  getStatus(jobId: string): Promise<UploadResult>
  cancel(jobId: string): Promise<void>
}

class UploadStatusSocket {
  connect(jobId: string): void
  onStatus(callback: (status: UploadResult) => void): void
  disconnect(): void
}
```

---

## Phase 2K: Native Module Enhancements (LOW PRIORITY)

**Purpose:** Performance optimizations requiring native code

### Native Files to Update

| File | Purpose |
|------|---------|
| `ios/BundleNudge.swift` | iOS native module |
| `android/.../BundleNudgeModule.kt` | Android native module |

### Enhancements

1. **Native streaming:** Direct HTTP download to filesystem (bypass JS memory)
2. **restartApp():** Proper bridge.reload() / recreateReactContext
3. **clearUpdates():** Native filesystem cleanup
4. **getDeviceConditions():** Battery, WiFi, low power mode from native

### Implementation Notes

Reference legacy CodePush:
- iOS: `/Users/isaks_macbook/Desktop/Dev/codepush/packages/sdk/ios/CodePush.swift`
- Android: `/Users/isaks_macbook/Desktop/Dev/codepush/packages/sdk/android/.../CodePushModule.kt`

---

## Phase 2L: Logging & Debug Utilities (LOW PRIORITY)

**Purpose:** Developer debugging support

### Files to Create

| File | Lines | Purpose |
|------|-------|---------|
| `src/debug/logger.ts` | ~60 | Logging system |
| `src/debug/index.ts` | ~20 | Exports |

### Key Interfaces

```typescript
type LogLevel = 'debug' | 'info' | 'warn' | 'error'

function setDebugEnabled(enabled: boolean): void
function isDebugEnabled(): boolean

// Internal use
function log(level: LogLevel, message: string, context?: object): void
```

---

## Implementation Order & Timeline

### Wave 4: Server-Side Delta Patching (API PACKAGE)
| Phase | Description | Est. Tasks | Dependencies |
|-------|-------------|------------|--------------|
| 2D | Delta/Patch System | 3 executors | None |

**Location:** `packages/api/src/lib/patch/`

**Rationale:** RN 0.73+ uses Hermes bytecode (.hbc) compiled server-side.
Client-side JS patching is useless for Hermes apps. Delta patching must
happen on the server BEFORE Hermes compilation.

### Wave 5: SDK Developer Experience (HIGH PRIORITY)
| Phase | Description | Est. Tasks | Dependencies |
|-------|-------------|------------|--------------|
| 2E | React Hooks | 1 executor | None |
| 2F | Setup Utilities | 1 executor | 2E |

### Wave 6: SDK Integrations (MEDIUM PRIORITY)
| Phase | Description | Est. Tasks | Dependencies |
|-------|-------------|------------|--------------|
| 2G | Crash Reporter Integration | 1 executor | None |
| 2H | Metrics & A/B Testing | 2 executors | None |
| 2I | Background Downloads | 1 executor | None |

### Wave 7: SDK Advanced Features (LOW PRIORITY)
| Phase | Description | Est. Tasks | Dependencies |
|-------|-------------|------------|--------------|
| 2J | Upload System | 2 executors | None |
| 2K | Native Enhancements | Manual | All JS complete |
| 2L | Logging & Debug | 1 executor | None |

---

## File Count Summary

| Wave | New Files | New Lines | Tests |
|------|-----------|-----------|-------|
| Wave 4 (2D-2F) | 11 | ~1,100 | ~700 |
| Wave 5 (2G-2I) | 10 | ~750 | ~500 |
| Wave 6 (2J-2L) | 8 | ~560 | ~300 |
| **Total** | **29** | **~2,410** | **~1,500** |

---

## Quality Gates (Per Wave)

1. **TypeScript:** `pnpm typecheck` passes
2. **Lint:** `pnpm lint` passes
3. **Tests:** All new tests pass
4. **File limits:** Max 250 lines per file
5. **No any types:** Strict TypeScript

---

## Reference Implementations

| Feature | CodePush Location |
|---------|-------------------|
| Patch system | `/codepush/packages/sdk/src/patch/` |
| React hooks | `/codepush/packages/sdk/src/hooks/` |
| Setup utils | `/codepush/packages/sdk/src/setup.ts` |
| Crash reporters | `/codepush/packages/sdk/src/integrations/` |
| Metrics | `/codepush/packages/sdk/src/metrics.ts` |
| Background | `/codepush/packages/sdk/src/background.ts` |
| Upload | `/codepush/packages/sdk/src/upload.ts` |
| Native iOS | `/codepush/packages/sdk/ios/CodePush.swift` |
| Native Android | `/codepush/packages/sdk/android/.../CodePushModule.kt` |

---

## Recommended Next Steps

1. **Start Wave 4 (2D-2F)** - Highest impact for developers
2. Run auditors after each wave
3. Commit after passing GO/NO-GO
4. Continue to Wave 5, then Wave 6
