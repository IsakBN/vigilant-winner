/**
 * @agent remediate-github-token-encryption
 * @created 2026-01-25
 */

import { describe, it, expect } from 'vitest'
import { generateKey } from './crypto'
import {
  encryptGitHubToken,
  decryptGitHubToken,
  isTokenEncrypted,
} from './github-token'

describe('GitHub Token Encryption', () => {
  const testKey = generateKey()
  const testToken = 'gho_1234567890abcdefghijklmnopqrstuvwxyz'

  describe('encryptGitHubToken', () => {
    it('encrypts a token with enc: prefix', async () => {
      const encrypted = await encryptGitHubToken(testToken, testKey)

      expect(encrypted).toMatch(/^enc:/)
      expect(encrypted).not.toContain(testToken)
    })

    it('produces different ciphertext for same plaintext', async () => {
      const encrypted1 = await encryptGitHubToken(testToken, testKey)
      const encrypted2 = await encryptGitHubToken(testToken, testKey)

      // Different IVs should produce different ciphertext
      expect(encrypted1).not.toBe(encrypted2)
    })
  })

  describe('decryptGitHubToken', () => {
    it('decrypts an encrypted token', async () => {
      const encrypted = await encryptGitHubToken(testToken, testKey)
      const decrypted = await decryptGitHubToken(encrypted, testKey)

      expect(decrypted).toBe(testToken)
    })

    it('returns legacy plaintext tokens as-is', async () => {
      // Legacy tokens don't have the enc: prefix
      const legacyToken = 'gho_legacyplaintexttoken123456789'
      const result = await decryptGitHubToken(legacyToken, testKey)

      expect(result).toBe(legacyToken)
    })

    it('handles GitHub token formats', async () => {
      // Classic token format
      const classicToken = 'ghp_abcd1234567890'
      const encryptedClassic = await encryptGitHubToken(classicToken, testKey)
      const decryptedClassic = await decryptGitHubToken(encryptedClassic, testKey)
      expect(decryptedClassic).toBe(classicToken)

      // Fine-grained token format
      const fineGrainedToken = 'github_pat_abcd1234567890'
      const encryptedFine = await encryptGitHubToken(fineGrainedToken, testKey)
      const decryptedFine = await decryptGitHubToken(encryptedFine, testKey)
      expect(decryptedFine).toBe(fineGrainedToken)
    })
  })

  describe('isTokenEncrypted', () => {
    it('returns true for encrypted tokens', async () => {
      const encrypted = await encryptGitHubToken(testToken, testKey)
      expect(isTokenEncrypted(encrypted)).toBe(true)
    })

    it('returns false for plaintext tokens', () => {
      expect(isTokenEncrypted(testToken)).toBe(false)
      expect(isTokenEncrypted('gho_sometoken')).toBe(false)
      expect(isTokenEncrypted('ghp_anothertoken')).toBe(false)
    })

    it('returns false for empty string', () => {
      expect(isTokenEncrypted('')).toBe(false)
    })
  })

  describe('legacy token migration', () => {
    it('identifies tokens that need migration', () => {
      const legacyToken = 'gho_legacytoken123'
      const encrypted = 'enc:somebase64data'

      expect(isTokenEncrypted(legacyToken)).toBe(false)
      expect(isTokenEncrypted(encrypted)).toBe(true)
    })
  })
})
