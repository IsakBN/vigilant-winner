# BundleNudge Knowledge Base

This document contains extracted patterns and implementation details for autonomous building.
Read this alongside DECISIONS.md before implementing any feature.

> **📚 See Also:**
> - [INDEX.md](./INDEX.md) - Master index of all knowledge docs
> - [API_FEATURES.md](./API_FEATURES.md) - All 180+ API endpoints
> - [IMPLEMENTATION_DETAILS.md](./IMPLEMENTATION_DETAILS.md) - DB schema, auth, Stripe, encryption
> - [QUALITY_RULES.md](./QUALITY_RULES.md) - Code quality rules

---

## ⚠️ Critical Commands

```bash
# ✅ ALWAYS use these
pnpm test          # Run tests
pnpm typecheck     # Type check
pnpm build         # Build packages
pnpm lint          # Lint code

# ❌ NEVER use this
pnpm dev           # DO NOT start dev servers - agents get stuck
```

---

## 1. SDK Architecture

### 1.1 Core Classes

```typescript
// Main entry point
class BundleNudge {
  private storage: Storage
  private updater: Updater
  private rollbackManager: RollbackManager
  private config: BundleNudgeConfig

  static configure(config: BundleNudgeConfig): void
  static checkForUpdate(): Promise<Update | null>
  static getCurrentVersion(): string | null
  static getDeviceId(): string
  static isRolledBack(): boolean
  static getRollbackInfo(): RollbackInfo | null
}

// Storage manager
class Storage {
  private basePath: string  // {DocumentDirectory}/bundlenudge
  private metadata: Metadata

  // Metadata ops
  async getOrCreateDeviceId(): Promise<string>
  async getCurrentVersion(): Promise<string | null>
  async getPendingUpdate(): Promise<PendingUpdate | null>

  // Bundle lifecycle
  async saveBundle(version: string, data: Uint8Array): Promise<string>
  async applyPendingUpdate(): Promise<boolean>
  async rollbackToPrevious(): Promise<boolean>
  async commitUpdate(): Promise<void>  // Deletes previous bundle

  // Crash tracking
  async setPendingUpdateFlag(value: boolean): Promise<void>
  async getPendingUpdateFlag(): Promise<boolean>
}

// Update checker
class Updater {
  constructor(storage: Storage, config: Config)

  async checkForUpdate(): Promise<UpdateCheckResponse>
  async downloadAndApply(): Promise<DownloadResult>

  // Progress tracking
  onProgress(callback: ProgressCallback): () => void
}

// Rollback manager
class RollbackManager {
  private storage: Storage
  private bootTime: number

  static create(storage: Storage): Promise<RollbackManager>

  async checkForCrashAndRollback(): Promise<void>
  async markUpdateSuccessful(): Promise<void>
  async getBundleToLoad(): Promise<string | null>
}
```

### 1.2 Initialization Flow

```typescript
// Sync init (fast startup)
function initializeSync(config: Config): InitResult {
  const storage = new Storage()
  const rollbackManager = RollbackManager.createSync(storage)
  const updater = new Updater(storage, config)

  // Background: register device, check rollback
  Promise.resolve().then(async () => {
    await rollbackManager.ensureInitialized()
    await registerDeviceIfNeeded(storage, config)
  })

  return { storage, rollbackManager, updater }
}

// Async init (guaranteed state)
async function initializeAsync(config: Config): Promise<InitResult> {
  const storage = new Storage()
  const rollbackManager = await RollbackManager.create(storage)
  await registerDeviceIfNeeded(storage, config)
  const updater = new Updater(storage, config)

  return { storage, rollbackManager, updater }
}
```

### 1.3 Storage Structure

```
{DocumentDirectory}/bundlenudge/
├── metadata.json          # Device state
├── bundles/
│   ├── {version}/
│   │   └── bundle.js      # The JS bundle (base64 encoded)
│   └── {version}/
│       └── bundle.js
└── temp/                   # Download staging
    └── downloading.js
```

**Metadata Schema:**
```typescript
interface Metadata {
  deviceId: string              // UUID, generated once
  accessToken: string | null    // From server registration
  currentVersion: string | null
  currentVersionHash: string | null
  previousVersion: string | null
  pendingUpdateFlag: boolean    // True = last launch may have crashed
  lastSuccessTime: number | null
}
```

### 1.4 Crash Detection (NEW - differs from codepush)

