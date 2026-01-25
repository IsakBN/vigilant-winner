# Interrogation Scope

## Project Overview

| Attribute | Value |
|-----------|-------|
| Project | BundleNudge |
| Type | Full rebuild from reference |
| Reference | /Users/isaks_macbook/Desktop/Dev/codepush |
| Target | /Users/isaks_macbook/Desktop/Dev/bundlenudge |
| License | BSL 1.1 (5 years → Apache 2.0) |

---

## Packages to Rebuild

| # | Package | Priority | Est. Complexity | Dependencies |
|---|---------|----------|-----------------|--------------|
| 1 | @bundlenudge/shared | P0 | Low | None |
| 2 | @bundlenudge/api | P0 | High | shared |
| 3 | @bundlenudge/sdk | P0 | Medium | shared |
| 4 | @bundlenudge/dashboard | P1 | Medium | shared, api types |
| 5 | @bundlenudge/builder | P2 | Low | shared |
| 6 | @bundlenudge/worker | P2 | Low | shared |

**Priority Legend**:
- P0: Critical path, must complete first
- P1: Important, but can parallel with others
- P2: Lower priority, build last

---

## Features: Must Have vs Nice to Have

### Must Have (MVP)

| # | Feature | Package | Notes |
|---|---------|---------|-------|
| 1 | Update check endpoint | api | Core - POST /v1/updates |
| 2 | Bundle upload | api | Core - POST /v1/bundles |
| 3 | Bundle download | api | Core - GET /v1/bundles/:id |
| 4 | SDK update flow | sdk | checkForUpdate(), downloadAndApply() |
| 5 | Basic rollback | sdk, api | Automatic crash-triggered rollback |
| 6 | App management CRUD | api, dashboard | List, create, update, delete apps |
| 7 | Release management CRUD | api, dashboard | List, create, activate releases |
| 8 | Channel support | api | Production, staging, etc. |
| 9 | API key auth | api | SDK authentication via api_keys table |
| 10 | User auth | api, dashboard | Better-Auth session-based login |
| 11 | Device registration | api, sdk | Keyless device auth |
| 12 | Health checks | api, sdk | Event-based monitoring |
| 13 | Bundle verification | sdk | SHA-256 hash validation |

### Nice to Have (Post-MVP)

| # | Feature | Package | Reason to Defer |
|---|---------|---------|-----------------|
| 1 | A/B testing | api, sdk | Complex variant system |
| 2 | Staged rollouts | api | % based targeting |
| 3 | Delta updates | api, sdk | Bundle diffing optimization |
| 4 | Crash monitoring | api, sdk | Metrics aggregation |
| 5 | GitHub integration | api | Webhook + GitHub App |
| 6 | iOS/Android builds | api, worker | Build system complexity |
| 7 | Multi-org/teams | api, dashboard | Enterprise feature |
| 8 | Analytics dashboard | dashboard | Metrics visualization |
| 9 | Sentry/Bugsnag integration | sdk | Crash reporter tagging |
| 10 | Silent preloading | sdk | Background WiFi download |
| 11 | Scheduled releases | api | Cron-based activation |
| 12 | Allowlist/blocklist | api | Device targeting |

---

## Tech Stack Decisions (Locked)

| Layer | Choice | Rationale | Changeable? |
|-------|--------|-----------|-------------|
| Runtime | Cloudflare Workers | Reference uses it | No |
| Database | D1 (SQLite) | Reference uses it | No |
| Auth DB | Neon (Postgres) | Better-Auth requirement | No |
| Storage | R2 | Reference uses it | No |
| Cache | KV | Rate limiting | No |
| Queue | Cloudflare Queues | Priority upload processing | No |
| API Framework | Hono | Reference uses it | No |
| ORM | Drizzle | Reference uses it | No |
| Dashboard | Next.js 15 | Reference uses it | No |
| React | React 19 | Reference uses it | No |
| State | TanStack Query | Reference uses it | No |
| Styling | Tailwind CSS 4 | Reference uses it | No |
| Validation | Zod | Reference uses it | No |
| Testing | Vitest | Reference uses it | No |
| Auth | Better-Auth + Clerk | Reference uses it | No |

---

## Code Quality Constraints (Locked)

| Constraint | Value | Enforcement |
|------------|-------|-------------|
| Max lines per file | 250 | Quality audit |
| Max lines per function | 50 | Quality audit |
| Max nesting depth | 3 | Quality audit |
| Max parameters | 4 | Quality audit |
| Any types allowed | 0 | TypeScript strict |
| Default exports | 0 | ESLint |
| Console.log | 0 | Use logger |
| Test coverage | Per file | Colocated tests |

---

## Out of Scope

