/**
 * Apps API E2E Tests
 *
 * Tests app management endpoints against the real API.
 * Covers CRUD operations and API key management.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import {
  apiRequest,
  authRequest,
  createTestUser,
  createTestApp,
  cleanupTestResources,
  type TestUser,
  type TestApp,
} from './setup'

// =============================================================================
// Types
// =============================================================================

interface AppResponse {
  app: {
    id: string
    name: string
    platform: 'ios' | 'android'
    api_key: string
    bundle_id: string | null
    owner_id: string
    webhook_secret: string
    created_at: number
    updated_at: number
    deleted_at: number | null
    release_count?: number
    device_count?: number
  }
}

interface AppsListResponse {
  data: AppResponse['app'][]
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

// =============================================================================
// Setup / Teardown
// =============================================================================

beforeAll(async () => {
  testUser = await createTestUser()
  testApp = await createTestApp(testUser.sessionToken)
})

afterAll(async () => {
  await cleanupTestResources(testUser?.sessionToken)
})

// =============================================================================
// List Apps Tests
// =============================================================================

describe('GET /v1/apps', () => {
  it('should list apps for authenticated user', async () => {
    if (!testUser) throw new Error('Test user not created')

    const res = await authRequest<AppsListResponse>(
      '/v1/apps',
      testUser.sessionToken
    )

    expect(res.status).toBe(200)
    expect(Array.isArray(res.data.data)).toBe(true)
    expect(res.data.pagination).toBeDefined()
    expect(res.data.pagination.total).toBeGreaterThanOrEqual(1)
  })

  it('should include pagination info', async () => {
    if (!testUser) throw new Error('Test user not created')

    const res = await authRequest<AppsListResponse>(
      '/v1/apps?limit=10&offset=0',
      testUser.sessionToken
    )

    expect(res.status).toBe(200)
    expect(res.data.pagination.limit).toBe(10)
    expect(res.data.pagination.offset).toBe(0)
    expect(typeof res.data.pagination.hasMore).toBe('boolean')
  })

  it('should respect limit parameter', async () => {
    if (!testUser) throw new Error('Test user not created')

    const res = await authRequest<AppsListResponse>(
      '/v1/apps?limit=1',
      testUser.sessionToken
    )

    expect(res.status).toBe(200)
    expect(res.data.data.length).toBeLessThanOrEqual(1)
    expect(res.data.pagination.limit).toBe(1)
  })

  it('should cap limit at 100', async () => {
    if (!testUser) throw new Error('Test user not created')

    const res = await authRequest<AppsListResponse>(
      '/v1/apps?limit=500',
      testUser.sessionToken
    )

    expect(res.status).toBe(200)
    expect(res.data.pagination.limit).toBeLessThanOrEqual(100)
  })

  it('should reject unauthenticated request', async () => {
    const res = await apiRequest<{ error: string }>('/v1/apps')

    expect(res.status).toBe(401)
  })

  it('should reject invalid session token', async () => {
    const res = await authRequest<{ error: string }>(
      '/v1/apps',
      'invalid-token-12345'
    )

    expect(res.status).toBe(401)
  })
})

// =============================================================================
// Create App Tests
// =============================================================================

describe('POST /v1/apps', () => {
  it('should create an iOS app', async () => {
    if (!testUser) throw new Error('Test user not created')

    const res = await authRequest<AppResponse>(
      '/v1/apps',
      testUser.sessionToken,
      {
        method: 'POST',
        body: JSON.stringify({
          name: 'E2E Test iOS App',
          platform: 'ios',
        }),
      }
    )

    expect(res.status).toBe(201)
    expect(res.data.app).toBeDefined()
    expect(res.data.app.name).toBe('E2E Test iOS App')
    expect(res.data.app.platform).toBe('ios')
    expect(res.data.app.api_key).toMatch(/^bn_/)
    expect(res.data.app.webhook_secret).toMatch(/^whsec_/)
  })

  it('should create an Android app', async () => {
    if (!testUser) throw new Error('Test user not created')

    const res = await authRequest<AppResponse>(
      '/v1/apps',
      testUser.sessionToken,
      {
        method: 'POST',
        body: JSON.stringify({
          name: 'E2E Test Android App',
          platform: 'android',
        }),
      }
    )

    expect(res.status).toBe(201)
    expect(res.data.app.platform).toBe('android')
  })

  it('should create app with bundle ID', async () => {
    if (!testUser) throw new Error('Test user not created')

    const res = await authRequest<AppResponse>(
      '/v1/apps',
      testUser.sessionToken,
      {
        method: 'POST',
        body: JSON.stringify({
          name: 'E2E App With Bundle',
          platform: 'ios',
          bundleId: 'com.bundlenudge.e2e.test',
        }),
      }
    )

    expect(res.status).toBe(201)
    expect(res.data.app.bundle_id).toBe('com.bundlenudge.e2e.test')
  })

  it('should auto-create default channels', async () => {
    if (!testUser) throw new Error('Test user not created')

    const appRes = await authRequest<AppResponse>(
      '/v1/apps',
      testUser.sessionToken,
      {
        method: 'POST',
        body: JSON.stringify({
          name: 'E2E App Channels Test',
          platform: 'ios',
        }),
      }
    )

    expect(appRes.status).toBe(201)

    // Check channels were created
    const channelsRes = await authRequest<{
      data: { name: string; is_default: number }[]
    }>(
      `/v1/apps/${appRes.data.app.id}/channels`,
      testUser.sessionToken
    )

    expect(channelsRes.status).toBe(200)

    const channelNames = channelsRes.data.data.map((c) => c.name)
    expect(channelNames).toContain('production')
    expect(channelNames).toContain('staging')
    expect(channelNames).toContain('development')

    // Production should be default
    const production = channelsRes.data.data.find((c) => c.name === 'production')
    expect(production?.is_default).toBe(1)
  })

  it('should reject missing name', async () => {
    if (!testUser) throw new Error('Test user not created')

    const res = await authRequest<{ error: string }>(
      '/v1/apps',
      testUser.sessionToken,
      {
        method: 'POST',
        body: JSON.stringify({ platform: 'ios' }),
      }
    )

    expect(res.status).toBe(400)
  })

  it('should reject missing platform', async () => {
    if (!testUser) throw new Error('Test user not created')

    const res = await authRequest<{ error: string }>(
      '/v1/apps',
      testUser.sessionToken,
      {
        method: 'POST',
        body: JSON.stringify({ name: 'Test App' }),
      }
    )

    expect(res.status).toBe(400)
  })

  it('should reject invalid platform', async () => {
    if (!testUser) throw new Error('Test user not created')

    const res = await authRequest<{ error: string }>(
      '/v1/apps',
      testUser.sessionToken,
      {
        method: 'POST',
        body: JSON.stringify({ name: 'Test App', platform: 'windows' }),
      }
    )

    expect(res.status).toBe(400)
  })

  it('should reject name longer than 100 characters', async () => {
    if (!testUser) throw new Error('Test user not created')

    const res = await authRequest<{ error: string }>(
      '/v1/apps',
      testUser.sessionToken,
      {
        method: 'POST',
        body: JSON.stringify({
          name: 'a'.repeat(101),
          platform: 'ios',
        }),
      }
    )

    expect(res.status).toBe(400)
  })

  it('should reject unauthenticated request', async () => {
    const res = await apiRequest<{ error: string }>('/v1/apps', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test', platform: 'ios' }),
    })

    expect(res.status).toBe(401)
  })
})

// =============================================================================
// Get App Tests
// =============================================================================

describe('GET /v1/apps/:appId', () => {
  it('should get app by ID', async () => {
    if (!testUser || !testApp) throw new Error('Test setup failed')

    const res = await authRequest<AppResponse>(
      `/v1/apps/${testApp.id}`,
      testUser.sessionToken
    )

    expect(res.status).toBe(200)
    expect(res.data.app.id).toBe(testApp.id)
    expect(res.data.app.name).toBe(testApp.name)
  })

  it('should include release and device counts', async () => {
    if (!testUser || !testApp) throw new Error('Test setup failed')

    const res = await authRequest<AppResponse>(
      `/v1/apps/${testApp.id}`,
      testUser.sessionToken
    )

    expect(res.status).toBe(200)
    expect(typeof res.data.app.release_count).toBe('number')
    expect(typeof res.data.app.device_count).toBe('number')
  })

  it('should return 404 for non-existent app', async () => {
    if (!testUser) throw new Error('Test user not created')

    const res = await authRequest<{ error: string }>(
      '/v1/apps/00000000-0000-0000-0000-000000000000',
      testUser.sessionToken
    )

    expect(res.status).toBe(404)
    expect(res.data.error).toBe('APP_NOT_FOUND')
  })

  it('should return 404 for another user\'s app', async () => {
    if (!testApp) throw new Error('Test app not created')

    // Create another user
    const otherUser = await createTestUser()

    const res = await authRequest<{ error: string }>(
      `/v1/apps/${testApp.id}`,
      otherUser.sessionToken
    )

    expect(res.status).toBe(404)
    expect(res.data.error).toBe('APP_NOT_FOUND')
  })

  it('should reject unauthenticated request', async () => {
    if (!testApp) throw new Error('Test app not created')

    const res = await apiRequest<{ error: string }>(`/v1/apps/${testApp.id}`)

    expect(res.status).toBe(401)
  })
})

// =============================================================================
// Update App Tests
// =============================================================================

describe('PATCH /v1/apps/:appId', () => {
  let updateTestApp: TestApp | null = null

  beforeEach(async () => {
    if (!testUser) throw new Error('Test user not created')
    updateTestApp = await createTestApp(testUser.sessionToken, {
      name: 'App To Update',
    })
  })

  it('should update app name', async () => {
    if (!testUser || !updateTestApp) throw new Error('Test setup failed')

    const res = await authRequest<AppResponse>(
      `/v1/apps/${updateTestApp.id}`,
      testUser.sessionToken,
      {
        method: 'PATCH',
        body: JSON.stringify({ name: 'Updated App Name' }),
      }
    )

    expect(res.status).toBe(200)
    expect(res.data.app.name).toBe('Updated App Name')
  })

  it('should update bundle ID', async () => {
    if (!testUser || !updateTestApp) throw new Error('Test setup failed')

    const res = await authRequest<AppResponse>(
      `/v1/apps/${updateTestApp.id}`,
      testUser.sessionToken,
      {
        method: 'PATCH',
        body: JSON.stringify({ bundleId: 'com.updated.bundle' }),
      }
    )

    expect(res.status).toBe(200)
    expect(res.data.app.bundle_id).toBe('com.updated.bundle')
  })

  it('should allow setting bundle ID to null', async () => {
    if (!testUser || !updateTestApp) throw new Error('Test setup failed')

    // First set a bundle ID
    await authRequest(
      `/v1/apps/${updateTestApp.id}`,
      testUser.sessionToken,
      {
        method: 'PATCH',
        body: JSON.stringify({ bundleId: 'com.test.app' }),
      }
    )

    // Then clear it
    const res = await authRequest<AppResponse>(
      `/v1/apps/${updateTestApp.id}`,
      testUser.sessionToken,
      {
        method: 'PATCH',
        body: JSON.stringify({ bundleId: null }),
      }
    )

    expect(res.status).toBe(200)
    expect(res.data.app.bundle_id).toBeNull()
  })

  it('should update updated_at timestamp', async () => {
    if (!testUser || !updateTestApp) throw new Error('Test setup failed')

    // Get original app
    const original = await authRequest<AppResponse>(
      `/v1/apps/${updateTestApp.id}`,
      testUser.sessionToken
    )

    // Wait a bit
    await new Promise((r) => setTimeout(r, 1100))

    // Update
    const res = await authRequest<AppResponse>(
      `/v1/apps/${updateTestApp.id}`,
      testUser.sessionToken,
      {
        method: 'PATCH',
        body: JSON.stringify({ name: 'Timestamp Test' }),
      }
    )

    expect(res.data.app.updated_at).toBeGreaterThan(original.data.app.updated_at)
  })

  it('should return 404 for non-existent app', async () => {
    if (!testUser) throw new Error('Test user not created')

    const res = await authRequest<{ error: string }>(
      '/v1/apps/00000000-0000-0000-0000-000000000000',
      testUser.sessionToken,
      {
        method: 'PATCH',
        body: JSON.stringify({ name: 'Test' }),
      }
    )

    expect(res.status).toBe(404)
  })

  it('should return current app if no updates provided', async () => {
    if (!testUser || !updateTestApp) throw new Error('Test setup failed')

    const res = await authRequest<AppResponse>(
      `/v1/apps/${updateTestApp.id}`,
      testUser.sessionToken,
      {
        method: 'PATCH',
        body: JSON.stringify({}),
      }
    )

    expect(res.status).toBe(200)
    expect(res.data.app.id).toBe(updateTestApp.id)
  })
})

// =============================================================================
// Delete App Tests
// =============================================================================

describe('DELETE /v1/apps/:appId', () => {
  it('should soft delete an app', async () => {
    if (!testUser) throw new Error('Test user not created')

    const appToDelete = await createTestApp(testUser.sessionToken, {
      name: 'App To Delete',
    })

    const res = await authRequest<{ success: boolean }>(
      `/v1/apps/${appToDelete.id}`,
      testUser.sessionToken,
      { method: 'DELETE' }
    )

    expect(res.status).toBe(200)
    expect(res.data.success).toBe(true)

    // Verify app is no longer accessible
    const getRes = await authRequest<{ error: string }>(
      `/v1/apps/${appToDelete.id}`,
      testUser.sessionToken
    )

    expect(getRes.status).toBe(404)
  })

  it('should return 404 for non-existent app', async () => {
    if (!testUser) throw new Error('Test user not created')

    const res = await authRequest<{ error: string }>(
      '/v1/apps/00000000-0000-0000-0000-000000000000',
      testUser.sessionToken,
      { method: 'DELETE' }
    )

    expect(res.status).toBe(404)
  })

  it('should not allow other users to delete', async () => {
    if (!testUser) throw new Error('Test user not created')

    const appToDelete = await createTestApp(testUser.sessionToken)
    const otherUser = await createTestUser()

    const res = await authRequest<{ error: string }>(
      `/v1/apps/${appToDelete.id}`,
      otherUser.sessionToken,
      { method: 'DELETE' }
    )

    expect(res.status).toBe(404)
  })
})

// =============================================================================
// API Key Operations Tests
// =============================================================================

describe('POST /v1/apps/:appId/regenerate-key', () => {
  it('should regenerate API key', async () => {
    if (!testUser) throw new Error('Test user not created')

    const app = await createTestApp(testUser.sessionToken)
    const originalKey = app.apiKey

    const res = await authRequest<{ apiKey: string }>(
      `/v1/apps/${app.id}/regenerate-key`,
      testUser.sessionToken,
      { method: 'POST' }
    )

    expect(res.status).toBe(200)
    expect(res.data.apiKey).toBeDefined()
    expect(res.data.apiKey).not.toBe(originalKey)
    expect(res.data.apiKey).toMatch(/^bn_/)
  })

  it('should return 404 for non-existent app', async () => {
    if (!testUser) throw new Error('Test user not created')

    const res = await authRequest<{ error: string }>(
      '/v1/apps/00000000-0000-0000-0000-000000000000/regenerate-key',
      testUser.sessionToken,
      { method: 'POST' }
    )

    expect(res.status).toBe(404)
  })

  it('should not allow other users to regenerate key', async () => {
    if (!testUser) throw new Error('Test user not created')

    const app = await createTestApp(testUser.sessionToken)
    const otherUser = await createTestUser()

    const res = await authRequest<{ error: string }>(
      `/v1/apps/${app.id}/regenerate-key`,
      otherUser.sessionToken,
      { method: 'POST' }
    )

    expect(res.status).toBe(404)
  })
})

// =============================================================================
// App API Keys (Named Keys) Tests
// =============================================================================

describe('App API Keys (Named Keys)', () => {
  describe('GET /v1/apps/:appId/keys', () => {
    it('should list API keys for app', async () => {
      if (!testUser || !testApp) throw new Error('Test setup failed')

      const res = await authRequest<{
        keys: { id: string; name: string; prefix: string }[]
      }>(
        `/v1/apps/${testApp.id}/keys`,
        testUser.sessionToken
      )

      expect(res.status).toBe(200)
      expect(Array.isArray(res.data.keys)).toBe(true)
    })
  })

  describe('POST /v1/apps/:appId/keys', () => {
    it('should create a named API key', async () => {
      if (!testUser || !testApp) throw new Error('Test setup failed')

      const res = await authRequest<{
        key: {
          id: string
          name: string
          prefix: string
        }
        fullKey: string
      }>(
        `/v1/apps/${testApp.id}/keys`,
        testUser.sessionToken,
        {
          method: 'POST',
          body: JSON.stringify({
            name: 'E2E Test Key',
            scopes: ['releases:read', 'releases:write'],
          }),
        }
      )

      expect(res.status).toBe(201)
      expect(res.data.key.name).toBe('E2E Test Key')
      expect(res.data.fullKey).toBeDefined()
      expect(res.data.fullKey.length).toBeGreaterThan(20)
    })

    it('should reject duplicate key name', async () => {
      if (!testUser || !testApp) throw new Error('Test setup failed')

      const keyName = `E2E Duplicate Key ${Date.now()}`

      // Create first key
      await authRequest(
        `/v1/apps/${testApp.id}/keys`,
        testUser.sessionToken,
        {
          method: 'POST',
          body: JSON.stringify({ name: keyName, scopes: ['releases:read'] }),
        }
      )

      // Try to create duplicate
      const res = await authRequest<{ error: string }>(
        `/v1/apps/${testApp.id}/keys`,
        testUser.sessionToken,
        {
          method: 'POST',
          body: JSON.stringify({ name: keyName, scopes: ['releases:read'] }),
        }
      )

      expect(res.status).toBe(409)
    })
  })

  describe('DELETE /v1/apps/:appId/keys/:keyId', () => {
    it('should delete an API key', async () => {
      if (!testUser || !testApp) throw new Error('Test setup failed')

      // Create a key
      const createRes = await authRequest<{
        key: { id: string }
      }>(
        `/v1/apps/${testApp.id}/keys`,
        testUser.sessionToken,
        {
          method: 'POST',
          body: JSON.stringify({
            name: `E2E Delete Key ${Date.now()}`,
            scopes: ['releases:read'],
          }),
        }
      )

      // Delete it
      const deleteRes = await authRequest<{ success: boolean }>(
        `/v1/apps/${testApp.id}/keys/${createRes.data.key.id}`,
        testUser.sessionToken,
        { method: 'DELETE' }
      )

      expect(deleteRes.status).toBe(200)
      expect(deleteRes.data.success).toBe(true)
    })
  })
})