```typescript
// On app launch
async function onAppLaunch() {
  const pendingFlag = await storage.getPendingUpdateFlag()

  if (pendingFlag) {
    // Previous launch crashed after update
    await rollbackManager.rollbackToPrevious()
    await reportRollbackToServer('crash')
  }

  // Check if we have a pending update to apply
  const pending = await storage.getPendingUpdate()
  if (pending) {
    await storage.applyPendingUpdate()
    await storage.setPendingUpdateFlag(true)
    // App will restart with new bundle
  }
}

// After 60 seconds of successful running
async function onUpdateVerified() {
  await storage.setPendingUpdateFlag(false)
  await storage.commitUpdate()  // Delete previous bundle
}
```

---

## 2. API Architecture

### 2.1 Update Check Endpoint

**Endpoint:** `POST /v1/updates/check`

**Request:**
```typescript
interface UpdateCheckRequest {
  appId: string           // UUID
  deviceId: string        // From SDK storage
  platform: 'ios' | 'android'
  appVersion: string      // Native app version (e.g., "2.1.0")
  currentBundleVersion?: string
  currentBundleHash?: string
  deviceInfo?: {
    osVersion?: string
    locale?: string
    timezone?: string
    deviceModel?: string
  }
}
```

**Response:**
```typescript
interface UpdateCheckResponse {
  updateAvailable: boolean
  requiresAppStoreUpdate?: boolean
  appStoreMessage?: string
  release?: {
    version: string
    bundleUrl: string
    bundleSize: number
    bundleHash: string
    releaseId: string
    patch?: {
      fromVersion: string
      patchUrl: string
      patchSize: number
    }
    // Team/Enterprise only
    criticalRoutes?: CriticalRoute[]
  }
}

interface CriticalRoute {
  id: string
  pattern: string      // URL pattern to match
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | '*'
  mustSucceed: boolean // If true, failure triggers rollback
}
```

### 2.2 Targeting Resolution (NEW)

```typescript
// Server-side logic for finding the right release
async function resolveRelease(
  appId: string,
  device: DeviceAttributes
): Promise<Release | null> {
  // 1. Get all active releases for app
  const releases = await db.releases
    .where({ appId, status: 'active' })
    .orderBy('createdAt', 'desc')

  // 2. Filter to matching releases
  const matching = releases.filter(r =>
    evaluateTargetingRules(r.targetingRules, device)
  )

  // 3. Return newest matching (or null)
  return matching[0] || null
}

function evaluateTargetingRules(
  rules: TargetingRules | null,
  device: DeviceAttributes
): boolean {
  if (!rules || rules.rules.length === 0) return true

  const results = rules.rules.map(rule => evaluateRule(rule, device))

  return rules.match === 'all'
    ? results.every(r => r)
    : results.some(r => r)
}

function evaluateRule(rule: Rule, device: DeviceAttributes): boolean {
  const value = device[rule.field]

  switch (rule.op) {
    case 'eq': return value === rule.value
    case 'neq': return value !== rule.value
    case 'gt': return value > rule.value
    case 'gte': return value >= rule.value
    case 'lt': return value < rule.value
    case 'lte': return value <= rule.value
    case 'starts_with': return String(value).startsWith(rule.value)
    case 'ends_with': return String(value).endsWith(rule.value)
    case 'contains': return String(value).includes(rule.value)
    case 'in': return rule.value.includes(value)
    case 'not_in': return !rule.value.includes(value)
    case 'semver_gt': return semverGt(value, rule.value)
    case 'semver_gte': return semverGte(value, rule.value)
    case 'semver_lt': return semverLt(value, rule.value)
    case 'semver_lte': return semverLte(value, rule.value)
    default: return false
  }
}

// Percentage targeting uses sticky hash
function evaluatePercentageRule(deviceId: string, percentage: number): boolean {
  const bucket = fnv1aHash(deviceId) % 100
  return bucket < percentage
}

// FNV-1a hash for consistent bucketing
function fnv1aHash(str: string): number {
  let hash = 2166136261
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i)
    hash = (hash * 16777619) >>> 0
  }
  return hash
}
```

### 2.3 Device Registration

**Endpoint:** `POST /v1/devices/register`

**Request:**
```typescript
interface RegisterRequest {
  appId: string
  deviceId: string      // Generated by SDK
  platform: 'ios' | 'android'
  appVersion: string
  deviceInfo?: DeviceInfo
}
```

