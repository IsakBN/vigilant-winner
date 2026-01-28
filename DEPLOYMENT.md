# Deployment Guide

## Architecture

| Subdomain | Package | Description |
|-----------|---------|-------------|
| bundlenudge.com | packages/landing | Marketing landing page |
| app.bundlenudge.com | packages/app-dashboard | Customer dashboard |
| admin.bundlenudge.com | packages/admin-dashboard | Internal admin |
| api.bundlenudge.com | packages/api | Cloudflare Workers API |

## Prerequisites

1. **Vercel Account** - For Next.js apps
2. **Cloudflare Account** - For API (Workers)
3. **Neon Account** - For PostgreSQL databases
4. **Domain** - bundlenudge.com with DNS access

## Database Setup

### 1. Create Neon Databases

Create two separate databases in Neon:

- `bundlenudge_app_auth` - For app-dashboard (Better Auth)
- `bundlenudge_admin_auth` - For admin-dashboard (Better Auth + OTP)

### 2. Run Migrations

```bash
# App dashboard auth
pnpm --filter @bundlenudge/app-dashboard db:push

# Admin dashboard auth
pnpm --filter @bundlenudge/admin-dashboard db:push
```

## Vercel Deployment

### 1. Landing Page (bundlenudge.com)

```bash
cd packages/landing
vercel --prod
```

Configure:
- Domain: bundlenudge.com
- Framework: Next.js

### 2. App Dashboard (app.bundlenudge.com)

```bash
cd packages/app-dashboard
vercel --prod
```

Configure:
- Domain: app.bundlenudge.com
- Environment variables:
  - `DATABASE_URL` - Neon connection string
  - `BETTER_AUTH_SECRET` - Random 32+ char string
  - `GITHUB_CLIENT_ID` - GitHub OAuth app
  - `GITHUB_CLIENT_SECRET` - GitHub OAuth secret
  - `NEXT_PUBLIC_APP_URL` - https://app.bundlenudge.com

### 3. Admin Dashboard (admin.bundlenudge.com)

```bash
cd packages/admin-dashboard
vercel --prod
```

Configure:
- Domain: admin.bundlenudge.com
- Environment variables:
  - `DATABASE_URL` - Neon connection string (separate DB)
  - `BETTER_AUTH_SECRET` - Random 32+ char string
  - `NEXT_PUBLIC_ADMIN_URL` - https://admin.bundlenudge.com

## Cloudflare API Deployment

```bash
cd packages/api
pnpm deploy
```

## DNS Configuration

Add these records to your DNS:

| Type | Name | Value |
|------|------|-------|
| CNAME | @ | cname.vercel-dns.com |
| CNAME | app | cname.vercel-dns.com |
| CNAME | admin | cname.vercel-dns.com |
| CNAME | api | your-worker.workers.dev |

## Admin Email Allowlist

After deploying admin-dashboard, add authorized admin emails:

```sql
INSERT INTO email_allowlist (id, email_pattern, added_by, note)
VALUES
  (gen_random_uuid(), '*@bundlenudge.com', 'system', 'All company emails'),
  (gen_random_uuid(), 'specific-admin@gmail.com', 'system', 'External admin');
```

## Verification Checklist

- [ ] Landing page loads at bundlenudge.com
- [ ] App dashboard loads at app.bundlenudge.com
- [ ] Login works with email/password
- [ ] Login works with GitHub OAuth
- [ ] Admin dashboard loads at admin.bundlenudge.com
- [ ] Admin OTP login works
- [ ] API responds at api.bundlenudge.com

---

# API Deployment (Detailed)

Step-by-step guide to deploy the Cloudflare Workers API.

## Prerequisites

