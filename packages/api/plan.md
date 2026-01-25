# API Package Plan

## Overview

Cloudflare Workers REST API with Hono.js, D1 database, R2 storage, priority queues, and Durable Objects. This is the largest package (~165 iterations).

## Phase 2a: Foundation (15 iterations)

- [ ] package.json
- [ ] tsconfig.json
- [ ] eslint.config.js
- [ ] vitest.config.ts
- [ ] wrangler.toml
- [ ] src/index.ts (app entry)
- [ ] src/types.ts (Env, bindings)

## Phase 2b: Database (20 iterations)

### Schema

- [ ] src/db/schema.ts
- [ ] src/db/schema/users.ts
- [ ] src/db/schema/organizations.ts
- [ ] src/db/schema/apps.ts
- [ ] src/db/schema/releases.ts
- [ ] src/db/schema/channels.ts
- [ ] src/db/schema/upload-jobs.ts
- [ ] src/db/schema/subscriptions.ts
- [ ] src/db/schema/api-keys.ts

### Queries

- [ ] src/db/queries/index.ts
- [ ] src/db/queries/users.ts
- [ ] src/db/queries/apps.ts
- [ ] src/db/queries/releases.ts
- [ ] src/db/queries/channels.ts
- [ ] src/db/queries/subscriptions.ts

## Phase 2c: Middleware (20 iterations)

- [ ] src/middleware/index.ts
- [ ] src/middleware/auth.ts
- [ ] src/middleware/auth.test.ts
- [ ] src/middleware/api-key.ts
- [ ] src/middleware/api-key.test.ts
- [ ] src/middleware/rate-limit.ts
- [ ] src/middleware/rate-limit.test.ts
- [ ] src/middleware/cors.ts
- [ ] src/middleware/error.ts
- [ ] src/middleware/error.test.ts
- [ ] src/middleware/logger.ts

## Phase 2d: Lib (40 iterations)

### Authentication

- [ ] src/lib/jwt.ts
- [ ] src/lib/jwt.test.ts
- [ ] src/lib/encryption.ts
- [ ] src/lib/encryption.test.ts

### Storage

- [ ] src/lib/storage.ts
- [ ] src/lib/storage.test.ts
- [ ] src/lib/storage/upload.ts
- [ ] src/lib/storage/download.ts
- [ ] src/lib/storage/diff.ts

### Queue System

- [ ] src/lib/queue.ts
- [ ] src/lib/queue.test.ts
- [ ] src/lib/queue/router.ts
- [ ] src/lib/queue/processor.ts

### Tiers & Limits

- [ ] src/lib/tiers.ts
- [ ] src/lib/tiers.test.ts
- [ ] src/lib/limits.ts
- [ ] src/lib/limits.test.ts

### Utilities

- [ ] src/lib/hash.ts
- [ ] src/lib/hash.test.ts
- [ ] src/lib/version.ts
- [ ] src/lib/version.test.ts

## Phase 2e: Routes (80 iterations)

### Apps

- [ ] src/routes/apps.ts
- [ ] src/routes/apps.test.ts
- [ ] src/routes/apps/list.ts
- [ ] src/routes/apps/create.ts
- [ ] src/routes/apps/get.ts
- [ ] src/routes/apps/update.ts
- [ ] src/routes/apps/delete.ts

### Releases

- [ ] src/routes/releases.ts
- [ ] src/routes/releases.test.ts
- [ ] src/routes/releases/list.ts
- [ ] src/routes/releases/create.ts
- [ ] src/routes/releases/get.ts
- [ ] src/routes/releases/promote.ts
- [ ] src/routes/releases/rollback.ts

### Channels

- [ ] src/routes/channels.ts
- [ ] src/routes/channels.test.ts
- [ ] src/routes/channels/list.ts
- [ ] src/routes/channels/create.ts
- [ ] src/routes/channels/assign.ts

### Updates (SDK endpoint)

- [ ] src/routes/updates.ts
- [ ] src/routes/updates.test.ts
- [ ] src/routes/updates/check.ts
- [ ] src/routes/updates/download.ts
- [ ] src/routes/updates/report.ts

### Uploads

- [ ] src/routes/uploads.ts
- [ ] src/routes/uploads.test.ts
- [ ] src/routes/uploads/initiate.ts
- [ ] src/routes/uploads/complete.ts
- [ ] src/routes/uploads/status.ts

### Users & Auth

- [ ] src/routes/auth.ts
- [ ] src/routes/auth.test.ts
- [ ] src/routes/users.ts
- [ ] src/routes/users.test.ts
- [ ] src/routes/organizations.ts
- [ ] src/routes/organizations.test.ts
- [ ] src/routes/api-keys.ts
- [ ] src/routes/api-keys.test.ts

### Webhooks

- [ ] src/routes/webhooks.ts
- [ ] src/routes/webhooks.test.ts
- [ ] src/routes/webhooks/github.ts
- [ ] src/routes/webhooks/crash.ts

### Analytics

- [ ] src/routes/analytics.ts
- [ ] src/routes/analytics.test.ts

## Phase 2f: Durable Objects (10 iterations)

- [ ] src/durable-objects/upload-status.ts
- [ ] src/durable-objects/upload-status.test.ts

## Phase 2g: Integration (10 iterations)

- [ ] Full API integration tests
- [ ] Queue processing tests
- [ ] WebSocket status tests
- [ ] README.md

## Completion Criteria

- [ ] All files under 250 lines
- [ ] No `any` types
- [ ] All tests passing
- [ ] TypeScript compiles
- [ ] Lint passes
- [ ] Build succeeds
- [ ] Quality audit passes
- [ ] Wrangler deploy works

## Dependencies

This package depends on:
- @bundlenudge/shared

This package is depended on by:
- @bundlenudge/dashboard (types only)

## Notes

- Largest package in the monorepo
- Queue routing logic is critical
- Rate limiting must fail closed
- All endpoints need auth (except /updates/check)
