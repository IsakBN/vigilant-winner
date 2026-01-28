# BundleNudge Subdomain Deployment Guide

Complete guide for deploying the BundleNudge subdomain architecture.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        DNS (Cloudflare/Vercel)                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   bundlenudge.com          → Landing Page (Vercel)              │
│   app.bundlenudge.com      → App Dashboard (Vercel)             │
│   admin.bundlenudge.com    → Admin Dashboard (Vercel)           │
│   api.bundlenudge.com      → API (Cloudflare Workers)           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                         Databases                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Neon PostgreSQL:                                              │
│   ├── bundlenudge_app_auth    (app-dashboard sessions/users)    │
│   └── bundlenudge_admin_auth  (admin-dashboard sessions/users)  │
│                                                                 │
│   Cloudflare D1:                                                │
│   └── bundlenudge_data        (apps, releases, channels, etc.)  │
│                                                                 │
│   Cloudflare R2:                                                │
│   └── bundlenudge_bundles     (JS bundle storage)               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Prerequisites

| Service | Purpose | Sign Up |
|---------|---------|---------|
| **Vercel** | Host Next.js apps | https://vercel.com |
| **Cloudflare** | API Workers, DNS | https://cloudflare.com |
| **Neon** | PostgreSQL databases | https://neon.tech |
| **GitHub** | OAuth provider | https://github.com/settings/developers |
| **Domain** | DNS management | Your registrar |

---

## Step 1: Create Neon Databases

### 1.1 Create App Auth Database

1. Go to https://console.neon.tech
2. Create new project: `bundlenudge-app-auth`
3. Copy the connection string (looks like `postgresql://user:pass@host/neondb`)
4. Save as `APP_DATABASE_URL`

### 1.2 Create Admin Auth Database

1. Create another project: `bundlenudge-admin-auth`
2. Copy the connection string
3. Save as `ADMIN_DATABASE_URL`

### 1.3 Run Database Migrations

```bash
# From project root
cd packages/app-dashboard
DATABASE_URL="your-app-db-url" pnpm db:push

cd ../admin-dashboard
DATABASE_URL="your-admin-db-url" pnpm db:push
```

### 1.4 Seed Admin Email Allowlist

Connect to admin database and run:

```sql
-- Allow all @bundlenudge.com emails
INSERT INTO email_allowlist (id, email_pattern, added_by, note)
VALUES (gen_random_uuid(), '*@bundlenudge.com', 'system', 'Company domain');

-- Allow specific external admin
INSERT INTO email_allowlist (id, email_pattern, added_by, note)
VALUES (gen_random_uuid(), 'your-email@gmail.com', 'system', 'Founder');
```

---

## Step 2: Configure GitHub OAuth

### 2.1 Create OAuth App

1. Go to https://github.com/settings/developers
2. Click "New OAuth App"
3. Fill in:
   - **Application name**: BundleNudge
   - **Homepage URL**: https://bundlenudge.com
   - **Authorization callback URL**: https://app.bundlenudge.com/api/auth/callback/github

4. Save Client ID and generate Client Secret

### 2.2 For Local Development

Create another OAuth app for development:
- **Authorization callback URL**: http://localhost:3001/api/auth/callback/github

---

## Step 3: Generate Auth Secrets

Generate two separate secrets (one for each dashboard):

```bash
# App dashboard secret
openssl rand -base64 32
# Example: K7x9mP2nQ4rS6tU8vW0xY2zA4bC6dE8f

# Admin dashboard secret (different!)
openssl rand -base64 32
# Example: M3nO5pQ7rS9tU1vW3xY5zA7bC9dE1fG3
```

---

## Step 4: Deploy to Vercel

### 4.1 Deploy Landing Page

```bash
cd packages/landing
vercel
```

When prompted:
- **Link to existing project?** No
- **Project name**: bundlenudge-landing
- **Directory**: ./

After first deploy, add custom domain:
```bash
vercel domains add bundlenudge.com
```

**Environment Variables** (Vercel Dashboard → Settings → Environment Variables):
| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_APP_URL` | https://app.bundlenudge.com |
| `NEXT_PUBLIC_API_URL` | https://api.bundlenudge.com |

### 4.2 Deploy App Dashboard

```bash
cd packages/app-dashboard
vercel
```

Add custom domain:
```bash
vercel domains add app.bundlenudge.com
```

**Environment Variables**:
| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_APP_URL` | https://app.bundlenudge.com |
| `NEXT_PUBLIC_API_URL` | https://api.bundlenudge.com |
| `DATABASE_URL` | postgresql://...neon.tech/bundlenudge_app_auth |
| `BETTER_AUTH_SECRET` | K7x9mP2nQ4rS6tU8vW0xY2zA4bC6dE8f |
| `GITHUB_CLIENT_ID` | your-github-client-id |
| `GITHUB_CLIENT_SECRET` | your-github-client-secret |

### 4.3 Deploy Admin Dashboard

```bash
cd packages/admin-dashboard
vercel
```

Add custom domain:
```bash
vercel domains add admin.bundlenudge.com
```

