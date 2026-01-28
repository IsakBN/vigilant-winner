# Subdomain Migration Plan: Dashboard Separation

## Executive Summary

Split the monolithic dashboard into two independent applications:
- **app.bundlenudge.com** - Customer dashboard (apps, releases, teams, billing)
- **admin.bundlenudge.com** - Internal admin dashboard (users, orgs, system config)

Each application will have:
- Separate Next.js deployment
- Separate Neon PostgreSQL database
- Separate Better Auth instance
- Independent scaling and deployment pipelines

---

## Architecture Overview

### Current State
```
packages/dashboard/
├── src/app/
│   ├── (main)/dashboard/[accountId]/   # User routes
│   ├── (main)/admin/                   # Admin routes
│   └── (auth)/                         # Shared auth
├── src/components/
│   ├── admin/                          # Admin components
│   ├── dashboard/                      # User components
│   ├── landing/                        # Landing page components
│   └── ui/                             # Shared UI primitives
└── Single Neon DB + Single Better Auth
```

### Target State
```
packages/
├── shared-ui/                    # Shared component library
│   ├── src/components/ui/        # Button, Card, Input, etc.
│   ├── src/lib/                  # Utilities (cn, formatters)
│   └── package.json              # @bundlenudge/shared-ui
│
├── landing/                      # bundlenudge.com (marketing)
│   ├── src/app/                  # Landing, pricing, docs
│   ├── src/components/           # Hero, Navbar, Footer, etc.
│   └── package.json              # Lightweight Next.js app
│
├── app-dashboard/                # app.bundlenudge.com
│   ├── src/app/                  # User routes only
│   ├── src/components/           # User-specific components
│   ├── src/lib/auth/             # Better Auth (standard)
│   └── Neon DB: bundlenudge_app_auth
│
└── admin-dashboard/              # admin.bundlenudge.com
    ├── src/app/                  # Admin routes only
    ├── src/components/           # Admin-specific components
    ├── src/lib/auth/             # Better Auth (OTP + allowlist)
    └── Neon DB: bundlenudge_admin_auth
```

### Domain Structure
```
bundlenudge.com        → packages/landing      (marketing site)
app.bundlenudge.com    → packages/app-dashboard (customer dashboard)
admin.bundlenudge.com  → packages/admin-dashboard (internal admin)
api.bundlenudge.com    → packages/api          (unchanged)
```

### Database Architecture
```
┌─────────────────────────────────────────────────────────────────┐
│                     Cloudflare D1 (unchanged)                   │
│  • apps, releases, channels, devices, builds                    │
│  • All application data stays here                              │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────┐     ┌─────────────────────────┐
│  Neon: app_auth         │     │  Neon: admin_auth       │
│  • Better Auth tables   │     │  • Better Auth tables   │
│  • users, sessions      │     │  • admin_users          │
│  • accounts, verifications│   │  • sessions, otp_codes  │
│  • Customer auth only   │     │  • email_allowlist      │
└─────────────────────────┘     │  • audit_logs           │
                                └─────────────────────────┘
```

---

## Auth Architecture

### App Dashboard (app.bundlenudge.com)
- **Provider:** Better Auth
- **Methods:** Email/password, OAuth (GitHub, Google)
- **Database:** `bundlenudge_app` (Neon)
- **Session:** Standard JWT, 7-day expiry
- **Users:** Customers (unlimited)

### Admin Dashboard (admin.bundlenudge.com)
- **Provider:** Better Auth
- **Methods:** Email OTP only (no passwords)
- **Database:** `bundlenudge_admin` (Neon)
- **Session:** Short-lived JWT, 4-hour expiry
- **Users:** Internal team only (allowlisted emails)
- **Allowlist:** `*@bundlenudge.com` + explicit emails

### Auth Flow Comparison

| Aspect | App Dashboard | Admin Dashboard |
|--------|---------------|-----------------|
| Login | Email/pass or OAuth | Email → OTP code |
| Registration | Self-service | Admin-created only |
| Session length | 7 days | 4 hours |
| Remember me | Yes | No |
| Password reset | Yes | N/A (no passwords) |
| 2FA | Optional | Built-in (OTP) |
| IP restrictions | None | Optional allowlist |

