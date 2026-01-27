 
import { describe, it, expect, vi, afterEach } from 'vitest'
import { generateDeviceId, compareSemver, retry, sleep } from './utils'

describe('utils', () => {
  describe('generateDeviceId', () => {
    const originalCrypto = globalThis.crypto

    afterEach(() => {
      // Restore original crypto
      Object.defineProperty(globalThis, 'crypto', {
        value: originalCrypto,
        writable: true,
        configurable: true,
      })
    })

    it('uses crypto.randomUUID when available', () => {
      const mockUUID = '550e8400-e29b-41d4-a716-446655440000'
      Object.defineProperty(globalThis, 'crypto', {
        value: {
          randomUUID: vi.fn(() => mockUUID),
          getRandomValues: vi.fn(),
        },
        writable: true,
        configurable: true,
      })

      const deviceId = generateDeviceId()
      expect(deviceId).toBe(mockUUID)
      expect(globalThis.crypto.randomUUID).toHaveBeenCalled()
    })

    it('falls back to crypto.getRandomValues when randomUUID unavailable', () => {
      Object.defineProperty(globalThis, 'crypto', {
        value: {
          randomUUID: undefined,
          getRandomValues: vi.fn((arr: Uint8Array) => {
            // Fill with predictable values for testing
            for (let i = 0; i < arr.length; i++) {
              arr[i] = i * 16 + i
            }
            return arr
          }),
        },
        writable: true,
        configurable: true,
      })

      const deviceId = generateDeviceId()
      // Should be a valid UUID v4 format
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      expect(deviceId).toMatch(uuidRegex)
      expect(globalThis.crypto.getRandomValues).toHaveBeenCalled()
    })

    it('throws error when no crypto available', () => {
      Object.defineProperty(globalThis, 'crypto', {
        value: undefined,
        writable: true,
        configurable: true,
      })

      expect(() => generateDeviceId()).toThrow(
        'crypto.randomUUID or crypto.getRandomValues required for secure device ID generation'
      )
    })

    it('throws error when crypto exists but has no secure methods', () => {
      Object.defineProperty(globalThis, 'crypto', {
        value: {},
        writable: true,
        configurable: true,
      })

      expect(() => generateDeviceId()).toThrow(
        'crypto.randomUUID or crypto.getRandomValues required for secure device ID generation'
      )
    })

    it('generates valid UUID v4 format with native crypto', () => {
      // Use real crypto (should be available in test environment)
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
      const fn = (): Promise<string> => Promise.resolve('success')
      const result = await retry(fn)
      expect(result).toBe('success')
    })

    it('retries on failure', async () => {
      let attempts = 0
      const fn = (): Promise<string> => {
        attempts++
        if (attempts < 3) {
          return Promise.reject(new Error('fail'))
        }
        return Promise.resolve('success')
      }

      const result = await retry(fn, { baseDelayMs: 10 })
      expect(result).toBe('success')
      expect(attempts).toBe(3)
    })

    it('throws after max attempts', async () => {
      const fn = (): Promise<never> => Promise.reject(new Error('always fails'))

      await expect(
        retry(fn, { maxAttempts: 2, baseDelayMs: 10 })
      ).rejects.toThrow('always fails')
    })
  })
})
