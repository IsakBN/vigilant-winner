# Architecture

## System Overview

BundleNudge is an OTA (Over-The-Air) update system for React Native applications. It enables developers to push JavaScript bundle updates directly to users without App Store or Play Store review.

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   React Native  │────▶│  Cloudflare API  │────▶│  R2 Storage     │
│   App (SDK)     │     │  (Hono Workers)  │     │  (Bundles)      │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                               │
                      ┌────────┼────────┬────────┐
                      │        │        │        │
                 ┌────▼──┐ ┌──▼────┐ ┌─▼──────┐ ┌▼────────┐
                 │D1 DB  │ │KV     │ │Analytics│ │Queues   │
                 │(Meta) │ │(Rate  │ │Engine   │ │(Upload) │
                 │       │ │Limit) │ │(Metrics)│ │         │
                 └───────┘ └───────┘ └─────────┘ └─────────┘
                                          │
                                    ┌─────▼─────┐
                                    │ Durable   │
                                    │ Objects   │
                                    │ (WS State)│
                                    └───────────┘

Next.js Dashboard ◄──────── API (for management)
```

---

# CLOUDFLARE BINDINGS (Complete)

## D1 Database

**Primary Database**: Stores all metadata

### Core Tables

| Table | Purpose |
|-------|---------|
| `apps` | Application definitions, linked to users |
| `releases` | Release records with version, channel, rollout config |
| `channels` | Release channels (production, staging, beta) |
| `upload_jobs` | Upload job tracking (status, timestamps, errors) |
| `device_pings` | Client health events (applied, crash, health) |
| `subscriptions` | User subscription records |
| `subscription_plans` | Plan definitions with limits |
| `user_suspensions` | Account suspension status |
| `user_limit_overrides` | Admin-applied limit adjustments |
| `user_credits` | Bonus build/upload credits |
| `build_usage` | Monthly usage tracking |

### Release Tables

| Table | Purpose |
|-------|---------|
| `release_modules` | Parsed JS modules for delta updates |
| `release_metadata` | Bundle prelude/postlude data |
| `release_variants` | A/B test variant configurations |
| `device_variant_assignments` | Which device gets which variant |
| `health_failures` | Detailed health check failure tracking |

### Integration Tables

| Table | Purpose |
|-------|---------|
| `crash_integrations` | Sentry/Bugsnag/Crashlytics configs (encrypted) |
| `github_installations` | GitHub App installation records |
| `teams` | Team definitions |
| `team_members` | Team membership and roles |

## R2 Buckets

### BUNDLES (Primary Storage)

Bundle file structure:
```
{appId}/{releaseId}/bundle.js      # Final bundle location
pending/{jobId}/bundle.js          # Temporary during processing
```

### BACKUP_BUCKET

Encrypted backup storage:
```
backups/d1/{timestamp}.sql.zst.enc   # D1 database backups
backups/r2/{timestamp}.manifest.json  # R2 file manifests
```

## KV Namespaces

### RATE_LIMIT

Keys stored:
```
sdk:{identifier}              # SDK rate limit counters
dashboard:{identifier}        # Dashboard rate limit counters
auth:{identifier}             # Auth rate limit counters
uploads:active:{userId}       # Concurrent upload slot tracking
github_token_cache:{id}       # GitHub installation token cache
```

## Queues (Priority-Based Upload System)

### Queue Architecture

Four priority queues based on subscription tier:

| Queue | Tier | Batch Size | Concurrency |
|-------|------|------------|-------------|
| `upload-queue-p0` | Enterprise | 10 | 5 |
| `upload-queue-p1` | Team | 5 | 3 |
| `upload-queue-p2` | Pro | 3 | 2 |
| `upload-queue-p3` | Free | 1 | 1 |
| `upload-queue-dlq` | Dead Letter | 1 | 1 |

### Queue Message Format

```typescript
interface UploadQueueMessage {
  jobId: string;
  appId: string;
  userId: string;
  payloadKey: string;  // R2 key for pending bundle
  version: string;
  channel: string;
}
```

### Queue Processing Flow

```
1. SDK calls POST /v1/uploads
   └─ Validates API key and checks concurrent limits
   └─ Acquires upload slot in KV

2. Job created in D1 (status='queued')
   └─ Bundle stored in R2: pending/{jobId}/bundle.js