### Landing Page Navigation (Simple Approach)

The landing page always shows Login/Signup buttons. No cross-subdomain auth check needed.

```typescript
// packages/landing/src/components/Navbar.tsx
export function Navbar() {
  return (
    <nav>
      <Button variant="ghost" asChild>
        <a href="https://app.bundlenudge.com/login">Login</a>
      </Button>
      <Button asChild>
        <a href="https://app.bundlenudge.com/sign-up">Sign Up Free</a>
      </Button>
    </nav>
  )
}
```

The app-dashboard handles "already logged in" redirects:

```typescript
// packages/app-dashboard/src/app/login/page.tsx
export default function LoginPage() {
  const { session, isLoading } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (session && !isLoading) {
      router.replace('/dashboard')  // Already logged in, redirect
    }
  }, [session, isLoading])

  if (isLoading) return <LoadingSkeleton />
  return <LoginForm />
}
```

**Why this approach:**
- Cross-subdomain cookies are complex and defeat separation goals
- Simpler implementation, fewer edge cases
- Users clicking "Login" when already logged in just get redirected instantly

---

## API Authentication

The main API (`api.bundlenudge.com`) verifies JWTs from app-dashboard using a shared secret.

### How It Works
```
1. User logs in at app.bundlenudge.com
2. Better Auth issues JWT (signed with BETTER_AUTH_SECRET)
3. User makes API call with Authorization: Bearer <jwt>
4. API verifies JWT signature using same BETTER_AUTH_SECRET
5. API extracts user ID from JWT payload
```

### API Token Verification (Shared Database Approach)

The API connects to the same Neon database as app-dashboard for session verification. This is simpler and has no extra network hops.

```typescript
// packages/api/src/lib/auth.ts
import { betterAuth } from 'better-auth'
import { drizzle } from 'drizzle-orm/neon-http'

// API uses same auth database as app-dashboard
export const auth = betterAuth({
  database: drizzle(process.env.APP_AUTH_DATABASE_URL),
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days (must match app-dashboard)
  },
})

// packages/api/src/middleware/auth.ts
import { auth } from '../lib/auth'

export async function authMiddleware(c: Context, next: Next) {
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  })

  if (!session) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  c.set('user', session.user)
  c.set('session', session.session)

  return next()
}
```

### Environment Setup
```env
# packages/api/.env
APP_AUTH_DATABASE_URL=postgresql://...@neon.tech/bundlenudge_app_auth
```

**Why Shared DB:**
- No extra network hop (faster)
- Single source of truth for sessions
- Better Auth handles all verification logic
- Simpler implementation

**Security Note:** Admin-dashboard uses a completely different database (`bundlenudge_admin_auth`). The API does NOT verify admin sessions - admin actions go through separate admin-only API routes if needed.

---

## Phases

### Phase 0: Preparation (Prerequisites)
**Duration:** 1 day
**Goal:** Set up infrastructure for the split

#### Tasks
- [ ] Create two new Neon databases: `bundlenudge_app`, `bundlenudge_admin`
- [ ] Set up Vercel/Cloudflare projects for both subdomains
- [ ] Configure DNS for `app.bundlenudge.com` and `admin.bundlenudge.com`
- [ ] Document all shared components currently in use
- [ ] Audit current auth flows and identify dependencies

#### Deliverables
- Two empty Neon databases with connection strings
- DNS records pointing to placeholder pages
- Component dependency graph
- Auth flow documentation

#### Success Criteria
- Both subdomains resolve (can show "Coming Soon")
- Database connections verified
- Clear list of 50+ shared components identified

---

### Phase 1: Shared UI Package
**Duration:** 1-2 days
**Goal:** Extract shared components into a reusable package

#### Tasks
- [ ] Create `packages/shared-ui` with proper package.json
- [ ] Move all `components/ui/*` to shared-ui
- [ ] Move shared utilities (`lib/utils.ts`, `lib/formatters.ts`)
- [ ] Move shared types that both apps need
- [ ] Set up build pipeline (tsup or unbuild)
- [ ] Update imports in existing dashboard (temporary)
- [ ] Write basic smoke tests

