# Wave 5 Plan: Admin System

## Wave Focus
Implement the core admin system: authentication, middleware, user/app management, and audit logging.

## Prerequisites
- [x] Wave 1-4 completed
- [x] GO decision received
- [x] Database schema exists
- [x] Legacy admin patterns analyzed

## Why Admin Matters

Admin system enables:
- **Platform oversight**: Monitor users, apps, and health
- **User management**: Override limits, suspend accounts, grant credits
- **App management**: Disable/enable apps, transfer ownership
- **Audit trail**: Track all admin actions for compliance
- **Operational control**: Debug issues, manage subscriptions

## Tasks

### Task 1: Admin Database Schema
**Description**: Add admin-specific tables to database schema

**Files**:
- `packages/api/src/db/schema.ts` (modify - add admin tables)

**Acceptance Criteria**:
- [ ] Table: admin_audit_log (id, admin_id, action, target_user_id, target_app_id, details, created_at)
- [ ] Table: user_limit_overrides (id, user_id, mau_limit, storage_gb, expires_at, reason, created_by)
- [ ] Table: user_suspensions (id, user_id, reason, until, suspended_by, lifted_at, lifted_by)
- [ ] Table: otp_attempts (email, locked_until, attempts, last_attempt)
- [ ] Indexes on queried columns
- [ ] Foreign keys where appropriate

**Dependencies**: None

---

### Task 2: Admin Auth Routes
**Description**: Implement OTP-based admin authentication

**Files**:
- `packages/api/src/routes/admin-auth/index.ts` (create)
- `packages/api/src/routes/admin-auth/admin-auth.test.ts` (create)

**Acceptance Criteria**:
- [ ] POST /admin-auth/send-otp - Send OTP to @bundlenudge.com email only
- [ ] POST /admin-auth/verify-otp - Verify OTP and create session
- [ ] Rate limiting: 3 sends per 15 minutes per email
- [ ] Rate limiting: 5 verify attempts per OTP
- [ ] Account lockout: 10 failures → 30 min lockout
- [ ] OTP stored hashed (bcrypt)
- [ ] Tests for all scenarios

**Dependencies**: Task 1

---

### Task 3: Admin Middleware
**Description**: Create requireAdmin middleware for protected routes

**Files**:
- `packages/api/src/middleware/admin.ts` (create)
- `packages/api/src/middleware/admin.test.ts` (create)

**Acceptance Criteria**:
- [ ] requireAdmin middleware verifies admin session
- [ ] Checks email domain is @bundlenudge.com
- [ ] Sets adminId in context for audit logging
- [ ] Returns 401 for unauthenticated
- [ ] Returns 403 for non-admin users
- [ ] Tests for auth scenarios

**Dependencies**: Task 2

---

### Task 4: Admin Audit Logging Helper
**Description**: Create helper to log all admin actions

**Files**:
- `packages/api/src/lib/admin/audit.ts` (create)
- `packages/api/src/lib/admin/audit.test.ts` (create)

**Acceptance Criteria**:
- [ ] logAdminAction(db, action) function
- [ ] Captures: adminId, action, targetUserId, targetAppId, details (JSON)
- [ ] Used consistently across all admin routes
- [ ] Tests verify logging works

**Dependencies**: Task 1

---

### Task 5: Admin User Management Routes
**Description**: Implement user listing and management endpoints

**Files**:
- `packages/api/src/routes/admin/users.ts` (create)
- `packages/api/src/routes/admin/users.test.ts` (create)

**Acceptance Criteria**:
- [ ] GET /admin/users - List users with filtering (plan, status, search)
- [ ] GET /admin/users/:userId - Detailed user info
- [ ] POST /admin/users/:userId/override-limits - Set custom limits
- [ ] DELETE /admin/users/:userId/override-limits - Remove overrides
- [ ] POST /admin/users/:userId/suspend - Suspend user
- [ ] DELETE /admin/users/:userId/suspend - Unsuspend user
- [ ] All actions logged to audit trail
- [ ] Tests for all endpoints

