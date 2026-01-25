## Phase 0: Project Setup & Validation

**Priority:** MUST complete before any other phase
**Purpose:** Ensure all scaffolding exists and validate existing code

---

### Current State (as of 2026-01-25)

The project already has significant scaffolding. DO NOT recreate these files:

#### Already Exists - DO NOT MODIFY
```
bundlenudge/
├── package.json                    # Root monorepo config
├── pnpm-workspace.yaml             # Workspace: packages/*
├── tsconfig.json                   # Base TypeScript config
├── .env.example                    # Environment variables template
├── CLAUDE.md                       # Project instructions
│
├── packages/shared/
│   ├── package.json
│   ├── tsconfig.json
│   ├── vitest.config.ts
│   └── src/
│       ├── index.ts                # Re-exports
│       ├── types.ts                # Core types (DeviceAttributes, Release, etc.)
│       ├── schemas.ts              # Zod schemas
│       ├── constants.ts            # Constants
│       └── types.test.ts           # Tests
│
├── packages/api/
│   ├── package.json
│   ├── tsconfig.json
│   ├── vitest.config.ts
│   ├── wrangler.toml               # D1, R2, KV bindings
│   └── src/
│       ├── index.ts                # Hono app with routes
│       ├── index.test.ts           # Tests
│       ├── types/env.ts            # Cloudflare bindings type
│       └── routes/
│           ├── apps.ts             # App CRUD
│           ├── releases.ts         # Release CRUD
│           ├── devices.ts          # Device registration
│           ├── updates.ts          # Update check
│           └── telemetry.ts        # Telemetry events
│
├── packages/sdk/
│   ├── package.json
│   ├── tsconfig.json
│   ├── vitest.config.ts
│   └── src/
│       ├── index.ts                # Exports
│       ├── types.ts                # SDK types
│       ├── utils.ts                # Utilities
│       ├── utils.test.ts           # Tests
│       ├── storage.ts              # AsyncStorage wrapper
│       ├── updater.ts              # Update logic
│       ├── crash-detector.ts       # Crash detection
│       ├── rollback-manager.ts     # Rollback logic
│       └── bundlenudge.ts          # Main SDK class
│
└── packages/dashboard/
    ├── CLAUDE.md                   # Dashboard-specific instructions
    └── plan.md                     # Dashboard plan
```

---

### What Needs To Be Created

#### 1. Database Schema (packages/api/src/db/)

Create the Drizzle ORM schema for D1:

```typescript
// packages/api/src/db/schema.ts
import { sqliteTable, text, integer, real, index } from 'drizzle-orm/sqlite-core'

// Apps
export const apps = sqliteTable('apps', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  bundleId: text('bundle_id').notNull(),
  platform: text('platform', { enum: ['ios', 'android', 'both'] }).notNull(),
  ownerId: text('owner_id').notNull(),
  orgId: text('org_id'),
  githubRepo: text('github_repo'),
  webhookSecret: text('webhook_secret'),
  settings: text('settings', { mode: 'json' }).$type<AppSettings>(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
  deletedAt: integer('deleted_at', { mode: 'timestamp' }),
}, (table) => ({
  ownerIdx: index('apps_owner_idx').on(table.ownerId),
  orgIdx: index('apps_org_idx').on(table.orgId),
}))

// Devices
export const devices = sqliteTable('devices', {
  id: text('id').primaryKey(),
  appId: text('app_id').notNull().references(() => apps.id),
  platform: text('platform', { enum: ['ios', 'android'] }).notNull(),
  osVersion: text('os_version'),
  deviceModel: text('device_model'),
  appVersion: text('app_version').notNull(),
  currentBundleVersion: text('current_bundle_version'),
  currentBundleHash: text('current_bundle_hash'),
  tokenHash: text('token_hash'),
  lastSeenAt: integer('last_seen_at', { mode: 'timestamp' }),
  crashCount: integer('crash_count').default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
}, (table) => ({
  appIdx: index('devices_app_idx').on(table.appId),
  tokenIdx: index('devices_token_idx').on(table.tokenHash),
}))

// Releases
export const releases = sqliteTable('releases', {
  id: text('id').primaryKey(),
  appId: text('app_id').notNull().references(() => apps.id),
  version: text('version').notNull(),
  channel: text('channel').default('production'),
  bundleUrl: text('bundle_url').notNull(),
  bundleSize: integer('bundle_size').notNull(),
  bundleHash: text('bundle_hash').notNull(),
  targetingRules: text('targeting_rules', { mode: 'json' }).$type<TargetingRules | null>(),
  releaseNotes: text('release_notes'),
  status: text('status', { enum: ['active', 'paused', 'rolled_back'] }).default('active'),
  rollbackReason: text('rollback_reason'),
  rolloutPercentage: integer('rollout_percentage').default(100),
  minAppVersion: text('min_app_version'),
  maxAppVersion: text('max_app_version'),
  commitSha: text('commit_sha'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
}, (table) => ({
  appIdx: index('releases_app_idx').on(table.appId),
  statusIdx: index('releases_status_idx').on(table.status),
}))

// Telemetry Events
export const telemetryEvents = sqliteTable('telemetry_events', {
  id: text('id').primaryKey(),
  deviceId: text('device_id').notNull(),
  appId: text('app_id').notNull(),
  eventType: text('event_type').notNull(),
  releaseId: text('release_id'),
  bundleVersion: text('bundle_version'),
  metadata: text('metadata', { mode: 'json' }),
  timestamp: integer('timestamp', { mode: 'timestamp' }).notNull(),
}, (table) => ({
  appIdx: index('telemetry_app_idx').on(table.appId),
  deviceIdx: index('telemetry_device_idx').on(table.deviceId),
  timestampIdx: index('telemetry_timestamp_idx').on(table.timestamp),
}))

// Type helpers
interface AppSettings {
  crashRollbackThreshold?: number
  autoRollbackEnabled?: boolean
}
```

