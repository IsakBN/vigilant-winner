# Critical Features - One Billion Percent Confidence Required

These features MUST work perfectly. A bug here could crash every user's app or cause data loss.

## Confidence Levels

| Level | Meaning | Test Coverage | Review |
|-------|---------|---------------|--------|
| 10/10 | Cannot fail - crashes user app | 100% + fuzzing + chaos testing | 3 reviewers |
| 8/10 | Very important - bad UX if fails | 95% coverage | 2 reviewers |
| 6/10 | Important - degraded experience | 80% coverage | 1 reviewer |
| 4/10 | Nice to have - fallback exists | 60% coverage | Self-review |

---

## CRITICAL FEATURE 1: Rollback (10/10 Required)

### What It Does
When a pushed update crashes the app, automatically revert to the previous working version.

### Why It's Critical
If rollback fails, users are stuck in a crash loop. They have to:
1. Manually delete and reinstall the app
2. Lose all local data
3. Write bad App Store reviews
4. Never trust the app again

### How It Works (from codepush)
```
1. App starts → RollbackManager.create() runs
2. Checks last crash time from storage
3. If crash within window (60s) → increment crash count
4. If crash count >= threshold (3) → trigger rollback
5. Rollback = set previous version as current
6. On success: app restarts with old bundle
7. On next boot: report rollback to API
```

### Edge Cases That MUST Work
| Edge Case | Expected Behavior | Test Required |
|-----------|-------------------|---------------|
| First install (no previous version) | Don't crash, use embedded bundle | Yes |
| Storage corrupted | Graceful fallback to embedded | Yes |
| Crash during rollback itself | Embedded bundle wins | Yes |
| Network down during report | Queue and retry later | Yes |
| 3 crashes in 59 seconds | Don't rollback (outside window) | Yes |
| 3 crashes in 61 seconds | DO rollback | Yes |
| App manually killed (not crash) | Don't count as crash | Yes |
| Low memory kill | Don't count as crash | Yes |

### Test Requirements
- [ ] Unit tests for every method in RollbackManager
- [ ] Integration test: simulate 3 crashes → verify rollback
- [ ] Integration test: 2 crashes then success → no rollback
- [ ] Fuzz test: random crash patterns
- [ ] Manual test on real iOS device
- [ ] Manual test on real Android device
- [ ] Test with Sentry/Crashlytics integration
- [ ] Test storage corruption scenarios

### Code Patterns Required
```typescript
// MUST handle every error
try {
  await storage.rollbackToPrevious()
} catch (error) {
  // NEVER throw from rollback - just log and use embedded
  logger.error('Rollback failed, using embedded bundle', { error })
  return null // null = use embedded bundle
}
```

---

## CRITICAL FEATURE 2: Bundle Integrity Verification (10/10 Required)

### What It Does
Verify that downloaded bundles match their SHA256 hash before applying.

### Why It's Critical
A corrupted bundle could:
1. Crash the app immediately
2. Cause subtle bugs (partial execution)
3. Be a security vulnerability (MITM attack)

### How It Works
```
1. Server provides hash: "sha256:abc123..."
2. SDK downloads bundle
3. SDK computes SHA256 of downloaded content
4. If hash matches → save and apply
5. If hash mismatch → reject, retry, or rollback
```

