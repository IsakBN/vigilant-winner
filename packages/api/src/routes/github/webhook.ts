/**
 * GitHub Webhook Handler
 *
 * Processes GitHub webhook events for:
 * - App installation changes
 * - Push events for automated builds
 * - Repository access updates
 */

import { Hono } from 'hono'
import type { Env } from '../../types/env'
import { verifyGitHubWebhook } from '../../lib/github-webhook'

// =============================================================================
// Types
// =============================================================================

interface InstallationPayload {
  action: 'created' | 'deleted' | 'suspend' | 'unsuspend'
  installation: {
    id: number
    account: {
      login: string
      type: string
    }
  }
  sender: {
    login: string
    id: number
  }
}

interface PushPayload {
  ref: string
  repository: {
    id: number
    name: string
    full_name: string
  }
  commits: {
    id: string
    message: string
    author: {
      name: string
      email: string
    }
  }[]
  sender: {
    login: string
  }
}

interface RepositoriesPayload {
  action: 'added' | 'removed'
  installation: {
    id: number
  }
  repositories_added?: {
    id: number
    name: string
    full_name: string
  }[]
  repositories_removed?: {
    id: number
    name: string
    full_name: string
  }[]
}

// =============================================================================
// Router
// =============================================================================

export const githubWebhookRouter = new Hono<{ Bindings: Env }>()

/**
 * POST /v1/github/webhook
 * Handle incoming GitHub webhook events
 */
githubWebhookRouter.post('/', async (c) => {
  const signature = c.req.header('X-Hub-Signature-256')
  const event = c.req.header('X-GitHub-Event')
  const deliveryId = c.req.header('X-GitHub-Delivery')
  const body = await c.req.text()

  // Verify signature
  const isValid = await verifyGitHubWebhook(body, signature, c.env.GITHUB_WEBHOOK_SECRET)

  if (!isValid) {
    return c.json({ error: 'Invalid signature' }, 401)
  }

  const payload = JSON.parse(body) as unknown

  switch (event) {
    case 'installation':
      await handleInstallation(c.env, payload as InstallationPayload)
      break

    case 'push':
      await handlePush(c.env, payload as PushPayload)
      break

    case 'installation_repositories':
      await handleRepositoriesUpdate(c.env, payload as RepositoriesPayload)
      break

    case 'ping':
      // GitHub sends a ping event when webhook is configured
      return c.json({ received: true, event: 'ping', deliveryId })
  }

  return c.json({ received: true, event, deliveryId })
})

// =============================================================================
// Event Handlers
// =============================================================================

/**
 * Handle installation events (created, deleted, suspended, unsuspended)
 */
async function handleInstallation(env: Env, payload: InstallationPayload): Promise<void> {
  const { action, installation } = payload

  if (action === 'deleted') {
    // Remove installation record
    await env.DB.prepare('DELETE FROM github_installations WHERE installation_id = ?')
      .bind(String(installation.id))
      .run()

    // Remove any linked app repos
    await env.DB.prepare('DELETE FROM app_repos WHERE installation_id = ?')
      .bind(String(installation.id))
      .run()
  }

  if (action === 'suspend') {
    // Mark installation as suspended (could add a status column if needed)
    // For now, just log it
  }
}

/**
 * Handle push events for automated builds
 */
async function handlePush(env: Env, payload: PushPayload): Promise<void> {
  const { repository, ref, commits } = payload

  // Check if this repo is connected to an app
  const appRepo = await env.DB.prepare(`
    SELECT ar.*, a.id as app_id, a.name as app_name
    FROM app_repos ar
    JOIN apps a ON a.id = ar.app_id
    WHERE ar.repo_full_name = ?
  `).bind(repository.full_name).first<{ app_id: string; app_name: string; repo_branch: string }>()

  if (!appRepo) return

  // Check if this is the watched branch
  const branch = appRepo.repo_branch || 'main'
  if (ref !== `refs/heads/${branch}`) return

  // Trigger a build (placeholder - would integrate with build system)
  const latestCommit = commits[0]
  if (latestCommit) {
    await triggerBuild(env, appRepo.app_id, {
      trigger: 'github_push',
      commit: latestCommit.id,
      message: latestCommit.message,
      author: latestCommit.author.name,
    })
  }
}

/**
 * Handle repository access changes
 */
async function handleRepositoriesUpdate(env: Env, payload: RepositoriesPayload): Promise<void> {
  const { action, installation, repositories_removed } = payload

  if (action === 'removed' && repositories_removed) {
    // Remove access to repos that were removed from the installation
    for (const repo of repositories_removed) {
      await env.DB.prepare('DELETE FROM app_repos WHERE repo_full_name = ? AND installation_id = ?')
        .bind(repo.full_name, String(installation.id))
        .run()
    }
  }

  // Note: 'added' doesn't require any action as repos are linked explicitly
}

// =============================================================================
// Build Trigger
// =============================================================================

interface BuildTriggerData {
  trigger: string
  commit: string
  message: string
  author: string
}

/**
 * Trigger a build for an app
 * This is a placeholder that would integrate with the build system
 */
async function triggerBuild(env: Env, appId: string, data: BuildTriggerData): Promise<void> {
  // Log the build trigger for now
  // In a full implementation, this would:
  // 1. Create a build record in the database
  // 2. Queue the build job
  // 3. Notify relevant webhooks

  const buildId = crypto.randomUUID()
  const now = Math.floor(Date.now() / 1000)

  // Store a simple build record (this would be expanded with a builds table)
  await env.DB.prepare(`
    INSERT INTO telemetry_events (id, device_id, app_id, event_type, metadata, timestamp, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind(
    buildId,
    'github-webhook',
    appId,
    'build_triggered',
    JSON.stringify(data),
    now,
    now
  ).run()
}
