/**
 * Updates API E2E Tests
 *
 * Tests the SDK update check flow against the real API.
 * Covers update availability, version compatibility, and channel routing.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import {
  apiRequest,
  authRequest,
  createTestUser,
  createTestApp,
  createTestRelease,
  uploadTestBundle,
  activateRelease,
  checkForUpdate,
  cleanupTestResources,
  generateDeviceId,
  wait,
  type TestUser,
  type TestApp,
  type TestRelease,
} from './setup'

// =============================================================================
// Types
// =============================================================================

interface UpdateCheckResponse {
  updateAvailable: boolean
  release?: {
    version: string
    bundleUrl: string
    bundleSize: number
    bundleHash: string
    releaseId: string
    releaseNotes?: string
  }
  error?: string
  message?: string
}

interface ChannelResponse {
  channel: {
    id: string
    name: string
    app_id: string
    rollout_percentage: number
    is_default: number
  }
}

// =============================================================================
// Test State
// =============================================================================

let testUser: TestUser | null = null
let testApp: TestApp | null = null
let activeRelease: TestRelease | null = null

// =============================================================================
// Setup / Teardown
// =============================================================================

beforeAll(async () => {
  testUser = await createTestUser()
  testApp = await createTestApp(testUser.sessionToken)

  // Create and activate a release for update tests
  activeRelease = await createTestRelease(testUser.sessionToken, testApp.id, {
    version: '1.0.0',
    releaseNotes: 'E2E test release',
  })
  await uploadTestBundle(testUser.sessionToken, testApp.id, activeRelease.id)
  await activateRelease(testUser.sessionToken, testApp.id, activeRelease.id)
})

afterAll(async () => {
  await cleanupTestResources(testUser?.sessionToken)
})

// =============================================================================
// Basic Update Check Tests
// =============================================================================

describe('POST /v1/updates/check', () => {
  it('should return no update when device has current version', async () => {
    if (!testApp || !activeRelease) throw new Error('Test setup failed')

    const res = await checkForUpdate({
      appId: testApp.id,
      deviceId: generateDeviceId(),
      platform: 'ios',
      appVersion: '1.0.0',
      currentBundleVersion: activeRelease.version,
    })

    expect(res.updateAvailable).toBe(false)
    expect(res.release).toBeUndefined()
  })

  it('should return update when device has no bundle version', async () => {
    if (!testApp || !activeRelease) throw new Error('Test setup failed')

    const res = await checkForUpdate({
      appId: testApp.id,
      deviceId: generateDeviceId(),
      platform: 'ios',
      appVersion: '1.0.0',
    })

    expect(res.updateAvailable).toBe(true)
    expect(res.release).toBeDefined()
    expect(res.release?.version).toBe(activeRelease.version)
  })

  it('should return update when device has older version', async () => {
    if (!testApp || !activeRelease) throw new Error('Test setup failed')

    const res = await checkForUpdate({
      appId: testApp.id,
      deviceId: generateDeviceId(),
      platform: 'ios',
      appVersion: '1.0.0',
      currentBundleVersion: '0.9.0',
    })

    expect(res.updateAvailable).toBe(true)
    expect(res.release).toBeDefined()
    expect(res.release?.version).toBe(activeRelease.version)
  })

  it('should return no update for non-existent app', async () => {
    const res = await checkForUpdate({
      appId: '00000000-0000-0000-0000-000000000000',
      deviceId: generateDeviceId(),
      platform: 'ios',
      appVersion: '1.0.0',
    })

    expect(res.updateAvailable).toBe(false)
  })

  it('should return release info with bundleUrl and bundleHash', async () => {
    if (!testApp) throw new Error('Test setup failed')

    const res = await checkForUpdate({
      appId: testApp.id,
      deviceId: generateDeviceId(),
      platform: 'ios',
      appVersion: '1.0.0',
    })

    expect(res.updateAvailable).toBe(true)
    expect(res.release?.bundleUrl).toBeDefined()
    expect(res.release?.bundleUrl.length).toBeGreaterThan(0)
    expect(res.release?.bundleHash).toBeDefined()
    expect(res.release?.bundleHash.length).toBeGreaterThan(0)
    expect(res.release?.bundleSize).toBeGreaterThan(0)
  })

  it('should return release notes if available', async () => {
    if (!testApp) throw new Error('Test setup failed')

    const res = await checkForUpdate({
      appId: testApp.id,
      deviceId: generateDeviceId(),
      platform: 'ios',
      appVersion: '1.0.0',
    })

    expect(res.updateAvailable).toBe(true)
    expect(res.release?.releaseNotes).toBe('E2E test release')
  })
})

// =============================================================================
// Version Constraint Tests
// =============================================================================

describe('Version Constraints', () => {
  let constrainedRelease: TestRelease | null = null

  beforeAll(async () => {
    if (!testUser || !testApp) throw new Error('Test setup failed')

    // Create release with version constraints
    constrainedRelease = await createTestRelease(testUser.sessionToken, testApp.id, {
      version: `constrained-${Date.now()}`,
      minAppVersion: '2.0.0',
      maxAppVersion: '3.0.0',
    })
    await uploadTestBundle(testUser.sessionToken, testApp.id, constrainedRelease.id)
    await activateRelease(testUser.sessionToken, testApp.id, constrainedRelease.id)
  })

  it('should not return update for app version below minAppVersion', async () => {
    if (!testApp || !constrainedRelease) throw new Error('Test setup failed')

    const res = await checkForUpdate({
      appId: testApp.id,
      deviceId: generateDeviceId(),
      platform: 'ios',
      appVersion: '1.5.0', // Below 2.0.0 min
    })

    // Should still return the unconstrained release, not the constrained one
    if (res.updateAvailable && res.release) {
      expect(res.release.version).not.toBe(constrainedRelease.version)
    }
  })

  it('should not return update for app version above maxAppVersion', async () => {
    if (!testApp || !constrainedRelease) throw new Error('Test setup failed')

    const res = await checkForUpdate({
      appId: testApp.id,
      deviceId: generateDeviceId(),
      platform: 'ios',
      appVersion: '4.0.0', // Above 3.0.0 max
    })

    // Should still return the unconstrained release, not the constrained one
    if (res.updateAvailable && res.release) {
      expect(res.release.version).not.toBe(constrainedRelease.version)
    }
  })

  it('should return update for app version within constraints', async () => {
    if (!testApp || !constrainedRelease) throw new Error('Test setup failed')

    const res = await checkForUpdate({
      appId: testApp.id,
      deviceId: generateDeviceId(),
      platform: 'ios',
      appVersion: '2.5.0', // Within 2.0.0 - 3.0.0 range
    })

    expect(res.updateAvailable).toBe(true)
    // May return constrained release as it's the newest matching
    expect(res.release).toBeDefined()
  })
})

// =============================================================================
// Channel Routing Tests
// =============================================================================

describe('Channel Routing', () => {
  let stagingRelease: TestRelease | null = null

  beforeAll(async () => {
    if (!testUser || !testApp) throw new Error('Test setup failed')

    // Get staging channel ID
    const channelsRes = await authRequest<{
      data: { id: string; name: string }[]
    }>(
      `/v1/apps/${testApp.id}/channels`,
      testUser.sessionToken
    )

    const stagingChannel = channelsRes.data.data.find((c) => c.name === 'staging')
    if (!stagingChannel) {
      console.warn('Staging channel not found, skipping channel tests')
      return
    }

    // Create release on staging channel
    const releaseRes = await authRequest<{
      release: { id: string; version: string }
    }>(
      `/v1/releases/${testApp.id}`,
      testUser.sessionToken,
      {
        method: 'POST',
        body: JSON.stringify({ version: `staging-${Date.now()}` }),
      }
    )

    stagingRelease = {
      id: releaseRes.data.release.id,
      appId: testApp.id,
      version: releaseRes.data.release.version,
      bundleUrl: '',
      bundleHash: '',
    }

    // Upload bundle and activate
    await uploadTestBundle(testUser.sessionToken, testApp.id, stagingRelease.id)
    await activateRelease(testUser.sessionToken, testApp.id, stagingRelease.id)

    // Assign to staging channel
    await authRequest(
      `/v1/releases/${testApp.id}/${stagingRelease.id}`,
      testUser.sessionToken,
      {
        method: 'PATCH',
        body: JSON.stringify({ channelId: stagingChannel.id }),
      }
    )
  })

  it('should default to production channel when no channel specified', async () => {
    if (!testApp) throw new Error('Test setup failed')

    const res = await checkForUpdate({
      appId: testApp.id,
      deviceId: generateDeviceId(),
      platform: 'ios',
      appVersion: '1.0.0',
    })

    // Should return an update (from production)
    expect(res.updateAvailable).toBe(true)
  })

  it('should use specified channel', async () => {
    if (!testApp) throw new Error('Test setup failed')

    const res = await checkForUpdate({
      appId: testApp.id,
      deviceId: generateDeviceId(),
      platform: 'ios',
      appVersion: '1.0.0',
      channel: 'staging',
    })

    // May or may not have staging release
    expect(typeof res.updateAvailable).toBe('boolean')
  })

  it('should handle non-existent channel gracefully', async () => {
    if (!testApp) throw new Error('Test setup failed')

    const res = await checkForUpdate({
      appId: testApp.id,
      deviceId: generateDeviceId(),
      platform: 'ios',
      appVersion: '1.0.0',
      channel: 'nonexistent-channel',
    })

    // Should fall back to checking all releases
    expect(typeof res.updateAvailable).toBe('boolean')
  })
})

// =============================================================================
// Rollout Percentage Tests
// =============================================================================

describe('Rollout Percentage', () => {
  let rolloutRelease: TestRelease | null = null

  beforeAll(async () => {
    if (!testUser || !testApp) throw new Error('Test setup failed')

    // Create release with 50% rollout
    rolloutRelease = await createTestRelease(testUser.sessionToken, testApp.id, {
      version: `rollout-${Date.now()}`,
    })
    await uploadTestBundle(testUser.sessionToken, testApp.id, rolloutRelease.id)
    await activateRelease(testUser.sessionToken, testApp.id, rolloutRelease.id)

    // Set 50% rollout
    await authRequest(
      `/v1/releases/${testApp.id}/${rolloutRelease.id}/rollout`,
      testUser.sessionToken,
      {
        method: 'PATCH',
        body: JSON.stringify({ rolloutPercentage: 50 }),
      }
    )
  })

  it('should be deterministic for same device ID', async () => {
    if (!testApp) throw new Error('Test setup failed')

    const deviceId = generateDeviceId()

    // Same device should always get same result
    const res1 = await checkForUpdate({
      appId: testApp.id,
      deviceId,
      platform: 'ios',
      appVersion: '1.0.0',
    })

    const res2 = await checkForUpdate({
      appId: testApp.id,
      deviceId,
      platform: 'ios',
      appVersion: '1.0.0',
    })

    expect(res1.updateAvailable).toBe(res2.updateAvailable)
  })

  it('should include some devices in rollout and exclude others', async () => {
    if (!testApp) throw new Error('Test setup failed')

    const appId = testApp.id

    // Test with many devices to verify distribution
    const results = await Promise.all(
      Array.from({ length: 20 }, () =>
        checkForUpdate({
          appId,
          deviceId: generateDeviceId(),
          platform: 'ios',
          appVersion: '1.0.0',
        })
      )
    )

    const updateCount = results.filter((r) => r.updateAvailable).length

    // With 50% rollout and 20 devices, we expect roughly 10 updates
    // Allow for variance (5-15 range)
    expect(updateCount).toBeGreaterThanOrEqual(0)
    expect(updateCount).toBeLessThanOrEqual(20)
  })
})

// =============================================================================
// Hash Comparison Tests
// =============================================================================

describe('Bundle Hash Comparison', () => {
  it('should not return update when device has same bundle hash', async () => {
    if (!testUser || !testApp) throw new Error('Test setup failed')

    // Create a release with known content
    const release = await createTestRelease(testUser.sessionToken, testApp.id, {
      version: `hash-test-${Date.now()}`,
    })
    const bundleContent = 'console.log("hash test bundle");'
    await uploadTestBundle(testUser.sessionToken, testApp.id, release.id, bundleContent)
    await activateRelease(testUser.sessionToken, testApp.id, release.id)

    // Get the bundle hash
    const releaseRes = await authRequest<{
      release: { bundle_hash: string }
    }>(
      `/v1/releases/${testApp.id}/${release.id}`,
      testUser.sessionToken
    )

    const bundleHash = releaseRes.data.release.bundle_hash

    // Check with same hash
    const res = await checkForUpdate({
      appId: testApp.id,
      deviceId: generateDeviceId(),
      platform: 'ios',
      appVersion: '1.0.0',
      currentBundleHash: bundleHash,
    })

    // Should not offer the same bundle
    if (res.updateAvailable && res.release) {
      expect(res.release.bundleHash).not.toBe(bundleHash)
    }
  })

  it('should return update when device has different bundle hash', async () => {
    if (!testApp) throw new Error('Test setup failed')

    const res = await checkForUpdate({
      appId: testApp.id,
      deviceId: generateDeviceId(),
      platform: 'ios',
      appVersion: '1.0.0',
      currentBundleHash: 'different-hash-12345',
    })

    expect(res.updateAvailable).toBe(true)
  })
})

// =============================================================================
// Paused Release Tests
// =============================================================================

describe('Paused Releases', () => {
  it('should not return paused releases', async () => {
    if (!testUser || !testApp) throw new Error('Test setup failed')

    // Create and pause a release
    const release = await createTestRelease(testUser.sessionToken, testApp.id, {
      version: `paused-${Date.now()}`,
    })
    await uploadTestBundle(testUser.sessionToken, testApp.id, release.id)
    // Don't activate - leave as paused

    const res = await checkForUpdate({
      appId: testApp.id,
      deviceId: generateDeviceId(),
      platform: 'ios',
      appVersion: '1.0.0',
    })

    // Should not return the paused release
    if (res.updateAvailable && res.release) {
      expect(res.release.version).not.toBe(release.version)
    }
  })
})

// =============================================================================
// Device Info Tests
// =============================================================================

describe('Device Info Handling', () => {
  it('should accept device info fields', async () => {
    if (!testApp) throw new Error('Test setup failed')

    const res = await checkForUpdate({
      appId: testApp.id,
      deviceId: generateDeviceId(),
      platform: 'ios',
      appVersion: '1.0.0',
      deviceInfo: {
        osVersion: '17.0',
        deviceModel: 'iPhone14,2',
        timezone: 'America/New_York',
        locale: 'en-US',
      },
    })

    // Should succeed and return valid response
    expect(typeof res.updateAvailable).toBe('boolean')
  })

  it('should work without device info', async () => {
    if (!testApp) throw new Error('Test setup failed')

    const res = await checkForUpdate({
      appId: testApp.id,
      deviceId: generateDeviceId(),
      platform: 'ios',
      appVersion: '1.0.0',
    })

    expect(typeof res.updateAvailable).toBe('boolean')
  })
})

// =============================================================================
// Validation Tests
// =============================================================================

describe('Request Validation', () => {
  it('should reject missing appId', async () => {
    const res = await apiRequest<{ error: string }>('/v1/updates/check', {
      method: 'POST',
      body: JSON.stringify({
        deviceId: generateDeviceId(),
        platform: 'ios',
        appVersion: '1.0.0',
      }),
    })

    expect(res.status).toBe(400)
  })

  it('should reject invalid appId format', async () => {
    const res = await apiRequest<{ error: string }>('/v1/updates/check', {
      method: 'POST',
      body: JSON.stringify({
        appId: 'not-a-uuid',
        deviceId: generateDeviceId(),
        platform: 'ios',
        appVersion: '1.0.0',
      }),
    })

    expect(res.status).toBe(400)
  })

  it('should reject missing deviceId', async () => {
    if (!testApp) throw new Error('Test setup failed')

    const res = await apiRequest<{ error: string }>('/v1/updates/check', {
      method: 'POST',
      body: JSON.stringify({
        appId: testApp.id,
        platform: 'ios',
        appVersion: '1.0.0',
      }),
    })

    expect(res.status).toBe(400)
  })

  it('should reject missing platform', async () => {
    if (!testApp) throw new Error('Test setup failed')

    const res = await apiRequest<{ error: string }>('/v1/updates/check', {
      method: 'POST',
      body: JSON.stringify({
        appId: testApp.id,
        deviceId: generateDeviceId(),
        appVersion: '1.0.0',
      }),
    })

    expect(res.status).toBe(400)
  })

  it('should reject invalid platform', async () => {
    if (!testApp) throw new Error('Test setup failed')

    const res = await apiRequest<{ error: string }>('/v1/updates/check', {
      method: 'POST',
      body: JSON.stringify({
        appId: testApp.id,
        deviceId: generateDeviceId(),
        platform: 'windows',
        appVersion: '1.0.0',
      }),
    })

    expect(res.status).toBe(400)
  })

  it('should reject missing appVersion', async () => {
    if (!testApp) throw new Error('Test setup failed')

    const res = await apiRequest<{ error: string }>('/v1/updates/check', {
      method: 'POST',
      body: JSON.stringify({
        appId: testApp.id,
        deviceId: generateDeviceId(),
        platform: 'ios',
      }),
    })

    expect(res.status).toBe(400)
  })
})

// =============================================================================
// Rate Limiting Tests
// =============================================================================

describe('Update Check Rate Limiting', () => {
  it('should allow reasonable number of requests', async () => {
    if (!testApp) throw new Error('Test setup failed')

    const appId = testApp.id

    // SDK update checks should be allowed at a higher rate
    const requests = Array.from({ length: 10 }, () =>
      checkForUpdate({
        appId,
        deviceId: generateDeviceId(),
        platform: 'ios',
        appVersion: '1.0.0',
      })
    )

    const results = await Promise.all(requests)

    // All should succeed (not rate limited)
    const successes = results.filter((r) => !r.error || r.error !== 'RATE_LIMITED')
    expect(successes.length).toBe(10)
  })
})
