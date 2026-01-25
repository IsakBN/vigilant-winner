# Test Requirements Matrix

This defines the exact tests required for each critical feature.

## Testing Levels

| Level | What | When | Tools |
|-------|------|------|-------|
| Unit | Single function/class | Every function | Vitest |
| Integration | Multiple modules | Every flow | Vitest + mocks |
| E2E | Full system | Major features | Real devices |
| Fuzz | Random inputs | Critical paths | Property testing |
| Chaos | Failure injection | Critical paths | Manual |
| Load | High volume | API endpoints | k6 or similar |

---

## SDK Tests

### Rollback Module (`packages/sdk/src/rollback.ts`)

| Test ID | Description | Type | Critical |
|---------|-------------|------|----------|
| ROLL-001 | Create RollbackManager successfully | Unit | Yes |
| ROLL-002 | Crash count increments within window | Unit | Yes |
| ROLL-003 | Crash count resets outside window | Unit | Yes |
| ROLL-004 | Rollback triggers at threshold (3) | Unit | Yes |
| ROLL-005 | Rollback doesn't trigger below threshold | Unit | Yes |
| ROLL-006 | Rollback with no previous version | Unit | Yes |
| ROLL-007 | markSuccess resets crash count | Unit | Yes |
| ROLL-008 | Manual rollback trigger works | Unit | Yes |
| ROLL-009 | Rollback report sent to API | Integration | Yes |
| ROLL-010 | Rollback report queued on network failure | Integration | Yes |
| ROLL-011 | Full crash → rollback → report flow | Integration | Yes |
| ROLL-012 | Concurrent access safe | Unit | Yes |
| ROLL-013 | Storage corruption → embedded bundle | Chaos | Yes |
| ROLL-014 | 3 crashes in 55s → no rollback | Unit | Yes |
| ROLL-015 | 3 crashes in 65s → rollback | Unit | Yes |

### Storage Module (`packages/sdk/src/storage.ts`)

| Test ID | Description | Type | Critical |
|---------|-------------|------|----------|
| STOR-001 | Write bundle to temp file | Unit | Yes |
| STOR-002 | Atomic rename temp → final | Unit | Yes |
| STOR-003 | Failed write doesn't corrupt state | Unit | Yes |
| STOR-004 | Read current version | Unit | Yes |
| STOR-005 | Read previous version | Unit | Yes |
| STOR-006 | Set pending update | Unit | Yes |
| STOR-007 | Apply pending update | Unit | Yes |
| STOR-008 | Cleanup old bundles | Unit | No |
| STOR-009 | Device ID persistence | Unit | Yes |
| STOR-010 | Disk full handling | Chaos | Yes |
| STOR-011 | Permission denied handling | Chaos | Yes |
| STOR-012 | Concurrent writes queue correctly | Integration | Yes |

### Integrity Module (`packages/sdk/src/patcher.ts`)

| Test ID | Description | Type | Critical |
|---------|-------------|------|----------|
| HASH-001 | Valid hash format accepted | Unit | Yes |
| HASH-002 | Invalid hash format rejected | Unit | Yes |
| HASH-003 | Empty hash rejected | Unit | Yes |
| HASH-004 | SHA256 computation correct | Unit | Yes |
| HASH-005 | Hash mismatch detected | Unit | Yes |
| HASH-006 | Single byte change detected | Unit | Yes |
| HASH-007 | Empty file rejected | Unit | Yes |
| HASH-008 | Partial file rejected | Unit | Yes |
| HASH-009 | Valid patch applied correctly | Unit | No |
| HASH-010 | Invalid patch rejected | Unit | Yes |

### Health Module (`packages/sdk/src/health.ts`)

| Test ID | Description | Type | Critical |
|---------|-------------|------|----------|
| HLTH-001 | Start monitoring works | Unit | Yes |
| HLTH-002 | Event reporting works | Unit | Yes |
| HLTH-003 | All events → timer cancelled | Unit | Yes |
| HLTH-004 | Missing events → failure reported | Unit | Yes |
| HLTH-005 | No events configured → no monitoring | Unit | Yes |
| HLTH-006 | Duplicate events counted once | Unit | Yes |
| HLTH-007 | Network failure → queued | Integration | No |
| HLTH-008 | Healthy path = zero network calls | Integration | Yes |

