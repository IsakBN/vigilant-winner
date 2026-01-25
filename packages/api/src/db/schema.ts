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
  bundleId: text('bundle_id'),
  platform: text('platform', { enum: ['ios', 'android'] }).notNull(),
  ownerId: text('owner_id').notNull(),
  apiKey: text('api_key').notNull(),
  webhookSecret: text('webhook_secret').notNull(),
  settings: text('settings', { mode: 'json' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
  deletedAt: integer('deleted_at', { mode: 'timestamp' }),
}, (table) => ({
  ownerIdx: index('apps_owner_idx').on(table.ownerId),
  bundleIdIdx: index('apps_bundle_id_idx').on(table.bundleId),
  apiKeyIdx: index('apps_api_key_idx').on(table.apiKey),
}))

/**
 * Devices table
 * Tracks devices that have installed apps using the SDK
 */
export const devices = sqliteTable('devices', {
  id: text('id').primaryKey(),
  appId: text('app_id').notNull().references(() => apps.id),
  deviceId: text('device_id').notNull(),
  platform: text('platform', { enum: ['ios', 'android'] }).notNull(),
  osVersion: text('os_version'),
  deviceModel: text('device_model'),
  timezone: text('timezone'),
  locale: text('locale'),
  appVersion: text('app_version').notNull(),
  currentBundleVersion: text('current_bundle_version'),
  currentBundleHash: text('current_bundle_hash'),
  tokenHash: text('token_hash'),
  tokenExpiresAt: integer('token_expires_at'),
  lastSeenAt: integer('last_seen_at', { mode: 'timestamp' }),
  revokedAt: integer('revoked_at', { mode: 'timestamp' }),
  crashCount: integer('crash_count').default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
}, (table) => ({
  appIdx: index('devices_app_idx').on(table.appId),
  deviceIdIdx: index('devices_device_id_idx').on(table.deviceId),
  appDeviceIdx: index('devices_app_device_idx').on(table.appId, table.deviceId),
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
  rolloutPercentage: integer('rollout_percentage').default(100),
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

/**
 * Subscription plans table
 * Available subscription tiers
 */
export const subscriptionPlans = sqliteTable('subscription_plans', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),
  displayName: text('display_name').notNull(),
  priceCents: integer('price_cents').notNull(),
  stripePriceId: text('stripe_price_id'),
  mauLimit: integer('mau_limit').notNull(),
  storageGb: integer('storage_gb').notNull(),
  bundleRetention: integer('bundle_retention').notNull(),
  features: text('features', { mode: 'json' }),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})

/**
 * Subscriptions table
 * User subscription records
 */
export const subscriptions = sqliteTable('subscriptions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  planId: text('plan_id').notNull().references(() => subscriptionPlans.id),
  status: text('status', {
    enum: ['active', 'trialing', 'past_due', 'cancelled', 'expired'],
  }).default('active'),
  stripeCustomerId: text('stripe_customer_id'),
  stripeSubscriptionId: text('stripe_subscription_id'),
  currentPeriodStart: integer('current_period_start', { mode: 'timestamp' }),
  currentPeriodEnd: integer('current_period_end', { mode: 'timestamp' }),
  cancelAtPeriodEnd: integer('cancel_at_period_end', { mode: 'boolean' }).default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
}, (table) => ({
  userIdx: index('subscriptions_user_idx').on(table.userId),
  stripeCustomerIdx: index('subscriptions_stripe_customer_idx').on(table.stripeCustomerId),
  stripeSubIdx: index('subscriptions_stripe_sub_idx').on(table.stripeSubscriptionId),
}))

/**
 * Organizations (Teams) table
 * Teams/workspaces for collaborative access
 */
export const organizations = sqliteTable('organizations', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').unique(),
  ownerId: text('owner_id').notNull(),
  planId: text('plan_id').references(() => subscriptionPlans.id),
  domain: text('domain'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
}, (table) => ({
  ownerIdx: index('organizations_owner_idx').on(table.ownerId),
  slugIdx: index('organizations_slug_idx').on(table.slug),
}))

/**
 * Organization members table
 * User membership in organizations
 */
export const organizationMembers = sqliteTable('organization_members', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull().references(() => organizations.id),
  userId: text('user_id').notNull(),
  role: text('role', { enum: ['owner', 'admin', 'member'] }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
}, (table) => ({
  orgIdx: index('org_members_org_idx').on(table.organizationId),
  userIdx: index('org_members_user_idx').on(table.userId),
  orgUserIdx: index('org_members_org_user_idx').on(table.organizationId, table.userId),
}))

/**
 * Team invitations table
 * Pending invitations to join a team
 */
export const teamInvitations = sqliteTable('team_invitations', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull().references(() => organizations.id),
  email: text('email').notNull(),
  role: text('role', { enum: ['admin', 'member'] }).notNull(),
  token: text('token').notNull().unique(),
  invitedBy: text('invited_by').notNull(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  acceptedAt: integer('accepted_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
}, (table) => ({
  orgIdx: index('team_invitations_org_idx').on(table.organizationId),
  tokenIdx: index('team_invitations_token_idx').on(table.token),
  emailIdx: index('team_invitations_email_idx').on(table.email),
}))

/**
 * Project members table
 * Per-project access control beyond organization membership
 */
export const projectMembers = sqliteTable('project_members', {
  id: text('id').primaryKey(),
  appId: text('app_id').notNull().references(() => apps.id),
  userId: text('user_id').notNull(),
  role: text('role', { enum: ['admin', 'developer', 'viewer'] }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
}, (table) => ({
  appIdx: index('project_members_app_idx').on(table.appId),
  userIdx: index('project_members_user_idx').on(table.userId),
  appUserIdx: index('project_members_app_user_idx').on(table.appId, table.userId),
}))

/**
 * Team audit log table
 * Tracks team-related events for compliance
 */
export const teamAuditLog = sqliteTable('team_audit_log', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull().references(() => organizations.id),
  userId: text('user_id').notNull(),
  event: text('event').notNull(),
  metadata: text('metadata', { mode: 'json' }),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
}, (table) => ({
  orgIdx: index('team_audit_org_idx').on(table.organizationId),
  userIdx: index('team_audit_user_idx').on(table.userId),
  eventIdx: index('team_audit_event_idx').on(table.event),
  createdIdx: index('team_audit_created_idx').on(table.createdAt),
}))