#### Deliverables
- `@bundlenudge/shared-ui` package
- Exported components: Button, Card, Input, Dialog, Table, Badge, etc.
- Exported utilities: `cn()`, `formatDate()`, `formatRelativeTime()`
- Build outputs: ESM + CJS + TypeScript declarations

#### File Structure
```
packages/shared-ui/
├── src/
│   ├── components/
│   │   ├── ui/
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── input.tsx
│   │   │   ├── table.tsx
│   │   │   └── index.ts
│   │   └── shared/
│   │       ├── ErrorState.tsx
│   │       ├── EmptyState.tsx
│   │       └── index.ts
│   ├── lib/
│   │   ├── utils.ts
│   │   └── formatters.ts
│   └── index.ts
├── package.json
├── tsconfig.json
└── tsup.config.ts
```

#### Success Criteria
- Package builds without errors
- All UI components render correctly
- No circular dependencies
- Existing dashboard still works with new imports

---

### Phase 1B: Landing Page Package
**Duration:** 1 day
**Goal:** Extract landing/marketing pages to standalone package

#### Tasks
- [ ] Create `packages/landing` Next.js app
- [ ] Move landing page routes: `/`, `/pricing`, `/docs`, `/contact`
- [ ] Move landing components: Hero, Navbar, Footer, Features, Pricing, etc.
- [ ] Implement auth status check for navbar
- [ ] Configure environment variables
- [ ] Deploy to bundlenudge.com

#### Routes
```
/                → Landing page
/pricing         → Pricing page
/docs            → Documentation (or redirect to docs.bundlenudge.com)
/contact         → Contact page
/blog            → Blog (optional)
/changelog       → Changelog (optional)
```

#### Deliverables
- `packages/landing` Next.js app
- Static navbar with Login/Signup links to app.bundlenudge.com
- Deployment to bundlenudge.com

#### Success Criteria
- Landing page loads fast (<1s LCP)
- All marketing pages render correctly
- Links to app.bundlenudge.com work
- SEO preserved (meta tags, sitemap)

---

### Phase 2: App Dashboard Extraction
**Duration:** 2-3 days
**Goal:** Create standalone app dashboard at app.bundlenudge.com

#### Tasks
- [ ] Create `packages/app-dashboard` Next.js app
- [ ] Copy user-facing routes: `/dashboard/[accountId]/*`
- [ ] Copy user-specific components: `apps/`, `releases/`, `teams/`, etc.
- [ ] Set up Better Auth with standard configuration
- [ ] Configure Neon database connection
- [ ] Set up API client pointing to main API
- [ ] Implement auth pages: login, signup, forgot-password
- [ ] Configure environment variables
- [ ] Test all user flows end-to-end

#### Routes to Migrate
```
/                           → Landing/redirect
/login                      → Auth
/sign-up                    → Auth
/forgot-password            → Auth
/dashboard/[accountId]      → Main dashboard
/dashboard/[accountId]/apps/*
/dashboard/[accountId]/teams/*
/dashboard/[accountId]/settings/*
/dashboard/[accountId]/billing/*
/dashboard/[accountId]/uploads/*
```

#### Deliverables
- Fully functional app dashboard
- Separate Better Auth instance
- All user flows working
- Deployment to app.bundlenudge.com

#### Success Criteria
- Users can sign up, log in, manage apps
- All existing functionality preserved
- No references to admin routes
- Performance equal or better than current

---

### Phase 3: Admin Dashboard Extraction
**Duration:** 2-3 days
**Goal:** Create standalone admin dashboard at admin.bundlenudge.com

#### Tasks
- [ ] Create `packages/admin-dashboard` Next.js app
- [ ] Copy admin routes: `/admin/*` → `/` (root)
- [ ] Copy admin components: `admin/*`
- [ ] Set up Better Auth with OTP-only configuration
- [ ] Implement email allowlist middleware
- [ ] Configure Neon database connection (admin DB)
- [ ] Create admin user seeding script
- [ ] Implement OTP login flow
- [ ] Set up audit logging for all admin actions
- [ ] Configure short session expiry (4 hours)

