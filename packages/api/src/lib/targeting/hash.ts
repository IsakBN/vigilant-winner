/**
 * FNV-1a Hash Algorithm
 *
 * Used for consistent device bucketing in percentage targeting.
 * Same device always gets the same bucket (0-99), ensuring sticky
 * percentage-based rollouts.
 */

/**
 * FNV-1a 32-bit hash function
 *
 * @param str - String to hash
 * @returns 32-bit unsigned integer hash
 */
export function fnv1aHash(str: string): number {
  // FNV-1a offset basis and prime for 32-bit
  let hash = 2166136261

  for (let i = 0; i < str.length; i++) {
    // XOR with byte
    hash ^= str.charCodeAt(i)
    // Multiply by prime and keep as 32-bit unsigned
    hash = Math.imul(hash, 16777619) >>> 0
  }

  return hash
}

/**
 * Get a bucket (0-99) for percentage-based targeting
 *
 * @param deviceId - Device identifier
 * @returns Bucket number 0-99
 */
export function getBucket(deviceId: string): number {
  return fnv1aHash(deviceId) % 100
}
