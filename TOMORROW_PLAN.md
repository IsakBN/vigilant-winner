# Tomorrow's Plan - Launch Readiness Phase 2

## Quick Summary: Today's Accomplishments

- ✅ 3-Tier Backup System (R2 → Railway S3 → Backblaze B2)
- ✅ CI Pipeline (coverage, security, Slack notifications)
- ✅ k6 Load Tests (smoke, load, stress, soak)
- ✅ Playwright E2E Tests (auth, app management, API keys)
- ✅ All backup secrets configured

---

## Tomorrow's Phases

### Phase 1: Parallelize CI (30 min)

Split CI into parallel jobs for faster feedback.

```
                    ┌─→ Lint ─────────────────┐
Install + Build ───┼─→ Typecheck ────────────┼─→ Notify
                    ├─→ Test + Coverage ──────┤
                    └─→ Security Audit ───────┘
```

**Checklist:**
- [ ] Split CI into parallel jobs
- [ ] Add job-level caching
- [ ] Aggregate Slack notification
- [ ] Test with PR

---

### Phase 2: R2 Hourly Backup (20 min)

Change from daily to hourly sync for 1-hour RPO.

**Schedule:**
- Hourly: Incremental sync (`rclone copy --update`)
- Daily: Full verification (`rclone check`)
- Weekly: Archive to B2

**Checklist:**
- [ ] Add hourly R2 sync to backup.yml
- [ ] Add daily verification step
- [ ] Update Slack notifications

---

### Phase 3: Staging Environment (1-2 hours)

Safe, isolated environment for load/E2E testing.

| Resource | Production | Staging |
|----------|------------|---------|
| Worker | `bundlenudge-api` | `bundlenudge-api-staging` |
| D1 | `bundlenudge-prod-db` | `bundlenudge-staging-db` |
| R2 | `bundlenudge-prod-bundles` | `bundlenudge-staging-bundles` |

**Commands:**
```bash
wrangler d1 create bundlenudge-staging-db
wrangler r2 bucket create bundlenudge-staging-bundles
wrangler deploy --env staging
```

**Checklist:**
- [ ] Create D1 staging database
- [ ] Create R2 staging bucket
- [ ] Update wrangler.toml with staging env
- [ ] Deploy API to staging
- [ ] Verify staging API works

---

### Phase 4: Enhanced k6 Tests (1 hour)

Realistic thresholds for OTA system with encryption.

#### Thresholds

| Metric | Pass | Warning | Fail |
|--------|------|---------|------|
| p95 | < 800ms | < 1500ms | > 2000ms |
| p99 | < 1500ms | < 3000ms | > 5000ms |
| Error rate | < 0.01% | < 0.1% | > 0.5% |
| Soak p99 drift | < 15% | < 30% | > 50% |

#### Per-Endpoint

| Endpoint | p95 Pass | p99 Pass |
|----------|----------|----------|
| `/updates/check` | < 500ms | < 1000ms |
| `/bundles/download` | < 2000ms | < 5000ms |
| `/devices/register` | < 1000ms | < 2000ms |

#### Test Scenarios

| Test | VUs | Duration | Trigger |
|------|-----|----------|---------|
| Smoke | 10 | 1 min | Every merge |
| Load | 200 | 10 min | Weekly |
| Stress | 1000 | 5 min | Manual |
| Soak | 100 | 8 hours | Manual |
| Spike | 0→1000→0 | 10 min | Manual |
| Breakpoint | Ramp to failure | ~10 min | Manual |

**Checklist:**
- [ ] Update thresholds in config.js
- [ ] Add spike test scenario
- [ ] Add breakpoint test scenario
- [ ] Add memory leak detection to soak
- [ ] Point all tests at staging URL

---

### Phase 5: Seed Staging Data (30 min)

Create test fixtures for realistic testing.

```bash
pnpm run seed:staging
```

