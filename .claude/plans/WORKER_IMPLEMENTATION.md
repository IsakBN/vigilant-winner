# Worker Package Implementation Plan

> **Goal:** Build a production-ready Mac build worker for iOS/Android builds with code signing.
>
> **Date:** 2026-01-26
> **Agents:** 8 total (4 waves, 2 agents per wave)
> **Reference:** `/Users/isaks_macbook/Desktop/Dev/codepush/packages/worker`

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                       BUILD WORKER                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Entry Point (index.ts)                                         │
│  └─► Environment validation + signal handlers                   │
│       │                                                          │
│       ▼                                                          │
│  BuildWorker (worker.ts)                                        │
│  └─► Main loop: poll → claim → execute → report                 │
│       │                                                          │
│       ├──► ApiClient (api.ts)                                   │
│       │    └─► REST calls to BundleNudge API                    │
│       │                                                          │
│       ├──► Metrics (metrics.ts)                                 │
│       │    └─► CPU, memory, disk, load average                  │
│       │                                                          │
│       ├──► Executor (exec.ts)                                   │
│       │    └─► Shell command execution with timeout             │
│       │                                                          │
│       └──► Signing (signing.ts + appstore.ts)                   │
│            └─► Keychain, certificates, profiles                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## File Structure (250-line limit compliance)

```
packages/worker/src/
├── index.ts          (~70 lines)   Entry point, env validation
├── types.ts          (~80 lines)   Type definitions
├── worker.ts         (~200 lines)  Main worker loop
├── api.ts            (~180 lines)  API client
├── exec.ts           (~110 lines)  Command execution
├── metrics.ts        (~100 lines)  System metrics (split from worker)
├── signing.ts        (~150 lines)  Keychain + profile setup
├── appstore.ts       (~150 lines)  App Store Connect API (split from signing)
└── *.test.ts         (~400 lines)  Tests for all modules
```

**Total:** ~1,040 lines source + ~400 lines tests = ~1,440 lines

---

## Wave Structure

### Wave 1: Foundation + Execution (2 agents parallel)

**Agent 1A: Types + Entry Point**
```
Files: src/types.ts, src/index.ts, tsconfig.json

Tasks:
1. Create tsconfig.json with strict mode
2. Create src/types.ts with all interfaces:
   - WorkerConfig, Build, BuildCredentials, TestDevice
   - ClaimResult, StatusUpdate, LogEntry, HeartbeatData
   - ExecOptions, ExecResult, SigningConfig, SigningInfo
3. Create src/index.ts with:
   - Environment variable loading (WORKER_API_URL, WORKER_TOKEN, etc.)
   - Configuration validation
   - Signal handlers (SIGINT, SIGTERM)
   - Worker instantiation and start

Acceptance:
- [ ] tsconfig.json compiles with strict mode
- [ ] All types exported from types.ts
- [ ] index.ts validates required env vars
- [ ] Signal handlers registered
```

**Agent 1B: Exec Module**
```
Files: src/exec.ts, src/exec.test.ts

Tasks:
1. Create exec() function:
   - Shell command execution via spawn
   - Timeout enforcement (default 10 min)
   - Stdout/stderr capture
   - Exit code handling
   - SIGTERM → SIGKILL escalation
2. Create execSequence() for chained commands
3. Write tests (mock child_process)

Acceptance:
- [ ] exec() returns ExecResult with success/stdout/stderr
- [ ] Timeout kills process
- [ ] execSequence stops on first failure
- [ ] 10+ tests passing
```

---

### Wave 2: API + Metrics (2 agents parallel)

**Agent 2A: API Client**
```
Files: src/api.ts, src/api.test.ts

Tasks:
1. Create ApiClient class:
   - Constructor with baseUrl + token
   - claimJob(workerId, nodePool) → POST /builds/worker/claim
   - updateStatus(buildId, update) → POST /builds/worker/{id}/status
   - appendLog(buildId, logs) → POST /builds/worker/{id}/log
   - heartbeat(data) → POST /nodes/worker/heartbeat
   - goOffline() → POST /nodes/worker/offline
   - reportBuildComplete(buildId, durationMs, success)
   - uploadArtifact(key, data) → POST /v1/bundles/upload
2. Private request() helper with auth headers
3. Write tests (mock fetch)

Acceptance:
- [ ] All 7 API methods implemented
- [ ] Authorization header on all requests
- [ ] Error handling for non-2xx responses
- [ ] 15+ tests passing
```

