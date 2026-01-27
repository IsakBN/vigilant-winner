/**
 * Password reset routes
 *
 * Handles forgot password and reset password flows with secure token handling.
 *
 * @agent email-password-auth
 * @created 2026-01-26
 */

import { Hono } from 'hono'
import { z } from 'zod'
import { ERROR_CODES } from '@bundlenudge/shared'
import { rateLimitAuth } from '../../middleware/rate-limit'
import {
  generateSecureToken,
  generateTokenExpiry,
  hashPassword,
  validatePassword,
} from '../../lib/auth/password'
import { createEmailService } from '../../lib/email/service'
import type { Env } from '../../types/env'

// =============================================================================
// Schemas
// =============================================================================

const forgotPasswordSchema = z.object({
  email: z.string().email(),
})

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8),
})

// =============================================================================
// Constants
// =============================================================================

const TOKEN_EXPIRY_HOURS = 1

const SUCCESS_RESPONSE = {
  success: true,
  message: 'If an account exists, a reset email has been sent',
}

// =============================================================================
// Helpers
// =============================================================================

/**
 * Mask email for privacy (show first 2 chars + domain)
 */
function maskEmail(email: string): string {
  const [localPart, domain] = email.split('@')
  return localPart.length > 2
    ? `${localPart.slice(0, 2)}***@${domain}`
    : `${localPart[0]}***@${domain}`
}

// =============================================================================
// Router
// =============================================================================

export const passwordResetRoutes = new Hono<{ Bindings: Env }>()

/**
 * POST /forgot-password
 * Initiates password reset flow by sending email with reset link
 */
passwordResetRoutes.post('/forgot-password', rateLimitAuth, async (c) => {
  const body: unknown = await c.req.json()
  const parsed = forgotPasswordSchema.safeParse(body)

  if (!parsed.success) {
    return c.json(
      { error: ERROR_CODES.VALIDATION_ERROR, message: 'Invalid email address' },
      400
    )
  }

  const normalizedEmail = parsed.data.email.toLowerCase().trim()

  try {
    const user = await c.env.DB.prepare(
      'SELECT id, password_hash FROM user WHERE email = ?'
    ).bind(normalizedEmail).first<{ id: string; password_hash: string | null }>()

    if (!user?.password_hash) {
      return c.json(SUCCESS_RESPONSE)
    }

    // Invalidate existing tokens
    await c.env.DB.prepare(
      `UPDATE password_reset_tokens SET used_at = unixepoch()
       WHERE user_id = ? AND used_at IS NULL`
    ).bind(user.id).run()

    // Create new token
    const token = generateSecureToken()
    const expiresAt = generateTokenExpiry(TOKEN_EXPIRY_HOURS)

    await c.env.DB.prepare(
      `INSERT INTO password_reset_tokens (id, user_id, token, expires_at, created_at)
       VALUES (?, ?, ?, ?, unixepoch())`
    ).bind(crypto.randomUUID(), user.id, token, Math.floor(expiresAt.getTime() / 1000)).run()

    // Send email
    const resetUrl = `${c.env.APP_URL}/reset-password?token=${token}`
    await createEmailService(c.env).sendPasswordReset(normalizedEmail, resetUrl)

    return c.json(SUCCESS_RESPONSE)
  } catch (err) {
    console.error('Password reset error:', err)
    return c.json(SUCCESS_RESPONSE)
  }
})

/**
 * POST /reset-password
 * Resets password using valid token
 */
passwordResetRoutes.post('/reset-password', rateLimitAuth, async (c) => {
  const body: unknown = await c.req.json()
  const parsed = resetPasswordSchema.safeParse(body)

  if (!parsed.success) {
    return c.json({ error: ERROR_CODES.VALIDATION_ERROR, message: 'Invalid request' }, 400)
  }

  const { token, password } = parsed.data
  const validation = validatePassword(password)

  if (!validation.valid) {
    return c.json({
      error: ERROR_CODES.VALIDATION_ERROR,
      message: 'Password does not meet requirements',
      details: validation.errors,
    }, 400)
  }

  try {
    const now = Math.floor(Date.now() / 1000)
    const record = await c.env.DB.prepare(
      `SELECT id, user_id, expires_at, used_at FROM password_reset_tokens WHERE token = ?`
    ).bind(token).first<{ id: string; user_id: string; expires_at: number; used_at: number | null }>()

    if (!record) {
      return c.json({ error: ERROR_CODES.INVALID_TOKEN, message: 'Invalid or expired token' }, 400)
    }

    if (record.expires_at < now) {
      return c.json({ error: ERROR_CODES.TOKEN_EXPIRED, message: 'Token has expired' }, 400)
    }

    if (record.used_at !== null) {
      return c.json({ error: ERROR_CODES.INVALID_TOKEN, message: 'Token has already been used' }, 400)
    }

    const user = await c.env.DB.prepare('SELECT email FROM user WHERE id = ?')
      .bind(record.user_id).first<{ email: string }>()

    if (!user) {
      return c.json({ error: ERROR_CODES.NOT_FOUND, message: 'User not found' }, 400)
    }

    const passwordHash = await hashPassword(password)

    // Update password, mark token used, invalidate sessions
    await c.env.DB.prepare('UPDATE user SET password_hash = ?, updated_at = unixepoch() WHERE id = ?')
      .bind(passwordHash, record.user_id).run()
    await c.env.DB.prepare('UPDATE password_reset_tokens SET used_at = unixepoch() WHERE id = ?')
      .bind(record.id).run()
    await c.env.DB.prepare('DELETE FROM session WHERE user_id = ?')
      .bind(record.user_id).run()

    await createEmailService(c.env).sendPasswordChanged(user.email)

    return c.json({ success: true, message: 'Password has been reset' })
  } catch (err) {
    console.error('Reset password error:', err)
    return c.json({ error: ERROR_CODES.INTERNAL_ERROR, message: 'Failed to reset password' }, 500)
  }
})

/**
 * GET /reset-password/validate
 * Validates a token without using it (for frontend to check before showing form)
 */
passwordResetRoutes.get('/reset-password/validate', async (c) => {
  const token = c.req.query('token')

  if (!token) {
    return c.json({ valid: false })
  }

  try {
    const now = Math.floor(Date.now() / 1000)
    const record = await c.env.DB.prepare(
      `SELECT prt.expires_at, prt.used_at, u.email
       FROM password_reset_tokens prt JOIN user u ON u.id = prt.user_id
       WHERE prt.token = ?`
    ).bind(token).first<{ expires_at: number; used_at: number | null; email: string }>()

    if (!record || record.expires_at < now || record.used_at !== null) {
      return c.json({ valid: false })
    }

    return c.json({ valid: true, email: maskEmail(record.email) })
  } catch (err) {
    console.error('Token validation error:', err)
    return c.json({ valid: false })
  }
})
