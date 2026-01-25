# BundleNudge API - Complete Feature List

A comprehensive inventory of all API routes, webhooks, and features in the BundleNudge platform.

---

## 🔐 Authentication & Authorization

### Better-Auth (`/api/auth/*`)
| Feature | Description |
|---------|-------------|
| Email/Password Sign-up | Create account with email verification via OTP |
| Email/Password Sign-in | Traditional login with email and password |
| GitHub OAuth | Sign in with GitHub account |
| Email OTP Verification | 6-digit code sent via email for account verification |
| Password Reset | Email-based password reset flow |
| Session Management | 7-day sessions with 24-hour refresh, cookie-based |
| Cross-Subdomain Cookies | Seamless auth across `api.bundlenudge.com` and `www.bundlenudge.com` |

### Extended Auth (`/auth/*`)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/me` | GET | Get current user info (syncs with Better-Auth session) |
| `/sync` | POST | Sync user profile updates |
| `/logout` | POST | Logout (for audit logging, session handled by Better-Auth) |

### Admin Auth (`/admin-auth/*`)
| Endpoint | Method | Description |
|----------|--------|-------------|
| OTP Login | POST | 2FA for admin access requiring @bundlenudge.com email |

---

## 📱 Apps Management (`/apps/*`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/apps` | GET | List user's apps with usage metrics (MAU, storage) |
| `/apps` | POST | Create new app (connect GitHub repo) |
| `/apps/:appId` | GET | Get app details |
| `/apps/:appId` | PATCH | Update app settings |
| `/apps/:appId` | DELETE | Delete app |
| `/apps/:appId/keys` | GET | List API keys *(deprecated - use keyless auth)* |
| `/apps/:appId/keys` | POST | Generate new API key *(deprecated - use keyless auth)* |
| `/apps/:appId/keys/:keyId` | DELETE | Revoke API key *(deprecated - use keyless auth)* |
| `/apps/:appId/setup-status` | GET | Get SDK setup status |
| `/apps/:appId/health` | GET | Get app health metrics (devices, success rate, rollbacks, funnel) |
| `/apps/repos` | GET | List GitHub repos from App installations |
| `/apps/repos/:installationId/:owner/:repo/contents` | GET | Browse repo directory contents |

### Usage/Tier System
- **MAU (Monthly Active Users)** tracking from `device_pings`
- **Storage usage** calculation from bundle sizes
- **Plan limits** enforcement (Free: 10K MAU, Pro: 50K MAU, Team: 500K MAU)
- **Hard limit** at 110% - blocks updates when exceeded
- **Overage email notifications** sent automatically

---

## 🚀 Releases Management (`/releases/*`)

