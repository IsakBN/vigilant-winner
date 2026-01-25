# Builder Package Plan

## Overview

Bundle builder service for validating, processing, and preparing JavaScript bundles for distribution. Generates diffs for incremental updates.

## Phase 1: Foundation

- [ ] package.json
- [ ] tsconfig.json
- [ ] eslint.config.js
- [ ] vitest.config.ts
- [ ] src/index.ts (exports)
- [ ] src/types.ts

## Phase 2: Utilities

- [ ] src/utils/hash.ts
- [ ] src/utils/hash.test.ts
- [ ] src/utils/compress.ts
- [ ] src/utils/compress.test.ts

## Phase 3: Validation

- [ ] src/validator.ts
- [ ] src/validator.test.ts

## Phase 4: Diff Generation

- [ ] src/differ.ts
- [ ] src/differ.test.ts

## Phase 5: Manifest

- [ ] src/manifest.ts
- [ ] src/manifest.test.ts

## Phase 6: Processor

- [ ] src/processor.ts
- [ ] src/processor.test.ts

## Completion Criteria

- [ ] All files under 250 lines
- [ ] No `any` types
- [ ] All tests passing
- [ ] TypeScript compiles
- [ ] Lint passes
- [ ] Build succeeds

## Dependencies

This package depends on:
- @bundlenudge/shared

## Notes

- Lower priority package
- Build after SDK
