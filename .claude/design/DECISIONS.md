# BundleNudge Design Decisions

This document captures all design decisions made during the QnA phase.
These decisions are LOCKED and will be used to guide autonomous building.

---

## Decision 1: Authentication Model

**Choice: First-launch registration (server-side validation)**

**How it works:**
```
First app launch:
1. SDK generates random deviceId
2. SDK calls POST /register { appId, deviceId, platform, appVersion }
3. Server validates appId exists, stores deviceId, returns accessToken
4. SDK stores accessToken in secure native storage (Keychain/Keystore)

Subsequent requests:
1. SDK calls GET /updates with Authorization: Bearer <accessToken>
2. Server validates token, returns bundle if available
```

**What we're NOT doing:**
- No appSecret in native code
- No client-side bundle encryption
- No complex device attestation (DeviceCheck/SafetyNet)

**Rationale:**
- If someone has the app installed, they should get updates
- No business reason to block legitimate installs
- Server controls everything - can revoke any device
- Better analytics (know every device)
- Simpler SDK (no encryption code)

---

## Decision 2: Update Check Triggers

**Choice: Launch + Foreground + Manual**

**Default behavior:**
- Check on app launch
- Check when app comes to foreground (resume)
- Developer can always call `checkForUpdate()` manually

**Configuration:**
```typescript
BundleNudge.configure({
  checkOn: ['launch', 'foreground'], // default
})

// Manual check always available
const update = await BundleNudge.checkForUpdate()
```

**What we're NOT doing:**
- No background interval timer (battery drain not worth it)

**Rationale:**
- Launch + foreground covers 99% of real-world cases
- Natural UX moments (user is already waiting)
- Simple, predictable behavior
- Manual check available for custom flows

---

## Decision 3: Update Application Timing

**Choice: Next Launch (default) + Manual callback option**

**Default behavior:**
- Bundle downloads in background
- Applies automatically on next app launch
- User never interrupted mid-session

**Manual option for custom UX:**
```typescript
BundleNudge.configure({
  applyOn: 'manual',
  onUpdateDownloaded: (update) => {
    // Show your own UI
    showRestartPrompt(() => {
      update.apply() // restarts app with new bundle
    })
  }
})
```

**What we're NOT doing:**
- No immediate apply (too risky - user mid-action)
- No background→foreground apply (complex state management)

**Rationale:**
- Next launch is safest - clean app state, no interruption
- Manual option lets devs build custom "Update ready!" UX
- Simple, predictable behavior

---

## Decision 4: Native Module Detection

**Choice: STRICT** _(from previous discussions)_

Block OTA updates on ANY native module change:
- New native package added → Block
- Native package removed → Block
- Native package version changed → Block
- Lock file hash changed (Podfile.lock, gradle.lockfile) → Block

**Response:** `requiresAppStoreUpdate: true` with message

**Rationale:** Safety first. One missed native change = crashed apps for all users.

---

## Decision 5: Rollback Strategy

**Choice: Tiered** _(from previous discussions)_

| Tier | Rollback Trigger |
|------|------------------|
| Free | 3 crashes in 60s |
| Pro | 3 crashes in 60s |
| Team | Event-based (critical routes) |
| Enterprise | Event-based (critical routes) |

**Route-based rollback (Team/Enterprise):**
1. SDK auto-tracks all network calls
2. Dashboard shows observed routes
3. Developer marks critical routes
4. If critical route fails → immediate rollback

---

## Decision 6: Bundle Encryption

**Choice: NONE (removed)**

Previously planned AES-256-GCM encryption is removed.

**Rationale:**
- If attacker decompiled app, they have JS anyway
- HTTPS protects bundle in transit
- Server-side auth prevents unauthorized access
- Encryption was security theater for this use case

---

## Decision 7: SDK Public API Surface

**Choice: Minimal API with read-only rollback info**

```typescript
// === INITIALIZATION ===
BundleNudge.configure({
  checkOn: ['launch', 'foreground'],
  applyOn: 'nextLaunch',              // or 'manual'
  onUpdateDownloaded?: (update) => {}
})

// === MANUAL CONTROLS ===
BundleNudge.checkForUpdate()      // Promise<Update | null>
BundleNudge.getCurrentVersion()   // current bundle version
BundleNudge.getDeviceId()         // registered device ID

// === ROLLBACK INFO (read-only) ===
BundleNudge.isRolledBack()        // true if current bundle is rollback
BundleNudge.getRollbackInfo()     // { fromVersion, toVersion, reason }

// === UPDATE OBJECT ===
interface Update {
  version: string
  size: number
  releaseNotes?: string
  apply(): void
  applyOnNextLaunch(): void
}
```