**Creates:**
- Test app (`test-app-001`)
- Test release with bundle
- Test API key
- Test user account

**Checklist:**
- [ ] Create seed script
- [ ] Run against staging
- [ ] Verify test data exists
- [ ] Add GitHub secrets for tests

---

### Phase 6: Build Worker System (2-3 hours)

This is the big one. Complete build worker with queues, tiers, and safeguards.

#### Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           BUILD SYSTEM                                       │
└─────────────────────────────────────────────────────────────────────────────┘

  Dashboard/CLI                API (Cloudflare Worker)
       │                              │
       │  POST /builds                │
       ▼                              ▼
  ┌─────────┐                  ┌─────────────┐
  │ Request │────────────────▶ │ Validate    │
  │  Build  │                  │ • Auth      │
  └─────────┘                  │ • Tier      │
                               │ • Limits    │
                               │ • Abuse     │
                               └──────┬──────┘
                                      │
                                      ▼
                        ┌─────────────────────────┐
                        │   Railway Redis         │
                        │                         │
                        │  Priority Queues:       │
                        │  ├── P0: Enterprise     │
                        │  ├── P1: Pro            │
                        │  ├── P2: Starter        │
                        │  └── P3: Free           │
                        │                         │
                        │  Fairness: Process 1    │
                        │  lower-priority every   │
                        │  N high-priority jobs   │
                        └───────────┬─────────────┘
                                    │
                                    ▼
                        ┌─────────────────────────┐
                        │   Build Worker          │
                        │   (Railway)             │
                        │                         │
                        │   • Scale-to-zero       │
                        │   • Admin heat-up btn   │
                        │   • Metro bundler       │
                        │   • Hermes compiler     │
                        │   • Disk cleanup        │
                        └───────────┬─────────────┘
                                    │
                                    ▼
                        ┌─────────────────────────┐
                        │   Storage               │
                        │                         │
                        │   R2 Public: Bundles    │
                        │   R2 Private: Sourcemaps│
                        │   D1: Metadata + Usage  │
                        └─────────────────────────┘
```

#### Subscription Tiers

| Tier | Queue | Timeout | Max Timeout | Builds/Mo | Concurrent | Bundle Size |
|------|-------|---------|-------------|-----------|------------|-------------|
| Free | P3 | 5 min | 5 min | 10 | 1 | 10 MB |
| Starter | P2 | 10 min | 20 min | 100 | 1 | 50 MB |
| Pro | P1 | 15 min | 25 min | 500 | 2 | 100 MB |
| Enterprise | P0 | 30 min | 30 min | Unlimited | 5 | Custom* |

*Enterprise bundle size configurable per-account in admin portal.

#### Add-Ons (Build Time, Not Count)

| Add-On | Price | Effect |
|--------|-------|--------|
| +5 min timeout | $5/month | Recurring |
| +10 min timeout | $9 one-time | Permanent |

**Ceiling:** Cannot exceed tier's max timeout.

#### Build Features

| Feature | Included |
|---------|----------|
| Metro bundler | ✅ Always |
| Hermes compilation | ✅ Always (30-60s extra, worth it) |
| Sourcemaps | ✅ Always (private bucket, signed URLs) |
| Source code persistence | ❌ Never (tmpfs, cleaned after build) |

#### Queue Fairness

Prevent starvation of lower tiers:

```
Processing order:
P0 → P0 → P0 → P1 → P0 → P0 → P2 → P0 → P0 → P3 → repeat
```

Every 3 high-priority jobs, process 1 from next tier down.

#### Abuse Detection (Multi-Signal, GDPR Compliant)

```
Abuse Score = weighted combination of:
├── Same bundle hash from N accounts     (+30 if N > 3)
├── Same IP address                      (+20)
├── Similar app names                    (+10)
├── Accounts created same day            (+15)
├── Builds submitted within minutes      (+10)
└── Total score

