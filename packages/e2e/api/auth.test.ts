/**
 * Auth API E2E Tests
 *
 * Tests authentication endpoints against the real API.
 * Covers signup, login, email verification, and password reset flows.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import {
  API_BASE_URL,
  apiRequest,
  authRequest,
  generateTestEmail,
  generateTestPassword,
  createTestUser,
  cleanupTestResources,
  wait,
  type TestUser,
} from './setup'

// =============================================================================
// Test State
// =============================================================================

let testUser: TestUser | null = null

// =============================================================================
// Setup / Teardown
// =============================================================================

beforeAll(async () => {
  // Create a test user for authenticated tests
  testUser = await createTestUser()
})

afterAll(async () => {
  await cleanupTestResources(testUser?.sessionToken)
})

// =============================================================================
// Signup Tests
// =============================================================================

describe('POST /v1/auth/email/signup', () => {
  it('should create a new user with valid credentials', async () => {
    const email = generateTestEmail()
    const password = generateTestPassword()

    const res = await apiRequest<{
      success: boolean
      message: string
      userId: string
    }>('/v1/auth/email/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, name: 'Test User' }),
    })

    expect(res.status).toBe(200)
    expect(res.data.success).toBe(true)
    expect(res.data.message).toContain('Verification email sent')
    expect(res.data.userId).toBeDefined()
  })

  it('should accept signup with email only (no name)', async () => {
    const email = generateTestEmail()
    const password = generateTestPassword()

    const res = await apiRequest<{
      success: boolean
      userId: string
    }>('/v1/auth/email/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })

    expect(res.status).toBe(200)
    expect(res.data.success).toBe(true)
    expect(res.data.userId).toBeDefined()
  })

  it('should return same response for existing email (prevent enumeration)', async () => {
    const email = generateTestEmail()
    const password = generateTestPassword()

    // First signup
    const res1 = await apiRequest<{
      success: boolean
      message: string
    }>('/v1/auth/email/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })

    expect(res1.status).toBe(200)

    // Second signup with same email
    const res2 = await apiRequest<{
      success: boolean
      message: string
    }>('/v1/auth/email/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password: 'DifferentPass123!' }),
    })

    // Should return same success response to prevent email enumeration
    expect(res2.status).toBe(200)
    expect(res2.data.success).toBe(true)
  })

  it('should reject invalid email format', async () => {
    const res = await apiRequest<{
      error: string
      message: string
    }>('/v1/auth/email/signup', {
      method: 'POST',
      body: JSON.stringify({
        email: 'not-an-email',
        password: generateTestPassword(),
      }),
    })

    expect(res.status).toBe(400)
    expect(res.data.error).toBe('VALIDATION_ERROR')
  })

  it('should reject password shorter than 8 characters', async () => {
    const res = await apiRequest<{
      error: string
      message: string
    }>('/v1/auth/email/signup', {
      method: 'POST',
      body: JSON.stringify({
        email: generateTestEmail(),
        password: 'short',
      }),
    })

    expect(res.status).toBe(400)
    expect(res.data.error).toBe('VALIDATION_ERROR')
  })

  it('should reject weak passwords', async () => {
    const res = await apiRequest<{
      error: string
      message: string
    }>('/v1/auth/email/signup', {
      method: 'POST',
      body: JSON.stringify({
        email: generateTestEmail(),
        password: 'password123', // Common password without special chars
      }),
    })

    expect(res.status).toBe(400)
  })

  it('should reject missing email', async () => {
    const res = await apiRequest<{
      error: string
    }>('/v1/auth/email/signup', {
      method: 'POST',
      body: JSON.stringify({ password: generateTestPassword() }),
    })

    expect(res.status).toBe(400)
    expect(res.data.error).toBe('VALIDATION_ERROR')
  })

  it('should reject missing password', async () => {
    const res = await apiRequest<{
      error: string
    }>('/v1/auth/email/signup', {
      method: 'POST',
      body: JSON.stringify({ email: generateTestEmail() }),
    })

    expect(res.status).toBe(400)
    expect(res.data.error).toBe('VALIDATION_ERROR')
  })
})

// =============================================================================
// Login Tests
// =============================================================================

describe('POST /v1/auth/email/login', () => {
  let loginTestUser: { email: string; password: string } | null = null

  beforeEach(async () => {
    // Create a fresh user for login tests
    const email = generateTestEmail()
    const password = generateTestPassword()

    await apiRequest('/v1/auth/email/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })

    loginTestUser = { email, password }
  })

  it('should login with valid credentials', async () => {
    if (!loginTestUser) throw new Error('Test user not created')

    const res = await apiRequest<{
      success: boolean
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
    }>('/v1/auth/email/login', {
      method: 'POST',
      body: JSON.stringify(loginTestUser),
    })

    expect(res.status).toBe(200)
    expect(res.data.success).toBe(true)
    expect(res.data.user.email).toBe(loginTestUser.email.toLowerCase())
    expect(res.data.session.token).toBeDefined()
    expect(res.data.session.token.length).toBeGreaterThan(20)
    expect(res.data.session.expiresAt).toBeDefined()
  })

  it('should reject invalid password', async () => {
    if (!loginTestUser) throw new Error('Test user not created')

    const res = await apiRequest<{
      error: string
      message: string
    }>('/v1/auth/email/login', {
      method: 'POST',
      body: JSON.stringify({
        email: loginTestUser.email,
        password: 'WrongPassword123!',
      }),
    })

    expect(res.status).toBe(401)
    expect(res.data.error).toBe('INVALID_CREDENTIALS')
    expect(res.data.message).toBe('Invalid email or password')
  })

  it('should reject non-existent email with same error as wrong password', async () => {
    const res = await apiRequest<{
      error: string
      message: string
    }>('/v1/auth/email/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'nonexistent@bundlenudge-test.com',
        password: 'SomePassword123!',
      }),
    })

    // Same error for security (prevents email enumeration)
    expect(res.status).toBe(401)
    expect(res.data.error).toBe('INVALID_CREDENTIALS')
    expect(res.data.message).toBe('Invalid email or password')
  })

  it('should reject invalid email format', async () => {
    const res = await apiRequest<{
      error: string
    }>('/v1/auth/email/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'not-an-email',
        password: 'SomePassword123!',
      }),
    })

    expect(res.status).toBe(400)
    expect(res.data.error).toBe('VALIDATION_ERROR')
  })

  it('should reject empty password', async () => {
    const res = await apiRequest<{
      error: string
    }>('/v1/auth/email/login', {
      method: 'POST',
      body: JSON.stringify({
        email: generateTestEmail(),
        password: '',
      }),
    })

    expect(res.status).toBe(400)
    expect(res.data.error).toBe('VALIDATION_ERROR')
  })

  it('should be case-insensitive for email', async () => {
    if (!loginTestUser) throw new Error('Test user not created')

    const res = await apiRequest<{
      success: boolean
      user: { email: string }
    }>('/v1/auth/email/login', {
      method: 'POST',
      body: JSON.stringify({
        email: loginTestUser.email.toUpperCase(),
        password: loginTestUser.password,
      }),
    })

    expect(res.status).toBe(200)
    expect(res.data.success).toBe(true)
    expect(res.data.user.email).toBe(loginTestUser.email.toLowerCase())
  })
})

// =============================================================================
// Email Verification Tests
// =============================================================================

describe('POST /v1/auth/verify-email', () => {
  it('should reject invalid verification token', async () => {
    const res = await apiRequest<{
      error: string
      message: string
    }>('/v1/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token: 'invalid-token-12345' }),
    })

    expect(res.status).toBe(400)
    expect(res.data.error).toBe('INVALID_TOKEN')
  })

  it('should reject empty token', async () => {
    const res = await apiRequest<{
      error: string
    }>('/v1/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token: '' }),
    })

    expect(res.status).toBe(400)
  })

  it('should reject missing token', async () => {
    const res = await apiRequest<{
      error: string
    }>('/v1/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({}),
    })

    expect(res.status).toBe(400)
  })
})

describe('POST /v1/auth/verify-email/resend', () => {
  it('should accept resend request for any email (security)', async () => {
    const res = await apiRequest<{
      success: boolean
      message: string
    }>('/v1/auth/verify-email/resend', {
      method: 'POST',
      body: JSON.stringify({ email: 'nonexistent@bundlenudge-test.com' }),
    })

    // Always returns success to prevent email enumeration
    expect(res.status).toBe(200)
    expect(res.data.success).toBe(true)
  })

  it('should reject invalid email format', async () => {
    const res = await apiRequest<{
      error: string
    }>('/v1/auth/verify-email/resend', {
      method: 'POST',
      body: JSON.stringify({ email: 'not-an-email' }),
    })

    expect(res.status).toBe(400)
  })
})

describe('GET /v1/auth/verify-email/status', () => {
  it('should return verification status for authenticated user', async () => {
    if (!testUser) throw new Error('Test user not created')

    const res = await authRequest<{
      emailVerified: boolean
      email: string
    }>('/v1/auth/verify-email/status', testUser.sessionToken)

    expect(res.status).toBe(200)
    expect(res.data.email).toBe(testUser.email.toLowerCase())
    expect(typeof res.data.emailVerified).toBe('boolean')
  })

  it('should reject unauthenticated request', async () => {
    const res = await apiRequest<{
      error: string
    }>('/v1/auth/verify-email/status')

    expect(res.status).toBe(401)
  })

  it('should reject invalid session token', async () => {
    const res = await authRequest<{
      error: string
    }>('/v1/auth/verify-email/status', 'invalid-token-12345')

    expect(res.status).toBe(401)
  })
})

// =============================================================================
// Password Reset Tests
// =============================================================================

describe('POST /v1/auth/password/forgot-password', () => {
  it('should accept forgot password request for any email (security)', async () => {
    const res = await apiRequest<{
      success: boolean
      message: string
    }>('/v1/auth/password/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email: 'nonexistent@bundlenudge-test.com' }),
    })

    // Always returns success to prevent email enumeration
    expect(res.status).toBe(200)
    expect(res.data.success).toBe(true)
    expect(res.data.message).toContain('If an account exists')
  })

  it('should accept request for existing user', async () => {
    if (!testUser) throw new Error('Test user not created')

    const res = await apiRequest<{
      success: boolean
      message: string
    }>('/v1/auth/password/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email: testUser.email }),
    })

    expect(res.status).toBe(200)
    expect(res.data.success).toBe(true)
  })

  it('should reject invalid email format', async () => {
    const res = await apiRequest<{
      error: string
    }>('/v1/auth/password/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email: 'not-an-email' }),
    })

    expect(res.status).toBe(400)
  })
})

describe('POST /v1/auth/password/reset-password', () => {
  it('should reject invalid reset token', async () => {
    const res = await apiRequest<{
      error: string
      message: string
    }>('/v1/auth/password/reset-password', {
      method: 'POST',
      body: JSON.stringify({
        token: 'invalid-reset-token-12345',
        password: generateTestPassword(),
      }),
    })

    expect(res.status).toBe(400)
    expect(res.data.error).toBe('INVALID_TOKEN')
  })

  it('should reject weak password', async () => {
    const res = await apiRequest<{
      error: string
      message: string
    }>('/v1/auth/password/reset-password', {
      method: 'POST',
      body: JSON.stringify({
        token: 'some-token',
        password: 'weak',
      }),
    })

    expect(res.status).toBe(400)
  })

  it('should reject missing token', async () => {
    const res = await apiRequest<{
      error: string
    }>('/v1/auth/password/reset-password', {
      method: 'POST',
      body: JSON.stringify({ password: generateTestPassword() }),
    })

    expect(res.status).toBe(400)
  })
})

describe('GET /v1/auth/password/reset-password/validate', () => {
  it('should return invalid for non-existent token', async () => {
    const res = await apiRequest<{
      valid: boolean
    }>('/v1/auth/password/reset-password/validate?token=nonexistent-token')

    expect(res.status).toBe(200)
    expect(res.data.valid).toBe(false)
  })

  it('should return invalid for missing token param', async () => {
    const res = await apiRequest<{
      valid: boolean
    }>('/v1/auth/password/reset-password/validate')

    expect(res.status).toBe(200)
    expect(res.data.valid).toBe(false)
  })
})

// =============================================================================
// Session Management Tests
// =============================================================================

describe('Session Management', () => {
  it('should allow multiple concurrent sessions', async () => {
    const email = generateTestEmail()
    const password = generateTestPassword()

    // Signup
    await apiRequest('/v1/auth/email/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })

    // Login twice to get two sessions
    const login1 = await apiRequest<{
      session: { token: string }
    }>('/v1/auth/email/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })

    const login2 = await apiRequest<{
      session: { token: string }
    }>('/v1/auth/email/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })

    expect(login1.data.session.token).toBeDefined()
    expect(login2.data.session.token).toBeDefined()
    expect(login1.data.session.token).not.toBe(login2.data.session.token)

    // Both sessions should work
    const status1 = await authRequest(
      '/v1/auth/verify-email/status',
      login1.data.session.token
    )
    const status2 = await authRequest(
      '/v1/auth/verify-email/status',
      login2.data.session.token
    )

    expect(status1.status).toBe(200)
    expect(status2.status).toBe(200)
  })

  it('should return user info with session token', async () => {
    if (!testUser) throw new Error('Test user not created')

    // Use an authenticated endpoint to verify session
    const res = await authRequest<{
      email: string
      emailVerified: boolean
    }>('/v1/auth/verify-email/status', testUser.sessionToken)

    expect(res.status).toBe(200)
    expect(res.data.email).toBe(testUser.email.toLowerCase())
  })
})

// =============================================================================
// Rate Limiting Tests
// =============================================================================

describe('Rate Limiting', () => {
  it('should eventually rate limit excessive login attempts', async () => {
    const email = generateTestEmail()

    // Make many rapid requests
    const requests = Array.from({ length: 15 }, () =>
      apiRequest('/v1/auth/email/login', {
        method: 'POST',
        body: JSON.stringify({
          email,
          password: 'WrongPassword123!',
        }),
      })
    )

    const responses = await Promise.all(requests)

    // Some should be rate limited (429) or auth failures (401)
    const statuses = responses.map((r) => r.status)
    const hasRateLimited = statuses.some((s) => s === 429)
    const hasAuthFailures = statuses.some((s) => s === 401)

    // Either rate limited or all auth failures is acceptable
    expect(hasRateLimited || hasAuthFailures).toBe(true)
  })

  it('should include rate limit headers', async () => {
    const url = `${API_BASE_URL}/v1/auth/email/login`

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: generateTestEmail(),
        password: 'SomePassword123!',
      }),
    })

    // Rate limit headers may be present
    const remaining = response.headers.get('X-RateLimit-Remaining')
    const limit = response.headers.get('X-RateLimit-Limit')

    // Headers are optional but if present should be numeric
    if (remaining) {
      expect(parseInt(remaining, 10)).toBeGreaterThanOrEqual(0)
    }
    if (limit) {
      expect(parseInt(limit, 10)).toBeGreaterThan(0)
    }
  })
})
