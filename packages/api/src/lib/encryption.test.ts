import { describe, it, expect } from 'vitest'
import { encrypt, decrypt, generateEncryptionKey, isEncrypted } from './encryption'

describe('encryption', () => {
  const testKey = 'test-encryption-key-32-chars-min'

  describe('encrypt and decrypt', () => {
    it('encrypts and decrypts a string', async () => {
      const plaintext = 'Hello, World!'
      const encrypted = await encrypt(plaintext, testKey)
      const decrypted = await decrypt(encrypted, testKey)

      expect(decrypted).toBe(plaintext)
    })

    it('encrypts and decrypts JSON', async () => {
      const data = { apiKey: 'secret123', url: 'https://example.com' }
      const plaintext = JSON.stringify(data)

      const encrypted = await encrypt(plaintext, testKey)
      const decrypted = await decrypt(encrypted, testKey)

      expect(JSON.parse(decrypted)).toEqual(data)
    })

    it('encrypts and decrypts empty string', async () => {
      const plaintext = ''
      const encrypted = await encrypt(plaintext, testKey)
      const decrypted = await decrypt(encrypted, testKey)

      expect(decrypted).toBe(plaintext)
    })

    it('encrypts and decrypts long string', async () => {
      const plaintext = 'A'.repeat(10000)
      const encrypted = await encrypt(plaintext, testKey)
      const decrypted = await decrypt(encrypted, testKey)

      expect(decrypted).toBe(plaintext)
    })

    it('encrypts and decrypts unicode', async () => {
      const plaintext = 'Hello, 世界! 🌍'
      const encrypted = await encrypt(plaintext, testKey)
      const decrypted = await decrypt(encrypted, testKey)

      expect(decrypted).toBe(plaintext)
    })

    it('produces different ciphertext each time', async () => {
      const plaintext = 'Same plaintext'

      const encrypted1 = await encrypt(plaintext, testKey)
      const encrypted2 = await encrypt(plaintext, testKey)

      expect(encrypted1).not.toBe(encrypted2)
    })

    it('fails with wrong key', async () => {
      const plaintext = 'Secret data'
      const encrypted = await encrypt(plaintext, testKey)

      await expect(decrypt(encrypted, 'wrong-key-1234567890123456')).rejects.toThrow()
    })
  })

  describe('encrypted data format', () => {
    it('produces valid JSON', async () => {
      const encrypted = await encrypt('test', testKey)

      expect(() => JSON.parse(encrypted)).not.toThrow()
    })

    it('contains required fields', async () => {
      const encrypted = await encrypt('test', testKey)
      const parsed = JSON.parse(encrypted) as Record<string, unknown>

      expect(parsed).toHaveProperty('iv')
      expect(parsed).toHaveProperty('data')
      expect(parsed).toHaveProperty('tag')
    })

    it('iv is base64', async () => {
      const encrypted = await encrypt('test', testKey)
      const parsed = JSON.parse(encrypted) as { iv: string }

      // IV should be 12 bytes = 16 base64 chars
      expect(parsed.iv).toMatch(/^[A-Za-z0-9+/=]+$/)
    })

    it('tag is base64', async () => {
      const encrypted = await encrypt('test', testKey)
      const parsed = JSON.parse(encrypted) as { tag: string }

      // Tag should be 16 bytes = base64 chars
      expect(parsed.tag).toMatch(/^[A-Za-z0-9+/=]+$/)
    })
  })

  describe('generateEncryptionKey', () => {
    it('generates a key', () => {
      const key = generateEncryptionKey()

      expect(typeof key).toBe('string')
      expect(key.length).toBeGreaterThan(0)
    })

    it('generates base64 string', () => {
      const key = generateEncryptionKey()

      expect(key).toMatch(/^[A-Za-z0-9+/=]+$/)
    })

    it('generates different keys each time', () => {
      const key1 = generateEncryptionKey()
      const key2 = generateEncryptionKey()

      expect(key1).not.toBe(key2)
    })

    it('generates key usable for encryption', async () => {
      const key = generateEncryptionKey()
      const plaintext = 'Test message'

      const encrypted = await encrypt(plaintext, key)
      const decrypted = await decrypt(encrypted, key)

      expect(decrypted).toBe(plaintext)
    })
  })

  describe('isEncrypted', () => {
    it('returns true for encrypted data', async () => {
      const encrypted = await encrypt('test', testKey)

      expect(isEncrypted(encrypted)).toBe(true)
    })

    it('returns false for plain string', () => {
      expect(isEncrypted('hello world')).toBe(false)
    })

    it('returns false for plain JSON', () => {
      expect(isEncrypted('{"key": "value"}')).toBe(false)
    })

    it('returns false for partial encrypted format', () => {
      expect(isEncrypted('{"iv": "abc"}')).toBe(false)
      expect(isEncrypted('{"iv": "abc", "data": "def"}')).toBe(false)
    })

    it('returns true for valid format', () => {
      const validFormat = JSON.stringify({
        iv: 'AAAAAAAAAAAAAAAA',
        data: 'encrypted_data_here',
        tag: 'AAAAAAAAAAAAAAAA',
      })

      expect(isEncrypted(validFormat)).toBe(true)
    })
  })

  describe('key derivation', () => {
    it('same key produces same decryption', async () => {
      const plaintext = 'Test message'
      const encrypted = await encrypt(plaintext, testKey)

      // Decrypt twice with same key
      const decrypted1 = await decrypt(encrypted, testKey)
      const decrypted2 = await decrypt(encrypted, testKey)

      expect(decrypted1).toBe(decrypted2)
      expect(decrypted1).toBe(plaintext)
    })

    it('works with various key lengths', async () => {
      const keys = ['short', 'a'.repeat(16), 'a'.repeat(32), 'a'.repeat(64)]
      const plaintext = 'Test'

      for (const key of keys) {
        const encrypted = await encrypt(plaintext, key)
        const decrypted = await decrypt(encrypted, key)
        expect(decrypted).toBe(plaintext)
      }
    })
  })
})
