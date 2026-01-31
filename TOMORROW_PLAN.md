# Tomorrow's Plan - Launch Readiness Phase 2

## Summary of Today's Accomplishments

### Backup System (3-Tier) ✅

| Tier | Storage | Retention | Status |
|------|---------|-----------|--------|
| Hot | Cloudflare R2 + D1 Time Travel | Real-time | ✅ |
| Warm | Railway S3 | 30 days (hourly) | ✅ |
| Cold | Backblaze B2 | 5 years (weekly) | ✅ |

### CI Pipeline ✅

- Build shared packages first
- Security audit (`pnpm audit`)
- Coverage reporting with 80% threshold
- Slack notifications (start, success, failure)

### Load Testing Infrastructure (k6) ✅

- Smoke, Load, Stress, Soak tests
- Endpoints: `/updates/check`, `/bundles/download`, `/devices/register`

### E2E Testing (Playwright) ✅

- Auth flows, app management, API keys

### GitHub Secrets Configured ✅

All backup secrets configured in GitHub.

---

## Tomorrow's Phases

### Phase 1: Parallelize CI (30 min)

**Goal:** Cut CI time by running independent jobs in parallel

```yaml
jobs:
  setup:
    # Install deps, build shared packages, cache

  lint:
    needs: [setup]
    # Parallel

  typecheck:
    needs: [setup]
    # Parallel

  test:
    needs: [setup]
    # Parallel

  security:
    needs: [setup]
    # Parallel

  notify:
    needs: [lint, typecheck, test, security]
    if: always()
    # Aggregate results
```

**Checklist:**
- [ ] Split CI into parallel jobs
- [ ] Add job-level caching
- [ ] Aggregate Slack notification
- [ ] Test with PR

---

### Phase 2: R2 Hourly Backup (20 min)

**Goal:** 1-hour RPO for bundles instead of 24 hours

**Schedule:**
- Hourly: Incremental sync (`rclone copy --update`)
- Daily: Full verification (`rclone check`)
- Weekly: Archive to B2

**Checklist:**
- [ ] Add hourly R2 sync to backup.yml
- [ ] Add daily verification step
- [ ] Update Slack notifications for R2

---

### Phase 3: Staging Environment (1-2 hours)

**Goal:** Safe, isolated environment for load/E2E testing

#### Cloudflare Staging Resources

| Resource | Production | Staging |
|----------|------------|---------|
| Worker | `bundlenudge-api` | `bundlenudge-api-staging` |
| D1 | `bundlenudge-prod-db` | `bundlenudge-staging-db` |
| R2 | `bundlenudge-prod-bundles` | `bundlenudge-staging-bundles` |

#### Commands

```bash
# Create D1 staging database
wrangler d1 create bundlenudge-staging-db

# Create R2 staging bucket
wrangler r2 bucket create bundlenudge-staging-bundles

# Deploy staging
wrangler deploy --env staging
```

#### wrangler.toml Addition

```toml
[env.staging]
name = "bundlenudge-api-staging"
d1_databases = [
  { binding = "DB", database_name = "bundlenudge-staging-db", database_id = "xxx" }
]
r2_buckets = [
  { binding = "BUNDLES", bucket_name = "bundlenudge-staging-bundles" }
]
```

**Checklist:**
- [ ] Create D1 staging database
- [ ] Create R2 staging bucket
- [ ] Update wrangler.toml with staging env
- [ ] Deploy API to staging
- [ ] Verify staging API works
- [ ] Deploy build worker to Railway staging (if applicable)

---

### Phase 4: Enhanced k6 Tests (1 hour)

**Goal:** Aggressive load testing against staging

#### Updated Thresholds (Realistic for OTA with encryption)

| Metric | Pass | Warning | Fail |
|--------|------|---------|------|
| p95 | < 800ms | < 1500ms | > 2000ms |
| p99 | < 1500ms | < 3000ms | > 5000ms |
| Error rate | < 0.01% | < 0.1% | > 0.5% |
| Soak p99 drift | < 15% | < 30% | > 50% |

#### Per-Endpoint Thresholds

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

#### New Test Files

```
testing/k6/
├── scenarios/
│   ├── spike.js       # Sudden traffic burst
│   └── breakpoint.js  # Find system limits
└── utils/
    └── memory-check.js # Detect p99 drift in soak
```

**Checklist:**
- [ ] Update thresholds in config.js
- [ ] Add spike test scenario
- [ ] Add breakpoint test scenario
- [ ] Add memory leak detection to soak test
- [ ] Update load-test.yml with new scenarios
- [ ] Point all tests at staging URL

