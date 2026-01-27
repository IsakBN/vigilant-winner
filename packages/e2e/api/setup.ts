/**
 * E2E Test Setup
 *
 * Provides helpers for API E2E tests that hit the real API.
 * Includes auth helpers, cleanup utilities, and test user management.
 */

// =============================================================================
// Configuration
// =============================================================================

/**
 * API base URL from environment or default to local development
 */
export const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:8787'

/**
 * Test user email prefix for cleanup
 */
const TEST_EMAIL_PREFIX = 'e2e-test-'

/**
 * Test user email domain
 */
const TEST_EMAIL_DOMAIN = '@bundlenudge-test.com'

// =============================================================================
// Types
// =============================================================================

export interface TestUser {
  id: string
  email: string
  password: string
  name: string
  sessionToken: string
}

export interface TestApp {
  id: string
  name: string
  platform: 'ios' | 'android'
  apiKey: string
}

export interface TestRelease {
  id: string
  appId: string
  version: string
  bundleUrl: string
  bundleHash: string
}

interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}

interface SignupResponse {
  success: boolean
  message: string
  userId: string
}

interface LoginResponse {
  success: boolean
  message?: string
  error?: string
  user: {
    id: string
    email: string
    name: string | null
    emailVerified: boolean
  }
  session: {
    token: string
    expiresAt: string
  }
}

interface AppResponse {
  app: {
    id: string
    name: string
    platform: 'ios' | 'android'
    api_key: string
    bundle_id: string | null
    owner_id: string
    created_at: number
    updated_at: number
  }
}

interface ReleaseResponse {
  release: {
    id: string
    app_id: string
    version: string
    bundle_url: string
    bundle_hash: string
    bundle_size: number
    status: string
    rollout_percentage: number
    created_at: number
    updated_at: number
  }
}

// =============================================================================
// Test State Management
// =============================================================================

/**
 * Track created test resources for cleanup
 */
const createdUsers: string[] = []
const createdApps: string[] = []
const createdReleases: string[] = []

// =============================================================================
// HTTP Helpers
// =============================================================================

/**
 * Make an API request with proper headers
 */
export async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<{ status: number; data: T }> {
  const url = `${API_BASE_URL}${path}`

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }

  const response = await fetch(url, {
    ...options,
    headers,
  })

  const data = await response.json().catch(() => ({})) as T

  return { status: response.status, data }
}

/**
 * Make an authenticated API request
 */
export async function authRequest<T>(
  path: string,
  sessionToken: string,
  options: RequestInit = {}
): Promise<{ status: number; data: T }> {
  return apiRequest<T>(path, {
    ...options,
    headers: {
      ...options.headers as Record<string, string>,
      Authorization: `Bearer ${sessionToken}`,
    },
  })
}

// =============================================================================
// Auth Helpers
// =============================================================================

/**
 * Generate a unique test email
 */
export function generateTestEmail(): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(7)
  return `${TEST_EMAIL_PREFIX}${timestamp}-${random}${TEST_EMAIL_DOMAIN}`
}

/**
 * Generate a valid test password
 */
export function generateTestPassword(): string {
  // Must meet password requirements: 8+ chars, mixed case, number, special
  return `TestPass123!${Math.random().toString(36).substring(7)}`
}

/**
 * Create a test user and get session token
 */