3. Job enqueued to priority queue (P0-P3 based on tier)

4. Queue processor receives message (batch)
   ├─ Updates job status to 'processing'
   ├─ Moves bundle: pending/{jobId}/ → {appId}/{releaseId}/
   ├─ Parses modules into release_modules table
   ├─ Pre-computes delta patches (async)
   ├─ Creates release record
   └─ Updates job status to 'completed'

5. WebSocket broadcast to user's connections
   └─ Real-time progress in dashboard

6. On failure (after 3 retries) → moves to DLQ
   └─ DLQ processor marks job 'failed'
   └─ Releases upload slot
```

## Durable Objects

### UploadStatusDO

One instance per user (keyed by userId).

**Purpose**: Real-time WebSocket status updates

**Endpoints**:
- `/connect` - WebSocket connection (hibernation API)
- `/broadcast` - Called by queue processor to push updates
- `/health` - Returns active connection count

**Features**:
- Efficient connection management via hibernation
- Broadcasts job status changes to all user connections
- Auto-cleanup of stale connections

## Analytics Engine

**Dataset**: `bundlenudge_metrics`

Tracks:
- Request counts by endpoint
- Build completion metrics
- Error rates by type
- Latency percentiles

---

# SUBSCRIPTION TIER SYSTEM

## Plan Structure

Each subscription plan defines:

```typescript
interface SubscriptionPlan {
  id: string;
  name: string;
  concurrent_builds: number;      // iOS build concurrency
  concurrent_uploads: number;     // OTA upload slots
  monthly_build_limit: number;    // Monthly native build quota
  build_timeout_minutes: number;  // Max build duration
  queue_priority: 0 | 1 | 2 | 3;  // P0=highest, P3=lowest
  dedicated_nodes: boolean;       // Dedicated build infrastructure
  monthly_update_checks: number;  // SDK check-in quota
  max_bundle_size_mb: number;     // Bundle size limit
  features: string[];             // Feature flags array
}
```

## Tier Definitions

| Tier | Priority | Concurrent Uploads | Bundle Size | Monthly Builds |
|------|----------|-------------------|-------------|----------------|
| Free | P3 | 1 | 50 MB | 5 |
| Pro | P2 | 3 | 100 MB | 50 |
| Team | P1 | 5 | 200 MB | 200 |
| Enterprise | P0 | 10+ | 500 MB | Unlimited |

## Limit Resolution Hierarchy

When checking limits, the system resolves in order:

```
1. Check user_suspensions
   └─ If suspended → block ALL activity

2. Check user_limit_overrides (admin adjustments)
   └─ If exists → use override values

3. Check user_credits (bonus allocations)
   └─ Add to base limits

4. Check subscription plan
   └─ Use plan limits

5. Fall back to FREE_TIER_DEFAULTS
   └─ concurrentBuilds: 1
   └─ monthlyBuildLimit: 5
   └─ buildTimeoutMinutes: 30
   └─ queuePriority: 3
```

## Upload Slot Management

Implemented in `lib/upload-limits.ts`:

```typescript
// Acquiring a slot
async function acquireUploadSlot(userId: string): Promise<boolean> {
  const key = `uploads:active:${userId}`;
  const current = await kv.get(key);
  const limit = await getUserUploadLimit(userId);

  if (current >= limit) return false;

  // Optimistic locking with versioned writes
  await kv.put(key, current + 1, { expirationTtl: 3600 });
  return true;
}

// Releasing a slot
async function releaseUploadSlot(userId: string): Promise<void> {
  const key = `uploads:active:${userId}`;
  const current = await kv.get(key);
  await kv.put(key, Math.max(0, current - 1), { expirationTtl: 3600 });
}
```

---

# CRASH MONITORING & AUTO-ROLLBACK

## Crash Monitor (Scheduled: Every 5 minutes)

**File**: `lib/crash-monitor/index.ts`

### Process Flow

```
1. Query all active releases with auto_rollback_enabled=true

2. For each release:
   a. Count crash events from device_pings (event='crash')
   b. Count total sessions (unique devices)
   c. Calculate crash rate: crashes / sessions * 100

3. Check thresholds:
   - Minimum sessions required (statistical significance)
   - Crash rate vs crash_threshold_percent on release

4. If threshold exceeded:
   a. Update release status to 'rolled_back'
   b. Set channel's active_release_id to previous release
   c. Send Slack notification with crash details