---

### Phase 5: Seed Staging Data (30 min)

**Goal:** Test data in staging for realistic tests

#### Seed Script

```bash
pnpm run seed:staging
```

Creates:
- Test app (`test-app-001`)
- Test release with bundle
- Test API key
- Test user account (for E2E)

**Checklist:**
- [ ] Create seed script
- [ ] Run against staging
- [ ] Verify test data exists
- [ ] Add GitHub secrets for E2E tests

---

### Phase 6: Build Worker Review (1-2 hours)

**Goal:** Ensure build worker architecture is solid

#### Build Worker Architecture

```
Developer → GitHub Push → Build Worker (Railway) → R2 + D1
                              │
                              ├── Metro Bundler
                              ├── Hermes Compiler
                              ├── Bundle Signing
                              └── Hash Calculation
```

**Why Railway (not Cloudflare Workers):**
- Metro needs minutes of CPU (Workers: 10-50ms limit)
- Metro needs GBs of memory (Workers: 128MB limit)
- Metro needs Node.js APIs (Workers: V8 isolates only)
- Metro needs file system access (Workers: none)

**Checklist:**
- [ ] Review worker/builder package code
- [ ] Verify Railway deployment config
- [ ] Test build flow end-to-end
- [ ] Add build status to Slack notifications
- [ ] Consider build queue for concurrent builds

---

### Phase 7: Validate Everything (30 min)

**Test Matrix:**

| Test | Production | Staging |
|------|------------|---------|
| Health check (1 req/min) | ✅ | ✅ |
| k6 Smoke (10 VUs) | ❌ | ✅ |
| k6 Load (200 VUs) | ❌ | ✅ |
| k6 Stress (1000 VUs) | ❌ | ✅ |
| k6 Soak (8 hours) | ❌ | ✅ |
| k6 Spike | ❌ | ✅ |
| k6 Breakpoint | ❌ | ✅ |
| E2E Tests | ❌ | ✅ |

**Validation Commands:**

```bash
# CI parallel test
# (Push to PR and verify faster completion)

# k6 smoke
gh workflow run load-test.yml -f test_type=smoke

# k6 load
gh workflow run load-test.yml -f test_type=load

# E2E
gh workflow run e2e.yml

# Backup (already running)
# Check Slack for notifications
```

**Checklist:**
- [ ] Run k6 smoke test against staging
- [ ] Run k6 load test against staging
- [ ] Run E2E tests against staging
- [ ] Verify all Slack notifications working
- [ ] Confirm production is untouched by tests
- [ ] Document breakpoint results

---

## New GitHub Secrets Needed

| Secret | Purpose | Value |
|--------|---------|-------|
| `DASHBOARD_URL` | E2E tests | `https://staging.bundlenudge.com` |
| `E2E_TEST_EMAIL` | E2E test account | (create test account) |
| `E2E_TEST_PASSWORD` | E2E test account | (secure password) |
| `API_BASE_URL` | k6 tests | `https://bundlenudge-api-staging.xxx.workers.dev` |
| `LOAD_TEST_API_KEY` | k6 authentication | (staging API key) |
| `LOAD_TEST_APP_ID` | k6 test data | (from seed script) |
| `LOAD_TEST_RELEASE_ID` | k6 test data | (from seed script) |

---

## File Changes Summary

```
.github/workflows/
├── ci.yml            # Parallelize jobs
├── backup.yml        # Add R2 hourly sync
├── load-test.yml     # Updated thresholds, new scenarios
└── e2e.yml           # (unchanged)

packages/api/
└── wrangler.toml     # Add staging environment

testing/k6/
├── config.js         # Updated thresholds
├── scenarios/
│   ├── spike.js      # NEW
│   └── breakpoint.js # NEW
└── utils/
    └── memory-check.js # NEW

scripts/
└── seed-staging.ts   # NEW - seed staging data
```

---

## Score Projection

| Category | Before | After Today | After Tomorrow |
|----------|--------|-------------|----------------|
| Backup system | 60% | 95% | 98% |
| CI/CD | 50% | 75% | 95% |
| Testing | 40% | 70% | 95% |
| Observability | 30% | 70% | 90% |
| Build pipeline | 70% | 70% | 85% |
| **Overall** | **~50%** | **~76%** | **~93%** |

After tomorrow + polish = **95+ launch ready**

---

## Questions to Answer Tomorrow

1. Is the build worker already deployed on Railway?
2. Build trigger method: CLI / GitHub Action / Dashboard / All?
3. Need build queue for concurrent builds?
4. What's the staging dashboard URL (or use preview deployments)?
