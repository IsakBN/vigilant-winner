/**
 * GitHub App Integration Routes
 *
 * Handles GitHub App installation, repo listing, and content browsing.
 */

import { Hono } from 'hono'
import { ERROR_CODES } from '@bundlenudge/shared'
import { authMiddleware, type AuthUser } from '../../middleware/auth'
import type { Env } from '../../types/env'
import { createGitHubApp } from '../../lib/github-app'

// =============================================================================
// Types
// =============================================================================

interface GitHubInstallationRow {
  id: string
  user_id: string
  installation_id: string
  account_type: string | null
  account_login: string | null
  created_at: number
  updated_at: number
}

interface AuthVariables {
  user: AuthUser
}

// =============================================================================
// Router
// =============================================================================

export const githubRouter = new Hono<{ Bindings: Env; Variables: AuthVariables }>()

githubRouter.use('*', authMiddleware)

/**
 * GET /v1/github/install
 * Get the GitHub App installation URL
 */
githubRouter.get('/install', (c) => {
  const appName = c.env.GITHUB_APP_NAME
  const installUrl = `https://github.com/apps/${appName}/installations/new`

  return c.json({ url: installUrl })
})

/**
 * GET /v1/github/callback
 * Handle GitHub App installation callback
 */
githubRouter.get('/callback', async (c) => {
  const user = c.get('user')
  const installationId = c.req.query('installation_id')
  const setupAction = c.req.query('setup_action')

  // Handle installation deletion
  if (setupAction === 'delete') {
    await c.env.DB.prepare('DELETE FROM github_installations WHERE user_id = ?')
      .bind(user.id)
      .run()
    return c.redirect(`${c.env.DASHBOARD_URL}?github_disconnected=true`)
  }

  if (!installationId) {
    return c.redirect(`${c.env.DASHBOARD_URL}?error=github_install_failed`)
  }

  const now = Math.floor(Date.now() / 1000)
  const id = crypto.randomUUID()

  // Upsert installation record
  await c.env.DB.prepare(`
    INSERT INTO github_installations (id, user_id, installation_id, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT (user_id) DO UPDATE SET
      installation_id = excluded.installation_id,
      updated_at = excluded.updated_at
  `).bind(id, user.id, installationId, now, now).run()

  return c.redirect(`${c.env.DASHBOARD_URL}?github_connected=true`)
})

/**
 * GET /v1/github/status
 * Check GitHub App connection status
 */
githubRouter.get('/status', async (c) => {
  const user = c.get('user')

  const installation = await c.env.DB.prepare(
    'SELECT installation_id, account_login, account_type FROM github_installations WHERE user_id = ?'
  ).bind(user.id).first<GitHubInstallationRow>()

  if (!installation) {
    return c.json({ connected: false })
  }

  return c.json({
    connected: true,
    installationId: installation.installation_id,
    accountLogin: installation.account_login,
    accountType: installation.account_type,
  })
})

/**
 * DELETE /v1/github/disconnect
 * Disconnect GitHub App
 */
githubRouter.delete('/disconnect', async (c) => {
  const user = c.get('user')

  const result = await c.env.DB.prepare('DELETE FROM github_installations WHERE user_id = ?')
    .bind(user.id)
    .run()

  if (!result.meta.changes) {
    return c.json({ error: ERROR_CODES.NOT_FOUND, message: 'Not connected to GitHub' }, 404)
  }

  return c.json({ success: true })
})

/**
 * GET /v1/github/repos
 * List repositories accessible to the user's GitHub App installation
 */
githubRouter.get('/repos', async (c) => {
  const user = c.get('user')

  const installation = await c.env.DB.prepare(
    'SELECT installation_id FROM github_installations WHERE user_id = ?'
  ).bind(user.id).first<GitHubInstallationRow>()

  if (!installation) {
    return c.json({ error: 'NOT_CONNECTED', message: 'GitHub App not installed' }, 400)
  }

  try {
    const app = createGitHubApp(c.env)
    const repos = await app.listInstallationRepos(parseInt(installation.installation_id))

    return c.json({ repos })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch repos'
    return c.json({ error: 'GITHUB_ERROR', message }, 500)
  }
})

/**
 * GET /v1/github/repos/:owner/:repo/contents/*
 * Get contents of a path in a repository
 */
githubRouter.get('/repos/:owner/:repo/contents/*', async (c) => {
  const user = c.get('user')
  const owner = c.req.param('owner')
  const repo = c.req.param('repo')
  const path = c.req.param('*') ?? ''

  const installation = await c.env.DB.prepare(
    'SELECT installation_id FROM github_installations WHERE user_id = ?'
  ).bind(user.id).first<GitHubInstallationRow>()

  if (!installation) {
    return c.json({ error: 'NOT_CONNECTED', message: 'GitHub App not installed' }, 400)
  }

  try {
    const app = createGitHubApp(c.env)
    const contents = await app.getRepoContents(
      parseInt(installation.installation_id),
      owner,
      repo,
      path
    )

    if (Array.isArray(contents)) {
      return c.json({ type: 'directory', contents })
    }

    return c.json({
      type: 'file',
      name: contents.name,
      path: contents.path,
      content: contents.content,
      size: contents.size,
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'NOT_FOUND') {
      return c.json({ error: 'NOT_FOUND', message: 'Path not found' }, 404)
    }
    const message = error instanceof Error ? error.message : 'Failed to fetch contents'
    return c.json({ error: 'GITHUB_ERROR', message }, 500)
  }
})
