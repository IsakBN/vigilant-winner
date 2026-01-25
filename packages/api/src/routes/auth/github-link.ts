/**
 * GitHub account linking routes
 *
 * Allows authenticated users to link/unlink GitHub accounts
 */

import { Hono } from 'hono'
import { ERROR_CODES } from '@bundlenudge/shared'
import { authMiddleware } from '../../middleware/auth'
import type { Env } from '../../types/env'

const GITHUB_AUTHORIZE_URL = 'https://github.com/login/oauth/authorize'
const GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token'
const GITHUB_USER_API_URL = 'https://api.github.com/user'
const STATE_TTL_SECONDS = 600  // 10 minutes

interface GitHubTokenResponse {
  access_token: string
  token_type: string
  scope: string
  error?: string
  error_description?: string
}

interface GitHubUser {
  id: number
  login: string
  email: string | null
  avatar_url: string
}

export const githubLinkRoutes = new Hono<{ Bindings: Env }>()

/**
 * Initiate GitHub account linking flow
 * Returns URL to redirect user to GitHub OAuth
 */
githubLinkRoutes.post('/link', authMiddleware, async (c) => {
  const user = c.get('user')

  // Generate state token for CSRF protection
  const state = crypto.randomUUID()
  await c.env.RATE_LIMIT.put(`github_link:${state}`, user.id, { expirationTtl: STATE_TTL_SECONDS })

  const authUrl = new URL(GITHUB_AUTHORIZE_URL)
  authUrl.searchParams.set('client_id', c.env.GITHUB_CLIENT_ID)
  authUrl.searchParams.set('redirect_uri', `${c.env.API_URL}/v1/auth/github/link/callback`)
  authUrl.searchParams.set('scope', 'read:user user:email')
  authUrl.searchParams.set('state', state)

  return c.json({ url: authUrl.toString() })
})

/**
 * GitHub OAuth callback for account linking
 */
githubLinkRoutes.get('/link/callback', async (c) => {
  const dashboardUrl = c.env.DASHBOARD_URL

  const code = c.req.query('code')
  const state = c.req.query('state')
  const error = c.req.query('error')

  if (error) {
    return c.redirect(`${dashboardUrl}/settings?error=github_auth_denied`)
  }

  if (!code || !state) {
    return c.redirect(`${dashboardUrl}/settings?error=invalid_request`)
  }

  // Verify state token
  const userId = await c.env.RATE_LIMIT.get(`github_link:${state}`)
  if (!userId) {
    return c.redirect(`${dashboardUrl}/settings?error=invalid_state`)
  }

  // Clean up state
  await c.env.RATE_LIMIT.delete(`github_link:${state}`)

  try {
    // Exchange code for access token
    const tokenResponse = await fetch(GITHUB_TOKEN_URL, {
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

    const tokens: GitHubTokenResponse = await tokenResponse.json()

    if (tokens.error) {
      console.error('GitHub token error:', tokens.error_description ?? 'Unknown error')
      return c.redirect(`${dashboardUrl}/settings?error=token_exchange_failed`)
    }

    // Get GitHub user info
    const userResponse = await fetch(GITHUB_USER_API_URL, {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
        'User-Agent': 'BundleNudge',
      },
    })

    if (!userResponse.ok) {
      return c.redirect(`${dashboardUrl}/settings?error=github_user_fetch_failed`)
    }

    const githubUser: GitHubUser = await userResponse.json()

    // Check if GitHub account is already linked to another user
    const existingLink = await c.env.DB.prepare(
      'SELECT user_id FROM account WHERE provider_id = ? AND account_id = ?'
    ).bind('github', String(githubUser.id)).first<{ user_id: string }>()

    if (existingLink && existingLink.user_id !== userId) {
      return c.redirect(`${dashboardUrl}/settings?error=github_already_linked`)
    }

    // Link GitHub account (upsert)
    await c.env.DB.prepare(`
      INSERT INTO account (id, user_id, account_id, provider_id, access_token, created_at, updated_at)
      VALUES (?, ?, ?, 'github', ?, unixepoch(), unixepoch())
      ON CONFLICT (provider_id, account_id) DO UPDATE SET
        access_token = excluded.access_token,
        updated_at = unixepoch()
    `).bind(
      crypto.randomUUID(),
      userId,
      String(githubUser.id),
      tokens.access_token
    ).run()

    return c.redirect(`${dashboardUrl}/settings?success=github_linked`)
  } catch (err) {
    console.error('GitHub link error:', err)
    return c.redirect(`${dashboardUrl}/settings?error=link_failed`)
  }
})

/**
 * Unlink GitHub account from current user
 */
githubLinkRoutes.delete('/unlink', authMiddleware, async (c) => {
  const user = c.get('user')

  // Check if user has password set (can't unlink if only auth method)
  const passwordAccount = await c.env.DB.prepare(
    'SELECT id FROM account WHERE user_id = ? AND provider_id = ?'
  ).bind(user.id, 'credential').first()

  if (!passwordAccount) {
    return c.json(
      {
        error: ERROR_CODES.INVALID_STATE,
        message: 'Cannot unlink GitHub - set a password first',
      },
      400
    )
  }

  // Delete GitHub link
  await c.env.DB.prepare(
    'DELETE FROM account WHERE user_id = ? AND provider_id = ?'
  ).bind(user.id, 'github').run()

  return c.json({ success: true })
})

/**
 * Get current user's GitHub link status
 */
githubLinkRoutes.get('/status', authMiddleware, async (c) => {
  const user = c.get('user')

  const githubAccount = await c.env.DB.prepare(
    'SELECT account_id FROM account WHERE user_id = ? AND provider_id = ?'
  ).bind(user.id, 'github').first<{ account_id: string }>()

  return c.json({
    linked: !!githubAccount,
    githubId: githubAccount?.account_id ?? null,
  })
})
