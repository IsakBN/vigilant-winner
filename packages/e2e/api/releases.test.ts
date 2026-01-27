/**
 * Releases API E2E Tests
 *
 * Tests release management endpoints against the real API.
 * Covers CRUD operations, bundle uploads, and rollout management.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import {
  API_BASE_URL,
  apiRequest,
  authRequest,
  createTestUser,
  createTestApp,
  createTestRelease,
  uploadTestBundle,
  activateRelease,
  cleanupTestResources,
  type TestUser,
  type TestApp,
  type TestRelease,
} from './setup'

// =============================================================================
// Types
// =============================================================================

interface ReleaseResponse {
  release: {
    id: string
    app_id: string
    version: string
    bundle_url: string
    bundle_size: number
    bundle_hash: string
    rollout_percentage: number
    status: 'active' | 'paused' | 'rolled_back'
    release_notes: string | null
    min_app_version: string | null
    max_app_version: string | null
    rollback_reason: string | null
    created_at: number
    updated_at: number
  }
  stats?: {
    total_downloads: number
    total_installs: number
    total_rollbacks: number
    total_crashes: number
  }
}

interface ReleasesListResponse {
  data: ReleaseResponse['release'][]
  pagination: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
}

// =============================================================================
// Test State
// =============================================================================

let testUser: TestUser | null = null
let testApp: TestApp | null = null
let testRelease: TestRelease | null = null

// =============================================================================
// Setup / Teardown
// =============================================================================

beforeAll(async () => {
  testUser = await createTestUser()
  testApp = await createTestApp(testUser.sessionToken)
  testRelease = await createTestRelease(testUser.sessionToken, testApp.id)
})

afterAll(async () => {
  await cleanupTestResources(testUser?.sessionToken)
})

// =============================================================================
// List Releases Tests
// =============================================================================

describe('GET /v1/releases/:appId', () => {
  it('should list releases for an app', async () => {
    if (!testUser || !testApp) throw new Error('Test setup failed')

    const res = await authRequest<ReleasesListResponse>(
      `/v1/releases/${testApp.id}`,
      testUser.sessionToken
    )

    expect(res.status).toBe(200)
    expect(Array.isArray(res.data.data)).toBe(true)
    expect(res.data.pagination).toBeDefined()
  })

  it('should include pagination info', async () => {
    if (!testUser || !testApp) throw new Error('Test setup failed')

    const res = await authRequest<ReleasesListResponse>(
      `/v1/releases/${testApp.id}?limit=5&offset=0`,
      testUser.sessionToken
    )

    expect(res.status).toBe(200)
    expect(res.data.pagination.limit).toBe(5)
    expect(res.data.pagination.offset).toBe(0)
    expect(typeof res.data.pagination.hasMore).toBe('boolean')
    expect(typeof res.data.pagination.total).toBe('number')
  })

  it('should sort releases by created_at DESC', async () => {
    if (!testUser || !testApp) throw new Error('Test setup failed')

    // Create multiple releases
    await createTestRelease(testUser.sessionToken, testApp.id, {
      version: `1.0.${Date.now()}`,
    })
    await createTestRelease(testUser.sessionToken, testApp.id, {
      version: `1.0.${Date.now() + 1}`,
    })

    const res = await authRequest<ReleasesListResponse>(
      `/v1/releases/${testApp.id}`,
      testUser.sessionToken
    )

    expect(res.status).toBe(200)

    if (res.data.data.length >= 2) {
      expect(res.data.data[0].created_at).toBeGreaterThanOrEqual(
        res.data.data[1].created_at
      )
    }
  })

  it('should return 404 for non-existent app', async () => {
    if (!testUser) throw new Error('Test user not created')

    const res = await authRequest<{ error: string }>(
      '/v1/releases/00000000-0000-0000-0000-000000000000',
      testUser.sessionToken
    )

    expect(res.status).toBe(404)
    expect(res.data.error).toBe('APP_NOT_FOUND')
  })

  it('should return 404 for another user\'s app', async () => {
    if (!testApp) throw new Error('Test app not created')

    const otherUser = await createTestUser()

    const res = await authRequest<{ error: string }>(
      `/v1/releases/${testApp.id}`,
      otherUser.sessionToken
    )

    expect(res.status).toBe(404)
  })

  it('should reject unauthenticated request', async () => {
    if (!testApp) throw new Error('Test app not created')

    const res = await apiRequest<{ error: string }>(
      `/v1/releases/${testApp.id}`
    )

    expect(res.status).toBe(401)
  })
})

// =============================================================================
// Create Release Tests
// =============================================================================

describe('POST /v1/releases/:appId', () => {
  it('should create a release with version', async () => {
    if (!testUser || !testApp) throw new Error('Test setup failed')

    const version = `1.0.${Date.now()}`

    const res = await authRequest<ReleaseResponse>(
      `/v1/releases/${testApp.id}`,
      testUser.sessionToken,
      {
        method: 'POST',
        body: JSON.stringify({ version }),
      }
    )

    expect(res.status).toBe(201)
    expect(res.data.release.version).toBe(version)
    expect(res.data.release.app_id).toBe(testApp.id)
    expect(res.data.release.status).toBe('paused') // Starts paused
    expect(res.data.release.rollout_percentage).toBe(100)
  })

  it('should create a release with release notes', async () => {
    if (!testUser || !testApp) throw new Error('Test setup failed')

    const version = `1.0.${Date.now()}`
    const releaseNotes = 'E2E test release notes'

    const res = await authRequest<ReleaseResponse>(
      `/v1/releases/${testApp.id}`,
      testUser.sessionToken,
      {
        method: 'POST',
        body: JSON.stringify({ version, releaseNotes }),
      }
    )

    expect(res.status).toBe(201)
    expect(res.data.release.release_notes).toBe(releaseNotes)
  })

  it('should create a release with version constraints', async () => {
    if (!testUser || !testApp) throw new Error('Test setup failed')

    const version = `1.0.${Date.now()}`

    const res = await authRequest<ReleaseResponse>(
      `/v1/releases/${testApp.id}`,
      testUser.sessionToken,
      {
        method: 'POST',
        body: JSON.stringify({
          version,
          minAppVersion: '1.0.0',
          maxAppVersion: '2.0.0',
        }),
      }
    )

    expect(res.status).toBe(201)
    expect(res.data.release.min_app_version).toBe('1.0.0')
    expect(res.data.release.max_app_version).toBe('2.0.0')
  })

  it('should reject duplicate version', async () => {
    if (!testUser || !testApp) throw new Error('Test setup failed')

    const version = `1.0.${Date.now()}`

    // Create first release
    await authRequest<ReleaseResponse>(
      `/v1/releases/${testApp.id}`,
      testUser.sessionToken,
      {
        method: 'POST',
        body: JSON.stringify({ version }),
      }
    )

    // Try to create duplicate
    const res = await authRequest<{ error: string; message: string }>(
      `/v1/releases/${testApp.id}`,
      testUser.sessionToken,
      {
        method: 'POST',
        body: JSON.stringify({ version }),
      }
    )

    expect(res.status).toBe(409)
    expect(res.data.error).toBe('DUPLICATE_VERSION')
  })

  it('should reject missing version', async () => {
    if (!testUser || !testApp) throw new Error('Test setup failed')

    const res = await authRequest<{ error: string }>(
      `/v1/releases/${testApp.id}`,
      testUser.sessionToken,
      {
        method: 'POST',
        body: JSON.stringify({}),
      }
    )

    expect(res.status).toBe(400)
  })

  it('should reject empty version', async () => {
    if (!testUser || !testApp) throw new Error('Test setup failed')

    const res = await authRequest<{ error: string }>(
      `/v1/releases/${testApp.id}`,
      testUser.sessionToken,
      {
        method: 'POST',
        body: JSON.stringify({ version: '' }),
      }
    )

    expect(res.status).toBe(400)
  })

  it('should return 404 for non-existent app', async () => {
    if (!testUser) throw new Error('Test user not created')

    const res = await authRequest<{ error: string }>(
      '/v1/releases/00000000-0000-0000-0000-000000000000',
      testUser.sessionToken,
      {
        method: 'POST',
        body: JSON.stringify({ version: '1.0.0' }),
      }
    )

    expect(res.status).toBe(404)
  })
})

// =============================================================================
// Get Release Tests
// =============================================================================

describe('GET /v1/releases/:appId/:releaseId', () => {
  it('should get release by ID', async () => {
    if (!testUser || !testApp || !testRelease) throw new Error('Test setup failed')

    const res = await authRequest<ReleaseResponse>(
      `/v1/releases/${testApp.id}/${testRelease.id}`,
      testUser.sessionToken
    )

    expect(res.status).toBe(200)
    expect(res.data.release.id).toBe(testRelease.id)
    expect(res.data.release.version).toBe(testRelease.version)
  })

  it('should include release stats', async () => {
    if (!testUser || !testApp || !testRelease) throw new Error('Test setup failed')

    const res = await authRequest<ReleaseResponse>(
      `/v1/releases/${testApp.id}/${testRelease.id}`,
      testUser.sessionToken
    )

    expect(res.status).toBe(200)
    expect(res.data.stats).toBeDefined()
    expect(typeof res.data.stats?.total_downloads).toBe('number')
    expect(typeof res.data.stats?.total_installs).toBe('number')
  })

  it('should return 404 for non-existent release', async () => {
    if (!testUser || !testApp) throw new Error('Test setup failed')

    const res = await authRequest<{ error: string }>(
      `/v1/releases/${testApp.id}/00000000-0000-0000-0000-000000000000`,
      testUser.sessionToken
    )

    expect(res.status).toBe(404)
    expect(res.data.error).toBe('RELEASE_NOT_FOUND')
  })

  it('should return 404 for release in wrong app', async () => {
    if (!testUser || !testRelease) throw new Error('Test setup failed')

    // Create another app
    const otherApp = await createTestApp(testUser.sessionToken)

    const res = await authRequest<{ error: string }>(
      `/v1/releases/${otherApp.id}/${testRelease.id}`,
      testUser.sessionToken
    )

    expect(res.status).toBe(404)
  })
})

// =============================================================================
// Upload Bundle Tests
// =============================================================================

describe('POST /v1/releases/:appId/:releaseId/bundle', () => {
  it('should upload a bundle', async () => {
    if (!testUser || !testApp) throw new Error('Test setup failed')

    const release = await createTestRelease(testUser.sessionToken, testApp.id)
    const bundleContent = 'console.log("E2E test bundle");'

    const result = await uploadTestBundle(
      testUser.sessionToken,
      testApp.id,
      release.id,
      bundleContent
    )

    expect(result.bundleUrl).toBeDefined()
    expect(result.bundleUrl.length).toBeGreaterThan(0)
  })

  it('should update release with bundle info after upload', async () => {
    if (!testUser || !testApp) throw new Error('Test setup failed')

    const release = await createTestRelease(testUser.sessionToken, testApp.id)

    await uploadTestBundle(
      testUser.sessionToken,
      testApp.id,
      release.id,
      'console.log("test");'
    )

    // Get updated release
    const res = await authRequest<ReleaseResponse>(
      `/v1/releases/${testApp.id}/${release.id}`,
      testUser.sessionToken
    )

    expect(res.data.release.bundle_url).not.toBe('')
    expect(res.data.release.bundle_size).toBeGreaterThan(0)
    expect(res.data.release.bundle_hash).not.toBe('')
  })

  it('should reject empty bundle', async () => {
    if (!testUser || !testApp) throw new Error('Test setup failed')

    const release = await createTestRelease(testUser.sessionToken, testApp.id)

    const url = `${API_BASE_URL}/v1/releases/${testApp.id}/${release.id}/bundle`
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
        Authorization: `Bearer ${testUser.sessionToken}`,
      },
      body: new Uint8Array(0),
    })

    expect(response.status).toBe(400)
  })

  it('should return 404 for non-existent release', async () => {
    if (!testUser || !testApp) throw new Error('Test setup failed')

    const url = `${API_BASE_URL}/v1/releases/${testApp.id}/00000000-0000-0000-0000-000000000000/bundle`
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
        Authorization: `Bearer ${testUser.sessionToken}`,
      },
      body: new TextEncoder().encode('test bundle'),
    })

    expect(response.status).toBe(404)
  })
})

// =============================================================================
// Update Release Tests
// =============================================================================

describe('PATCH /v1/releases/:appId/:releaseId', () => {
  let updateRelease: TestRelease | null = null

  beforeEach(async () => {
    if (!testUser || !testApp) throw new Error('Test setup failed')
    updateRelease = await createTestRelease(testUser.sessionToken, testApp.id)
  })

  it('should update release notes', async () => {
    if (!testUser || !testApp || !updateRelease) throw new Error('Test setup failed')

    const res = await authRequest<ReleaseResponse>(
      `/v1/releases/${testApp.id}/${updateRelease.id}`,
      testUser.sessionToken,
      {
        method: 'PATCH',
        body: JSON.stringify({ releaseNotes: 'Updated release notes' }),
      }
    )

    expect(res.status).toBe(200)
    expect(res.data.release.release_notes).toBe('Updated release notes')
  })

  it('should update status to active', async () => {
    if (!testUser || !testApp || !updateRelease) throw new Error('Test setup failed')

    // Upload bundle first (required for activation)
    await uploadTestBundle(
      testUser.sessionToken,
      testApp.id,
      updateRelease.id
    )

    const res = await authRequest<ReleaseResponse>(
      `/v1/releases/${testApp.id}/${updateRelease.id}`,
      testUser.sessionToken,
      {
        method: 'PATCH',
        body: JSON.stringify({ status: 'active' }),
      }
    )

    expect(res.status).toBe(200)
    expect(res.data.release.status).toBe('active')
  })

  it('should update status to paused', async () => {
    if (!testUser || !testApp || !updateRelease) throw new Error('Test setup failed')

    const res = await authRequest<ReleaseResponse>(
      `/v1/releases/${testApp.id}/${updateRelease.id}`,
      testUser.sessionToken,
      {
        method: 'PATCH',
        body: JSON.stringify({ status: 'paused' }),
      }
    )

    expect(res.status).toBe(200)
    expect(res.data.release.status).toBe('paused')
  })

  it('should update status to rolled_back with reason', async () => {
    if (!testUser || !testApp || !updateRelease) throw new Error('Test setup failed')

    const res = await authRequest<ReleaseResponse>(
      `/v1/releases/${testApp.id}/${updateRelease.id}`,
      testUser.sessionToken,
      {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'rolled_back',
          rollbackReason: 'Found critical bug',
        }),
      }
    )

    expect(res.status).toBe(200)
    expect(res.data.release.status).toBe('rolled_back')
    expect(res.data.release.rollback_reason).toBe('Found critical bug')
  })

  it('should return 404 for non-existent release', async () => {
    if (!testUser || !testApp) throw new Error('Test setup failed')

    const res = await authRequest<{ error: string }>(
      `/v1/releases/${testApp.id}/00000000-0000-0000-0000-000000000000`,
      testUser.sessionToken,
      {
        method: 'PATCH',
        body: JSON.stringify({ releaseNotes: 'Test' }),
      }
    )

    expect(res.status).toBe(404)
  })

  it('should return current release if no updates provided', async () => {
    if (!testUser || !testApp || !updateRelease) throw new Error('Test setup failed')

    const res = await authRequest<ReleaseResponse>(
      `/v1/releases/${testApp.id}/${updateRelease.id}`,
      testUser.sessionToken,
      {
        method: 'PATCH',
        body: JSON.stringify({}),
      }
    )

    expect(res.status).toBe(200)
    expect(res.data.release.id).toBe(updateRelease.id)
  })
})

// =============================================================================
// Rollout Tests
// =============================================================================

describe('PATCH /v1/releases/:appId/:releaseId/rollout', () => {
  let rolloutRelease: TestRelease | null = null

  beforeEach(async () => {
    if (!testUser || !testApp) throw new Error('Test setup failed')
    rolloutRelease = await createTestRelease(testUser.sessionToken, testApp.id)
  })

  it('should update rollout percentage', async () => {
    if (!testUser || !testApp || !rolloutRelease) throw new Error('Test setup failed')

    const res = await authRequest<ReleaseResponse>(
      `/v1/releases/${testApp.id}/${rolloutRelease.id}/rollout`,
      testUser.sessionToken,
      {
        method: 'PATCH',
        body: JSON.stringify({ rolloutPercentage: 50 }),
      }
    )

    expect(res.status).toBe(200)
    expect(res.data.release.rollout_percentage).toBe(50)
  })

  it('should allow 0% rollout', async () => {
    if (!testUser || !testApp || !rolloutRelease) throw new Error('Test setup failed')

    const res = await authRequest<ReleaseResponse>(
      `/v1/releases/${testApp.id}/${rolloutRelease.id}/rollout`,
      testUser.sessionToken,
      {
        method: 'PATCH',
        body: JSON.stringify({ rolloutPercentage: 0 }),
      }
    )

    expect(res.status).toBe(200)
    expect(res.data.release.rollout_percentage).toBe(0)
  })

  it('should allow 100% rollout', async () => {
    if (!testUser || !testApp || !rolloutRelease) throw new Error('Test setup failed')

    const res = await authRequest<ReleaseResponse>(
      `/v1/releases/${testApp.id}/${rolloutRelease.id}/rollout`,
      testUser.sessionToken,
      {
        method: 'PATCH',
        body: JSON.stringify({ rolloutPercentage: 100 }),
      }
    )

    expect(res.status).toBe(200)
    expect(res.data.release.rollout_percentage).toBe(100)
  })

  it('should reject rollout > 100', async () => {
    if (!testUser || !testApp || !rolloutRelease) throw new Error('Test setup failed')

    const res = await authRequest<{ error: string }>(
      `/v1/releases/${testApp.id}/${rolloutRelease.id}/rollout`,
      testUser.sessionToken,
      {
        method: 'PATCH',
        body: JSON.stringify({ rolloutPercentage: 150 }),
      }
    )

    expect(res.status).toBe(400)
  })

  it('should reject negative rollout', async () => {
    if (!testUser || !testApp || !rolloutRelease) throw new Error('Test setup failed')

    const res = await authRequest<{ error: string }>(
      `/v1/releases/${testApp.id}/${rolloutRelease.id}/rollout`,
      testUser.sessionToken,
      {
        method: 'PATCH',
        body: JSON.stringify({ rolloutPercentage: -10 }),
      }
    )

    expect(res.status).toBe(400)
  })

  it('should return 404 for non-existent release', async () => {
    if (!testUser || !testApp) throw new Error('Test setup failed')

    const res = await authRequest<{ error: string }>(
      `/v1/releases/${testApp.id}/00000000-0000-0000-0000-000000000000/rollout`,
      testUser.sessionToken,
      {
        method: 'PATCH',
        body: JSON.stringify({ rolloutPercentage: 50 }),
      }
    )

    expect(res.status).toBe(404)
  })
})

// =============================================================================
// Rollback Tests
// =============================================================================

describe('Release Rollback Flow', () => {
  it('should support rollback workflow', async () => {
    if (!testUser || !testApp) throw new Error('Test setup failed')

    // Create and activate release
    const release = await createTestRelease(testUser.sessionToken, testApp.id, {
      version: `rollback-test-${Date.now()}`,
    })
    await uploadTestBundle(testUser.sessionToken, testApp.id, release.id)
    await activateRelease(testUser.sessionToken, testApp.id, release.id)

    // Verify it's active
    const activeRes = await authRequest<ReleaseResponse>(
      `/v1/releases/${testApp.id}/${release.id}`,
      testUser.sessionToken
    )
    expect(activeRes.data.release.status).toBe('active')

    // Rollback
    const rollbackRes = await authRequest<ReleaseResponse>(
      `/v1/releases/${testApp.id}/${release.id}`,
      testUser.sessionToken,
      {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'rolled_back',
          rollbackReason: 'E2E test rollback',
        }),
      }
    )

    expect(rollbackRes.status).toBe(200)
    expect(rollbackRes.data.release.status).toBe('rolled_back')
    expect(rollbackRes.data.release.rollback_reason).toBe('E2E test rollback')
  })
})
