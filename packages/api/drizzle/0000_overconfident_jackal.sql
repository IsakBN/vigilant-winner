CREATE TABLE `admin_audit_log` (
	`id` text PRIMARY KEY NOT NULL,
	`admin_id` text NOT NULL,
	`action` text NOT NULL,
	`target_user_id` text,
	`target_app_id` text,
	`details` text,
	`ip_address` text,
	`user_agent` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `admin_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`admin_id` text NOT NULL,
	`token_hash` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`admin_id`) REFERENCES `admins`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `admins` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`name` text NOT NULL,
	`password_hash` text NOT NULL,
	`role` text DEFAULT 'admin' NOT NULL,
	`permissions` text,
	`last_login_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `android_builds` (
	`id` text PRIMARY KEY NOT NULL,
	`app_id` text NOT NULL,
	`version` text NOT NULL,
	`version_code` integer NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`build_type` text DEFAULT 'release' NOT NULL,
	`flavor` text,
	`package_name` text NOT NULL,
	`keystore_alias` text,
	`worker_id` text,
	`artifact_url` text,
	`artifact_size` integer,
	`artifact_type` text DEFAULT 'apk' NOT NULL,
	`logs` text,
	`error` text,
	`started_at` integer,
	`completed_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`app_id`) REFERENCES `apps`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `api_keys` (
	`id` text PRIMARY KEY NOT NULL,
	`app_id` text NOT NULL,
	`name` text NOT NULL,
	`key_prefix` text NOT NULL,
	`key_hash` text NOT NULL,
	`permissions` text NOT NULL,
	`last_used_at` integer,
	`revoked_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`app_id`) REFERENCES `apps`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `app_repos` (
	`id` text PRIMARY KEY NOT NULL,
	`app_id` text NOT NULL,
	`repo_full_name` text NOT NULL,
	`repo_branch` text DEFAULT 'main',
	`installation_id` text NOT NULL,
	`auto_publish` integer DEFAULT false,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`app_id`) REFERENCES `apps`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `apps` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`bundle_id` text,
	`platform` text NOT NULL,
	`owner_id` text NOT NULL,
	`api_key` text NOT NULL,
	`webhook_secret` text NOT NULL,
	`settings` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer
);
--> statement-breakpoint
CREATE TABLE `channels` (
	`id` text PRIMARY KEY NOT NULL,
	`app_id` text NOT NULL,
	`name` text NOT NULL,
	`display_name` text NOT NULL,
	`description` text,
	`is_default` integer DEFAULT false,
	`rollout_percentage` integer DEFAULT 100,
	`targeting_rules` text,
	`active_release_id` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`app_id`) REFERENCES `apps`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `crash_integrations` (
	`id` text PRIMARY KEY NOT NULL,
	`app_id` text NOT NULL,
	`provider` text NOT NULL,
	`config` text NOT NULL,
	`is_active` integer DEFAULT true,
	`last_triggered_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`app_id`) REFERENCES `apps`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `devices` (
	`id` text PRIMARY KEY NOT NULL,
	`app_id` text NOT NULL,
	`device_id` text NOT NULL,
	`platform` text NOT NULL,
	`os_version` text,
	`device_model` text,
	`timezone` text,
	`locale` text,
	`app_version` text NOT NULL,
	`current_bundle_version` text,
	`current_bundle_hash` text,
	`target_group` text,
	`token_hash` text,
	`token_expires_at` integer,
	`last_seen_at` integer,
	`revoked_at` integer,
	`crash_count` integer DEFAULT 0,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`app_id`) REFERENCES `apps`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `email_verification_tokens` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`token` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `github_installations` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`installation_id` text NOT NULL,
	`account_type` text,
	`account_login` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `health_reports` (
	`id` text PRIMARY KEY NOT NULL,
	`device_id` text NOT NULL,
	`app_id` text NOT NULL,
	`release_id` text,
	`update_success` integer,
	`update_duration` integer,
	`crash_detected` integer DEFAULT false,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`app_id`) REFERENCES `apps`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`release_id`) REFERENCES `releases`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `invoices` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`subscription_id` text,
	`stripe_customer_id` text NOT NULL,
	`stripe_invoice_url` text,
	`stripe_pdf_url` text,
	`status` text NOT NULL,
	`currency` text DEFAULT 'usd' NOT NULL,
	`amount_due` integer NOT NULL,
	`amount_paid` integer DEFAULT 0 NOT NULL,
	`period_start` integer,
	`period_end` integer,
	`paid_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`subscription_id`) REFERENCES `subscriptions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `ios_builds` (
	`id` text PRIMARY KEY NOT NULL,
	`app_id` text NOT NULL,
	`version` text NOT NULL,
	`build_number` integer NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`configuration` text DEFAULT 'release' NOT NULL,
	`bundle_id` text NOT NULL,
	`team_id` text,
	`provisioning_profile` text,
	`worker_id` text,
	`artifact_url` text,
	`artifact_size` integer,
	`logs` text,
	`error` text,
	`started_at` integer,
	`completed_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`app_id`) REFERENCES `apps`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `member_project_access` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`user_id` text NOT NULL,
	`app_id` text NOT NULL,
	`granted_by` text NOT NULL,
	`granted_at` integer NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`app_id`) REFERENCES `apps`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `newsletter_campaigns` (
	`id` text PRIMARY KEY NOT NULL,
	`subject` text NOT NULL,
	`content` text NOT NULL,
	`preview_text` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`scheduled_for` integer,
	`sent_at` integer,
	`recipient_count` integer,
	`open_count` integer DEFAULT 0,
	`click_count` integer DEFAULT 0,
	`created_by` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer
);
--> statement-breakpoint
CREATE TABLE `newsletter_subscribers` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`name` text,
	`subscribed_at` integer NOT NULL,
	`unsubscribed_at` integer,
	`source` text
);
--> statement-breakpoint
CREATE TABLE `organization_members` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`user_id` text NOT NULL,
	`role` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `organizations` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text,
	`owner_id` text NOT NULL,
	`plan_id` text,
	`domain` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`plan_id`) REFERENCES `subscription_plans`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `otp_attempts` (
	`email` text PRIMARY KEY NOT NULL,
	`otp_hash` text,
	`otp_expires_at` integer,
	`send_count` integer DEFAULT 0,
	`verify_attempts` integer DEFAULT 0,
	`failed_attempts` integer DEFAULT 0,
	`locked_until` integer,
	`last_attempt_at` integer
);
--> statement-breakpoint
CREATE TABLE `password_reset_tokens` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`token` text NOT NULL,
	`expires_at` integer NOT NULL,
	`used_at` integer,
	`created_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `project_members` (
	`id` text PRIMARY KEY NOT NULL,
	`app_id` text NOT NULL,
	`user_id` text NOT NULL,
	`role` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`app_id`) REFERENCES `apps`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `release_stats` (
	`release_id` text PRIMARY KEY NOT NULL,
	`total_downloads` integer DEFAULT 0,
	`total_installs` integer DEFAULT 0,
	`total_rollbacks` integer DEFAULT 0,
	`total_crashes` integer DEFAULT 0,
	`last_updated_at` integer NOT NULL,
	FOREIGN KEY (`release_id`) REFERENCES `releases`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `releases` (
	`id` text PRIMARY KEY NOT NULL,
	`app_id` text NOT NULL,
	`channel_id` text,
	`version` text NOT NULL,
	`bundle_url` text NOT NULL,
	`bundle_size` integer NOT NULL,
	`bundle_hash` text NOT NULL,
	`rollout_percentage` integer DEFAULT 100,
	`targeting_rules` text,
	`release_notes` text,
	`status` text DEFAULT 'active',
	`rollback_reason` text,
	`min_app_version` text,
	`max_app_version` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`app_id`) REFERENCES `apps`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`channel_id`) REFERENCES `channels`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `rollback_reports` (
	`id` text PRIMARY KEY NOT NULL,
	`device_id` text NOT NULL,
	`release_id` text NOT NULL,
	`reason` text NOT NULL,
	`failed_events` text,
	`failed_endpoints` text,
	`previous_version` text,
	`timestamp` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`release_id`) REFERENCES `releases`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `scheduled_emails` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`email` text NOT NULL,
	`template` text NOT NULL,
	`scheduled_for` integer NOT NULL,
	`sent_at` integer,
	`failed_at` integer,
	`failure_reason` text,
	`metadata` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `stripe_webhook_events` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`processed` integer DEFAULT false,
	`error` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `subscription_plans` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`display_name` text NOT NULL,
	`price_cents` integer NOT NULL,
	`stripe_price_id` text,
	`mau_limit` integer NOT NULL,
	`storage_gb` integer NOT NULL,
	`bundle_retention` integer NOT NULL,
	`features` text,
	`is_active` integer DEFAULT true,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`plan_id` text NOT NULL,
	`status` text DEFAULT 'active',
	`stripe_customer_id` text,
	`stripe_subscription_id` text,
	`current_period_start` integer,
	`current_period_end` integer,
	`cancel_at_period_end` integer DEFAULT false,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`plan_id`) REFERENCES `subscription_plans`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `team_audit_log` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`user_id` text NOT NULL,
	`event` text NOT NULL,
	`metadata` text,
	`ip_address` text,
	`user_agent` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `team_invitations` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`email` text NOT NULL,
	`role` text NOT NULL,
	`token` text NOT NULL,
	`invited_by` text NOT NULL,
	`scope` text DEFAULT 'full' NOT NULL,
	`project_ids` text,
	`expires_at` integer NOT NULL,
	`accepted_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `telemetry_events` (
	`id` text PRIMARY KEY NOT NULL,
	`device_id` text NOT NULL,
	`app_id` text NOT NULL,
	`event_type` text NOT NULL,
	`release_id` text,
	`bundle_version` text,
	`error_code` text,
	`error_message` text,
	`metadata` text,
	`timestamp` integer NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `user_limit_overrides` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`mau_limit` integer,
	`storage_gb` integer,
	`expires_at` integer,
	`reason` text,
	`created_by` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `user_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`token` text NOT NULL,
	`expires_at` integer NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`created_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `user_suspensions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`reason` text NOT NULL,
	`until` integer,
	`suspended_by` text NOT NULL,
	`lifted_at` integer,
	`lifted_by` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`name` text,
	`password_hash` text,
	`email_verified` integer DEFAULT false,
	`email_verified_at` integer,
	`avatar_url` text,
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
CREATE TABLE `webhook_events` (
	`id` text PRIMARY KEY NOT NULL,
	`webhook_id` text NOT NULL,
	`event` text NOT NULL,
	`payload` text NOT NULL,
	`status` text NOT NULL,
	`status_code` integer,
	`error_message` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`webhook_id`) REFERENCES `webhooks`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `webhooks` (
	`id` text PRIMARY KEY NOT NULL,
	`app_id` text NOT NULL,
	`url` text NOT NULL,
	`events` text NOT NULL,
	`secret` text NOT NULL,
	`is_active` integer DEFAULT true,
	`last_triggered_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`app_id`) REFERENCES `apps`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `worker_nodes` (
	`id` text PRIMARY KEY NOT NULL,
	`node_pool` text,
	`hostname` text,
	`status` text DEFAULT 'offline' NOT NULL,
	`current_build_id` text,
	`last_heartbeat_at` integer,
	`total_builds` integer DEFAULT 0,
	`failed_builds` integer DEFAULT 0,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `admin_audit_admin_idx` ON `admin_audit_log` (`admin_id`);--> statement-breakpoint
CREATE INDEX `admin_audit_action_idx` ON `admin_audit_log` (`action`);--> statement-breakpoint
CREATE INDEX `admin_audit_target_user_idx` ON `admin_audit_log` (`target_user_id`);--> statement-breakpoint
CREATE INDEX `admin_audit_target_app_idx` ON `admin_audit_log` (`target_app_id`);--> statement-breakpoint
CREATE INDEX `admin_audit_created_idx` ON `admin_audit_log` (`created_at`);--> statement-breakpoint
CREATE INDEX `admin_sessions_admin_idx` ON `admin_sessions` (`admin_id`);--> statement-breakpoint
CREATE INDEX `admin_sessions_token_hash_idx` ON `admin_sessions` (`token_hash`);--> statement-breakpoint
CREATE INDEX `admin_sessions_expires_idx` ON `admin_sessions` (`expires_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `admins_email_unique` ON `admins` (`email`);--> statement-breakpoint
CREATE INDEX `admins_email_idx` ON `admins` (`email`);--> statement-breakpoint
CREATE INDEX `admins_role_idx` ON `admins` (`role`);--> statement-breakpoint
CREATE INDEX `android_builds_app_idx` ON `android_builds` (`app_id`);--> statement-breakpoint
CREATE INDEX `android_builds_status_idx` ON `android_builds` (`status`);--> statement-breakpoint
CREATE INDEX `android_builds_created_idx` ON `android_builds` (`created_at`);--> statement-breakpoint
CREATE INDEX `android_builds_app_version_code_idx` ON `android_builds` (`app_id`,`version`,`version_code`);--> statement-breakpoint
CREATE INDEX `api_keys_app_idx` ON `api_keys` (`app_id`);--> statement-breakpoint
CREATE INDEX `api_keys_prefix_idx` ON `api_keys` (`key_prefix`);--> statement-breakpoint
CREATE INDEX `app_repos_app_idx` ON `app_repos` (`app_id`);--> statement-breakpoint
CREATE INDEX `app_repos_repo_idx` ON `app_repos` (`repo_full_name`);--> statement-breakpoint
CREATE INDEX `apps_owner_idx` ON `apps` (`owner_id`);--> statement-breakpoint
CREATE INDEX `apps_bundle_id_idx` ON `apps` (`bundle_id`);--> statement-breakpoint
CREATE INDEX `apps_api_key_idx` ON `apps` (`api_key`);--> statement-breakpoint
CREATE INDEX `channels_app_idx` ON `channels` (`app_id`);--> statement-breakpoint
CREATE INDEX `channels_app_name_idx` ON `channels` (`app_id`,`name`);--> statement-breakpoint
CREATE INDEX `channels_default_idx` ON `channels` (`app_id`,`is_default`);--> statement-breakpoint
CREATE INDEX `crash_integrations_app_idx` ON `crash_integrations` (`app_id`);--> statement-breakpoint
CREATE INDEX `crash_integrations_provider_idx` ON `crash_integrations` (`provider`);--> statement-breakpoint
CREATE INDEX `crash_integrations_active_idx` ON `crash_integrations` (`is_active`);--> statement-breakpoint
CREATE INDEX `devices_app_idx` ON `devices` (`app_id`);--> statement-breakpoint
CREATE INDEX `devices_device_id_idx` ON `devices` (`device_id`);--> statement-breakpoint
CREATE INDEX `devices_app_device_idx` ON `devices` (`app_id`,`device_id`);--> statement-breakpoint
CREATE INDEX `devices_last_seen_idx` ON `devices` (`last_seen_at`);--> statement-breakpoint
CREATE INDEX `devices_target_group_idx` ON `devices` (`app_id`,`target_group`);--> statement-breakpoint
CREATE UNIQUE INDEX `email_verification_tokens_token_unique` ON `email_verification_tokens` (`token`);--> statement-breakpoint
CREATE INDEX `email_verification_tokens_user_idx` ON `email_verification_tokens` (`user_id`);--> statement-breakpoint
CREATE INDEX `email_verification_tokens_token_idx` ON `email_verification_tokens` (`token`);--> statement-breakpoint
CREATE INDEX `email_verification_tokens_expires_idx` ON `email_verification_tokens` (`expires_at`);--> statement-breakpoint
CREATE INDEX `github_installations_user_idx` ON `github_installations` (`user_id`);--> statement-breakpoint
CREATE INDEX `github_installations_installation_idx` ON `github_installations` (`installation_id`);--> statement-breakpoint
CREATE INDEX `health_reports_app_idx` ON `health_reports` (`app_id`);--> statement-breakpoint
CREATE INDEX `health_reports_device_idx` ON `health_reports` (`device_id`);--> statement-breakpoint
CREATE INDEX `health_reports_release_idx` ON `health_reports` (`release_id`);--> statement-breakpoint
CREATE INDEX `health_reports_created_idx` ON `health_reports` (`created_at`);--> statement-breakpoint
CREATE INDEX `health_reports_app_created_idx` ON `health_reports` (`app_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `invoices_user_idx` ON `invoices` (`user_id`);--> statement-breakpoint
CREATE INDEX `invoices_customer_idx` ON `invoices` (`stripe_customer_id`);--> statement-breakpoint
CREATE INDEX `invoices_status_idx` ON `invoices` (`status`);--> statement-breakpoint
CREATE INDEX `invoices_created_idx` ON `invoices` (`created_at`);--> statement-breakpoint
CREATE INDEX `ios_builds_app_idx` ON `ios_builds` (`app_id`);--> statement-breakpoint
CREATE INDEX `ios_builds_status_idx` ON `ios_builds` (`status`);--> statement-breakpoint
CREATE INDEX `ios_builds_created_idx` ON `ios_builds` (`created_at`);--> statement-breakpoint
CREATE INDEX `ios_builds_app_version_build_idx` ON `ios_builds` (`app_id`,`version`,`build_number`);--> statement-breakpoint
CREATE INDEX `member_project_access_org_idx` ON `member_project_access` (`organization_id`);--> statement-breakpoint
CREATE INDEX `member_project_access_user_idx` ON `member_project_access` (`user_id`);--> statement-breakpoint
CREATE INDEX `member_project_access_app_idx` ON `member_project_access` (`app_id`);--> statement-breakpoint
CREATE INDEX `member_project_access_org_user_app_idx` ON `member_project_access` (`organization_id`,`user_id`,`app_id`);--> statement-breakpoint
CREATE INDEX `newsletter_campaigns_status_idx` ON `newsletter_campaigns` (`status`);--> statement-breakpoint
CREATE INDEX `newsletter_campaigns_created_idx` ON `newsletter_campaigns` (`created_at`);--> statement-breakpoint
CREATE INDEX `newsletter_campaigns_scheduled_idx` ON `newsletter_campaigns` (`scheduled_for`);--> statement-breakpoint
CREATE UNIQUE INDEX `newsletter_subscribers_email_unique` ON `newsletter_subscribers` (`email`);--> statement-breakpoint
CREATE INDEX `newsletter_subscribers_email_idx` ON `newsletter_subscribers` (`email`);--> statement-breakpoint
CREATE INDEX `newsletter_subscribers_subscribed_idx` ON `newsletter_subscribers` (`subscribed_at`);--> statement-breakpoint
CREATE INDEX `newsletter_subscribers_source_idx` ON `newsletter_subscribers` (`source`);--> statement-breakpoint
CREATE INDEX `org_members_org_idx` ON `organization_members` (`organization_id`);--> statement-breakpoint
CREATE INDEX `org_members_user_idx` ON `organization_members` (`user_id`);--> statement-breakpoint
CREATE INDEX `org_members_org_user_idx` ON `organization_members` (`organization_id`,`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `organizations_slug_unique` ON `organizations` (`slug`);--> statement-breakpoint
CREATE INDEX `organizations_owner_idx` ON `organizations` (`owner_id`);--> statement-breakpoint
CREATE INDEX `organizations_slug_idx` ON `organizations` (`slug`);--> statement-breakpoint
CREATE INDEX `otp_attempts_locked_idx` ON `otp_attempts` (`locked_until`);--> statement-breakpoint
CREATE UNIQUE INDEX `password_reset_tokens_token_unique` ON `password_reset_tokens` (`token`);--> statement-breakpoint
CREATE INDEX `password_reset_tokens_user_idx` ON `password_reset_tokens` (`user_id`);--> statement-breakpoint
CREATE INDEX `password_reset_tokens_token_idx` ON `password_reset_tokens` (`token`);--> statement-breakpoint
CREATE INDEX `password_reset_tokens_expires_idx` ON `password_reset_tokens` (`expires_at`);--> statement-breakpoint
CREATE INDEX `project_members_app_idx` ON `project_members` (`app_id`);--> statement-breakpoint
CREATE INDEX `project_members_user_idx` ON `project_members` (`user_id`);--> statement-breakpoint
CREATE INDEX `project_members_app_user_idx` ON `project_members` (`app_id`,`user_id`);--> statement-breakpoint
CREATE INDEX `releases_app_idx` ON `releases` (`app_id`);--> statement-breakpoint
CREATE INDEX `releases_channel_idx` ON `releases` (`channel_id`);--> statement-breakpoint
CREATE INDEX `releases_status_idx` ON `releases` (`status`);--> statement-breakpoint
CREATE INDEX `releases_created_idx` ON `releases` (`created_at`);--> statement-breakpoint
CREATE INDEX `rollback_reports_device_idx` ON `rollback_reports` (`device_id`);--> statement-breakpoint
CREATE INDEX `rollback_reports_release_idx` ON `rollback_reports` (`release_id`);--> statement-breakpoint
CREATE INDEX `rollback_reports_reason_idx` ON `rollback_reports` (`reason`);--> statement-breakpoint
CREATE INDEX `rollback_reports_timestamp_idx` ON `rollback_reports` (`timestamp`);--> statement-breakpoint
CREATE INDEX `rollback_reports_created_idx` ON `rollback_reports` (`created_at`);--> statement-breakpoint
CREATE INDEX `scheduled_emails_user_idx` ON `scheduled_emails` (`user_id`);--> statement-breakpoint
CREATE INDEX `scheduled_emails_template_idx` ON `scheduled_emails` (`template`);--> statement-breakpoint
CREATE INDEX `scheduled_emails_scheduled_for_idx` ON `scheduled_emails` (`scheduled_for`);--> statement-breakpoint
CREATE INDEX `scheduled_emails_sent_idx` ON `scheduled_emails` (`sent_at`);--> statement-breakpoint
CREATE INDEX `scheduled_emails_failed_idx` ON `scheduled_emails` (`failed_at`);--> statement-breakpoint
CREATE INDEX `stripe_webhook_events_type_idx` ON `stripe_webhook_events` (`type`);--> statement-breakpoint
CREATE INDEX `stripe_webhook_events_processed_idx` ON `stripe_webhook_events` (`processed`);--> statement-breakpoint
CREATE UNIQUE INDEX `subscription_plans_name_unique` ON `subscription_plans` (`name`);--> statement-breakpoint
CREATE INDEX `subscriptions_user_idx` ON `subscriptions` (`user_id`);--> statement-breakpoint
CREATE INDEX `subscriptions_stripe_customer_idx` ON `subscriptions` (`stripe_customer_id`);--> statement-breakpoint
CREATE INDEX `subscriptions_stripe_sub_idx` ON `subscriptions` (`stripe_subscription_id`);--> statement-breakpoint
CREATE INDEX `team_audit_org_idx` ON `team_audit_log` (`organization_id`);--> statement-breakpoint
CREATE INDEX `team_audit_user_idx` ON `team_audit_log` (`user_id`);--> statement-breakpoint
CREATE INDEX `team_audit_event_idx` ON `team_audit_log` (`event`);--> statement-breakpoint
CREATE INDEX `team_audit_created_idx` ON `team_audit_log` (`created_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `team_invitations_token_unique` ON `team_invitations` (`token`);--> statement-breakpoint
CREATE INDEX `team_invitations_org_idx` ON `team_invitations` (`organization_id`);--> statement-breakpoint
CREATE INDEX `team_invitations_token_idx` ON `team_invitations` (`token`);--> statement-breakpoint
CREATE INDEX `team_invitations_email_idx` ON `team_invitations` (`email`);--> statement-breakpoint
CREATE INDEX `team_invitations_scope_idx` ON `team_invitations` (`scope`);--> statement-breakpoint
CREATE INDEX `telemetry_app_idx` ON `telemetry_events` (`app_id`);--> statement-breakpoint
CREATE INDEX `telemetry_device_idx` ON `telemetry_events` (`device_id`);--> statement-breakpoint
CREATE INDEX `telemetry_event_type_idx` ON `telemetry_events` (`event_type`);--> statement-breakpoint
CREATE INDEX `telemetry_timestamp_idx` ON `telemetry_events` (`timestamp`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_limit_overrides_user_id_unique` ON `user_limit_overrides` (`user_id`);--> statement-breakpoint
CREATE INDEX `user_limit_overrides_user_idx` ON `user_limit_overrides` (`user_id`);--> statement-breakpoint
CREATE INDEX `user_limit_overrides_expires_idx` ON `user_limit_overrides` (`expires_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_sessions_token_unique` ON `user_sessions` (`token`);--> statement-breakpoint
CREATE INDEX `user_sessions_user_idx` ON `user_sessions` (`user_id`);--> statement-breakpoint
CREATE INDEX `user_sessions_token_idx` ON `user_sessions` (`token`);--> statement-breakpoint
CREATE INDEX `user_sessions_expires_idx` ON `user_sessions` (`expires_at`);--> statement-breakpoint
CREATE INDEX `user_suspensions_user_idx` ON `user_suspensions` (`user_id`);--> statement-breakpoint
CREATE INDEX `user_suspensions_lifted_idx` ON `user_suspensions` (`lifted_at`);--> statement-breakpoint
CREATE INDEX `user_suspensions_until_idx` ON `user_suspensions` (`until`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE INDEX `users_email_idx` ON `users` (`email`);--> statement-breakpoint
CREATE INDEX `webhook_events_webhook_idx` ON `webhook_events` (`webhook_id`);--> statement-breakpoint
CREATE INDEX `webhook_events_status_idx` ON `webhook_events` (`status`);--> statement-breakpoint
CREATE INDEX `webhook_events_created_idx` ON `webhook_events` (`created_at`);--> statement-breakpoint
CREATE INDEX `webhooks_app_idx` ON `webhooks` (`app_id`);--> statement-breakpoint
CREATE INDEX `webhooks_active_idx` ON `webhooks` (`is_active`);--> statement-breakpoint
CREATE INDEX `worker_nodes_status_idx` ON `worker_nodes` (`status`);--> statement-breakpoint
CREATE INDEX `worker_nodes_pool_idx` ON `worker_nodes` (`node_pool`);--> statement-breakpoint
CREATE INDEX `worker_nodes_heartbeat_idx` ON `worker_nodes` (`last_heartbeat_at`);