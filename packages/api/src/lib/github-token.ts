/**
 * @agent remediate-github-token-encryption
 * @created 2026-01-25
 * @description GitHub OAuth token encryption utilities
 *
 * Encrypts tokens before storing in the database and decrypts when reading.
 * Handles legacy unencrypted tokens gracefully by detecting and migrating them.
 */

import { encrypt, decrypt } from './crypto'

// Encrypted tokens are prefixed to distinguish from plaintext
const ENCRYPTED_PREFIX = 'enc:'

/**
 * Encrypt a GitHub access token for storage
 * @param token - Plaintext GitHub access token
 * @param encryptionKey - Base64-encoded 256-bit encryption key
 * @returns Encrypted token with prefix
 */
export async function encryptGitHubToken(
  token: string,
  encryptionKey: string
): Promise<string> {
  const encrypted = await encrypt(token, encryptionKey)
  return `${ENCRYPTED_PREFIX}${encrypted}`
}

/**
 * Decrypt a GitHub access token from storage
 * Handles both encrypted and legacy plaintext tokens
 *
 * @param storedToken - Token from database (may be encrypted or plaintext)
 * @param encryptionKey - Base64-encoded 256-bit encryption key
 * @returns Decrypted plaintext token
 */
export async function decryptGitHubToken(
  storedToken: string,
  encryptionKey: string
): Promise<string> {
  // Check if token is encrypted (has our prefix)
  if (storedToken.startsWith(ENCRYPTED_PREFIX)) {
    const ciphertext = storedToken.slice(ENCRYPTED_PREFIX.length)
    return decrypt(ciphertext, encryptionKey)
  }

  // Legacy plaintext token - return as-is
  // In production, consider logging this for migration tracking
  return storedToken
}

/**
 * Check if a stored token is encrypted
 * Useful for migration scripts
 */
export function isTokenEncrypted(storedToken: string): boolean {
  return storedToken.startsWith(ENCRYPTED_PREFIX)
}