**Rationale:**
- Minimal surface = fewer bugs, easier to maintain
- Read-only rollback info for analytics/UX ("We've reverted to stable")
- No SDK-side rollback trigger (too dangerous)

---

## Decision 8: Dashboard Rollback Control

**Choice: Full manual control for developers**

**Dashboard features:**
- View all releases with status (active, rolled back, superseded)
- One-click rollback button per release
- See crash rates / health metrics per version
- Rollback affects all devices on next update check

**API endpoint:**
```
POST /apps/:appId/releases/:version/rollback
```

**Flow:**
1. Dev sees crash spike in dashboard
2. Clicks "Rollback" on bad version
3. Server marks version as rolled back
4. Devices get previous stable version on next check

**Rationale:**
- Devs need control when things go wrong
- Dashboard provides visibility into health metrics
- Simple one-click action for emergencies

---

## Decision 9: Error Handling Strategy

**Choice: Silent fail + retry, with server-side reporting**

**SDK behavior:**

| Scenario | Action |
|----------|--------|
| Network fails during check | Silent fail, retry next trigger |
| Download fails midway | Discard, retry later |
| Corrupted bundle (hash mismatch) | Retry 3x, then give up |
| Server error (5xx) | Exponential backoff, max 3 retries |
| Device offline | Skip entirely |

**Guiding principle:** Updates are not critical path. Never crash the app or block the user because of update issues.

**Server-side reporting (critical):**

SDK reports all failures to server:
```
POST /telemetry/error
{
  deviceId: "xxx",
  appId: "yyy",
  errorType: "download_failed" | "hash_mismatch" | "network_error" | ...,
  errorMessage: "...",
  targetVersion: "1.2.0",
  currentVersion: "1.1.0",
  retryCount: 2
}
```

**Dashboard shows:**
- Total devices that failed to update
- Failure reasons breakdown (pie chart)
- Failed devices per version
- Retry success rate

**Optional dev callback:**
```typescript
BundleNudge.configure({
  onError?: (error: BundleNudgeError) => {
    // Dev can log to Sentry, etc.
  }
})
```

**Rationale:**
- User never sees update errors (silent)
- Developers see aggregate health in dashboard
- Can identify bad releases (high failure rate)
- Optional callback for custom logging

---

## Decision 10: Offline Behavior

**Choice: App always works, updates are opportunistic**

**Behavior:**

| Scenario | Action |
|----------|--------|
| App launches offline | Use current bundle, skip update check |
| Mid-download goes offline | Discard partial, retry when online |
| Offline for days | Keep working, check when online |

**Key principle:** The app ALWAYS works offline. Updates are opportunistic, not required.

**Storage strategy:**
```
/bundlenudge/
  /current/          <- active bundle
  /previous/         <- one version back (for rollback)
  /downloading/      <- temp during download (deleted if incomplete)
```

**Rules:**
- Max 2 bundles stored (current + previous)
- No partial downloads saved
- `previous` enables instant rollback without network
- When new bundle applied: current → previous, new → current

**Rationale:**
- Offline-first mindset
- Minimal storage footprint
- Instant local rollback capability
- No complex resume logic

---

## Decision 11: Release Targeting (Replaces Channels)

**Choice: Targeting rules engine with "newest wins" resolution**

**Concept:** Every release has optional targeting rules. Devices send their attributes, server returns the newest release that matches.

**Device attributes sent on update check:**
```typescript
{
  deviceId: "xxx",
  os: "ios" | "android",
  osVersion: "17.0",
  deviceModel: "iPhone15,2",
  timezone: "Europe/London",
  locale: "en_GB",
  appVersion: "2.1.0",
  currentBundleVersion: "1.0.5"
}
```

**Targeting rules (JSON):**
```json
{
  "match": "all",
  "rules": [
    { "field": "os", "op": "eq", "value": "ios" },
    { "field": "timezone", "op": "starts_with", "value": "Europe/" },
    { "field": "percentage", "op": "lte", "value": 10 }
  ]
}
```

**Available operators:**
- `eq`, `neq` - equals, not equals
- `gt`, `gte`, `lt`, `lte` - comparisons
- `starts_with`, `ends_with`, `contains` - string matching
- `in`, `not_in` - list membership
- `semver_gt`, `semver_gte`, `semver_lt`, `semver_lte` - version comparison

**Resolution: Newest wins**
```
1. Server finds all active releases for app
2. Filters to releases where device matches targeting rules
3. Returns the NEWEST matching release (by created_at)
4. No match with rules → return latest release with no targeting (default)
```

**Percentage targeting (sticky):**
- `hash(deviceId) % 100` gives consistent 0-99 bucket
- Device always in same bucket across checks
- Dev can configure bucket ranges in dashboard

**Dashboard UI:**
- Create release → optional targeting rules builder
- Visual rule builder (no JSON editing)
- Preview: "This will target ~15,000 devices"
- See which releases are active and their targeting

