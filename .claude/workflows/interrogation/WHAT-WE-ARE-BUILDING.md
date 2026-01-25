# What We Are Building: BundleNudge

## The Problem We Solve

React Native apps have two parts:
1. **Native code** (Swift/Kotlin) - Requires App Store review (7+ days)
2. **JavaScript bundle** - The actual app logic

When you find a bug or want to ship a feature, you normally wait 7+ days for Apple/Google review.

**BundleNudge lets you push JavaScript updates directly to users' devices, bypassing the App Store.**

## How It Works (User Journey)

### For Developers (Dashboard)

```
1. Developer writes code
2. Builds React Native app (produces bundle.js)
3. Uploads bundle to BundleNudge dashboard
4. Assigns to channel (production, beta, staging)
5. Sets rollout percentage (10%, 50%, 100%)
6. Monitors health metrics for crashes
7. If problems: instant rollback
```

### For End Users (SDK in App)

```
1. User opens app
2. SDK checks BundleNudge API: "Is there an update?"
3. If yes: Download new bundle in background
4. On next app restart: Apply new bundle
5. If crash detected: Auto-rollback to previous bundle
6. Report health status back to API
```

## The Core Flows (MUST understand these)

### Flow 1: Update Check (SDK → API)
```
GET /v1/updates/check
Headers: X-API-Key: bn_xxx

Request: { appVersion, bundleVersion, platform, deviceId }
Response: {
  updateAvailable: true,
  version: "1.2.3",
  downloadUrl: "https://r2.../bundle.js",
  hash: "sha256:abc...",
  mandatory: false
}
```

This is the **most critical endpoint** - called by every app, every time it opens.
Must be: Fast (<100ms), reliable (99.99%), cacheable (KV).

### Flow 2: Bundle Upload (Dashboard → API → R2)
```
1. Dashboard requests presigned URL
2. API creates upload job, returns presigned URL
3. Dashboard uploads directly to R2
4. API processes: validate, compress, generate diff
5. API updates release record as "ready"
6. WebSocket notifies dashboard of completion
```

### Flow 3: Health Monitoring (SDK → API)
```
POST /v1/health/report
{ releaseId, status: "healthy" | "crashed", crashCount, sessionCount }

API aggregates crash rates.
If crash rate > 5%: Auto-disable release.
Dashboard shows health metrics.
```

### Flow 4: Rollback (Dashboard → API → SDK)
```
1. Developer clicks "Rollback" in dashboard
2. API marks release as "rolled_back"
3. SDK's next check sees rolled_back flag
4. SDK reverts to previous bundle on next restart
5. SDK reports successful rollback
```

## Key Architectural Decisions

### Why Cloudflare Workers?
- **Edge computing**: Update checks happen at edge, <50ms latency globally
- **Integrated storage**: D1 (database), R2 (bundles), KV (rate limiting)
- **Queues**: Priority-based processing for different tiers
- **Durable Objects**: Real-time upload status via WebSocket

### Why 4 Priority Queues?
Enterprise customers pay more → get processed first.
- P0 (Enterprise): Max 50 concurrent jobs
- P1 (Team): Max 20 concurrent jobs
- P2 (Pro): Max 10 concurrent jobs
- P3 (Free): Max 5 concurrent jobs

This prevents free tier from starving paid customers.

### Why Separate SDK Auth?
- **Dashboard users**: JWT tokens (login with email/password)
- **SDK clients**: API keys (per-app, rotate-able)

SDK can't use JWT because:
- No user interaction on device
- Tokens would expire
- Can't refresh in background

### Why Binary Diff?
Updates are often small JS changes. Instead of re-downloading entire 5MB bundle:
- Generate binary diff (bsdiff algorithm)
- Download only changes (often <100KB)
- Apply patch on device

## What Each Package Does

### @bundlenudge/shared
Types and contracts shared between all packages:
- TypeScript types (App, Release, Channel, etc.)
- Zod schemas for validation
- Constants (tier limits, platforms)
- No runtime code - just definitions

### @bundlenudge/api
Cloudflare Worker that handles:
- Dashboard API (CRUD for apps, releases, channels)
- SDK API (update check, health reports)
- Upload processing (queue → worker)
- Rate limiting (per tier)
- Multi-tenancy (organizations)

### @bundlenudge/sdk
React Native library that:
- Checks for updates (configurable frequency)
- Downloads bundles (background, resumable)
- Applies updates (on restart or immediate)
- Detects crashes (health monitoring)
- Auto-rollback (if crash rate high)

### @bundlenudge/dashboard
Next.js app for:
- User authentication (Better Auth)
- App management (create, configure)
- Release management (upload, promote, rollback)
- Analytics (downloads, crashes, adoption)
- Team management (invite, roles)

### @bundlenudge/builder
Bundle processing:
- Validate bundle structure
- Minify and compress
- Generate source maps
- Compute diffs from previous version
- Calculate integrity hash

### @bundlenudge/worker
Background job processor:
- Consumes from priority queues
- Runs builder tasks
- Updates job status
- Handles retries and DLQ

## Critical Edge Cases (MUST handle)

### Network Failures
- SDK loses connection mid-download → Resume with Range header
- API unreachable → Exponential backoff, use cached update
- R2 slow → Retry, log latency

### Concurrency
- Two uploads same app → Queue serializes
- SDK checks during upload → Return current version
- Release promoted mid-download → Complete current, get new on next check

### Data Integrity
- Bundle corrupted → SHA256 verification fails → Re-download
- Hash collision → Cryptographic impossibility but log alert
- DB constraint violation → Rollback transaction → Return 409

### Crash Recovery
- App crashes during update apply → Revert on next startup
- Crash loop (>3 crashes in 60s) → Lock to stable version
- Rollback fails → Fall back to original app store version

## Success Criteria

### Performance
- Update check: <100ms p99
- Bundle download: <2s for 5MB
- Upload processing: <30s for 10MB

### Reliability
- API uptime: 99.99%
- SDK never crashes the app
- Rollback always works

### Security
- API keys hashed (not recoverable)
- Bundles integrity-verified
- No secrets in logs
- Rate limiting prevents abuse

## What We're NOT Building (Out of Scope)

- Native code updates (iOS/Android only allows JS)
- Code signing (not required for JS bundles)
- A/B testing (P2, after MVP)
- Gradual rollout UI (P2, after MVP)
- Team management UI (P2, after MVP)
- Self-hosted documentation (just README for now)
