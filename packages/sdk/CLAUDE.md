# @bundlenudge/sdk

## Purpose

React Native SDK for checking, downloading, and applying OTA updates. Provides a simple API for mobile apps to receive JavaScript bundle updates without going through app stores.

## Reference

```
/Users/isaks_macbook/Desktop/Dev/codepush/packages/sdk
```

## Tech Stack

- React Native (0.72+)
- react-native-fs (file operations)
- TypeScript (strict mode)
- Vitest (testing)

## Directory Structure

```
packages/sdk/
├── src/
│   ├── index.ts              # Public API exports
│   ├── types.ts              # Type definitions
│   ├── BundleNudge.ts        # Main class
│   ├── updater.ts            # Update check/download logic
│   ├── storage.ts            # Local bundle storage
│   ├── rollback.ts           # Rollback detection/execution
│   ├── health.ts             # Crash detection
│   └── internal/             # Not exported
│       ├── api.ts            # HTTP client
│       └── hash.ts           # Hash verification
├── package.json
├── tsconfig.json
└── CLAUDE.md
```

## DO's

### Code Style

- Max 250 lines per file
- Max 50 lines per function
- Named exports only
- Explicit error handling
- Offline-first design

### Patterns

```typescript
// ✅ Public API - minimal and clear
export class BundleNudge {
  static configure(options: BundleNudgeOptions): void;
  static checkForUpdate(): Promise<UpdateResult>;
  static downloadUpdate(update: Update): Promise<void>;
  static applyUpdate(): void;
  static rollback(): void;
}

// ✅ Offline handling
async function checkForUpdate(): Promise<UpdateResult> {
  try {
    return await fetchUpdate();
  } catch (error) {
    if (isNetworkError(error)) {
      return { updateAvailable: false, reason: 'offline' };
    }
    throw error;
  }
}

// ✅ Hash verification
const downloadedHash = await RNFS.hash(bundlePath, 'sha256');
if (downloadedHash !== update.hash) {
  throw new BundleCorruptionError('Hash mismatch');
}

// ✅ Rollback safety
function applyUpdate(): void {
  setPendingUpdate(true);
  // ... apply
  clearPendingUpdate();
}
```

## DON'Ts

### Never

- No `any` types
- No blocking JS thread
- No unhandled native errors
- No exposing internals
- No `console.log`

### Avoid

```typescript
// ❌ Blocking operations
while (downloading) { /* spin */ }

// ❌ Unhandled errors
await RNFS.downloadFile(options);  // Can throw

// ❌ No offline handling
const update = await fetch(url);  // Fails without network

// ❌ Exposing internals
export { InternalHasher, PrivateApi };

// ❌ Platform assumptions
RNFS.DocumentDirectoryPath;  // Different on iOS/Android
```

## Key Files

| File | Purpose |
|------|---------|
| `src/index.ts` | Public API |
| `src/BundleNudge.ts` | Main class |
| `src/updater.ts` | Update check/download |
| `src/storage.ts` | Bundle file management |
| `src/rollback.ts` | Rollback logic |
| `src/health.ts` | Crash detection |

## Commands

```bash
# Build
pnpm --filter @bundlenudge/sdk build

# Test
pnpm --filter @bundlenudge/sdk test

# Type check
pnpm --filter @bundlenudge/sdk typecheck
```

## Dependencies

- `@bundlenudge/shared` - Types and schemas
- `react-native-fs` - File system access (peer dep)
- `react-native` - Platform APIs (peer dep)

## Testing

- Framework: Vitest
- Mock react-native and react-native-fs
- Test offline scenarios
- Test rollback scenarios

## Notes

- Must work completely offline after first download
- Rollback must be automatic and reliable
- Hash verification is critical for security
- Keep bundle storage location consistent
