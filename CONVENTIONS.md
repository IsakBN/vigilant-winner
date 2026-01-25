# Code Conventions

This document defines the coding standards for BundleNudge. All code must follow these conventions.

## File Limits

| Rule | Limit | Enforcement |
|------|-------|-------------|
| Max lines per file | 250 | CI fails |
| Max lines per function | 50 | CI fails |
| Max nesting depth | 3 | Lint rule |
| Max function parameters | 4 | Lint rule |

## TypeScript

### Strict Mode

All packages use TypeScript strict mode:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUncheckedIndexedAccess": true
  }
}
```

### Forbidden Patterns

```typescript
// NEVER use these - instant CI failure

any                    // Use unknown + type guards
as any                 // Fix the type properly
@ts-ignore             // Fix the type error
@ts-nocheck            // Never disable checking
// eslint-disable      // Fix the lint error
require()              // Use import
```

### Required Patterns

```typescript
// ALWAYS use these

// Named exports only
export { UserService };           // ✅
export default UserService;       // ❌

// Explicit return types on exports
export function getUser(): User   // ✅
export function getUser()         // ❌

// Const assertions for literals
const Status = { Active: 'active' } as const;  // ✅

// Unknown over any
function parse(data: unknown)     // ✅
function parse(data: any)         // ❌
```

## File Organization

### Single Responsibility

Each file should do ONE thing:

```
// ✅ Good
userService.ts        // User business logic
userRepository.ts     // User database access
userValidator.ts      // User input validation

// ❌ Bad
userUtils.ts          // Dumping ground
helpers.ts            // Vague purpose
common.ts             // Everything file
```

### Index Files

Index files are ONLY for re-exports:

```typescript
// ✅ Good: packages/sdk/src/index.ts
export { BundleNudge } from './bundlenudge';
export { checkForUpdate } from './updater';
export type { UpdateResult } from './types';

// ❌ Bad: logic in index file
export class BundleNudge {
  // 200 lines of code...
}
```

## Naming

### Variables and Functions

```typescript
// ✅ Descriptive names
const currentUser = getUser();
const isAuthenticated = checkAuth();
const handleFormSubmit = () => {};

// ❌ Vague or abbreviated
const x = getUser();
const usr = getUser();
const data = fetchData();
const doIt = () => {};
```

### Files and Directories

```
// ✅ kebab-case for files
user-service.ts
api-client.ts

// ✅ PascalCase for React components
UserProfile.tsx
AppHeader.tsx

// ❌ Mixed conventions
userService.ts
user_service.ts
```

## Error Handling

### Never Silent Failures

```typescript
// ❌ Silent catch
try { riskyOp(); } catch (e) {}
try { riskyOp(); } catch (e) { /* ignore */ }
.catch(() => {})

// ✅ Explicit handling
try {
  riskyOp();
} catch (error) {
  logger.error('Operation failed', { error });
  throw new AppError('OP_FAILED', { cause: error });
}
```

### Error Types

```typescript
// Define specific errors
export class NotFoundError extends Error {
  constructor(resource: string, id: string) {
    super(`${resource} not found: ${id}`);
    this.name = 'NotFoundError';
  }
}

// Use them
if (!user) {
  throw new NotFoundError('User', userId);
}
```

## Testing

### Colocated Tests

Tests live next to source files:

```
src/
├── updater.ts
├── updater.test.ts    // Tests for updater
├── storage.ts
└── storage.test.ts    // Tests for storage
```

### Test Naming

```typescript
describe('UserService', () => {
  describe('getUser', () => {
    it('returns user when found', async () => {});
    it('throws NotFoundError when not found', async () => {});
    it('caches result for subsequent calls', async () => {});
  });
});
```

### No Implementation Testing

```typescript
// ❌ Testing implementation
expect(mockDb.query).toHaveBeenCalledWith('SELECT...');

// ✅ Testing behavior
const user = await getUser('123');
expect(user.id).toBe('123');
```

## Comments

### When to Comment

```typescript
// ✅ Explain WHY, not WHAT
// We batch updates to avoid hitting rate limits
// on the downstream notification service.
const batched = chunk(updates, 100);

// ❌ Obvious comments
// Get the user
const user = getUser();

// Loop through items
for (const item of items) {}
```

### No TODO Without Context

```typescript
// ❌ Vague TODO
// TODO: fix later

// ✅ Specific with reference
// TODO(BN-123): Handle rate limit retry after API v2 migration
```

## Imports

### Order

```typescript
// 1. Node built-ins
import { readFile } from 'fs/promises';

// 2. External packages
import { Hono } from 'hono';
import { z } from 'zod';

// 3. Internal packages
import { schemas } from '@bundlenudge/shared';

// 4. Relative imports
import { UserService } from './services/user';
import type { User } from './types';
```

### No Namespace Imports

```typescript
// ❌ Namespace import
import * as utils from './utils';

// ✅ Named imports
import { formatDate, parseDate } from './utils';
```

## React (Dashboard)

### Component Size

```tsx
// ✅ Page component delegates to sub-components
export default function AppsPage() {
  return (
    <PageLayout>
      <PageHeader title="Apps" />
      <AppList />
    </PageLayout>
  );
}

// ❌ Everything in one component
export default function AppsPage() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  // ... 300 lines
}
```

### Hooks in Separate Files

```
hooks/
├── useApps.ts           // One hook per file
├── useReleases.ts
└── useAuth.ts
```

### No Prop Drilling

Use context or composition:

```tsx
// ❌ Prop drilling
<Parent user={user}>
  <Child user={user}>
    <Grandchild user={user} />
  </Child>
</Parent>

// ✅ Context
<UserProvider user={user}>
  <Parent>
    <Child>
      <Grandchild />  // Uses useUser()
    </Child>
  </Parent>
</UserProvider>
```

## API (Hono)

### Route Organization

```typescript
// One resource per file
// routes/apps.ts
export const appsRoutes = new Hono<Env>()
  .get('/', listApps)
  .get('/:id', getApp)
  .post('/', createApp)
  .patch('/:id', updateApp)
  .delete('/:id', deleteApp);
```

### Validation

```typescript
// Always validate with Zod
const CreateAppSchema = z.object({
  name: z.string().min(1).max(100),
  platform: z.enum(['ios', 'android']),
});

app.post('/', zValidator('json', CreateAppSchema), async (c) => {
  const body = c.req.valid('json');  // Typed!
  // ...
});
```

### Error Responses

```typescript
// Use HTTPException for errors
if (!app) {
  throw new HTTPException(404, { message: 'App not found' });
}

// Never return generic errors
// ❌ return c.json({ error: 'Something went wrong' });
```
