# Feature: api/ios-builds

Implement iOS build pipeline endpoints for OTA bundle generation.

## Knowledge Docs to Read First

- `.claude/knowledge/API_FEATURES.md` → Build system architecture
- `.claude/knowledge/IMPLEMENTATION_DETAILS.md` → R2 storage patterns

## Dependencies

- `api/releases-crud` (must complete first)
- `api/credentials-apple` (must complete first)

## What to Implement

### 1. iOS Build Route

```typescript
// packages/api/src/routes/builds/ios.ts
import { Hono } from 'hono'
import { z } from 'zod'
import { authMiddleware } from '@/middleware/auth'
import { validateBody } from '@/middleware/validation'
import { createIosBuild, getIosBuild, listIosBuilds } from '@/lib/builds/ios'

const iosBuildSchema = z.object({
  appId: z.string().uuid(),
  version: z.string().regex(/^\d+\.\d+\.\d+$/, 'Version must be semver'),
  bundlePath: z.string().min(1),
  platform: z.literal('ios'),
  minOsVersion: z.string().optional().default('13.0'),
  targetDevices: z.array(z.enum(['iphone', 'ipad', 'universal'])).default(['universal']),
  signingConfig: z.object({
    teamId: z.string(),
    bundleId: z.string(),
    provisioningProfile: z.string().optional(),
  }).optional(),
})

const ios = new Hono()

ios.use('*', authMiddleware)

// Create iOS build
ios.post('/', validateBody(iosBuildSchema), async (c) => {
  const user = c.get('user')
  const data = c.req.valid('json')

  // Verify app ownership
  const app = await c.env.DB.prepare(
    'SELECT * FROM apps WHERE id = ? AND user_id = ?'
  ).bind(data.appId, user.id).first()

  if (!app) {
    return c.json({ error: 'App not found' }, 404)
  }

  const build = await createIosBuild(c.env, {
    ...data,
    userId: user.id,
  })

  return c.json({ build }, 201)
})

// List iOS builds for an app
ios.get('/app/:appId', async (c) => {
  const user = c.get('user')
  const appId = c.req.param('appId')
  const { limit = '20', offset = '0' } = c.req.query()

  const builds = await listIosBuilds(c.env, {
    appId,
    userId: user.id,
    limit: parseInt(limit),
    offset: parseInt(offset),
  })

  return c.json(builds)
})

// Get specific build
ios.get('/:buildId', async (c) => {
  const user = c.get('user')
  const buildId = c.req.param('buildId')

  const build = await getIosBuild(c.env, buildId, user.id)

  if (!build) {
    return c.json({ error: 'Build not found' }, 404)
  }

  return c.json({ build })
})

// Download build artifact
ios.get('/:buildId/download', async (c) => {
  const user = c.get('user')
  const buildId = c.req.param('buildId')

  const build = await getIosBuild(c.env, buildId, user.id)

  if (!build || !build.artifactPath) {
    return c.json({ error: 'Build artifact not found' }, 404)
  }

  // Generate signed URL for R2
  const signedUrl = await c.env.BUNDLES.createSignedUrl(build.artifactPath, {
    expiresIn: 3600, // 1 hour
  })

  return c.json({ downloadUrl: signedUrl })
})

export { ios }
```

### 2. iOS Build Service

