# Feature: api/webhooks-outgoing

Implement outgoing webhooks to notify external services.

## Knowledge Docs to Read First

- `.claude/knowledge/IMPLEMENTATION_DETAILS.md` → Webhook payloads
- `.claude/knowledge/API_FEATURES.md` → Webhook endpoints

## Dependencies

- `api/apps-crud` (must complete first)
- `shared/constants` (for event types)

## What to Implement

### 1. Webhook CRUD

```typescript
// packages/api/src/routes/webhooks/index.ts
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { authMiddleware } from '../../middleware/auth'
import { createWebhookSchema } from '@bundlenudge/shared'
import { nanoid } from 'nanoid'

const webhooks = new Hono()

webhooks.use('*', authMiddleware)

// List webhooks for app
webhooks.get('/:appId/webhooks', async (c) => {
  const user = c.get('user')
  const appId = c.req.param('appId')

  const app = await verifyAppOwnership(c.env.DB, appId, user.id)
  if (!app) {
    return c.json({ error: 'NOT_FOUND' }, 404)
  }

  const results = await c.env.DB.prepare(`
    SELECT id, url, events, is_active, created_at, last_triggered_at
    FROM webhooks
    WHERE app_id = ?
    ORDER BY created_at DESC
  `).bind(appId).all()

  return c.json({
    webhooks: results.results.map(w => ({
      ...w,
      events: JSON.parse(w.events as string),
    })),
  })
})

// Create webhook
webhooks.post('/:appId/webhooks', zValidator('json', createWebhookSchema), async (c) => {
  const user = c.get('user')
  const appId = c.req.param('appId')
  const data = c.req.valid('json')

  const app = await verifyAppOwnership(c.env.DB, appId, user.id)
  if (!app) {
    return c.json({ error: 'NOT_FOUND' }, 404)
  }

  // Generate secret if not provided
  const secret = data.secret || `whsec_${nanoid(32)}`

  const webhookId = crypto.randomUUID()

  await c.env.DB.prepare(`
    INSERT INTO webhooks (id, app_id, url, events, secret, is_active, created_at)
    VALUES (?, ?, ?, ?, ?, 1, datetime('now'))
  `).bind(
    webhookId,
    appId,
    data.url,
    JSON.stringify(data.events),
    secret
  ).run()

  const webhook = await c.env.DB.prepare(
    'SELECT * FROM webhooks WHERE id = ?'
  ).bind(webhookId).first()

  return c.json({
    webhook: {
      ...webhook,
      events: JSON.parse(webhook.events as string),
      secret, // Only return secret on creation
    },
  }, 201)
})

// Delete webhook
webhooks.delete('/:appId/webhooks/:webhookId', async (c) => {
  const user = c.get('user')
  const appId = c.req.param('appId')
  const webhookId = c.req.param('webhookId')

  const app = await verifyAppOwnership(c.env.DB, appId, user.id)
  if (!app) {
    return c.json({ error: 'NOT_FOUND' }, 404)
  }

  await c.env.DB.prepare(
    'DELETE FROM webhooks WHERE id = ? AND app_id = ?'
  ).bind(webhookId, appId).run()

  return c.json({ success: true })
})

// Test webhook
webhooks.post('/:appId/webhooks/:webhookId/test', async (c) => {
  const user = c.get('user')
  const appId = c.req.param('appId')
  const webhookId = c.req.param('webhookId')

  const app = await verifyAppOwnership(c.env.DB, appId, user.id)
  if (!app) {
    return c.json({ error: 'NOT_FOUND' }, 404)
  }

  const webhook = await c.env.DB.prepare(
    'SELECT * FROM webhooks WHERE id = ? AND app_id = ?'
  ).bind(webhookId, appId).first()

  if (!webhook) {
    return c.json({ error: 'NOT_FOUND' }, 404)
  }

  const testPayload = {
    event: 'test',
    timestamp: new Date().toISOString(),
    data: {
      message: 'This is a test webhook from BundleNudge',
      app_id: appId,
    },
  }

  const result = await sendWebhook(webhook.url, webhook.secret, testPayload)

  return c.json({
    success: result.success,
    statusCode: result.statusCode,
    error: result.error,
  })
})

export default webhooks
```

### 2. Webhook Delivery

