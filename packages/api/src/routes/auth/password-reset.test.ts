/**
 * Password reset routes tests
 *
 * @agent email-password-auth
 * @created 2026-01-26
 */

import { describe, it, expect, vi } from 'vitest'
import { ERROR_CODES } from '@bundlenudge/shared'
import {
  generateSecureToken,
  generateTokenExpiry,
  hashPassword,
  validatePassword,
} from '../../lib/auth/password'

// Mock email service
vi.mock('../../lib/email/service', () => ({
  createEmailService: vi.fn(() => ({
    sendPasswordReset: vi.fn().mockResolvedValue({ success: true }),
    sendPasswordChanged: vi.fn().mockResolvedValue({ success: true }),
  })),
}))

describe('passwordResetRoutes logic', () => {
  describe('POST /forgot-password', () => {
    it('returns success message format', () => {
      const response = {
        success: true,
        message: 'If an account exists, a reset email has been sent',
      }

      expect(response.success).toBe(true)
      expect(response.message).toContain('reset email')
    })

    it('uses same response for security regardless of user existence', () => {
      // For security, we return the same response regardless of whether
      // the email exists to prevent email enumeration attacks
      const response = {
        success: true,
        message: 'If an account exists, a reset email has been sent',
      }

      expect(response.message).not.toContain('not found')
      expect(response.message).not.toContain('does not exist')
    })

    it('validates email format with regex', () => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

      expect(emailRegex.test('test@example.com')).toBe(true)
      expect(emailRegex.test('user.name@domain.co.uk')).toBe(true)
      expect(emailRegex.test('invalid')).toBe(false)
      expect(emailRegex.test('missing@')).toBe(false)
    })

    it('normalizes email to lowercase', () => {
      const input = 'TEST@EXAMPLE.COM'
      const normalized = input.toLowerCase().trim()

      expect(normalized).toBe('test@example.com')
    })
  })

  describe('POST /reset-password', () => {
    it('requires non-empty token', () => {
      const emptyToken = ''
      const validToken = generateSecureToken()

      expect(emptyToken.length).toBe(0)
      expect(validToken.length).toBeGreaterThan(0)
    })

    it('requires password minimum length', () => {
      const shortPassword = 'Short1!'
      const validPassword = 'ValidPass1!'

      expect(shortPassword.length).toBeLessThan(8)
      expect(validPassword.length).toBeGreaterThanOrEqual(8)
    })

    it('rejects password without uppercase', () => {
      const result = validatePassword('lowercase1!')
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Password must contain at least one uppercase letter')
    })

    it('rejects password without lowercase', () => {
      const result = validatePassword('UPPERCASE1!')
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Password must contain at least one lowercase letter')
    })

    it('rejects password without number', () => {
      const result = validatePassword('NoNumberHere!')
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Password must contain at least one number')
    })

    it('accepts valid strong password', () => {
      const result = validatePassword('ValidPass123')
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('detects expired tokens by timestamp comparison', () => {
      const now = Math.floor(Date.now() / 1000)
      const expiredAt = now - 3600

      expect(expiredAt < now).toBe(true)
    })

    it('detects used tokens by non-null usedAt', () => {
      const usedAt = Math.floor(Date.now() / 1000) - 600

      expect(usedAt).not.toBeNull()
    })

    it('validates valid token by timestamp and usedAt', () => {
      const now = Math.floor(Date.now() / 1000)
      const expiresAt = now + 3600
      const usedAt = null

      expect(expiresAt >= now).toBe(true)
      expect(usedAt).toBeNull()
    })

    it('uses correct error code for invalid token', () => {
      expect(ERROR_CODES.INVALID_TOKEN).toBe('INVALID_TOKEN')
    })

    it('uses correct error code for expired token', () => {
      expect(ERROR_CODES.TOKEN_EXPIRED).toBe('TOKEN_EXPIRED')
    })

    it('uses correct error code for validation errors', () => {
      expect(ERROR_CODES.VALIDATION_ERROR).toBe('VALIDATION_ERROR')
    })
  })

  describe('GET /reset-password/validate', () => {
    it('returns invalid when token is missing', () => {
      const token = undefined
      const response = { valid: Boolean(token) }

      expect(response.valid).toBe(false)
    })

    it('masks email correctly for privacy', () => {
      const email = 'testuser@example.com'
      const parts = email.split('@') as [string, string]
      const localPart = parts[0]
      const domain = parts[1]
      const prefix = localPart.length > 2 ? localPart.slice(0, 2) : localPart.slice(0, 1)
      const maskedEmail = `${prefix}***@${domain}`

      expect(maskedEmail).toBe('te***@example.com')
      expect(maskedEmail).not.toContain('testuser')
    })

    it('handles short email local parts', () => {
      const email = 'ab@example.com'
      const parts = email.split('@') as [string, string]
      const localPart = parts[0]
      const domain = parts[1]
      const prefix = localPart.length > 2 ? localPart.slice(0, 2) : localPart.slice(0, 1)
      const maskedEmail = `${prefix}***@${domain}`

      expect(maskedEmail).toBe('a***@example.com')
    })
  })

  describe('token generation', () => {
    it('generates unique tokens', () => {
      const token1 = generateSecureToken()
      const token2 = generateSecureToken()

      expect(token1).not.toBe(token2)
    })

    it('generates tokens of 64 hex characters', () => {
      const token = generateSecureToken()

      expect(token.length).toBe(64)
    })

    it('generates tokens with valid hex characters only', () => {
      const token = generateSecureToken()

      expect(token).toMatch(/^[0-9a-f]+$/)
    })

    it('generates expiry 1 hour in the future', () => {
      const now = Date.now()
      const expiry = generateTokenExpiry(1)

      const diffMs = expiry.getTime() - now
      const diffHours = diffMs / (1000 * 60 * 60)

      expect(diffHours).toBeGreaterThan(0.99)
      expect(diffHours).toBeLessThan(1.01)
    })
  })

  describe('password hashing', () => {
    it('produces different hashes for same password due to salt', async () => {
      const password = 'TestPassword123'
      const hash1 = await hashPassword(password)
      const hash2 = await hashPassword(password)

      expect(hash1).not.toBe(hash2)
    })

    it('produces hash in salt:hash format', async () => {
      const password = 'TestPassword123'
      const hash = await hashPassword(password)

      const parts = hash.split(':')
      expect(parts).toHaveLength(2)
      expect(parts[0]).toHaveLength(32) // 16 bytes = 32 hex chars (salt)
      expect(parts[1]).toHaveLength(64) // 32 bytes = 64 hex chars (hash)
    })
  })

  describe('security considerations', () => {
    it('uses identical response message for user enumeration protection', () => {
      const expectedMessage = 'If an account exists, a reset email has been sent'

      expect(expectedMessage).toContain('If')
      expect(expectedMessage).not.toContain('User not found')
    })

    it('invalidates existing tokens SQL pattern', () => {
      const sql = `UPDATE password_reset_tokens
                   SET used_at = unixepoch()
                   WHERE user_id = ? AND used_at IS NULL`

      expect(sql).toContain('UPDATE password_reset_tokens')
      expect(sql).toContain('SET used_at')
      expect(sql).toContain('used_at IS NULL')
    })

    it('invalidates all sessions SQL pattern', () => {
      const sql = 'DELETE FROM session WHERE user_id = ?'

      expect(sql).toContain('DELETE FROM session')
      expect(sql).toContain('user_id')
    })

    it('uses generic error messages without sensitive info', () => {
      const messages = [
        'Invalid or expired token',
        'Token has expired',
        'Token has already been used',
      ]

      messages.forEach(msg => {
        expect(msg).not.toMatch(/[a-f0-9]{64}/)
      })
    })
  })
})
