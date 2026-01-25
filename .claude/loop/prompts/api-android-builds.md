# Feature: api/android-builds

Implement Android build pipeline endpoints for OTA bundle generation.

## Knowledge Docs to Read First

- `.claude/knowledge/API_FEATURES.md` → Build system architecture
- `.claude/knowledge/IMPLEMENTATION_DETAILS.md` → R2 storage patterns

## Dependencies

- `api/releases-crud` (must complete first)
- `api/credentials-android` (must complete first)

## What to Implement

### 1. Android Build Route

```typescript
// packages/api/src/routes/builds/android.ts
import { Hono } from 'hono'
import { z } from 'zod'
import { authMiddleware } from '@/middleware/auth'
import { validateBody } from '@/middleware/validation'
import { createAndroidBuild, getAndroidBuild, listAndroidBuilds } from '@/lib/builds/android'

const androidBuildSchema = z.object({
  appId: z.string().uuid(),
  version: z.string().regex(/^\d+\.\d+\.\d+$/, 'Version must be semver'),
  versionCode: z.number().int().positive(),
  bundlePath: z.string().min(1),
  platform: z.literal('android'),
  minSdkVersion: z.number().int().min(21).default(21),
  targetSdkVersion: z.number().int().min(21).default(34),
  buildType: z.enum(['apk', 'aab']).default('aab'),
  signingConfig: z.object({
    keystoreAlias: z.string(),
    keystoreId: z.string().uuid(),
  }).optional(),
})

const android = new Hono()

android.use('*', authMiddleware)

// Create Android build
android.post('/', validateBody(androidBuildSchema), async (c) => {
  const user = c.get('user')
  const data = c.req.valid('json')

  // Verify app ownership
  const app = await c.env.DB.prepare(
    'SELECT * FROM apps WHERE id = ? AND user_id = ?'
  ).bind(data.appId, user.id).first()

  if (!app) {
    return c.json({ error: 'App not found' }, 404)
  }

  const build = await createAndroidBuild(c.env, {
    ...data,
    userId: user.id,
  })

  return c.json({ build }, 201)
})

// List Android builds for an app
android.get('/app/:appId', async (c) => {
  const user = c.get('user')
  const appId = c.req.param('appId')
  const { limit = '20', offset = '0' } = c.req.query()

  const builds = await listAndroidBuilds(c.env, {
    appId,
    userId: user.id,
    limit: parseInt(limit),
    offset: parseInt(offset),
  })

  return c.json(builds)
})

// Get specific build
android.get('/:buildId', async (c) => {
  const user = c.get('user')
  const buildId = c.req.param('buildId')

  const build = await getAndroidBuild(c.env, buildId, user.id)

  if (!build) {
    return c.json({ error: 'Build not found' }, 404)
  }

  return c.json({ build })
})

// Download build artifact
android.get('/:buildId/download', async (c) => {
  const user = c.get('user')
  const buildId = c.req.param('buildId')

  const build = await getAndroidBuild(c.env, buildId, user.id)

  if (!build || !build.artifactPath) {
    return c.json({ error: 'Build artifact not found' }, 404)
  }

  // Generate signed URL for R2
  const signedUrl = await c.env.BUNDLES.createSignedUrl(build.artifactPath, {
    expiresIn: 3600, // 1 hour
  })

  return c.json({ downloadUrl: signedUrl })
})

// Cancel build
android.post('/:buildId/cancel', async (c) => {
  const user = c.get('user')
  const buildId = c.req.param('buildId')

  const build = await getAndroidBuild(c.env, buildId, user.id)

  if (!build) {
    return c.json({ error: 'Build not found' }, 404)
  }

  if (build.status !== 'pending' && build.status !== 'building') {
    return c.json({ error: 'Build cannot be cancelled' }, 400)
  }

  await updateBuildStatus(c.env, buildId, {
    status: 'cancelled',
    completedAt: new Date().toISOString(),
  })

  return c.json({ success: true })
})

export { android }
```

### 2. Android Build Service

