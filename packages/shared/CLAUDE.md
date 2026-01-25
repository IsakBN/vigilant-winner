# @bundlenudge/shared

## Purpose

Shared TypeScript types, Zod schemas, and constants used across all BundleNudge packages. This is the foundation package with zero external dependencies.

## Reference

```
/Users/isaks_macbook/Desktop/Dev/codepush/packages/shared
```

## Tech Stack

- TypeScript (strict mode)
- Zod (schema validation)
- No runtime dependencies

## Directory Structure

```
packages/shared/
├── src/
│   ├── index.ts              # Re-exports everything
│   ├── schemas/
│   │   ├── app.ts            # App schemas
│   │   ├── release.ts        # Release schemas
│   │   ├── channel.ts        # Channel schemas
│   │   ├── update.ts         # Update check schemas
│   │   ├── upload.ts         # Upload job schemas
│   │   └── index.ts          # Schema exports
│   ├── types/
│   │   ├── api.ts            # API types
│   │   ├── sdk.ts            # SDK types
│   │   ├── subscription.ts   # Tier types
│   │   └── index.ts          # Type exports
│   ├── constants/
│   │   ├── errors.ts         # Error codes
│   │   ├── tiers.ts          # Subscription tier limits
│   │   ├── queues.ts         # Queue priorities
│   │   └── index.ts          # Constant exports
│   └── utils/
│       ├── version.ts        # Semver utilities
│       └── index.ts          # Utility exports
├── package.json
├── tsconfig.json
└── CLAUDE.md
```

## DO's

### Code Style

- Max 250 lines per file
- Max 50 lines per function
- Named exports only
- Zod for all validation schemas
- Infer types from Zod schemas

### Patterns

```typescript
// ✅ Define schema, infer type
export const AppSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  platform: z.enum(['ios', 'android']),
});

export type App = z.infer<typeof AppSchema>;

// ✅ Export from index
export { AppSchema, type App } from './schemas/app';

// ✅ Constants with as const
export const ERROR_CODES = {
  APP_NOT_FOUND: 'APP_NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
} as const;

export type ErrorCode = keyof typeof ERROR_CODES;
```

## DON'Ts

### Never

- No `any` types
- No runtime dependencies (keep pure)
- No default exports
- No circular imports
- No business logic (types only)

### Avoid

- Complex nested schemas (flatten)
- Overly generic types
- Type assertions (`as`)

## Key Files

| File | Purpose |
|------|---------|
| `src/index.ts` | All exports |
| `src/schemas/app.ts` | App entity schema |
| `src/schemas/release.ts` | Release entity schema |
| `src/schemas/update.ts` | Update check request/response |
| `src/constants/tiers.ts` | Subscription tier limits |
| `src/constants/queues.ts` | Queue priority mappings |

## Commands

```bash
# Build
pnpm --filter @bundlenudge/shared build

# Type check
pnpm --filter @bundlenudge/shared typecheck

# Test
pnpm --filter @bundlenudge/shared test
```

## Dependencies

**None** - This package has no external dependencies except Zod.

## Testing

- Framework: Vitest
- Focus: Schema validation edge cases
- Pattern: `schema.test.ts` per schema file

## Notes

- This package is imported by ALL other packages
- Changes here affect the entire codebase
- Keep it minimal and stable
- Version bumps here require version bumps everywhere
