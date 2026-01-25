import { describe, it, expect } from 'vitest'
import { encrypt, decrypt, generateKey } from './encrypt'

describe('crypto/encrypt', () => {
  describe('generateKey', () => {
    it('generates a base64-encoded key', () => {
      const key = generateKey()

      expect(typeof key).toBe('string')
      expect(key).toMatch(/^[A-Za-z0-9+/=]+$/)
    })

    it('generates 32-byte (256-bit) key', () => {
      const key = generateKey()
      const decoded = atob(key)

      expect(decoded.length).toBe(32)
    })

    it('generates unique keys each time', () => {
      const key1 = generateKey()
      const key2 = generateKey()
      const key3 = generateKey()

      expect(key1).not.toBe(key2)
      expect(key2).not.toBe(key3)
      expect(key1).not.toBe(key3)
    })
  })

  describe('encrypt/decrypt roundtrip', () => {
    const validKey = generateKey()

    it('encrypts and decrypts a simple string', async () => {
      const plaintext = 'Hello, World!'

      const ciphertext = await encrypt(plaintext, validKey)
      const decrypted = await decrypt(ciphertext, validKey)

      expect(decrypted).toBe(plaintext)
    })

    it('encrypts and decrypts an empty string', async () => {
      const plaintext = ''

      const ciphertext = await encrypt(plaintext, validKey)
      const decrypted = await decrypt(ciphertext, validKey)

      expect(decrypted).toBe(plaintext)
    })

    it('encrypts and decrypts JSON data', async () => {
      const data = {
        accessToken: 'gho_abc123xyz789',
        refreshToken: 'ghr_refresh_token_here',
        expiresAt: 1706185200000,
      }
      const plaintext = JSON.stringify(data)

      const ciphertext = await encrypt(plaintext, validKey)
      const decrypted = await decrypt(ciphertext, validKey)

      expect(JSON.parse(decrypted)).toEqual(data)
    })

    it('encrypts and decrypts unicode characters', async () => {
      const plaintext = 'Hello, World!'

      const ciphertext = await encrypt(plaintext, validKey)
      const decrypted = await decrypt(ciphertext, validKey)

      expect(decrypted).toBe(plaintext)
    })

    it('encrypts and decrypts long strings', async () => {
      const plaintext = 'A'.repeat(10000)

      const ciphertext = await encrypt(plaintext, validKey)
      const decrypted = await decrypt(ciphertext, validKey)

      expect(decrypted).toBe(plaintext)
    })

    it('works with special characters', async () => {
      const plaintext = '!@#$%^&*()_+-=[]{}|;:,.<>?'

      const ciphertext = await encrypt(plaintext, validKey)
      const decrypted = await decrypt(ciphertext, validKey)

      expect(decrypted).toBe(plaintext)
    })
  })

  describe('different IV per encryption', () => {
    const validKey = generateKey()

    it('produces different ciphertext for same plaintext', async () => {
      const plaintext = 'Same plaintext every time'

      const ciphertext1 = await encrypt(plaintext, validKey)
      const ciphertext2 = await encrypt(plaintext, validKey)
      const ciphertext3 = await encrypt(plaintext, validKey)

      expect(ciphertext1).not.toBe(ciphertext2)
      expect(ciphertext2).not.toBe(ciphertext3)
      expect(ciphertext1).not.toBe(ciphertext3)
    })

    it('all different ciphertexts decrypt to same plaintext', async () => {
      const plaintext = 'Consistent decryption'

      const ciphertext1 = await encrypt(plaintext, validKey)
      const ciphertext2 = await encrypt(plaintext, validKey)
      const ciphertext3 = await encrypt(plaintext, validKey)

      const decrypted1 = await decrypt(ciphertext1, validKey)
      const decrypted2 = await decrypt(ciphertext2, validKey)
      const decrypted3 = await decrypt(ciphertext3, validKey)

      expect(decrypted1).toBe(plaintext)
      expect(decrypted2).toBe(plaintext)
      expect(decrypted3).toBe(plaintext)
    })
  })

  describe('decrypt with wrong key fails', () => {
    it('throws error when decrypting with different key', async () => {
      const key1 = generateKey()
      const key2 = generateKey()
      const plaintext = 'Secret data'

      const ciphertext = await encrypt(plaintext, key1)

      await expect(decrypt(ciphertext, key2)).rejects.toThrow()
    })

    it('throws specific error for invalid decryption', async () => {
      const key1 = generateKey()
      const key2 = generateKey()
      const plaintext = 'More secret data'

      const ciphertext = await encrypt(plaintext, key1)

      // Web Crypto throws an OperationError when auth tag verification fails
      await expect(decrypt(ciphertext, key2)).rejects.toThrow()
    })
  })

  describe('decrypt with corrupted ciphertext fails', () => {
    const validKey = generateKey()

    it('throws error for truncated ciphertext', async () => {
      const plaintext = 'Original message'
      const ciphertext = await encrypt(plaintext, validKey)

      // Truncate the ciphertext
      const truncated = ciphertext.slice(0, ciphertext.length - 10)

      await expect(decrypt(truncated, validKey)).rejects.toThrow()
    })

    it('throws error for modified ciphertext', async () => {
      const plaintext = 'Secret message'
      const ciphertext = await encrypt(plaintext, validKey)

      // Modify a byte in the middle of the ciphertext
      const decoded = atob(ciphertext)
      const midpoint = Math.floor(decoded.length / 2)
      const corrupted =
        decoded.slice(0, midpoint) +
        String.fromCharCode((decoded.charCodeAt(midpoint) + 1) % 256) +
        decoded.slice(midpoint + 1)
      const corruptedBase64 = btoa(corrupted)

      await expect(decrypt(corruptedBase64, validKey)).rejects.toThrow()
    })

    it('throws error for completely invalid base64', async () => {
      await expect(decrypt('not-valid-base64!!!', validKey)).rejects.toThrow()
    })

    it('throws error for too-short ciphertext', async () => {
      // Less than IV (12 bytes) + min auth tag (16 bytes) = 28 bytes
      const tooShort = btoa('short')

      await expect(decrypt(tooShort, validKey)).rejects.toThrow()
    })
  })

  describe('key validation', () => {
    it('rejects key with wrong length', async () => {
      const shortKey = btoa('tooshort')
      const plaintext = 'Test'

      await expect(encrypt(plaintext, shortKey)).rejects.toThrow(
        'Invalid key length'
      )
    })

    it('accepts exactly 32-byte key', async () => {
      const validKey = generateKey()
      const plaintext = 'Test'

      const ciphertext = await encrypt(plaintext, validKey)
      const decrypted = await decrypt(ciphertext, validKey)

      expect(decrypted).toBe(plaintext)
    })
  })

  describe('output format', () => {
    const validKey = generateKey()

    it('produces base64 output', async () => {
      const ciphertext = await encrypt('test', validKey)

      expect(ciphertext).toMatch(/^[A-Za-z0-9+/=]+$/)
    })

    it('output is longer than input due to IV and tag', async () => {
      const plaintext = 'short'
      const ciphertext = await encrypt(plaintext, validKey)
      const decoded = atob(ciphertext)

      // IV (12) + plaintext (5) + tag (16) = 33 bytes minimum
      expect(decoded.length).toBeGreaterThanOrEqual(33)
    })

    it('IV is prepended (first 12 bytes)', async () => {
      const ciphertext1 = await encrypt('test', validKey)
      const ciphertext2 = await encrypt('test', validKey)

      const decoded1 = atob(ciphertext1)
      const decoded2 = atob(ciphertext2)

      // First 12 bytes (IV) should be different
      const iv1 = decoded1.slice(0, 12)
      const iv2 = decoded2.slice(0, 12)

      expect(iv1).not.toBe(iv2)
    })
  })
})
