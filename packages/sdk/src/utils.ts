/**
 * Utility functions
 */

/**
 * Generate a unique device ID.
 * Uses cryptographically secure UUID v4 format.
 */
export function generateDeviceId(): string {
  // Use crypto.randomUUID if available (modern environments)
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  // Fallback to crypto.getRandomValues (RFC4122 compliant UUID v4)
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const bytes = new Uint8Array(16)
    crypto.getRandomValues(bytes)
    bytes[6] = (bytes[6] & 0x0f) | 0x40 // Version 4
    bytes[8] = (bytes[8] & 0x3f) | 0x80 // Variant 1

    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
  }

  // Throw error if no secure source available
  throw new Error(
    'crypto.randomUUID or crypto.getRandomValues required for secure device ID generation'
  )
}

/**
 * Calculate SHA-256 hash of data.
 */
export async function sha256(data: ArrayBuffer): Promise<string> {
  // In React Native, we'll use native crypto
  // This is a placeholder for the actual implementation
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return 'sha256:' + hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Sleep for a given duration.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Retry a function with exponential backoff.
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: {
    maxAttempts?: number
    baseDelayMs?: number
    maxDelayMs?: number
  } = {}
): Promise<T> {
  const { maxAttempts = 3, baseDelayMs = 1000, maxDelayMs = 30000 } = options

  let lastError: Error = new Error('Retry failed')

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      if (attempt === maxAttempts) {
        break
      }

      // Exponential backoff with jitter
      const delay = Math.min(
        baseDelayMs * Math.pow(2, attempt - 1) + Math.random() * 1000,
        maxDelayMs
      )

      await sleep(delay)
    }
  }

  throw lastError
}

/**
 * Compare semver versions.
 * Returns: -1 if a < b, 0 if a == b, 1 if a > b
 */
export function compareSemver(a: string, b: string): number {
  const partsA = a.split('.').map(Number)
  const partsB = b.split('.').map(Number)

  for (let i = 0; i < 3; i++) {
    const diff = (partsA[i] || 0) - (partsB[i] || 0)
    if (diff !== 0) return diff > 0 ? 1 : -1
  }

  return 0
}

/**
 * Convert ArrayBuffer to base64 string.
 * Used for passing binary data to native modules.
 */
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  const chunkSize = 8192 // Process in chunks to avoid call stack issues

  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length))
    binary += String.fromCharCode.apply(null, Array.from(chunk))
  }

  // Use btoa which is available in React Native via JavaScriptCore/Hermes
  return btoa(binary)
}
