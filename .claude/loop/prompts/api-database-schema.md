## Feature: api/database-schema

Create Drizzle ORM schema for D1 database.

### Files to Create

`packages/api/src/db/schema.ts` - Database schema
`packages/api/src/db/index.ts` - Database exports
`packages/api/drizzle.config.ts` - Drizzle configuration

### Schema

```typescript
// schema.ts
import { sqliteTable, text, integer, real, index } from 'drizzle-orm/sqlite-core'

// Applications
export const apps = sqliteTable('apps', {
  id: text('id').primaryKey(),  // UUID
  name: text('name').notNull(),
  bundleId: text('bundle_id').notNull(),
  platform: text('platform', { enum: ['ios', 'android'] }).notNull(),
  ownerId: text('owner_id').notNull(),  // User/Org ID
  settings: text('settings', { mode: 'json' }),  // JSON: { crashRollbackThreshold, etc }
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
  deletedAt: integer('deleted_at', { mode: 'timestamp' }),
}, (table) => ({
  ownerIdx: index('apps_owner_idx').on(table.ownerId),
  bundleIdIdx: index('apps_bundle_id_idx').on(table.bundleId),
}))

// Devices
export const devices = sqliteTable('devices', {
  id: text('id').primaryKey(),  // UUID (device-generated)
  appId: text('app_id').notNull().references(() => apps.id),
  platform: text('platform', { enum: ['ios', 'android'] }).notNull(),
  osVersion: text('os_version'),
  deviceModel: text('device_model'),
  appVersion: text('app_version').notNull(),
  currentBundleVersion: text('current_bundle_version'),
  currentBundleHash: text('current_bundle_hash'),
  lastSeenAt: integer('last_seen_at', { mode: 'timestamp' }),
  crashCount: integer('crash_count').default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
}, (table) => ({
  appIdx: index('devices_app_idx').on(table.appId),
  lastSeenIdx: index('devices_last_seen_idx').on(table.lastSeenAt),
}))

// Releases
export const releases = sqliteTable('releases', {
  id: text('id').primaryKey(),  // UUID
  appId: text('app_id').notNull().references(() => apps.id),
  version: text('version').notNull(),  // Semver
  bundleUrl: text('bundle_url').notNull(),  // R2 URL
  bundleSize: integer('bundle_size').notNull(),
  bundleHash: text('bundle_hash').notNull(),  // sha256:...
  targetingRules: text('targeting_rules', { mode: 'json' }),  // TargetingRules | null
  releaseNotes: text('release_notes'),
  status: text('status', { enum: ['active', 'paused', 'rolled_back'] }).default('active'),
  rollbackReason: text('rollback_reason'),
  minAppVersion: text('min_app_version'),  // Semver constraint
  maxAppVersion: text('max_app_version'),  // Semver constraint
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
}, (table) => ({
  appIdx: index('releases_app_idx').on(table.appId),
  statusIdx: index('releases_status_idx').on(table.status),
  createdIdx: index('releases_created_idx').on(table.createdAt),
}))

// Telemetry Events
export const telemetryEvents = sqliteTable('telemetry_events', {
  id: text('id').primaryKey(),  // UUID
  deviceId: text('device_id').notNull(),
  appId: text('app_id').notNull(),
  eventType: text('event_type').notNull(),  // update_check, update_downloaded, etc
  releaseId: text('release_id'),
  bundleVersion: text('bundle_version'),
  errorCode: text('error_code'),
  errorMessage: text('error_message'),
  metadata: text('metadata', { mode: 'json' }),
  timestamp: integer('timestamp', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
}, (table) => ({
  appIdx: index('telemetry_app_idx').on(table.appId),
  deviceIdx: index('telemetry_device_idx').on(table.deviceId),
  eventTypeIdx: index('telemetry_event_type_idx').on(table.eventType),
  timestampIdx: index('telemetry_timestamp_idx').on(table.timestamp),
}))

// Release Stats (aggregated)
export const releaseStats = sqliteTable('release_stats', {
  releaseId: text('release_id').primaryKey().references(() => releases.id),
  totalDownloads: integer('total_downloads').default(0),
  totalInstalls: integer('total_installs').default(0),
  totalRollbacks: integer('total_rollbacks').default(0),
  totalCrashes: integer('total_crashes').default(0),
  lastUpdatedAt: integer('last_updated_at', { mode: 'timestamp' }).notNull(),
})
```

### Type Exports

```typescript
// index.ts
import { drizzle } from 'drizzle-orm/d1'
import * as schema from './schema'

export function getDb(d1: D1Database) {
  return drizzle(d1, { schema })
}

export * from './schema'
export type { InferSelectModel, InferInsertModel } from 'drizzle-orm'
```

### Drizzle Config

```typescript
// drizzle.config.ts
import type { Config } from 'drizzle-kit'

export default {
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
} satisfies Config
```

### Tests Required

1. Schema types export correctly
2. getDb() creates valid drizzle instance (mock D1)
