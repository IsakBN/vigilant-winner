# Claude Questions - BundleNudge Technical Documentation

*Generated from codebase investigation on 2026-01-25*

---

## Table of Contents
1. [Database Schema](#1-database-schema)
2. [Auth Flows](#2-auth-flows)
3. [Team Invite Flow](#3-team-invite-flow)
4. [Stripe Integration](#4-stripe-integration)
5. [Encryption Details](#5-encryption-details)
6. [RBAC Permissions](#6-rbac-permissions)
7. [Environment Variables](#7-environment-variables)
8. [Webhook Payloads](#8-webhook-payloads)

---

## 1. Database Schema

### Overview

BundleNudge uses **two databases**:
- **Cloudflare D1 (SQLite)** - Main application data
- **Neon Postgres** - Better-Auth authentication tables (sessions, users)

### D1 Database (SQLite) - Application Data

#### Better-Auth Tables (Also in Neon Postgres)

```sql
-- user table (Better-Auth primary user table)
CREATE TABLE IF NOT EXISTS "user" (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  emailVerified INTEGER DEFAULT 0,
  name TEXT,
  image TEXT,
  createdAt INTEGER DEFAULT (unixepoch()),
  updatedAt INTEGER DEFAULT (unixepoch())
);

-- session table
CREATE TABLE IF NOT EXISTS session (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expiresAt INTEGER NOT NULL,
  ipAddress TEXT,
  userAgent TEXT,
  createdAt INTEGER DEFAULT (unixepoch()),
  updatedAt INTEGER DEFAULT (unixepoch())
);

-- account table (OAuth providers + email/password)
CREATE TABLE IF NOT EXISTS account (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  accountId TEXT NOT NULL,
  providerId TEXT NOT NULL,          -- 'credential', 'github'
  accessToken TEXT,
  refreshToken TEXT,
  accessTokenExpiresAt INTEGER,
  refreshTokenExpiresAt INTEGER,
  scope TEXT,
  idToken TEXT,
  password TEXT,                     -- Hashed password for email/password auth
  createdAt INTEGER DEFAULT (unixepoch()),
  updatedAt INTEGER DEFAULT (unixepoch()),
  UNIQUE(providerId, accountId)
);

-- verification table (email verification, password reset)
CREATE TABLE IF NOT EXISTS verification (
  id TEXT PRIMARY KEY,
  identifier TEXT NOT NULL,
  value TEXT NOT NULL,
  expiresAt INTEGER NOT NULL,
  createdAt INTEGER DEFAULT (unixepoch()),
  updatedAt INTEGER DEFAULT (unixepoch())
);
```

#### Core Application Tables

```sql
-- Extended users table (app-specific fields)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  github_id TEXT,
  github_username TEXT,
  github_token TEXT,                 -- ENCRYPTED (AES-GCM)
  email TEXT,
  avatar_url TEXT,
  org_id TEXT REFERENCES organizations(id) ON DELETE SET NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Apps (connected repositories)
CREATE TABLE IF NOT EXISTS apps (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  github_repo TEXT NOT NULL,
  webhook_secret TEXT NOT NULL,      -- ENCRYPTED
  github_installation_id INTEGER,
  min_ios_version TEXT,
  min_android_version TEXT,
  app_store_message TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER
);

-- API Keys (for SDK authentication) - DEPRECATED
CREATE TABLE IF NOT EXISTS api_keys (
  id TEXT PRIMARY KEY,
  app_id TEXT NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
  key_hash TEXT NOT NULL,            -- bcrypt hash
  prefix TEXT NOT NULL,              -- First 16 chars for lookup
  name TEXT,
  permissions TEXT NOT NULL DEFAULT '["update:check"]',
  created_at INTEGER NOT NULL,
  last_used_at INTEGER,
  revoked_at INTEGER
);

-- Releases (OTA bundle versions)
CREATE TABLE IF NOT EXISTS releases (
  id TEXT PRIMARY KEY,
  app_id TEXT NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
  version TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT 'production',
  bundle_key TEXT NOT NULL,
  bundle_size INTEGER NOT NULL DEFAULT 0,
  bundle_size_gzip INTEGER,
  bundle_hash TEXT,                  -- SHA-256 for delta updates
  commit_sha TEXT,
  commit_message TEXT,
  rollout_percentage INTEGER NOT NULL DEFAULT 100 CHECK (rollout_percentage BETWEEN 0 AND 100),
  allowlist TEXT NOT NULL DEFAULT '[]',
  blocklist TEXT NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'building', 'rolling', 'complete', 'failed', 'disabled')),
  is_ab_test BOOLEAN DEFAULT FALSE,
  ab_test_name TEXT,
  auto_rollback_enabled BOOLEAN DEFAULT TRUE,
  crash_threshold_percent REAL DEFAULT 5.0,
  min_ios_version TEXT,
  min_android_version TEXT,
  app_store_message TEXT,
  package_json_hash TEXT,
  native_deps_snapshot TEXT,
  native_fingerprint TEXT,
  scheduled_at INTEGER,
  health_events TEXT,
  health_window_ms INTEGER DEFAULT 300000,
  health_failure_threshold REAL DEFAULT 0.05,
  created_at INTEGER NOT NULL
);
```

#### Team/Organization Tables

```sql
-- Organizations
CREATE TABLE IF NOT EXISTS organizations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  domain TEXT,                       -- For SSO
  plan_id TEXT REFERENCES subscription_plans(id),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Organization Members
CREATE TABLE IF NOT EXISTS organization_members (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  created_at INTEGER NOT NULL,
  UNIQUE(org_id, user_id)
);

-- Team Invitations
CREATE TABLE IF NOT EXISTS team_invitations (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  invited_by TEXT NOT NULL REFERENCES users(id),
  otp_code TEXT NOT NULL,            -- bcrypt hashed
  otp_expires_at INTEGER NOT NULL,   -- 30 minutes from creation
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  created_at INTEGER NOT NULL,
  accepted_at INTEGER,
  UNIQUE(org_id, email, status)
);

-- Project Members (per-project access)
CREATE TABLE IF NOT EXISTS project_members (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  app_id TEXT NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('editor', 'viewer')),
  created_at INTEGER NOT NULL,
  updated_by TEXT REFERENCES users(id),
  UNIQUE(org_id, user_id, app_id)
);

-- Team Audit Log
CREATE TABLE IF NOT EXISTS team_audit_log (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  actor_id TEXT NOT NULL REFERENCES users(id),
  action TEXT NOT NULL,              -- See AUDIT_ACTIONS below
  target_user_id TEXT,
  target_app_id TEXT,
  target_invitation_id TEXT,
  details TEXT,                      -- JSON
  ip_address TEXT,
  user_agent TEXT,
  created_at INTEGER NOT NULL
);
-- Supported actions: team.created, team.updated, team.deleted,
-- member.invited, member.invite_resent, member.invite_cancelled,
-- member.joined, member.removed, member.role_changed,
-- project.member_added, project.member_removed, project.member_role_changed
```

#### Subscription & Billing Tables

```sql
-- Subscription Plans
CREATE TABLE IF NOT EXISTS subscription_plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  price_cents INTEGER NOT NULL,
  concurrent_builds INTEGER NOT NULL DEFAULT 1,
  monthly_build_limit INTEGER,
  build_timeout_minutes INTEGER NOT NULL DEFAULT 30,
  queue_priority INTEGER NOT NULL DEFAULT 3,
  dedicated_nodes BOOLEAN NOT NULL DEFAULT FALSE,
  monthly_update_checks INTEGER,
  max_bundle_size_mb INTEGER NOT NULL DEFAULT 50,
  mau_limit INTEGER,
  storage_gb INTEGER,
  bundle_retention_versions INTEGER DEFAULT 10,
  features TEXT NOT NULL DEFAULT '[]',
  stripe_price_id TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at INTEGER NOT NULL
);

-- User Subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL REFERENCES subscription_plans(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'trialing', 'past_due', 'cancelled', 'expired')),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  current_period_start INTEGER,
  current_period_end INTEGER,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  trial_start INTEGER,
  trial_end INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER
);
```

#### Build System Tables

```sql
-- iOS Builds
CREATE TABLE IF NOT EXISTS ios_builds (
  id TEXT PRIMARY KEY,
  app_id TEXT NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'preparing', 'building', 'signing', 'uploading', 'success', 'failed', 'cancelled')),
  priority INTEGER NOT NULL DEFAULT 3,
  node_pool TEXT NOT NULL DEFAULT 'shared',
  timeout_minutes INTEGER NOT NULL DEFAULT 30,
  git_url TEXT NOT NULL,
  git_branch TEXT NOT NULL DEFAULT 'main',
  git_commit TEXT,
  scheme TEXT NOT NULL,
  configuration TEXT NOT NULL DEFAULT 'Release',
  export_method TEXT NOT NULL DEFAULT 'ad-hoc',
  bundle_identifier TEXT,
  credential_id TEXT REFERENCES apple_credentials(id),
  artifact_key TEXT,
  artifact_size INTEGER,
  artifact_url TEXT,
  manifest_key TEXT,
  install_url TEXT,
  queued_at INTEGER NOT NULL,
  started_at INTEGER,
  completed_at INTEGER,
  worker_id TEXT,
  error_message TEXT,
  error_code TEXT,
  triggered_by TEXT REFERENCES users(id),
  build_number INTEGER,
  version_string TEXT
);

-- Android Builds
CREATE TABLE IF NOT EXISTS android_builds (
  id TEXT PRIMARY KEY,
  app_id TEXT NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'preparing', 'building', 'signing', 'uploading', 'success', 'failed', 'cancelled')),
  priority INTEGER NOT NULL DEFAULT 3,
  timeout_minutes INTEGER NOT NULL DEFAULT 30,
  git_url TEXT NOT NULL,
  git_branch TEXT NOT NULL DEFAULT 'main',
  git_commit TEXT,
  build_type TEXT NOT NULL DEFAULT 'release',
  build_variant TEXT,
  output_type TEXT NOT NULL DEFAULT 'apk',
  flavor TEXT,
  package_name TEXT,
  version_code INTEGER,
  version_name TEXT,
  credential_id TEXT REFERENCES android_credentials(id),
  artifact_key TEXT,
  artifact_size INTEGER,
  artifact_url TEXT,
  queued_at INTEGER NOT NULL,
  started_at INTEGER,
  completed_at INTEGER,
  error_message TEXT,
  error_code TEXT,
  triggered_by TEXT REFERENCES users(id),
  build_number INTEGER,
  workflow_run_id TEXT,
  workflow_run_url TEXT
);

-- Apple Credentials (encrypted P8 keys)
CREATE TABLE IF NOT EXISTS apple_credentials (
  id TEXT PRIMARY KEY,
  app_id TEXT NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  issuer_id TEXT NOT NULL,
  key_id TEXT NOT NULL,
  private_key TEXT NOT NULL,         -- ENCRYPTED (AES-GCM)
  team_id TEXT NOT NULL,
  team_name TEXT,
  created_at INTEGER NOT NULL,
  last_used_at INTEGER,
  UNIQUE(app_id, key_id)
);

-- Android Credentials (encrypted keystores)
CREATE TABLE IF NOT EXISTS android_credentials (
  id TEXT PRIMARY KEY,
  app_id TEXT NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  keystore_data TEXT NOT NULL,       -- ENCRYPTED (Base64 + AES-GCM)
  keystore_password TEXT NOT NULL,   -- ENCRYPTED
  key_alias TEXT NOT NULL,
  key_password TEXT NOT NULL,        -- ENCRYPTED
  created_at INTEGER NOT NULL,
  last_used_at INTEGER,
  UNIQUE(app_id, name)
);
```

#### Device Registration Tables (Keyless Auth)

```sql
-- Registered Devices (for keyless SDK authentication)
CREATE TABLE IF NOT EXISTS registered_devices (
  id TEXT PRIMARY KEY,
  app_id TEXT NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,           -- Client-generated UUID
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android')),
  bundle_id TEXT NOT NULL,
  device_fingerprint TEXT,           -- JSON: { model, os_version, app_version, sdk_version }
  token_hash TEXT NOT NULL,          -- SHA-256 of current device token
  token_expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  last_seen_at INTEGER NOT NULL,
  revoked_at INTEGER,
  UNIQUE(app_id, device_id)
);
```

#### Crash Integration Tables

```sql
-- Crash Integrations (Sentry, Bugsnag, Crashlytics)
CREATE TABLE IF NOT EXISTS crash_integrations (
  id TEXT PRIMARY KEY,
  app_id TEXT NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('sentry', 'bugsnag', 'crashlytics')),
  config TEXT NOT NULL,              -- ENCRYPTED JSON
  enabled INTEGER NOT NULL DEFAULT 1,
  last_sync_at INTEGER,
  last_error TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER,
  UNIQUE(app_id, provider)
);
```

### Neon Postgres - Better-Auth Tables

The same schema as D1's Better-Auth tables, but using Postgres types:

```typescript
// packages/api/src/lib/auth-schema.ts
export const user = pgTable('user', {
    id: text('id').primaryKey(),
    email: text('email').unique().notNull(),
    emailVerified: boolean('emailVerified').default(false),
    name: text('name'),
    image: text('image'),
    createdAt: timestamp('createdAt').defaultNow(),
    updatedAt: timestamp('updatedAt').defaultNow(),
});

export const session = pgTable('session', {
    id: text('id').primaryKey(),
    userId: text('userId').notNull().references(() => user.id, { onDelete: 'cascade' }),
    token: text('token').unique().notNull(),
    expiresAt: timestamp('expiresAt').notNull(),
    ipAddress: text('ipAddress'),
    userAgent: text('userAgent'),
    createdAt: timestamp('createdAt').defaultNow(),
    updatedAt: timestamp('updatedAt').defaultNow(),
});

export const account = pgTable('account', {
    id: text('id').primaryKey(),
    userId: text('userId').notNull().references(() => user.id, { onDelete: 'cascade' }),
    accountId: text('accountId').notNull(),
    providerId: text('providerId').notNull(),
    accessToken: text('accessToken'),
    refreshToken: text('refreshToken'),
    accessTokenExpiresAt: timestamp('accessTokenExpiresAt'),
    refreshTokenExpiresAt: timestamp('refreshTokenExpiresAt'),
    scope: text('scope'),
    idToken: text('idToken'),
    password: text('password'),
    createdAt: timestamp('createdAt').defaultNow(),
    updatedAt: timestamp('updatedAt').defaultNow(),
});
```

### Key Indexes

```sql
-- Better-Auth
CREATE INDEX idx_session_userId ON session(userId);
CREATE INDEX idx_session_token ON session(token);
CREATE INDEX idx_account_userId ON account(userId);
CREATE INDEX idx_user_email ON "user"(email);

-- Apps & Releases
CREATE INDEX idx_apps_user ON apps(user_id);
CREATE INDEX idx_releases_app ON releases(app_id);
CREATE INDEX idx_releases_scheduled ON releases(status, scheduled_at) WHERE scheduled_at IS NOT NULL;

-- Organizations
CREATE INDEX idx_org_members_org ON organization_members(org_id);
CREATE INDEX idx_org_members_user ON organization_members(user_id);
CREATE INDEX idx_team_invitations_org ON team_invitations(org_id);
CREATE INDEX idx_team_invitations_email ON team_invitations(email);

-- Build System
CREATE INDEX idx_ios_builds_queue ON ios_builds(status, priority, queued_at) WHERE status = 'queued';
CREATE INDEX idx_android_builds_queued ON android_builds(status, priority, queued_at) WHERE status = 'queued';

-- Device Registration
CREATE INDEX idx_registered_devices_token ON registered_devices(token_hash);
```

---

## 2. Auth Flows

### 2.1 Email/Password Signup

**Endpoints called in order:**

1. `POST /api/auth/sign-up/email` (Better-Auth)
   - Creates user in Neon Postgres
   - Hashes password with Better-Auth's default algorithm
   - Returns success, triggers OTP email

2. `POST /api/auth/email-otp/send-verification-otp` (Better-Auth plugin)
   - Generates 6-digit OTP
   - Stores in `verification` table
   - Sends email via Resend

3. `POST /api/auth/email-otp/verify-email` (Better-Auth plugin)
   - Verifies OTP against `verification` table
   - Sets `emailVerified = true` on user
   - Creates session

**OTP Configuration:**
```typescript
// packages/api/src/lib/auth.ts
emailOTP({
    async sendVerificationOTP({ email, otp }) {
        await sendOTPEmail({
            to: email,
            subject: 'Your BundleNudge verification code',
            html: generateOTPEmail(otp),
            env,
        })
    },
    otpLength: 6,
    expiresIn: 600, // 10 minutes
}),
```

**Storage:**
- User → Neon Postgres `user` table
- Session → Neon Postgres `session` table
- Account (password) → Neon Postgres `account` table (`providerId = 'credential'`)
- OTP → Neon Postgres `verification` table

### 2.2 GitHub OAuth

**Complete redirect flow:**

1. **Initiate:** `GET /api/auth/sign-in/social` with `provider=github`
   - Better-Auth redirects to GitHub OAuth

2. **GitHub redirects back:** `GET /api/auth/callback/github`
   - Better-Auth exchanges code for tokens
   - Creates/updates user in Neon Postgres
   - Creates entry in `account` table with `providerId = 'github'`

3. **Token encryption before storage:**
```typescript
// GitHub tokens are NOT stored encrypted in Better-Auth account table
// BUT if user connects GitHub separately for repo access, tokens ARE encrypted:
// packages/api/src/lib/encryption.ts
await encrypt(githubToken, env.ENCRYPTION_KEY)
// Stored in D1 users.github_token (encrypted)
```

**Token refresh:** Better-Auth handles OAuth token refresh automatically using the `refreshToken` stored in the `account` table.

### 2.3 Admin OTP Login

**Domain check:**
```typescript
// packages/api/src/lib/auth.ts
export function isAdmin(email: string | null | undefined): boolean {
    return email?.endsWith('@bundlenudge.com') ?? false
}
```

**Flow:**

1. `POST /admin-auth/send-otp`
   - Validates email ends with `@bundlenudge.com`
   - Generates 6-digit OTP cryptographically
   - Stores in KV: `admin-otp:{email}` with 10-minute TTL
   - Sends email via Resend

2. `POST /admin-auth/verify-otp`
   - Retrieves OTP from KV
   - Constant-time comparison
   - On success: clears OTP, returns success

**OTP Configuration:**
```typescript
// packages/api/src/routes/admin-auth.ts
const OTP_EXPIRY_SECONDS = 10 * 60          // 10 minutes
const MAX_SEND_ATTEMPTS = 3                  // per 15 minutes
const MAX_VERIFY_ATTEMPTS = 5                // per OTP
const LOCKOUT_THRESHOLD = 10                 // failures before lockout
const LOCKOUT_DURATION_MS = 30 * 60 * 1000  // 30 minutes
```

**Rate Limiting Storage:**
- KV key: `admin-otp:{email}` - the OTP itself
- KV key: `admin-otp-send:{email}` - send attempt counter
- KV key: `admin-otp-verify:{email}` - verify attempt counter
- D1 table: `otp_attempts` - persistent lockout tracking

### 2.4 Device Token (Keyless Auth)

**Registration flow:**

1. SDK generates `deviceId` (UUID) on first launch
2. SDK calls `POST /v1/devices/register` with:
   ```json
   {
     "appId": "...",
     "deviceId": "uuid",
     "bundleId": "com.example.app",
     "platform": "ios"
   }
   ```

3. Server generates JWT token:
```typescript
// packages/api/src/lib/device-token.ts
export async function generateDeviceToken(
    payload: { deviceId, appId, bundleId, platform },
    secret: string  // App's webhook_secret
): Promise<DeviceTokenResult>
```

**JWT signing:**
- Algorithm: HMAC-SHA256
- Secret: App's `webhook_secret` (per-app, from D1 `apps` table)
- Payload:
```typescript
interface DeviceTokenPayload {
    deviceId: string
    appId: string
    bundleId: string
    platform: 'ios' | 'android'
    iat: number  // issued at (Unix ms)
    exp: number  // expires at (Unix ms)
}
```

**Token expiration:**
```typescript
const DEVICE_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000  // 30 days
const REFRESH_WINDOW_MS = 7 * 24 * 60 * 60 * 1000     // 7 days before expiry
```

**Token refresh logic:**
- SDK checks `exp` claim before each request
- If within 7 days of expiry, SDK calls refresh endpoint
- Server issues new token, updates `registered_devices.token_hash`

**Validation middleware:**
```typescript
// packages/api/src/middleware/auth.ts
export const deviceTokenMiddleware = createMiddleware(async (c, next) => {
    const token = authHeader.slice(7) // Remove "Device " prefix
    
    // Decode payload to get appId (without verifying)
    const payload = decodeJwtPayload(token)
    
    // Lookup app to get webhook_secret
    const app = await c.env.DB.prepare('SELECT webhook_secret FROM apps WHERE id = ?')
        .bind(payload.appId).first()
    
    // Validate full token with app's secret
    const validatedPayload = await validateDeviceToken(token, app.webhook_secret)
    
    // Check if device is revoked
    const device = await c.env.DB.prepare(
        'SELECT revoked_at FROM registered_devices WHERE app_id = ? AND device_id = ?'
    ).bind(validatedPayload.appId, validatedPayload.deviceId).first()
    
    if (device?.revoked_at) {
        return c.json({ error: 'Device access revoked' }, 403)
    }
    
    c.set('appId', validatedPayload.appId)
    c.set('deviceId', validatedPayload.deviceId)
    await next()
})
```

---

## 3. Team Invite Flow

### Step 1: Admin invites member

**Endpoint:** `POST /teams/:teamId/invitations`

**Request body:**
```json
{
  "email": "newuser@example.com",
  "role": "member",
  "projectIds": ["app-123", "app-456"]  // optional
}
```

**What gets stored in DB:**
```sql
INSERT INTO team_invitations 
  (id, org_id, email, invited_by, otp_code, otp_expires_at, role, status, created_at)
VALUES 
  (?, ?, ?, ?, ?, ?, ?, 'pending', ?)
```

**OTP generation:**
```typescript
// packages/api/src/routes/teams/helpers.ts
export function generateOTP(): string {
    const array = new Uint32Array(1)
    crypto.getRandomValues(array)
    return (array[0] % 1000000).toString().padStart(6, '0')
}
```

**OTP hashing:**
```typescript
// packages/api/src/routes/teams/invitations.ts
import * as bcrypt from 'bcryptjs'
const BCRYPT_SALT_ROUNDS = 10
const otpHash = await bcrypt.hash(otp, BCRYPT_SALT_ROUNDS)
```

**OTP expiration:**
```typescript
// packages/api/src/routes/teams/constants.ts
export const OTP_EXPIRY_MS = 30 * 60 * 1000  // 30 minutes
export const OTP_EXPIRY_MINUTES = 30
```

### Step 2: Email sent via Resend

**Template selection:**
- Existing users → `getExistingUserInviteHtml()`
- New users → `getNewUserInviteHtml()`

**Email content:**
```typescript
// packages/api/src/lib/email.ts
await sendTeamInviteEmail({
    to: body.email,
    teamName: team?.name ?? 'Unknown Team',
    otp,                        // 6-digit code
    expiresInMinutes: 30,
    isExistingUser,             // affects template
    env,
})
```

**For existing users:** Direct "Join Team" button with OTP code displayed

**For new users:** 3-step flow: Sign up → Enter OTP → Done

### Step 3: User clicks link / enters OTP

**Endpoint:** `POST /teams/verify-invite`

**Request body:**
```json
{
  "email": "newuser@example.com",
  "otp": "123456"
}
```

**OTP verification:**
```typescript
// packages/api/src/routes/teams/invitations.ts
const otpValid = await bcrypt.compare(body.otp, invitation.otp_code)
if (!otpValid) {
    return c.json({ error: 'Invalid OTP code' }, 400)
}
```

**For new users (no account):**
```json
{
  "success": false,
  "requiresSignup": true,
  "email": "newuser@example.com",
  "teamName": "Acme Corp",
  "invitationId": "inv-123"
}
```

**For existing users:**
- Adds to `organization_members`
- Updates invitation status to `'accepted'`
- Returns team info

### Step 4: User joins team

**Role assignment:**
- Gets the role specified in the invitation (`admin` or `member`)
- Owners can only be set at team creation

**Audit log entry:**
```typescript
await logTeamAction(c.env.DB, {
    orgId: invitation.org_id,
    actorId: user.id,
    action: 'member.joined',
    targetUserId: user.id,
    targetInvitationId: invitation.id,
    details: { email: body.email, role: invitation.role },
    ipAddress,
    userAgent,
})
```

### Team Invitations Table Schema

```sql
CREATE TABLE IF NOT EXISTS team_invitations (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  invited_by TEXT NOT NULL REFERENCES users(id),
  otp_code TEXT NOT NULL,                        -- bcrypt hash (10 rounds)
  otp_expires_at INTEGER NOT NULL,               -- Unix ms, 30 min from creation
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  created_at INTEGER NOT NULL,
  accepted_at INTEGER,
  UNIQUE(org_id, email, status)                  -- One pending invite per email per org
);
```

---

## 4. Stripe Integration

### Products/Prices Setup

**Using Stripe Products:** Yes, via `stripe_price_id` on plans

**Pricing model:**
```typescript
// packages/api/src/routes/subscriptions/index.ts - seed-plans
const defaultPlans = [
    { id: 'plan_free', name: 'free', priceCents: 0, mauLimit: 10000, storageGb: 5 },
    { id: 'plan_pro', name: 'pro', priceCents: 1999, mauLimit: 50000, storageGb: 50 },
    { id: 'plan_team', name: 'team', priceCents: 9999, mauLimit: 500000, storageGb: 500 },
    { id: 'plan_enterprise', name: 'enterprise', priceCents: 0, mauLimit: null, storageGb: null }, // Contact sales
]
```

**Billing interval:** Monthly (subscription mode)

### Checkout Flow

**Create checkout session:**
```typescript
// packages/api/src/routes/subscriptions/checkout.ts
checkout.post('/', async (c) => {
    const params: Record<string, string> = {
        'mode': 'subscription',
        'line_items[0][price]': plan.stripe_price_id,
        'line_items[0][quantity]': '1',
        'success_url': body.successUrl || `${c.env.DASHBOARD_URL}/settings/billing?success=true`,
        'cancel_url': body.cancelUrl || `${c.env.DASHBOARD_URL}/settings/billing?canceled=true`,
        'client_reference_id': userId,
        'metadata[plan_id]': plan.id,
        'metadata[user_id]': userId,
        'subscription_data[metadata][plan_id]': plan.id,
        'subscription_data[metadata][user_id]': userId,
    }
    
    // Use existing customer or create new
    if (existingSub?.stripe_customer_id) {
        params['customer'] = existingSub.stripe_customer_id
    } else if (user?.email) {
        params['customer_email'] = user.email
    }
    
    const session = await stripeRequest(env.STRIPE_SECRET_KEY, '/checkout/sessions', 'POST', params)
    return c.json({ sessionId: session.id, url: session.url })
})
```

**Success/cancel URLs:**
- Success: `{DASHBOARD_URL}/settings/billing?success=true`
- Cancel: `{DASHBOARD_URL}/settings/billing?canceled=true`

### Webhook Handling

**Signature verification:**
```typescript
// packages/api/src/routes/subscriptions/stripe.ts
export async function verifyStripeSignature(
    payload: string,
    signature: string,
    secret: string
): Promise<boolean> {
    // Parse: t=timestamp,v1=signature
    const elements = signature.split(',').reduce(...)
    
    // Verify timestamp within 5 minutes
    if (Math.abs(nowSeconds - timestampSeconds) > 300) return false
    
    // HMAC-SHA256 signature
    const signedPayload = `${timestamp}.${payload}`
    const key = await crypto.subtle.importKey('raw', secret, { name: 'HMAC', hash: 'SHA-256' })
    const expected = await crypto.subtle.sign('HMAC', key, signedPayload)
    
    // Constant-time comparison
    return constantTimeEqual(sig, expected)
}
```

**Events handled:**

1. `checkout.session.completed`
   ```typescript
   // Creates new subscription record
   await db.prepare(`
       INSERT INTO subscriptions (id, user_id, plan_id, status, stripe_customer_id, stripe_subscription_id, ...)
       VALUES (?, ?, ?, 'active', ?, ?, ...)
   `).bind(generateId(), session.client_reference_id, session.metadata.plan_id, ...)
   ```

2. `customer.subscription.updated`
   ```typescript
   // Updates subscription status and period
   await db.prepare(`
       UPDATE subscriptions SET status = ?, current_period_start = ?, current_period_end = ?, ...
       WHERE stripe_subscription_id = ?
   `)
   ```

3. `customer.subscription.deleted`
   ```typescript
   // Marks subscription as expired
   await db.prepare(`UPDATE subscriptions SET status = 'expired' WHERE stripe_subscription_id = ?`)
   ```

4. `invoice.payment_failed`
   ```typescript
   // Marks subscription as past_due
   await db.prepare(`UPDATE subscriptions SET status = 'past_due' WHERE stripe_subscription_id = ?`)
   ```

### Customer Portal

**What users can do:**
- View/update payment method
- View invoice history
- Cancel subscription
- Upgrade/downgrade (if configured)

**Session creation:**
```typescript
// packages/api/src/routes/subscriptions/portal.ts
const session = await stripeRequest(env.STRIPE_SECRET_KEY, '/billing_portal/sessions', 'POST', {
    'customer': subscription.stripe_customer_id,
    'return_url': body.returnUrl || `${c.env.DASHBOARD_URL}/settings/billing`,
})
return c.json({ url: session.url })
```

### Usage Tracking

**Metered billing:** No - BundleNudge uses DB-based limits, not Stripe metered billing

**How limits work:**
- MAU tracked in `device_pings` table (unique device IDs per month)
- Storage calculated from `releases.bundle_size` sum
- Checked at update check time, not billed through Stripe

---

## 5. Encryption Details

### What Uses AES-256-GCM

| Data Type | Location | When Encrypted |
|-----------|----------|----------------|
| Apple credentials (P8 private keys) | `apple_credentials.private_key` | On save |
| Android keystores | `android_credentials.keystore_data` | On save |
| Android keystore password | `android_credentials.keystore_password` | On save |
| Android key password | `android_credentials.key_password` | On save |
| GitHub user tokens | `users.github_token` | On save |
| Crash integration configs | `crash_integrations.config` | On save |
| App webhook secrets | `apps.webhook_secret` | On create |

### Encryption Implementation

**Source file:** `packages/api/src/lib/encryption.ts`

**Key source:**
```typescript
// Environment variable
ENCRYPTION_KEY: string  // Must be a strong random string
```

**Key rotation strategy:**
- Version byte in ciphertext allows detecting format
- v1: Legacy fixed salt (backwards compatible)
- v2: Random salt per encryption (current)
- Re-encryption function available for migration:
```typescript
export async function reencrypt(encryptedValue: string, key: string): Promise<string>
```

**IV/Nonce handling:**
```typescript
const IV_LENGTH = 12       // 96 bits (GCM recommendation)
const SALT_LENGTH = 16     // 128 bits for PBKDF2
const TAG_LENGTH = 128     // Authentication tag

// Random IV generated per encryption
const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH))
```

**Function signatures:**

```typescript
// Encrypt plaintext
export async function encrypt(plaintext: string, key: string): Promise<string>
// Returns: base64([version (1 byte)][salt (16 bytes)][iv (12 bytes)][ciphertext])

// Decrypt ciphertext
export async function decrypt(ciphertext: string, key: string): Promise<string>
// Handles both v1 (legacy) and v2 formats automatically

// Safe token getter (handles plaintext, v1, v2)
export async function getDecryptedToken(value: string, key: string): Promise<string>

// Check if value is encrypted
export function isEncrypted(value: string): boolean
```

**Key derivation:**
```typescript
const PBKDF2_ITERATIONS = 100000

async function deriveKey(secret: string, salt: Uint8Array): Promise<CryptoKey> {
    const keyMaterial = await crypto.subtle.importKey('raw', secret, 'PBKDF2', false, ['deriveKey'])
    return crypto.subtle.deriveKey(
        { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
    )
}
```

---

## 6. RBAC Permissions

### Organization Roles

| Role | Permissions |
|------|-------------|
| **owner** | Everything: delete org, manage all members, transfer ownership, billing |
| **admin** | Manage members (except owners), invite members, manage all projects |
| **member** | Access assigned projects only, no member management |

### Project-Level Roles

| Role | Permissions |
|------|-------------|
| **editor** | Full project access: create releases, manage builds, view all data |
| **viewer** | Read-only: view releases, builds, analytics |

### Permission Checks

**Middleware used:**
```typescript
// packages/api/src/middleware/auth.ts
export function requireOrgRole(roles: ('owner' | 'admin' | 'member')[]) {
    return async function orgRoleMiddleware(c, next) {
        const userId = c.get('userId')
        const orgId = c.req.param('id') || c.req.param('orgId')
        
        const membership = await c.env.DB.prepare(
            'SELECT role FROM organization_members WHERE org_id = ? AND user_id = ?'
        ).bind(orgId, userId).first()
        
        if (!membership) {
            return c.json({ error: 'You are not a member of this organization' }, 403)
        }
        
        if (!roles.includes(membership.role)) {
            return c.json({ error: `This action requires: ${roles.join(', ')}` }, 403)
        }
        
        c.set('orgId', orgId)
        c.set('orgRole', membership.role)
        await next()
    }
}
```

**Usage examples:**
```typescript
// Owner only
teamsRoutes.delete('/:teamId', requireOrgRole(['owner']), async (c) => { ... })

// Admin or owner
teamsRoutes.patch('/:teamId', requireOrgRole(['owner', 'admin']), async (c) => { ... })

// Any member
teamsRoutes.get('/:teamId', requireOrgRole(['owner', 'admin', 'member']), async (c) => { ... })
```

### Admin Access

**Domain check logic:**
```typescript
// packages/api/src/lib/auth.ts
export function isAdmin(email: string | null | undefined): boolean {
    return email?.endsWith('@bundlenudge.com') ?? false
}
```

**Admin-only routes:**
- `POST /admin/*` - All admin endpoints
- `POST /subscriptions/seed-plans` - Seed subscription plans
- `POST /subscriptions/plans` - Create new plans
- `/admin/users/*` - User management
- `/admin/builds/*` - Build queue management
- `/admin/stats/*` - System statistics

**Admin middleware:**
```typescript
export const requireAdmin = createMiddleware(async (c, next) => {
    const auth = createAuth(c.env)
    const session = await auth.api.getSession({ headers: c.req.raw.headers })
    
    if (!session?.user) {
        return c.json({ error: 'Authentication required' }, 401)
    }
    
    if (!isAdmin(session.user.email)) {
        return c.json({ error: 'Admin access required (@bundlenudge.com email)' }, 403)
    }
    
    c.set('user', session.user)
    c.set('userId', session.user.id)
    await next()
})
```

---

## 7. Environment Variables

| Variable | Required | Package | Purpose | Example |
|----------|----------|---------|---------|---------|
| **Database** |||||
| `DB` | Yes | API | D1 database binding | Cloudflare binding |
| `DATABASE_URL` | Yes | API | Neon Postgres connection | `postgres://...@neon.tech/...` |
| **Storage** |||||
| `BUNDLES` | Yes | API | R2 bucket for bundles | Cloudflare binding |
| `BACKUP_BUCKET` | Yes | API | R2 bucket for backups | Cloudflare binding |
| `R2_ENDPOINT` | Yes | API | R2 endpoint URL | `https://xxx.r2.cloudflarestorage.com` |
| `R2_ACCESS_KEY` | Yes | API | R2 access key | AWS-style key |
| `R2_SECRET_KEY` | Yes | API | R2 secret key | AWS-style secret |
| `R2_BUCKET_NAME` | Yes | API | R2 bucket name | `bundlenudge-bundles` |
| **KV & Analytics** |||||
| `RATE_LIMIT` | Yes | API | KV namespace for rate limiting | Cloudflare binding |
| `ANALYTICS` | No | API | Analytics Engine dataset | Cloudflare binding |
| **Queues** |||||
| `UPLOAD_QUEUE_P0` | Yes | API | Enterprise upload queue | Cloudflare Queue binding |
| `UPLOAD_QUEUE_P1` | Yes | API | Team upload queue | Cloudflare Queue binding |
| `UPLOAD_QUEUE_P2` | Yes | API | Pro upload queue | Cloudflare Queue binding |
| `UPLOAD_QUEUE_P3` | Yes | API | Free upload queue | Cloudflare Queue binding |
| `UPLOAD_DLQ` | Yes | API | Dead letter queue | Cloudflare Queue binding |
| **Durable Objects** |||||
| `UPLOAD_STATUS_DO` | Yes | API | WebSocket status updates | Cloudflare DO binding |
| **Auth** |||||
| `BETTER_AUTH_SECRET` | Yes | API | Session signing secret | Random 32+ chars |
| `JWT_SECRET` | Yes | API | JWT signing (legacy) | Random 32+ chars |
| `ENCRYPTION_KEY` | Yes | API | AES-256-GCM encryption | Random 32+ chars |
| `BACKUP_ENCRYPTION_KEY` | Yes | API | Backup encryption | Random 32+ chars |
| **GitHub OAuth** |||||
| `GITHUB_CLIENT_ID` | Yes | API | OAuth app client ID | `Iv1.xxxxx` |
| `GITHUB_CLIENT_SECRET` | Yes | API | OAuth app secret | `xxxxx` |
| **GitHub App** |||||
| `GITHUB_APP_ID` | Yes | API | GitHub App ID | `123456` |
| `GITHUB_APP_PRIVATE_KEY` | Yes | API | GitHub App private key | PEM format |
| `GITHUB_APP_WEBHOOK_SECRET` | Yes | API | App webhook secret | Random string |
| **Stripe** |||||
| `STRIPE_SECRET_KEY` | Yes | API | Stripe API secret | `sk_live_xxx` |
| `STRIPE_WEBHOOK_SECRET` | Yes | API | Webhook signing secret | `whsec_xxx` |
| `STRIPE_PUBLISHABLE_KEY` | Yes | Dashboard | Public key for Checkout | `pk_live_xxx` |
| **Email** |||||
| `RESEND_API_KEY` | Yes | API | Resend API key | `re_xxx` |
| `EMAIL_FROM` | No | API | From address | `BundleNudge <noreply@bundlenudge.com>` |
| **Build System** |||||
| `BUILD_TOKEN` | Yes | API | GitHub Actions callback auth | Random string |
| `FLY_API_TOKEN` | Yes | API | Fly.io API token | `FlyV1 xxx` |
| `FLY_APP_NAME` | Yes | API | Fly app for builds | `bundlenudge-builder` |
| **Cloudflare API** |||||
| `CF_ACCOUNT_ID` | Yes | API | Account ID for D1 export | `xxxxx` |
| `CF_API_TOKEN` | Yes | API | API token (D1:Edit) | `xxxxx` |
| `D1_DATABASE_ID` | Yes | API | D1 database ID | `xxxxx` |
| **URLs** |||||
| `API_URL` | Yes | API | API base URL | `https://api.bundlenudge.com` |
| `DASHBOARD_URL` | Yes | API | Dashboard URL | `https://app.bundlenudge.com` |
| **Optional** |||||
| `AWS_ACCESS_KEY_ID` | No | API | S3 cold storage | AWS key |
| `AWS_SECRET_ACCESS_KEY` | No | API | S3 cold storage | AWS secret |
| `AWS_S3_BUCKET` | No | API | S3 bucket name | `bundlenudge-backups` |
| `SLACK_BACKUP_WEBHOOK` | No | API | Backup notifications | Slack webhook URL |

---

## 8. Webhook Payloads

### 8.1 GitHub Push Webhook

**Endpoint:** `POST /webhook/:appId`

**Signature header:** `X-Hub-Signature-256`

**Signature format:** `sha256=<hex_signature>`

**Verification:**
```typescript
// packages/api/src/routes/webhook/helpers.ts
async function verifyGitHubSignature(body: string, signature: string, secret: string): Promise<boolean> {
    const sig = signature.replace('sha256=', '')
    const key = await crypto.subtle.importKey('raw', secret, { name: 'HMAC', hash: 'SHA-256' })
    const mac = await crypto.subtle.sign('HMAC', key, body)
    const expected = Array.from(new Uint8Array(mac)).map(b => b.toString(16).padStart(2, '0')).join('')
    return constantTimeEqual(sig, expected)
}
```

**Payload structure:**
```typescript
interface GitHubPushWebhook {
    ref: string              // "refs/heads/main"
    after: string            // Commit SHA (40 hex chars)
    repository: {
        full_name: string    // "owner/repo"
    }
    head_commit: {
        message: string      // Commit message
    } | null
}
```

### 8.2 GitHub App Webhook

**Endpoint:** `POST /github/webhook`

**Signature header:** `X-Hub-Signature-256`

**Events handled:**

1. `installation` (created/deleted/suspend/unsuspend/new_permissions_accepted)
```json
{
    "action": "created",
    "installation": {
        "id": 12345678,
        "account": {
            "login": "org-name",
            "id": 12345,
            "type": "Organization"
        },
        "repository_selection": "selected"
    }
}
```

2. `installation_repositories` (added/removed)

3. `push` (triggers OTA build)
```json
{
    "ref": "refs/heads/main",
    "after": "abc123...",
    "repository": { "id": 123, "full_name": "owner/repo" },
    "installation": { "id": 12345678 },
    "head_commit": { "message": "feat: new feature" }
}
```

4. `ping` (app setup verification)

### 8.3 Stripe Webhook

**Endpoint:** `POST /subscriptions/webhook`

**Signature header:** `Stripe-Signature`

**Signature format:** `t=timestamp,v1=signature`

**Verification:**
```typescript
// Parse: t=timestamp,v1=signature
const elements = signature.split(',').reduce(...)
const signedPayload = `${timestamp}.${payload}`
const expected = HMAC_SHA256(signedPayload, STRIPE_WEBHOOK_SECRET)
```

**Events handled:**

1. `checkout.session.completed`
```json
{
    "type": "checkout.session.completed",
    "data": {
        "object": {
            "id": "cs_xxx",
            "customer": "cus_xxx",
            "subscription": "sub_xxx",
            "client_reference_id": "user-id",
            "metadata": { "plan_id": "plan_pro" }
        }
    }
}
```

2. `customer.subscription.updated`
```json
{
    "type": "customer.subscription.updated",
    "data": {
        "object": {
            "id": "sub_xxx",
            "status": "active",
            "cancel_at_period_end": false,
            "current_period_start": 1706140800,
            "current_period_end": 1708819200
        }
    }
}
```

3. `customer.subscription.deleted`
4. `invoice.payment_failed`

### 8.4 Resend Webhook

**Endpoint:** `POST /email/webhook` (if implemented)

**Events:**
- `email.delivered`
- `email.opened`
- `email.clicked`
- `email.bounced`
- `email.complained`

**Payload structure:**
```json
{
    "type": "email.delivered",
    "data": {
        "email_id": "xxx",
        "to": ["user@example.com"],
        "created_at": "2026-01-25T12:00:00Z"
    }
}
```

### 8.5 Build Complete Webhook

**Endpoint:** `POST /webhook/:appId/build-complete`

**Who calls this:** Fly.io build machine (Metro bundler)

**Auth method:** Header `X-Build-Token` must match `BUILD_TOKEN` env var

**Payload structure:**
```json
{
    "releaseId": "rel-xxx",
    "success": true,
    "bundleSize": 1234567,
    "bundleHash": "sha256-xxx"
}
```

**On failure:**
```json
{
    "releaseId": "rel-xxx",
    "success": false,
    "error": "Build failed: npm install error"
}
```

---

## Known Issues to Address

1. **Storage limit inconsistency:** `subscriptions/index.ts` seed-plans says Free tier = 5 GB, but `apps.ts` defaults to 20 GB. Should be unified to **20 GB** per user request.

2. **Build Nodes (v2 / Planned):** The `build_nodes` and `node_heartbeats` tables exist in schema but the feature is not yet implemented. Currently builds use GitHub Actions.

3. **API Keys deprecated:** The `api_keys` table and related endpoints still exist but keyless device token auth is the recommended approach.

---

*End of documentation*