**Agent 2B: System Metrics**
```
Files: src/metrics.ts, src/metrics.test.ts

Tasks:
1. Create getSystemMetrics() function:
   - CPU usage (via `top -l 1`)
   - Memory usage (via `vm_stat`)
   - Disk usage (via `df -h /`)
   - Load average (via `sysctl -n vm.loadavg`)
2. Parse macOS-specific command output
3. Handle errors gracefully (return zeros)
4. Write tests (mock exec)

Acceptance:
- [ ] Returns { cpuUsage, memoryUsage, diskUsage, loadAverage }
- [ ] All values are numbers (0-100 for percentages)
- [ ] Errors return default zeros (no throws)
- [ ] 8+ tests passing
```

---

### Wave 3: Signing (2 agents parallel)

**Agent 3A: Keychain + Signing Setup**
```
Files: src/signing.ts, src/signing.test.ts

Tasks:
1. Create setupSigning(config) function:
   - Create temporary keychain
   - Set keychain settings (timeout, unlock)
   - Add to search list
   - Generate build settings string
   - Create ExportOptions.plist content
2. Create cleanupSigning(info) function:
   - Delete temporary keychain
   - Remove temp files
3. Create generateExportOptions() helper
4. Write tests

Acceptance:
- [ ] Keychain created with random password
- [ ] ExportOptions.plist generated correctly
- [ ] Cleanup removes keychain
- [ ] 10+ tests passing
```

**Agent 3B: App Store Connect API**
```
Files: src/appstore.ts, src/appstore.test.ts

Tasks:
1. Create generateJWT(credentials) function:
   - ES256 signing
   - App Store Connect audience
   - 20-minute expiry
2. Create registerDevice(jwt, udid, name) function
3. Create createProvisioningProfile(jwt, config) function
4. Write tests (mock crypto + fetch)

Acceptance:
- [ ] JWT generated with correct header/payload
- [ ] Device registration calls correct endpoint
- [ ] Profile creation handles all fields
- [ ] 10+ tests passing
```

---

### Wave 4: Main Worker (2 agents parallel)

**Agent 4A: BuildWorker Class**
```
Files: src/worker.ts, src/worker.test.ts

Tasks:
1. Create BuildWorker class:
   - Constructor with WorkerConfig
   - start() - main loop with polling
   - stop() - graceful shutdown
   - poll() - claim and process jobs
   - startHeartbeat() - periodic heartbeat
2. Create executeBuild() method (6 phases):
   - Clone repository
   - Install dependencies (npm/yarn + pods)
   - Setup signing
   - Build archive (xcodebuild)
   - Export IPA
   - Upload artifact
3. Create log() and cleanup() helpers
4. Write tests (mock all dependencies)

Acceptance:
- [ ] Worker polls at configured interval
- [ ] Heartbeat sends system metrics
- [ ] Build executes all 6 phases
- [ ] Errors update build status to failed
- [ ] Cleanup removes build directory
- [ ] 15+ tests passing
```

**Agent 4B: Integration + Package Setup**
```
Files: package.json updates, eslint.config.js, final integration

Tasks:
1. Update package.json:
   - Add "start" script
   - Add "bin" entry for CLI
   - Verify dependencies
2. Create eslint.config.js
3. Wire all modules together in index.ts
4. Create integration test that mocks full flow
5. Verify typecheck, lint, test all pass

Acceptance:
- [ ] `pnpm --filter @bundlenudge/worker build` succeeds
- [ ] `pnpm --filter @bundlenudge/worker typecheck` passes
- [ ] `pnpm --filter @bundlenudge/worker lint` passes
- [ ] `pnpm --filter @bundlenudge/worker test` passes
- [ ] All tests passing (50+ total)
```

---

## Execution Timeline

