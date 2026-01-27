/**
 * Email/password authentication routes
 *
 * Custom email auth endpoints that work with our D1 schema
 * and provide explicit signup/login flows.
 *
 * @agent email-password-auth
 * @created 2026-01-26
 */

import { Hono } from 'hono'
import { z } from 'zod'
import { ERROR_CODES } from '@bundlenudge/shared'
import {
  hashPassword,
  verifyPassword,
  validatePassword,
  generateSecureToken,
  generateTokenExpiry,
} from '../../lib/auth/password'
import { sendVerificationEmail } from '../../lib/email-verification'
import { scheduleEmail } from '../../lib/scheduled-emails'
import type { Env } from '../../types/env'

// =============================================================================
// Constants
// =============================================================================

const VERIFICATION_TOKEN_EXPIRY_HOURS = 24
const SESSION_EXPIRY_HOURS = 24 * 7  // 7 days

// =============================================================================
// Validation Schemas
// =============================================================================

const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().optional(),
})

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

// =============================================================================
// Types
// =============================================================================

interface UserRow {
  id: string
  email: string
  name: string | null
  password_hash: string | null
  email_verified: number
}


// =============================================================================
// Router
// =============================================================================

export const emailAuthRoutes = new Hono<{ Bindings: Env }>()

/**
 * POST /auth/email/signup
 * Register a new user with email and password
 */
emailAuthRoutes.post('/signup', async (c) => {
  const body: unknown = await c.req.json().catch(() => ({}))
  const parsed = signupSchema.safeParse(body)

  if (!parsed.success) {
    return c.json(
      { error: ERROR_CODES.VALIDATION_ERROR, message: parsed.error.errors[0]?.message },
      400
    )
  }

  const { email, password, name } = parsed.data

  // Validate password strength
  const passwordValidation = validatePassword(password)
  if (!passwordValidation.valid) {
    return c.json(
      { error: ERROR_CODES.VALIDATION_ERROR, message: passwordValidation.errors[0] },
      400
    )
  }

  // Check if user exists (security: always return same response)
  const existingUser = await c.env.DB.prepare(
    'SELECT id FROM users WHERE email = ?'
  ).bind(email.toLowerCase()).first<{ id: string }>()

  if (existingUser) {
    // Return generic success to prevent email enumeration
    return c.json({
      success: true,
      message: 'Verification email sent',
      userId: existingUser.id,
    })
  }

  // Hash password and create user
  const passwordHash = await hashPassword(password)
  const userId = crypto.randomUUID()
  const now = Math.floor(Date.now() / 1000)

  await c.env.DB.prepare(`
    INSERT INTO users (id, email, name, password_hash, email_verified, created_at, updated_at)
    VALUES (?, ?, ?, ?, 0, ?, ?)
  `).bind(userId, email.toLowerCase(), name ?? null, passwordHash, now, now).run()

  // Generate verification token
  const verificationToken = generateSecureToken()
  const expiresAt = generateTokenExpiry(VERIFICATION_TOKEN_EXPIRY_HOURS)
  const tokenId = crypto.randomUUID()

  await c.env.DB.prepare(`
    INSERT INTO email_verification_tokens (id, user_id, token, expires_at, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).bind(tokenId, userId, verificationToken, Math.floor(expiresAt.getTime() / 1000), now).run()

  // Send verification email (non-blocking)
  try {
    await sendVerificationEmail(email, verificationToken, c.env)
  } catch {
    // Log but don't fail - user can request resend
    console.error('Failed to send verification email')
  }

  // Schedule follow-up email for 1 week after signup
  const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000
  try {
    await scheduleEmail(c.env.DB, {
      userId,
      email: email.toLowerCase(),
      template: 'follow_up',
      scheduledFor: Date.now() + ONE_WEEK_MS,
      metadata: { userName: name ?? 'there' },
    })
  } catch {
    // Log but don't fail signup
    console.error('Failed to schedule follow-up email')
  }

  return c.json({
    success: true,
    message: 'Verification email sent',
    userId,
  })
})

/**
 * POST /auth/email/login
 * Authenticate user with email and password
 */
emailAuthRoutes.post('/login', async (c) => {
  const body: unknown = await c.req.json().catch(() => ({}))
  const parsed = loginSchema.safeParse(body)

  if (!parsed.success) {
    return c.json(
      { error: ERROR_CODES.VALIDATION_ERROR, message: parsed.error.errors[0]?.message },
      400
    )
  }

  const { email, password } = parsed.data

  // Find user
  const user = await c.env.DB.prepare(
    'SELECT id, email, name, password_hash, email_verified FROM users WHERE email = ?'
  ).bind(email.toLowerCase()).first<UserRow>()

  // Generic error for security (don't reveal if user exists)
  if (!user) {
    return c.json(
      { error: ERROR_CODES.INVALID_CREDENTIALS, message: 'Invalid email or password' },
      401
    )
  }

  // Check if user has password (might be OAuth-only)
  if (!user.password_hash) {
    return c.json(
      { error: ERROR_CODES.INVALID_CREDENTIALS, message: 'Invalid email or password' },
      401
    )
  }

  // Verify password
  const isValid = await verifyPassword(password, user.password_hash)
  if (!isValid) {
    return c.json(
      { error: ERROR_CODES.INVALID_CREDENTIALS, message: 'Invalid email or password' },
      401
    )
  }

  // Create session
  const sessionToken = generateSecureToken()
  const sessionId = crypto.randomUUID()
  const expiresAt = generateTokenExpiry(SESSION_EXPIRY_HOURS)
  const now = Math.floor(Date.now() / 1000)

  await c.env.DB.prepare(`
    INSERT INTO user_sessions (id, user_id, token, expires_at, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).bind(sessionId, user.id, sessionToken, Math.floor(expiresAt.getTime() / 1000), now).run()

  return c.json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      emailVerified: Boolean(user.email_verified),
    },
    session: {
      token: sessionToken,
      expiresAt: expiresAt.toISOString(),
    },
  })
})
