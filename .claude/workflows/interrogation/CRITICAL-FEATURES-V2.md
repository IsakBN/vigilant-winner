# Critical Features - Deep Discussion V2

**These features MUST be bulletproof. A bug here = broken apps, lost customers, destroyed trust.**

---

## CRITICAL FEATURE 1: Native Module Detection (10/10)

### The Problem
React Native apps have two parts:
1. **JavaScript bundle** - Can be updated OTA (us)
2. **Native modules** - CANNOT be updated OTA (requires App Store)

If a developer adds a new native module (e.g., `react-native-maps`) and tries to push an OTA update, **the app will crash** because the JavaScript code references a native module that doesn't exist on the device.

### How codepush Handles This

From `/codepush/packages/api/src/lib/native-deps/index.ts`:

**Level 1: Package.json Analysis**
```typescript
// Check if package is known to contain native code
export function isNativePackage(packageName: string): boolean {
  return (
    IOS_NATIVE_PATTERNS.some(pattern => pattern.test(packageName)) ||
    ANDROID_NATIVE_PATTERNS.some(pattern => pattern.test(packageName))
  )
}

// Known patterns:
// - react-native-* (most contain native code)
// - @react-native-* (scoped packages)
// - expo-* (Expo modules)
// - Specific packages: firebase, sentry, etc.
```

**Level 2: Lock File Fingerprinting** (Enhanced Detection)
```typescript
// Hash these files to detect native changes:
export const NATIVE_LOCK_FILES = {
  ios: ['ios/Podfile.lock'],          // CocoaPods
  android: ['android/gradle.lockfile'], // Gradle
  shared: ['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml']
}
```

**The Response**
```typescript
interface UpdateCheckResponseWithPatch {
  requiresAppStoreUpdate?: boolean   // TRUE = block OTA
  appStoreMessage?: string           // "Please update from App Store"
  // ... rest of response
}
```

### Edge Cases We MUST Handle

| Case | Detection Method | Response |
|------|------------------|----------|
| New native module added | Package.json diff + Podfile.lock hash | Block OTA, show App Store message |
| Native module removed | Package.json diff | Block OTA (removal could break other code) |
| Native module version change | Semver + lock file hash | Block if major/minor change |
| Transitive native dependency | Lock file fingerprint | Block (catches deps of deps) |
| First upload (no baseline) | No previous fingerprint | Store fingerprint, allow OTA |
| Package renamed but same native | Pattern matching | Detect both old and new names |

### Questions for You

```markdown
## Native Detection Strategy

**Option A: Strict (codepush approach)**
- Block on ANY native package change
- Block on lock file hash change
- Safe but may block legitimate JS-only updates

**Option B: Smart (version-aware)**
- Block on major/minor version changes
- Allow patch version updates (less likely to have native changes)
- More flexible but slightly riskier

**Option C: Allowlist-based**
- Maintain allowlist of "safe" packages
- Block unknown packages
- Requires maintenance

**Option D: Dev-controlled**
- Let developer mark releases as "native-safe" or "native-required"
- Full control but relies on developer correctness

**Recommendation: A (Strict)** - Safety first. We can relax later.

**Your choice?**
```

---

## CRITICAL FEATURE 2: App Store Version Tracking (10/10)

### The Problem
When we block an OTA update because of native changes:
1. User sees "Please update from App Store"
2. User updates app in App Store
3. **How do we know they updated?**
4. **How do we serve the correct bundle for the new version?**

### The Flow

```
User on app v1.0 + bundle v100
           │
           ▼
Developer adds react-native-maps, pushes bundle v101
           │
           ▼
SDK checks for update
           │
           ▼
API detects native change → returns requiresAppStoreUpdate: true
           │
           ▼
User updates from App Store (now v1.1)
           │
           ▼
SDK checks again with app_version: "1.1"
           │
           ▼
API sees new app version → serves bundle v101 (or newer)
```

### How codepush Handles This

From `/codepush/packages/api/src/routes/updates.ts`:

```typescript
// SDK sends app version in every check
const request = {
  app_version: "1.1.0",        // Native app version from App Store
  current_bundle_version: "100", // Current JS bundle version
  platform: "ios",
  // ...
}

// API checks minimum version requirement
async function checkMinimumVersion(db, appId, release, platform, appVersion) {
  const minVersion = platform === 'ios'
    ? release.min_ios_version
    : release.min_android_version

  if (minVersion && !meetsMinimumVersion(appVersion, minVersion)) {
    return release.app_store_message
      ?? 'Please update from the App Store'
  }
  return null // No update required
}
```