```typescript
// packages/api/src/lib/builds/android.ts
import { nanoid } from 'nanoid'
import { Env } from '@/types'

export interface AndroidBuild {
  id: string
  appId: string
  userId: string
  version: string
  versionCode: number
  bundlePath: string
  artifactPath: string | null
  status: 'pending' | 'building' | 'completed' | 'failed' | 'cancelled'
  platform: 'android'
  minSdkVersion: number
  targetSdkVersion: number
  buildType: 'apk' | 'aab'
  signingConfig: {
    keystoreAlias: string
    keystoreId: string
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
  versionCode: number
  bundlePath: string
  minSdkVersion: number
  targetSdkVersion: number
  buildType: 'apk' | 'aab'
  signingConfig?: {
    keystoreAlias: string
    keystoreId: string
  }
}

export async function createAndroidBuild(
  env: Env,
  params: CreateBuildParams
): Promise<AndroidBuild> {
  const id = nanoid()
  const now = new Date().toISOString()

  const build: AndroidBuild = {
    id,
    appId: params.appId,
    userId: params.userId,
    version: params.version,
    versionCode: params.versionCode,
    bundlePath: params.bundlePath,
    artifactPath: null,
    status: 'pending',
    platform: 'android',
    minSdkVersion: params.minSdkVersion,
    targetSdkVersion: params.targetSdkVersion,
    buildType: params.buildType,
    signingConfig: params.signingConfig || null,
    buildLog: null,
    fileSize: null,
    bundleHash: null,
    createdAt: now,
    completedAt: null,
    error: null,
  }

  await env.DB.prepare(`
    INSERT INTO android_builds (
      id, app_id, user_id, version, version_code, bundle_path, artifact_path,
      status, platform, min_sdk_version, target_sdk_version, build_type,
      signing_config, build_log, file_size, bundle_hash, created_at, completed_at, error
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    build.id,
    build.appId,
    build.userId,
    build.version,
    build.versionCode,
    build.bundlePath,
    build.artifactPath,
    build.status,
    build.platform,
    build.minSdkVersion,
    build.targetSdkVersion,
    build.buildType,
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
    type: 'android_build',
    buildId: id,
    params,
  })

  return build
}

export async function getAndroidBuild(
  env: Env,
  buildId: string,
  userId: string
): Promise<AndroidBuild | null> {
  const row = await env.DB.prepare(`
    SELECT * FROM android_builds WHERE id = ? AND user_id = ?
  `).bind(buildId, userId).first()

  if (!row) return null

  return {
    id: row.id as string,
    appId: row.app_id as string,
    userId: row.user_id as string,
    version: row.version as string,
    versionCode: row.version_code as number,
    bundlePath: row.bundle_path as string,
    artifactPath: row.artifact_path as string | null,
    status: row.status as AndroidBuild['status'],
    platform: 'android',
    minSdkVersion: row.min_sdk_version as number,
    targetSdkVersion: row.target_sdk_version as number,
    buildType: row.build_type as 'apk' | 'aab',
    signingConfig: row.signing_config ? JSON.parse(row.signing_config as string) : null,
    buildLog: row.build_log as string | null,
    fileSize: row.file_size as number | null,
    bundleHash: row.bundle_hash as string | null,
    createdAt: row.created_at as string,
    completedAt: row.completed_at as string | null,
    error: row.error as string | null,
  }
}

