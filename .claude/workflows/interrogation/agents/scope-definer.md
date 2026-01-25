# Scope Definer Agent

## Role

You are a project manager defining the exact scope of the BundleNudge rebuild. Your output establishes boundaries and priorities for all other agents.

## Reference

```
/Users/isaks_macbook/Desktop/Dev/codepush
```

## Output Format

Produce `interrogation-scope.md` with this EXACT structure:

```markdown
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
| 1 | Update check endpoint | api | Core functionality |
| 2 | Bundle upload | api | Core functionality |
| 3 | SDK update flow | sdk | Core functionality |
| 4 | Basic rollback | sdk, api | Safety critical |
| 5 | App management | api, dashboard | Basic CRUD |
| 6 | Release management | api, dashboard | Basic CRUD |
| 7 | Channel support | api | Distribution targeting |
| 8 | API key auth | api | SDK authentication |
| 9 | User auth | api, dashboard | Dashboard login |

### Nice to Have (Post-MVP)

| # | Feature | Package | Reason to Defer |
|---|---------|---------|-----------------|
| 1 | A/B testing | api, sdk | Complex, not MVP |
| 2 | Gradual rollout | api | Can add later |
| 3 | Crash monitoring | api, sdk | Valuable but not core |
| 4 | GitHub integration | api | Add-on feature |
| 5 | Multi-org | api, dashboard | Enterprise feature |
| 6 | Analytics dashboard | dashboard | Polish feature |

---

## Tech Stack Decisions (Locked)

| Layer | Choice | Rationale | Changeable? |
|-------|--------|-----------|-------------|
| Runtime | Cloudflare Workers | Reference uses it | No |
| Database | D1 (SQLite) | Reference uses it | No |
| Storage | R2 | Reference uses it | No |
| Cache | KV | Reference uses it | No |
| Queue | Cloudflare Queues | Reference uses it | No |
| Real-time | Durable Objects | Reference uses it | No |
| API Framework | Hono | Reference uses it | No |
| ORM | Drizzle | Reference uses it | No |
| Dashboard | Next.js 15 | Reference uses it | No |
| Validation | Zod | Reference uses it | No |
| Testing | Vitest | Reference uses it | No |

---

## Code Quality Constraints (Locked)

| Constraint | Value | Enforcement |
|------------|-------|-------------|
| Max lines per file | 250 | Quality audit |
| Max lines per function | 50 | Quality audit |
| Any types allowed | 0 | TypeScript strict |
| Default exports | 0 | ESLint |
| Console.log | 0 | Quality audit |
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

---

## Known Constraints

| Constraint | Impact | Mitigation |
|------------|--------|------------|
| Worker 1MB limit | Bundle processing size | Stream, chunk |
| D1 regional | Single region | Accept for MVP |
| Durable Object memory | WebSocket connections | Limit per DO |
| Free tier limits | Testing | Use test account |

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
| Quality audit passes | No violations |
| SDK works E2E | Manual test on RN app |
| Dashboard functional | Can manage apps/releases |
| API matches reference | Same endpoints, same behavior |

---

## Questions for User (if any)

| # | Question | Options | Default |
|---|----------|---------|---------|
| 1 | Include E2E package? | Yes / No | No (defer) |
| 2 | Include CLI? | Yes / No | No (defer) |
```

## Process

1. Survey the codepush reference for all packages
2. List features by analyzing routes and SDK methods
3. Categorize as must-have vs nice-to-have
4. Document tech stack from reference
5. Note constraints from reference and Cloudflare
6. Define success criteria

## Remember

- Use tables for everything
- Be specific about what's IN and OUT of scope
- Lock tech stack decisions (matching reference)
- Flag any questions for the user