**Environment Variables**:
| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_ADMIN_URL` | https://admin.bundlenudge.com |
| `NEXT_PUBLIC_API_URL` | https://api.bundlenudge.com |
| `DATABASE_URL` | postgresql://...neon.tech/bundlenudge_admin_auth |
| `BETTER_AUTH_SECRET` | M3nO5pQ7rS9tU1vW3xY5zA7bC9dE1fG3 |

---

## Step 5: Deploy API to Cloudflare

### 5.1 Configure Wrangler

Update `packages/api/wrangler.toml` with production values.

### 5.2 Deploy

```bash
cd packages/api
pnpm deploy
```

### 5.3 Add Custom Domain

1. Go to Cloudflare Dashboard → Workers → your-worker → Triggers
2. Add Custom Domain: `api.bundlenudge.com`

---

## Step 6: Configure DNS

Add these DNS records (at your registrar or Cloudflare):

| Type | Name | Value | Proxy |
|------|------|-------|-------|
| CNAME | @ | cname.vercel-dns.com | Off |
| CNAME | www | cname.vercel-dns.com | Off |
| CNAME | app | cname.vercel-dns.com | Off |
| CNAME | admin | cname.vercel-dns.com | Off |
| CNAME | api | your-worker.workers.dev | On (if Cloudflare) |

**Note**: If using Cloudflare for DNS, you may need to configure SSL/TLS settings.

---

## Step 7: Verification Checklist

### Landing Page (bundlenudge.com)
- [ ] Page loads without errors
- [ ] All sections render (Hero, Features, Pricing, etc.)
- [ ] "Get Started" links go to app.bundlenudge.com/login
- [ ] Mobile responsive

### App Dashboard (app.bundlenudge.com)
- [ ] Login page loads
- [ ] Email/password signup works
- [ ] GitHub OAuth works
- [ ] Dashboard loads after login
- [ ] Apps page works
- [ ] Can create new app
- [ ] Logout works

### Admin Dashboard (admin.bundlenudge.com)
- [ ] Login page loads
- [ ] Unauthorized email shows error
- [ ] Authorized email receives OTP (check console in dev)
- [ ] OTP verification works
- [ ] Admin dashboard loads
- [ ] All admin pages accessible
- [ ] Logout works

### API (api.bundlenudge.com)
- [ ] Health endpoint responds
- [ ] CORS allows app.bundlenudge.com
- [ ] CORS allows admin.bundlenudge.com
- [ ] Authentication endpoints work

---

## Local Development

### Start All Services

```bash
# Terminal 1: Landing (port 3000)
pnpm dev:landing

# Terminal 2: App Dashboard (port 3001)
pnpm dev:app

# Terminal 3: Admin Dashboard (port 3002)
pnpm dev:admin

# Terminal 4: API (port 8787)
pnpm --filter @bundlenudge/api dev
```

### Local Environment Files

Create `.env.local` in each package:

**packages/landing/.env.local**
```bash
NEXT_PUBLIC_APP_URL=http://localhost:3001
NEXT_PUBLIC_API_URL=http://localhost:8787
```

**packages/app-dashboard/.env.local**
```bash
NEXT_PUBLIC_APP_URL=http://localhost:3001
NEXT_PUBLIC_API_URL=http://localhost:8787
DATABASE_URL=postgresql://...
BETTER_AUTH_SECRET=dev-secret-at-least-32-characters-long
GITHUB_CLIENT_ID=your-dev-github-client-id
GITHUB_CLIENT_SECRET=your-dev-github-client-secret
```

**packages/admin-dashboard/.env.local**
```bash
NEXT_PUBLIC_ADMIN_URL=http://localhost:3002
NEXT_PUBLIC_API_URL=http://localhost:8787
DATABASE_URL=postgresql://...
BETTER_AUTH_SECRET=different-dev-secret-32-chars-long
```

---

## Troubleshooting

### "Email not authorized" on admin login
- Check that email is in `email_allowlist` table
- Patterns like `*@domain.com` match all emails from that domain

### GitHub OAuth callback error
- Verify callback URL matches exactly: `https://app.bundlenudge.com/api/auth/callback/github`
- Check GitHub OAuth app settings

### CORS errors
- Verify API trustedOrigins includes your domain
- Check browser console for specific origin being blocked

### Database connection errors
- Verify DATABASE_URL is correct
- Check Neon dashboard for connection limits
- Ensure IP allowlist includes Vercel IPs (or allow all)

### OTP not arriving (production)
- Implement email service (Resend/SendGrid)
- Check spam folder
- Verify email service API key is set

---

## Security Checklist

- [ ] Different BETTER_AUTH_SECRET for app vs admin
- [ ] Admin database is separate from app database
- [ ] Admin email allowlist is configured
- [ ] HTTPS enforced on all subdomains
- [ ] OAuth secrets are not in git
- [ ] Environment variables are set in Vercel (not committed)

---

## Quick Reference

| Service | Local URL | Production URL |
|---------|-----------|----------------|
| Landing | http://localhost:3000 | https://bundlenudge.com |
| App Dashboard | http://localhost:3001 | https://app.bundlenudge.com |
| Admin Dashboard | http://localhost:3002 | https://admin.bundlenudge.com |
| API | http://localhost:8787 | https://api.bundlenudge.com |

| Database | Purpose |
|----------|---------|
| bundlenudge_app_auth | App dashboard users/sessions |
| bundlenudge_admin_auth | Admin dashboard users/sessions |
| Cloudflare D1 | App data (apps, releases, etc.) |