### Updater Module (`packages/sdk/src/updater.ts`)

| Test ID | Description | Type | Critical |
|---------|-------------|------|----------|
| UPDT-001 | Check for update works | Unit | Yes |
| UPDT-002 | No update available handled | Unit | Yes |
| UPDT-003 | Update available stored | Unit | Yes |
| UPDT-004 | Download with progress | Integration | Yes |
| UPDT-005 | Download in background | Integration | Yes |
| UPDT-006 | Patch application works | Integration | No |
| UPDT-007 | Patch failure → full download | Integration | Yes |
| UPDT-008 | Hash verified after download | Integration | Yes |
| UPDT-009 | Resume after network failure | Integration | Yes |
| UPDT-010 | Version recorded after apply | Integration | Yes |

---

## API Tests

### Update Check Endpoint (`/v1/updates/check`)

| Test ID | Description | Type | Critical |
|---------|-------------|------|----------|
| API-001 | Valid request returns update info | Unit | Yes |
| API-002 | Invalid API key → 401 | Unit | Yes |
| API-003 | Missing app → 404 | Unit | Yes |
| API-004 | No update → 204 | Unit | Yes |
| API-005 | Rate limit exceeded → 429 | Unit | Yes |
| API-006 | Response time < 100ms p99 | Load | Yes |
| API-007 | 10,000 RPS sustained | Load | Yes |
| API-008 | DB down → KV fallback | Chaos | Yes |

### Upload Endpoints

| Test ID | Description | Type | Critical |
|---------|-------------|------|----------|
| API-020 | Presigned URL generation | Unit | Yes |
| API-021 | Upload job creation | Unit | Yes |
| API-022 | Upload completion webhook | Integration | Yes |
| API-023 | Invalid bundle rejected | Unit | Yes |
| API-024 | Hash computed correctly | Unit | Yes |
| API-025 | Priority queue routing | Unit | Yes |

### Auth Endpoints

| Test ID | Description | Type | Critical |
|---------|-------------|------|----------|
| API-030 | Login with valid credentials | Integration | Yes |
| API-031 | Login with invalid credentials | Integration | Yes |
| API-032 | Token refresh works | Integration | Yes |
| API-033 | Expired token → 401 | Unit | Yes |
| API-034 | API key validation | Unit | Yes |
| API-035 | API key rotation | Integration | Yes |

---

## E2E Tests

| Test ID | Description | Platforms | Critical |
|---------|-------------|-----------|----------|
| E2E-001 | Upload → Check → Download → Apply | All | Yes |
| E2E-002 | Crash → Rollback → Report | iOS, Android | Yes |
| E2E-003 | Health failure → Auto-disable | All | Yes |
| E2E-004 | Channel switching | All | Yes |
| E2E-005 | Network recovery | All | Yes |
| E2E-006 | Fresh install → no previous bundle | All | Yes |

---

## Test Coverage Requirements

| Package | Minimum Coverage | Critical Path Coverage |
|---------|------------------|------------------------|
| @bundlenudge/sdk | 90% | 100% |
| @bundlenudge/api | 85% | 100% |
| @bundlenudge/shared | 100% | 100% |
| dashboard | 75% | 90% |
| builder | 85% | 95% |
| worker | 85% | 95% |

---

## Running Tests

```bash
# All tests
pnpm test

# Single package
pnpm --filter @bundlenudge/sdk test

# With coverage
pnpm --filter @bundlenudge/sdk test -- --coverage

# Only critical tests
pnpm --filter @bundlenudge/sdk test -- --grep "CRITICAL"
```

---

## Test File Organization

```
packages/sdk/src/
├── rollback.ts
├── rollback.test.ts          # Unit tests
├── rollback.integration.test.ts  # Integration tests
├── storage.ts
├── storage.test.ts
├── health.ts
├── health.test.ts
└── __tests__/
    ├── e2e/
    │   ├── update-flow.e2e.test.ts
    │   └── rollback-flow.e2e.test.ts
    └── chaos/
        ├── storage-corruption.chaos.test.ts
        └── network-failure.chaos.test.ts
```
