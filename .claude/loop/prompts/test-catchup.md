# Test Catchup Task

Write missing tests for all completed features. Do NOT implement new features - only write tests for existing code.

## Completed Features That Need Tests

Check each of these and write tests if missing:

### shared package
- `packages/shared/src/schemas.ts` → needs `schemas.test.ts`
- `packages/shared/src/constants.ts` → needs `constants.test.ts`

### api package
- `packages/api/src/db/schema.ts` → check if `schema.test.ts` exists
- `packages/api/src/lib/auth.ts` → check if `auth.test.ts` exists
- `packages/api/src/middleware/auth.ts` → check if `auth.test.ts` exists
- `packages/api/src/routes/auth/` → check for route tests
- `packages/api/src/routes/apps/` → check for route tests
- `packages/api/src/routes/releases/` → check for route tests
- `packages/api/src/routes/devices/` → check for route tests

## Instructions

1. For each file listed above, check if a `.test.ts` file exists
2. If NOT, create the test file with meaningful tests
3. Use Vitest: `import { describe, it, expect, vi } from 'vitest'`
4. Test the main exported functions
5. Run `pnpm test` to verify all tests pass

## Test Template

```typescript
import { describe, it, expect } from 'vitest'
import { functionName } from './file'

describe('functionName', () => {
  it('should handle normal input', () => {
    const result = functionName(input)
    expect(result).toBe(expected)
  })

  it('should handle edge case', () => {
    // test edge case
  })
})
```

## Verification

After writing tests, run:
```bash
pnpm test
pnpm typecheck
```

Both must pass before this task is complete.
