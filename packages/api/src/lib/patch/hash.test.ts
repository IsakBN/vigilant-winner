import { describe, it, expect } from 'vitest'
import { hashBundle, isValidHashFormat, verifyHash, HASH_REGEX } from './hash'

describe('hash', () => {
  describe('HASH_REGEX', () => {
    it('matches valid sha256 hash', () => {
      const validHash = 'sha256:' + 'a'.repeat(64)
      expect(HASH_REGEX.test(validHash)).toBe(true)
    })

    it('rejects hash without prefix', () => {
      expect(HASH_REGEX.test('a'.repeat(64))).toBe(false)
    })

    it('rejects hash with wrong length', () => {
      expect(HASH_REGEX.test('sha256:' + 'a'.repeat(63))).toBe(false)
      expect(HASH_REGEX.test('sha256:' + 'a'.repeat(65))).toBe(false)
    })

    it('rejects hash with uppercase letters', () => {
      expect(HASH_REGEX.test('sha256:' + 'A'.repeat(64))).toBe(false)
    })

    it('rejects hash with invalid characters', () => {
      expect(HASH_REGEX.test('sha256:' + 'g'.repeat(64))).toBe(false)
    })
  })

  describe('isValidHashFormat', () => {
    it('returns true for valid hash', () => {
      expect(isValidHashFormat('sha256:' + 'abcdef0123456789'.repeat(4))).toBe(true)
    })

    it('returns false for invalid hash', () => {
      expect(isValidHashFormat('invalid')).toBe(false)
      expect(isValidHashFormat('')).toBe(false)
      expect(isValidHashFormat('sha256:')).toBe(false)
    })
  })

  describe('hashBundle', () => {
    it('returns sha256 prefixed hash', async () => {
      const hash = await hashBundle('test content')
      expect(hash.startsWith('sha256:')).toBe(true)
      expect(hash.length).toBe(71) // 'sha256:' (7) + 64 hex chars
    })

    it('returns consistent hash for same input', async () => {
      const input = 'function test() { return 42; }'
      const hash1 = await hashBundle(input)
      const hash2 = await hashBundle(input)
      expect(hash1).toBe(hash2)
    })

    it('returns different hash for different input', async () => {
      const hash1 = await hashBundle('input 1')
      const hash2 = await hashBundle('input 2')
      expect(hash1).not.toBe(hash2)
    })

    it('handles empty string', async () => {
      const hash = await hashBundle('')
      expect(isValidHashFormat(hash)).toBe(true)
    })

    it('handles unicode content', async () => {
      const hash = await hashBundle('こんにちは世界 🌍')
      expect(isValidHashFormat(hash)).toBe(true)
    })
  })

  describe('verifyHash', () => {
    it('returns true when hash matches', async () => {
      const content = 'test bundle content'
      const hash = await hashBundle(content)
      expect(await verifyHash(content, hash)).toBe(true)
    })

    it('returns false when hash does not match', async () => {
      const content = 'test bundle content'
      const wrongHash = 'sha256:' + '0'.repeat(64)
      expect(await verifyHash(content, wrongHash)).toBe(false)
    })

    it('returns false for invalid hash format', async () => {
      expect(await verifyHash('content', 'invalid')).toBe(false)
    })
  })
})
