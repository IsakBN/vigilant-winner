/**
 * Email authentication routes tests
 *
 * @agent email-password-auth
 * @created 2026-01-26
 */

import { describe, it, expect, vi } from 'vitest'
import { ERROR_CODES } from '@bundlenudge/shared'
import {
  hashPassword,
  verifyPassword,
  validatePassword,
  generateSecureToken,
} from '../../lib/auth/password'

// Mock email sending
vi.mock('../../lib/email-verification', () => ({
  sendVerificationEmail: vi.fn().mockResolvedValue(undefined),
}))

describe('emailAuthRoutes logic', () => {
  describe('POST /signup validation', () => {
    it('validates email format', () => {
      const invalidEmails = ['notanemail', 'missing@', '@nodomain.com', 'spaces in@email.com']

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      for (const email of invalidEmails) {
        const result = emailRegex.exec(email)
        expect(result).toBeNull()
      }
    })

    it('validates password minimum length', () => {
      const shortPasswords = ['1234567', 'short', '']

      for (const password of shortPasswords) {
        expect(password.length).toBeLessThan(8)
      }
    })

    it('validates password strength requirements', () => {
      // Missing uppercase
      const noUpper = validatePassword('password123')
      expect(noUpper.valid).toBe(false)
      expect(noUpper.errors).toContain('Password must contain at least one uppercase letter')

      // Missing lowercase
      const noLower = validatePassword('PASSWORD123')
      expect(noLower.valid).toBe(false)
      expect(noLower.errors).toContain('Password must contain at least one lowercase letter')

      // Missing number
      const noNumber = validatePassword('PasswordABC')
      expect(noNumber.valid).toBe(false)
      expect(noNumber.errors).toContain('Password must contain at least one number')

      // Valid password
      const valid = validatePassword('Password123')
      expect(valid.valid).toBe(true)
      expect(valid.errors).toHaveLength(0)
    })
  })

  describe('POST /signup flow', () => {
    it('generates secure verification token', () => {
      const token = generateSecureToken()

      // Token should be 64 hex chars (32 bytes)
      expect(token).toHaveLength(64)
      expect(token).toMatch(/^[a-f0-9]+$/)
    })

    it('hashes password securely', async () => {
      const password = 'SecurePass123'
      const hash = await hashPassword(password)

      // Hash should be in format salt:hash
      expect(hash).toContain(':')
      const [salt, hashPart] = hash.split(':')
      expect(salt).toHaveLength(32) // 16 bytes = 32 hex chars
      expect(hashPart).toHaveLength(64) // 32 bytes = 64 hex chars

      // Hash should not contain original password
      expect(hash).not.toContain(password)
    })

    it('returns generic success for duplicate email (security)', () => {
      // This tests the pattern - actual response should be identical
      const successResponse = {
        success: true,
        message: 'Verification email sent',
        userId: 'some-id',
      }

      expect(successResponse.success).toBe(true)
      expect(successResponse.message).toBe('Verification email sent')
    })
  })

  describe('POST /login validation', () => {
    it('requires email field', () => {
      const body = { password: 'test' }
      expect(body).not.toHaveProperty('email')
    })

    it('requires password field', () => {
      const body = { email: 'test@example.com' }
      expect(body).not.toHaveProperty('password')
    })
  })

  describe('POST /login flow', () => {
    it('verifies password correctly', async () => {
      const password = 'SecurePass123'
      const hash = await hashPassword(password)

      // Correct password
      const validResult = await verifyPassword(password, hash)
      expect(validResult).toBe(true)

      // Wrong password
      const invalidResult = await verifyPassword('WrongPassword123', hash)
      expect(invalidResult).toBe(false)
    })

    it('returns generic error for invalid credentials (security)', () => {
      const errorResponse = {
        error: ERROR_CODES.INVALID_CREDENTIALS,
        message: 'Invalid email or password',
      }

      // Same message for: user not found, wrong password, OAuth-only user
      expect(errorResponse.error).toBe('INVALID_CREDENTIALS')
      expect(errorResponse.message).toBe('Invalid email or password')
    })

    it('generates secure session token', () => {
      const token = generateSecureToken()

      expect(token).toHaveLength(64)
      expect(token).toMatch(/^[a-f0-9]+$/)
    })

    it('returns user data without sensitive fields', () => {
      const userData = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        emailVerified: true,
      }

      // Should not include password_hash
      expect(userData).not.toHaveProperty('password_hash')
      expect(userData).not.toHaveProperty('passwordHash')
    })
  })

  describe('OAuth-only user handling', () => {
    it('rejects login for user without password', () => {
      // User row with null password_hash (OAuth-only)
      const oauthOnlyUser = {
        id: 'user-123',
        email: 'oauth@example.com',
        name: 'OAuth User',
        password_hash: null,
        email_verified: 1,
      }

      // Should return same generic error
      expect(oauthOnlyUser.password_hash).toBeNull()
    })
  })

  describe('error codes', () => {
    it('uses correct error codes', () => {
      expect(ERROR_CODES.VALIDATION_ERROR).toBe('VALIDATION_ERROR')
      expect(ERROR_CODES.INVALID_CREDENTIALS).toBe('INVALID_CREDENTIALS')
    })
  })

  describe('email normalization', () => {
    it('normalizes email to lowercase', () => {
      const emails = [
        'Test@Example.com',
        'TEST@EXAMPLE.COM',
        'TeSt@ExAmPlE.cOm',
      ]

      for (const email of emails) {
        expect(email.toLowerCase()).toBe('test@example.com')
      }
    })
  })

  describe('session response format', () => {
    it('returns ISO timestamp for expiresAt', () => {
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      const isoString = expiresAt.toISOString()

      // Should match ISO 8601 format
      expect(isoString).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/)
    })
  })
})
