# Shared Package Plan

## Overview

Foundation package containing all TypeScript types, Zod schemas, and constants shared across BundleNudge packages. Zero runtime dependencies.

## Phase 1: Foundation

- [ ] package.json
- [ ] tsconfig.json
- [ ] eslint.config.js
- [ ] vitest.config.ts
- [ ] src/index.ts (main exports)

## Phase 2: Schemas

### Core Entities

- [ ] src/schemas/index.ts
- [ ] src/schemas/app.ts
- [ ] src/schemas/app.test.ts
- [ ] src/schemas/release.ts
- [ ] src/schemas/release.test.ts
- [ ] src/schemas/channel.ts
- [ ] src/schemas/channel.test.ts

### Operations

- [ ] src/schemas/update.ts (update check request/response)
- [ ] src/schemas/update.test.ts
- [ ] src/schemas/upload.ts (upload job)
- [ ] src/schemas/upload.test.ts
- [ ] src/schemas/device.ts (device pings)
- [ ] src/schemas/device.test.ts

### Auth & Users

- [ ] src/schemas/user.ts
- [ ] src/schemas/user.test.ts
- [ ] src/schemas/organization.ts
- [ ] src/schemas/organization.test.ts
- [ ] src/schemas/api-key.ts
- [ ] src/schemas/api-key.test.ts

## Phase 3: Types

- [ ] src/types/index.ts
- [ ] src/types/api.ts (API response types)
- [ ] src/types/sdk.ts (SDK config types)
- [ ] src/types/subscription.ts (tier types)
- [ ] src/types/cloudflare.ts (Worker bindings)

## Phase 4: Constants

- [ ] src/constants/index.ts
- [ ] src/constants/errors.ts (error codes)
- [ ] src/constants/errors.test.ts
- [ ] src/constants/tiers.ts (subscription limits)
- [ ] src/constants/tiers.test.ts
- [ ] src/constants/queues.ts (priority mappings)
- [ ] src/constants/queues.test.ts
- [ ] src/constants/platforms.ts (ios, android)

## Phase 5: Utilities

- [ ] src/utils/index.ts
- [ ] src/utils/version.ts (semver helpers)
- [ ] src/utils/version.test.ts
- [ ] src/utils/hash.ts (hash utilities)
- [ ] src/utils/hash.test.ts

## Completion Criteria

- [ ] All files under 250 lines
- [ ] No `any` types
- [ ] All tests passing
- [ ] TypeScript compiles (strict)
- [ ] Lint passes
- [ ] Build succeeds
- [ ] Quality audit passes

## Dependencies

This package depends on:
- zod (schema validation)

This package is depended on by:
- @bundlenudge/api
- @bundlenudge/sdk
- @bundlenudge/dashboard
- @bundlenudge/builder
- @bundlenudge/worker

## Notes

- Keep this package minimal
- No business logic
- Only types, schemas, constants
- Changes affect all packages
