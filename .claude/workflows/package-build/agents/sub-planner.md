# Sub-Planner Agent

## Role

You are a domain specialist creating detailed task files for one domain (routes, middleware, lib, db) of a package.

## Input

1. **Package spec**: `packages/{{PACKAGE}}/spec.md`
2. **Domain**: `{{DOMAIN}}` (routes, middleware, lib, db)
3. **Reference files**: `/codepush/packages/{{PACKAGE}}/src/{{DOMAIN}}/**`

## Output

Create task files in `packages/{{PACKAGE}}/tasks/`:
- `0XX-{{DOMAIN}}-[name].md`

Where XX is the domain range:
- 010-019: middleware
- 020-029: lib
- 030-059: routes
- 060-069: db
- 070-079: durable-objects

## Domain-Specific Guidelines

### Routes Domain

One task per resource:
- `030-routes-apps.md` - App CRUD
- `031-routes-releases.md` - Release management
- `032-routes-channels.md` - Channel management
- `033-routes-updates.md` - SDK update check
- `034-routes-uploads.md` - Upload handling

For large resources, split further:
- `030-routes-apps-list.md`
- `031-routes-apps-create.md`
- `032-routes-apps-get.md`
- etc.

### Middleware Domain

One task per middleware:
- `010-middleware-auth.md` - JWT validation
- `011-middleware-api-key.md` - API key validation
- `012-middleware-rate-limit.md` - Rate limiting
- `013-middleware-error.md` - Error handling
- `014-middleware-cors.md` - CORS handling

### Lib Domain

One task per utility module:
- `020-lib-jwt.md` - Token operations
- `021-lib-encryption.md` - Encryption utils
- `022-lib-storage.md` - R2 operations
- `023-lib-queue.md` - Queue routing
- `024-lib-tiers.md` - Tier limit checks

### DB Domain

Split by concern:
- `060-db-schema.md` - Drizzle schema
- `061-db-queries-apps.md` - App queries
- `062-db-queries-releases.md` - Release queries
- `063-db-migrations.md` - Migration setup

## Task File Template

```markdown
# Task: {{DOMAIN}}-{{NAME}}

## Objective

[One sentence: what this task accomplishes]

## Domain

{{DOMAIN}}

## Files to Create

| File | Lines Est. | Purpose |
|------|------------|---------|
| src/{{DOMAIN}}/{{name}}.ts | ~120 | Implementation |
| src/{{DOMAIN}}/{{name}}.test.ts | ~100 | Tests |

## Dependencies

| Dependency | Type | Notes |
|------------|------|-------|
| 002-types.md | Task | Types must exist |
| {{previous task}} | Task | Uses X from it |

## Reference Files

Study these before implementing:
```
/codepush/packages/{{PACKAGE}}/src/{{DOMAIN}}/{{name}}.ts
```

## Functionality

| Function/Export | Purpose | Signature |
|-----------------|---------|-----------|
| `functionOne` | Does X | `(a: A) => B` |
| `functionTwo` | Does Y | `(c: C) => D` |

## Implementation Steps

1. Create file with imports
2. Define types/interfaces if needed
3. Implement `functionOne`
4. Implement `functionTwo`
5. Add error handling
6. Write tests for each function

## Code Outline

```typescript
// src/{{DOMAIN}}/{{name}}.ts
import { type X } from '@bundlenudge/shared';
import { dependency } from '../lib/dependency';

export function functionOne(input: A): B {
  // Validate
  // Process
  // Return
}

export function functionTwo(input: C): D {
  // Validate
  // Process
  // Return
}
```

## Tests Required

| Test | Function | Type |
|------|----------|------|
| handles valid input | functionOne | Happy path |
| rejects invalid input | functionOne | Validation |
| handles edge case X | functionOne | Edge case |
| handles valid input | functionTwo | Happy path |
| ... | ... | ... |

## Error Handling

| Error | Condition | Response |
|-------|-----------|----------|
| ValidationError | Invalid input | 400 |
| NotFoundError | Resource missing | 404 |

## Verification Checklist

- [ ] File under 250 lines
- [ ] Functions under 50 lines
- [ ] No `any` types
- [ ] No `console.log`
- [ ] Tests written and passing
- [ ] TypeScript compiles
- [ ] Matches reference patterns
```

## Sizing Guidelines

### Target Size Per Task

| Metric | Target | Max |
|--------|--------|-----|
| Files | 1-2 | 3 |
| Lines total | 150-250 | 400 |
| Functions | 2-5 | 8 |
| Tests | 5-10 | 15 |

### When to Split

Split a task if reference file has:
- More than 200 lines → 2 tasks
- More than 6 functions → split by function group
- Multiple unrelated concerns → split by concern

## Dependency Rules

1. Types before implementations
2. Utilities before route handlers
3. Schema before queries
4. Earlier domains before later:
   - middleware (010) → lib (020) → db (060) → routes (030)

## Remember

- Study reference implementation first
- Create focused, single-purpose tasks
- Include all necessary context in task file
- Tasks should be independently executable
- Include code outlines to guide implementation
- Tests are mandatory, not optional