| Item | Reason |
|------|--------|
| Mobile app | Only SDK for React Native |
| Native iOS/Android apps | JS bundles only |
| Web app updates | React Native focus |
| Self-contained CLI | Dashboard-first |
| Webpack plugin | Metro bundler focus |
| Expo support | Standard RN first |

---

## Known Constraints

| Constraint | Impact | Mitigation |
|------------|--------|------------|
| Worker 1MB limit | Bundle processing size | Stream, chunk |
| Worker 128MB memory | Large bundle handling | Efficient processing |
| D1 regional | Single region latency | Accept for MVP |
| D1 500 writes/sec | High traffic writes | Queue batching |
| KV 1000 writes/sec | Rate limit tracking | Efficient keys |
| R2 no cross-account | Storage isolation | Single account |
| Free tier limits | Testing constraints | Use test account |

---

## API Route Categories

| Category | Routes | Priority |
|----------|--------|----------|
| Health | /, /health | P0 |
| Auth | /api/auth/*, /auth/* | P0 |
| Apps | /apps, /apps/:id | P0 |
| Releases | /releases, /releases/:id | P0 |
| SDK Updates | /v1/updates, /v1/bundles/:id | P0 |
| Bundle Upload | /v1/bundles, /v1/uploads | P0 |
| Devices | /v1/devices, /devices | P0 |
| Metrics | /v1/metrics/*, /metrics/* | P1 |
| Teams | /teams/* | P2 |
| Builds | /builds/* | P2 |
| Integrations | /apps/:id/integrations/* | P2 |
| Admin | /admin/* | P2 |
| Webhooks | /webhook, /webhooks | P2 |

---

## SDK Core Exports

| Export | Type | Priority |
|--------|------|----------|
| BundleNudge | Class | P0 |
| useBundleNudge | Hook | P0 |
| initialize | Function | P0 |
| checkForUpdate | Method | P0 |
| downloadAndApply | Method | P0 |
| markUpdateSuccessful | Method | P0 |
| clearUpdates | Method | P0 |
| getCurrentVersion | Method | P0 |
| getDeviceId | Method | P0 |
| startSession | Method | P1 |
| track | Method | P1 |
| getCurrentVariant | Method | P2 |
| preloadUpdate | Method | P2 |

---

## Database Tables

| Table | Purpose | Priority |
|-------|---------|----------|
| user, session, account | Better-Auth | P0 |
| users | App-specific user data | P0 |
| apps | Applications | P0 |
| api_keys | SDK authentication | P0 |
| releases | Bundle versions | P0 |
| channels | Deployment targets | P0 |
| device_pings | Device events | P0 |
| release_variants | A/B variants | P2 |
| device_variant_assignments | Variant tracking | P2 |
| variant_metrics* | Metrics aggregation | P2 |
| release_modules | Delta update modules | P2 |
| release_patches | Pre-computed patches | P2 |
| organizations | Team accounts | P2 |
| organization_members | Team membership | P2 |
| apple_credentials | iOS build creds | P2 |
| android_credentials | Android build creds | P2 |

---

## Middleware Stack

| Middleware | Purpose | Priority |
|------------|---------|----------|
| requestIdMiddleware | Request tracking | P0 |
| honoLogger | HTTP logging | P0 |
| CORS | Cross-origin access | P0 |
| Auth middleware | Session/JWT validation | P0 |
| Rate limiting | KV-based sliding window | P0 |
| Request size limits | 5MB default, 100MB uploads | P0 |
| Security headers | CSP, HSTS, etc. | P0 |
| metricsMiddleware | Analytics engine | P1 |

---

## Timeline Assumptions

| Phase | Est. Iterations | Cumulative |
|-------|-----------------|------------|
| Interrogation | - | - |
| shared | 15 | 15 |
| api | 165 | 180 |
| sdk | 50 | 230 |
| dashboard | 80 | 310 |
| builder | 20 | 330 |
| worker | 15 | 345 |

---

## Success Criteria

| Criteria | Measurement |
|----------|-------------|
| All packages build | `pnpm build` passes |
| All tests pass | `pnpm test` passes |
| Type check passes | `pnpm typecheck` passes |
| Lint passes | `pnpm lint` passes |
| Quality audit passes | No violations (250 lines, etc.) |
| SDK works E2E | RN app can check/download/apply updates |
| Dashboard functional | Can manage apps and releases |
| API matches reference | Same endpoints, same behavior |

---

## Questions for User (if any)

| # | Question | Options | Default |
|---|----------|---------|---------|
| 1 | Include E2E package? | Yes / No | No (defer) |
| 2 | Include CLI package? | Yes / No | No (defer) |
| 3 | Include dashboard-v2? | Yes / No | No (use v1) |
