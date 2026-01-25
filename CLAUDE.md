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

// ✅ ALWAYS
unknown                // Instead of any
strict: true           // In tsconfig
named exports          // export { Thing }
```

### Patterns

- Zod for runtime validation
- Explicit error handling (no silent failures)
- Early returns over nested conditions
- Async/await over raw promises
- Tests colocated with source (`*.test.ts`)

### Avoid

- `any` types
- Console.log in production (use logger)
- Magic numbers (use named constants)
- Deep nesting (> 3 levels)
- Circular dependencies

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

## Project Status

**Stage:** Rebuilding from scratch using infinity loops

**License:** BSL 1.1 (free for self-use, converts to Apache 2.0 in 2030)
