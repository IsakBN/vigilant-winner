# Feature: api/crash-integrations

Implement crash reporter integrations (Sentry, Bugsnag, Crashlytics).

## Knowledge Docs to Read First

- `.claude/knowledge/IMPLEMENTATION_DETAILS.md` → Encryption for tokens
- `.claude/knowledge/API_FEATURES.md` → Integration endpoints

## Dependencies

- `api/apps-crud` (must complete first)
- `shared/constants` (for encryption)

## What to Implement

### 1. Integration CRUD

```typescript
// packages/api/src/routes/integrations/index.ts
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { authMiddleware } from '../../middleware/auth'
import { encrypt, decrypt } from '../../lib/encryption'
import { z } from 'zod'

const integrations = new Hono()

integrations.use('*', authMiddleware)

const createIntegrationSchema = z.object({
  provider: z.enum(['sentry', 'bugsnag', 'crashlytics', 'slack', 'discord']),
  config: z.record(z.string()),
})

// List integrations for app
integrations.get('/:appId/integrations', async (c) => {
  const user = c.get('user')
  const appId = c.req.param('appId')

  const app = await verifyAppOwnership(c.env.DB, appId, user.id)
  if (!app) {
    return c.json({ error: 'NOT_FOUND' }, 404)
  }

  const results = await c.env.DB.prepare(`
    SELECT id, provider, is_active, created_at
    FROM crash_integrations
    WHERE app_id = ?
    ORDER BY created_at DESC
  `).bind(appId).all()

  return c.json({ integrations: results.results })
})

// Create integration
integrations.post('/:appId/integrations', zValidator('json', createIntegrationSchema), async (c) => {
  const user = c.get('user')
  const appId = c.req.param('appId')
  const data = c.req.valid('json')

  const app = await verifyAppOwnership(c.env.DB, appId, user.id)
  if (!app) {
    return c.json({ error: 'NOT_FOUND' }, 404)
  }

  // Check if integration already exists for this provider
  const existing = await c.env.DB.prepare(
    'SELECT id FROM crash_integrations WHERE app_id = ? AND provider = ?'
  ).bind(appId, data.provider).first()

  if (existing) {
    return c.json(
      { error: 'ALREADY_EXISTS', message: `${data.provider} integration already exists` },
      409
    )
  }

  // Encrypt sensitive config
  const encryptedConfig = await encrypt(
    JSON.stringify(data.config),
    c.env.ENCRYPTION_KEY
  )

  const integrationId = crypto.randomUUID()

  await c.env.DB.prepare(`
    INSERT INTO crash_integrations (id, app_id, provider, config, is_active, created_at)
    VALUES (?, ?, ?, ?, 1, datetime('now'))
  `).bind(integrationId, appId, data.provider, encryptedConfig).run()

  return c.json({
    integration: {
      id: integrationId,
      provider: data.provider,
      is_active: true,
    },
  }, 201)
})

// Update integration
integrations.patch('/:appId/integrations/:integrationId', async (c) => {
  const user = c.get('user')
  const appId = c.req.param('appId')
  const integrationId = c.req.param('integrationId')
  const data = await c.req.json()

  const app = await verifyAppOwnership(c.env.DB, appId, user.id)
  if (!app) {
    return c.json({ error: 'NOT_FOUND' }, 404)
  }

  if (data.config) {
    const encryptedConfig = await encrypt(
      JSON.stringify(data.config),
      c.env.ENCRYPTION_KEY
    )
    await c.env.DB.prepare(
      'UPDATE crash_integrations SET config = ? WHERE id = ? AND app_id = ?'
    ).bind(encryptedConfig, integrationId, appId).run()
  }

  if (data.is_active !== undefined) {
    await c.env.DB.prepare(
      'UPDATE crash_integrations SET is_active = ? WHERE id = ? AND app_id = ?'
    ).bind(data.is_active ? 1 : 0, integrationId, appId).run()
  }

  return c.json({ success: true })
})

// Delete integration
integrations.delete('/:appId/integrations/:integrationId', async (c) => {
  const user = c.get('user')
  const appId = c.req.param('appId')
  const integrationId = c.req.param('integrationId')

  const app = await verifyAppOwnership(c.env.DB, appId, user.id)
  if (!app) {
    return c.json({ error: 'NOT_FOUND' }, 404)
  }

  await c.env.DB.prepare(
    'DELETE FROM crash_integrations WHERE id = ? AND app_id = ?'
  ).bind(integrationId, appId).run()

  return c.json({ success: true })
})

// Test integration
integrations.post('/:appId/integrations/:integrationId/test', async (c) => {
  const user = c.get('user')
  const appId = c.req.param('appId')
  const integrationId = c.req.param('integrationId')

  const app = await verifyAppOwnership(c.env.DB, appId, user.id)
  if (!app) {
    return c.json({ error: 'NOT_FOUND' }, 404)
  }

  const integration = await c.env.DB.prepare(
    'SELECT * FROM crash_integrations WHERE id = ? AND app_id = ?'
  ).bind(integrationId, appId).first()

  if (!integration) {
    return c.json({ error: 'NOT_FOUND' }, 404)
  }

  const config = JSON.parse(
    await decrypt(integration.config as string, c.env.ENCRYPTION_KEY)
  )

  const result = await testIntegration(integration.provider as string, config)

  return c.json(result)
})

export default integrations
```

