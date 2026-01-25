import { describe, it, expect } from 'vitest'
import { verifyGitHubWebhook, generateGitHubSignature } from './github-webhook'

describe('github-webhook', () => {
  const testSecret = 'test-webhook-secret-123'

  describe('verifyGitHubWebhook', () => {
    it('returns false for missing signature', async () => {
      const isValid = await verifyGitHubWebhook('payload', undefined, testSecret)
      expect(isValid).toBe(false)
    })

    it('returns false for empty signature', async () => {
      const isValid = await verifyGitHubWebhook('payload', '', testSecret)
      expect(isValid).toBe(false)
    })

    it('returns false for invalid signature format', async () => {
      const isValid = await verifyGitHubWebhook('payload', 'invalid-signature', testSecret)
      expect(isValid).toBe(false)
    })

    it('returns false for wrong signature', async () => {
      const isValid = await verifyGitHubWebhook(
        'payload',
        'sha256=0000000000000000000000000000000000000000000000000000000000000000',
        testSecret
      )
      expect(isValid).toBe(false)
    })

    it('verifies correct signature', async () => {
      const payload = '{"action":"push","repository":{"name":"test"}}'
      const signature = await generateGitHubSignature(payload, testSecret)

      const isValid = await verifyGitHubWebhook(payload, signature, testSecret)
      expect(isValid).toBe(true)
    })

    it('fails with different payload', async () => {
      const signature = await generateGitHubSignature('original-payload', testSecret)
      const isValid = await verifyGitHubWebhook('different-payload', signature, testSecret)
      expect(isValid).toBe(false)
    })

    it('fails with different secret', async () => {
      const payload = 'test-payload'
      const signature = await generateGitHubSignature(payload, testSecret)
      const isValid = await verifyGitHubWebhook(payload, signature, 'different-secret')
      expect(isValid).toBe(false)
    })
  })

  describe('generateGitHubSignature', () => {
    it('generates sha256= prefixed signature', async () => {
      const signature = await generateGitHubSignature('test', testSecret)
      expect(signature).toMatch(/^sha256=[a-f0-9]{64}$/)
    })

    it('generates consistent signatures', async () => {
      const payload = 'consistent-payload'
      const sig1 = await generateGitHubSignature(payload, testSecret)
      const sig2 = await generateGitHubSignature(payload, testSecret)
      expect(sig1).toBe(sig2)
    })

    it('generates different signatures for different payloads', async () => {
      const sig1 = await generateGitHubSignature('payload-1', testSecret)
      const sig2 = await generateGitHubSignature('payload-2', testSecret)
      expect(sig1).not.toBe(sig2)
    })

    it('generates different signatures for different secrets', async () => {
      const payload = 'same-payload'
      const sig1 = await generateGitHubSignature(payload, 'secret-1')
      const sig2 = await generateGitHubSignature(payload, 'secret-2')
      expect(sig1).not.toBe(sig2)
    })
  })

  describe('security', () => {
    it('uses constant-time comparison', async () => {
      // This test ensures the verification doesn't short-circuit
      // by testing signatures that differ at different positions
      const payload = 'test-payload'
      const correctSig = await generateGitHubSignature(payload, testSecret)

      // Create signatures that differ at first, middle, and last char
      const wrongFirst = 'X' + correctSig.slice(1)
      const wrongMiddle =
        correctSig.slice(0, 32) + 'X' + correctSig.slice(33)
      const wrongLast = correctSig.slice(0, -1) + 'X'

      // All should fail (we can't truly test timing, but ensure logic works)
      expect(await verifyGitHubWebhook(payload, wrongFirst, testSecret)).toBe(false)
      expect(await verifyGitHubWebhook(payload, wrongMiddle, testSecret)).toBe(false)
      expect(await verifyGitHubWebhook(payload, wrongLast, testSecret)).toBe(false)
    })

    it('rejects signatures of different lengths', async () => {
      const payload = 'test-payload'
      const shortSig = 'sha256=abcd'
      const longSig = 'sha256=' + 'a'.repeat(100)

      expect(await verifyGitHubWebhook(payload, shortSig, testSecret)).toBe(false)
      expect(await verifyGitHubWebhook(payload, longSig, testSecret)).toBe(false)
    })
  })
})
