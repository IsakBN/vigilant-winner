# Fix Verification Failure Prompt

## Context

Verification failed. You must fix the issue before continuing.

**Package**: {{PACKAGE}}
**Failed Step**: {{FAILED_STEP}}
**Error**: {{ERROR}}
**File**: {{FILE}}

## Failure Analysis

Read the error carefully and identify:

1. **What failed** - TypeScript, tests, lint, build, or quality audit?
2. **Root cause** - What specifically is wrong?
3. **Fix approach** - What's the minimal fix?

## Common Fixes

### TypeScript Errors

```typescript
// ❌ Type error: 'string' not assignable to 'number'
const id: number = params.id;  // params.id is string

// ✅ Fix: Parse or validate
const id = Number(params.id);
// or
const id = z.coerce.number().parse(params.id);
```

### Test Failures

```typescript
// ❌ Expected X but got Y
// Usually means implementation doesn't match spec

// ✅ Fix: Either fix implementation or update test
// Prefer fixing implementation unless test is wrong
```

### Lint Errors

```typescript
// ❌ Unused variable
const unused = getValue();

// ✅ Fix: Remove or use it
// If intentionally unused: const _unused = getValue();
```

### Quality Audit Failures

```typescript
// ❌ File over 250 lines
// ✅ Fix: Split into multiple files

// ❌ Found 'any' type
// ✅ Fix: Replace with proper type or 'unknown'

// ❌ Found console.log
// ✅ Fix: Remove or use logger

// ❌ Found silent catch
// ✅ Fix: Add error handling
```

## Instructions

1. Make the **minimal fix** - Don't refactor unrelated code
2. Re-run verification: `./scripts/verify.sh {{PACKAGE}}`
3. If still failing, analyze new error
4. Repeat until passing

## Retry Limits

- Maximum 3 attempts per issue
- If still failing after 3 attempts:
  1. Create detailed error log in `.claude/failures/`
  2. Create checkpoint
  3. Pause loop with `.claude/STOP`

## After Fixing

1. Run full verification: `./scripts/verify.sh {{PACKAGE}}`
2. Commit the fix
3. Continue to next task
