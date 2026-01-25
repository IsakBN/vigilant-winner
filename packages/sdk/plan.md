# SDK Package Plan

## Overview

React Native SDK for OTA updates. Handles checking for updates, downloading bundles, applying updates, and automatic rollback.

## Phase 1: Foundation

- [ ] package.json
- [ ] tsconfig.json
- [ ] eslint.config.js
- [ ] vitest.config.ts
- [ ] src/index.ts (exports)
- [ ] src/types.ts

## Phase 2: Core Types

- [ ] src/types/config.ts (BundleNudgeOptions)
- [ ] src/types/update.ts (Update, UpdateResult)
- [ ] src/types/errors.ts (Custom errors)

## Phase 3: Internal Utilities

- [ ] src/internal/api.ts (HTTP client)
- [ ] src/internal/api.test.ts
- [ ] src/internal/hash.ts (Hash verification)
- [ ] src/internal/hash.test.ts
- [ ] src/internal/platform.ts (Platform detection)
- [ ] src/internal/platform.test.ts

## Phase 4: Storage

- [ ] src/storage.ts (Bundle file management)
- [ ] src/storage.test.ts
- [ ] src/storage/paths.ts (Path utilities)
- [ ] src/storage/cleanup.ts (Old bundle cleanup)

## Phase 5: Update Logic

- [ ] src/updater.ts (Check for updates)
- [ ] src/updater.test.ts
- [ ] src/download.ts (Download with resume)
- [ ] src/download.test.ts
- [ ] src/apply.ts (Apply update)
- [ ] src/apply.test.ts

## Phase 6: Safety

- [ ] src/rollback.ts (Rollback detection/execution)
- [ ] src/rollback.test.ts
- [ ] src/health.ts (Crash detection)
- [ ] src/health.test.ts

## Phase 7: Main Class

- [ ] src/BundleNudge.ts (Main API)
- [ ] src/BundleNudge.test.ts

## Phase 8: Integration

- [ ] Update src/index.ts with all exports
- [ ] Integration tests
- [ ] README.md

## Completion Criteria

- [ ] All files under 250 lines
- [ ] No `any` types
- [ ] All tests passing
- [ ] TypeScript compiles
- [ ] Lint passes
- [ ] Build succeeds
- [ ] Quality audit passes

## Dependencies

This package depends on:
- @bundlenudge/shared

This package is depended on by:
- (none - end user package)

## Notes

- Must mock react-native and react-native-fs in tests
- Offline support is critical
- Rollback must be 100% reliable
- Hash verification is security critical