```
TIME ──────────────────────────────────────────────────────────────►

Wave 1           Wave 2           Wave 3           Wave 4
│                │                │                │
▼                ▼                ▼                ▼

┌────────────┐   ┌────────────┐   ┌────────────┐   ┌────────────┐
│ 1A: Types  │   │ 2A: API    │   │ 3A: Signing│   │ 4A: Worker │
│ + Entry    │   │ Client     │   │ Setup      │   │ Class      │
└────────────┘   └────────────┘   └────────────┘   └────────────┘
       │                │                │                │
       │                │                │                │
┌────────────┐   ┌────────────┐   ┌────────────┐   ┌────────────┐
│ 1B: Exec   │   │ 2B: Metrics│   │ 3B: App    │   │ 4B: Integ. │
│ Module     │   │            │   │ Store API  │   │ + Package  │
└────────────┘   └────────────┘   └────────────┘   └────────────┘

Dependencies:
- Wave 2 depends on Wave 1 (types.ts, exec.ts)
- Wave 3 depends on Wave 1 (types.ts, exec.ts)
- Wave 4 depends on all previous waves
```

---

## Agent Prompts

### Agent 1A Prompt
```
Create the foundation for @bundlenudge/worker package.

Reference: /Users/isaks_macbook/Desktop/Dev/codepush/packages/worker

Files to create:
1. packages/worker/tsconfig.json - TypeScript config with strict mode
2. packages/worker/src/types.ts - All type definitions
3. packages/worker/src/index.ts - Entry point with env validation

Requirements:
- Max 250 lines per file
- Max 50 lines per function
- Named exports only
- No `any` types
- Explicit error handling

For types.ts, define:
- WorkerConfig (apiUrl, workerToken, workerId, nodePool, pollInterval, heartbeatInterval, workDir)
- Build (id, appId, status, priority, nodePool, timeoutMinutes, gitUrl, gitBranch, scheme, configuration, exportMethod, bundleIdentifier, etc.)
- BuildCredentials (issuerId, keyId, privateKey, teamId)
- TestDevice (udid, name)
- ClaimResult (build, credentials, devices)
- StatusUpdate (status, gitCommit, artifactKey, errorMessage, etc.)
- LogEntry (level, message, phase)
- HeartbeatData (cpuUsage, memoryUsage, diskUsage, loadAverage, status, currentBuildId)
- ExecOptions, ExecResult
- SigningConfig, SigningInfo

For index.ts:
- Load env vars: WORKER_API_URL, WORKER_TOKEN, WORKER_ID, NODE_POOL, WORK_DIR
- Validate all required vars present
- Create signal handlers for graceful shutdown
- Instantiate and start BuildWorker

Run: pnpm --filter @bundlenudge/worker typecheck
```

### Agent 1B Prompt
```
Create the command execution module for @bundlenudge/worker.

Reference: /Users/isaks_macbook/Desktop/Dev/codepush/packages/worker/src/exec.ts

Files to create:
1. packages/worker/src/exec.ts - Command execution
2. packages/worker/src/exec.test.ts - Tests

Requirements:
- Max 250 lines per file
- Max 50 lines per function
- Named exports only
- No `any` types

For exec.ts:
- exec(command, options?) → Promise<ExecResult>
  - Use spawn('sh', ['-c', command])
  - Capture stdout/stderr
  - Timeout with SIGTERM → SIGKILL after 5s
  - Return { success, stdout, stderr, exitCode }
- execSequence(commands[], options?) → Promise<{ success, results }>
  - Execute commands in order
  - Stop on first failure

For tests:
- Mock child_process spawn
- Test successful execution
- Test failed execution (non-zero exit)
- Test timeout handling
- Test sequence execution
- Test sequence stops on failure

Run: pnpm --filter @bundlenudge/worker test
```