Flag for review if score > 50
Auto-block if score > 80 (after pattern confirmed)
```

**GDPR compliance:**
- Bundle hash = not PII
- IP logged for security (legitimate interest)
- Human review before blocking
- Documented in ToS

#### Sourcemap Security

```
┌─────────────────────────────────────────┐
│ R2 Private Bucket: sourcemaps           │
│                                         │
│ Access: Signed URLs only                │
│ Scope: User can only access own maps    │
│ Expiry: 1 hour                          │
│ Integration: Sentry, Bugsnag via token  │
└─────────────────────────────────────────┘
```

#### Admin Portal Features

- [ ] Heat-up workers button (for peak hours)
- [ ] Per-account Enterprise limits
- [ ] Abuse flags review queue
- [ ] Build queue depth monitor
- [ ] Worker health status

#### Worker Safeguards

| Safeguard | Implementation |
|-----------|----------------|
| Disk cleanup | Delete source + node_modules after each build |
| Timeout enforcement | Kill Metro process if exceeded |
| Build cancellation | Handle gracefully, cleanup resources |
| Source code security | tmpfs only, never persist, document in ToS |
| Cold start UX | Show "Worker starting..." status |

#### Database Schema

```sql
-- Build jobs
CREATE TABLE builds (
  id TEXT PRIMARY KEY,
  app_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  tier TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued',
  source TEXT NOT NULL,  -- 'github' | 'upload'
  source_ref TEXT NOT NULL,
  platform TEXT NOT NULL,

  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  started_at INTEGER,
  completed_at INTEGER,

  bundle_url TEXT,
  bundle_hash TEXT,
  sourcemap_url TEXT,  -- Private, signed access only
  bundle_size INTEGER,
  duration_ms INTEGER,
  error TEXT,

  worker_id TEXT,
  timeout_ms INTEGER NOT NULL
);

-- Usage tracking
CREATE TABLE build_usage (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  month TEXT NOT NULL,
  builds_used INTEGER NOT NULL DEFAULT 0,
  builds_limit INTEGER NOT NULL,
  timeout_add_on_minutes INTEGER NOT NULL DEFAULT 0,
  UNIQUE(user_id, month)
);

-- Abuse tracking
CREATE TABLE abuse_signals (
  id TEXT PRIMARY KEY,
  bundle_hash TEXT NOT NULL,
  user_id TEXT NOT NULL,
  ip_address TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),

  INDEX idx_bundle_hash (bundle_hash),
  INDEX idx_ip (ip_address)
);

