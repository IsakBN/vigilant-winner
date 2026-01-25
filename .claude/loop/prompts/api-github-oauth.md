# Feature: api/github-oauth

Implement GitHub OAuth flow using Better Auth.

## Knowledge Docs to Read First

- `.claude/knowledge/IMPLEMENTATION_DETAILS.md` → GitHub OAuth setup
- `.claude/knowledge/API_FEATURES.md` → Auth endpoints

## Dependencies

- `api/better-auth-setup` (must complete first)
- `api/auth-middleware` (must complete first)

## What to Implement

### 1. Better Auth GitHub Plugin Configuration

```typescript
// packages/api/src/lib/auth.ts (update)
import { betterAuth } from 'better-auth'
import { github } from 'better-auth/plugins'

export const auth = betterAuth({
  database: {
    type: 'postgres',
    url: process.env.DATABASE_URL,
  },
  plugins: [
    github({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      scope: ['read:user', 'user:email'],
    }),
  ],
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // Update session every day
  },
  callbacks: {
    onUserCreated: async ({ user }) => {
      // Track new user registration
      console.log('New user created via GitHub:', user.email)
    },
  },
})
```

### 2. OAuth Routes

```typescript
// packages/api/src/routes/auth/github.ts
import { Hono } from 'hono'
import { auth } from '../../lib/auth'

const github = new Hono()

// Initiate GitHub OAuth flow
github.get('/authorize', async (c) => {
  const redirectUrl = c.req.query('redirect')

  // Store redirect URL in cookie for callback
  if (redirectUrl) {
    c.header('Set-Cookie', `oauth_redirect=${redirectUrl}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600`)
  }

  // Better Auth handles the OAuth initiation
  return auth.handleRequest(c.req.raw)
})

// GitHub OAuth callback
github.get('/callback', async (c) => {
  const code = c.req.query('code')
  const state = c.req.query('state')

  if (!code) {
    return c.json({ error: 'Missing authorization code' }, 400)
  }

  try {
    // Better Auth handles token exchange and user creation/linking
    const response = await auth.handleRequest(c.req.raw)

    // Get redirect URL from cookie
    const redirectCookie = c.req.header('Cookie')?.match(/oauth_redirect=([^;]+)/)
    const redirectUrl = redirectCookie?.[1] || '/dashboard'

    // Clear the redirect cookie
    c.header('Set-Cookie', 'oauth_redirect=; Path=/; HttpOnly; Max-Age=0')

    // Redirect to dashboard
    return c.redirect(redirectUrl)
  } catch (error) {
    console.error('GitHub OAuth error:', error)
    return c.redirect('/login?error=oauth_failed')
  }
})

export default github
```

### 3. Link/Unlink GitHub Account

```typescript
// packages/api/src/routes/auth/github-link.ts
import { Hono } from 'hono'
import { authMiddleware } from '../../middleware/auth'

const githubLink = new Hono()

// Link GitHub to existing account
githubLink.post('/link', authMiddleware, async (c) => {
  const user = c.get('user')

  // Generate state token
  const state = crypto.randomUUID()
  await c.env.KV.put(`github_link:${state}`, user.id, { expirationTtl: 600 })

  const authUrl = new URL('https://github.com/login/oauth/authorize')
  authUrl.searchParams.set('client_id', c.env.GITHUB_CLIENT_ID)
  authUrl.searchParams.set('redirect_uri', `${c.env.API_URL}/auth/github/link/callback`)
  authUrl.searchParams.set('scope', 'read:user user:email')
  authUrl.searchParams.set('state', state)

  return c.json({ url: authUrl.toString() })
})

// Link callback
githubLink.get('/link/callback', async (c) => {
  const code = c.req.query('code')
  const state = c.req.query('state')

  if (!code || !state) {
    return c.redirect('/settings?error=invalid_request')
  }

  // Verify state
  const userId = await c.env.KV.get(`github_link:${state}`)
  if (!userId) {
    return c.redirect('/settings?error=invalid_state')
  }

  // Clean up state
  await c.env.KV.delete(`github_link:${state}`)

  try {
    // Exchange code for token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        client_id: c.env.GITHUB_CLIENT_ID,
        client_secret: c.env.GITHUB_CLIENT_SECRET,
        code,
      }),
    })

    const tokens = await tokenResponse.json()

    // Get GitHub user info
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    })

    const githubUser = await userResponse.json()

    // Link account
    await c.env.DB.prepare(`
      INSERT INTO accounts (id, user_id, provider, provider_account_id, access_token)
      VALUES (?, ?, 'github', ?, ?)
    `).bind(
      crypto.randomUUID(),
      userId,
      githubUser.id.toString(),
      tokens.access_token
    ).run()

    return c.redirect('/settings?success=github_linked')
  } catch (error) {
    console.error('GitHub link error:', error)
    return c.redirect('/settings?error=link_failed')
  }
})

// Unlink GitHub
githubLink.delete('/unlink', authMiddleware, async (c) => {
  const user = c.get('user')

  // Check if user has password (can't unlink if only auth method)
  const userRecord = await c.env.DB.prepare(
    'SELECT password_hash FROM users WHERE id = ?'
  ).bind(user.id).first()

  if (!userRecord?.password_hash) {
    return c.json(
      { error: 'Cannot unlink GitHub - it is your only login method. Set a password first.' },
      400
    )
  }

  await c.env.DB.prepare(
    'DELETE FROM accounts WHERE user_id = ? AND provider = ?'
  ).bind(user.id, 'github').run()

  return c.json({ success: true })
})

export default githubLink
```

### 4. Environment Variables Required

```bash
# .env
GITHUB_CLIENT_ID=your_github_oauth_app_client_id
GITHUB_CLIENT_SECRET=your_github_oauth_app_client_secret
```

## Files to Create

1. `packages/api/src/routes/auth/github.ts` - OAuth flow
2. `packages/api/src/routes/auth/github-link.ts` - Link/unlink
3. Update `packages/api/src/lib/auth.ts` with GitHub plugin

## Tests Required

```typescript
// packages/api/src/routes/auth/__tests__/github.test.ts
describe('GitHub OAuth', () => {
  it('redirects to GitHub authorize URL', async () => {
    const response = await app.request('/auth/github/authorize')
    expect(response.status).toBe(302)
    expect(response.headers.get('Location')).toContain('github.com/login/oauth')
  })

  it('handles callback with valid code', async () => {
    // Mock GitHub token exchange
    const response = await app.request('/auth/github/callback?code=test&state=valid')
    expect(response.status).toBe(302)
  })
})
```

## Acceptance Criteria

- [ ] GitHub OAuth login works
- [ ] GitHub OAuth signup works (creates new user)
- [ ] Existing users can link GitHub
- [ ] Users can unlink GitHub (if they have password)
- [ ] State parameter prevents CSRF
- [ ] Errors redirect with query params
- [ ] Tests pass
