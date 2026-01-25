# Write Tests Prompt

## Context

You are writing tests for BundleNudge.

**Package**: {{PACKAGE}}
**File to Test**: {{FILE_PATH}}
**Test File**: {{TEST_FILE_PATH}}

## Testing Standards

### Framework

- **Vitest** for all packages
- Colocated tests: `file.ts` → `file.test.ts`
- Use `describe`, `it`, `expect` from vitest

### Test Structure

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { functionToTest } from './file';

describe('functionToTest', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle normal case', () => {
    const result = functionToTest('input');
    expect(result).toBe('expected');
  });

  it('should handle edge case', () => {
    const result = functionToTest('');
    expect(result).toBe('default');
  });

  it('should throw on invalid input', () => {
    expect(() => functionToTest(null)).toThrow('Invalid input');
  });
});
```

### What to Test

1. **Happy path** - Normal expected behavior
2. **Edge cases** - Empty inputs, boundaries, limits
3. **Error cases** - Invalid inputs, failures
4. **Integration** - How components work together (if applicable)

### API Route Tests (packages/api)

```typescript
import { describe, it, expect } from 'vitest';
import { app } from '../index';

describe('GET /v1/apps', () => {
  it('returns apps for authenticated user', async () => {
    const res = await app.request('/v1/apps', {
      headers: { Authorization: 'Bearer valid-token' }
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.apps).toBeInstanceOf(Array);
  });

  it('returns 401 without auth', async () => {
    const res = await app.request('/v1/apps');
    expect(res.status).toBe(401);
  });
});
```

### SDK Tests (packages/sdk)

```typescript
import { describe, it, expect, vi } from 'vitest';
import { checkForUpdate } from './updater';

// Mock react-native-fs
vi.mock('react-native-fs', () => ({
  readFile: vi.fn(),
  writeFile: vi.fn(),
  exists: vi.fn(),
}));

describe('checkForUpdate', () => {
  it('returns update when newer version available', async () => {
    // Setup mocks
    vi.mocked(RNFS.exists).mockResolvedValue(true);

    const result = await checkForUpdate();

    expect(result.updateAvailable).toBe(true);
  });
});
```

### Dashboard Tests (packages/dashboard)

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AppCard } from './AppCard';

describe('AppCard', () => {
  it('renders app name', () => {
    render(<AppCard app={{ id: '1', name: 'My App' }} />);
    expect(screen.getByText('My App')).toBeInTheDocument();
  });
});
```

## Coverage Requirements

- Test all exported functions
- Test all branches (if/else)
- Test error handling paths
- Minimum meaningful coverage, not arbitrary %

## Mocking Guidelines

```typescript
// ✅ Mock external dependencies
vi.mock('react-native-fs');

// ✅ Mock fetch/network
global.fetch = vi.fn();

// ❌ Don't mock the thing you're testing
// ❌ Don't mock too much (test becomes meaningless)
```

## Test File Checklist

- [ ] All public functions tested
- [ ] Happy path covered
- [ ] Error cases covered
- [ ] Edge cases covered
- [ ] Mocks are realistic
- [ ] Tests are independent (no shared state)
- [ ] Tests are readable (clear intent)

## Verification

```bash
pnpm --filter @bundlenudge/{{PACKAGE}} test -- --run
```

All tests must pass before marking complete.