```typescript
// packages/api/src/lib/webhooks.ts
import { createHmac } from 'node:crypto'

interface WebhookPayload {
  event: string
  timestamp: string
  data: Record<string, unknown>
}

interface WebhookResult {
  success: boolean
  statusCode?: number
  error?: string
}

export async function sendWebhook(
  url: string,
  secret: string,
  payload: WebhookPayload
): Promise<WebhookResult> {
  const body = JSON.stringify(payload)
  const timestamp = Math.floor(Date.now() / 1000)

  // Generate signature
  const signatureData = `${timestamp}.${body}`
  const signature = createHmac('sha256', secret)
    .update(signatureData)
    .digest('hex')

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-BundleNudge-Signature': `t=${timestamp},v1=${signature}`,
        'X-BundleNudge-Event': payload.event,
      },
      body,
      signal: AbortSignal.timeout(10000), // 10 second timeout
    })

    return {
      success: response.ok,
      statusCode: response.status,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// Trigger webhooks for an event
export async function triggerWebhook(
  env: Env,
  appId: string,
  event: string,
  data: Record<string, unknown>
) {
  const webhooks = await env.DB.prepare(`
    SELECT * FROM webhooks
    WHERE app_id = ? AND is_active = 1 AND events LIKE ?
  `).bind(appId, `%${event}%`).all()

  const payload: WebhookPayload = {
    event,
    timestamp: new Date().toISOString(),
    data,
  }

  const results = await Promise.allSettled(
    webhooks.results.map(async (webhook) => {
      const events = JSON.parse(webhook.events as string)
      if (!events.includes(event)) return null

      const result = await sendWebhookWithRetry(webhook.url, webhook.secret, payload)

      // Log delivery
      await env.DB.prepare(`
        INSERT INTO webhook_events (id, webhook_id, event, payload, status, created_at)
        VALUES (?, ?, ?, ?, ?, datetime('now'))
      `).bind(
        crypto.randomUUID(),
        webhook.id,
        event,
        JSON.stringify(payload),
        result.success ? 'delivered' : 'failed'
      ).run()

      // Update last triggered
      await env.DB.prepare(
        'UPDATE webhooks SET last_triggered_at = datetime("now") WHERE id = ?'
      ).bind(webhook.id).run()

      return result
    })
  )

  return results
}

// Retry logic
async function sendWebhookWithRetry(
  url: string,
  secret: string,
  payload: WebhookPayload,
  maxRetries = 3
): Promise<WebhookResult> {
  const delays = [1000, 5000, 30000] // 1s, 5s, 30s

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const result = await sendWebhook(url, secret, payload)

    if (result.success) {
      return result
    }

    // Don't retry client errors (4xx)
    if (result.statusCode && result.statusCode >= 400 && result.statusCode < 500) {
      return result
    }

    // Wait before retry
    if (attempt < maxRetries - 1) {
      await new Promise(resolve => setTimeout(resolve, delays[attempt]))
    }
  }

  return { success: false, error: 'Max retries exceeded' }
}
```

### 3. Webhook Events Table

```sql
-- Add to schema
CREATE TABLE webhook_events (
  id TEXT PRIMARY KEY,
  webhook_id TEXT NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
  event TEXT NOT NULL,
  payload TEXT NOT NULL,
  status TEXT NOT NULL, -- 'delivered', 'failed'
  created_at DATETIME NOT NULL
);

CREATE INDEX idx_webhook_events_webhook ON webhook_events(webhook_id);
```

## Files to Create

1. `packages/api/src/routes/webhooks/index.ts`
2. `packages/api/src/lib/webhooks.ts`
3. Add `webhook_events` table to schema

## Tests Required

```typescript
describe('Webhooks', () => {
  it('creates a webhook', async () => {
    const response = await authedRequest('POST', `/apps/${appId}/webhooks`, {
      url: 'https://example.com/webhook',
      events: ['release.created'],
    })
    expect(response.status).toBe(201)
    expect(response.body.webhook.secret).toBeDefined()
  })

  it('sends webhook on release created', async () => {
    // Setup mock webhook endpoint
    const calls: unknown[] = []
    mockFetch.mockImplementation(async (url, options) => {
      calls.push({ url, body: JSON.parse(options.body) })
      return new Response('OK', { status: 200 })
    })

    await authedRequest('POST', `/apps/${appId}/releases`, { version: '1.0.0' })

    expect(calls).toHaveLength(1)
    expect(calls[0].body.event).toBe('release.created')
  })

  it('verifies signature', async () => {
    // Test signature verification
    const secret = 'whsec_test123'
    const payload = { event: 'test', timestamp: new Date().toISOString(), data: {} }
    const body = JSON.stringify(payload)
    const timestamp = Math.floor(Date.now() / 1000)

    const expected = createHmac('sha256', secret)
      .update(`${timestamp}.${body}`)
      .digest('hex')

    const signature = `t=${timestamp},v1=${expected}`

    expect(verifySignature(signature, body, secret)).toBe(true)
  })
})
```

## Acceptance Criteria

- [ ] CRUD for webhooks
- [ ] Signature generation with HMAC-SHA256
- [ ] Retry logic (3 attempts with backoff)
- [ ] Test endpoint works
- [ ] Event logging
- [ ] 10 second timeout
- [ ] Tests pass