### 2. Integration Clients

```typescript
// packages/api/src/lib/integrations/sentry.ts
interface SentryConfig {
  dsn: string
  organization: string
  project: string
  authToken: string
}

export async function sendToSentry(config: SentryConfig, release: Release) {
  // Create release in Sentry
  const response = await fetch(
    `https://sentry.io/api/0/organizations/${config.organization}/releases/`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: release.version,
        projects: [config.project],
      }),
    }
  )

  return response.ok
}

export async function testSentry(config: SentryConfig): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(
      `https://sentry.io/api/0/organizations/${config.organization}/`,
      {
        headers: {
          'Authorization': `Bearer ${config.authToken}`,
        },
      }
    )

    if (!response.ok) {
      return { success: false, error: `Sentry API returned ${response.status}` }
    }

    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}
```

```typescript
// packages/api/src/lib/integrations/slack.ts
interface SlackConfig {
  webhookUrl: string
}

export async function sendToSlack(config: SlackConfig, message: SlackMessage) {
  const response = await fetch(config.webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: message.text,
      blocks: message.blocks,
    }),
  })

  return response.ok
}

export async function testSlack(config: SlackConfig): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(config.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: 'Test message from BundleNudge',
      }),
    })

    if (!response.ok) {
      return { success: false, error: `Slack webhook returned ${response.status}` }
    }

    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}
```

```typescript
// packages/api/src/lib/integrations/discord.ts
interface DiscordConfig {
  webhookUrl: string
}

export async function sendToDiscord(config: DiscordConfig, message: DiscordMessage) {
  const response = await fetch(config.webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      content: message.content,
      embeds: message.embeds,
    }),
  })

  return response.ok
}
```

### 3. Integration Dispatcher

```typescript
// packages/api/src/lib/integrations/dispatcher.ts
import { sendToSentry, testSentry } from './sentry'
import { sendToSlack, testSlack } from './slack'
import { sendToDiscord } from './discord'

export async function testIntegration(
  provider: string,
  config: Record<string, string>
): Promise<{ success: boolean; error?: string }> {
  switch (provider) {
    case 'sentry':
      return testSentry(config as SentryConfig)
    case 'slack':
      return testSlack(config as SlackConfig)
    case 'discord':
      return testSlack(config as DiscordConfig) // Discord webhooks work similarly
    case 'bugsnag':
      return testBugsnag(config as BugsnagConfig)
    case 'crashlytics':
      return { success: true } // Crashlytics doesn't have a test endpoint
    default:
      return { success: false, error: 'Unknown provider' }
  }
}

export async function notifyCrash(
  db: D1Database,
  encryptionKey: string,
  appId: string,
  crash: CrashReport
) {
  const integrations = await db.prepare(`
    SELECT * FROM crash_integrations
    WHERE app_id = ? AND is_active = 1
  `).bind(appId).all()

  for (const integration of integrations.results) {
    const config = JSON.parse(
      await decrypt(integration.config as string, encryptionKey)
    )

    try {
      switch (integration.provider) {
        case 'sentry':
          await sendToSentry(config, crash)
          break
        case 'slack':
          await sendToSlack(config, {
            text: `Crash detected in ${crash.appName}`,
            blocks: formatCrashForSlack(crash),
          })
          break
        case 'discord':
          await sendToDiscord(config, {
            content: `Crash detected in ${crash.appName}`,
            embeds: formatCrashForDiscord(crash),
          })
          break
      }
    } catch (error) {
      console.error(`Failed to notify ${integration.provider}:`, error)
    }
  }
}
```

## Files to Create

1. `packages/api/src/routes/integrations/index.ts`
2. `packages/api/src/lib/integrations/sentry.ts`
3. `packages/api/src/lib/integrations/slack.ts`
4. `packages/api/src/lib/integrations/discord.ts`
5. `packages/api/src/lib/integrations/dispatcher.ts`
6. `packages/api/src/lib/integrations/index.ts`

## Tests Required

```typescript
describe('Integrations', () => {
  it('creates a Slack integration', async () => {
    const response = await authedRequest('POST', `/apps/${appId}/integrations`, {
      provider: 'slack',
      config: { webhookUrl: 'https://hooks.slack.com/...' },
    })
    expect(response.status).toBe(201)
  })

  it('encrypts config', async () => {
    const integration = await db.prepare(
      'SELECT config FROM crash_integrations WHERE id = ?'
    ).bind(integrationId).first()

    // Should be encrypted, not plain JSON
    expect(() => JSON.parse(integration.config)).toThrow()
  })

  it('prevents duplicate integrations', async () => {
    await authedRequest('POST', `/apps/${appId}/integrations`, {
      provider: 'slack',
      config: { webhookUrl: 'https://hooks.slack.com/...' },
    })

    const response = await authedRequest('POST', `/apps/${appId}/integrations`, {
      provider: 'slack',
      config: { webhookUrl: 'https://hooks.slack.com/other' },
    })

    expect(response.status).toBe(409)
  })
})
```

## Acceptance Criteria

- [ ] CRUD for integrations
- [ ] Config encrypted at rest
- [ ] Test endpoint works
- [ ] Sentry integration
- [ ] Slack integration
- [ ] Discord integration
- [ ] Crash notifications dispatched
- [ ] Tests pass