**Dependencies**: Task 1, Task 3, Task 4

---

### Task 6: Admin App Management Routes
**Description**: Implement app listing and management endpoints

**Files**:
- `packages/api/src/routes/admin/apps.ts` (create)
- `packages/api/src/routes/admin/apps.test.ts` (create)

**Acceptance Criteria**:
- [ ] GET /admin/apps - List apps with filtering (owner, plan, search)
- [ ] GET /admin/apps/:appId - Detailed app info
- [ ] POST /admin/apps/:appId/disable - Disable app
- [ ] DELETE /admin/apps/:appId/disable - Re-enable app
- [ ] DELETE /admin/apps/:appId - Delete app (cascade all related data)
- [ ] All actions logged to audit trail
- [ ] Tests for all endpoints

**Dependencies**: Task 1, Task 3, Task 4

---

### Task 7: Admin Dashboard Stats
**Description**: Implement basic admin dashboard statistics

**Files**:
- `packages/api/src/routes/admin/dashboard.ts` (create)
- `packages/api/src/routes/admin/dashboard.test.ts` (create)

**Acceptance Criteria**:
- [ ] GET /admin/dashboard/overview - Platform summary stats
- [ ] GET /admin/dashboard/audit-log - Admin action history
- [ ] Stats include: total users, apps, active subscriptions, OTA metrics
- [ ] Audit log filterable by action, admin, date range
- [ ] Tests for all endpoints

**Dependencies**: Task 1, Task 3, Task 4

---

### Task 8: Wire Admin Routes into Main App
**Description**: Mount all admin routes and export from package

**Files**:
- `packages/api/src/routes/admin/index.ts` (create)
- `packages/api/src/index.ts` (modify)

**Acceptance Criteria**:
- [ ] Admin router mounts all sub-routes
- [ ] Admin-auth routes at /admin-auth/*
- [ ] Protected admin routes at /admin/*
- [ ] All routes use requireAdmin middleware (except auth)
- [ ] Verify routes accessible via integration test

**Dependencies**: Task 2-7

---

## Execution Order

```
Task 1 (DB Schema)
    │
    ├──► Task 2 (Auth) ──► Task 3 (Middleware)
    │                            │
    └──► Task 4 (Audit Helper)   │
              │                  │
              ▼                  ▼
         ┌────┴────────────────────┐
         │                         │
    Task 5 (Users)           Task 6 (Apps)
         │                         │
         └────────┬────────────────┘
                  │
                  ▼
            Task 7 (Dashboard)
                  │
                  ▼
            Task 8 (Wire Up)
```

Parallel groups:
1. Task 1 (alone)
2. Task 2, Task 4 (parallel, depend on 1)
3. Task 3 (depends on 2)
4. Task 5, Task 6 (parallel, depend on 1, 3, 4)
5. Task 7 (depends on 1, 3, 4)
6. Task 8 (depends on all)

## Expected Outcomes

After this wave:
- Admin authentication via OTP
- User management (listing, limits, suspension)
- App management (listing, disable, delete)
- Admin audit logging
- Basic dashboard statistics
- 12 new routes added (87 → 99 routes, ~85% coverage)

## Audit Focus Areas

**Security Auditor**:
- OTP rate limiting effectiveness
- Admin session security
- Email domain validation
- Audit log completeness
- No privilege escalation paths

**Performance Auditor**:
- User/app list queries with pagination
- Dashboard stats query efficiency
- Audit log pagination
- No N+1 queries

**Integration Auditor**:
- Admin routes properly wired
- Middleware applied correctly
- All tests pass
- TypeScript compiles

## GO/NO-GO Criteria

**GO if**:
- All 8 tasks completed successfully
- No CRITICAL audit findings
- All 1000+ tests still pass
- Admin auth flow works end-to-end

**NO-GO if**:
- Any task failed
- CRITICAL security issue (auth bypass, missing audit)
- TypeScript errors
- Existing tests broken

## Rollback Plan

If wave fails:
1. Revert admin tables migration
2. Remove admin routes
3. Restore original index.ts
