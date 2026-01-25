# Wave 4 Plan: Channel System

## Wave Focus
Implement release channels (production, staging, development) to enable environment-based deployments and gradual rollouts.

## Prerequisites
- [x] Wave 1-3 completed
- [x] GO decision received
- [x] Database schema exists

## Why Channels Matter

Channels enable:
- **Environment separation**: Push to staging, test, then promote to production
- **Beta testing**: Deploy to development channel for internal testers
- **Gradual rollouts**: Different rollout percentages per channel
- **Safe deployments**: Test changes before production

## Tasks

### Task 1: Create Channels DB Table
**Description**: Add channels table to database schema with production/staging/development support

**Files**:
- `packages/api/src/db/schema.ts` (modify - add channels table)

**Acceptance Criteria**:
- [x] Table: channels (id, app_id, name, active_release_id, created_at)
- [x] Default channels created: production, staging, development
- [x] Foreign key to apps table
- [x] Index on app_id

**Dependencies**: None

---

### Task 2: Create Channel CRUD Routes
**Description**: Implement full CRUD for channel management

**Files**:
- `packages/api/src/routes/channels/index.ts` (create)
- `packages/api/src/routes/channels/channels.test.ts` (create)

**Acceptance Criteria**:
- [x] GET /v1/apps/:appId/channels - List channels
- [x] GET /v1/apps/:appId/channels/:channelId - Get channel
- [x] POST /v1/apps/:appId/channels - Create channel
- [x] PATCH /v1/apps/:appId/channels/:channelId - Update channel
- [x] DELETE /v1/apps/:appId/channels/:channelId - Delete channel (not default ones)
- [x] Tests for all endpoints

**Dependencies**: Task 1

---

### Task 3: Wire Channels into Release Management
**Description**: Releases should be associated with channels, promotion between channels

**Files**:
- `packages/api/src/routes/releases/index.ts` (modify)
- `packages/api/src/routes/releases/management.ts` (modify)

**Acceptance Criteria**:
- [x] Releases have optional channel_id field
- [x] POST /v1/apps/:appId/releases/:releaseId/promote - Promote release to channel
- [x] Update check respects channel from request
- [x] Default to production channel if not specified

**Dependencies**: Task 1, Task 2

---

### Task 4: Update SDK Request Schema
**Description**: SDK should send channel in update check request

**Files**:
- `packages/shared/src/schemas.ts` (modify)
- `packages/api/src/routes/updates/index.ts` (modify)

**Acceptance Criteria**:
- [x] updateCheckRequestSchema includes optional channel field
- [x] Update check filters releases by channel
- [x] Fallback to production if channel not specified
- [x] Tests updated

**Dependencies**: Task 1, Task 2, Task 3

---

### Task 5: Auto-Create Default Channels
**Description**: When an app is created, auto-create production/staging/development channels

**Files**:
- `packages/api/src/routes/apps/index.ts` (modify)

**Acceptance Criteria**:
- [x] Creating an app creates 3 default channels
- [x] Channels are named: production, staging, development
- [x] Test verifies default channels exist after app creation

**Dependencies**: Task 1, Task 2

---

## Execution Order

```
Task 1 (DB Schema)
    │
    └──► Task 2 (CRUD) ──► Task 3 (Release Integration)
            │                      │
            └──► Task 5 (Auto)     └──► Task 4 (SDK Schema)
```

Parallel groups:
1. Task 1 (alone)
2. Task 2 (depends on 1)
3. Task 3, Task 5 (parallel, depend on 2)
4. Task 4 (depends on 3)

## Expected Outcomes

After this wave:
- Apps have channels (production, staging, development)
- Releases can be promoted between channels
- SDK can request updates for specific channel
- 5 new routes added (81 → 86 routes, 74% coverage)

## Audit Focus Areas

**Security Auditor**:
- Ownership checks on channel CRUD
- Can't delete default channels
- Channel access respects app permissions

**Performance Auditor**:
- Efficient channel lookup in update check
- No N+1 when listing channels with release counts

**Integration Auditor**:
- Channels wire correctly into main app
- Update check still works
- All tests pass

## GO/NO-GO Criteria

**GO if**:
- All 5 tasks completed successfully
- No CRITICAL audit findings
- All 900+ tests still pass
- Update check works with channels

**NO-GO if**:
- Any task failed
- CRITICAL security issue (missing auth on CRUD)
- Update check broken

## Rollback Plan

If wave fails:
1. Revert channels table migration
2. Remove channel routes
3. Restore original update check
