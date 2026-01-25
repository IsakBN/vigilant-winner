# /verify Command

Run verification pipeline for BundleNudge packages.

## Usage

```bash
/verify              # Verify all packages
/verify api          # Verify specific package
/verify --quick      # Skip build step (faster)
/verify --quality    # Only run quality audit
/verify --fix        # Auto-fix lint issues
```

## Pipeline Stages

### 1. TypeScript Check

```bash
pnpm --filter @bundlenudge/$PKG typecheck
```

Validates:
- No type errors
- Strict mode enabled
- No implicit any
- Null checks pass

### 2. Tests

```bash
pnpm --filter @bundlenudge/$PKG test -- --run
```

Requirements:
- All tests pass
- Coverage meets threshold (if configured)
- No skipped tests in CI

### 3. Lint

```bash
pnpm --filter @bundlenudge/$PKG lint
```

Checks:
- ESLint rules
- Prettier formatting
- Import order

### 4. Build

```bash
pnpm --filter @bundlenudge/$PKG build
```

Validates:
- Compilation succeeds
- No build errors
- Output files generated

### 5. Quality Audit

```bash
./scripts/quality-audit.sh $PKG
```

Enforces:
- Max 250 lines per file
- Max 50 lines per function
- No `any` types
- No `console.log`
- No silent catch blocks
- No default exports

## Output Format

```
=== Verification Pipeline for api ===

[1/5] TypeScript Check
      ✅ PASS (0 errors)

[2/5] Tests
      ✅ PASS (47 tests, 0 failures)

[3/5] Lint
      ✅ PASS (0 warnings)

[4/5] Build
      ✅ PASS (built in 2.3s)

[5/5] Quality Audit
      ✅ PASS
      - Files: 35
      - Lines: 2847
      - Largest file: 198 lines (src/routes/apps.ts)
      - any count: 0
      - console.log count: 0

=== All checks passed ===
```

## Failure Output

```
=== Verification Pipeline for api ===

[1/5] TypeScript Check
      ❌ FAIL

      src/routes/apps.ts:47:10 - error TS2345:
        Argument of type 'string' is not assignable to parameter of type 'number'.

      Found 1 error.

=== Verification failed at step 1 ===
```

## Quick Mode

Skip build step for faster feedback during development:

```bash
/verify --quick api
```

Runs: typecheck → tests → lint → quality audit

## Quality-Only Mode

Just check code quality rules:

```bash
/verify --quality api
```

Runs only the quality audit script.

## Auto-Fix Mode

Automatically fix lint issues:

```bash
/verify --fix api
```

Runs `pnpm lint --fix` before verification.

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | All checks passed |
| 1 | TypeScript errors |
| 2 | Test failures |
| 3 | Lint errors |
| 4 | Build errors |
| 5 | Quality audit failures |

## Integration with Loop

The loop runs `/verify` after every iteration:

```
Iteration 47:
  Task: Implement src/routes/releases.ts
  Status: Complete

  Verification:
    [✅] typecheck
    [✅] tests
    [✅] lint
    [✅] build
    [✅] quality audit

  Result: PASS
  Committed: "loop: iteration 47 - releases routes"
```

If verification fails, the iteration is retried (up to 3 times).

## Package-Specific Notes

### api
- Requires wrangler types
- D1/R2/KV bindings must be typed
- Run `pnpm generate-types` first if bindings change

### sdk
- React Native environment mocked in tests
- No DOM APIs allowed
- Must work offline

### dashboard
- Next.js build validates pages
- Check for hydration mismatches
- Tailwind classes must be valid