#### Routes to Migrate
```
/                           → Admin overview (was /admin)
/login                      → OTP login
/users/*                    → User management
/organizations/*            → Org management
/subscriptions              → Subscription management
/apps                       → All apps view
/builds                     → Build queue
/api-health                 → API monitoring
/storage                    → Storage stats
/logs                       → System logs
/database                   → DB management
/config                     → System config
/audit                      → Audit logs
/feature-flags              → Feature flags
/newsletter                 → Newsletter
/settings                   → Admin settings
```

#### Auth Implementation (OTP)
```typescript
// packages/admin-dashboard/src/lib/auth/config.ts
import { betterAuth } from 'better-auth'
import { emailOTP } from 'better-auth/plugins'

export const auth = betterAuth({
  database: process.env.ADMIN_DATABASE_URL,
  plugins: [
    emailOTP({
      sendOTP: async ({ email, otp }, ctx) => {
        // Check allowlist in database
        const allowed = await isEmailAllowed(email, ctx.db)
        if (!allowed) {
          throw new Error('Email not authorized for admin access')
        }
        // Send OTP via email service
        await sendAdminOTPEmail(email, otp)
      },
      otpLength: 6,
      expiresIn: 300, // 5 minutes
    }),
  ],
  session: {
    expiresIn: 60 * 60 * 4, // 4 hours
    updateAge: 60 * 60, // Update every hour
  },
})
```

#### Admin Bootstrap (First Admin Setup)

Since there are no existing users, we need a way to set up the first admin:

```bash
# Seed the first admin allowlist entry
pnpm --filter admin-dashboard db:seed
```

```typescript
// packages/admin-dashboard/scripts/seed.ts
import { db } from '../src/lib/db'
import { emailAllowlist } from '../src/lib/db/schema'

async function seed() {
  // Add initial allowed domain
  await db.insert(emailAllowlist).values({
    id: crypto.randomUUID(),
    emailPattern: '*@bundlenudge.com',
    addedBy: 'system',
    note: 'Initial setup - all company emails',
  })

  console.log('✅ Admin allowlist seeded')
}

seed()
```

#### Backup Codes (Prevent Lockout)

Generate backup codes on first successful login:

```typescript
// packages/admin-dashboard/src/lib/auth/backup-codes.ts
export async function generateBackupCodes(userId: string, db: Database) {
  const codes = Array.from({ length: 8 }, () =>
    crypto.randomUUID().slice(0, 8).toUpperCase()
  )

  // Store hashed codes
  await db.insert(backupCodes).values(
    codes.map(code => ({
      userId,
      codeHash: await hash(code),
      used: false,
    }))
  )

  return codes // Show to user ONCE, never stored in plain text
}
```

```
┌─────────────────────────────────────────┐
│  🔐 Save Your Backup Codes              │
│                                         │
│  Use these if you can't receive OTP:    │
│                                         │
│  1. A3F2-8D4E    5. K9M2-3P7Q          │
│  2. B7C1-9F3A    6. L4N8-2R6S          │
│  3. D5E4-2G8H    7. M1O5-7T9U          │
│  4. J6K3-1H5I    8. N8P4-6V2W          │
│                                         │
│  ⚠️  Each code can only be used once    │
│                                         │
│  [I've saved these codes]               │
└─────────────────────────────────────────┘
```

#### Deliverables
- Fully functional admin dashboard
- OTP-only authentication
- Email allowlist enforcement
- Audit logging for all actions
- Deployment to admin.bundlenudge.com

#### Success Criteria
- Only allowlisted emails can access
- OTP flow works reliably
- All admin functionality preserved
- Sessions expire after 4 hours
- All actions logged to audit table

---

### Phase 4: API CORS & Integration
**Duration:** 1 day
**Goal:** Update API to support all subdomains

#### Tasks
- [ ] Update CORS configuration in `packages/api`
- [ ] Add all subdomains to allowed origins
- [ ] **Update trustedOrigins in `packages/api/src/lib/auth.ts`** (currently missing admin)
- [ ] Implement subdomain-aware rate limiting
- [ ] Update webhook URLs if needed
- [ ] Test cross-origin requests from all apps
- [ ] Verify authentication flows work correctly

#### CORS Configuration
```typescript
// packages/api/src/middleware/cors.ts
const ALLOWED_ORIGINS = [
  'https://bundlenudge.com',
  'https://app.bundlenudge.com',
  'https://admin.bundlenudge.com',
  // Development
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
]
```

