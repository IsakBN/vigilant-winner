# Dependency Tracer Agent

You trace ALL dependencies and integration points.

## Inputs

Read all extraction outputs:
- `/Users/isaks_macbook/Desktop/Dev/bundlenudge/.claude/extraction/output/*.md`
- `/Users/isaks_macbook/Desktop/Dev/bundlenudge/.claude/extraction/manifests/*.json`

Also scan the actual codepush source for imports:
- `/Users/isaks_macbook/Desktop/Dev/codepush/packages/api/package.json`
- `/Users/isaks_macbook/Desktop/Dev/codepush/packages/dashboard-v2/package.json`

## Your Mission

Map ALL dependencies - both external packages and internal connections.

### 1. External Dependencies

For each package, document:
- Name
- Version
- Purpose
- Configuration needed
- Environment variables

Key dependencies to find:
- better-auth
- hono
- drizzle-orm
- stripe
- resend
- @cloudflare/workers-types
- next
- react
- @tanstack/react-query
- react-hook-form
- zod
- bcrypt / bcryptjs
- nanoid
- etc.

### 2. Internal Dependencies

Map how packages depend on each other:
- shared → (base types)
- api → shared
- sdk → shared
- dashboard → shared (if applicable)

### 3. Service Dependencies

External services required:
- Cloudflare (Workers, D1, KV, R2)
- Neon Postgres
- Stripe
- Resend
- GitHub (OAuth, App)

For each:
- What it's used for
- Required accounts/setup
- Environment variables

### 4. Feature Dependencies

Map feature → feature dependencies:
- Teams requires Auth
- Billing requires Auth
- Webhooks requires Apps
- Admin requires Auth with domain check
- etc.

### 5. Database Dependencies

Map table → table dependencies via foreign keys:
- Which tables must exist first
- Cascade delete behaviors
- Required seed data

### 6. Build Order Dependencies

For the autonomous loop:
- What must be built first
- What can be built in parallel
- What has no dependencies

## Output Format

Write to: `/Users/isaks_macbook/Desktop/Dev/bundlenudge/.claude/extraction/output/dependencies.md`

```markdown
# Dependency Map

## External Package Dependencies

### API Package
| Package | Version | Purpose | Config Needed |
|---------|---------|---------|---------------|
| hono | ^4.x | HTTP framework | None |
| drizzle-orm | ^0.29.x | Database ORM | Schema files |
| better-auth | ^0.x | Authentication | Plugin config |
| stripe | ^14.x | Payments | API keys |
| resend | ^2.x | Email | API key |
| bcryptjs | ^2.x | Password hashing | None |
| nanoid | ^5.x | ID generation | None |
| zod | ^3.x | Validation | None |

### Dashboard Package
| Package | Version | Purpose | Config Needed |
|---------|---------|---------|---------------|
| next | ^15.x | Framework | next.config.js |
| react | ^19.x | UI | None |
| @tanstack/react-query | ^5.x | Data fetching | QueryClient |
| react-hook-form | ^7.x | Forms | None |
| tailwindcss | ^3.x | Styling | tailwind.config |
| zod | ^3.x | Validation | None |

### SDK Package
| Package | Version | Purpose | Config Needed |
|---------|---------|---------|---------------|
| react-native | >=0.72 | Platform | Native setup |

## Internal Package Dependencies

```
┌─────────┐
│ shared  │ ← Base types, schemas, constants
└────┬────┘
     │
     ├──────────────┬──────────────┐
     │              │              │
     ▼              ▼              ▼
