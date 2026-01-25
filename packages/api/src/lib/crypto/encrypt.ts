/**
 * @agent remediate-encryption-utils
 * @created 2026-01-25
 * @description AES-256-GCM encryption utilities for sensitive data at rest
 *
 * Uses Web Crypto API for Cloudflare Workers compatibility.
 * Format: base64(IV + ciphertext + auth_tag)
 */

// =============================================================================
// Constants
// =============================================================================

const ALGORITHM = 'AES-GCM'
const KEY_LENGTH = 32 // 256 bits
const IV_LENGTH = 12 // 96 bits (recommended for GCM)
const TAG_LENGTH = 128 // bits

// =============================================================================
// Key Operations
// =============================================================================

/**
 * Import a base64-encoded key for use with Web Crypto API
 */
async function importKey(keyBase64: string): Promise<CryptoKey> {
  const keyBytes = base64ToArray(keyBase64)

  if (keyBytes.length !== KEY_LENGTH) {
    throw new Error(`Invalid key length: expected ${KEY_LENGTH} bytes`)
  }

  return crypto.subtle.importKey('raw', keyBytes, { name: ALGORITHM }, false, [
    'encrypt',
    'decrypt',
  ])
}

/**
 * Generates a new 256-bit encryption key
 * @returns Base64-encoded key
 */
export function generateKey(): string {
  const keyBytes = crypto.getRandomValues(new Uint8Array(KEY_LENGTH))
  return arrayToBase64(keyBytes)
}

// =============================================================================
// Encryption
// =============================================================================

/**
 * Encrypts plaintext using AES-256-GCM
 * @param plaintext - The string to encrypt
 * @param key - Base64-encoded 256-bit key
 * @returns Base64-encoded ciphertext with IV prepended
 */
export async function encrypt(plaintext: string, key: string): Promise<string> {
  const cryptoKey = await importKey(key)
  const encoder = new TextEncoder()
  const plaintextBytes = encoder.encode(plaintext)

  // Generate random 12-byte IV
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH))

  // Encrypt (Web Crypto appends auth tag to ciphertext)
  const encryptedBuffer = await crypto.subtle.encrypt(
    {
      name: ALGORITHM,
      iv,
      tagLength: TAG_LENGTH,
    },
    cryptoKey,
    plaintextBytes
  )

  const encryptedBytes = new Uint8Array(encryptedBuffer)

  // Combine: IV + ciphertext + auth_tag
  const combined = new Uint8Array(IV_LENGTH + encryptedBytes.length)
  combined.set(iv, 0)
  combined.set(encryptedBytes, IV_LENGTH)

  return arrayToBase64(combined)
}

// =============================================================================
// Decryption
// =============================================================================

/**
 * Decrypts ciphertext encrypted with encrypt()
 * @param ciphertext - Base64-encoded ciphertext from encrypt()
 * @param key - Same key used for encryption
 * @returns Original plaintext
 */
export async function decrypt(ciphertext: string, key: string): Promise<string> {
  const cryptoKey = await importKey(key)
  const combined = base64ToArray(ciphertext)

  if (combined.length < IV_LENGTH + TAG_LENGTH / 8) {
    throw new Error('Invalid ciphertext: too short')
  }

  // Extract IV and encrypted data (ciphertext + auth_tag)
  const iv = combined.slice(0, IV_LENGTH)
  const encryptedData = combined.slice(IV_LENGTH)

  // Decrypt
  const decryptedBuffer = await crypto.subtle.decrypt(
    {
      name: ALGORITHM,
      iv,
      tagLength: TAG_LENGTH,
    },
    cryptoKey,
    encryptedData
  )

  const decoder = new TextDecoder()
  return decoder.decode(decryptedBuffer)
}

// =============================================================================
// Base64 Helpers
// =============================================================================

/**
 * Convert Uint8Array to base64 string
 */
function arrayToBase64(array: Uint8Array): string {
  const binary = String.fromCharCode(...array)
  return btoa(binary)
}

/**
 * Convert base64 string to Uint8Array
 */
function base64ToArray(base64: string): Uint8Array {
  const binary = atob(base64)
  const array = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    array[i] = binary.charCodeAt(i)
  }
  return array
}
