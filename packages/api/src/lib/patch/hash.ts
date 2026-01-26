/**
 * Hash utilities for bundle verification
 * Uses SHA-256 via Web Crypto API for Cloudflare Workers compatibility
 */

/** Hash format: sha256:<64 hex characters> */
export const HASH_REGEX = /^sha256:[a-f0-9]{64}$/

/**
 * Validate that a string matches the expected hash format
 */
export function isValidHashFormat(hash: string): boolean {
  return HASH_REGEX.test(hash)
}

/**
 * Calculate SHA-256 hash of bundle content
 * Returns hash in format: sha256:<64 hex chars>
 */
export async function hashBundle(bundle: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(bundle)

  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')

  return `sha256:${hashHex}`
}

/**
 * Verify that bundle content matches expected hash
 */
export async function verifyHash(
  bundle: string,
  expectedHash: string
): Promise<boolean> {
  if (!isValidHashFormat(expectedHash)) {
    return false
  }

  const actualHash = await hashBundle(bundle)
  return actualHash === expectedHash
}