### Edge Cases That MUST Work
| Edge Case | Expected Behavior | Test Required |
|-----------|-------------------|---------------|
| Hash mismatch | Reject bundle, don't apply | Yes |
| Invalid hash format | Reject immediately | Yes |
| Empty bundle | Reject (hash won't match) | Yes |
| Partial download | Hash won't match, reject | Yes |
| Network timeout mid-download | Resume with Range header | Yes |
| CDN returns old cached version | Hash won't match, retry | Yes |

### Test Requirements
- [ ] Unit test: valid hash passes
- [ ] Unit test: invalid hash rejects
- [ ] Unit test: malformed hash format rejects
- [ ] Integration: download with intentional corruption
- [ ] Fuzz: random byte modifications
- [ ] Security: MITM simulation test

---

## CRITICAL FEATURE 3: Storage Operations (10/10 Required)

### What It Does
Atomically save bundles to device storage so power loss doesn't corrupt state.

### Why It's Critical
If storage is corrupted:
1. App can't find any bundle
2. App might load partial bundle → crash
3. User data (settings, tokens) might be lost

### How It Works (Atomic Write Pattern)
```
1. Write to temporary file: bundle_temp_123.js
2. Verify write succeeded (check file exists, size matches)
3. Atomic rename: bundle_temp_123.js → bundle_v1.2.3.js
4. Only then update metadata to point to new file
5. Delete old bundle after successful apply
```

### Edge Cases That MUST Work
| Edge Case | Expected Behavior | Test Required |
|-----------|-------------------|---------------|
| Power loss during write | Temp file cleaned up on next boot | Yes |
| Disk full | Error before any state change | Yes |
| Rename fails | Keep old bundle, report error | Yes |
| Two simultaneous downloads | Queue, don't corrupt | Yes |
| Storage permission denied | Graceful error, keep old bundle | Yes |

### Test Requirements
- [ ] Unit test: atomic write pattern
- [ ] Integration: simulate power loss mid-write
- [ ] Test: disk full scenario
- [ ] Test: permission denied
- [ ] Test: concurrent access

---

## CRITICAL FEATURE 4: Update Check API (10/10 Required)

### What It Does
The `/v1/updates/check` endpoint that every app hits on every startup.

### Why It's Critical
- Called by potentially millions of devices
- If it fails: apps can't update
- If it's slow: users notice lag on startup
- If it returns wrong data: wrong bundle loaded

### Requirements
| Metric | Target | Why |
|--------|--------|-----|
| Latency p99 | <100ms | User perceives startup delay |
| Error rate | <0.01% | Millions of calls = many failures |
| Availability | 99.99% | Can't block user's app from starting |

### Edge Cases
| Edge Case | Expected Behavior | Test Required |
|-----------|-------------------|---------------|
| Database down | Return cached response from KV | Yes |
| Invalid API key | 401 immediately, no DB query | Yes |
| App version not supported | Return `requiresAppStoreUpdate: true` | Yes |
| No update available | Return 204 No Content (fast) | Yes |
| Rate limit exceeded | 429 with retry-after | Yes |

### Test Requirements
- [ ] Load test: 10,000 RPS
- [ ] Latency test: p99 < 100ms
- [ ] Cache test: KV fallback works
- [ ] Auth test: invalid keys rejected fast
- [ ] Rate limit test: limits enforced correctly

---

## CRITICAL FEATURE 5: Health Monitoring (8/10 Required)

### What It Does
Detect when a release is causing problems and auto-disable it.

### Why It's Critical
Without this, a bad release could crash 100% of users before anyone notices.

### How It Works
```
1. App defines critical events: ['app_ready', 'home_loaded']
2. SDK starts timer on update apply
3. As events fire, mark them complete
4. If all events fire before timeout → success, NO network call
5. If timeout with missing events → report failure
6. Server aggregates: if failure_rate > 5% → disable release
```

### Edge Cases
| Edge Case | Expected Behavior | Test Required |
|-----------|-------------------|---------------|
| User kills app before timeout | Not counted as failure | Yes |
| Network down on failure report | Queue for later | Yes |
| Multiple releases active (A/B) | Track separately | Yes |
| Event fires twice | Count once | Yes |

---

## VERIFICATION MATRIX

Before building each critical feature:

| Step | Action | Output |
|------|--------|--------|
| 1 | Read reference implementation line by line | Understanding document |
| 2 | List all edge cases | Edge case table |
| 3 | Write tests BEFORE code | Test files |
| 4 | Implement feature | Source files |
| 5 | Run all tests | Green tests |
| 6 | Fuzzing/chaos testing | No crashes |
| 7 | Code review by 2 people | Approved |
| 8 | Manual test on real devices | Video proof |

---

## BUILD GATES

The build workflow will STOP and require manual approval at:

| Gate | Condition | Who Approves |
|------|-----------|--------------|
| Rollback complete | All rollback tests pass | Human review |
| Storage complete | Atomic write tests pass | Human review |
| Integrity complete | Hash verification tests pass | Human review |
| API complete | Load test passes | Human review |
| Full integration | End-to-end update flow works | Human review |

The loop CANNOT proceed past these gates without explicit `/approve` command.
