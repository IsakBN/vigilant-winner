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
  targetGroup: text('target_group'),
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
  targetGroupIdx: index('devices_target_group_idx').on(table.appId, table.targetGroup),
}))

/**
 * Releases table
 * Stores OTA update bundles and their metadata
 *
 * @agent wave4-channels
 * @modified 2026-01-25
 * @description Added channelId for channel-based deployments
 */
export const releases = sqliteTable('releases', {
  id: text('id').primaryKey(),
  appId: text('app_id').notNull().references(() => apps.id),
  channelId: text('channel_id').references(() => channels.id),
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
  channelIdx: index('releases_channel_idx').on(table.channelId),
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

/**
 * API Keys table
 * Stores hashed API keys for SDK/CI authentication
 *
 * @agent remediate-api-key-middleware
 */
export const apiKeys = sqliteTable('api_keys', {
  id: text('id').primaryKey(),
  appId: text('app_id').notNull().references(() => apps.id),
  name: text('name').notNull(),
  keyPrefix: text('key_prefix').notNull(), // 'bn_live_abc' first 12 chars
  keyHash: text('key_hash').notNull(), // bcrypt hash
  permissions: text('permissions', { mode: 'json' }).notNull(), // JSON array
  lastUsedAt: integer('last_used_at', { mode: 'timestamp' }),
  revokedAt: integer('revoked_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
}, (table) => ({
  appIdx: index('api_keys_app_idx').on(table.appId),
  prefixIdx: index('api_keys_prefix_idx').on(table.keyPrefix),
}))

/**
 * Webhooks table
 * Outgoing webhook configurations for apps
 */
export const webhooks = sqliteTable('webhooks', {
  id: text('id').primaryKey(),
  appId: text('app_id').notNull().references(() => apps.id),
  url: text('url').notNull(),
  events: text('events', { mode: 'json' }).notNull(),
  secret: text('secret').notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  lastTriggeredAt: integer('last_triggered_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
}, (table) => ({
  appIdx: index('webhooks_app_idx').on(table.appId),
  activeIdx: index('webhooks_active_idx').on(table.isActive),
}))

/**
 * Webhook events table
 * Tracks webhook delivery attempts
 */
export const webhookEvents = sqliteTable('webhook_events', {
  id: text('id').primaryKey(),
  webhookId: text('webhook_id').notNull().references(() => webhooks.id),
  event: text('event').notNull(),
  payload: text('payload', { mode: 'json' }).notNull(),
  status: text('status', { enum: ['delivered', 'failed'] }).notNull(),
  statusCode: integer('status_code'),
  errorMessage: text('error_message'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
}, (table) => ({
  webhookIdx: index('webhook_events_webhook_idx').on(table.webhookId),
  statusIdx: index('webhook_events_status_idx').on(table.status),
  createdIdx: index('webhook_events_created_idx').on(table.createdAt),
}))

/**
 * GitHub installations table
 * Stores GitHub App installation records for users
 */
export const githubInstallations = sqliteTable('github_installations', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  installationId: text('installation_id').notNull(),
  accountType: text('account_type', { enum: ['user', 'organization'] }),
  accountLogin: text('account_login'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
}, (table) => ({
  userIdx: index('github_installations_user_idx').on(table.userId),
  installationIdx: index('github_installations_installation_idx').on(table.installationId),
}))

/**
 * App repositories table
 * Links apps to GitHub repositories for automated builds
 */
export const appRepos = sqliteTable('app_repos', {
  id: text('id').primaryKey(),
  appId: text('app_id').notNull().references(() => apps.id),
  repoFullName: text('repo_full_name').notNull(),
  repoBranch: text('repo_branch').default('main'),
  installationId: text('installation_id').notNull(),
  autoPublish: integer('auto_publish', { mode: 'boolean' }).default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
}, (table) => ({
  appIdx: index('app_repos_app_idx').on(table.appId),
  repoIdx: index('app_repos_repo_idx').on(table.repoFullName),
}))

/**
 * Channels table
 * Release channels for environment-based deployments (production, staging, development)
 *
 * @agent wave4-channels
 * @modified 2026-01-25
 * @description Enhanced with display_name, description, is_default, rollout_percentage, targeting_rules
 */
export const channels = sqliteTable('channels', {
  id: text('id').primaryKey(),
  appId: text('app_id').notNull().references(() => apps.id),
  name: text('name').notNull(),
  displayName: text('display_name').notNull(),
  description: text('description'),
  isDefault: integer('is_default', { mode: 'boolean' }).default(false),
  rolloutPercentage: integer('rollout_percentage').default(100),
  targetingRules: text('targeting_rules', { mode: 'json' }),
  activeReleaseId: text('active_release_id'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
}, (table) => ({
  appIdx: index('channels_app_idx').on(table.appId),
  appNameIdx: index('channels_app_name_idx').on(table.appId, table.name),
  defaultIdx: index('channels_default_idx').on(table.appId, table.isDefault),
}))

/**
 * Crash integrations table
 * Third-party integrations for crash reporting (Sentry, Slack, etc.)
 */
export const crashIntegrations = sqliteTable('crash_integrations', {
  id: text('id').primaryKey(),
  appId: text('app_id').notNull().references(() => apps.id),
  provider: text('provider', {
    enum: ['sentry', 'bugsnag', 'crashlytics', 'slack', 'discord'],
  }).notNull(),
  config: text('config').notNull(), // Encrypted JSON
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  lastTriggeredAt: integer('last_triggered_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
}, (table) => ({
  appIdx: index('crash_integrations_app_idx').on(table.appId),
  providerIdx: index('crash_integrations_provider_idx').on(table.provider),
  activeIdx: index('crash_integrations_active_idx').on(table.isActive),
}))

// ============================================
// Admin System Tables
// ============================================

/**
 * Admins table
 * Stores admin user accounts with elevated privileges
 *
 * @agent admin-auth-routes
 */
export const admins = sqliteTable('admins', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  passwordHash: text('password_hash').notNull(),
  role: text('role', { enum: ['super_admin', 'admin', 'support'] }).notNull().default('admin'),
  permissions: text('permissions', { mode: 'json' }), // JSON array of permission strings
  lastLoginAt: integer('last_login_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
}, (table) => ({
  emailIdx: index('admins_email_idx').on(table.email),
  roleIdx: index('admins_role_idx').on(table.role),
}))

/**
 * Admin sessions table
 * Tracks active admin sessions with hashed tokens
 *
 * @agent admin-auth-routes
 */
export const adminSessions = sqliteTable('admin_sessions', {
  id: text('id').primaryKey(),
  adminId: text('admin_id').notNull().references(() => admins.id),
  tokenHash: text('token_hash').notNull(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
}, (table) => ({
  adminIdx: index('admin_sessions_admin_idx').on(table.adminId),
  tokenHashIdx: index('admin_sessions_token_hash_idx').on(table.tokenHash),
  expiresIdx: index('admin_sessions_expires_idx').on(table.expiresAt),
}))

/**
 * Admin audit log table
 * Tracks all admin actions for compliance and debugging
 *
 * @agent wave5-admin
 */
export const adminAuditLog = sqliteTable('admin_audit_log', {
  id: text('id').primaryKey(),
  adminId: text('admin_id').notNull(),
  action: text('action').notNull(),
  targetUserId: text('target_user_id'),
  targetAppId: text('target_app_id'),
  details: text('details', { mode: 'json' }),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
}, (table) => ({
  adminIdx: index('admin_audit_admin_idx').on(table.adminId),
  actionIdx: index('admin_audit_action_idx').on(table.action),
  targetUserIdx: index('admin_audit_target_user_idx').on(table.targetUserId),
  targetAppIdx: index('admin_audit_target_app_idx').on(table.targetAppId),
  createdIdx: index('admin_audit_created_idx').on(table.createdAt),
}))

/**
 * User limit overrides table
 * Admin-set custom limits that override plan defaults
 *
 * @agent wave5-admin
 */
export const userLimitOverrides = sqliteTable('user_limit_overrides', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().unique(),
  mauLimit: integer('mau_limit'),
  storageGb: integer('storage_gb'),
  expiresAt: integer('expires_at', { mode: 'timestamp' }),
  reason: text('reason'),
  createdBy: text('created_by').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
}, (table) => ({
  userIdx: index('user_limit_overrides_user_idx').on(table.userId),
  expiresIdx: index('user_limit_overrides_expires_idx').on(table.expiresAt),
}))

/**
 * User suspensions table
 * Tracks user account suspensions by admins
 *
 * @agent wave5-admin
 */
export const userSuspensions = sqliteTable('user_suspensions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  reason: text('reason').notNull(),
  until: integer('until', { mode: 'timestamp' }),
  suspendedBy: text('suspended_by').notNull(),
  liftedAt: integer('lifted_at', { mode: 'timestamp' }),
  liftedBy: text('lifted_by'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
}, (table) => ({
  userIdx: index('user_suspensions_user_idx').on(table.userId),
  liftedIdx: index('user_suspensions_lifted_idx').on(table.liftedAt),
  untilIdx: index('user_suspensions_until_idx').on(table.until),
}))

/**
 * OTP attempts table
 * Rate limiting for admin OTP authentication
 *
 * @agent wave5-admin
 */
export const otpAttempts = sqliteTable('otp_attempts', {
  email: text('email').primaryKey(),
  otpHash: text('otp_hash'),
  otpExpiresAt: integer('otp_expires_at', { mode: 'timestamp' }),
  sendCount: integer('send_count').default(0),
  verifyAttempts: integer('verify_attempts').default(0),
  failedAttempts: integer('failed_attempts').default(0),
  lockedUntil: integer('locked_until', { mode: 'timestamp' }),
  lastAttemptAt: integer('last_attempt_at', { mode: 'timestamp' }),
}, (table) => ({
  lockedIdx: index('otp_attempts_locked_idx').on(table.lockedUntil),
}))

// ============================================
// Health Reports Tables
// ============================================

/**
 * Health reports table
 * Stores health telemetry from SDK devices for app health monitoring
 *
 * @agent health-reports
 */
export const healthReports = sqliteTable('health_reports', {
  id: text('id').primaryKey(),
  deviceId: text('device_id').notNull(),
  appId: text('app_id').notNull().references(() => apps.id),
  releaseId: text('release_id').references(() => releases.id),
  updateSuccess: integer('update_success', { mode: 'boolean' }),
  updateDuration: integer('update_duration'), // milliseconds
  crashDetected: integer('crash_detected', { mode: 'boolean' }).default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
}, (table) => ({
  appIdx: index('health_reports_app_idx').on(table.appId),
  deviceIdx: index('health_reports_device_idx').on(table.deviceId),
  releaseIdx: index('health_reports_release_idx').on(table.releaseId),
  createdIdx: index('health_reports_created_idx').on(table.createdAt),
  appCreatedIdx: index('health_reports_app_created_idx').on(table.appId, table.createdAt),
}))