**Use cases enabled:**
1. Staged rollout: 10% → 50% → 100%
2. Regional testing: Europe first
3. Platform-specific: iOS-only hotfix
4. A/B testing: 50/50 split with metrics
5. Device-specific: Fix for Pixel 8 bug

**Rationale:**
- More powerful than static channels
- "Newest wins" is simple to understand (like git)
- No overlapping priority confusion
- Rollback = newest match becomes previous release
- Enables real A/B testing without device bloat

---

## Decision 12: Dashboard Scope

**Choice: Adapt codepush dashboard with modifications**

**Keep as-is from codepush:**
- Auth flow (Better Auth + Clerk)
- App creation/management
- Release list & details
- Device management (audience page)
- Health metrics display (sparklines, funnels, stats)
- Onboarding wizard
- GitHub integration (repo linking, commit tracking)
- UI components (all of /components/ui, /components/dashboard)
- Landing page
- Admin dashboard

**Modify for BundleNudge:**
- Release creation → add targeting rules builder (visual, no JSON)
- Release details → show targeting rules, device match preview
- Rollback → one-click prominent button
- New: Error/failure dashboard (from SDK telemetry)

**Remove for MVP:**
- Tester email notifications (cut for simplicity)
- Channels concept (replaced by targeting)

**Rationale:**
- Codepush dashboard is production-quality
- Rewriting would waste time
- Focus energy on SDK and API correctness
- UI/UX already validated

---

## Decision 13: Crash Detection & Auto-Rollback

**Choice: Immediate device rollback + configurable global threshold**

**Two-layer system:**

| Layer | Where | Trigger | Action |
|-------|-------|---------|--------|
| Device | SDK | 1 crash after update | Rollback that device immediately |
| Global | Server | X% of devices rolled back | Pause release for everyone |

**Device-level behavior:**
1. Device applies update v1.2.0
2. App crashes on launch
3. SDK detects crash, immediately loads previous bundle
4. User's next launch works (on v1.1.0)
5. SDK reports rollback to server

**Crash detection mechanism:**
- SDK sets flag before loading new bundle: `pendingUpdate = true`
- On successful app init (after 60 seconds): `pendingUpdate = false`
- If app starts with `pendingUpdate = true` → previous launch crashed → rollback

**Rollback window (tiered):**

| Tier | Rollback Trigger | Bundle Cleanup |
|------|------------------|----------------|
| Free/Pro | Crash within 60s | After 60s with no crash |
| Team/Enterprise | Crash OR critical route fails | After all critical routes return 200 |

**Free/Pro behavior:**
- Previous bundle kept for 60 seconds after new bundle applied
- After 60 seconds with no crash → delete previous bundle
- Simple, automatic

**Team/Enterprise behavior (event-based):**
1. SDK tracks network calls to critical routes (configured in dashboard)
2. Previous bundle kept until ALL critical routes return 200
3. If any critical route fails → immediate rollback
4. Once all critical routes succeed → delete previous bundle
5. Timeout: 5 minutes (if routes not called, treat as success)

**Server-level behavior (configurable):**
```
Dashboard settings per app:
  - Auto-pause threshold: 2% (default)
  - Time window: 5 minutes (default)
  - Action: Pause release, notify developer
```

**Threshold options:**
- 0.5% - Very sensitive (high-traffic apps)
- 1% - Sensitive
- 2% - Default
- 5% - Tolerant (small apps, noisy environments)
- 10% - Very tolerant
- Off - Manual only

**What "pause" means:**
- Release stays in database but `status = paused`
- No NEW devices get this release
- Devices already on it stay (already rolled back if crashed)
- Developer can resume or fully rollback

**Rationale:**
- User protected instantly (no 3-crash wait)
- Developer controls global sensitivity
- Safe default (2%) works for most apps
- False positives are safe (user gets working version)

---

## Decision 14: A/B Testing Scope

**Choice: Plumbing only, no metrics**

**What we provide:**
- Targeting rules to split traffic (50% get A, 50% get B)
- Sticky percentage bucketing (device always in same bucket)
- Basic counts: devices per release

**What we DON'T provide:**
- Custom event tracking
- Conversion metrics
- Statistical significance calculations
- A/B comparison dashboards

**Developer responsibility:**
- Use their existing analytics (Mixpanel, Amplitude, PostHog, etc.)
- Track custom events themselves
- Measure conversions themselves

**Rationale:**
- We're OTA updates, not an analytics platform
- Devs already have analytics tools they trust
- Keeps our scope focused
- Avoids building yet-another-analytics-dashboard

---

## All Decisions Locked

Design phase complete. Ready for knowledge extraction and build phase.

---

_Last updated: Design session complete_