```typescript
// packages/api/src/lib/builds/ios.ts
import { nanoid } from 'nanoid'
import { Env } from '@/types'

export interface IosBuild {
  id: string
  appId: string
  userId: string
  version: string
  bundlePath: string
  artifactPath: string | null
  status: 'pending' | 'building' | 'completed' | 'failed'
  platform: 'ios'
  minOsVersion: string
  targetDevices: string[]
  signingConfig: {
    teamId: string
    bundleId: string
    provisioningProfile?: string
  } | null
  buildLog: string | null
  fileSize: number | null
  bundleHash: string | null
  createdAt: string
  completedAt: string | null
  error: string | null
}

interface CreateBuildParams {
  appId: string
  userId: string
  version: string
  bundlePath: string
  minOsVersion: string
  targetDevices: string[]
  signingConfig?: {
    teamId: string
    bundleId: string
    provisioningProfile?: string
  }
}

export async function createIosBuild(
  env: Env,
  params: CreateBuildParams
): Promise<IosBuild> {
  const id = nanoid()
  const now = new Date().toISOString()

  const build: IosBuild = {
    id,
    appId: params.appId,
    userId: params.userId,
    version: params.version,
    bundlePath: params.bundlePath,
    artifactPath: null,
    status: 'pending',
    platform: 'ios',
    minOsVersion: params.minOsVersion,
    targetDevices: params.targetDevices,
    signingConfig: params.signingConfig || null,
    buildLog: null,
    fileSize: null,
    bundleHash: null,
    createdAt: now,
    completedAt: null,
    error: null,
  }

  await env.DB.prepare(`
    INSERT INTO ios_builds (
      id, app_id, user_id, version, bundle_path, artifact_path,
      status, platform, min_os_version, target_devices, signing_config,
      build_log, file_size, bundle_hash, created_at, completed_at, error
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    build.id,
    build.appId,
    build.userId,
    build.version,
    build.bundlePath,
    build.artifactPath,
    build.status,
    build.platform,
    build.minOsVersion,
    JSON.stringify(build.targetDevices),
    JSON.stringify(build.signingConfig),
    build.buildLog,
    build.fileSize,
    build.bundleHash,
    build.createdAt,
    build.completedAt,
    build.error
  ).run()

  // Queue build job
  await env.BUILD_QUEUE.send({
    type: 'ios_build',
    buildId: id,
    params,
  })

  return build
}

export async function getIosBuild(
  env: Env,
  buildId: string,
  userId: string
): Promise<IosBuild | null> {
  const row = await env.DB.prepare(`
    SELECT * FROM ios_builds WHERE id = ? AND user_id = ?
  `).bind(buildId, userId).first()

  if (!row) return null

  return {
    id: row.id as string,
    appId: row.app_id as string,
    userId: row.user_id as string,
    version: row.version as string,
    bundlePath: row.bundle_path as string,
    artifactPath: row.artifact_path as string | null,
    status: row.status as IosBuild['status'],
    platform: 'ios',
    minOsVersion: row.min_os_version as string,
    targetDevices: JSON.parse(row.target_devices as string),
    signingConfig: row.signing_config ? JSON.parse(row.signing_config as string) : null,
    buildLog: row.build_log as string | null,
    fileSize: row.file_size as number | null,
    bundleHash: row.bundle_hash as string | null,
    createdAt: row.created_at as string,
    completedAt: row.completed_at as string | null,
    error: row.error as string | null,
  }
}

export async function listIosBuilds(
  env: Env,
  params: { appId: string; userId: string; limit: number; offset: number }
): Promise<{ builds: IosBuild[]; total: number }> {
  const countResult = await env.DB.prepare(`
    SELECT COUNT(*) as count FROM ios_builds WHERE app_id = ? AND user_id = ?
  `).bind(params.appId, params.userId).first()

  const rows = await env.DB.prepare(`
    SELECT * FROM ios_builds
    WHERE app_id = ? AND user_id = ?
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `).bind(params.appId, params.userId, params.limit, params.offset).all()

  const builds = rows.results.map((row: any) => ({
    id: row.id,
    appId: row.app_id,
    userId: row.user_id,
    version: row.version,
    bundlePath: row.bundle_path,
    artifactPath: row.artifact_path,
    status: row.status,
    platform: 'ios' as const,
    minOsVersion: row.min_os_version,
    targetDevices: JSON.parse(row.target_devices),
    signingConfig: row.signing_config ? JSON.parse(row.signing_config) : null,
    buildLog: row.build_log,
    fileSize: row.file_size,
    bundleHash: row.bundle_hash,
    createdAt: row.created_at,
    completedAt: row.completed_at,
    error: row.error,
  }))

  return { builds, total: countResult?.count as number || 0 }
}

