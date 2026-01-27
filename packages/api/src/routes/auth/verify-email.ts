/**
 * Email verification routes
 *
 * Handles email verification token validation and resend functionality
 */

import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { ERROR_CODES } from '@bundlenudge/shared'
import { authMiddleware, type AuthUser, type AuthSession } from '../../middleware/auth'
import { createRateLimitMiddleware } from '../../middleware/rate-limit'
import { createEmailService } from '../../lib/email/service'
import type { Env } from '../../types/env'

// =============================================================================
// Schemas
// =============================================================================

const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Token is required'),
})

const resendVerificationSchema = z.object({
  email: z.string().email('Invalid email address'),
})

// =============================================================================
// Constants
// =============================================================================

const TOKEN_EXPIRY_HOURS = 24
const TOKEN_EXPIRY_MS = TOKEN_EXPIRY_HOURS * 60 * 60 * 1000

// =============================================================================
// Route Handler
// =============================================================================

interface AuthVariables {
  user: AuthUser
  session: AuthSession
}

export const verifyEmailRoutes = new Hono<{
  Bindings: Env
  Variables: AuthVariables
}>()

/**
 * POST /auth/verify-email
 * Verify email with token
 */
verifyEmailRoutes.post(
  '/',
  createRateLimitMiddleware('auth'),
  zValidator('json', verifyEmailSchema),
  async (c) => {
    const { token } = c.req.valid('json')
    const now = new Date()

    // Find token in database
    const tokenRecord = await c.env.DB.prepare(
      `SELECT id, user_id, expires_at FROM email_verification_tokens WHERE token = ?`
    ).bind(token).first<{ id: string; user_id: string; expires_at: number }>()

    if (!tokenRecord) {
      return c.json(
        { error: ERROR_CODES.INVALID_TOKEN, message: 'Invalid or expired verification token' },
        400
      )
    }

    // Check if token is expired
    const expiresAt = new Date(tokenRecord.expires_at * 1000)
    if (expiresAt < now) {
      // Clean up expired token
      await c.env.DB.prepare(
        `DELETE FROM email_verification_tokens WHERE id = ?`
      ).bind(tokenRecord.id).run()

      return c.json(
        { error: ERROR_CODES.TOKEN_EXPIRED, message: 'Verification token has expired' },
        400
      )
    }

    // Update user: set emailVerified = true, emailVerifiedAt = now
    const nowTimestamp = Math.floor(now.getTime() / 1000)
    await c.env.DB.prepare(
      `UPDATE users SET email_verified = 1, email_verified_at = ?, updated_at = ? WHERE id = ?`
    ).bind(nowTimestamp, nowTimestamp, tokenRecord.user_id).run()

    // Delete all verification tokens for this user
    await c.env.DB.prepare(
      `DELETE FROM email_verification_tokens WHERE user_id = ?`
    ).bind(tokenRecord.user_id).run()

    return c.json({
      success: true,
      message: 'Email verified successfully',
    })
  }
)

/**
 * POST /auth/resend-verification
 * Resend verification email (rate limited)
 */
verifyEmailRoutes.post(
  '/resend',
  createRateLimitMiddleware('auth'),
  zValidator('json', resendVerificationSchema),
  async (c) => {
    const { email } = c.req.valid('json')

    // Find user by email
    const user = await c.env.DB.prepare(
      `SELECT id, email_verified FROM users WHERE email = ?`
    ).bind(email).first<{ id: string; email_verified: number }>()

    // Only send if user exists AND email is not verified
    // Always return success for security (don't leak user existence)
    if (user && !user.email_verified) {
      // Delete existing verification tokens for user
      await c.env.DB.prepare(
        `DELETE FROM email_verification_tokens WHERE user_id = ?`
      ).bind(user.id).run()

      // Generate new token
      const token = generateVerificationToken()
      const now = new Date()
      const expiresAt = new Date(now.getTime() + TOKEN_EXPIRY_MS)

      // Store new token
      await c.env.DB.prepare(
        `INSERT INTO email_verification_tokens (id, user_id, token, expires_at, created_at)
         VALUES (?, ?, ?, ?, ?)`
      ).bind(
        crypto.randomUUID(),
        user.id,
        token,
        Math.floor(expiresAt.getTime() / 1000),
        Math.floor(now.getTime() / 1000)
      ).run()

      // Send verification email
      const emailService = createEmailService(c.env)
      await emailService.sendVerificationEmail(email, token)
    }

    // Always return success message for security
    return c.json({
      success: true,
      message: 'If the email exists and is unverified, a new verification email has been sent',
    })
  }
)

/**
 * GET /auth/verify-email/status
 * Get verification status for authenticated user
 */
verifyEmailRoutes.get('/status', authMiddleware, async (c) => {
  const user = c.get('user')

  // Get user's verification status from database
  const dbUser = await c.env.DB.prepare(
    `SELECT email, email_verified FROM users WHERE id = ?`
  ).bind(user.id).first<{ email: string; email_verified: number }>()

  if (!dbUser) {
    return c.json(
      { error: ERROR_CODES.NOT_FOUND, message: 'User not found' },
      404
    )
  }

  return c.json({
    emailVerified: Boolean(dbUser.email_verified),
    email: dbUser.email,
  })
})

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Generate a secure verification token
 * Uses crypto.randomUUID for a URL-safe token
 */
function generateVerificationToken(): string {
  // Generate a URL-safe token using two UUIDs for extra entropy
  const part1 = crypto.randomUUID().replace(/-/g, '')
  const part2 = crypto.randomUUID().replace(/-/g, '')
  return `${part1}${part2}`
}