You need accounts on:
- **Cloudflare** (Workers paid plan) - [cloudflare.com](https://cloudflare.com)
- **Neon** (PostgreSQL) - [neon.tech](https://neon.tech)
- **Stripe** (payments) - [stripe.com](https://stripe.com)
- **Resend** (email) - [resend.com](https://resend.com)

Install wrangler CLI:
```bash
npm install -g wrangler
wrangler login
```

## Step 1: Create Cloudflare Resources

Run these commands from `packages/api`:

```bash
cd packages/api
```

### 1.1 Create D1 Database
```bash
wrangler d1 create bundlenudge-prod-db
```
Save the `database_id` from output.

### 1.2 Create KV Namespaces
```bash
wrangler kv namespace create rate-limit
```
Save the `id` from output.

```bash
wrangler kv namespace create cache
```
Save the `id` from output.

### 1.3 Create Queues
```bash
wrangler queues create bundlenudge-prod-builds-p0
wrangler queues create bundlenudge-prod-builds-p1
wrangler queues create bundlenudge-prod-builds-p2
wrangler queues create bundlenudge-prod-builds-p3
wrangler queues create bundlenudge-prod-builds-dlq
```

### 1.4 Update wrangler.toml

Edit `packages/api/wrangler.toml` and replace the placeholder IDs:

```toml
# Replace "placeholder-id" with your D1 database_id
database_id = "YOUR_D1_DATABASE_ID"

# Replace with your KV namespace IDs
[[kv_namespaces]]
binding = "RATE_LIMIT"
id = "YOUR_RATE_LIMIT_KV_ID"

[[kv_namespaces]]
binding = "CACHE"
id = "YOUR_CACHE_KV_ID"
```

## Step 2: Deploy the Worker

```bash
wrangler deploy
```

This will:
- Create the worker `bundlenudge-prod`
- Auto-provision the R2 bucket
- Output your worker URL: `https://bundlenudge-prod.YOUR-SUBDOMAIN.workers.dev`

Test it works:
```bash
curl https://bundlenudge-prod.YOUR-SUBDOMAIN.workers.dev/health
```

## Step 3: Run Database Migrations

Create all the database tables:

```bash
wrangler d1 execute bundlenudge-prod-db --remote --file=drizzle/0000_overconfident_jackal.sql
```

## Step 4: Set Up Neon PostgreSQL

1. Go to [console.neon.tech](https://console.neon.tech)
2. Create a new project
3. Copy the connection string (looks like `postgresql://user:pass@ep-xxx.neon.tech/dbname?sslmode=require`)
4. Set it as a secret:

```bash
wrangler secret put DATABASE_URL
```
Paste your connection string when prompted.

## Step 5: Set All Secrets

Run each command and paste the value when prompted:

### Authentication
```bash
wrangler secret put BETTER_AUTH_SECRET
```
Generate with: `openssl rand -hex 32`

### Stripe (get from stripe.com/dashboard)
```bash
wrangler secret put STRIPE_SECRET_KEY
```
Your Stripe secret key (starts with `sk_live_` or `sk_test_`)

```bash
wrangler secret put STRIPE_WEBHOOK_SECRET
```
Create webhook first (Step 7), then paste signing secret here.

### Email (get from resend.com)
```bash
wrangler secret put RESEND_API_KEY
```
Your Resend API key (starts with `re_`)

### Encryption Keys
Generate each with `openssl rand -hex 32`:

```bash
wrangler secret put ENCRYPTION_KEY
```

```bash
wrangler secret put WEBHOOK_ENCRYPTION_KEY
```

```bash
wrangler secret put GITHUB_TOKEN_ENCRYPTION_KEY
```

### URLs
```bash
wrangler secret put DASHBOARD_URL
```
Enter: `https://app.bundlenudge.com` (or your dashboard domain)

```bash
wrangler secret put API_URL
```
Enter: `https://api.bundlenudge.com` (or your API domain)

```bash
wrangler secret put APP_URL
```
Enter: `https://app.bundlenudge.com` (same as dashboard)

## Step 6: Seed Subscription Plans

```bash
wrangler d1 execute bundlenudge-prod-db --remote --command "INSERT INTO subscription_plans (id, name, display_name, price_cents, mau_limit, storage_gb, bundle_retention, features, is_active, created_at) VALUES ('plan_free', 'free', 'Free', 0, 1000, 1, 7, '{\"hasAnalytics\":false}', 1, unixepoch()), ('plan_pro', 'pro', 'Pro', 2900, 10000, 10, 30, '{\"hasAnalytics\":true}', 1, unixepoch()), ('plan_team', 'team', 'Team', 9900, 100000, 50, 90, '{\"hasAnalytics\":true}', 1, unixepoch()), ('plan_enterprise', 'enterprise', 'Enterprise', 0, 999999999, 999999, 365, '{\"hasAnalytics\":true}', 1, unixepoch());"
```

## Step 7: Configure Stripe Webhook

1. Go to [dashboard.stripe.com/webhooks](https://dashboard.stripe.com/webhooks)
2. Click "Add endpoint"
3. Enter URL: `https://bundlenudge-prod.YOUR-SUBDOMAIN.workers.dev/v1/subscriptions/webhook`
4. Select events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
5. Click "Add endpoint"
6. Copy the "Signing secret" (starts with `whsec_`)
7. Set it:
```bash
wrangler secret put STRIPE_WEBHOOK_SECRET
```

## Step 8: Configure Resend Email

1. Go to [resend.com/domains](https://resend.com/domains)
2. Add your domain (e.g., `mail.bundlenudge.com`)
3. Add the DNS records they provide (SPF, DKIM)
4. Wait for verification

## Step 9: GitHub OAuth (Optional)

1. Go to [github.com/settings/developers](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in:
   - **Name**: BundleNudge
   - **Homepage**: `https://bundlenudge.com`
   - **Callback URL**: `https://bundlenudge-prod.YOUR-SUBDOMAIN.workers.dev/v1/auth/callback/github`
4. Save Client ID and Client Secret
5. Set secrets:
```bash
wrangler secret put GITHUB_CLIENT_ID
```
```bash
wrangler secret put GITHUB_CLIENT_SECRET
```

## Step 10: Custom Domain (Optional)

### API Domain
1. Go to Cloudflare Dashboard > Workers > bundlenudge-prod
2. Click "Triggers" tab
3. Click "Add Custom Domain"
4. Enter: `api.bundlenudge.com`

### Dashboard Domain
Deploy dashboard to Vercel, then add custom domain in Vercel settings.

## Verify Deployment

### Health Check
```bash
curl https://bundlenudge-prod.YOUR-SUBDOMAIN.workers.dev/health
```
Should return: `{"status":"healthy"}`

### Check Database
```bash
wrangler d1 execute bundlenudge-prod-db --remote --command "SELECT COUNT(*) FROM subscription_plans;"
```
Should return: `4`

### Check Secrets
```bash
wrangler secret list
```
Should show all your secrets.

### View Logs
```bash
wrangler tail bundlenudge-prod
```

## Troubleshooting

### "Table not found" errors
Run migrations again:
```bash
wrangler d1 execute bundlenudge-prod-db --remote --file=drizzle/0000_overconfident_jackal.sql
```

### "Unauthorized" errors
Check BETTER_AUTH_SECRET is set:
```bash
wrangler secret list
```

### Stripe webhook not working
1. Check webhook URL is correct in Stripe dashboard
2. Check STRIPE_WEBHOOK_SECRET is set correctly
3. View logs: `wrangler tail bundlenudge-prod`

## Quick Reference

| Resource | Name |
|----------|------|
| Worker | `bundlenudge-prod` |
| D1 Database | `bundlenudge-prod-db` |
| R2 Bucket | `bundlenudge-prod-bundles` |
| KV (rate limit) | `rate-limit` |
| KV (cache) | `cache` |
| Queues | `bundlenudge-prod-builds-p0` through `p3` + `dlq` |

| Secret | Description |
|--------|-------------|
| `DATABASE_URL` | Neon PostgreSQL connection string |
| `BETTER_AUTH_SECRET` | Session encryption (generate with `openssl rand -hex 32`) |
| `STRIPE_SECRET_KEY` | From Stripe dashboard |
| `STRIPE_WEBHOOK_SECRET` | From Stripe webhook settings |
| `RESEND_API_KEY` | From Resend dashboard |
| `ENCRYPTION_KEY` | Generate with `openssl rand -hex 32` |
| `DASHBOARD_URL` | Your dashboard URL |
| `API_URL` | Your API URL |