5. Log all checks to analytics
```

### Crash Threshold Configuration

Per-release settings:
```typescript
interface ReleaseConfig {
  auto_rollback_enabled: boolean;
  crash_threshold_percent: number;  // Default: 5
  min_sessions_for_rollback: number; // Default: 100
  rollback_window_hours: number;    // Default: 24
}
```

## Health Check Monitoring

**File**: `lib/crash-monitor/health.ts`

### Privacy-First Design

- Healthy devices send NO network calls
- Only failures report to API
- Reduces bandwidth and respects user privacy

### Health Event Types

```typescript
type HealthEvent =
  | 'applied'     // Bundle successfully applied
  | 'crash'       // App crashed
  | 'health_ok'   // Custom health check passed
  | 'health_fail' // Custom health check failed
```

### Failure Tracking

`health_failures` table tracks:
- Device ID (hashed)
- Release ID
- Failure type
- Timestamp
- Error details (optional)

## Scheduled Release Activation

**Runs**: Every 5 minutes

```
1. Query releases where:
   - scheduled_at IS NOT NULL
   - scheduled_at <= NOW()
   - status = 'pending'

2. For each scheduled release:
   a. Update status to 'active'
   b. Set channel's active_release_id
   c. Log activation event
```

---

# GRADUAL ROLLOUTS & A/B TESTING

## Release Channels

Each app has multiple channels:
- `production` (default)
- `staging`
- `beta`
- Custom channels

Each channel has ONE active release at a time.

## Rollout Configuration

```typescript
interface ReleaseRollout {
  rollout_percentage: number;  // 0-100
  allowlist: string[];         // Device IDs to ALWAYS include
  blocklist: string[];         // Device IDs to ALWAYS exclude
  status: 'pending' | 'rolling' | 'complete' | 'rolled_back';
}
```

### Rollout Decision Flow

```
1. Check blocklist → if match, NO update
2. Check allowlist → if match, YES update
3. Check rollout_percentage:
   - Hash device ID to stable number 0-99
   - If hash < rollout_percentage → YES update
   - Else → NO update
```

## A/B Testing

### Database Schema

```sql
-- Flag on release
releases.is_ab_test = 1

-- Variants table
release_variants (
  id,
  release_id,
  name,           -- 'Control', 'Variant A', 'Variant B'
  bundle_key,     -- R2 key for this variant's bundle
  percentage,     -- Distribution percentage
  is_control      -- Boolean flag
)

-- Assignment tracking
device_variant_assignments (
  device_id,
  release_id,
  variant_id,
  assigned_at
)
```

### A/B Test Flow

```
1. Create A/B test release with variants
2. Each variant has percentage (must sum to 100)
3. Device requests update:
   a. Check existing assignment
   b. If none, assign based on percentages (sticky)
   c. Return variant's bundle