### Core CRUD
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/:appId` | GET | List releases for an app |
| `/:appId/:releaseId` | GET | Get release details with device stats |
| `/:appId/:releaseId` | PATCH | Update release targeting |

### Logs (`/:appId/logs`, `/:appId/:releaseId/logs`)
- View device logs for debugging
- Filter by app or specific release

### Scheduling (`/:appId/:releaseId/schedule`, `/rollback`)
| Feature | Description |
|---------|-------------|
| Schedule Release | Schedule activation at a future date/time |
| Rollback | Instantly rollback to a previous release |

### Health Checks (`/:appId/:releaseId/health`)
| Feature | Description |
|---------|-------------|
| Health Stats | Aggregated health check statistics |
| Pass Rate | Overall success rate of health checks |
| Failure Analysis | Breakdown by endpoint, recent failures |

### A/B Testing (`/:appId/ab-test`, `/:appId/ab-tests`)
| Feature | Description |
|---------|-------------|
| Create A/B Test | Create multi-variant experiment |
| List A/B Tests | View all experiments for an app |
| Version Distribution | Analyze bundle version distribution across devices |
| Variant Metrics | Track metrics per variant (sessions, crashes, custom events) |

---

## 📲 SDK Endpoints

### Update Checks (`/v1/updates/*`)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/check` | POST | Check for available updates |
| `/downloaded` | POST | Report download complete |
| `/applied` | POST | Report update applied |
| `/rollback` | POST | Report SDK auto-rollback triggered |
| `/health-failure` | POST | Report health check failure (privacy-first: only on failure) |

**Features:**
- **Delta patches** - Only download changed code
- **Rollout percentage** - Gradual rollout to X% of devices
- **Device targeting** - Allowlist/blocklist specific devices
- **A/B experiment assignment** - Auto-assign to experiment variants
- **Min version checks** - Require App Store update if native version too old
- **MAU tracking** - Count unique devices for billing

### Bundles (`/v1/bundles/*`)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/:bundleKey` | GET | Download full JS bundle (key from update check response) |
| `/patches/:fromReleaseId-to-:toReleaseId.json` | GET | Download delta patch |

### Metrics (`/v1/metrics/*`)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/report` | POST | Report custom metrics from SDK |
| `/crash` | POST | Report crash with stack trace |

### Upload Queue (`/v1/uploads/*`)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | POST | Enqueue bundle upload (multipart) |
| `/:jobId` | GET | Get upload job status |
| `/:jobId` | DELETE | Cancel queued upload |

**Features:**
- **Priority queues** - P0-P3 based on subscription tier
- **Concurrent upload limits** - Per subscription tier
- **Size limits** - 20MB free, 50MB pro, 100MB team
- **R2 storage** - Cloudflare R2 for bundle storage

### Health Reports (`/v1/releases/*`)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/:releaseId/health-report` | POST | SDK reports health check results |
| `/:releaseId/health-stats` | GET | Dashboard gets aggregated health stats |

> Note: Health failure reporting is handled via `/v1/updates/health-failure` (above)

### Device Registration - Keyless Auth (`/v1/devices/*`)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/register` | POST | Register device, receive device token |
| `/refresh` | POST | Refresh device token |
| `/` | GET | List registered devices (dashboard) |
| `/:deviceId/revoke` | POST | Revoke device token |

**Features:**
- **Keyless SDK auth** - No embedded API keys needed
- **JWT device tokens** - Signed with app's webhook secret
- **Token rotation** - Auto-refresh before expiry
- **Device fingerprinting** - Optional fraud prevention

---

## 💳 Subscriptions & Billing (`/subscriptions/*`)

### Plans
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/plans` | GET | List available subscription plans (public) |
| `/plans` | POST | Create/update plan (admin only) |
| `/seed-plans` | POST | Seed default plans (admin only) |

### User Subscription
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/me` | GET | Get current user's subscription |

### Stripe Integration
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/checkout` | POST | Create Stripe checkout session |
| `/portal` | POST | Create Stripe customer portal session |
| `/usage` | GET | Get current usage stats |
| `/webhook` | POST | Handle Stripe webhooks |

**Supported Stripe Events:**
- `checkout.session.completed` - Create subscription
- `customer.subscription.updated` - Update status/period
- `customer.subscription.deleted` - Mark as expired
- `invoice.payment_failed` - Mark as past_due

### Pricing Tiers
| Tier | Price | MAU Limit | Storage | Bundle Retention |
|------|-------|-----------|---------|------------------|
| Free | $0 | 10,000 | 5 GB | 5 versions |
| Pro | $19.99 | 50,000 | 50 GB | 15 versions |
| Team | $99.99 | 500,000 | 500 GB | 50 versions |
| Enterprise | Custom | Unlimited | Unlimited | 100 versions |

> ⚠️ **Note:** Storage limits should be verified in `subscriptions/index.ts` seed-plans function as source of truth.

---

## 👥 Teams/Organizations (`/teams/*`)

### Team CRUD
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | List user's teams |
| `/` | POST | Create a new team |
| `/:teamId` | GET | Get team details |
| `/:teamId` | PATCH | Update team |
| `/:teamId` | DELETE | Delete team (owner only) |

### Members (`/:teamId/members/*`)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | List team members |
| `/:memberId` | PATCH | Update member role |
| `/:memberId` | DELETE | Remove member |

### Invitations (`/:teamId/invitations/*`)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | List pending invitations |
| `/` | POST | Invite a member |
| `/:id/resend` | POST | Resend invitation email |
| `/:id` | DELETE | Cancel invitation |
| `/verify-invite` | POST | Verify OTP and join team |

### Project Access (`/:teamId/members/:memberId/projects/*`)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Get member's project access |
| `/` | PUT | Update member's project access |

### Audit Log (`/:teamId/audit-log`)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Get team audit log |

---

## 🧪 Test Devices (`/devices/*`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/:appId` | GET | List devices for an app |
| `/:appId` | POST | Add a test device (UDID) |
| `/:appId/bulk` | POST | Bulk add devices |
| `/:appId/export` | GET | Export devices as CSV |
| `/:appId/:deviceId` | GET | Get device details |
| `/:appId/:deviceId` | PUT | Update device info |
| `/:appId/:deviceId` | DELETE | Remove device |
| `/:appId/register` | POST | Register devices with Apple |

**Features:**
- UDID validation (40-char hex)
- Apple App Store Connect integration for device registration
- CSV import/export

---

## 👤 Testers (`/testers/*`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/:appId` | GET | List testers for an app |
| `/:appId` | POST | Add a tester |
| `/:appId/bulk` | POST | Bulk add testers |
| `/:appId/export` | GET | Export testers as CSV |
| `/:appId/import` | POST | Import from CSV |
| `/:appId/:testerId` | GET | Get tester details with stats |
| `/:appId/:testerId` | PATCH | Update tester |
| `/:appId/:testerId` | DELETE | Remove tester |

---

## 📧 Email Distribution (`/email/*`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/:appId/:buildId/send` | POST | Send build notification to testers |
| `/:appId/:buildId/sends` | GET | Get email send history |
| `/webhook` | POST | Handle Resend webhooks for tracking |

**Features:**
- **Resend integration** for transactional email
- **Open tracking** - Know who viewed the email
- **Click tracking** - Know who clicked install link
- **Install links** - Magic links for easy installation

---

## 🔑 Apple Credentials (`/credentials/*`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/:appId` | GET | List credentials for an app |
| `/:appId` | POST | Add new Apple credentials |
| `/:appId/:credentialId` | GET | Get credential details |
| `/:appId/:credentialId` | PUT | Update credential |
| `/:appId/:credentialId` | DELETE | Delete credential |
| `/:appId/:credentialId/verify` | POST | Verify against App Store Connect |

**Security:**
- Private keys encrypted at rest (AES-256-GCM)
- App Store Connect JWT generation for API calls

---

## 🔧 GitHub Integration

### GitHub App (`/github/*`)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/install` | GET | Initiate GitHub App installation |
| `/callback` | GET | Handle post-installation callback |
| `/installations` | GET | List accessible installations |
| `/installations/:id/repos` | GET | List repos in installation |
| `/webhook` | POST | Handle GitHub webhooks |

**Webhook Events:**
- `installation` - App installed/uninstalled
- `installation_repositories` - Repos added/removed
- `push` - Trigger OTA build on push

### GitHub OAuth (`/auth/github/*`)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/connect` | GET | Initiate OAuth flow |
| `/callback` | GET | Handle OAuth callback |

---

## 🔔 Webhooks & Notifications

### GitHub Webhook (`/webhook/:appId`)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | POST | Receive GitHub push webhook |
| `/build-complete` | POST | Build machine callback |

**Features:**
- HMAC signature verification
- Native dependency check before build
- Automatic build triggering

### Slack/Discord (`/webhooks/*`)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/:appId` | GET | List notification webhooks |
| `/:appId` | POST | Create webhook |
| `/:appId/:webhookId` | GET | Get webhook details |
| `/:appId/:webhookId` | PATCH | Update webhook |
| `/:appId/:webhookId` | DELETE | Delete webhook |
| `/:appId/:webhookId/test` | POST | Test webhook (send sample) |

**Supported Platforms:**
- Slack (incoming webhooks)
- Discord (webhooks)

---

## 🐛 Crash Integrations (`/apps/:appId/integrations/*`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | List crash integrations |
| `/` | POST | Create integration |
| `/:integrationId` | GET | Get integration details |
| `/:integrationId` | PATCH | Update integration |
| `/:integrationId` | DELETE | Delete integration |
| `/test` | POST | Test integration config |

**Supported Providers:**
- Sentry
- Bugsnag
- Firebase Crashlytics

**Features:**
- Config encrypted at rest
- Auto-rollback on crash spike detection

---

## 🏗️ iOS Build System (`/builds/*`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/:appId` | GET | List builds for an app |
| `/:appId` | POST | Queue a new build |
| `/:appId/:buildId` | GET | Get build details |
| `/:appId/:buildId/logs` | GET | Get build logs |
| `/:appId/:buildId/cancel` | POST | Cancel a build |
| `/:appId/:buildId` | DELETE | Delete a build |
| `/:appId/:buildId/install` | GET | Get install URL |
| `/upload` | POST | Upload build artifact |
| `/queue` | GET | Get build queue status |

**Features:**
- GitHub Actions workflow triggers
- Real-time log streaming
- IPA artifact storage in R2
- Ad-hoc distribution with manifest.plist
- Build cancellation

---

## 🤖 Android Build System (`/android-builds/*`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/:appId` | GET | List Android builds for an app |
| `/:appId` | POST | Queue a new Android build |
| `/:appId/:buildId` | GET | Get build details |
| `/:appId/:buildId/logs` | GET | Get build logs |
| `/:appId/:buildId/cancel` | POST | Cancel a build |
| `/:appId/:buildId` | DELETE | Delete a build |
| `/:appId/:buildId/download` | GET | Download APK/AAB artifact |

### Worker Endpoints (called by GitHub Actions)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/worker/:buildId/log` | POST | Append log entries |
| `/worker/:buildId/status` | POST | Update build status |

**Features:**
- APK or AAB output types
- Debug/Release build types
- Product flavor support
- Build variant configuration
- GitHub Actions workflow triggers
- Real-time log streaming

---

## 🔧 Android Credentials (`/android-credentials/*`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/:appId` | GET | List Android credentials for an app |
| `/:appId` | POST | Add new keystore credentials |
| `/:appId/:credentialId` | GET | Get credential details |
| `/:appId/:credentialId` | PUT | Update credential |
| `/:appId/:credentialId` | DELETE | Delete credential |

**Features:**
- Keystore file storage
- Key alias management
- Encrypted password storage (AES-256-GCM)

---

## 📏 Bundle Size Tracking (`/bundle-size/*`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/:appId/history` | GET | Get bundle size history for an app |
| `/:appId/analysis/:releaseId` | GET | Get detailed bundle analysis |
| `/:appId/alerts` | GET | Get bundle size alert settings |
| `/:appId/alerts` | PUT | Update alert settings |
| `/:appId/compare` | GET | Compare two releases |

**Features:**
- Size history tracking over time
- JS/assets breakdown analysis
- Threshold-based alerts (% increase or absolute size)
- Webhook notifications on size alerts
- Release comparison (delta, percentage change)
- Gzip size tracking

---

## 🤖 Build Nodes (`/nodes/*`) — *v2 / Planned*

> ⚠️ **Status: Planned for v2** — Not yet implemented. Currently builds use GitHub Actions.

### Admin Endpoints (Planned)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | List all build nodes |
| `/` | POST | Register new node |
| `/:nodeId` | GET | Get node details |
| `/:nodeId` | PUT | Update node settings |
| `/:nodeId` | DELETE | Remove node |
| `/:nodeId/rotate-token` | POST | Rotate auth token |
| `/:nodeId/heartbeats` | GET | Get recent heartbeats |
| `/stats` | GET | Get fleet statistics |

### Worker Endpoints (Planned)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/worker/heartbeat` | POST | Worker sends heartbeat |
| `/worker/build-complete` | POST | Worker reports completion |

---

## 📊 Dashboard Analytics (`/dashboard/*`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/overview` | GET | Dashboard overview with stats |

**Includes:**
- Total apps, devices, updates this week
- Success rate calculation
- Device/update trends
- Alerts (high rollback rate, high error rate)
- Daily sparkline data

---

## 📈 Metrics (`/metrics/*`, `/v1/metrics/*`)

### SDK Reporting
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/report` | POST | Report custom metrics |
| `/crash` | POST | Report crash |

### Dashboard Queries
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/releases/:releaseId/ab-results` | GET | Get A/B test results |
| `/releases/:releaseId/rollout` | GET | Get rollout progress (adoption, events) |
| `/releases/:releaseId/rollout` | PATCH | Update rollout percentage |
| `/releases/:releaseId/declare-winner` | POST | Declare A/B test winner |
| `/releases/:releaseId/rollback` | POST | Manual rollback trigger |
| `/releases/:releaseId/crashes` | GET | Get crash analytics |
| `/releases/:releaseId/auto-rollback` | PATCH | Update auto-rollback settings |

---

## 🛡️ Admin Panel (`/admin/*`)

### Overview
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/stats` | GET | Platform-wide stats |

### User Management
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/users` | GET | List all users with filtering |
| `/users/:userId` | GET | Get user details |
| `/users/:userId/override` | POST | Set limit override |
| `/users/:userId/suspend` | POST | Suspend user |
| `/users/:userId/unsuspend` | POST | Unsuspend user |

### App Management
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/apps` | GET | List all apps with filtering |
| `/apps/:appId` | GET | Get app details |
| `/apps/:appId/disable` | POST | Disable app |
| `/apps/:appId/enable` | POST | Enable app |

### Subscription Management
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/subscriptions` | GET | List all subscriptions |
| `/subscriptions/:id` | GET | Get subscription details |
| `/subscriptions/:id/extend` | POST | Extend subscription |
| `/subscriptions/:id/upgrade` | POST | Upgrade plan |
| `/subscriptions/:id/cancel` | POST | Cancel subscription |

### Plan Management
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/plans` | GET | List all plans |
| `/plans` | POST | Create plan |
| `/plans/:id` | PATCH | Update plan |

### Metrics & Monitoring
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/metrics` | GET | Platform metrics |
| `/metrics/hourly` | GET | Hourly breakdown |

### Data Management
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/data/export` | POST | Export user data |
| `/data/import` | POST | Import data |

### Backups
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/backups` | GET | List backups |
| `/backups` | POST | Trigger manual backup |
| `/backups/:id` | GET | Get backup details |
| `/backups/:id/restore` | POST | Restore from backup |

### Dashboard
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/dashboard/overview` | GET | Admin overview stats |
| `/dashboard/ota-health` | GET | OTA system health |
| `/dashboard/queues` | GET | Queue status |

---

## ⚙️ System & Health

### Health Check (`/health/*`)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Basic health status |
| `/detailed` | GET | Detailed system health |
| `/ready` | GET | Readiness probe |

**Checks:**
- D1 database connectivity
- R2 storage connectivity
- KV store connectivity
- External services (GitHub, Stripe, Resend)

### Contact (`/contact/*`)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/enterprise` | POST | Enterprise inquiry form |

### Accounts (`/accounts/*`)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/:accountId/uploads` | GET | List account uploads |

### Onboarding (`/onboarding/*`)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | List all features user has seen |
| `/:feature/complete` | POST | Mark a feature as seen |
| `/:feature` | DELETE | Reset feature (for testing) |
| `/` | DELETE | Reset all onboarding state |

**Valid Features:** `dashboard`, `releases`, `devices`, `builds`, `testers`, `credentials`, `settings`, `testing`, `audience`

### WebSocket (`/v1/ws/*`)
| Endpoint | Description |
|----------|-------------|
| `/upload/:jobId` | Real-time upload progress |

---

## ⏰ Scheduled Tasks (Cron)

### Every 5 Minutes (`*/5 * * * *`)
| Task | Description |
|------|-------------|
| Scheduled Releases | Activate releases due for deployment |
| Crash Monitor | Check crash rates, auto-rollback if threshold exceeded |
| Request Log Cleanup | Delete logs older than 7 days |

### Every Hour (`0 * * * *`)
| Task | Description |
|------|-------------|
| D1 Backup | Backup database to R2 |
| R2 Backup | Backup bundle metadata |
| Daily Cleanup (at midnight UTC) | Prune old backups |

---

## 📦 Queue Handlers

### Upload Queue (`upload-queue-p0` through `upload-queue-p3`)
| Handler | Description |
|---------|-------------|
| `handleUploadQueue` | Process bundle uploads by priority |

### Dead Letter Queue (`upload-dlq`)
| Handler | Description |
|---------|-------------|
| `handleDeadLetterQueue` | Process failed uploads for retry/alerting |

---

## 🔒 Security Features

| Feature | Description |
|---------|-------------|
| CORS | Strict origin allowlist |
| HSTS | Strict Transport Security in production |
| CSP | Content Security Policy headers |
| Rate Limiting | Per-endpoint limits (SDK: 120/min, Dashboard: 10/min) |
| Request Size Limits | 5MB default, 100MB for uploads |
| API Key Hashing | bcrypt for keys, SHA-256 for quick lookups |
| Encryption at Rest | AES-256-GCM for credentials & configs |
| Webhook Signature Verification | HMAC-SHA256 for GitHub, Stripe |

---

## 📊 Summary

| Category | Count |
|----------|-------|
| **Total API Route Files** | 50+ |
| **Total Endpoints** | 180+ |
| **Incoming Webhook Handlers** | 5 (GitHub Push, GitHub App, Stripe, Resend, Build Complete) |
| **Outgoing Webhooks** | 3 (Slack, Discord, Custom) |
| **Scheduled Tasks** | 5 |
| **Queue Handlers** | 2 (Upload Queue P0-P3, Dead Letter Queue) |
| **Auth Methods** | 4 (Email/Password, GitHub OAuth, OTP, Device Token) |
| **External Integrations** | 8 (GitHub, Stripe, Resend, Sentry, Bugsnag, Crashlytics, Slack, Discord) |
| **Build Platforms** | 2 (iOS, Android) |
| **Deprecated Features** | API Keys (replaced by Keyless Auth) |
| **Planned (v2)** | Build Nodes (self-hosted runners) |

---

*Last Updated: 2026-01-25*