#### Update trustedOrigins (IMPORTANT)
```typescript
// packages/api/src/lib/auth.ts - Line 67-75 needs updating
trustedOrigins: [
  'https://bundlenudge.com',
  'https://app.bundlenudge.com',
  'https://admin.bundlenudge.com',  // ADD THIS
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
]
```

#### Deliverables
- Updated CORS middleware
- Both apps can communicate with API
- Rate limiting works per-subdomain

#### Success Criteria
- No CORS errors in production
- API accessible from both subdomains
- Rate limits applied correctly

---

### Phase 5: Cleanup & Deprecation
**Duration:** 1 day
**Goal:** Remove old code and finalize migration

#### Tasks
- [ ] Remove old `packages/dashboard` directory
- [ ] Update CI/CD pipelines
- [ ] Update documentation
- [ ] Set up redirects from old URLs
- [ ] Archive old database tables (if any)
- [ ] Update monitoring and alerting
- [ ] Announce migration to team

#### Redirects
```
bundlenudge.com/dashboard/* → app.bundlenudge.com/*
bundlenudge.com/admin/*     → admin.bundlenudge.com/*
```

#### Deliverables
- Clean monorepo without old dashboard
- Updated CI/CD for two apps
- Redirects in place
- Documentation updated

#### Success Criteria
- No dead code remaining
- All old URLs redirect properly
- Monitoring covers both apps
- Team informed and trained

---

## Do's and Don'ts

### Do's