### Agent 2A Prompt
```
Create the API client for @bundlenudge/worker.

Reference: /Users/isaks_macbook/Desktop/Dev/codepush/packages/worker/src/api.ts

Files to create:
1. packages/worker/src/api.ts - API client class
2. packages/worker/src/api.test.ts - Tests

Import types from ./types.ts

For api.ts, create ApiClient class:
- constructor(baseUrl, token)
- claimJob(workerId, nodePool) → POST /builds/worker/claim
- updateStatus(buildId, update) → POST /builds/worker/{id}/status
- appendLog(buildId, logs) → POST /builds/worker/{id}/log
- heartbeat(data) → POST /nodes/worker/heartbeat
- goOffline() → POST /nodes/worker/offline
- reportBuildComplete(buildId, durationMs, success) → POST /nodes/worker/build-complete
- uploadArtifact(key, data) → POST /v1/bundles/upload

Private: request<T>(path, options) with Authorization header

For tests:
- Mock global fetch
- Test each method calls correct endpoint
- Test auth header present
- Test error handling for 4xx/5xx

Run: pnpm --filter @bundlenudge/worker test
```

### Agent 2B Prompt
```
Create the system metrics module for @bundlenudge/worker.

Files to create:
1. packages/worker/src/metrics.ts - System metrics
2. packages/worker/src/metrics.test.ts - Tests

This is macOS-specific. Use exec() from ./exec.ts.

For metrics.ts:
- getSystemMetrics() → Promise<{ cpuUsage, memoryUsage, diskUsage, loadAverage }>

Implementation:
1. Load average: `sysctl -n vm.loadavg` → parse "{ 1.23 ..."
2. Memory: `vm_stat` → parse pages, calculate percentage
3. Disk: `df -h / | tail -1` → parse percentage
4. CPU: `top -l 1 -n 0 | head -10` → parse user + sys percentage

Handle errors gracefully - return 0 values if commands fail.

For tests:
- Mock exec() to return sample command output
- Test parsing of each metric
- Test error handling returns zeros
- Test with malformed output

Run: pnpm --filter @bundlenudge/worker test
```

### Agent 3A Prompt
```
Create the code signing setup module for @bundlenudge/worker.

Reference: /Users/isaks_macbook/Desktop/Dev/codepush/packages/worker/src/signing.ts (lines 1-150)

Files to create:
1. packages/worker/src/signing.ts - Keychain + signing setup
2. packages/worker/src/signing.test.ts - Tests

Import types from ./types.ts, exec from ./exec.ts

For signing.ts:
- setupSigning(config: SigningConfig) → Promise<SigningInfo>
  - Create temp keychain with random password
  - security create-keychain, set-keychain-settings, unlock-keychain
  - Add to search list
  - Generate buildSettings string (DEVELOPMENT_TEAM, PRODUCT_BUNDLE_IDENTIFIER)
  - Generate exportOptionsPlist content

- cleanupSigning(info: SigningInfo) → Promise<void>
  - security delete-keychain
  - Remove temp files

- generateExportOptions(config) → string (private helper)
  - Create plist XML for export method

For tests:
- Mock exec() calls
- Test keychain creation command
- Test cleanup removes keychain
- Test export options generation for each method (ad-hoc, development, app-store)

Run: pnpm --filter @bundlenudge/worker test
```

### Agent 3B Prompt
```
Create the App Store Connect API module for @bundlenudge/worker.

Reference: /Users/isaks_macbook/Desktop/Dev/codepush/packages/worker/src/signing.ts (lines 150-293)

Files to create:
1. packages/worker/src/appstore.ts - App Store Connect API
2. packages/worker/src/appstore.test.ts - Tests

Import types from ./types.ts

For appstore.ts:
- generateJWT(credentials: BuildCredentials) → Promise<string>
  - Create JWT with ES256 algorithm
  - Header: alg, kid, typ
  - Payload: iss, iat, exp (20 min), aud: 'appstoreconnect-v1'
  - Sign with crypto.sign()
  - Base64URL encode

- registerDevice(jwt, udid, name) → Promise<{ id } | null>
  - POST https://api.appstoreconnect.apple.com/v1/devices

- createProvisioningProfile(jwt, config) → Promise<{ id, profileContent } | null>
  - POST https://api.appstoreconnect.apple.com/v1/profiles

For tests:
- Mock crypto.sign and fetch
- Test JWT structure
- Test device registration payload
- Test profile creation with relationships
- Test error handling returns null

Run: pnpm --filter @bundlenudge/worker test
```

