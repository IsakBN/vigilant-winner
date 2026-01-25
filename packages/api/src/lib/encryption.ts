/**
 * Encryption utilities
 *
 * AES-256-GCM encryption for sensitive data at rest.
 * Uses Web Crypto API for Cloudflare Workers compatibility.
 */

// =============================================================================
// Types
// =============================================================================

interface EncryptedData {
  iv: string
  data: string
  tag: string
}

// =============================================================================
// Constants
// =============================================================================

const ALGORITHM = 'AES-GCM'
const KEY_LENGTH = 256
const IV_LENGTH = 12
const TAG_LENGTH = 128

// =============================================================================
// Key Derivation
// =============================================================================

/**
 * Derive a CryptoKey from a string key
 */
async function deriveKey(keyString: string): Promise<CryptoKey> {
  const encoder = new TextEncoder()
  const keyData = encoder.encode(keyString)

  // Hash the key to ensure consistent length
  const hashBuffer = await crypto.subtle.digest('SHA-256', keyData)

  return crypto.subtle.importKey('raw', hashBuffer, { name: ALGORITHM }, false, [
    'encrypt',
    'decrypt',
  ])
}

// =============================================================================
// Encryption
// =============================================================================

/**
 * Encrypt plaintext using AES-256-GCM
 */
export async function encrypt(plaintext: string, keyString: string): Promise<string> {
  const key = await deriveKey(keyString)
  const encoder = new TextEncoder()
  const plaintextBuffer = encoder.encode(plaintext)

  // Generate random IV
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH))

  // Encrypt
  const encryptedBuffer = await crypto.subtle.encrypt(
    {
      name: ALGORITHM,
      iv,
      tagLength: TAG_LENGTH,
    },
    key,
    plaintextBuffer
  )

  // The encrypted buffer includes the auth tag at the end
  const encryptedArray = new Uint8Array(encryptedBuffer)

  // Split into ciphertext and tag
  const tagStart = encryptedArray.length - TAG_LENGTH / 8
  const ciphertext = encryptedArray.slice(0, tagStart)
  const tag = encryptedArray.slice(tagStart)

  // Encode to base64 and create result object
  const result: EncryptedData = {
    iv: arrayToBase64(iv),
    data: arrayToBase64(ciphertext),
    tag: arrayToBase64(tag),
  }

  return JSON.stringify(result)
}

/**
 * Decrypt ciphertext using AES-256-GCM
 */
export async function decrypt(encryptedString: string, keyString: string): Promise<string> {
  const key = await deriveKey(keyString)
  const { iv, data, tag } = JSON.parse(encryptedString) as EncryptedData

  // Decode from base64
  const ivArray = base64ToArray(iv)
  const ciphertext = base64ToArray(data)
  const tagArray = base64ToArray(tag)

  // Combine ciphertext and tag (Web Crypto expects them together)
  const combined = new Uint8Array(ciphertext.length + tagArray.length)
  combined.set(ciphertext)
  combined.set(tagArray, ciphertext.length)

  // Decrypt
  const decryptedBuffer = await crypto.subtle.decrypt(
    {
      name: ALGORITHM,
      iv: ivArray,
      tagLength: TAG_LENGTH,
    },
    key,
    combined
  )

  const decoder = new TextDecoder()
  return decoder.decode(decryptedBuffer)
}

// =============================================================================
// Helpers
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

// =============================================================================
// Utilities
// =============================================================================

/**
 * Generate a random encryption key
 */
export function generateEncryptionKey(): string {
  const array = crypto.getRandomValues(new Uint8Array(32))
  return arrayToBase64(array)
}

/**
 * Check if a string is encrypted data
 */
export function isEncrypted(value: string): boolean {
  try {
    const parsed = JSON.parse(value) as Record<string, unknown>
    return (
      typeof parsed === 'object' &&
      parsed !== null &&
      'iv' in parsed &&
      'data' in parsed &&
      'tag' in parsed
    )
  } catch {
    return false
  }
}