### The Key Insight
**We track the relationship between:**
- `min_ios_version` / `min_android_version` on each release
- The actual app version the SDK reports

When a release has native changes:
1. Set `min_ios_version` = the NEW App Store version
2. Until user updates, they get `requiresAppStoreUpdate: true`
3. After App Store update, they get the new bundle

### Database Schema

```sql
CREATE TABLE releases (
  id TEXT PRIMARY KEY,
  version TEXT NOT NULL,           -- Bundle version "101"
  min_ios_version TEXT,            -- "1.1.0" (set when native changes detected)
  min_android_version TEXT,        -- "1.1.0"
  app_store_message TEXT,          -- Custom message for users
  native_deps_snapshot TEXT,       -- JSON of native deps for comparison
  native_fingerprint TEXT,         -- Lock file hashes
  -- ...
)
```

### Questions for You

```markdown
## App Store Update Detection

**How should we set min_version when native changes detected?**

**Option A: Manual (developer sets)**
- Developer must specify the App Store version number
- Full control but error-prone

**Option B: Automatic increment**
- Detect native changes → increment min_version
- API: GET /v1/apps/:id/next-native-version
- Less control but safer

**Option C: GitHub webhook**
- Listen for App Store releases via webhook
- Auto-update min_version when new native build ships
- Most accurate but complex setup

**Option D: CLI integration**
- `bundlenudge release` CLI detects native changes
- Prompts developer for App Store version if needed
- Good DX but requires CLI usage

**Recommendation: D (CLI integration)** - Best DX, catches issues early

**Your choice?**
```

---

## CRITICAL FEATURE 3: Upload Queue Isolation (10/10)

### The Problem
Enterprise customers pay $500/month. Free tier users pay $0.
If a free user uploads a 50MB bundle, should enterprise customers wait?
**Absolutely not.**

### How codepush Handles This

**4 Priority Queues:**
```
UPLOAD_QUEUE_P0 (Enterprise) → Max 50 concurrent jobs
UPLOAD_QUEUE_P1 (Team)       → Max 20 concurrent jobs
UPLOAD_QUEUE_P2 (Pro)        → Max 10 concurrent jobs
UPLOAD_QUEUE_P3 (Free)       → Max 5 concurrent jobs
```

**The Flow:**
1. Upload request comes in
2. Check user's subscription tier
3. Route to appropriate queue
4. Each queue has dedicated worker capacity

**From wrangler.toml:**
```toml
[[queues.producers]]
queue = "upload-queue-p0"

[[queues.producers]]
queue = "upload-queue-p1"

[[queues.producers]]
queue = "upload-queue-p2"

[[queues.producers]]
queue = "upload-queue-p3"

[[queues.consumers]]
queue = "upload-queue-p0"
max_batch_size = 50
max_batch_timeout = 30

[[queues.consumers]]
queue = "upload-queue-dlq"  # Dead letter queue
```

### Verification We Need

| Test | What to Verify |
|------|----------------|
| Queue routing | Enterprise user → P0, Free user → P3 |
| Isolation | P3 congestion doesn't block P0 |
| Concurrency limits | Max X jobs per queue enforced |
| Retry logic | Failed jobs retry up to 3 times |
| DLQ handling | After 3 retries → DLQ, alert admin |
| Throughput | Enterprise sees <10s queue time |

### Questions for You

```markdown
## Queue Configuration

**Concurrency limits per tier:**

| Tier | Concurrent Jobs | Max Bundle Size | Queue Priority |
|------|-----------------|-----------------|----------------|
| Enterprise | 50 | 100MB | P0 |
| Team | 20 | 50MB | P1 |
| Pro | 10 | 25MB | P2 |
| Free | 5 | 10MB | P3 |

**Are these limits correct? Any adjustments?**

**Also: Should we have a separate queue for GitHub-triggered uploads vs dashboard uploads?**
- GitHub CI might upload more frequently
- Could separate to prevent CI from blocking manual uploads
```

---

## CRITICAL FEATURE 4: In-App Update Modal (8/10)

### The Problem
Sometimes you need to tell users:
- "You're on an outdated version, please update"
- "Critical security fix available"
- "This version is no longer supported"

The SDK needs a reliable way to display these messages.

### The Flow

```
SDK checks for update
           │
           ▼
API returns: {
  updateAvailable: false,
  requiresAppStoreUpdate: true,
  appStoreMessage: "A critical security update is available. Please update from the App Store."
}
           │
           ▼
SDK displays modal with message + "Update Now" button
           │
           ▼
Button opens App Store link
```