4. Track metrics per variant
5. Conclude test, promote winner to 100%
```

---

# NATIVE DEPENDENCY DETECTION

**File**: `lib/native-deps/index.ts`

## Two-Level Detection

### Level 1: Package.json Analysis

Compares previous and current `package.json`:
- Detects added native packages
- Detects removed native packages
- Detects version changes (major/minor)

```typescript
interface DependencyAnalysis {
  added: PackageChange[];
  removed: PackageChange[];
  updated: PackageChange[];
  hasNativeChanges: boolean;
}
```

### Level 2: Lock File Fingerprinting

Builds fingerprint from:
- `Podfile.lock` (iOS CocoaPods)
- `gradle.lockfile` (Android Gradle)
- `package-lock.json` / `yarn.lock` / `pnpm-lock.yaml`

Compares against previous release fingerprint.

### Safe Packages List

Known pure-JS packages bypass native checks:
```typescript
const SAFE_PACKAGES = [
  'lodash',
  'moment',
  'date-fns',
  'axios',
  // ... extensive list
];
```

### Detection Result

```typescript
interface NativeDepResult {
  allowed: boolean;
  requiresNativeBuild: boolean;
  fingerprint: NativeFingerprint;
  packageJsonAnalysis?: DependencyAnalysis;
  lockFileCheck: LockFileCheckResult;
  reason?: string;
}
```

---

# INTEGRATIONS

## GitHub App Integration

**File**: `routes/github-app.ts`

### Installation Flow

```
1. User clicks "Install GitHub App"
2. Redirect to GitHub: /github/install
3. User authorizes on GitHub
4. Callback: /github/callback?installation_id=XXX
5. Store in github_installations table
```

### Webhook Events Handled

| Event | Action |
|-------|--------|
| `installation.created` | Store installation record |
| `installation.deleted` | Mark installation deleted |
| `installation.suspend` | Set suspended_at timestamp |
| `installation.unsuspend` | Clear suspended_at |
| `installation_repositories` | Update repo list |
| `push` | Trigger OTA build if main/master |

### Security

- Webhook signature validation: `X-Hub-Signature-256`
- Token caching in KV with TTL
- Immediate cache invalidation on permission changes

## Crash Reporting Integrations

**File**: `lib/integrations/`

### Supported Providers

| Provider | Config Required |
|----------|-----------------|
| Sentry | DSN, optional auth token |
| Bugsnag | 32-char API key |
| Firebase Crashlytics | GCP Project ID, service account JSON |

### Security

- All configs encrypted with AES-256-GCM
- Secrets masked in API responses
- Provider factory pattern for extensibility

### API Endpoints

```
GET    /apps/:appId/integrations           # List all
POST   /apps/:appId/integrations           # Create
PATCH  /apps/:appId/integrations/:id       # Update
DELETE /apps/:appId/integrations/:id       # Delete
POST   /apps/:appId/integrations/:id/test  # Validate connection
```

---

# RATE LIMITING

**File**: `middleware/rateLimit.ts`

## Strategy: Fails CLOSED

If KV namespace unavailable, requests are REJECTED (security-first):

```typescript
if (!kv) {
  return c.json({ error: 'Service unavailable' }, 503);
}
```

## Endpoint Tiers

| Endpoint Type | Limit | Window |
|---------------|-------|--------|
| SDK_CHECK | 1000 req | 1 min |
| SDK_DOWNLOAD | 100 req | 1 min |
| DASHBOARD | 100 req | 1 min |
| AUTH | 10 req | 1 min |
| WEBHOOK | 50 req | 1 min |

## Algorithm: Sliding Window

```typescript
async function checkRateLimit(
  identifier: string,
  limit: number,
  windowMs: number
): Promise<{ allowed: boolean; remaining: number }> {
  const key = `${prefix}:${identifier}`;
  const current = await kv.get<number>(key) ?? 0;

  if (current >= limit) {
    return { allowed: false, remaining: 0 };
  }

  await kv.put(key, current + 1, {
    expirationTtl: Math.ceil(windowMs / 1000)
  });

  return { allowed: true, remaining: limit - current - 1 };
}
```

---

# BACKUP & DISASTER RECOVERY

## Scheduled Backups

| Schedule | Action |
|----------|--------|
| Every hour | D1 backup + R2 manifest |
| Midnight UTC | Prune backups older than 7 days |

## D1 Backup Process

**File**: `lib/backup-d1.ts`

```
1. Export database as SQL dump
2. Compress with zstd
3. Encrypt with AES-256-GCM (ENCRYPTION_KEY)
4. Upload to BACKUP_BUCKET: backups/d1/{timestamp}.sql.zst.enc
```

## R2 Manifest Backup

**File**: `lib/backup-r2.ts`

```
1. List all objects in BUNDLES bucket
2. Create manifest with:
   - File paths
   - Checksums (SHA-256)
   - File sizes
   - Creation timestamps