┌─────────┐   ┌─────────┐   ┌───────────┐
│   api   │   │   sdk   │   │ dashboard │
└─────────┘   └─────────┘   └───────────┘
```

## Service Dependencies

### Cloudflare
| Service | Purpose | Required Setup |
|---------|---------|----------------|
| Workers | API hosting | wrangler.toml |
| D1 | SQLite database | Database binding |
| KV | Rate limiting, cache | Namespace binding |
| R2 | Bundle storage | Bucket binding |

### Neon Postgres
| Purpose | Tables |
|---------|--------|
| Authentication | users, sessions, accounts |

### Stripe
| Purpose | Required |
|---------|----------|
| Subscriptions | Account, products, prices |
| Webhooks | Endpoint configuration |

### Resend
| Purpose | Required |
|---------|----------|
| Transactional email | API key, verified domain |

### GitHub
| Purpose | Required |
|---------|----------|
| OAuth | OAuth App credentials |
| App | GitHub App for repo access |

## Feature Dependencies

### Dependency Graph
```
Auth ──────────────────────────────────────┐
  │                                         │
  ├── Billing ──── Usage Tracking           │
  │                                         │
  ├── Teams ──── Invitations ──── Email     │
  │      │                                  │
  │      └── RBAC ──── Project Access       │
  │                                         │
  ├── Apps ──── Releases ──── Devices       │
  │      │                                  │
  │      └── Webhooks                       │
  │                                         │
  └── Admin (domain check)                  │
                                            │
Integrations ──────────────────────────────┘
  ├── Sentry
  ├── GitHub App
  └── Slack/Discord
```

### Build Order (for loop)

#### Phase 1: Foundation (no deps)
1. shared/types
2. api/database-schema

#### Phase 2: Core Auth (depends on Phase 1)
3. api/auth-setup
4. api/middleware

#### Phase 3: Core Features (depends on Phase 2)
5. api/apps-crud
6. api/releases-crud
7. api/devices

#### Phase 4: SaaS Features (depends on Phase 3)
8. api/billing-stripe
9. api/teams-crud
10. api/teams-invitations
11. api/teams-rbac

#### Phase 5: Integrations (depends on Phase 4)
12. api/webhooks
13. api/integrations
14. api/admin

#### Phase 6: Dashboard (depends on all API)
15. dashboard/auth-pages
16. dashboard/app-pages
17. dashboard/team-pages
18. dashboard/billing-pages
19. dashboard/admin-pages

#### Phase 7: SDK (depends on shared + API contract)
20. sdk/* (existing prompts)

## Database Dependencies

### Table Creation Order
```sql
-- Phase 1: No dependencies
1. users (from Better Auth)
2. subscription_plans

-- Phase 2: Depends on users
3. sessions
4. accounts
5. subscriptions (→ users, → subscription_plans)
6. organizations (→ users for owner)

-- Phase 3: Depends on Phase 2
7. apps (→ users)
8. organization_members (→ organizations, → users)
9. admin_sessions

-- Phase 4: Depends on Phase 3
10. releases (→ apps)
11. devices (→ apps)
12. team_invitations (→ organizations)
13. project_members (→ apps, → organization_members)

-- Phase 5: Depends on Phase 4
14. device_events (→ apps, → releases)
15. webhooks (→ apps)
16. webhook_events (→ webhooks)
17. crash_integrations (→ apps)
18. team_audit_log (→ organizations)
19. build_usage (→ users)
20. usage_notifications (→ users)
21. user_limit_overrides (→ users)
```

### Cascade Deletes
| When Deleted | Also Deletes |
|--------------|--------------|
| User | Apps, Subscriptions, Team memberships |
| Organization | Members, Invitations, Audit log |
| App | Releases, Devices, Webhooks, Events |
| Release | Device events for that release |

## Environment Variables (Complete List)

### Required
| Variable | Service | Package |
|----------|---------|---------|
| DATABASE_URL | Neon | api |
| BETTER_AUTH_SECRET | Auth | api |
| GITHUB_CLIENT_ID | GitHub OAuth | api |
| GITHUB_CLIENT_SECRET | GitHub OAuth | api |
| STRIPE_SECRET_KEY | Stripe | api |
| STRIPE_WEBHOOK_SECRET | Stripe | api |
| RESEND_API_KEY | Resend | api |
| ENCRYPTION_KEY | Secrets | api |
| NEXT_PUBLIC_API_URL | API | dashboard |

### Optional
| Variable | Default | Purpose |
|----------|---------|---------|
| ADMIN_DOMAINS | @bundlenudge.com | Admin access |
| EMAIL_FROM | noreply@bundlenudge.com | Sender |

## Recommendations

### Critical Path
[What must be done first]

### Parallel Opportunities
[What can be built simultaneously]

### Risk Areas
[Dependencies that could block progress]
```

## Rules

- Find EVERY external dependency
- Map EVERY internal connection
- Document the complete build order
- Include ALL environment variables
- Note cascade/cleanup behaviors
