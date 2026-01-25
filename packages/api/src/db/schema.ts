/**
 * Database schema for BundleNudge API
 *
 * Uses Drizzle ORM with Cloudflare D1 (SQLite)
 */

import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core'

/**
 * Applications table
 * Stores registered apps that can receive OTA updates
 */
export const apps = sqliteTable('apps', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  bundleId: text('bundle_id').notNull(),
  platform: text('platform', { enum: ['ios', 'android'] }).notNull(),
  ownerId: text('owner_id').notNull(),
  settings: text('settings', { mode: 'json' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
  deletedAt: integer('deleted_at', { mode: 'timestamp' }),
}, (table) => ({
  ownerIdx: index('apps_owner_idx').on(table.ownerId),
  bundleIdIdx: index('apps_bundle_id_idx').on(table.bundleId),
}))

/**
 * Devices table
 * Tracks devices that have installed apps using the SDK
 */
export const devices = sqliteTable('devices', {
  id: text('id').primaryKey(),
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

/**
 * Releases table
 * Stores OTA update bundles and their metadata
 */
export const releases = sqliteTable('releases', {
  id: text('id').primaryKey(),
  appId: text('app_id').notNull().references(() => apps.id),
  version: text('version').notNull(),
  bundleUrl: text('bundle_url').notNull(),
  bundleSize: integer('bundle_size').notNull(),
  bundleHash: text('bundle_hash').notNull(),
  targetingRules: text('targeting_rules', { mode: 'json' }),
  releaseNotes: text('release_notes'),
  status: text('status', { enum: ['active', 'paused', 'rolled_back'] }).default('active'),
  rollbackReason: text('rollback_reason'),
  minAppVersion: text('min_app_version'),
  maxAppVersion: text('max_app_version'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
}, (table) => ({
  appIdx: index('releases_app_idx').on(table.appId),
  statusIdx: index('releases_status_idx').on(table.status),
  createdIdx: index('releases_created_idx').on(table.createdAt),
}))

/**
 * Telemetry events table
 * Stores SDK telemetry for analytics and debugging
 */
export const telemetryEvents = sqliteTable('telemetry_events', {
  id: text('id').primaryKey(),
  deviceId: text('device_id').notNull(),
  appId: text('app_id').notNull(),
  eventType: text('event_type').notNull(),
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

/**
 * Release stats table
 * Aggregated statistics for releases
 */
export const releaseStats = sqliteTable('release_stats', {
  releaseId: text('release_id').primaryKey().references(() => releases.id),
  totalDownloads: integer('total_downloads').default(0),
  totalInstalls: integer('total_installs').default(0),
  totalRollbacks: integer('total_rollbacks').default(0),
  totalCrashes: integer('total_crashes').default(0),
  lastUpdatedAt: integer('last_updated_at', { mode: 'timestamp' }).notNull(),
})