### What We Need to Build

```typescript
// SDK-side component
export function UpdateRequiredModal({
  visible: boolean,
  message: string,
  onDismiss?: () => void,  // Only if not mandatory
  appStoreUrl: string,
}): React.ReactNode

// Usage in SDK
if (response.requiresAppStoreUpdate) {
  showUpdateModal({
    message: response.appStoreMessage,
    mandatory: response.mandatory ?? false,
    appStoreUrl: getAppStoreUrl(platform, bundleId)
  })
}
```

### Edge Cases

| Case | Behavior |
|------|----------|
| Mandatory update | Modal cannot be dismissed |
| Optional update | Modal has "Later" button |
| Custom message from dashboard | Display developer's message |
| No message | Use default: "Please update from App Store" |
| Offline when checking | Cache last known state, show modal next time |

### Questions for You

```markdown
## Update Modal Behavior

**Option A: Simple modal (built-in)**
- BundleNudge provides basic modal component
- Customizable colors/text
- Works out of the box

**Option B: Callback-based**
- SDK calls developer's callback: onUpdateRequired(message)
- Developer handles UI themselves
- Full flexibility

**Option C: Both**
- Default modal provided
- Developer can override with callback
- Best of both worlds

**Recommendation: C (Both)** - Works out of box but customizable

**Also: Should we support "soft" updates (show banner, don't block)?**
```

---

## CRITICAL FEATURE 5: Tiered Rollback System (10/10)

### Your Requirement
> "On free and pro tier - rollback within 10 seconds of boot. On team and enterprise - rollback based on events, we visualize routes in dashboard and select critical ones."

This is brilliant. Let me break it down:

### Tier-Based Rollback

| Tier | Rollback Trigger | Why |
|------|------------------|-----|
| Free | 3 crashes in 60s | Simple, catches obvious breaks |
| Pro | 3 crashes in 60s | Same as free |
| Team | Event-based | More sophisticated, less false positives |
| Enterprise | Event-based | Same as Team + custom thresholds |

### Event-Based Rollback (Team/Enterprise)

**The Concept:**
1. Developer defines "critical routes" in dashboard (like Postman)
2. SDK reports when routes return non-200
3. If critical route fails → trigger rollback
4. Keep previous bundle on device until all critical routes succeed

**Dashboard UI:**
```
┌─────────────────────────────────────────────────────────────┐
│ Critical Routes for MyApp                                    │
├─────────────────────────────────────────────────────────────┤
│ ☑ POST /api/checkout    - Must return 200                   │
│ ☑ GET /api/user/profile - Must return 200                   │
│ ☐ GET /api/feed         - Optional                          │
│ ☑ POST /api/auth/login  - Must return 200                   │
└─────────────────────────────────────────────────────────────┘
```

**SDK Logic:**
```typescript
// After applying update, SDK watches critical routes
interface CriticalRoute {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  path: string  // Regex or exact match
  expectedStatus: number[]  // [200, 201]
  maxFailures: number  // Fail after N failures
}

// SDK intercepts fetch
const originalFetch = global.fetch
global.fetch = async (url, options) => {
  const response = await originalFetch(url, options)

  if (isCriticalRoute(url, options.method)) {
    if (!isExpectedStatus(response.status)) {
      recordRouteFailure(url, response.status)

      if (shouldRollback()) {
        triggerRollback('critical_route_failure')
      }
    } else {
      recordRouteSuccess(url)
    }
  }

  return response
}
```

### The "Keep Previous Bundle" Logic

```typescript
// After update applied:
1. Set state: UPDATE_PENDING_VERIFICATION
2. Load new bundle
3. Monitor critical routes
4. If ANY critical route fails:
   - Keep previous bundle in storage
   - Next launch: load previous bundle
   - Report rollback to server
5. If ALL critical routes succeed within 30s:
   - Mark update as VERIFIED
   - Clean up previous bundle
   - Report success to server
```

### Questions for You

```markdown
## Route-Based Rollback Configuration

**How should developers define critical routes?**

**Option A: Dashboard only**
- Define routes in web dashboard
- API sends config to SDK on update check
- No code changes needed

**Option B: Code-based**
- Developer defines in SDK config:
  ```typescript
  BundleNudge.configure({
    criticalRoutes: [
      { path: '/api/checkout', method: 'POST', expectedStatus: [200, 201] }
    ]
  })
  ```
- More control, requires code change

**Option C: Auto-detect + override**
- SDK auto-tracks all network calls
- Dashboard shows all observed routes
- Developer marks critical ones
- Best visibility

**Recommendation: A + C hybrid**
- Auto-detect and display in dashboard
- Let developer mark critical ones
- Push config to SDK via update check

**Your choice?**
```