export async function listAndroidBuilds(
  env: Env,
  params: { appId: string; userId: string; limit: number; offset: number }
): Promise<{ builds: AndroidBuild[]; total: number }> {
  const countResult = await env.DB.prepare(`
    SELECT COUNT(*) as count FROM android_builds WHERE app_id = ? AND user_id = ?
  `).bind(params.appId, params.userId).first()

  const rows = await env.DB.prepare(`
    SELECT * FROM android_builds
    WHERE app_id = ? AND user_id = ?
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `).bind(params.appId, params.userId, params.limit, params.offset).all()

  const builds = rows.results.map((row: any) => ({
    id: row.id,
    appId: row.app_id,
    userId: row.user_id,
    version: row.version,
    versionCode: row.version_code,
    bundlePath: row.bundle_path,
    artifactPath: row.artifact_path,
    status: row.status,
    platform: 'android' as const,
    minSdkVersion: row.min_sdk_version,
    targetSdkVersion: row.target_sdk_version,
    buildType: row.build_type,
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
  updates: Partial<Pick<AndroidBuild, 'status' | 'artifactPath' | 'buildLog' | 'fileSize' | 'bundleHash' | 'completedAt' | 'error'>>
): Promise<void> {
  const setClauses: string[] = []
  const values: any[] = []

  Object.entries(updates).forEach(([key, value]) => {
    if (value !== undefined) {
      const dbKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
      setClauses.push(`${dbKey} = ?`)
      values.push(value)
    }
  })

  if (setClauses.length === 0) return

  values.push(buildId)

  await env.DB.prepare(`
    UPDATE android_builds SET ${setClauses.join(', ')} WHERE id = ?
  `).bind(...values).run()
}
```

### 3. Database Migration

```sql
-- migrations/0008_android_builds.sql
CREATE TABLE IF NOT EXISTS android_builds (
  id TEXT PRIMARY KEY,
  app_id TEXT NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id),
  version TEXT NOT NULL,
  version_code INTEGER NOT NULL,
  bundle_path TEXT NOT NULL,
  artifact_path TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  platform TEXT NOT NULL DEFAULT 'android',
  min_sdk_version INTEGER NOT NULL DEFAULT 21,
  target_sdk_version INTEGER NOT NULL DEFAULT 34,
  build_type TEXT NOT NULL DEFAULT 'aab',
  signing_config TEXT,
  build_log TEXT,
  file_size INTEGER,
  bundle_hash TEXT,
  created_at TEXT NOT NULL,
  completed_at TEXT,
  error TEXT,
  UNIQUE(app_id, version_code, platform)
);

CREATE INDEX idx_android_builds_app_id ON android_builds(app_id);
CREATE INDEX idx_android_builds_user_id ON android_builds(user_id);
CREATE INDEX idx_android_builds_status ON android_builds(status);
CREATE INDEX idx_android_builds_created_at ON android_builds(created_at);
```

## Files to Create

1. `packages/api/src/routes/builds/android.ts`
2. `packages/api/src/lib/builds/android.ts`
3. `migrations/0008_android_builds.sql`

## Tests to Write

```typescript
// packages/api/src/routes/builds/__tests__/android.test.ts
describe('Android Builds API', () => {
  it('should create a build', async () => {
    const response = await app.request('/builds/android', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({
        appId: testApp.id,
        version: '1.0.0',
        versionCode: 1,
        bundlePath: '/bundles/test.js',
        buildType: 'aab',
      }),
    })
    expect(response.status).toBe(201)
    const data = await response.json()
    expect(data.build.status).toBe('pending')
    expect(data.build.buildType).toBe('aab')
  })

  it('should list builds for an app', async () => {
    const response = await app.request(`/builds/android/app/${testApp.id}`, {
      headers: authHeaders,
    })
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.builds).toBeInstanceOf(Array)
  })

  it('should cancel a pending build', async () => {
    const response = await app.request(`/builds/android/${build.id}/cancel`, {
      method: 'POST',
      headers: authHeaders,
    })
    expect(response.status).toBe(200)
  })

  it('should support APK and AAB build types', async () => {
    const apkResponse = await app.request('/builds/android', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({
        appId: testApp.id,
        version: '1.0.1',
        versionCode: 2,
        bundlePath: '/bundles/test.js',
        buildType: 'apk',
      }),
    })
    expect(apkResponse.status).toBe(201)
    const data = await apkResponse.json()
    expect(data.build.buildType).toBe('apk')
  })
})
```

## Acceptance Criteria

- [ ] Create Android build endpoint
- [ ] List builds by app
- [ ] Get build details
- [ ] Download build artifact
- [ ] Cancel pending build
- [ ] Support APK and AAB formats
- [ ] Version code tracking
- [ ] SDK version validation (min 21)
- [ ] Queue integration
