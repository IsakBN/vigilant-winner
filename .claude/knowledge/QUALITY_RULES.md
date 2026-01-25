# BundleNudge Quality Rules

## The 6 Unbreakable Rules

Every agent MUST follow these. No exceptions.

---

### Rule 1: No `any` Types

**Why**: `any` disables TypeScript's type checking, leading to runtime errors.

❌ **BAD:**
```typescript
function process(data: any) {
  return data.value  // Could crash at runtime
}

const items: any[] = []  // No type safety
```

✅ **GOOD:**
```typescript
interface Data {
  value: string
}

function process(data: Data): string {
  return data.value  // Type-safe
}

const items: string[] = []  // Type-safe
```

✅ **When type is truly unknown:**
```typescript
function process(data: unknown): string {
  if (typeof data === 'object' && data !== null && 'value' in data) {
    return String((data as { value: unknown }).value)
  }
  throw new Error('Invalid data')
}
```

**Verification:**
```bash
grep -rn ": any" packages/*/src/*.ts | grep -v test
# Must return nothing
```

---

### Rule 2: Files Under 400 Lines

**Why**: Large files are hard to understand, test, and maintain.

**If a file is too long, split it:**
- Extract types → `types.ts`
- Extract helpers → `helpers.ts` or `utils.ts`
- Extract constants → `constants.ts`
- Extract sub-components → separate component files

**Example split:**
```
// Before: user-service.ts (600 lines)

// After:
user-service/
├── index.ts        (main exports, ~50 lines)
├── types.ts        (interfaces, ~80 lines)
├── validation.ts   (Zod schemas, ~100 lines)
├── queries.ts      (database queries, ~150 lines)
└── helpers.ts      (utility functions, ~100 lines)
```

**Verification:**
```bash
wc -l packages/*/src/*.ts | awk '$1 > 400'
# Must return nothing (except total)
```

---

### Rule 3: Functions Under 50 Lines

**Why**: Long functions do too many things and are hard to test.

❌ **BAD:**
```typescript
async function processOrder(order: Order) {
  // 150 lines of validation, calculation,
  // database queries, notifications, logging...
}
```

✅ **GOOD:**
```typescript
async function processOrder(order: Order) {
  validateOrder(order)
  const total = calculateTotal(order)
  const savedOrder = await saveOrder(order, total)
  await notifyCustomer(savedOrder)
  return savedOrder
}

function validateOrder(order: Order): void { /* 10 lines */ }
function calculateTotal(order: Order): number { /* 15 lines */ }
async function saveOrder(order: Order, total: number) { /* 20 lines */ }
async function notifyCustomer(order: Order) { /* 10 lines */ }
```

---

### Rule 4: Maximum 3 Nesting Levels

**Why**: Deep nesting is hard to read and indicates complex logic that should be refactored.

❌ **BAD:**
```typescript
if (user) {
  if (user.isActive) {
    if (user.hasPermission) {
      if (user.subscription) {
        if (user.subscription.isValid) {
          // Finally do something
        }
      }
    }
  }
}
```

✅ **GOOD (Early Returns):**
```typescript
if (!user) return
if (!user.isActive) return
if (!user.hasPermission) return
if (!user.subscription) return
if (!user.subscription.isValid) return

// Do something - flat and readable
```

✅ **GOOD (Extract to function):**
```typescript
if (!canProcessUser(user)) return

function canProcessUser(user: User): boolean {
  return user?.isActive && user?.hasPermission && user?.subscription?.isValid
}
```

---

### Rule 5: No Empty Catch Blocks

**Why**: Empty catches swallow errors silently, making bugs impossible to debug.

❌ **BAD:**
```typescript
try {
  await riskyOperation()
} catch (e) {
  // Swallowed! You'll never know it failed
}
```

✅ **GOOD (Log and continue):**
```typescript
try {
  await riskyOperation()
} catch (e) {
  logger.error('riskyOperation failed', e)
  // Continue with fallback behavior
}
```

✅ **GOOD (Log and rethrow):**
```typescript
try {
  await riskyOperation()
} catch (e) {
  logger.error('riskyOperation failed', e)
  throw e  // Let caller handle it
}
```

✅ **GOOD (Transform error):**
```typescript
try {
  await riskyOperation()
} catch (e) {
  throw new AppError('Operation failed', { cause: e })
}
```

---

### Rule 6: No Magic Strings/Numbers

**Why**: Magic values cause typos and make code hard to understand.

❌ **BAD:**
```typescript
if (status === 'pending') { ... }
if (status === 'penidng') { ... }  // Typo - no error!

if (timeout > 30000) { ... }  // What does 30000 mean?
```

✅ **GOOD:**
```typescript
const STATUS = {
  PENDING: 'pending',
  ACTIVE: 'active',
  COMPLETED: 'completed',
} as const

type Status = typeof STATUS[keyof typeof STATUS]

if (status === STATUS.PENDING) { ... }  // Autocomplete + type-safe
```

```typescript
const TIMEOUT_MS = {
  SHORT: 5_000,
  MEDIUM: 30_000,
  LONG: 60_000,
} as const

if (timeout > TIMEOUT_MS.MEDIUM) { ... }  // Clear meaning
```

---

## BundleNudge-Specific Rules

### Naming: Always "BundleNudge", Never "CodePush"

- Product name: **BundleNudge**
- Native module: **BundleNudge**
- Class names: **BundleNudge**
- All user-facing text: **BundleNudge**

**Exception**: Deprecated aliases with `@deprecated` JSDoc for backwards compatibility.

```typescript
// ✅ Primary export
export class BundleNudge { ... }

// ✅ Deprecated alias (acceptable)
/** @deprecated Use BundleNudge instead */
export const CodePush = BundleNudge
```

**Verification:**
```bash
grep -ri "codepush" packages/ | grep -v "@deprecated" | grep -v node_modules
# Must return nothing
```

---

## Quick Reference Card

| Rule | Check Command |
|------|---------------|
| No `any` | `grep -rn ": any" packages/*/src/*.ts \| grep -v test` |
| Files < 400 | `wc -l packages/*/src/*.ts \| awk '$1 > 400'` |
| No CodePush | `grep -ri "codepush" packages/ \| grep -v deprecated` |
| No empty catch | `grep -rn "catch.*{[[:space:]]*}" packages/*/src/` |

**Run all checks:**
```bash
.claude/scripts/verify-quality.sh
```

---

## Before Completing ANY Task

1. ✅ Run `.claude/scripts/verify-quality.sh`
2. ✅ All checks must pass
3. ✅ Update PROGRESS.md
4. ✅ If checks fail, fix issues first