### Another Question

```markdown
## Verification Window

**How long should SDK wait for critical routes to succeed?**

| Option | Time | Pros | Cons |
|--------|------|------|------|
| A | 10 seconds | Fast rollback | Might miss slow routes |
| B | 30 seconds | Reasonable wait | User might leave app |
| C | Until all routes called | Most accurate | Could wait forever |
| D | Configurable per-app | Flexible | More complexity |

**Recommendation: D (Configurable)** with default of 30s

**Your choice?**
```

---

## CRITICAL FEATURE 6: GitHub R2 Upload Verification (9/10)

### The Problem
Developers will upload bundles via GitHub Actions:
```yaml
- name: Upload to BundleNudge
  run: |
    curl -X POST https://api.bundlenudge.com/v1/releases \
      -H "Authorization: Bearer ${{ secrets.BUNDLENUDGE_TOKEN }}" \
      -F "bundle=@bundle.js" \
      -F "version=${{ github.sha }}"
```

**How do we guarantee:**
1. The upload actually succeeded?
2. The bundle wasn't corrupted in transit?
3. The queue processed it correctly?
4. The release is live?

### Verification Chain

```
GitHub Action uploads bundle
           │
           ▼
API receives, validates hash
           │
           ▼
API stores in R2, creates upload job
           │
           ▼
Job enters priority queue
           │
           ▼
Worker processes: parse, store modules, create release
           │
           ▼
Worker updates job status to 'completed'
           │
           ▼
GitHub Action polls: GET /v1/upload-jobs/:id
           │
           ▼
Returns: { status: 'completed', releaseId: 'xxx' }
           │
           ▼
GitHub Action verifies: GET /v1/releases/:releaseId
           │
           ▼
Returns: { status: 'rolling', bundleHash: 'sha256:...' }
           │
           ▼
GitHub Action compares hash with local file
           │
           ▼
If match → SUCCESS, else → FAIL (alert developer)
```

### What We Need

```typescript
// POST /v1/uploads/presigned - Get presigned URL
{
  contentType: 'application/javascript',
  contentLength: 5242880,
  contentMd5: 'base64-encoded-md5'  // For upload integrity
}

// Response
{
  uploadUrl: 'https://...',
  jobId: 'job_xxx',
  expiresAt: '2024-01-01T00:00:00Z'
}

// PUT to uploadUrl with bundle

// GET /v1/upload-jobs/:jobId - Poll for completion
{
  status: 'completed',  // queued | processing | completed | failed
  releaseId: 'rel_xxx',
  processingTimeMs: 2340,
  bundleHash: 'sha256:abc123...'
}
```

### Questions for You

```markdown
## GitHub Integration

**Should we provide an official GitHub Action?**

**Option A: Yes, official action**
```yaml
- uses: bundlenudge/upload-action@v1
  with:
    api-key: ${{ secrets.BUNDLENUDGE_API_KEY }}
    bundle-path: ./bundle.js
    version: ${{ github.sha }}
    wait-for-processing: true
```
- Easy to use
- We control the experience
- More to maintain

**Option B: CLI only**
```yaml
- run: npx bundlenudge upload ./bundle.js
```
- Simpler
- Works anywhere (not just GitHub)
- Less discoverability

**Option C: Both**
- Action for easy GitHub integration
- CLI for flexibility

**Recommendation: C (Both)** - Best coverage

**Your choice?**
```

---

## CRITICAL FEATURE 7: Other Critical Considerations

### What Else Could Go Wrong?

| Feature | Risk | Mitigation |
|---------|------|------------|
| **Certificate pinning** | If app pins certs and we change them, SDK fails | SDK should fallback gracefully |
| **Offline mode** | No network = can't check updates | Cache last update, apply on reconnect |
| **Bundle size limits** | Free tier uploads 500MB bundle | Enforce limits in API |
| **Rate limiting** | DDoS on /check endpoint | KV-based rate limiting |
| **Metrics/analytics** | Wrong data = wrong decisions | Validate all metrics server-side |
| **Multi-app accounts** | Upload to wrong app | Strict API key per-app validation |
| **Hermes compatibility** | Hermes bytecode vs plain JS | Detect and handle both formats |

### Questions for You