-- Enterprise overrides
CREATE TABLE enterprise_limits (
  account_id TEXT PRIMARY KEY,
  max_bundle_size_mb INTEGER,
  max_timeout_minutes INTEGER,
  max_concurrent_builds INTEGER,
  custom_notes TEXT
);
```

#### Implementation Checklist

**Core Queue System:**
- [ ] Set up Railway Redis
- [ ] Create queue management functions
- [ ] Implement priority queue logic
- [ ] Add fairness mechanism
- [ ] Create build submission endpoint
- [ ] Create build status endpoint
- [ ] Add usage tracking

**Build Worker:**
- [ ] Create Railway service
- [ ] Implement job polling
- [ ] Integrate Metro bundler
- [ ] Integrate Hermes compiler
- [ ] Implement R2 upload (bundles)
- [ ] Implement R2 private upload (sourcemaps)
- [ ] Add signed URL generation
- [ ] Add timeout handling
- [ ] Add disk cleanup
- [ ] Add cancellation handling

**Tier Enforcement:**
- [ ] Queue routing by tier
- [ ] Build limit checks
- [ ] Timeout per tier
- [ ] Concurrent build limits
- [ ] Bundle size limits

**Admin Portal:**
- [ ] Heat-up workers button
- [ ] Enterprise limits config per account
- [ ] Abuse flags review
- [ ] Queue depth monitor

**Abuse Detection:**
- [ ] Bundle hash tracking
- [ ] Multi-signal scoring
- [ ] Flag for review system
- [ ] Admin review queue

**Documentation:**
- [ ] Document source code handling in ToS
- [ ] Document abuse detection in ToS
- [ ] Security practices page

---

### Phase 7: Validate Everything (30 min)

**Test Matrix:**

| Test | Production | Staging |
|------|------------|---------|
| Health check | ✅ | ✅ |
| k6 Smoke | ❌ | ✅ |
| k6 Load | ❌ | ✅ |
| k6 Stress | ❌ | ✅ |
| k6 Soak | ❌ | ✅ |
| E2E Tests | ❌ | ✅ |
| Build flow | ❌ | ✅ |

**Validation:**
- [ ] Run k6 smoke against staging
- [ ] Run k6 load against staging
- [ ] Run E2E against staging
- [ ] Test full build flow
- [ ] Verify Slack notifications
- [ ] Confirm production untouched

---

## New GitHub Secrets Needed

| Secret | Purpose |
|--------|---------|
| `DASHBOARD_URL` | E2E tests |
| `E2E_TEST_EMAIL` | E2E test account |
| `E2E_TEST_PASSWORD` | E2E test account |
| `API_BASE_URL` | k6 tests (staging URL) |
| `LOAD_TEST_API_KEY` | k6 authentication |
| `REDIS_URL` | Build queue (Railway Redis) |

---

## Cost Summary

### Build Worker

| Usage | Builds/Month | Worker Cost | Redis | Total |
|-------|--------------|-------------|-------|-------|
| Low | 500 | ~$7 | ~$0 | ~$7 |
| Medium | 2,000 | ~$28 | ~$10 | ~$38 |
| High | 10,000 | ~$140 | ~$25 | ~$165 |

### Per-Build Cost

| App Size | Time | Cost |
|----------|------|------|
| Small | 2 min | $0.004 |
| Medium | 5 min | $0.014 |
| Large | 10 min | $0.055 |

**Well within $20 tier for early stage.**

---

## File Changes Summary

```
.github/workflows/
├── ci.yml              # Parallelize
├── backup.yml          # R2 hourly
└── load-test.yml       # Updated thresholds

packages/api/
├── wrangler.toml       # Staging env
└── src/routes/builds/  # NEW - build endpoints

packages/worker/        # Build worker
├── src/
│   ├── index.ts        # Main worker loop
│   ├── queue.ts        # Redis queue management
│   ├── metro.ts        # Metro bundler integration
│   ├── hermes.ts       # Hermes compilation
│   ├── upload.ts       # R2 upload
│   └── abuse.ts        # Abuse detection
└── Dockerfile          # Railway deployment

packages/admin-dashboard/
└── src/
    ├── workers/        # Heat-up controls
    ├── enterprise/     # Per-account limits
    └── abuse/          # Review queue

testing/k6/
├── config.js           # Updated thresholds
└── scenarios/
    ├── spike.js        # NEW
    └── breakpoint.js   # NEW

scripts/
└── seed-staging.ts     # Staging data
```

---

## Score Projection

| Category | Before | After Phase 1-5 | After Phase 6-7 |
|----------|--------|-----------------|-----------------|
| Backup | 95% | 98% | 98% |
| CI/CD | 75% | 95% | 95% |
| Testing | 70% | 90% | 95% |
| Observability | 70% | 85% | 90% |
| Build Pipeline | 0% | 0% | 90% |
| **Overall** | **~62%** | **~74%** | **~94%** |

---

## Priority Order

If time is limited:

1. **Phase 6** - Build worker (most critical missing piece)
2. **Phase 3** - Staging environment (needed for safe testing)
3. **Phase 1** - Parallel CI (quick win)
4. **Phase 4** - k6 thresholds (quick config change)
5. **Phase 2** - R2 hourly (nice to have)
6. **Phase 5 & 7** - Seeding and validation
