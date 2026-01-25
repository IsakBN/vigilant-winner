# BundleNudge Knowledge Base Index

> **Source of Truth for Autonomous Building**
>
> This index links all knowledge documents needed to build BundleNudge.
> Every agent MUST read relevant docs before implementing features.

---

## Quick Reference

| Document | Lines | What It Contains |
|----------|-------|------------------|
| [CURRENT_STATE.md](./CURRENT_STATE.md) | ~200 | **READ FIRST** - What exists vs what's needed |
| [API_FEATURES.md](./API_FEATURES.md) | 712 | All 180+ API endpoints, webhooks, crons |
| [IMPLEMENTATION_DETAILS.md](./IMPLEMENTATION_DETAILS.md) | 1396 | DB schema, auth flows, Stripe, encryption |
| [CODEBASE_DEEP_DIVE.md](./CODEBASE_DEEP_DIVE.md) | 1521 | Dashboard components, SDK classes, tests |
| [KNOWLEDGE.md](./KNOWLEDGE.md) | ~500 | SDK architecture, update flow, rollback |
| [PRODUCT.md](./PRODUCT.md) | 345 | Product overview, features, pricing |
| [QUALITY_RULES.md](./QUALITY_RULES.md) | 286 | Code quality rules, file limits |

**Total: ~4,900+ lines of documentation**

> **IMPORTANT:** Always read CURRENT_STATE.md first to understand what already exists.
> Do NOT recreate files that are already built.

---

## By Feature Area

### Authentication
- **API_FEATURES.md** → Section: 🔐 Authentication & Authorization
- **IMPLEMENTATION_DETAILS.md** → Section 2: Auth Flows
  - 2.1 Email/Password Signup
  - 2.2 GitHub OAuth
  - 2.3 Admin OTP Login
  - 2.4 Device Token (Keyless Auth)

### Billing & Subscriptions
- **API_FEATURES.md** → Section: 💳 Subscriptions & Billing
- **IMPLEMENTATION_DETAILS.md** → Section 4: Stripe Integration
  - Checkout flow
  - Webhook handling
  - Customer portal
  - Usage tracking

### Teams & Organizations
- **API_FEATURES.md** → Section: 👥 Teams/Organizations
- **IMPLEMENTATION_DETAILS.md** → Section 3: Team Invite Flow
  - OTP generation (bcrypt)
  - Email templates
  - Join flow

### SDK & Updates
- **API_FEATURES.md** → Section: 📲 SDK Endpoints
- **KNOWLEDGE.md** → SDK Architecture
  - Update check flow
  - Crash detection
  - Rollback mechanics
  - Storage layer

### Database
- **IMPLEMENTATION_DETAILS.md** → Section 1: Database Schema
  - D1 tables (SQLite)
  - Neon Postgres (Better Auth)
  - All indexes
  - Foreign keys

### Security
- **IMPLEMENTATION_DETAILS.md** → Section 5: Encryption Details
  - AES-256-GCM implementation
  - What's encrypted
  - Key derivation
- **IMPLEMENTATION_DETAILS.md** → Section 6: RBAC Permissions
  - Organization roles
  - Project-level roles
  - Middleware

### External Integrations
- **API_FEATURES.md** → Sections: GitHub, Webhooks, Crash Integrations
- **IMPLEMENTATION_DETAILS.md** → Section 8: Webhook Payloads
  - GitHub Push/App webhooks
  - Stripe webhooks
  - Resend webhooks
  - Build complete callback

### Environment & Deployment
- **IMPLEMENTATION_DETAILS.md** → Section 7: Environment Variables
  - All Cloudflare bindings
  - API keys
  - URLs

---

## Build Order (Recommended)

Based on dependencies, build in this order:

### Phase 1: Foundation
1. `shared/types` - Core type definitions
2. `api/database-schema` - D1 + Neon schema

### Phase 2: Authentication
3. `api/auth-setup` - Better Auth configuration
4. `api/middleware` - Auth, rate limiting, validation
5. `api/github-oauth` - OAuth flow

### Phase 3: Core App
6. `api/apps-crud` - App management
7. `api/releases-crud` - Release management
8. `api/devices` - Device registration (keyless auth)

### Phase 4: SaaS Features
9. `api/billing-stripe` - Stripe integration
10. `api/teams-crud` - Team management
11. `api/teams-invitations` - Email OTP invites
12. `api/teams-rbac` - Role permissions

### Phase 5: Integrations
13. `api/webhooks` - Slack/Discord outgoing
14. `api/crash-integrations` - Sentry/Bugsnag
15. `api/github-app` - GitHub App webhooks

### Phase 6: Admin
16. `api/admin-auth` - OTP login
17. `api/admin-users` - User management
18. `api/admin-subscriptions` - Subscription management

### Phase 7: Dashboard
19. `dashboard/auth-pages` - Login, signup, OAuth
20. `dashboard/app-pages` - App list, detail, settings
21. `dashboard/release-pages` - Release management
22. `dashboard/team-pages` - Team management
23. `dashboard/billing-pages` - Subscription, portal
24. `dashboard/admin-pages` - Admin panel

### Phase 8: SDK
25. `sdk/storage` - Bundle storage
26. `sdk/updater` - Update check/download
27. `sdk/crash-detector` - Crash monitoring
28. `sdk/rollback-manager` - Rollback logic
29. `sdk/public-api` - BundleNudge class

---

## Critical Rules (From QUALITY_RULES.md)

| Rule | Limit |
|------|-------|
| Max lines per file | 400 |
| Max lines per function | 50 |
| Max nesting depth | 3 |
| No `any` types | ✓ |
| No empty catch | ✓ |
| No magic strings | ✓ |

---

## Agent Instructions

Before implementing ANY feature:

1. **Read the relevant section** from this index
2. **Check dependencies** - what must exist first?
3. **Follow the schema** - use exact table/column names
4. **Match the API** - use exact endpoint paths
5. **Test your work** - `pnpm test && pnpm typecheck`

### Commands

```bash
# Validate everything
pnpm test && pnpm typecheck && pnpm lint

# Never run
pnpm dev  # ❌ Don't start dev servers
```

---

*Last updated: 2026-01-25*
