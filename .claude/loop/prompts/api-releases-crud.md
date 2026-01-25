# Feature: api/releases-crud

Implement release management with rollout controls.

## Knowledge Docs to Read First

- `.claude/knowledge/API_FEATURES.md` → Releases endpoints
- `.claude/knowledge/IMPLEMENTATION_DETAILS.md` → Bundle storage, hash verification

## Dependencies

- `api/apps-crud` (must complete first)
- `api/database-schema` (must complete first)

## What to Implement

### 1. Releases Router

```typescript
// packages/api/src/routes/releases/index.ts
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { authMiddleware } from '../../middleware/auth'
import { createReleaseSchema, updateRolloutSchema } from '@bundlenudge/shared'

const releases = new Hono()

releases.use('*', authMiddleware)

// List releases for app
releases.get('/:appId/releases', async (c) => {
  const user = c.get('user')
  const appId = c.req.param('appId')

  const app = await verifyAppOwnership(c.env.DB, appId, user.id)
  if (!app) {
    return c.json({ error: 'NOT_FOUND' }, 404)
  }

  const results = await c.env.DB.prepare(`
    SELECT
      r.*,
      (SELECT COUNT(*) FROM device_events WHERE release_id = r.id AND event = 'download') as downloads,
      (SELECT COUNT(*) FROM device_events WHERE release_id = r.id AND event = 'apply') as installs,
      (SELECT COUNT(*) FROM device_events WHERE release_id = r.id AND event = 'rollback') as rollbacks
    FROM releases r
    WHERE r.app_id = ?
    ORDER BY r.created_at DESC
    LIMIT 50
  `).bind(appId).all()

  return c.json({ releases: results.results })
})

// Get single release
releases.get('/:appId/releases/:releaseId', async (c) => {
  const user = c.get('user')
  const appId = c.req.param('appId')
  const releaseId = c.req.param('releaseId')

  const app = await verifyAppOwnership(c.env.DB, appId, user.id)
  if (!app) {
    return c.json({ error: 'NOT_FOUND' }, 404)
  }

  const release = await c.env.DB.prepare(`
    SELECT
      r.*,
      (SELECT COUNT(*) FROM device_events WHERE release_id = r.id AND event = 'download') as downloads,
      (SELECT COUNT(*) FROM device_events WHERE release_id = r.id AND event = 'apply') as installs,
      (SELECT COUNT(*) FROM device_events WHERE release_id = r.id AND event = 'rollback') as rollbacks
    FROM releases r
    WHERE r.id = ? AND r.app_id = ?
  `).bind(releaseId, appId).first()

  if (!release) {
    return c.json({ error: 'NOT_FOUND', message: 'Release not found' }, 404)
  }

  return c.json({ release })
})

// Create release (receives bundle upload)
releases.post('/:appId/releases', zValidator('json', createReleaseSchema), async (c) => {
  const user = c.get('user')
  const appId = c.req.param('appId')
  const data = c.req.valid('json')

  const app = await verifyAppOwnership(c.env.DB, appId, user.id)
  if (!app) {
    return c.json({ error: 'NOT_FOUND' }, 404)
  }

  // Check version doesn't already exist
  const existing = await c.env.DB.prepare(
    'SELECT id FROM releases WHERE app_id = ? AND version = ? AND channel = ?'
  ).bind(appId, data.version, data.channel).first()

  if (existing) {
    return c.json(
      { error: 'ALREADY_EXISTS', message: 'Version already exists for this channel' },
      409
    )
  }

  const releaseId = crypto.randomUUID()

  await c.env.DB.prepare(`
    INSERT INTO releases (
      id, app_id, version, channel, description,
      target_versions, rollout_percentage, is_mandatory,
      is_disabled, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, datetime('now'), datetime('now'))
  `).bind(
    releaseId,
    appId,
    data.version,
    data.channel,
    data.description || null,
    JSON.stringify(data.targetVersions || []),
    data.rolloutPercentage,
    data.isMandatory ? 1 : 0
  ).run()

  const release = await c.env.DB.prepare(
    'SELECT * FROM releases WHERE id = ?'
  ).bind(releaseId).first()

  // Trigger webhooks
  await triggerWebhook(c.env, appId, 'release.created', { release })

  return c.json({ release }, 201)
})

// Upload bundle for release
releases.put('/:appId/releases/:releaseId/bundle', async (c) => {
  const user = c.get('user')
  const appId = c.req.param('appId')
  const releaseId = c.req.param('releaseId')

  const app = await verifyAppOwnership(c.env.DB, appId, user.id)
  if (!app) {
    return c.json({ error: 'NOT_FOUND' }, 404)
  }

  const release = await c.env.DB.prepare(
    'SELECT * FROM releases WHERE id = ? AND app_id = ?'
  ).bind(releaseId, appId).first()

  if (!release) {
    return c.json({ error: 'NOT_FOUND' }, 404)
  }

  // Get bundle from request body
  const bundle = await c.req.arrayBuffer()
  const bundleContent = new Uint8Array(bundle)

  // Calculate hash
  const hashBuffer = await crypto.subtle.digest('SHA-256', bundleContent)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const bundleHash = `sha256:${hashArray.map(b => b.toString(16).padStart(2, '0')).join('')}`

  // Store in R2
  const key = `${appId}/${releaseId}/bundle.js`
  await c.env.BUNDLES.put(key, bundleContent, {
    customMetadata: {
      version: release.version,
      hash: bundleHash,
    },
  })

  // Update release with bundle info
  await c.env.DB.prepare(`
    UPDATE releases SET
      bundle_url = ?,
      bundle_hash = ?,
      bundle_size = ?,
      updated_at = datetime('now')
    WHERE id = ?
  `).bind(
    `${c.env.API_URL}/bundles/${key}`,
    bundleHash,
    bundleContent.length,
    releaseId
  ).run()

  return c.json({
    bundleUrl: `${c.env.API_URL}/bundles/${key}`,
    bundleHash,
    bundleSize: bundleContent.length,
  })
})

// Update rollout percentage
releases.patch('/:appId/releases/:releaseId/rollout',
  zValidator('json', updateRolloutSchema),
  async (c) => {
    const user = c.get('user')
    const appId = c.req.param('appId')
    const releaseId = c.req.param('releaseId')
    const data = c.req.valid('json')

    const app = await verifyAppOwnership(c.env.DB, appId, user.id)
    if (!app) {
      return c.json({ error: 'NOT_FOUND' }, 404)
    }

    await c.env.DB.prepare(`
      UPDATE releases SET
        rollout_percentage = ?,
        updated_at = datetime('now')
      WHERE id = ? AND app_id = ?
    `).bind(data.rolloutPercentage, releaseId, appId).run()

    const release = await c.env.DB.prepare(
      'SELECT * FROM releases WHERE id = ?'
    ).bind(releaseId).first()

    // Trigger webhooks
    await triggerWebhook(c.env, appId, 'release.updated', { release })

    return c.json({ release })
  }
)

// Disable release
releases.post('/:appId/releases/:releaseId/disable', async (c) => {
  const user = c.get('user')
  const appId = c.req.param('appId')
  const releaseId = c.req.param('releaseId')

  const app = await verifyAppOwnership(c.env.DB, appId, user.id)
  if (!app) {
    return c.json({ error: 'NOT_FOUND' }, 404)
  }

  await c.env.DB.prepare(`
    UPDATE releases SET
      is_disabled = 1,
      updated_at = datetime('now')
    WHERE id = ? AND app_id = ?
  `).bind(releaseId, appId).run()

  const release = await c.env.DB.prepare(
    'SELECT * FROM releases WHERE id = ?'
  ).bind(releaseId).first()

  // Trigger webhooks
  await triggerWebhook(c.env, appId, 'release.disabled', { release })

  return c.json({ release })
})

export default releases
```