```markdown
## Any Other Critical Features?

Based on your experience, are there other features that:
1. If they fail, would break user apps?
2. If they're slow, would hurt developer experience?
3. If they're wrong, would cause incorrect rollbacks?

Things to consider:
- Expo compatibility?
- Specific React Native versions?
- Hermes vs JSC engine differences?
- Source map handling for crash reports?
- Bundle encryption/obfuscation?
```

---

---

## CRITICAL FEATURE 8: Bundle Encryption (10/10)

### The Decision
Bundles are encrypted at rest and in transit. App ID validates decryption.

### The Flow
```
Upload:
1. Developer uploads bundle.js
2. API generates appSecret (unique per app)
3. API encrypts: encrypt(bundle, appSecret)
4. Encrypted bundle stored in R2

Download:
1. SDK requests bundle with appId
2. API validates appId matches
3. SDK receives encrypted bundle
4. SDK decrypts with embedded appSecret
5. SDK applies bundle
```

### Security Model
| Component | Purpose | Where Stored |
|-----------|---------|--------------|
| API Key | Authentication (who are you?) | Dashboard, CI/CD |
| App Secret | Decryption (can you read this?) | Native code (not JS) |
| App ID | Validation (is this your app?) | SDK config |

### Why App Secret in Native Code?
- JavaScript is readable (even minified)
- Native code is compiled, harder to extract
- React Native bridge keeps secret isolated

---

## CRITICAL FEATURE 9: Source Maps (9/10)

### The Decision
Store server-side, never expose to devices.

### The Flow
```
Upload:
├── bundle.js      → R2 (public, served to devices)
├── bundle.js.map  → R2 (private, NEVER served)
└── metadata.json  → D1 (links bundle hash to source map)

Crash Decoding:
1. Crash reporter (Sentry) captures: "Error at a.js:1:2345"
2. Sentry webhook calls BundleNudge API
3. API looks up source map by bundle hash
4. API decodes stack trace server-side
5. API returns readable stack trace
6. Source map never leaves our server
```

### Integration Options
- **Sentry**: Webhook integration
- **Crashlytics**: API integration
- **Custom**: API endpoint for decoding

### Security
Source maps expose:
- Original file names
- Original variable names
- Code structure and logic

**NEVER serve to devices. Always decode server-side.**

---

## CRITICAL FEATURE 10: Hermes + JSC Support (8/10)

### The Decision
Auto-detect bundle type, support both engines.

### Detection Method
```typescript
function detectBundleType(buffer: ArrayBuffer): 'hermes' | 'javascript' {
  const header = new Uint8Array(buffer.slice(0, 4))

  // Hermes bytecode magic: 0x1F 0x48 0x42 0x43 ("HBC" with prefix)
  if (header[0] === 0x1F && header[1] === 0xC6 &&
      header[2] === 0x85 && header[3] === 0x84) {
    return 'hermes'
  }

  return 'javascript'
}
```

### Handling
| Engine | Bundle Type | SDK Action |
|--------|-------------|------------|
| Hermes | Bytecode (.hbc) | Load directly |
| JSC | Plain JS | Load directly |

Both work with the same storage/rollback/verification logic.

---

## SUMMARY: Critical Feature Priority

| # | Feature | Confidence Required | Status |
|---|---------|---------------------|--------|
| 1 | Native Module Detection | 10/10 | Need to build |
| 2 | App Store Version Tracking | 10/10 | Need to build |
| 3 | Upload Queue Isolation | 10/10 | Need to build |
| 4 | In-App Update Modal | 8/10 | Need to build |
| 5 | Tiered Rollback (crash + event-based) | 10/10 | Need to build |
| 6 | GitHub R2 Upload Verification | 9/10 | Need to build |
| 7 | Hash Verification | 10/10 | Covered in V1 |
| 8 | Atomic Storage | 10/10 | Covered in V1 |
| 9 | Bundle Encryption | 10/10 | Need to build |
| 10 | Source Maps (server-side) | 9/10 | Need to build |
| 11 | Hermes + JSC Support | 8/10 | Need to build |

### Testing Matrix

Each critical feature needs:
- [ ] Unit tests (100% coverage)
- [ ] Integration tests (all flows)
- [ ] Edge case tests (all tables above)
- [ ] Load tests (where applicable)
- [ ] Manual device tests (iOS + Android)
- [ ] Chaos tests (network failure, storage corruption)

**The build workflow will NOT proceed past these features without explicit `/approve` gates.**

---

## All Decisions Reference

See `DECISIONS-FINAL.md` for the complete locked decisions from our discussion.