**Response:**
```typescript
interface RegisterResponse {
  accessToken: string   // JWT, stored in SDK
  expiresAt: number     // Unix timestamp
}
```

**Token refresh:** SDK calls `/v1/devices/refresh` before expiry.

### 2.4 Telemetry Endpoints

```typescript
// Report successful update
POST /v1/telemetry/applied
{
  deviceId, appId, version, previousVersion
}

// Report rollback
POST /v1/telemetry/rollback
{
  deviceId, appId, fromVersion, toVersion, reason: 'crash' | 'route_failure' | 'manual'
}

// Report error
POST /v1/telemetry/error
{
  deviceId, appId, errorType, errorMessage, targetVersion, currentVersion
}

// Report critical route result (Team/Enterprise)
POST /v1/telemetry/route
{
  deviceId, appId, version, routeId, success: boolean, statusCode?: number
}
```

---

## 3. Database Schema

### 3.1 Core Tables

```sql
-- Users (from Better Auth)
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  created_at INTEGER NOT NULL
);

-- Apps
CREATE TABLE apps (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  platform TEXT NOT NULL,  -- 'ios' | 'android' | 'both'
  bundle_id TEXT,          -- com.example.app
  created_at INTEGER NOT NULL,

  -- Settings
  auto_pause_threshold REAL DEFAULT 2.0,  -- % of devices
  auto_pause_window_minutes INTEGER DEFAULT 5
);

-- Releases
CREATE TABLE releases (
  id TEXT PRIMARY KEY,
  app_id TEXT NOT NULL REFERENCES apps(id),
  version TEXT NOT NULL,
  bundle_url TEXT NOT NULL,
  bundle_size INTEGER NOT NULL,
  bundle_hash TEXT NOT NULL,

  -- Targeting (nullable = targets all)
  targeting_rules TEXT,  -- JSON: { match, rules }

  -- Status
  status TEXT NOT NULL DEFAULT 'active',  -- active | paused | rolled_back
  created_at INTEGER NOT NULL,

  -- Native version requirements
  min_ios_version TEXT,
  min_android_version TEXT,

  UNIQUE(app_id, version)
);

-- Registered devices
CREATE TABLE devices (
  id TEXT PRIMARY KEY,
  app_id TEXT NOT NULL REFERENCES apps(id),
  device_id TEXT NOT NULL,
  platform TEXT NOT NULL,
  app_version TEXT NOT NULL,
  access_token_hash TEXT NOT NULL,

  -- Device info
  os_version TEXT,
  locale TEXT,
  timezone TEXT,
  device_model TEXT,

  -- Tracking
  current_bundle_version TEXT,
  first_seen_at INTEGER NOT NULL,
  last_seen_at INTEGER NOT NULL,

  -- Status
  revoked INTEGER DEFAULT 0,

  UNIQUE(app_id, device_id)
);

-- Telemetry events
CREATE TABLE device_events (
  id TEXT PRIMARY KEY,
  app_id TEXT NOT NULL,
  device_id TEXT NOT NULL,
  release_id TEXT,
  event TEXT NOT NULL,  -- 'check' | 'applied' | 'rollback' | 'error' | 'route'
  metadata TEXT,        -- JSON with event-specific data
  created_at INTEGER NOT NULL
);

-- Critical routes (Team/Enterprise)
CREATE TABLE critical_routes (
  id TEXT PRIMARY KEY,
  app_id TEXT NOT NULL REFERENCES apps(id),
  pattern TEXT NOT NULL,       -- URL pattern
  method TEXT DEFAULT '*',     -- HTTP method or *
  name TEXT,                   -- Display name
  created_at INTEGER NOT NULL
);
```

### 3.2 Indexes

```sql
CREATE INDEX idx_releases_app_status ON releases(app_id, status);
CREATE INDEX idx_releases_app_created ON releases(app_id, created_at DESC);
CREATE INDEX idx_devices_app ON devices(app_id);
CREATE INDEX idx_events_app_created ON device_events(app_id, created_at);
CREATE INDEX idx_events_release ON device_events(release_id, event);
```

---

## 4. Key Algorithms

### 4.1 Download with Retry

