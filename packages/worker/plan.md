# Worker Package Plan

## Overview

Mac build worker for native iOS/Android builds. Consumes build jobs from queue, executes builds, signs artifacts, and uploads results.

## Phase 1: Foundation

- [ ] package.json
- [ ] tsconfig.json
- [ ] eslint.config.js
- [ ] vitest.config.ts
- [ ] src/index.ts (exports)
- [ ] src/types.ts

## Phase 2: Queue Consumer

- [ ] src/queue.ts
- [ ] src/queue.test.ts

## Phase 3: Builder

- [ ] src/builder.ts
- [ ] src/builder.test.ts

## Phase 4: Signing

- [ ] src/signing.ts
- [ ] src/signing.test.ts

## Phase 5: Worker

- [ ] src/worker.ts
- [ ] src/worker.test.ts

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

- Lowest priority package
- Build last
- Requires Mac environment for full testing
