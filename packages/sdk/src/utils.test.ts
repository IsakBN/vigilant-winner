import { describe, it, expect } from 'vitest'
import { generateDeviceId, compareSemver, retry, sleep } from './utils'

describe('utils', () => {
  describe('generateDeviceId', () => {
    it('generates a valid UUID v4 format', () => {
      const deviceId = generateDeviceId()
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      expect(deviceId).toMatch(uuidRegex)
    })

    it('generates unique IDs', () => {
      const ids = new Set<string>()
      for (let i = 0; i < 100; i++) {
        ids.add(generateDeviceId())
      }
      expect(ids.size).toBe(100)
    })
  })

  describe('compareSemver', () => {
    it('returns 0 for equal versions', () => {
      expect(compareSemver('1.0.0', '1.0.0')).toBe(0)
      expect(compareSemver('2.3.4', '2.3.4')).toBe(0)
    })

    it('returns 1 when first version is greater', () => {
      expect(compareSemver('2.0.0', '1.0.0')).toBe(1)
      expect(compareSemver('1.1.0', '1.0.0')).toBe(1)
      expect(compareSemver('1.0.1', '1.0.0')).toBe(1)
    })

    it('returns -1 when first version is less', () => {
      expect(compareSemver('1.0.0', '2.0.0')).toBe(-1)
      expect(compareSemver('1.0.0', '1.1.0')).toBe(-1)
      expect(compareSemver('1.0.0', '1.0.1')).toBe(-1)
    })

    it('handles missing patch versions', () => {
      expect(compareSemver('1.0', '1.0.0')).toBe(0)
      expect(compareSemver('1', '1.0.0')).toBe(0)
    })
  })

  describe('sleep', () => {
    it('waits for specified duration', async () => {
      const start = Date.now()
      await sleep(50)
      const elapsed = Date.now() - start
      expect(elapsed).toBeGreaterThanOrEqual(45) // Allow small variance
    })
  })

  describe('retry', () => {
    it('returns result on first success', async () => {
      const fn = async () => 'success'
      const result = await retry(fn)
      expect(result).toBe('success')
    })

    it('retries on failure', async () => {
      let attempts = 0
      const fn = async () => {
        attempts++
        if (attempts < 3) {
          throw new Error('fail')
        }
        return 'success'
      }

      const result = await retry(fn, { baseDelayMs: 10 })
      expect(result).toBe('success')
      expect(attempts).toBe(3)
    })

    it('throws after max attempts', async () => {
      const fn = async () => {
        throw new Error('always fails')
      }

      await expect(
        retry(fn, { maxAttempts: 2, baseDelayMs: 10 })
      ).rejects.toThrow('always fails')
    })
  })
})
