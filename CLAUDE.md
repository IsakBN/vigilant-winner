# BundleNudge

OTA updates for React Native. Push JavaScript changes directly to users without App Store review.

## Quick Reference

```bash
pnpm install        # Install all dependencies
pnpm dev            # Dev mode (all packages)
pnpm test           # Run all tests
pnpm typecheck      # Type check all packages
pnpm lint           # Lint all packages
pnpm build          # Build all packages
```

**Before Committing:** `pnpm test && pnpm typecheck && pnpm lint`

## Tech Stack

| Layer | Technology |
|-------|------------|
| API | Cloudflare Workers + Hono + Drizzle ORM |
| Database | Cloudflare D1 (SQLite) + Neon (Postgres) |
| Storage | Cloudflare R2 (bundles) + KV (rate limiting) |
| Auth | Better Auth + Clerk |
| Dashboard | Next.js 15 + React 19 + TanStack Query |
| SDK | React Native (0.72+) |
| Validation | Zod |
| Testing | Vitest |

## Packages

| Package | Description | Location |
|---------|-------------|----------|
| `@bundlenudge/api` | Cloudflare Workers API | `packages/api` |
| `@bundlenudge/sdk` | React Native SDK | `packages/sdk` |
| `@bundlenudge/shared` | Shared types | `packages/shared` |
| `dashboard` | Next.js dashboard | `packages/dashboard` |
| `builder` | Bundle builder | `packages/builder` |
| `worker` | Build worker | `packages/worker` |

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   RN App    │────▶│  API        │────▶│  R2 Storage │
│   (SDK)     │     │  (Worker)   │     │  (Bundles)  │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                    ┌──────┴──────┐
                    │             │
              ┌─────▼─────┐ ┌─────▼─────┐
              │ D1 (Meta) │ │ KV (Rate) │
              └───────────┘ └───────────┘
```

### Key Directories

- `packages/api/src/routes/` - API route handlers
- `packages/api/src/middleware/` - Auth, rate-limit, metrics
- `packages/api/src/lib/` - Core logic
- `packages/sdk/src/` - React Native update logic
- `packages/dashboard/src/app/` - Next.js app router pages

## Code Quality Rules

### File Limits (ENFORCED)

| Rule | Limit |
|------|-------|
| Max lines per file | 250 |
| Max lines per function | 50 |
| Max nesting depth | 3 |
| Max parameters | 4 |

### TypeScript (ENFORCED)

```typescript
// ❌ NEVER
any                    // No any types
as any                 // No type assertions to any
@ts-ignore             // No ignoring errors
export default         // No default exports
async () => { }        // No async without await
value!                 // No non-null assertions (use ?.  or if checks)
obj?.prop ?? default   // No unnecessary ?. or ?? on non-null values

// ✅ ALWAYS
unknown                // Instead of any
strict: true           // In tsconfig
named exports          // export { Thing }
String(num)            // When using numbers in template strings
```

### Lint Rules (Common Mistakes)

| Rule | Problem | Solution |
|------|---------|----------|
| `require-await` | `async` without `await` | Remove `async` or add await |
| `no-unnecessary-condition` | `?.` or `??` on non-null | Remove optional chain |
| `no-unsafe-member-access` | Accessing `any` props | Add type assertion |
| `no-non-null-assertion` | Using `!` operator | Use `?.` or null check |
| `restrict-template-expressions` | `${number}` | Use `${String(num)}` |
| `no-unused-vars` | Unused variable | Remove or prefix with `_` |

### Patterns

- Zod for runtime validation
- Explicit error handling (no silent failures)
- Early returns over nested conditions
- Async/await over raw promises
- Tests colocated with source (`*.test.ts`)
- Type `res.json()` calls: `(await res.json()) as { field: Type }`

### Avoid

- `any` types
- Console.log in production (use logger)
- Magic numbers (use named constants)
- Deep nesting (> 3 levels)
- Circular dependencies

## Resource Management (M4 Air)

**CRITICAL:** This machine has limited RAM. Prevent crashes by running tasks sequentially.

### Rules

| Rule | Reason |
|------|--------|
| Run ONE test suite at a time | `pnpm test` spawns 6+ Node processes |
| Run checks sequentially | `pnpm test && pnpm typecheck && pnpm lint` (NOT parallel) |
| Max 2 parallel agents | More than 2 executors = memory pressure |
| Close other apps | Especially Chrome and Docker |

### Verification Command (Sequential)

```bash
# Run one at a time, not in parallel
cd packages/api && pnpm test
cd packages/shared && pnpm test
pnpm typecheck
pnpm lint
```

### Agent Workflow (Slower Mode)

```
Wave Coordinator
    │
    ├──► Executor 1 ──► Wait ──► Auditor
    │
    ├──► Executor 2 ──► Wait ──► Auditor  (SEQUENTIAL, not parallel)
    │
    └──► Executor N ──► Wait ──► Auditor
```

## Reference Implementation

This project is being rebuilt from: `/Users/isaks_macbook/Desktop/Dev/codepush`

When implementing features, reference the codepush codebase for patterns and architecture.

## Skills Library

Available commands:

| Command | Description |
|---------|-------------|
| `/loop` | Start or resume infinity loop |
| `/checkpoint` | Save checkpoint |
| `/verify` | Run verification pipeline |
| `/ultra-think` | Multi-perspective analysis |

## Agent Hierarchy (MANDATORY)

When working on multi-task changes, ALWAYS use the hierarchical agent structure:

```
YOU (Launch PM)
    │
    └──► Wave Coordinator
            │
            ├──► Executor 1 ──► wait
            ├──► Executor 2 ──► wait   (SEQUENTIAL - max 2 at a time)
            └──► Executor N ──► wait
                    │
                    ▼
            ┌───────┴───────┐
            │   Auditors    │
            │  (one by one) │
            └───────────────┘
                    │
                    ▼
              GO/NO-GO Decision
```

### Rules

1. **Never execute tasks directly** - Spawn executor agents
2. **Max 2 parallel agents** - Prevents memory crashes on M4 Air
3. **Always run auditors** after each wave completes
4. **GO/NO-GO gate** - Don't proceed without passing audits
5. **Document everything** - Wave plans, audit reports, decisions

### Workflow Location

See `.claude/workflows/wave-remediation/workflow.md` for full details.

### Agent Prompts

- Wave Coordinator: `.claude/workflows/wave-remediation/agents/wave-coordinator.md`
- Security Auditor: `.claude/workflows/wave-remediation/agents/security-auditor.md`
- Integration Auditor: `.claude/workflows/wave-remediation/agents/integration-auditor.md`
- Performance Auditor: `.claude/workflows/wave-remediation/agents/performance-auditor.md`

## Project Status

**Stage:** Rebuilding with hierarchical agent orchestration

**Current Phase:** Wave-based remediation (post-audit fixes)

**License:** BSL 1.1 (free for self-use, converts to Apache 2.0 in 2030)