3. Store in BACKUP_BUCKET: backups/r2/{timestamp}.manifest.json
```

## Slack Notifications

Backup status sent to `SLACK_BACKUP_WEBHOOK`:
- Success/failure status
- Duration metrics
- D1 size, R2 file counts

---

# SECURITY

## Request Headers

Applied to all responses:
```
Content-Security-Policy: default-src 'self'
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
HSTS: max-age=31536000 (production only)
```

## CORS Policy

Whitelist (exact match only):
- Dashboard URLs (Vercel + custom domains)
- Localhost (dev only)
- SDK requests (no Origin header) allowed

## Request Size Limits

| Route Type | Max Size |
|------------|----------|
| Default | 5 MB |
| Upload routes | 100 MB |

## Data Encryption

| Data Type | Method |
|-----------|--------|
| API keys | bcrypt hash |
| Integration configs | AES-256-GCM |
| Backup files | AES-256-GCM |
| Bundle integrity | SHA-256 |

---

# SCHEDULED JOBS (Cron Triggers)

```toml
[triggers]
crons = ["*/5 * * * *", "0 * * * *"]
```

## Every 5 Minutes

1. **Activate scheduled releases**
   - Check `scheduled_at` timestamps
   - Update channel active releases

2. **Run crash monitor**
   - Check crash rates for active releases
   - Trigger auto-rollbacks if needed

3. **Clean up request logs**
   - Remove entries older than 7 days

## Every Hour

1. **D1 backup**
   - Export, compress, encrypt, upload

2. **R2 manifest backup**
   - Create file manifest for recovery

3. **At midnight UTC: Prune old backups**
   - Keep only last 7 days

---

# PACKAGE STRUCTURE

## @bundlenudge/api

```
packages/api/src/
├── index.ts                    # Main Hono app, cron handlers
├── types.ts                    # Env bindings, type definitions
├── routes/
│   ├── apps.ts                 # App CRUD
│   ├── releases.ts             # Release management
│   ├── updates.ts              # SDK update checks
│   ├── uploads.ts              # Upload initiation
│   ├── devices.ts              # Device management
│   ├── metrics.ts              # Analytics endpoints
│   ├── github-app.ts           # GitHub integration
│   ├── subscriptions/
│   │   ├── plans.ts            # Plan definitions
│   │   ├── limits.ts           # Limit resolution
│   │   └── billing.ts          # Stripe integration
│   └── admin/                  # Admin endpoints
├── middleware/
│   ├── auth.ts                 # JWT + API key auth
│   ├── rateLimit.ts            # Rate limiting
│   ├── cors.ts                 # CORS handling
│   └── metrics.ts              # Request metrics
├── lib/
│   ├── upload-limits.ts        # Concurrent upload slots
│   ├── crash-monitor/          # Crash detection
│   ├── native-deps/            # Native dependency detection
│   ├── integrations/           # Sentry/Bugsnag/Crashlytics
│   ├── backup-d1.ts            # Database backups
│   └── backup-r2.ts            # Storage backups
├── queue-handlers/
│   └── upload-processor.ts     # Queue batch handler
├── durable-objects/
│   └── UploadStatusDO.ts       # WebSocket state
└── scheduled/
    └── index.ts                # Cron job handlers
```

## @bundlenudge/sdk

```
packages/sdk/src/
├── index.ts                    # Public API exports
├── bundlenudge.ts              # Main class
├── updater.ts                  # Update check/download
├── storage.ts                  # Local bundle storage
├── rollback.ts                 # Crash detection, rollback
├── health.ts                   # Health monitoring
├── metrics.ts                  # Usage tracking
├── types.ts                    # SDK types
└── internal/
    ├── patcher.ts              # Delta patch application
    └── parser.ts               # Bundle parsing
```

## @bundlenudge/shared

```
packages/shared/src/
├── types.ts                    # API types
├── schemas.ts                  # Zod schemas
└── constants.ts                # Shared constants
```

## dashboard

```
packages/dashboard/src/
├── app/
│   ├── (main)/                 # Authenticated routes
│   │   ├── dashboard/
│   │   ├── apps/
│   │   ├── releases/
│   │   └── settings/
│   ├── (auth)/                 # Auth routes
│   └── api/                    # API routes
├── components/
│   ├── ui/                     # Shadcn primitives
│   ├── apps/                   # App components
│   ├── releases/               # Release components
│   └── shared/                 # Shared components
├── hooks/                      # React hooks
├── lib/
│   ├── api/                    # API client
│   └── utils.ts                # Utilities
└── providers/                  # Context providers
```

---

# DATA FLOWS

## Upload Flow (Complete)

```
┌──────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│   SDK    │────▶│  API    │────▶│  Queue  │────▶│Processor│
└──────────┘     └─────────┘     └─────────┘     └─────────┘
     │                │                               │
     │                ▼                               ▼
     │          ┌─────────┐                     ┌─────────┐
     │          │   D1    │◄────────────────────│  D1/R2  │
     │          │(job rec)│                     │(release)│
     │          └─────────┘                     └─────────┘
     │                │                               │
     │                ▼                               │
     │          ┌─────────┐                           │
     │          │   R2    │                           │
     │          │(pending)│                           │
     │          └─────────┘                           │
     │                                                │
     │          ┌─────────┐                           │
     └─────────▶│Dashboard│◄───WebSocket─────────────┘
                │  (UI)   │
                └─────────┘