export async function updateBuildStatus(
  env: Env,
  buildId: string,
  updates: Partial<Pick<IosBuild, 'status' | 'artifactPath' | 'buildLog' | 'fileSize' | 'bundleHash' | 'completedAt' | 'error'>>
): Promise<void> {
  const setClauses: string[] = []
  const values: any[] = []

  if (updates.status !== undefined) {
    setClauses.push('status = ?')
    values.push(updates.status)
  }
  if (updates.artifactPath !== undefined) {
    setClauses.push('artifact_path = ?')
    values.push(updates.artifactPath)
  }
  if (updates.buildLog !== undefined) {
    setClauses.push('build_log = ?')
    values.push(updates.buildLog)
  }
  if (updates.fileSize !== undefined) {
    setClauses.push('file_size = ?')
    values.push(updates.fileSize)
  }
  if (updates.bundleHash !== undefined) {
    setClauses.push('bundle_hash = ?')
    values.push(updates.bundleHash)
  }
  if (updates.completedAt !== undefined) {
    setClauses.push('completed_at = ?')
    values.push(updates.completedAt)
  }
  if (updates.error !== undefined) {
    setClauses.push('error = ?')
    values.push(updates.error)
  }

  if (setClauses.length === 0) return

  values.push(buildId)

  await env.DB.prepare(`
    UPDATE ios_builds SET ${setClauses.join(', ')} WHERE id = ?
  `).bind(...values).run()
}
```

### 3. Database Migration

```sql
-- migrations/0007_ios_builds.sql
CREATE TABLE IF NOT EXISTS ios_builds (
  id TEXT PRIMARY KEY,
  app_id TEXT NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id),
  version TEXT NOT NULL,
  bundle_path TEXT NOT NULL,
  artifact_path TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  platform TEXT NOT NULL DEFAULT 'ios',
  min_os_version TEXT NOT NULL DEFAULT '13.0',
  target_devices TEXT NOT NULL DEFAULT '["universal"]',
  signing_config TEXT,
  build_log TEXT,
  file_size INTEGER,
  bundle_hash TEXT,
  created_at TEXT NOT NULL,
  completed_at TEXT,
  error TEXT,
  UNIQUE(app_id, version, platform)
);

CREATE INDEX idx_ios_builds_app_id ON ios_builds(app_id);
CREATE INDEX idx_ios_builds_user_id ON ios_builds(user_id);
CREATE INDEX idx_ios_builds_status ON ios_builds(status);
CREATE INDEX idx_ios_builds_created_at ON ios_builds(created_at);
```

## Files to Create

1. `packages/api/src/routes/builds/ios.ts`
2. `packages/api/src/lib/builds/ios.ts`
3. `migrations/0007_ios_builds.sql`

## Tests to Write

```typescript
// packages/api/src/routes/builds/__tests__/ios.test.ts
describe('iOS Builds API', () => {
  it('should create a build', async () => {
    const response = await app.request('/builds/ios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({
        appId: testApp.id,
        version: '1.0.0',
        bundlePath: '/bundles/test.js',
        targetDevices: ['iphone'],
      }),
    })
    expect(response.status).toBe(201)
    const data = await response.json()
    expect(data.build.status).toBe('pending')
  })

  it('should list builds for an app', async () => {
    const response = await app.request(`/builds/ios/app/${testApp.id}`, {
      headers: authHeaders,
    })
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.builds).toBeInstanceOf(Array)
  })

  it('should reject invalid version format', async () => {
    const response = await app.request('/builds/ios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({
        appId: testApp.id,
        version: 'invalid',
        bundlePath: '/bundles/test.js',
      }),
    })
    expect(response.status).toBe(400)
  })
})
```

## Acceptance Criteria

- [ ] Create iOS build endpoint
- [ ] List builds by app
- [ ] Get build details
- [ ] Download build artifact (signed URL)
- [ ] Build status tracking
- [ ] Queue integration for async builds
- [ ] Proper error handling
- [ ] Version semver validation