| Category | Guideline |
|----------|-----------|
| **Security** | Keep admin auth completely separate from user auth |
| **Security** | Use short session expiry for admin (4 hours max) |
| **Security** | Log every admin action to audit table |
| **Security** | Implement backup codes for admin OTP recovery |
| **Security** | Share BETTER_AUTH_SECRET between app-dashboard and API only |
| **Code** | Extract shared components BEFORE splitting apps |
| **Code** | Use workspace dependencies (`workspace:*`) for shared-ui |
| **Code** | Keep API routes in the main API package (don't duplicate) |
| **Code** | Keep landing page simple - no cross-subdomain auth checks |
| **Testing** | Write integration tests for auth flows |
| **Testing** | Test OTP email delivery in staging |
| **Deployment** | Deploy shared-ui first, then apps |
| **Deployment** | Run admin seed script before first admin login |

### Don'ts

| Category | Anti-pattern |
|----------|--------------|
| **Security** | Don't share session tokens between subdomains |
| **Security** | Don't allow password auth for admin |
| **Security** | Don't store admin credentials in user database |
| **Security** | Don't try cross-subdomain cookie sharing (complexity not worth it) |
| **Code** | Don't copy-paste components (use shared-ui) |
| **Code** | Don't create duplicate API clients |
| **Code** | Don't hardcode URLs (use environment variables) |
| **Code** | Don't add auth status checks to landing page |
| **Database** | Don't share database connections between apps |
| **Database** | Don't put user data in admin database |
| **Deployment** | Don't deploy both apps simultaneously on first release |
| **Deployment** | Don't remove old routes until redirects are verified |

---

## Failure Scenarios & Mitigations

### Scenario 1: OTP Emails Not Delivered
**Risk:** Admin users can't log in
**Mitigation:**
- Use reliable email provider (Resend, Postmark)
- Implement backup OTP via SMS (optional)
- Have super-admin backdoor (time-limited, logged)
- Monitor email delivery rates

### Scenario 2: Shared UI Breaking Changes
**Risk:** Both apps break simultaneously
**Mitigation:**
- Version shared-ui package semantically
- Pin versions in app dependencies
- Run visual regression tests
- Deploy shared-ui changes gradually

### Scenario 3: CORS Misconfiguration
**Risk:** Apps can't communicate with API
**Mitigation:**
- Test CORS in staging environment first
- Have rollback plan for API changes
- Monitor for CORS errors in production
- Keep old origins in allowlist during transition

### Scenario 4: Session/Auth Issues
**Risk:** Users logged out unexpectedly
**Mitigation:**
- Test auth flows extensively in staging
- Keep old auth system running during migration
- Implement graceful session migration
- Have clear error messages for auth failures

### Scenario 5: Database Migration Failures
**Risk:** Data loss or corruption
**Mitigation:**
- Admin DB is new (no migration needed)
- App DB inherits existing data (no migration)
- Take backups before any schema changes
- Test with production data snapshot

---

## Milestones & Timeline

```
Week 1: Foundation
├── Day 1: Phase 0 (Preparation)
│   └── Milestone M1: Infrastructure ready (DBs, DNS)
├── Day 2-3: Phase 1 (Shared UI) + Wave 1-2
│   └── Milestone M2: @bundlenudge/shared-ui published
└── Day 4-5: Phase 1B (Landing) + Wave 3
    └── Milestone M3: bundlenudge.com live

Week 2: Dashboards
├── Day 1-3: Phase 2 (App Dashboard) + Wave 4
│   └── Milestone M4: app.bundlenudge.com live (beta)
└── Day 4-5: Phase 3 (Admin Dashboard) + Wave 5
    └── Milestone M5: admin.bundlenudge.com live (internal)

Week 3: Integration & Polish
├── Day 1-2: Phase 4 (API Integration) + Wave 6
│   └── Milestone M6: All 3 sites fully functional
├── Day 3: Phase 5 (Cleanup)
│   └── Milestone M7: Migration complete
└── Day 4-5: Buffer for issues + documentation
```

### Key Milestones

| Milestone | Target | Success Metric |
|-----------|--------|----------------|
| M1: Infra Ready | Day 1 | Neon DBs created, DNS configured, Vercel projects set up |
| M2: Shared UI | Day 3 | Package builds, all components exported, imports work |
| M3: Landing Live | Day 5 | bundlenudge.com serves marketing pages, auth check works |
| M4: App Dashboard Beta | Day 8 | Users can sign up, log in, manage apps at app.bundlenudge.com |
| M5: Admin Dashboard Internal | Day 10 | Team can access with OTP at admin.bundlenudge.com |
| M6: Full Integration | Day 12 | All 3 sites work with API, CORS configured |
| M7: Migration Complete | Day 13 | Old dashboard removed, redirects active, docs updated |

---

## Subagent Orchestration Plan

### Wave 1: Foundation (4 agents parallel)
**Goal:** Create package scaffolds and infrastructure

```
Agent 1: Create shared-ui package structure + tsup build config
Agent 2: Set up landing package scaffold
Agent 3: Set up app-dashboard Next.js scaffold + Better Auth config
Agent 4: Set up admin-dashboard Next.js scaffold + OTP auth config
```

**Deliverables:** 4 runnable Next.js apps + 1 library package

---

### Wave 2: Shared UI Extraction (4 agents parallel)
**Goal:** Extract all shared components into @bundlenudge/shared-ui

```
Agent 1: Extract UI primitives (Button, Card, Input, Dialog, Table, Badge)
Agent 2: Extract form components (Select, Checkbox, Switch, Slider, Textarea)
Agent 3: Extract shared components (ErrorState, EmptyState, Avatar, Skeleton)
Agent 4: Extract utilities (cn, formatters) + build + test imports
```

**Deliverables:** Published @bundlenudge/shared-ui with all components

---

### Wave 3: Landing Page (2 agents parallel)
**Goal:** Complete landing page at bundlenudge.com

```
Agent 1: Migrate landing routes (/, /pricing, /contact) + page components
Agent 2: Migrate landing components (Hero, Navbar, Footer, Features, Pricing) + deploy config
```

**Deliverables:** Fully functional bundlenudge.com (static marketing pages)

---

### Wave 4: App Dashboard (4 agents parallel)
**Goal:** Complete app dashboard at app.bundlenudge.com

```
Agent 1: Migrate auth pages (login, signup, forgot-password) + Better Auth setup
Agent 2: Migrate API client, hooks, and lib utilities
Agent 3: Migrate core routes (dashboard, apps/*, releases/*, builds/*)
Agent 4: Migrate settings routes (teams/*, settings/*, billing/*, uploads/*)
```

**Deliverables:** Fully functional app.bundlenudge.com

---

### Wave 5: Admin Dashboard (4 agents parallel)
**Goal:** Complete admin dashboard at admin.bundlenudge.com

```
Agent 1: Implement OTP auth + email allowlist (DB-managed) + backup codes
Agent 2: Migrate overview + stats pages
Agent 3: Migrate admin routes (users/*, organizations/*, subscriptions)
Agent 4: Migrate system routes (config, logs, audit, feature-flags, storage)
```

**Deliverables:** Fully functional admin.bundlenudge.com with OTP-only auth

---

### Wave 6: Integration & Polish (4 agents parallel)
**Goal:** Connect everything and clean up

```
Agent 1: Update API CORS + trustedOrigins for all 3 subdomains
Agent 2: Set up URL redirects (old → new) + update sitemap
Agent 3: Update CI/CD pipelines for 4 packages + deploy scripts
Agent 4: Remove old dashboard package + update documentation
```

**Deliverables:** Complete migration, old code removed

---

### Summary

| Wave | Agents | Duration |
|------|--------|----------|
| 1: Foundation | 4 | Day 1 |
| 2: Shared UI | 4 | Day 2 |
| 3: Landing | 2 | Day 3 |
| 4: App Dashboard | 4 | Day 4-5 |
| 5: Admin Dashboard | 4 | Day 6-7 |
| 6: Integration | 4 | Day 8 |

**Total: 22 agent tasks (~1.5 weeks)**

---

## Environment Variables

### Landing Page (bundlenudge.com)
```env
# App URL (for Login/Signup links)
NEXT_PUBLIC_APP_URL=https://app.bundlenudge.com

# Analytics (optional)
NEXT_PUBLIC_POSTHOG_KEY=xxx

# No API URL needed - landing page is purely static marketing
```

### App Dashboard (app.bundlenudge.com)
```env
# Database (auth only)
DATABASE_URL=postgresql://...@neon.tech/bundlenudge_app_auth

# Auth
BETTER_AUTH_SECRET=app-secret-xxx
BETTER_AUTH_URL=https://app.bundlenudge.com

# API
NEXT_PUBLIC_API_URL=https://api.bundlenudge.com

# OAuth
GITHUB_CLIENT_ID=xxx
GITHUB_CLIENT_SECRET=xxx
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx

# Email (for verification, password reset)
RESEND_API_KEY=xxx
EMAIL_FROM=noreply@bundlenudge.com
```

### Admin Dashboard (admin.bundlenudge.com)
```env
# Database (auth + audit + allowlist)
DATABASE_URL=postgresql://...@neon.tech/bundlenudge_admin_auth

# Auth (OTP only - no OAuth)
BETTER_AUTH_SECRET=admin-secret-xxx
BETTER_AUTH_URL=https://admin.bundlenudge.com

# API
NEXT_PUBLIC_API_URL=https://api.bundlenudge.com

# Email (for OTP)
RESEND_API_KEY=xxx
OTP_FROM_EMAIL=admin@bundlenudge.com

# Security
SESSION_EXPIRY_HOURS=4
# Note: Email allowlist is stored in database, not env vars
```

### API (api.bundlenudge.com)
```env
# Existing D1/R2/KV bindings unchanged

# Auth verification (must match app-dashboard!)
BETTER_AUTH_SECRET=same-as-app-dashboard-secret

# CORS
ALLOWED_ORIGINS=https://bundlenudge.com,https://app.bundlenudge.com,https://admin.bundlenudge.com
```

---

## Admin Email Allowlist (Database-Managed)

The email allowlist is stored in the admin database, not hardcoded:

### Schema
```sql
-- packages/admin-dashboard/drizzle/schema.ts
CREATE TABLE email_allowlist (
  id TEXT PRIMARY KEY,
  email_pattern TEXT NOT NULL,  -- e.g., "*@bundlenudge.com" or "contractor@gmail.com"
  added_by TEXT NOT NULL,
  added_at TIMESTAMP DEFAULT NOW(),
  note TEXT  -- e.g., "Contractor - Project X"
);
```

### Management UI
```
/settings/allowlist → Admin UI to manage allowed emails
  - Add email/pattern
  - Remove email/pattern
  - View audit log of changes
```

### Auth Check
```typescript
// packages/admin-dashboard/src/lib/auth/allowlist.ts
export async function isEmailAllowed(email: string, db: Database): Promise<boolean> {
  const patterns = await db.query.emailAllowlist.findMany()

  return patterns.some(({ emailPattern }) => {
    if (emailPattern.startsWith('*@')) {
      // Wildcard domain match
      const domain = emailPattern.slice(2)
      return email.endsWith(`@${domain}`)
    }
    // Exact match
    return email.toLowerCase() === emailPattern.toLowerCase()
  })
}
```

---

## Testing Checklist

### App Dashboard
- [ ] User can sign up with email/password
- [ ] User can sign up with GitHub OAuth
- [ ] User can sign up with Google OAuth
- [ ] User can log in with existing credentials
- [ ] User can reset password
- [ ] User can create and manage apps
- [ ] User can create and manage releases
- [ ] User can manage team members
- [ ] User can view billing and upgrade
- [ ] User can update settings
- [ ] Session persists across page refreshes
- [ ] Session expires after 7 days

### Admin Dashboard
- [ ] Non-allowlisted email is rejected
- [ ] Allowlisted email receives OTP
- [ ] Invalid OTP is rejected
- [ ] Expired OTP is rejected
- [ ] Valid OTP grants access
- [ ] Session expires after 4 hours
- [ ] All admin pages accessible
- [ ] User management works (view, edit, disable)
- [ ] Org management works
- [ ] Feature flags work
- [ ] Audit log captures all actions
- [ ] System config can be updated

---

## Local Development

### Running All Apps
```bash
# Terminal 1: Shared UI (watch mode)
pnpm --filter @bundlenudge/shared-ui dev

# Terminal 2: Landing (port 3000)
pnpm --filter landing dev

# Terminal 3: App Dashboard (port 3001)
pnpm --filter app-dashboard dev

# Terminal 4: Admin Dashboard (port 3002)
pnpm --filter admin-dashboard dev

# Or use turbo to run all at once:
pnpm dev:all
```

### Local URLs
```
http://localhost:3000  → Landing page
http://localhost:3001  → App dashboard
http://localhost:3002  → Admin dashboard
http://localhost:8787  → API (wrangler)
```

### Local Environment Files
```
packages/landing/.env.local
packages/app-dashboard/.env.local
packages/admin-dashboard/.env.local
```

### Turbo Config (package.json)
```json
{
  "scripts": {
    "dev:all": "turbo run dev --parallel --filter=landing --filter=app-dashboard --filter=admin-dashboard",
    "build:all": "turbo run build --filter=@bundlenudge/shared-ui --filter=landing --filter=app-dashboard --filter=admin-dashboard",
    "typecheck:all": "turbo run typecheck"
  }
}
```

---

## Rollback Plan

If critical issues arise:

1. **Immediate:** Switch DNS back to old dashboard
2. **Short-term:** Keep old dashboard running in parallel for 2 weeks
3. **Data:** No data migration needed (API remains unchanged)
4. **Communication:** Notify users via email if rollback needed

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| App Dashboard uptime | 99.9% | Vercel/monitoring |
| Admin Dashboard uptime | 99.5% | Vercel/monitoring |
| Auth success rate | >99% | Better Auth logs |
| OTP delivery rate | >98% | Email provider stats |
| Page load time | <2s | Core Web Vitals |
| Zero security incidents | 0 | Security monitoring |

---

## Appendix: File Counts (Estimated)

| Package | Files | Components | Routes | Purpose |
|---------|-------|------------|--------|---------|
| shared-ui | ~35 | ~30 | 0 | UI primitives + utilities |
| landing | ~25 | ~15 | ~5 | Marketing pages |
| app-dashboard | ~80 | ~50 | ~25 | Customer dashboard |
| admin-dashboard | ~50 | ~30 | ~20 | Internal admin |

**Total new structure:** ~190 files across 4 packages

### Package Dependencies
```
@bundlenudge/shared-ui     ← No dependencies (leaf package)
     ↑
     ├── packages/landing
     ├── packages/app-dashboard
     └── packages/admin-dashboard
```

### Build Order
1. `@bundlenudge/shared` (types)
2. `@bundlenudge/shared-ui` (components)
3. `packages/landing`, `packages/app-dashboard`, `packages/admin-dashboard` (parallel)