```

## Update Check Flow

```
┌──────────┐     ┌─────────┐     ┌─────────┐
│   SDK    │────▶│  API    │────▶│   D1    │
│(device)  │     │/updates │     │(release)│
└──────────┘     └─────────┘     └─────────┘
     │                │
     │                ▼
     │          ┌─────────┐
     │          │  Logic  │
     │          │-rollout │
     │          │-a/b test│
     │          │-blocklist│
     │          └─────────┘
     │                │
     │                ▼
     │          ┌─────────┐
     └─────────▶│   R2    │
   (download)   │(bundle) │
                └─────────┘
```

## Crash Monitor Flow

```
┌──────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│  Cron    │────▶│ Monitor │────▶│   D1    │────▶│ Rollback│
│(5 min)   │     │ (check) │     │ (pings) │     │ (action)│
└──────────┘     └─────────┘     └─────────┘     └─────────┘
                      │                               │
                      ▼                               ▼
                ┌─────────┐                     ┌─────────┐
                │Analytics│                     │  Slack  │
                │ (log)   │                     │ (alert) │
                └─────────┘                     └─────────┘
```

---

# ENVIRONMENT VARIABLES

## Required

| Variable | Purpose |
|----------|---------|
| `JWT_SECRET` | JWT signing key |
| `ENCRYPTION_KEY` | AES-256-GCM key for secrets |
| `GITHUB_APP_ID` | GitHub App ID |
| `GITHUB_APP_PRIVATE_KEY` | GitHub App private key |
| `GITHUB_CLIENT_ID` | OAuth client ID |
| `GITHUB_CLIENT_SECRET` | OAuth client secret |
| `GITHUB_WEBHOOK_SECRET` | Webhook signature validation |
| `STRIPE_SECRET_KEY` | Stripe API key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook validation |
| `RESEND_API_KEY` | Email service API key |
| `SLACK_BACKUP_WEBHOOK` | Backup notifications |
| `SLACK_ALERT_WEBHOOK` | Crash/error alerts |

## Cloudflare Bindings

| Binding | Type | Purpose |
|---------|------|---------|
| `DB` | D1 | Primary database |
| `BUNDLES` | R2 | Bundle storage |
| `BACKUP_BUCKET` | R2 | Encrypted backups |
| `RATE_LIMIT` | KV | Rate limiting |
| `ANALYTICS` | Analytics Engine | Metrics |
| `UPLOAD_STATUS` | Durable Object | WebSocket state |

---

# DECISION RECORDS

## ADR-001: Cloudflare Workers for API

**Decision**: Use Cloudflare Workers with Hono framework

**Rationale**:
- Global edge deployment (low latency worldwide)
- D1 for SQLite database (simple, fast)
- R2 for bundle storage (S3-compatible, no egress fees)
- KV for rate limiting (fast key-value)
- Queues for async processing (native integration)
- Durable Objects for WebSocket state

**Trade-offs**:
- 1MB worker size limit (requires code splitting)
- No long-running processes (use queues)
- Cold start considerations (hibernation helps)

## ADR-002: Priority Queues for Uploads

**Decision**: Separate queues per subscription tier (P0-P3)

**Rationale**:
- Enterprise customers get priority processing
- Prevents free tier from impacting paid users
- Natural backpressure per tier
- Easy to adjust concurrency per tier

**Trade-offs**:
- More complex queue management
- Requires tier detection at enqueue time

## ADR-003: Privacy-First Health Monitoring

**Decision**: Healthy devices send NO network calls

**Rationale**:
- Respects user privacy
- Reduces bandwidth costs
- Only failures need investigation
- Opt-in detailed reporting

**Trade-offs**:
- Can't track "healthy" metrics directly
- Must infer health from absence of failures

## ADR-004: BSL 1.1 License

**Decision**: Business Source License with 5-year conversion

**Rationale**:
- Allows free self-hosting
- Prevents direct competition
- Converts to Apache 2.0 in 2030
- Balances openness with business sustainability

**Trade-offs**:
- Some users may avoid non-OSI licenses
- Requires clear communication of terms