```typescript
const MAX_RETRIES = 3
const BASE_DELAY_MS = 1000

async function fetchWithRetry(url: string): Promise<Response> {
  let lastError: Error

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(url)

      // Don't retry client errors
      if (response.status >= 400 && response.status < 500) {
        return response
      }

      // Retry server errors
      if (response.status >= 500) {
        throw new Error(`Server error: ${response.status}`)
      }

      return response
    } catch (error) {
      lastError = error
      const delay = BASE_DELAY_MS * Math.pow(2, attempt)
      await sleep(delay)
    }
  }

  throw lastError
}
```

### 4.2 Hash Verification

```typescript
async function verifyBundleHash(
  content: ArrayBuffer,
  expectedHash: string
): Promise<boolean> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', content)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

  // expectedHash format: "sha256:abcdef..."
  const expected = expectedHash.replace('sha256:', '')
  return hashHex === expected
}
```

### 4.3 Atomic File Operations

```typescript
async function atomicWrite(path: string, content: string): Promise<void> {
  const tempPath = `${path}.tmp`

  // Write to temp file
  await RNFS.writeFile(tempPath, content, 'utf8')

  // Atomic rename
  await RNFS.moveFile(tempPath, path)
}
```

### 4.4 Global Rollback Check (Server)

```typescript
async function checkAndPauseRelease(appId: string, releaseId: string): Promise<void> {
  const app = await db.apps.get(appId)
  const threshold = app.auto_pause_threshold / 100
  const windowMs = app.auto_pause_window_minutes * 60 * 1000
  const since = Date.now() - windowMs

  // Count devices that applied this release
  const appliedCount = await db.device_events.count({
    release_id: releaseId,
    event: 'applied',
    created_at: { $gt: since }
  })

  // Count devices that rolled back
  const rollbackCount = await db.device_events.count({
    release_id: releaseId,
    event: 'rollback',
    created_at: { $gt: since }
  })

  if (appliedCount === 0) return

  const rollbackRate = rollbackCount / appliedCount

  if (rollbackRate >= threshold) {
    await db.releases.update(releaseId, { status: 'paused' })
    await notifyDeveloper(appId, releaseId, rollbackRate)
  }
}
```

---

## 5. Error Codes

### SDK Error Codes

| Code | Meaning |
|------|---------|
| `NO_UPDATE` | No update available |
| `ALREADY_LATEST` | Device has latest version |
| `DOWNLOAD_FAILED` | Network error during download |
| `HASH_MISMATCH` | Downloaded bundle failed verification |
| `STORAGE_ERROR` | Failed to save bundle to disk |
| `APPLY_FAILED` | Failed to apply update |
| `ROLLBACK_FAILED` | Rollback operation failed |

### API Error Responses

```typescript
// 400 Bad Request
{ error: 'validation_error', details: [...] }

// 401 Unauthorized
{ error: 'unauthorized', message: 'Invalid or expired token' }

// 403 Forbidden
{ error: 'forbidden', message: 'Device revoked' }

// 404 Not Found
{ error: 'not_found', message: 'App not found' }

// 429 Too Many Requests
{ error: 'rate_limited', retryAfter: 60 }

// 500 Internal Server Error
{ error: 'internal_error' }
```

---

## 6. Testing Requirements

### Unit Tests Required

| Component | Test Cases |
|-----------|------------|
| Storage | Save/load metadata, bundle CRUD, rollback |
| Updater | Check flow, download with progress, retry logic |
| RollbackManager | Crash detection, rollback trigger, success marking |
| Targeting | All operators, percentage bucketing consistency |
| Hash verification | Valid hash, invalid hash, malformed hash |

### Integration Tests Required

| Flow | Steps |
|------|-------|
| First launch | Register → get token → store token |
| Update check | Auth → check → download → verify → apply |
| Crash rollback | Apply → crash flag → relaunch → rollback |
| Route-based rollback | Apply → call route → fail → rollback |

### Edge Cases

1. **Network lost mid-download** → Discard partial, retry later
2. **Storage full** → Fail gracefully, report error
3. **Corrupted metadata** → Reset to defaults
4. **Token expired** → Refresh automatically
5. **App killed during update** → Rollback on next launch
6. **Multiple rapid launches** → Don't double-count crashes

---

## 7. File Size Limits

Per CLAUDE.md:
- Max 250 lines per file
- Max 50 lines per function
- Max 3 levels of nesting
- Max 4 parameters per function

Split large components:
- `storage.ts` → `storage.ts` + `storage-metadata.ts` + `storage-bundle.ts`
- `updater.ts` → `updater.ts` + `updater-download.ts` + `updater-progress.ts`

---

_Last updated: Knowledge extraction complete_