export async function createTestUser(
  overrides: Partial<{ email: string; password: string; name: string }> = {}
): Promise<TestUser> {
  const email = overrides.email ?? generateTestEmail()
  const password = overrides.password ?? generateTestPassword()
  const name = overrides.name ?? 'E2E Test User'

  // Sign up
  const signupRes = await apiRequest<SignupResponse>('/v1/auth/email/signup', {
    method: 'POST',
    body: JSON.stringify({ email, password, name }),
  })

  if (signupRes.status !== 200 || !signupRes.data.success) {
    throw new Error(`Failed to create test user: ${signupRes.data.message}`)
  }

  const userId = signupRes.data.userId
  createdUsers.push(userId)

  // Login to get session token
  const loginRes = await apiRequest<LoginResponse>('/v1/auth/email/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })

  if (signupRes.status !== 200 || !loginRes.data.success) {
    throw new Error(`Failed to login test user: ${loginRes.data.message}`)
  }

  return {
    id: userId,
    email,
    password,
    name,
    sessionToken: loginRes.data.session.token,
  }
}

/**
 * Login an existing user
 */
export async function loginUser(
  email: string,
  password: string
): Promise<{ sessionToken: string; user: LoginResponse['user'] }> {
  const res = await apiRequest<LoginResponse>('/v1/auth/email/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })

  if (res.status !== 200 || !res.data.success) {
    throw new Error(`Login failed: ${res.data.message}`)
  }

  return {
    sessionToken: res.data.session.token,
    user: res.data.user,
  }
}

// =============================================================================
// App Helpers
// =============================================================================

/**
 * Create a test app
 */
export async function createTestApp(
  sessionToken: string,
  overrides: Partial<{ name: string; platform: 'ios' | 'android'; bundleId: string }> = {}
): Promise<TestApp> {
  const name = overrides.name ?? `e2e-test-app-${Date.now()}`
  const platform = overrides.platform ?? 'ios'

  const res = await authRequest<AppResponse>('/v1/apps', sessionToken, {
    method: 'POST',
    body: JSON.stringify({
      name,
      platform,
      bundleId: overrides.bundleId,
    }),
  })

  if (res.status !== 201) {
    throw new Error(`Failed to create test app: ${JSON.stringify(res.data)}`)
  }

  const app = res.data.app
  createdApps.push(app.id)

  return {
    id: app.id,
    name: app.name,
    platform: app.platform,
    apiKey: app.api_key,
  }
}

/**
 * Delete a test app
 */
export async function deleteTestApp(
  sessionToken: string,
  appId: string
): Promise<void> {
  await authRequest('/v1/apps/' + appId, sessionToken, {
    method: 'DELETE',
  })
}

// =============================================================================
// Release Helpers
// =============================================================================

/**
 * Create a test release (metadata only)
 */
export async function createTestRelease(
  sessionToken: string,
  appId: string,
  overrides: Partial<{
    version: string
    releaseNotes: string
    minAppVersion: string
    maxAppVersion: string
  }> = {}
): Promise<TestRelease> {
  const version = overrides.version ?? `1.0.${Date.now() % 1000}`

  const res = await authRequest<ReleaseResponse>(
    `/v1/releases/${appId}`,
    sessionToken,
    {
      method: 'POST',
      body: JSON.stringify({
        version,
        releaseNotes: overrides.releaseNotes,
        minAppVersion: overrides.minAppVersion,
        maxAppVersion: overrides.maxAppVersion,
      }),
    }
  )

  if (res.status !== 201) {
    throw new Error(`Failed to create test release: ${JSON.stringify(res.data)}`)
  }

  const release = res.data.release
  createdReleases.push(release.id)

  return {
    id: release.id,
    appId: release.app_id,
    version: release.version,
    bundleUrl: release.bundle_url,
    bundleHash: release.bundle_hash,
  }
}

/**
 * Upload a bundle for a release
 */
export async function uploadTestBundle(
  sessionToken: string,
  appId: string,
  releaseId: string,
  bundleContent: string = 'console.log("test bundle");'
): Promise<{ bundleUrl: string; bundleHash: string }> {
  const url = `${API_BASE_URL}/v1/releases/${appId}/${releaseId}/bundle`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/octet-stream',
      Authorization: `Bearer ${sessionToken}`,
    },
    body: new TextEncoder().encode(bundleContent),
  })

  const data = await response.json() as {
    release?: { bundle_url: string; bundle_hash: string }
    bundleUrl?: string
    bundleHash?: string
    error?: string
  }

  if (response.status !== 200) {
    throw new Error(`Failed to upload bundle: ${JSON.stringify(data)}`)
  }

  return {
    bundleUrl: data.bundleUrl ?? data.release?.bundle_url ?? '',
    bundleHash: data.release?.bundle_hash ?? '',
  }
}

/**
 * Activate a release (set status to active)
 */
export async function activateRelease(
  sessionToken: string,
  appId: string,
  releaseId: string
): Promise<void> {
  const res = await authRequest(
    `/v1/releases/${appId}/${releaseId}`,
    sessionToken,
    {
      method: 'PATCH',
      body: JSON.stringify({ status: 'active' }),
    }
  )

  if (res.status !== 200) {
    throw new Error(`Failed to activate release: ${JSON.stringify(res.data)}`)
  }
}

// =============================================================================
// Update Check Helpers
// =============================================================================

/**
 * Perform an update check
 */
export async function checkForUpdate(params: {
  appId: string
  deviceId: string
  platform: 'ios' | 'android'
  appVersion: string
  currentBundleVersion?: string
  currentBundleHash?: string
  channel?: string
  deviceInfo?: {
    osVersion?: string
    deviceModel?: string
    timezone?: string
    locale?: string
  }
}): Promise<{
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
}> {
  const res = await apiRequest<{
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
  }>('/v1/updates/check', {
    method: 'POST',
    body: JSON.stringify(params),
  })

  return res.data
}

// =============================================================================
// Cleanup
// =============================================================================

/**
 * Clean up all test resources created during tests
 * Call this in afterAll() or afterEach()
 */
export async function cleanupTestResources(sessionToken?: string): Promise<void> {
  if (!sessionToken) {
    // Clear tracking arrays even without cleanup
    createdUsers.length = 0
    createdApps.length = 0
    createdReleases.length = 0
    return
  }

  // Delete apps (which cascades to releases)
  for (const appId of createdApps) {
    try {
      await deleteTestApp(sessionToken, appId)
    } catch {
      // Ignore cleanup errors
    }
  }

  // Clear tracking arrays
  createdUsers.length = 0
  createdApps.length = 0
  createdReleases.length = 0
}

// =============================================================================
// Test Utilities
// =============================================================================

/**
 * Wait for a specified amount of time
 */
export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Generate a random device ID
 */
export function generateDeviceId(): string {
  return `e2e-device-${Date.now()}-${Math.random().toString(36).substring(7)}`
}

/**
 * Assert that a response has a specific error code
 */
export function expectError(
  response: { status: number; data: ApiResponse<unknown> },
  expectedStatus: number,
  expectedError?: string
): void {
  if (response.status !== expectedStatus) {
    throw new Error(
      `Expected status ${String(expectedStatus)}, got ${String(response.status)}: ${JSON.stringify(response.data)}`
    )
  }

  if (expectedError && response.data.error !== expectedError) {
    throw new Error(
      `Expected error ${expectedError}, got ${String(response.data.error)}`
    )
  }
}

// =============================================================================
// Vitest Setup
// =============================================================================

/**
 * Check if API is available before running tests
 */
export async function checkApiAvailability(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/health`)
    return res.ok
  } catch {
    return false
  }
}

/**
 * Skip tests if API is not available
 */
export async function skipIfApiUnavailable(): Promise<void> {
  const available = await checkApiAvailability()
  if (!available) {
    console.warn(`API not available at ${API_BASE_URL}, skipping E2E tests`)
    process.exit(0)
  }
}
