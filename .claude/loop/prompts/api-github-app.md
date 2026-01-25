# Feature: api/github-app

Implement GitHub App integration for repo access and webhooks.

## Knowledge Docs to Read First

- `.claude/knowledge/IMPLEMENTATION_DETAILS.md` → GitHub App setup
- `.claude/knowledge/API_FEATURES.md` → GitHub endpoints

## Dependencies

- `api/auth-middleware` (must complete first)
- `api/apps-crud` (must complete first)

## What to Implement

### 1. GitHub App Installation

```typescript
// packages/api/src/routes/github/index.ts
import { Hono } from 'hono'
import { authMiddleware } from '../../middleware/auth'
import { createGitHubApp } from '../../lib/github-app'

const github = new Hono()

github.use('*', authMiddleware)

// Get installation URL
github.get('/install', async (c) => {
  const installUrl = `https://github.com/apps/${c.env.GITHUB_APP_NAME}/installations/new`
  return c.json({ url: installUrl })
})

// Handle installation callback
github.get('/callback', async (c) => {
  const user = c.get('user')
  const installationId = c.req.query('installation_id')

  if (!installationId) {
    return c.redirect('/dashboard?error=github_install_failed')
  }

  // Store installation
  await c.env.DB.prepare(`
    INSERT INTO github_installations (id, user_id, installation_id, created_at)
    VALUES (?, ?, ?, datetime('now'))
    ON CONFLICT (user_id) DO UPDATE SET installation_id = ?
  `).bind(crypto.randomUUID(), user.id, installationId, installationId).run()

  return c.redirect('/dashboard?success=github_connected')
})

// List repos from installation
github.get('/repos', async (c) => {
  const user = c.get('user')

  const installation = await c.env.DB.prepare(
    'SELECT installation_id FROM github_installations WHERE user_id = ?'
  ).bind(user.id).first()

  if (!installation) {
    return c.json({ error: 'NOT_CONNECTED', message: 'GitHub App not installed' }, 400)
  }

  const app = createGitHubApp(c.env)
  const octokit = await app.getInstallationOctokit(parseInt(installation.installation_id))

  const { data } = await octokit.rest.apps.listReposAccessibleToInstallation({
    per_page: 100,
  })

  return c.json({
    repos: data.repositories.map(repo => ({
      id: repo.id,
      name: repo.name,
      fullName: repo.full_name,
      private: repo.private,
      defaultBranch: repo.default_branch,
    })),
  })
})

// List contents of a repo path
github.get('/repos/:owner/:repo/contents/*', async (c) => {
  const user = c.get('user')
  const owner = c.req.param('owner')
  const repo = c.req.param('repo')
  const path = c.req.param('*') || ''

  const installation = await c.env.DB.prepare(
    'SELECT installation_id FROM github_installations WHERE user_id = ?'
  ).bind(user.id).first()

  if (!installation) {
    return c.json({ error: 'NOT_CONNECTED' }, 400)
  }

  const app = createGitHubApp(c.env)
  const octokit = await app.getInstallationOctokit(parseInt(installation.installation_id))

  try {
    const { data } = await octokit.rest.repos.getContent({
      owner,
      repo,
      path,
    })

    if (Array.isArray(data)) {
      return c.json({
        type: 'directory',
        contents: data.map(item => ({
          name: item.name,
          type: item.type,
          path: item.path,
        })),
      })
    }

    return c.json({
      type: 'file',
      name: data.name,
      content: Buffer.from(data.content, 'base64').toString('utf-8'),
    })
  } catch (error) {
    return c.json({ error: 'NOT_FOUND', message: 'Path not found' }, 404)
  }
})

export default github
```

### 2. GitHub App Client

```typescript
// packages/api/src/lib/github-app.ts
import { App } from '@octokit/app'

export function createGitHubApp(env: Env) {
  return new App({
    appId: env.GITHUB_APP_ID,
    privateKey: env.GITHUB_PRIVATE_KEY,
    webhooks: {
      secret: env.GITHUB_WEBHOOK_SECRET,
    },
  })
}

