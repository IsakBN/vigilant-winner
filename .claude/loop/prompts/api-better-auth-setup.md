# Feature: api/better-auth-setup

Configure Better Auth with Neon Postgres for BundleNudge.

## Knowledge Docs to Read First

- `.claude/knowledge/IMPLEMENTATION_DETAILS.md` → Section 2: Auth Flows
- `.claude/knowledge/API_FEATURES.md` → Section: 🔐 Authentication

## Dependencies

- `shared/types` (user types)
- `api/database-schema` (must exist first)

## What to Implement

### 1. Better Auth Configuration

Create `packages/api/src/lib/auth.ts`:

```typescript
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { emailOTP } from 'better-auth/plugins'
import { Pool } from '@neondatabase/serverless'

export function createAuth(env: Env) {
  const pool = new Pool({ connectionString: env.DATABASE_URL })

  return betterAuth({
    database: drizzleAdapter(pool, {
      provider: 'pg',
    }),
    emailAndPassword: {
      enabled: true,
    },
    socialProviders: {
      github: {
        clientId: env.GITHUB_CLIENT_ID,
        clientSecret: env.GITHUB_CLIENT_SECRET,
      },
    },
    plugins: [
      emailOTP({
        async sendVerificationOTP({ email, otp }) {
          await sendOTPEmail(email, otp, env)
        },
        otpLength: 6,
        expiresIn: 600, // 10 minutes
      }),
    ],
    session: {
      expiresIn: 60 * 60 * 24 * 7,  // 7 days
      updateAge: 60 * 60 * 24,       // Update every 24 hours
    },
    trustedOrigins: [
      env.DASHBOARD_URL,
      env.API_URL,
    ],
  })
}
```

### 2. Auth Schema (Drizzle)

Create `packages/api/src/lib/auth-schema.ts`:

Reference: IMPLEMENTATION_DETAILS.md Section 1, "Neon Postgres - Better-Auth Tables"

Tables needed:
- `user`
- `session`
- `account`
- `verification`

### 3. Admin Check Helper

```typescript
export function isAdmin(email: string | null | undefined): boolean {
  return email?.endsWith('@bundlenudge.com') ?? false
}
```

### 4. Routes

Mount Better Auth handler at `/api/auth/*`:

```typescript
// packages/api/src/routes/auth.ts
import { Hono } from 'hono'
import { createAuth } from '../lib/auth'

export const authRoutes = new Hono<{ Bindings: Env }>()

authRoutes.all('/*', async (c) => {
  const auth = createAuth(c.env)
  return auth.handler(c.req.raw)
})
```

## Environment Variables Required

- `DATABASE_URL` - Neon Postgres connection string
- `BETTER_AUTH_SECRET` - Session signing secret
- `GITHUB_CLIENT_ID` - GitHub OAuth app
- `GITHUB_CLIENT_SECRET` - GitHub OAuth secret
- `RESEND_API_KEY` - For OTP emails

## Tests Required

1. User signup with email/password
2. Email OTP verification
3. GitHub OAuth callback
4. Session creation and refresh
5. isAdmin function

## Acceptance Criteria

- [ ] Better Auth configured with Neon Postgres
- [ ] Email/password signup works
- [ ] OTP email sends via Resend
- [ ] GitHub OAuth flow works
- [ ] Sessions persist 7 days
- [ ] isAdmin checks @bundlenudge.com
- [ ] All tests pass
