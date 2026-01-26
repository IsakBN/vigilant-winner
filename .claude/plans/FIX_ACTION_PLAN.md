# BundleNudge Fix Action Plan

> **Generated:** 2026-01-26
> **Purpose:** Complete remediation of all audit findings
> **Goal:** Pass all quality gates before production launch

---

## Executive Summary

| Category | Issues | Priority |
|----------|--------|----------|
| TypeScript Errors | ~180 in dashboard | 🔴 CRITICAL |
| Lint Errors | 53 in SDK | 🔴 CRITICAL |
| Stale Documentation | 3 files | 🟡 HIGH |
| Missing Features | Email auth | 🟡 HIGH |
| Missing Tests | E2E, Load | 🟢 MEDIUM |
| Missing Docs | Deploy, Troubleshoot | 🟢 MEDIUM |

---

## Wave 1: Quality Gates (CRITICAL)

**Goal:** Make `pnpm typecheck && pnpm lint` pass

### Task 1.1: Fix Dashboard TypeScript Errors

**Priority:** 🔴 CRITICAL
**Effort:** 2-4 hours
**Files Affected:** ~15 components

**Root Cause:** React 19 type incompatibility with Radix UI components

**Solution Options:**

1. **Quick Fix (Recommended):** Add type assertions or wrapper components
   ```typescript
   // Before
   <Select>...</Select>

   // After - Cast to any for now
   {(Select as React.ComponentType<SelectProps>)({...props})}
   ```

2. **Proper Fix:** Update @radix-ui packages to React 19 compatible versions
   ```bash
   pnpm --filter dashboard update @radix-ui/react-select@latest
   ```

3. **Alternative:** Pin @types/react to 18.x temporarily
   ```json
   "resolutions": {
     "@types/react": "18.2.0"
   }
   ```

**Files to Fix:**
- [ ] `src/components/teams/RoleSelector.tsx`
- [ ] `src/components/teams/TeamCard.tsx`
- [ ] `src/providers/AuthProvider.tsx`
- [ ] All files using Radix UI Select, Card, Dialog components

**Verification:**
```bash
pnpm --filter dashboard typecheck
```

---

### Task 1.2: Fix SDK Lint Errors

**Priority:** 🔴 CRITICAL
**Effort:** 1-2 hours
**Errors:** 53

**Error Breakdown:**

| Error Type | Count | Fix |
|------------|-------|-----|
| `unbound-method` | 38 | Bind methods or use arrow functions |
| `no-unnecessary-condition` | 8 | Remove redundant null checks |
| `consistent-generic-constructors` | 2 | Move generic to constructor |
| `no-dynamic-delete` | 1 | Use Map or explicit property |

**Auto-fixable (7 errors):**
```bash
pnpm --filter @bundlenudge/sdk lint --fix
```

**Manual Fixes Required:**

1. **unbound-method errors in bundlenudge.ts:**
   ```typescript
   // Before
   const callback = this.onProgress

   // After - Bind in constructor
   constructor() {
     this.onProgress = this.onProgress.bind(this)
   }

   // OR - Use arrow function
   onProgress = (progress: number) => { ... }
   ```

2. **no-unnecessary-condition in storage.ts:259:**
   ```typescript
   // Before
   if (value !== undefined && value !== null) { ... }

   // After - Remove if value is already typed as non-null
   if (value) { ... }
   ```

3. **consistent-generic-constructors in health-monitor.ts:**
   ```typescript
   // Before
   private listeners: Set<Listener> = new Set<Listener>()

   // After
   private listeners = new Set<Listener>()
   ```

4. **no-dynamic-delete in storage.ts:356:**
   ```typescript
   // Before
   delete obj[key]

   // After
   const { [key]: _, ...rest } = obj
   return rest
   ```

**Verification:**
```bash
pnpm --filter @bundlenudge/sdk lint
```

---

## Wave 2: Documentation Updates (HIGH)

**Goal:** All documentation accurate and current

### Task 2.1: Update CURRENT_STATE.md

**Priority:** 🟡 HIGH
**Effort:** 30 mins