export async function getInstallationToken(env: Env, installationId: number): Promise<string> {
  const app = createGitHubApp(env)
  const { token } = await app.getInstallationAccessToken({
    installationId,
  })
  return token
}
```

### 3. GitHub Webhook Handler

```typescript
// packages/api/src/routes/github/webhook.ts
import { Hono } from 'hono'
import { createGitHubApp } from '../../lib/github-app'
import { verifyGitHubWebhook } from '../../lib/github-webhook'

const webhook = new Hono()

webhook.post('/', async (c) => {
  const signature = c.req.header('X-Hub-Signature-256')
  const event = c.req.header('X-GitHub-Event')
  const body = await c.req.text()

  // Verify signature
  const isValid = await verifyGitHubWebhook(body, signature, c.env.GITHUB_WEBHOOK_SECRET)

  if (!isValid) {
    return c.json({ error: 'Invalid signature' }, 401)
  }

  const payload = JSON.parse(body)

  switch (event) {
    case 'installation':
      await handleInstallation(c.env, payload)
      break

    case 'push':
      await handlePush(c.env, payload)
      break

    case 'installation_repositories':
      await handleRepositoriesUpdate(c.env, payload)
      break
  }

  return c.json({ received: true })
})

async function handleInstallation(env: Env, payload: InstallationPayload) {
  const { action, installation } = payload

  if (action === 'deleted') {
    // Remove installation from database
    await env.DB.prepare(
      'DELETE FROM github_installations WHERE installation_id = ?'
    ).bind(installation.id).run()
  }
}

async function handlePush(env: Env, payload: PushPayload) {
  const { repository, ref, commits } = payload

  // Check if this repo is connected to an app
  const app = await env.DB.prepare(`
    SELECT a.* FROM apps a
    JOIN app_repos ar ON ar.app_id = a.id
    WHERE ar.repo_full_name = ?
  `).bind(repository.full_name).first()

  if (!app) return

  // Check if this is the watched branch
  if (ref !== `refs/heads/${app.repo_branch}`) return

  // Trigger a build
  await triggerBuild(env, app.id, {
    trigger: 'github_push',
    commit: commits[0]?.id || 'unknown',
    message: commits[0]?.message || '',
    author: commits[0]?.author?.name || 'unknown',
  })
}

export default webhook
```

### 4. Webhook Verification

```typescript
// packages/api/src/lib/github-webhook.ts
export async function verifyGitHubWebhook(
  payload: string,
  signature: string | undefined,
  secret: string
): Promise<boolean> {
  if (!signature) return false

  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )

  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(payload))
  const expected = `sha256=${Array.from(new Uint8Array(sig))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')}`

  return signature === expected
}
```

## Files to Create

1. `packages/api/src/routes/github/index.ts`
2. `packages/api/src/routes/github/webhook.ts`
3. `packages/api/src/lib/github-app.ts`
4. `packages/api/src/lib/github-webhook.ts`

## Tests Required

```typescript
describe('GitHub App', () => {
  it('returns installation URL', async () => {
    const response = await authedRequest('GET', '/github/install')
    expect(response.body.url).toContain('github.com/apps/')
  })

  it('lists repos after installation', async () => {
    // Mock octokit
    mockOctokit.rest.apps.listReposAccessibleToInstallation.mockResolvedValue({
      data: { repositories: [{ id: 1, name: 'test-repo', full_name: 'user/test-repo' }] },
    })

    const response = await authedRequest('GET', '/github/repos')
    expect(response.body.repos).toHaveLength(1)
  })

  it('verifies webhook signature', async () => {
    const secret = 'test-secret'
    const payload = '{"action":"push"}'
    const isValid = await verifyGitHubWebhook(payload, signature, secret)
    expect(isValid).toBe(true)
  })

  it('rejects invalid signature', async () => {
    const isValid = await verifyGitHubWebhook('payload', 'sha256=invalid', 'secret')
    expect(isValid).toBe(false)
  })
})
```

## Acceptance Criteria

- [ ] Installation flow works
- [ ] Repo listing works
- [ ] File/folder browsing works
- [ ] Webhook signature verified
- [ ] Push webhook triggers build
- [ ] Installation deletion handled
- [ ] Tests pass
