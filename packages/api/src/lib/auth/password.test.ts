import { describe, it, expect } from 'vitest'
import {
  hashPassword,
  verifyPassword,
  generateSecureToken,
  generateTokenExpiry,
  constantTimeCompare,
  validatePassword,
} from './password'

describe('password utilities', () => {
  describe('hashPassword', () => {
    it('produces different output each time (salted)', async () => {
      const password = 'MySecureP@ss1'

      const hash1 = await hashPassword(password)
      const hash2 = await hashPassword(password)
      const hash3 = await hashPassword(password)

      expect(hash1).not.toBe(hash2)
      expect(hash2).not.toBe(hash3)
      expect(hash1).not.toBe(hash3)
    })

    it('produces hash in correct format (salt:hash)', async () => {
      const hash = await hashPassword('TestPassword1')

      expect(hash).toMatch(/^[a-f0-9]{32}:[a-f0-9]{64}$/)
    })

    it('handles empty password', async () => {
      const hash = await hashPassword('')

      expect(hash).toMatch(/^[a-f0-9]{32}:[a-f0-9]{64}$/)
    })

    it('handles unicode characters', async () => {
      const hash = await hashPassword('Password123!')

      expect(hash).toMatch(/^[a-f0-9]{32}:[a-f0-9]{64}$/)
    })

    it('handles very long passwords', async () => {
      const longPassword = 'A'.repeat(1000) + '1a'
      const hash = await hashPassword(longPassword)

      expect(hash).toMatch(/^[a-f0-9]{32}:[a-f0-9]{64}$/)
    })
  })

  describe('verifyPassword', () => {
    it('returns true for correct password', async () => {
      const password = 'CorrectPassword1'
      const hash = await hashPassword(password)

      const result = await verifyPassword(password, hash)

      expect(result).toBe(true)
    })

    it('returns false for incorrect password', async () => {
      const hash = await hashPassword('CorrectPassword1')

      const result = await verifyPassword('WrongPassword1', hash)

      expect(result).toBe(false)
    })

    it('returns false for similar but different password', async () => {
      const hash = await hashPassword('Password123')

      const result = await verifyPassword('Password124', hash)

      expect(result).toBe(false)
    })

    it('returns false for malformed hash (no colon)', async () => {
      const result = await verifyPassword('password', 'invalidhash')

      expect(result).toBe(false)
    })

    it('returns false for malformed hash (wrong salt length)', async () => {
      const result = await verifyPassword('password', 'abc:' + 'a'.repeat(64))

      expect(result).toBe(false)
    })

    it('returns false for malformed hash (wrong hash length)', async () => {
      const result = await verifyPassword('password', 'a'.repeat(32) + ':abc')

      expect(result).toBe(false)
    })

    it('works with empty password if that was hashed', async () => {
      const hash = await hashPassword('')

      const result = await verifyPassword('', hash)

      expect(result).toBe(true)
    })
  })

  describe('generateSecureToken', () => {
    it('generates unique tokens each time', () => {
      const token1 = generateSecureToken()
      const token2 = generateSecureToken()
      const token3 = generateSecureToken()

      expect(token1).not.toBe(token2)
      expect(token2).not.toBe(token3)
      expect(token1).not.toBe(token3)
    })

    it('generates 64-character hex token by default (32 bytes)', () => {
      const token = generateSecureToken()

      expect(token).toMatch(/^[a-f0-9]{64}$/)
      expect(token.length).toBe(64)
    })

    it('respects custom length parameter', () => {
      const token16 = generateSecureToken(16)
      const token64 = generateSecureToken(64)

      expect(token16.length).toBe(32) // 16 bytes = 32 hex chars
      expect(token64.length).toBe(128) // 64 bytes = 128 hex chars
    })

    it('generates valid hex string', () => {
      const token = generateSecureToken()

      expect(token).toMatch(/^[a-f0-9]+$/)
    })
  })

  describe('generateTokenExpiry', () => {
    it('returns Date object', () => {
      const expiry = generateTokenExpiry()

      expect(expiry).toBeInstanceOf(Date)
    })

    it('defaults to 1 hour from now', () => {
      const before = Date.now()
      const expiry = generateTokenExpiry()
      const after = Date.now()

      const oneHourMs = 60 * 60 * 1000
      expect(expiry.getTime()).toBeGreaterThanOrEqual(before + oneHourMs)
      expect(expiry.getTime()).toBeLessThanOrEqual(after + oneHourMs)
    })

    it('respects custom hours parameter', () => {
      const before = Date.now()
      const expiry = generateTokenExpiry(24)
      const after = Date.now()

      const twentyFourHoursMs = 24 * 60 * 60 * 1000
      expect(expiry.getTime()).toBeGreaterThanOrEqual(before + twentyFourHoursMs)
      expect(expiry.getTime()).toBeLessThanOrEqual(after + twentyFourHoursMs)
    })
  })

  describe('constantTimeCompare', () => {
    it('returns true for equal strings', () => {
      expect(constantTimeCompare('abc', 'abc')).toBe(true)
      expect(constantTimeCompare('', '')).toBe(true)
      expect(constantTimeCompare('longstring123', 'longstring123')).toBe(true)
    })

    it('returns false for different strings', () => {
      expect(constantTimeCompare('abc', 'abd')).toBe(false)
      expect(constantTimeCompare('abc', 'ABC')).toBe(false)
      expect(constantTimeCompare('hello', 'world')).toBe(false)
    })

    it('returns false for different length strings', () => {
      expect(constantTimeCompare('abc', 'abcd')).toBe(false)
      expect(constantTimeCompare('abcd', 'abc')).toBe(false)
      expect(constantTimeCompare('', 'a')).toBe(false)
    })

    it('handles special characters', () => {
      expect(constantTimeCompare('!@#$%', '!@#$%')).toBe(true)
      expect(constantTimeCompare('!@#$%', '!@#$&')).toBe(false)
    })
  })

  describe('validatePassword', () => {
    it('accepts valid password', () => {
      const result = validatePassword('SecurePass1')

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('rejects password shorter than 8 characters', () => {
      const result = validatePassword('Short1A')

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Password must be at least 8 characters')
    })

    it('rejects password without uppercase letter', () => {
      const result = validatePassword('lowercase123')

      expect(result.valid).toBe(false)
      expect(result.errors).toContain(
        'Password must contain at least one uppercase letter'
      )
    })

    it('rejects password without lowercase letter', () => {
      const result = validatePassword('UPPERCASE123')

      expect(result.valid).toBe(false)
      expect(result.errors).toContain(
        'Password must contain at least one lowercase letter'
      )
    })

    it('rejects password without number', () => {
      const result = validatePassword('NoNumbers!')

      expect(result.valid).toBe(false)
      expect(result.errors).toContain(
        'Password must contain at least one number'
      )
    })

    it('returns multiple errors for multiple violations', () => {
      const result = validatePassword('short')

      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(1)
    })

    it('accepts exactly 8 character password meeting all criteria', () => {
      const result = validatePassword('Secure1a')

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
  })
})