### Agent 4A Prompt
```
Create the main BuildWorker class for @bundlenudge/worker.

Reference: /Users/isaks_macbook/Desktop/Dev/codepush/packages/worker/src/worker.ts

Files to create:
1. packages/worker/src/worker.ts - BuildWorker class
2. packages/worker/src/worker.test.ts - Tests

Import from: ./types.ts, ./api.ts, ./exec.ts, ./metrics.ts, ./signing.ts

For worker.ts, create BuildWorker class:
- constructor(config: WorkerConfig)
- start() → main loop: while(running) { poll(); sleep(interval); }
- stop() → graceful shutdown, cancel current build, notify offline
- private startHeartbeat() → setInterval with metrics
- private poll() → claimJob, executeBuild if job exists
- private executeBuild(build, credentials, devices):
  1. Clone: git clone --depth 1 --branch {branch}
  2. Install: npm ci / yarn --frozen-lockfile + pod install
  3. Sign: setupSigning()
  4. Build: xcodebuild archive
  5. Export: xcodebuild -exportArchive
  6. Upload: api.uploadArtifact()
- private log(buildId, level, message, phase)
- private cleanup() → rm -rf build dir
- private sleep(ms)

Max 200 lines - keep methods focused.

For tests:
- Mock ApiClient, exec, setupSigning
- Test start/stop lifecycle
- Test heartbeat interval
- Test poll claims and processes job
- Test error handling updates status to failed

Run: pnpm --filter @bundlenudge/worker test
```

### Agent 4B Prompt
```
Finalize the @bundlenudge/worker package setup and integration.

Files to update/create:
1. packages/worker/package.json - Update scripts and bin
2. packages/worker/eslint.config.js - ESLint config
3. packages/worker/src/index.ts - Wire everything together
4. packages/worker/src/index.test.ts - Integration test

For package.json:
- Add "start": "node dist/index.js"
- Add "bin": { "bundlenudge-worker": "dist/index.js" }
- Ensure all dependencies present

For eslint.config.js:
- Copy from another package (e.g., @bundlenudge/builder)

For index.ts updates:
- Import BuildWorker from ./worker.ts
- Import all necessary types
- Ensure proper async/await flow

For integration test:
- Mock all external dependencies
- Test full initialization flow
- Test signal handler registration
- Test worker starts and can be stopped

Verify all passes:
- pnpm --filter @bundlenudge/worker build
- pnpm --filter @bundlenudge/worker typecheck
- pnpm --filter @bundlenudge/worker lint
- pnpm --filter @bundlenudge/worker test

Report total test count and any issues.
```

---

## Success Criteria

### Per-Wave Success
- [ ] Wave 1: types.ts + index.ts + exec.ts complete, typecheck passes
- [ ] Wave 2: api.ts + metrics.ts complete, 20+ tests
- [ ] Wave 3: signing.ts + appstore.ts complete, 20+ tests
- [ ] Wave 4: worker.ts complete, all 50+ tests passing

### Final Success
- [ ] All files under 250 lines
- [ ] All functions under 50 lines
- [ ] No `any` types
- [ ] Named exports only
- [ ] `pnpm --filter @bundlenudge/worker build` succeeds
- [ ] `pnpm --filter @bundlenudge/worker typecheck` passes
- [ ] `pnpm --filter @bundlenudge/worker lint` passes
- [ ] `pnpm --filter @bundlenudge/worker test` passes (50+ tests)

---

## Verification Commands

```bash
# After each wave
pnpm --filter @bundlenudge/worker typecheck
pnpm --filter @bundlenudge/worker test

# Final verification
pnpm --filter @bundlenudge/worker build
pnpm --filter @bundlenudge/worker lint
pnpm test  # Full test suite

# Check file sizes
wc -l packages/worker/src/*.ts
```

---

## Risk Mitigation

1. **File size exceeded:** Split into smaller modules
2. **macOS-specific commands:** Tests mock exec() output
3. **Code signing complexity:** Reference implementation provides working code
4. **API endpoint mismatch:** Check BundleNudge API routes exist

---

## Post-Implementation

After worker is complete:
1. Run builder package tests
2. Check for edge cases in builder
3. Integration test builder + worker flow
4. Update CURRENT_STATE.md to 100% worker