### 2. Bundle Serving

```typescript
// packages/api/src/routes/bundles.ts
import { Hono } from 'hono'

const bundles = new Hono()

// Serve bundles from R2 (public, no auth)
bundles.get('/:appId/:releaseId/bundle.js', async (c) => {
  const appId = c.req.param('appId')
  const releaseId = c.req.param('releaseId')
  const key = `${appId}/${releaseId}/bundle.js`

  const object = await c.env.BUNDLES.get(key)

  if (!object) {
    return c.json({ error: 'NOT_FOUND' }, 404)
  }

  c.header('Content-Type', 'application/javascript')
  c.header('Cache-Control', 'public, max-age=31536000, immutable')
  c.header('X-Bundle-Hash', object.customMetadata?.hash || '')

  return c.body(object.body)
})

export default bundles
```

## Files to Create

1. `packages/api/src/routes/releases/index.ts`
2. `packages/api/src/routes/bundles.ts`

## Tests Required

```typescript
describe('Releases', () => {
  it('creates a release', async () => {
    const response = await authedRequest('POST', `/apps/${appId}/releases`, {
      version: '1.0.0',
      channel: 'production',
    })
    expect(response.status).toBe(201)
  })

  it('prevents duplicate versions', async () => {
    await authedRequest('POST', `/apps/${appId}/releases`, {
      version: '1.0.0',
      channel: 'production',
    })
    const response = await authedRequest('POST', `/apps/${appId}/releases`, {
      version: '1.0.0',
      channel: 'production',
    })
    expect(response.status).toBe(409)
  })

  it('updates rollout percentage', async () => {
    const response = await authedRequest('PATCH', `/apps/${appId}/releases/${releaseId}/rollout`, {
      rolloutPercentage: 50,
    })
    expect(response.status).toBe(200)
    expect(response.body.release.rollout_percentage).toBe(50)
  })
})
```

## Acceptance Criteria

- [ ] List releases with stats
- [ ] Create release generates ID
- [ ] Upload bundle to R2
- [ ] Bundle hash calculated correctly
- [ ] Rollout percentage updates
- [ ] Disable release works
- [ ] Webhooks triggered on events
- [ ] Bundle serving works
- [ ] Tests pass