**Updates Needed:**
- [ ] Update test count: API from 1,669 → 1,773
- [ ] Add lint errors as known issue
- [ ] Add TypeScript errors as known issue
- [ ] Update overall progress percentage

### Task 2.2: Update Other Stale Checkin Files

**Priority:** 🟡 HIGH
**Effort:** 30 mins

**Files:**
- [x] `packages/sdk/checkin.md` - DONE
- [ ] `packages/builder/checkin.md` - Verify accuracy
- [ ] `packages/worker/checkin.md` - Verify accuracy
- [ ] `packages/shared/checkin.md` - Verify accuracy

### Task 2.3: Remove Delta Patching References

**Priority:** 🟡 HIGH
**Effort:** 15 mins

**Files Updated:**
- [x] `.claude/plans/SDK_PHASE_PLAN.md` - DONE
- [x] `.claude/knowledge/PRODUCT.md` - DONE
- [ ] Check other files for "delta patch" references

---

## Wave 3: Dashboard Auth Completion (HIGH)

**Goal:** Complete email/password authentication flow

### Task 3.1: Email/Password Signup

**Priority:** 🟡 HIGH
**Effort:** 2-3 hours

**Backend (API):**
- [x] Better-Auth email/password plugin configured
- [x] OTP email sending via Resend
- [ ] Verify signup endpoint works end-to-end

**Frontend (Dashboard):**
- [ ] Wire up signup form to Better-Auth
- [ ] Add email field validation
- [ ] Add password strength indicator
- [ ] Handle signup errors

**Files:**
- `packages/dashboard/src/app/(main)/sign-up/page.tsx`
- `packages/dashboard/src/lib/api/auth.ts`

### Task 3.2: Email Verification Flow

**Priority:** 🟡 HIGH
**Effort:** 1-2 hours

**Backend:**
- [x] OTP generation and storage
- [x] Email template
- [ ] Verify OTP endpoint works

**Frontend:**
- [ ] Create verify-email page
- [ ] Handle OTP input
- [ ] Handle resend OTP

**Files:**
- `packages/dashboard/src/app/(main)/verify-email/page.tsx`

### Task 3.3: Password Reset Flow

**Priority:** 🟡 HIGH
**Effort:** 1-2 hours

**Backend:**
- [x] Password reset token generation
- [x] Reset email template
- [ ] Verify reset endpoint works

**Frontend:**
- [ ] Wire up forgot-password form
- [ ] Create reset-password page
- [ ] Handle new password submission

**Files:**
- `packages/dashboard/src/app/(main)/forgot-password/page.tsx`
- `packages/dashboard/src/app/(main)/reset-password/page.tsx`

---

## Wave 4: Testing (MEDIUM)

**Goal:** Add critical test coverage

### Task 4.1: Dashboard Component Tests

**Priority:** 🟢 MEDIUM
**Effort:** 4-6 hours

**Setup:**
```bash
pnpm --filter dashboard add -D vitest @testing-library/react @testing-library/jest-dom
```

**Tests to Add:**
- [ ] Auth forms (login, signup, reset)
- [ ] App list component
- [ ] Release management
- [ ] Team management

### Task 4.2: E2E Test Framework

**Priority:** 🟢 MEDIUM
**Effort:** 4-8 hours

**Setup:**
```bash
pnpm add -Dw playwright @playwright/test
npx playwright install
```

**Critical Flows to Test:**
- [ ] Login → Dashboard → Create App
- [ ] Upload Bundle → View Release
- [ ] Invite Team Member → Accept Invite
- [ ] SDK Update Check (mocked)

### Task 4.3: Load Testing Setup

**Priority:** 🟢 LOW
**Effort:** 2-4 hours

**Setup:**
```bash
# Install k6
brew install k6
```

**Tests to Create:**
- [ ] SDK update check endpoint (1000 req/s)
- [ ] Bundle download endpoint
- [ ] Dashboard API endpoints

---

## Wave 5: Documentation (MEDIUM)

**Goal:** Production-ready documentation

