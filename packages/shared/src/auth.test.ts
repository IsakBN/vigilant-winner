/**
 * @agent remediate-auth-schemas
 * @created 2026-01-25
 * @description Tests for authentication Zod schemas
 */
import { describe, it, expect } from 'vitest'
import {
  passwordSchema,
  signUpSchema,
  signInSchema,
  emailVerificationSchema,
  adminOtpRequestSchema,
  adminOtpVerifySchema,
  passwordResetRequestSchema,
  passwordResetSchema,
} from './schemas'

describe('auth schemas', () => {
  describe('passwordSchema', () => {
    it('accepts valid password (8 chars)', () => {
      const result = passwordSchema.safeParse('12345678')
      expect(result.success).toBe(true)
    })

    it('accepts valid password (72 chars - bcrypt max)', () => {
      const result = passwordSchema.safeParse('a'.repeat(72))
      expect(result.success).toBe(true)
    })

    it('rejects password too short (7 chars)', () => {
      const result = passwordSchema.safeParse('1234567')
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe(
          'Password must be at least 8 characters'
        )
      }
    })

    it('rejects password too long (73 chars)', () => {
      const result = passwordSchema.safeParse('a'.repeat(73))
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe(
          'Password must be at most 72 characters'
        )
      }
    })
  })

  describe('signUpSchema', () => {
    it('validates valid signup with email and password', () => {
      const result = signUpSchema.safeParse({
        email: 'user@example.com',
        password: 'securepassword123',
      })
      expect(result.success).toBe(true)
    })

    it('validates signup with optional name', () => {
      const result = signUpSchema.safeParse({
        email: 'user@example.com',
        password: 'securepassword123',
        name: 'John Doe',
      })
      expect(result.success).toBe(true)
    })

    it('rejects invalid email', () => {
      const result = signUpSchema.safeParse({
        email: 'not-an-email',
        password: 'securepassword123',
      })
      expect(result.success).toBe(false)
    })

    it('rejects short password', () => {
      const result = signUpSchema.safeParse({
        email: 'user@example.com',
        password: 'short',
      })
      expect(result.success).toBe(false)
    })

    it('rejects name longer than 100 characters', () => {
      const result = signUpSchema.safeParse({
        email: 'user@example.com',
        password: 'securepassword123',
        name: 'a'.repeat(101),
      })
      expect(result.success).toBe(false)
    })
  })

  describe('signInSchema', () => {
    it('validates valid signin', () => {
      const result = signInSchema.safeParse({
        email: 'user@example.com',
        password: 'anypassword',
      })
      expect(result.success).toBe(true)
    })

    it('rejects invalid email', () => {
      const result = signInSchema.safeParse({
        email: 'invalid',
        password: 'password',
      })
      expect(result.success).toBe(false)
    })

    it('rejects empty password', () => {
      const result = signInSchema.safeParse({
        email: 'user@example.com',
        password: '',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('emailVerificationSchema', () => {
    it('validates valid 6-digit OTP', () => {
      const result = emailVerificationSchema.safeParse({
        email: 'user@example.com',
        otp: '123456',
      })
      expect(result.success).toBe(true)
    })

    it('rejects OTP with less than 6 digits', () => {
      const result = emailVerificationSchema.safeParse({
        email: 'user@example.com',
        otp: '12345',
      })
      expect(result.success).toBe(false)
    })

    it('rejects OTP with more than 6 digits', () => {
      const result = emailVerificationSchema.safeParse({
        email: 'user@example.com',
        otp: '1234567',
      })
      expect(result.success).toBe(false)
    })

    it('rejects OTP with non-digit characters', () => {
      const result = emailVerificationSchema.safeParse({
        email: 'user@example.com',
        otp: '12345a',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('adminOtpRequestSchema', () => {
    it('validates @bundlenudge.com email', () => {
      const result = adminOtpRequestSchema.safeParse({
        email: 'admin@bundlenudge.com',
      })
      expect(result.success).toBe(true)
    })

    it('validates @bundlenudge.com email (case insensitive)', () => {
      const result = adminOtpRequestSchema.safeParse({
        email: 'Admin@BundleNudge.COM',
      })
      expect(result.success).toBe(true)
    })

    it('rejects non-bundlenudge.com email', () => {
      const result = adminOtpRequestSchema.safeParse({
        email: 'user@example.com',
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe(
          'Admin access requires @bundlenudge.com email'
        )
      }
    })

    it('rejects invalid email format', () => {
      const result = adminOtpRequestSchema.safeParse({
        email: 'not-an-email',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('adminOtpVerifySchema', () => {
    it('validates valid admin OTP verification', () => {
      const result = adminOtpVerifySchema.safeParse({
        email: 'admin@example.com',
        otp: '123456',
      })
      expect(result.success).toBe(true)
    })

    it('rejects invalid OTP format', () => {
      const result = adminOtpVerifySchema.safeParse({
        email: 'admin@example.com',
        otp: 'abc123',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('passwordResetRequestSchema', () => {
    it('validates valid email', () => {
      const result = passwordResetRequestSchema.safeParse({
        email: 'user@example.com',
      })
      expect(result.success).toBe(true)
    })

    it('rejects invalid email', () => {
      const result = passwordResetRequestSchema.safeParse({
        email: 'not-an-email',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('passwordResetSchema', () => {
    it('validates valid password reset', () => {
      const result = passwordResetSchema.safeParse({
        token: 'reset-token-abc123',
        newPassword: 'newsecurepassword',
      })
      expect(result.success).toBe(true)
    })

    it('rejects empty token', () => {
      const result = passwordResetSchema.safeParse({
        token: '',
        newPassword: 'newsecurepassword',
      })
      expect(result.success).toBe(false)
    })

    it('rejects weak new password', () => {
      const result = passwordResetSchema.safeParse({
        token: 'reset-token-abc123',
        newPassword: 'short',
      })
      expect(result.success).toBe(false)
    })

    it('rejects password exceeding bcrypt limit', () => {
      const result = passwordResetSchema.safeParse({
        token: 'reset-token-abc123',
        newPassword: 'a'.repeat(73),
      })
      expect(result.success).toBe(false)
    })
  })
})
