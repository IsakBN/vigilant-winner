# BundleNudge Troubleshooting Guide

Comprehensive troubleshooting guide for BundleNudge issues across SDK, API, builds, dashboard, and billing.

---

## Table of Contents

1. [SDK Issues](#1-sdk-issues)
2. [API Issues](#2-api-issues)
3. [Build Issues](#3-build-issues)
4. [Dashboard Issues](#4-dashboard-issues)
5. [Database Issues](#5-database-issues)
6. [Billing Issues](#6-billing-issues)
7. [Diagnostic Commands](#7-diagnostic-commands)

---

## 1. SDK Issues

### 1.1 "BundleNudge not initialized. Call initialize() first."

**Error Message:**
```
Error: BundleNudge not initialized. Call initialize() first.
```

**Cause:** You called `BundleNudge.getInstance()` before calling `BundleNudge.initialize()`.

**Solution:**
```typescript
// Correct initialization order
import { BundleNudge } from '@bundlenudge/sdk';

// In your App.tsx or entry point
async function initApp() {
  await BundleNudge.initialize({
    appId: 'your-app-id',
    // Optional: apiUrl: 'https://api.bundlenudge.com',
  });

  // Now you can use getInstance()
  const sdk = BundleNudge.getInstance();
}
```

**Note:** Initialize in your app's entry point before any component tries to access the SDK.

---

### 1.2 "Device registration failed: 401"

**Error Message:**
```
Error: Device registration failed: 401
```

**Cause:** The app ID is invalid or the API key is not configured correctly.

**Solutions:**

1. **Verify App ID:**
   ```typescript
   // Ensure appId matches your dashboard
   await BundleNudge.initialize({
     appId: 'app_abc123', // Must match exactly
   });
   ```

2. **Check API Key in Dashboard:**
   - Go to Dashboard > Your App > Settings > API Keys
   - Ensure at least one active API key exists
   - The SDK uses the app's default API key automatically

3. **Check Network Connectivity:**
   ```typescript
   // Enable debug mode to see network requests
   await BundleNudge.initialize({
     appId: 'your-app-id',
     debug: true, // Logs all network requests
   });
   ```

---

### 1.3 "Bundle hash mismatch"

**Error Message:**
```
[BundleNudge] Bundle validation failed: hash mismatch
Expected: sha256:abc123...
Received: sha256:def456...
```

**Cause:** The downloaded bundle doesn't match the expected hash. This could indicate:
- Corrupted download
- Man-in-the-middle attack
- CDN caching issue
- Bundle was modified after upload

**Solutions:**

1. **Retry the Download:**
   ```typescript
   // The SDK automatically retries, but you can force a fresh check
   await BundleNudge.clearUpdates();
   await BundleNudge.checkForUpdate();
   ```

2. **Check Release in Dashboard:**
   - Verify the release is active
   - Check the bundle hash matches what was uploaded
   - Try re-uploading the bundle

3. **Clear CDN Cache (if using):**
   - If you have a CDN in front of R2, clear the cache for the bundle URL

4. **Check for Network Issues:**
   ```typescript
   // Enable debug mode
   const sdk = await BundleNudge.initialize({
     appId: 'your-app-id',
     debug: true,
   });
   ```

---

### 1.4 "Rollback triggered"

**Error Message (in telemetry):**
```
eventType: "rollback_triggered"
reason: "crash_detected" | "health_check_failed" | "manual" | "hash_mismatch"
```

**Causes by Reason:**

| Reason | Description | Action |
|--------|-------------|--------|
| `crash_detected` | App crashed 3+ times within 10 seconds after update | Fix crash in your code, release new version |
| `health_check_failed` | Required events/endpoints not called within timeout | Ensure health checks are called |
| `manual` | User or developer triggered rollback | Intentional - no action needed |
| `hash_mismatch` | Bundle integrity check failed | Re-upload bundle |

**Investigating Crash-Based Rollbacks:**

1. **Check Dashboard:**
   - Go to Releases > Your Release > Rollback Reports
   - View crash frequency and affected devices

2. **Review Recent Changes:**
   - Check the diff between the rolled-back version and previous
   - Look for unhandled exceptions, null references, etc.

3. **Configure Crash Detection:**
   ```typescript
   await BundleNudge.initialize({
     appId: 'your-app-id',
     crashThreshold: 3,        // Crashes before rollback (default: 3)
     crashWindowMs: 10000,     // Time window for crashes (default: 10s)
     verificationWindowMs: 60000, // Time to verify update (default: 60s)
   });
   ```

---

### 1.5 "Native module not found"

**Error Message:**
```
Error: Cannot read property 'getConfiguration' of null
// or
Error: BundleNudgeNative module not found
```

**Cause:** The native module is not properly linked.

**Solutions for React Native CLI:**

```bash
# iOS
cd ios && pod install && cd ..

# Rebuild the app
npx react-native run-ios
npx react-native run-android
```

**Solutions for Expo:**

```bash
# Rebuild with native code
npx expo prebuild --clean
npx expo run:ios
npx expo run:android
```

**Check Native Files Exist:**

For iOS, verify `ios/BundleNudge.swift` and `ios/BundleNudge.m` exist.

For Android, verify `android/src/main/java/com/bundlenudge/BundleNudgeModule.kt` exists.

---

### 1.6 Update Check Returns No Update

**Symptom:** `checkForUpdate()` always returns `null` even when updates are available.

**Diagnostic Steps:**

1. **Check App Version:**
   ```typescript
   // The SDK reports this version to the server
   // Ensure it matches your release's minAppVersion/maxAppVersion
   const info = await nativeModule.getConfiguration();
   console.log('App version:', info.appVersion);
   ```

2. **Check Release Targeting:**
   - Is the release status `active`?
   - Is the app version within `minAppVersion` and `maxAppVersion`?
   - Is the device in the rollout percentage?
   - Is the device in the correct channel?

3. **Check Device Registration:**
   ```typescript
   const sdk = BundleNudge.getInstance();
   const version = sdk.getCurrentVersion();
   console.log('Current bundle version:', version);
   ```

4. **Enable Debug Logging:**
   ```typescript
   await BundleNudge.initialize({
     appId: 'your-app-id',
     debug: true,
   });
   ```

---

### 1.7 "No previous version to rollback to"

**Error Message:**
```
Error: No previous version to rollback to
```

**Cause:** Attempted to rollback when there's no previous version stored.

**When This Happens:**
- First update (no previous version exists)
- After `clearUpdates()` was called
- After update was verified and previous version cleaned up

**Solution:**
```typescript
// Check before calling rollback
const sdk = BundleNudge.getInstance();
if (sdk.canRollback()) {
  await sdk.rollback();
} else {
  console.log('No rollback available');
}
```

---

## 2. API Issues

### 2.1 Rate Limiting Errors

**Error Response:**
```json
{
  "error": {
    "code": "RATE_LIMITED",
    "message": "Too many requests. Please try again later.",
    "retryAfter": 60
  }
}
```

**Rate Limits by Endpoint:**

| Endpoint | Limit | Window |
|----------|-------|--------|
| Auth (login, signup) | 10 requests | 60 seconds |
| Update check | 60 requests | 60 seconds |
| Device registration | 10 requests | 60 seconds |
| Telemetry | 100 requests | 60 seconds |
| Bundle upload | 10 requests | 60 seconds |
| Admin OTP send | 3 requests | 15 minutes |

**Solutions:**

1. **Implement Exponential Backoff:**
   ```typescript
   async function fetchWithRetry(url: string, options: RequestInit, retries = 3) {
     for (let i = 0; i < retries; i++) {
       const response = await fetch(url, options);
       if (response.status === 429) {
         const retryAfter = response.headers.get('Retry-After') || '60';
         await new Promise(r => setTimeout(r, parseInt(retryAfter) * 1000));
         continue;
       }
       return response;
     }
     throw new Error('Max retries exceeded');
   }
   ```

2. **Reduce Request Frequency:**
   ```typescript
   await BundleNudge.initialize({
     appId: 'your-app-id',
     minimumCheckInterval: 300, // 5 minutes between checks
   });
   ```

---

### 2.2 Authentication Failures

**Error Response:**
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or expired token"
  }
}
```

**Common Causes:**

| Cause | Solution |
|-------|----------|
| Expired session | Re-authenticate |
| Invalid API key | Check API key in dashboard |
| Missing Authorization header | Include `Bearer` token |
| Token revoked | Generate new API key |

**Verifying API Key:**
```bash
# Test API key
curl -H "Authorization: Bearer bn_live_YOUR_API_KEY" \
  https://api.bundlenudge.com/v1/apps
```

---

### 2.3 Webhook Signature Mismatch

**Error Response:**
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid webhook signature"
  }
}
```

**Cause:** The webhook signature verification failed. This happens when:
- Wrong webhook secret configured
- Request body was modified (e.g., by a proxy)
- Timestamp is outside 5-minute tolerance

**Solutions:**

1. **Verify Stripe Webhook Secret:**
   ```bash
   # In Stripe Dashboard > Webhooks > Your Endpoint
   # Copy the signing secret (whsec_...)

   # Update in Cloudflare
   wrangler secret put STRIPE_WEBHOOK_SECRET
   ```

2. **Check Timestamp:**
   - Ensure server time is synchronized
   - Webhooks are rejected if timestamp differs by more than 5 minutes

3. **Verify Raw Body:**
   - The signature is computed over the raw request body
   - If using a proxy, ensure it doesn't modify the body

**Debugging:**
```bash
# View recent webhook events in Stripe
# Dashboard > Webhooks > Your Endpoint > Recent deliveries
```

---

### 2.4 "App not found" Errors

**Error Response:**
```json
{
  "error": {
    "code": "APP_NOT_FOUND",
    "message": "App not found"
  }
}
```

**Solutions:**

1. **Check App ID Format:**
   - App IDs start with `app_` followed by a UUID
   - Example: `app_abc123-def456-...`

2. **Verify Ownership:**
   - Ensure you're authenticated as the app owner
   - Or a team member with access

3. **Check Soft Deletion:**
   ```sql
   -- Check if app was soft-deleted
   SELECT id, name, deleted_at FROM apps WHERE id = 'app_xxx';
   ```

---

### 2.5 CORS Errors

**Browser Console Error:**
```
Access to fetch at 'https://api.bundlenudge.com/...' from origin
'https://app.bundlenudge.com' has been blocked by CORS policy
```

**Solutions:**

1. **Check Allowed Origins:**
   - The API should allow requests from your dashboard domain
   - Verify `API_URL` and `DASHBOARD_URL` environment variables are set

2. **Check Request Headers:**
   ```typescript
   // Include credentials for authenticated requests
   fetch('https://api.bundlenudge.com/v1/apps', {
     credentials: 'include',
     headers: {
       'Content-Type': 'application/json',
     },
   });
   ```

---

## 3. Build Issues

### 3.1 Build Job Stuck in "pending"

**Symptom:** Build job remains in `pending` status indefinitely.

**Causes:**

| Cause | Solution |
|-------|----------|
| No workers available | Check worker status in dashboard |
| Queue backlog | Wait for higher priority jobs to complete |
| Worker crashed | Restart worker, job will be requeued |

**Diagnostic Commands:**
```bash
# Check worker status
wrangler d1 execute bundlenudge-db --remote --command "
SELECT id, status, last_heartbeat_at, current_build_id
FROM worker_nodes
WHERE status != 'offline';
"

# Check queue depth
wrangler queues list
```

**Manual Recovery:**
```bash
# Reset stuck build
wrangler d1 execute bundlenudge-db --remote --command "
UPDATE ios_builds SET status = 'pending', worker_id = NULL
WHERE id = 'build_xxx' AND status = 'building';
"
```

---

### 3.2 Code Signing Failures

**Error Message:**
```
Error: Code signing failed: No valid provisioning profile found
```

**iOS Solutions:**

1. **Check Provisioning Profile:**
   - Ensure profile is not expired
   - Profile must match bundle ID
   - Profile must include signing certificate

2. **Verify Team ID:**
   - Check `teamId` matches your Apple Developer account

3. **Check Certificate:**
   - Distribution certificate must be installed
   - Certificate must not be revoked

**Android Solutions:**

1. **Check Keystore:**
   - Verify keystore file is uploaded
   - Check keystore password is correct
   - Verify alias exists in keystore

---

### 3.3 Hermes Compilation Errors

**Error Message:**
```
Error: Hermes compilation failed:
SyntaxError: index.js: Unexpected token (123:45)
```

**Cause:** Invalid JavaScript syntax that Hermes cannot compile.

**Solutions:**

1. **Check for Unsupported Syntax:**
   - Hermes has specific ES6+ support
   - Avoid newer features not yet supported

2. **Validate Bundle Locally:**
   ```bash
   # Run Hermes compiler locally
   npx hermes -emit-binary -out /dev/null your-bundle.js
   ```

3. **Check Babel Configuration:**
   - Ensure transforms are applied correctly
   - Check `metro.config.js` settings

---

### 3.4 Bundle Too Large

**Error Message:**
```
Error: Bundle size (52.4 MB) exceeds maximum allowed (50 MB)
```

**Solutions:**

1. **Analyze Bundle:**
   ```bash
   # Generate bundle stats
   npx react-native bundle \
     --platform ios \
     --dev false \
     --entry-file index.js \
     --bundle-output bundle.js \
     --sourcemap-output bundle.js.map

   # Analyze with source-map-explorer
   npx source-map-explorer bundle.js bundle.js.map
   ```

2. **Reduce Bundle Size:**
   - Remove unused dependencies
   - Use dynamic imports for large modules
   - Optimize images and assets
   - Enable tree shaking

3. **Plan Limits:**
   | Plan | Max Bundle Size |
   |------|-----------------|
   | Free | 50 MB |
   | Pro | 100 MB |
   | Team | 250 MB |
   | Enterprise | Unlimited |

---

## 4. Dashboard Issues

### 4.1 OAuth Callback Errors

**Error Message:**
```
Error: OAuth callback failed: Invalid state parameter
```

**Causes:**

| Cause | Solution |
|-------|----------|
| Session expired | Clear cookies, try again |
| Wrong callback URL | Check OAuth app configuration |
| State mismatch | Clear browser cache |

**Verify GitHub OAuth Configuration:**

1. Go to GitHub > Settings > Developer Settings > OAuth Apps
2. Check **Authorization callback URL** matches:
   ```
   https://api.bundlenudge.com/v1/auth/callback/github
   ```

---

### 4.2 Session Expiration

**Symptom:** Users are logged out unexpectedly.

**Session Duration:**
- Default: 7 days
- Refresh: On each API request

**Solutions:**

1. **Check Cookie Settings:**
   - Cookies must be enabled
   - Third-party cookies may be blocked

2. **Verify Domain Configuration:**
   - API and dashboard must share cookie domain
   - Check `DASHBOARD_URL` environment variable

---

### 4.3 API Connection Failures

**Error Message:**
```
Error: Network request failed
// or
Error: Failed to fetch
```

**Solutions:**

1. **Check API URL:**
   ```typescript
   // Verify NEXT_PUBLIC_API_URL is set correctly
   console.log(process.env.NEXT_PUBLIC_API_URL);
   ```

2. **Check API Status:**
   ```bash
   curl https://api.bundlenudge.com/health
   ```

3. **Check Browser Console:**
   - Look for CORS errors
   - Check for blocked requests (ad blockers, etc.)

---

## 5. Database Issues

### 5.1 D1 Connection Errors

**Error Message:**
```
Error: D1_ERROR: no such table: apps
```

**Cause:** Migrations haven't been run.

**Solution:**
```bash
cd packages/api

# Generate and run migrations
pnpm drizzle-kit generate
wrangler d1 execute bundlenudge-db --remote --file=./drizzle/0000_*.sql
```

---

### 5.2 Migration Failures

**Error Message:**
```
Error: SQLITE_CONSTRAINT: UNIQUE constraint failed
```

**Solutions:**

1. **Check for Duplicate Data:**
   ```bash
   wrangler d1 execute bundlenudge-db --remote --command "
   SELECT email, COUNT(*) FROM users GROUP BY email HAVING COUNT(*) > 1;
   "
   ```

2. **Reset Migration State (Development Only):**
   ```bash
   # WARNING: Destructive - development only
   wrangler d1 execute bundlenudge-db --remote --command "DROP TABLE _drizzle_migrations;"
   ```

---

### 5.3 Neon Connection Issues

**Error Message:**
```
Error: Connection terminated unexpectedly
// or
Error: ECONNREFUSED
```

**Solutions:**

1. **Check Connection String:**
   ```bash
   # Verify DATABASE_URL format
   postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/bundlenudge?sslmode=require
   ```

2. **Check Neon Status:**
   - Visit [Neon Status Page](https://neonstatus.com)
   - Check if database is in sleep mode (for free tier)

3. **Increase Connection Timeout:**
   - Neon free tier databases may sleep after inactivity
   - First request may take longer to wake

---

## 6. Billing Issues

### 6.1 Webhook Not Received

**Symptom:** Stripe payments complete but subscription isn't updated.

**Diagnostic Steps:**

1. **Check Stripe Dashboard:**
   - Go to Webhooks > Your Endpoint
   - View "Recent deliveries"
   - Check for failed deliveries

2. **Check Webhook URL:**
   - Must be: `https://api.bundlenudge.com/v1/subscriptions/webhook`
   - Must be HTTPS

3. **Check Webhook Secret:**
   ```bash
   # Verify secret is set
   wrangler secret list | grep STRIPE_WEBHOOK_SECRET
   ```

4. **Check Event Selection:**
   Required events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`

---

### 6.2 Subscription Status Mismatch

**Symptom:** Dashboard shows different subscription status than Stripe.

**Solutions:**

1. **Force Sync:**
   ```bash
   # Check subscription in database
   wrangler d1 execute bundlenudge-db --remote --command "
   SELECT * FROM subscriptions WHERE user_id = 'user_xxx';
   "

   # Compare with Stripe
   # stripe subscriptions retrieve sub_xxx
   ```

2. **Manual Update (if needed):**
   ```bash
   wrangler d1 execute bundlenudge-db --remote --command "
   UPDATE subscriptions
   SET status = 'active', updated_at = unixepoch()
   WHERE stripe_subscription_id = 'sub_xxx';
   "
   ```

---

### 6.3 Invoice Sync Failures

**Symptom:** Invoices don't appear in dashboard.

**Cause:** Invoice webhooks not being processed.

**Solutions:**

1. **Check Webhook Events:**
   - Ensure `invoice.paid` and `invoice.created` events are enabled

2. **Manual Invoice Import:**
   ```bash
   # List invoices for a customer
   # stripe invoices list --customer cus_xxx
   ```

---

## 7. Diagnostic Commands

### API Health Check

```bash
# Basic health
curl https://api.bundlenudge.com/health

# Detailed status (requires admin auth)
curl -H "Authorization: Bearer ADMIN_TOKEN" \
  https://api.bundlenudge.com/admin/status
```

### Database Queries

```bash
# Count apps
wrangler d1 execute bundlenudge-db --remote --command "SELECT COUNT(*) FROM apps;"

# Recent releases
wrangler d1 execute bundlenudge-db --remote --command "
SELECT id, version, status, created_at
FROM releases
ORDER BY created_at DESC
LIMIT 10;
"

# Check for stuck builds
wrangler d1 execute bundlenudge-db --remote --command "
SELECT id, status, started_at, created_at
FROM ios_builds
WHERE status IN ('pending', 'building')
AND created_at < unixepoch() - 3600;
"

# Recent telemetry events
wrangler d1 execute bundlenudge-db --remote --command "
SELECT event_type, COUNT(*) as count
FROM telemetry_events
WHERE timestamp > unixepoch() - 86400
GROUP BY event_type;
"
```

### Worker Logs

```bash
# Tail live logs
wrangler tail bundlenudge-api

# Filter for errors
wrangler tail bundlenudge-api --format json | jq 'select(.level == "error")'
```

### R2 Storage

```bash
# List bundles
wrangler r2 object list bundlenudge-bundles

# Get specific bundle info
wrangler r2 object get bundlenudge-bundles/bundles/app_xxx/v1.0.0/bundle.js --file=- | head -c 1000
```

### KV Inspection

```bash
# List rate limit keys
wrangler kv:key list --namespace-id=YOUR_KV_ID

# Check specific rate limit
wrangler kv:key get "rate:ip:192.168.1.1" --namespace-id=YOUR_KV_ID
```

### Queue Status

```bash
# List all queues
wrangler queues list

# Check queue messages
wrangler queues consume bundlenudge-builds-p3 --max-messages 1
```

---

## Getting Help

If you're still experiencing issues:

1. **Check Status Page:** [status.bundlenudge.com](https://status.bundlenudge.com)
2. **Search Documentation:** [docs.bundlenudge.com](https://docs.bundlenudge.com)
3. **GitHub Issues:** [github.com/bundlenudge/bundlenudge/issues](https://github.com/bundlenudge/bundlenudge/issues)
4. **Email Support:** support@bundlenudge.com (Team/Enterprise plans)

When reporting issues, include:
- Error message (full text)
- Steps to reproduce
- SDK version (`@bundlenudge/sdk` version)
- Platform (iOS/Android)
- React Native version
- Relevant logs (with sensitive data redacted)
