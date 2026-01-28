/**
 * @description Secure password handling utilities for BundleNudge authentication
 *
 * Uses Web Crypto API for Cloudflare Workers compatibility.
 * - PBKDF2-SHA256 for password hashing
 * - CSPRNG for token generation
 * - Constant-time comparison for security
 */

// =============================================================================
// Constants
// =============================================================================

const PBKDF2_ITERATIONS = 100000
const KEY_LENGTH = 32 // 256 bits
const SALT_LENGTH = 16 // 128 bits

const MIN_PASSWORD_LENGTH = 8

// =============================================================================
// Types
// =============================================================================

export interface PasswordValidationResult {
  valid: boolean
  errors: string[]
}

// =============================================================================
// Password Hashing
// =============================================================================

/**
 * Hash a password using PBKDF2-SHA256
 * @param password - Plain text password to hash
 * @returns Hash in format: `salt_hex:hash_hex`
 */
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const passwordData = encoder.encode(password)

  // Generate random salt
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH))

  // Import password as key material
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordData,
    'PBKDF2',
    false,
    ['deriveBits']
  )

  // Derive key using PBKDF2-SHA256
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    KEY_LENGTH * 8 // bits
  )

  const hashArray = new Uint8Array(derivedBits)

  // Return format: salt_hex:hash_hex
  return `${arrayToHex(salt)}:${arrayToHex(hashArray)}`
}

/**
 * Verify a password against a stored hash
 * @param password - Plain text password to verify
 * @param storedHash - Hash from hashPassword() in format `salt_hex:hash_hex`
 * @returns True if password matches
 */
export async function verifyPassword(
  password: string,
  storedHash: string
): Promise<boolean> {
  const parts = storedHash.split(':')
  if (parts.length !== 2) {
    return false
  }

  const [saltHex, expectedHashHex] = parts
  const salt = hexToArray(saltHex)
  const expectedHash = hexToArray(expectedHashHex)

  if (salt.length !== SALT_LENGTH || expectedHash.length !== KEY_LENGTH) {
    return false
  }

  const encoder = new TextEncoder()
  const passwordData = encoder.encode(password)

  // Import password as key material
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordData,
    'PBKDF2',
    false,
    ['deriveBits']
  )

  // Derive key using same parameters
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    KEY_LENGTH * 8
  )

  const actualHash = new Uint8Array(derivedBits)

  // Use constant-time comparison
  return constantTimeCompare(
    arrayToHex(actualHash),
    expectedHashHex
  )
}

// =============================================================================
// Token Generation
// =============================================================================

/**
 * Generate a cryptographically secure random token
 * @param length - Number of random bytes (default: 32, producing 64-char hex)
 * @returns Hex-encoded random token
 */
export function generateSecureToken(length = 32): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length))
  return arrayToHex(bytes)
}

/**
 * Generate an expiry date for a token
 * @param hours - Number of hours until expiry (default: 1)
 * @returns Date object representing the expiry time
 */
export function generateTokenExpiry(hours = 1): Date {
  return new Date(Date.now() + hours * 60 * 60 * 1000)
}

// =============================================================================
// Constant-Time Comparison
// =============================================================================

/**
 * Compare two strings in constant time to prevent timing attacks
 * @param a - First string
 * @param b - Second string
 * @returns True if strings are equal
 */
export function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    // Still do the comparison to maintain constant time for same-length strings
    // but we know the result will be false
    const dummy = 'x'.repeat(Math.max(a.length, b.length))
    constantTimeCompareInternal(dummy, dummy)
    return false
  }

  return constantTimeCompareInternal(a, b)
}

function constantTimeCompareInternal(a: string, b: string): boolean {
  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return result === 0
}

// =============================================================================
// Password Validation
// =============================================================================

/**
 * Validate password meets security requirements
 * @param password - Password to validate
 * @returns Validation result with errors if invalid
 */
export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = []

  if (password.length < MIN_PASSWORD_LENGTH) {
    errors.push(`Password must be at least ${String(MIN_PASSWORD_LENGTH)} characters`)
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

// =============================================================================
// Hex Helpers
// =============================================================================

/**
 * Convert Uint8Array to hex string
 */
function arrayToHex(array: Uint8Array): string {
  return Array.from(array)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Convert hex string to Uint8Array
 */
function hexToArray(hex: string): Uint8Array {
  const matches = hex.match(/.{1,2}/g)
  if (!matches) {
    return new Uint8Array(0)
  }
  return new Uint8Array(matches.map((byte) => parseInt(byte, 16)))
}