### Task 5.1: Create DEPLOYMENT.md

**Priority:** 🟢 MEDIUM
**Effort:** 2-3 hours

**Sections:**
- [ ] Cloudflare Workers setup
- [ ] D1 database provisioning
- [ ] R2 bucket configuration
- [ ] KV namespace setup
- [ ] Queue configuration
- [ ] Environment variables
- [ ] Domain configuration
- [ ] SSL/TLS setup

### Task 5.2: Create TROUBLESHOOTING.md

**Priority:** 🟢 MEDIUM
**Effort:** 1-2 hours

**Sections:**
- [ ] Common SDK errors
- [ ] API error codes
- [ ] Build failures
- [ ] Rollback issues
- [ ] Rate limiting

### Task 5.3: Add Missing README Files

**Priority:** 🟢 LOW
**Effort:** 1 hour

**Files:**
- [ ] `packages/dashboard/README.md`
- [ ] `packages/builder/README.md`
- [ ] `packages/worker/README.md`

---

## Execution Order

```
┌─────────────────────────────────────────────────────────────────┐
│                    EXECUTION TIMELINE                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Wave 1 (CRITICAL) ────────────────────────────────►            │
│  ├─ 1.1 Fix Dashboard TypeScript      [2-4 hrs]                 │
│  └─ 1.2 Fix SDK Lint                  [1-2 hrs]                 │
│                                                                  │
│  Wave 2 (HIGH) ────────────────────────────────────►            │
│  ├─ 2.1 Update CURRENT_STATE.md       [30 min]                  │
│  ├─ 2.2 Update checkin files          [30 min]                  │
│  └─ 2.3 Remove delta patch refs       [15 min]                  │
│                                                                  │
│  Wave 3 (HIGH) ────────────────────────────────────►            │
│  ├─ 3.1 Email/password signup         [2-3 hrs]                 │
│  ├─ 3.2 Email verification            [1-2 hrs]                 │
│  └─ 3.3 Password reset                [1-2 hrs]                 │
│                                                                  │
│  Wave 4 (MEDIUM) ──────────────────────────────────►            │
│  ├─ 4.1 Dashboard tests               [4-6 hrs]                 │
│  ├─ 4.2 E2E tests                     [4-8 hrs]                 │
│  └─ 4.3 Load tests                    [2-4 hrs]                 │
│                                                                  │
│  Wave 5 (MEDIUM) ──────────────────────────────────►            │
│  ├─ 5.1 DEPLOYMENT.md                 [2-3 hrs]                 │
│  ├─ 5.2 TROUBLESHOOTING.md            [1-2 hrs]                 │
│  └─ 5.3 Missing READMEs               [1 hr]                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

Total Estimated Effort: 25-45 hours
```

---

## Success Criteria

### Wave 1 Complete When:
```bash
pnpm typecheck  # Exit code 0
pnpm lint       # Exit code 0
pnpm test       # All 2,609+ tests pass
```

### Wave 2 Complete When:
- All documentation reflects actual state
- No stale checkin files
- Delta patching removed from roadmap

### Wave 3 Complete When:
- User can sign up with email/password
- User can verify email via OTP
- User can reset password

### Wave 4 Complete When:
- Dashboard has 50+ component tests
- 5+ E2E flows passing
- Load test baselines established

### Wave 5 Complete When:
- New developer can deploy from DEPLOYMENT.md
- Common issues documented in TROUBLESHOOTING.md
- All packages have README

---

## Verification Commands

```bash
# After Wave 1
pnpm typecheck && pnpm lint && pnpm test

# After Wave 3
curl -X POST http://localhost:8787/api/auth/sign-up/email \
  -d '{"email":"test@example.com","password":"Test123!"}'

# After Wave 4
pnpm playwright test
k6 run tests/load/update-check.js

# Final Verification
pnpm typecheck && pnpm lint && pnpm test && pnpm build
```

---

## Notes

- Run agents **sequentially** (max 2 parallel) per CLAUDE.md resource limits
- Commit after each wave passes verification
- Update CURRENT_STATE.md after each wave
