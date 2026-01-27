# BundleNudge Deployment Guide

Complete guide for deploying BundleNudge to production. This document covers all infrastructure requirements, configuration, and post-deployment verification.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Cloudflare Setup](#2-cloudflare-setup)
3. [Database Setup](#3-database-setup)
4. [Environment Variables](#4-environment-variables)
5. [Third-Party Services](#5-third-party-services)
6. [Dashboard Deployment](#6-dashboard-deployment)
7. [Worker Deployment](#7-worker-deployment)
8. [DNS Configuration](#8-dns-configuration)
9. [Post-Deployment Checklist](#9-post-deployment-checklist)
10. [Monitoring and Alerts](#10-monitoring-and-alerts)

---

## 1. Prerequisites

Before deploying BundleNudge, ensure you have accounts and access to the following services:

### Required Accounts

| Service | Purpose | Sign Up |
|---------|---------|---------|
| Cloudflare | API hosting, D1, R2, KV, Queues | [cloudflare.com](https://cloudflare.com) |
| Neon | PostgreSQL for Better-Auth | [neon.tech](https://neon.tech) |
| Stripe | Payment processing | [stripe.com](https://stripe.com) |
| Resend | Transactional email | [resend.com](https://resend.com) |
| GitHub | OAuth and GitHub App | [github.com](https://github.com) |

### Required CLI Tools

```bash
# Install Wrangler (Cloudflare CLI)
npm install -g wrangler

# Install GitHub CLI (optional, for debugging)
brew install gh

# Verify installations
wrangler --version
```

### Domain Names

You will need:
- **API domain**: `api.yourdomain.com` (Cloudflare Workers)
- **Dashboard domain**: `app.yourdomain.com` (Vercel/Cloudflare Pages)
- **Email domain**: For Resend email delivery (e.g., `mail.yourdomain.com`)

---

## 2. Cloudflare Setup

### 2.1 Create D1 Database

```bash
# Create production database
wrangler d1 create bundlenudge-db

# Note the database_id from the output
# Example: database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

### 2.2 Create R2 Bucket

```bash
# Create bucket for bundle storage
wrangler r2 bucket create bundlenudge-bundles

# Verify creation
wrangler r2 bucket list
```

### 2.3 Create KV Namespaces

```bash
# Rate limiting KV
wrangler kv:namespace create "RATE_LIMIT"
# Note the id from output

# Cache KV (for admin dashboard, etc.)
wrangler kv:namespace create "CACHE"
# Note the id from output
```

### 2.4 Create Queues

BundleNudge uses priority queues for fair build processing (P0=Enterprise, P1=Team, P2=Pro, P3=Free):

```bash
# Priority 0 - Enterprise (highest priority)
wrangler queues create bundlenudge-builds-p0

# Priority 1 - Team
wrangler queues create bundlenudge-builds-p1

# Priority 2 - Pro
wrangler queues create bundlenudge-builds-p2

# Priority 3 - Free (lowest priority)
wrangler queues create bundlenudge-builds-p3

# Dead Letter Queue (failed jobs)
wrangler queues create bundlenudge-builds-dlq
```

### 2.5 Update wrangler.toml

Update `packages/api/wrangler.toml` with your actual IDs:

```toml
name = "bundlenudge-api"
main = "src/index.ts"
compatibility_date = "2024-01-01"

# D1 Database
[[d1_databases]]
binding = "DB"
database_name = "bundlenudge-db"
database_id = "YOUR_D1_DATABASE_ID"

# R2 Bucket for bundles
[[r2_buckets]]
binding = "BUNDLES"
bucket_name = "bundlenudge-bundles"

# KV for rate limiting
[[kv_namespaces]]
binding = "RATE_LIMIT"
id = "YOUR_RATE_LIMIT_KV_ID"

# KV for caching
[[kv_namespaces]]
binding = "CACHE"
id = "YOUR_CACHE_KV_ID"

# Priority Queues
[[queues.producers]]
binding = "BUILD_QUEUE_P0"
queue = "bundlenudge-builds-p0"

[[queues.producers]]
binding = "BUILD_QUEUE_P1"
queue = "bundlenudge-builds-p1"

[[queues.producers]]
binding = "BUILD_QUEUE_P2"
queue = "bundlenudge-builds-p2"

[[queues.producers]]
binding = "BUILD_QUEUE_P3"
queue = "bundlenudge-builds-p3"

[[queues.producers]]
binding = "BUILD_QUEUE_DLQ"
queue = "bundlenudge-builds-dlq"

[vars]
ENVIRONMENT = "production"
```

### 2.6 Deploy the Worker

```bash
cd packages/api

# Deploy to production
wrangler deploy

# The output will show your worker URL:
# https://bundlenudge-api.your-subdomain.workers.dev
```

---

## 3. Database Setup

### 3.1 Neon PostgreSQL (Better-Auth)

1. **Create a Neon project** at [console.neon.tech](https://console.neon.tech)

2. **Get connection string** from the dashboard:
   ```
   postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/bundlenudge?sslmode=require
   ```

3. **Run Better-Auth migrations** (if applicable):
   ```bash
   # The auth tables are managed by Better-Auth
   # Ensure DATABASE_URL is set before running the API
   ```

### 3.2 D1 Migrations (Drizzle)

Run Drizzle migrations to create all D1 tables:

```bash
cd packages/api

# Generate migrations from schema
pnpm drizzle-kit generate

# Push to D1 (remote)
wrangler d1 execute bundlenudge-db --remote --file=./drizzle/0000_*.sql

# Or use Drizzle push for development
pnpm drizzle-kit push
```

### 3.3 Seed Subscription Plans

After migrations, seed the required subscription plans:

```bash
wrangler d1 execute bundlenudge-db --remote --command "
INSERT INTO subscription_plans (id, name, display_name, price_cents, mau_limit, storage_gb, bundle_retention, features, is_active, created_at)
VALUES
  ('plan_free', 'free', 'Free', 0, 1000, 1, 7, '{\"hasAnalytics\":false,\"hasWebhooks\":false}', 1, unixepoch()),
  ('plan_pro', 'pro', 'Pro', 2900, 10000, 10, 30, '{\"hasAnalytics\":true,\"hasWebhooks\":true}', 1, unixepoch()),
  ('plan_team', 'team', 'Team', 9900, 100000, 50, 90, '{\"hasAnalytics\":true,\"hasWebhooks\":true,\"hasPrioritySupport\":true}', 1, unixepoch()),
  ('plan_enterprise', 'enterprise', 'Enterprise', 0, 999999999, 999999, 365, '{\"hasAnalytics\":true,\"hasWebhooks\":true,\"hasPrioritySupport\":true}', 1, unixepoch());
"
```

---

## 4. Environment Variables

### 4.1 Complete Environment Variable Reference

Set these secrets using Wrangler:

```bash
wrangler secret put VARIABLE_NAME
# Then paste the value when prompted
```

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| **Authentication** ||||
| `DATABASE_URL` | Yes | Neon PostgreSQL connection string | `postgresql://user:pass@host/db?sslmode=require` |
| `BETTER_AUTH_SECRET` | Yes | Random 32+ char secret for session encryption | `openssl rand -hex 32` |
| `JWT_SECRET` | No | Legacy JWT signing secret | `openssl rand -hex 32` |
| **OAuth** ||||
| `GITHUB_CLIENT_ID` | Yes | GitHub OAuth App client ID | `Iv1.abc123def456` |
| `GITHUB_CLIENT_SECRET` | Yes | GitHub OAuth App client secret | `abc123...` |
| **Email** ||||
| `RESEND_API_KEY` | Yes | Resend API key | `re_abc123...` |
| **Stripe** ||||
| `STRIPE_SECRET_KEY` | Yes | Stripe secret key (sk_live_...) | `sk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | Yes | Stripe webhook signing secret | `whsec_...` |
| **Encryption** ||||
| `ENCRYPTION_KEY` | Yes | 32-byte hex key for data encryption | `openssl rand -hex 32` |
| `WEBHOOK_ENCRYPTION_KEY` | Yes | Key for encrypting webhook payloads | `openssl rand -hex 32` |
| `GITHUB_TOKEN_ENCRYPTION_KEY` | Yes | Key for encrypting GitHub tokens | `openssl rand -hex 32` |
| **GitHub App** ||||
| `GITHUB_APP_ID` | Yes | GitHub App ID | `123456` |
| `GITHUB_APP_NAME` | Yes | GitHub App name (slug) | `bundlenudge` |
| `GITHUB_PRIVATE_KEY` | Yes | GitHub App private key (PEM format) | `-----BEGIN RSA PRIVATE KEY-----...` |
| `GITHUB_WEBHOOK_SECRET` | Yes | GitHub webhook secret | `openssl rand -hex 32` |
| **URLs** ||||
| `DASHBOARD_URL` | Yes | Dashboard URL for redirects | `https://app.bundlenudge.com` |
| `API_URL` | Yes | API URL for CORS and links | `https://api.bundlenudge.com` |
| `APP_URL` | Yes | Base URL for email links | `https://app.bundlenudge.com` |

### 4.2 Setting Secrets in Wrangler

```bash
cd packages/api

# Authentication
wrangler secret put DATABASE_URL
wrangler secret put BETTER_AUTH_SECRET

# OAuth
wrangler secret put GITHUB_CLIENT_ID
wrangler secret put GITHUB_CLIENT_SECRET

# Email
wrangler secret put RESEND_API_KEY

# Stripe
wrangler secret put STRIPE_SECRET_KEY
wrangler secret put STRIPE_WEBHOOK_SECRET

# Encryption keys (generate with: openssl rand -hex 32)
wrangler secret put ENCRYPTION_KEY
wrangler secret put WEBHOOK_ENCRYPTION_KEY
wrangler secret put GITHUB_TOKEN_ENCRYPTION_KEY

# GitHub App
wrangler secret put GITHUB_APP_ID
wrangler secret put GITHUB_APP_NAME
wrangler secret put GITHUB_PRIVATE_KEY

# URLs
wrangler secret put DASHBOARD_URL
wrangler secret put API_URL
wrangler secret put APP_URL
```

### 4.3 Generating Encryption Keys

```bash
# Generate a 32-byte hex key (64 characters)
openssl rand -hex 32

# Example output: a1b2c3d4e5f6...
```

---

## 5. Third-Party Services

### 5.1 Stripe Setup

#### Create Products and Prices

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/products)
2. Create products for each plan:

| Product | Price | Billing |
|---------|-------|---------|
| Pro | $29/month | Monthly |
| Team | $99/month | Monthly |
| Enterprise | Custom | Contact sales |

3. Note the `price_id` for each (e.g., `price_1ABC...`)

4. Update the `subscription_plans` table with Stripe price IDs:

```bash
wrangler d1 execute bundlenudge-db --remote --command "
UPDATE subscription_plans SET stripe_price_id = 'price_YOUR_PRO_PRICE_ID' WHERE name = 'pro';
UPDATE subscription_plans SET stripe_price_id = 'price_YOUR_TEAM_PRICE_ID' WHERE name = 'team';
"
```

#### Configure Webhook

1. Go to [Stripe Webhooks](https://dashboard.stripe.com/webhooks)
2. Add endpoint: `https://api.bundlenudge.com/v1/subscriptions/webhook`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
4. Copy the signing secret to `STRIPE_WEBHOOK_SECRET`

#### Customer Portal

1. Go to [Stripe Customer Portal](https://dashboard.stripe.com/settings/billing/portal)
2. Enable portal features:
   - Update payment method
   - Cancel subscription
   - View invoices

### 5.2 Resend Setup

1. Create account at [resend.com](https://resend.com)
2. Verify your sending domain (e.g., `mail.bundlenudge.com`)
3. Add DNS records (DKIM, SPF) as instructed
4. Create an API key and save as `RESEND_API_KEY`

**Email Types Sent:**
- Email verification OTP
- Password reset links
- Team invitation emails
- Welcome emails
- Admin OTP codes

### 5.3 GitHub OAuth App

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Configure:
   - **Application name**: BundleNudge
   - **Homepage URL**: `https://bundlenudge.com`
   - **Authorization callback URL**: `https://api.bundlenudge.com/v1/auth/callback/github`
4. Save `Client ID` as `GITHUB_CLIENT_ID`
5. Generate and save `Client Secret` as `GITHUB_CLIENT_SECRET`

### 5.4 GitHub App (for Repository Webhooks)

1. Go to [GitHub Apps](https://github.com/settings/apps)
2. Click "New GitHub App"
3. Configure:
   - **GitHub App name**: bundlenudge (must be unique)
   - **Homepage URL**: `https://bundlenudge.com`
   - **Webhook URL**: `https://api.bundlenudge.com/v1/github/webhook`
   - **Webhook secret**: Generate with `openssl rand -hex 32`

4. **Permissions**:
   - Repository contents: Read
   - Metadata: Read
   - Pull requests: Read
   - Webhooks: Read & Write

5. **Subscribe to events**:
   - Push
   - Pull request
   - Release

6. After creation:
   - Note the **App ID**
   - Generate and download the **Private Key** (.pem file)
   - Install the app on your GitHub organization

---

## 6. Dashboard Deployment

### 6.1 Vercel Deployment (Recommended)

#### Step-by-Step Vercel Setup

**Step 1: Install Vercel CLI**
```bash
npm install -g vercel
vercel login
```

**Step 2: Link Repository**
```bash
cd packages/dashboard
vercel link
# Select your Vercel account
# Create new project: bundlenudge-dashboard
```

**Step 3: Configure Project Settings**

In Vercel Dashboard ([vercel.com/dashboard](https://vercel.com/dashboard)):

1. Go to **Project Settings** > **General**
   - **Root Directory**: `packages/dashboard`
   - **Framework Preset**: Next.js
   - **Node.js Version**: 20.x

2. Go to **Project Settings** > **Build & Development**
   - **Build Command**: `pnpm build`
   - **Output Directory**: `.next`
   - **Install Command**: `pnpm install`

**Step 4: Set Environment Variables**

In Vercel Dashboard > **Settings** > **Environment Variables**:

| Variable | Value | Environments |
|----------|-------|--------------|
| `NEXT_PUBLIC_API_URL` | `https://api.bundlenudge.com` | Production, Preview |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_live_...` | Production |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_test_...` | Preview |

Or via CLI:
```bash
vercel env add NEXT_PUBLIC_API_URL production
# Enter: https://api.bundlenudge.com

vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY production
# Enter: pk_live_...
```

**Step 5: Deploy**
```bash
# Preview deployment
vercel

# Production deployment
vercel --prod
```

**Step 6: Configure Custom Domain**

1. In Vercel Dashboard > **Settings** > **Domains**
2. Add `app.bundlenudge.com`
3. Vercel will provide DNS records to add:
   ```
   Type: CNAME
   Name: app
   Value: cname.vercel-dns.com
   ```
4. Add the record in Cloudflare (with proxy OFF - gray cloud)
5. Wait for SSL certificate provisioning

### 6.2 Docs Site Deployment (Vercel)

The docs site (`packages/docs`) follows the same process:

```bash
cd packages/docs
vercel link
# Project name: bundlenudge-docs
```

Environment variables for docs:
| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_API_URL` | `https://api.bundlenudge.com` |
| `NEXT_PUBLIC_DASHBOARD_URL` | `https://app.bundlenudge.com` |

Deploy:
```bash
vercel --prod
```

Add custom domain `docs.bundlenudge.com` in Vercel settings.

### 6.3 Cloudflare Pages Deployment (Alternative)

```bash
cd packages/dashboard

# Build for Cloudflare Pages
pnpm build

# Deploy using Wrangler
wrangler pages deploy .next --project-name=bundlenudge-dashboard
```

### 6.4 Dashboard Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Yes | BundleNudge API URL |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Yes | Stripe publishable key |
| `NEXT_PUBLIC_GITHUB_CLIENT_ID` | No | For OAuth (handled by API) |

---

## 7. Worker Deployment (Build Worker)

The build worker runs on a Mac machine (for iOS builds) or Linux (for Android).

### 7.1 Fly.io Setup (Recommended)

1. Install Fly CLI:
   ```bash
   brew install flyctl
   ```

2. Create `fly.toml` in `packages/worker`:
   ```toml
   app = "bundlenudge-worker"
   primary_region = "sjc"  # San Jose (close to users)

   [build]
     dockerfile = "Dockerfile"

   [env]
     NODE_ENV = "production"

   [[services]]
     internal_port = 8080
     protocol = "tcp"

     [[services.ports]]
       port = 443
       handlers = ["tls", "http"]
   ```

3. Deploy:
   ```bash
   cd packages/worker
   fly deploy
   ```

### 7.2 Worker Environment Variables

Set via Fly.io secrets:

```bash
fly secrets set API_URL=https://api.bundlenudge.com
fly secrets set WORKER_SECRET=your-worker-auth-secret
```

---

## 8. DNS Configuration

### 8.1 API Subdomain (Cloudflare Workers)

In Cloudflare DNS, add a CNAME or use Workers Routes:

```
Type: CNAME
Name: api
Target: bundlenudge-api.your-subdomain.workers.dev
Proxy: Yes (orange cloud)
```

Or configure a Workers Route:
- Route: `api.bundlenudge.com/*`
- Worker: `bundlenudge-api`

### 8.2 Dashboard Domain

For Vercel:
```
Type: CNAME
Name: app
Target: cname.vercel-dns.com
Proxy: No (gray cloud - Vercel handles SSL)
```

For Cloudflare Pages:
```
Type: CNAME
Name: app
Target: bundlenudge-dashboard.pages.dev
Proxy: Yes
```

### 8.3 Email Domain (Resend)

Add the DNS records provided by Resend for your sending domain:
- SPF record
- DKIM records (2-3 CNAME records)

---

## 9. Post-Deployment Checklist

Run through this checklist after deployment:

### API Health

```bash
# Check API health endpoint
curl https://api.bundlenudge.com/health

# Expected response:
# {"status":"ok","timestamp":"..."}
```

### Authentication Flow

1. Visit `https://app.bundlenudge.com/login`
2. Click "Sign in with GitHub"
3. Verify redirect to GitHub
4. Verify callback completes successfully
5. Check user is created in database

### Email Delivery

```bash
# Trigger a test email (password reset)
curl -X POST https://api.bundlenudge.com/v1/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

### Stripe Integration

1. Create a test checkout session
2. Complete payment with Stripe test card (`4242 4242 4242 4242`)
3. Verify webhook is received
4. Check subscription is created in database

### Database Connectivity

```bash
# Check D1 is accessible
wrangler d1 execute bundlenudge-db --remote --command "SELECT COUNT(*) FROM subscription_plans;"
```

### R2 Storage

```bash
# List bucket contents
wrangler r2 object list bundlenudge-bundles
```

### Seed Admin User (if needed)

```bash
# Create first admin user (run from local with wrangler)
wrangler d1 execute bundlenudge-db --remote --command "
INSERT INTO admins (id, email, name, password_hash, role, created_at, updated_at)
VALUES ('admin_1', 'admin@bundlenudge.com', 'Admin', 'REPLACE_WITH_BCRYPT_HASH', 'super_admin', unixepoch(), unixepoch());
"
```

---

## 10. Monitoring and Alerts

### 10.1 Cloudflare Analytics

Workers analytics are available at:
- [Cloudflare Dashboard](https://dash.cloudflare.com) > Workers > bundlenudge-api > Analytics

Monitor:
- Request count
- Error rate (4xx, 5xx)
- CPU time
- Subrequest count

### 10.2 Error Tracking (Recommended)

Consider adding Sentry for error tracking:

1. Create Sentry project
2. Add Sentry SDK to the worker
3. Configure DSN in environment variables

### 10.3 Uptime Monitoring

Set up uptime checks with:
- [Cloudflare Health Checks](https://www.cloudflare.com/products/health-checks/)
- [Better Uptime](https://betteruptime.com/)
- [Pingdom](https://www.pingdom.com/)

**Endpoints to monitor:**
- `https://api.bundlenudge.com/health` (API health)
- `https://app.bundlenudge.com` (Dashboard)

### 10.4 Alerts

Configure alerts for:
- Error rate > 1%
- Response time > 1000ms
- Worker CPU time > 50ms
- D1 query latency > 100ms

### 10.5 Log Access

View worker logs in real-time:

```bash
wrangler tail bundlenudge-api
```

---

## 11. CI/CD with GitHub Actions

### 11.1 API Deployment Workflow

Create `.github/workflows/deploy-api.yml`:

```yaml
name: Deploy API

on:
  push:
    branches: [main]
    paths: ['packages/api/**']

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 9

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run tests
        run: pnpm --filter @bundlenudge/api test

      - name: Deploy to Cloudflare
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          workingDirectory: packages/api
```

### 11.2 Dashboard Deployment Workflow

Vercel automatically deploys on push when connected to GitHub. For manual control:

```yaml
name: Deploy Dashboard

on:
  push:
    branches: [main]
    paths: ['packages/dashboard/**']

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          working-directory: packages/dashboard
          vercel-args: '--prod'
```

### 11.3 Required GitHub Secrets

| Secret | Description | Where to get |
|--------|-------------|--------------|
| `CLOUDFLARE_API_TOKEN` | Wrangler deploy token | Cloudflare Dashboard > API Tokens |
| `VERCEL_TOKEN` | Vercel API token | Vercel > Settings > Tokens |
| `VERCEL_ORG_ID` | Vercel organization ID | `.vercel/project.json` |
| `VERCEL_PROJECT_ID` | Vercel project ID | `.vercel/project.json` |

---

## Quick Reference

### Deployment Commands

```bash
# Deploy API to Cloudflare Workers
cd packages/api && wrangler deploy

# Deploy Dashboard to Vercel
cd packages/dashboard && vercel --prod

# Deploy Docs to Vercel
cd packages/docs && vercel --prod

# Deploy Worker to Fly.io
cd packages/worker && fly deploy

# Run D1 migrations
cd packages/api && wrangler d1 execute bundlenudge-db --remote --file=./drizzle/migrations/0001_*.sql

# View Worker logs
wrangler tail bundlenudge-api

# Check secrets
wrangler secret list
```

### Useful URLs

| Service | URL |
|---------|-----|
| API | `https://api.bundlenudge.com` |
| Dashboard | `https://app.bundlenudge.com` |
| Stripe Dashboard | `https://dashboard.stripe.com` |
| Cloudflare Dashboard | `https://dash.cloudflare.com` |
| Neon Console | `https://console.neon.tech` |
| Resend Dashboard | `https://resend.com/dashboard` |

### Emergency Contacts

Document your on-call contacts and escalation procedures here.

---

## Appendix: Subscription Plan Limits

Reference for plan enforcement:

| Plan | MAU Limit | Storage | Apps | Team Members | Builds/Month |
|------|-----------|---------|------|--------------|--------------|
| Free | 1,000 | 1 GB | 2 | 1 | 10 |
| Pro | 10,000 | 10 GB | 10 | 5 | 100 |
| Team | 100,000 | 50 GB | 50 | 20 | 500 |
| Enterprise | Unlimited | Unlimited | Unlimited | Unlimited | Unlimited |