```typescript
// packages/api/src/db/index.ts
import { drizzle } from 'drizzle-orm/d1'
import * as schema from './schema'

export function getDb(d1: D1Database) {
  return drizzle(d1, { schema })
}

export * from './schema'
export type Database = ReturnType<typeof getDb>
```

```typescript
// packages/api/drizzle.config.ts
import type { Config } from 'drizzle-kit'

export default {
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
} satisfies Config
```

#### 2. Update Env Types (packages/api/src/types/env.ts)

Verify this file has all bindings:

```typescript
// packages/api/src/types/env.ts
export interface Env {
  // Cloudflare Bindings
  DB: D1Database
  BUNDLES: R2Bucket
  RATE_LIMIT: KVNamespace

  // Database
  DATABASE_URL: string

  // Auth
  BETTER_AUTH_SECRET: string
  JWT_SECRET: string
  ENCRYPTION_KEY: string

  // GitHub OAuth
  GITHUB_CLIENT_ID: string
  GITHUB_CLIENT_SECRET: string

  // Stripe
  STRIPE_SECRET_KEY: string
  STRIPE_WEBHOOK_SECRET: string

  // Email
  RESEND_API_KEY: string
  EMAIL_FROM?: string

  // URLs
  API_URL: string
  DASHBOARD_URL: string

  // Environment
  ENVIRONMENT: 'development' | 'staging' | 'production'
}
```

#### 3. Drizzle Dependencies

Ensure packages/api/package.json has:
```json
{
  "dependencies": {
    "drizzle-orm": "^0.30.0"
  },
  "devDependencies": {
    "drizzle-kit": "^0.21.0"
  }
}
```

---

### Validation Steps

After creating files, run:

```bash
# 1. Install dependencies
pnpm install

# 2. Type check all packages
pnpm typecheck

# 3. Run tests
pnpm test

# 4. Lint
pnpm lint
```

All commands must pass before Phase 1 begins.

---

### Acceptance Criteria

- [ ] `packages/api/src/db/schema.ts` exists with all tables
- [ ] `packages/api/src/db/index.ts` exports getDb function
- [ ] `packages/api/drizzle.config.ts` exists
- [ ] `packages/api/src/types/env.ts` has all bindings
- [ ] `pnpm typecheck` passes
- [ ] `pnpm test` passes
- [ ] `pnpm lint` passes

---

### Knowledge Docs to Read

Before implementing:
1. `.claude/knowledge/IMPLEMENTATION_DETAILS.md` - Section 1 (Database Schema)
2. `.claude/knowledge/QUALITY_RULES.md` - Code quality rules
