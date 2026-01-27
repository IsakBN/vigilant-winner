/**
 * Hash Utilities
 *
 * SHA-256 hashing for bundle integrity verification.
 * Used to generate deterministic hashes for bundles that the SDK
 * can verify after download.
 *
 * @agent builder-completion
 * @created 2026-01-26
 */

import { createHash } from 'crypto';
import { createReadStream } from 'fs';
import { stat } from 'fs/promises';

/**
 * Calculate SHA-256 hash of a buffer
 */
export function hashBuffer(buffer: Buffer): string {
  return createHash('sha256').update(buffer).digest('hex');
}

/**
 * Calculate SHA-256 hash of a string
 */
export function hashString(content: string): string {
  return createHash('sha256').update(content, 'utf8').digest('hex');
}

/**
 * Calculate SHA-256 hash of a file using streaming
 * More memory efficient for large bundles
 */
export async function hashFile(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = createHash('sha256');
    const stream = createReadStream(filePath);

    stream.on('data', (chunk: string | Buffer) => {
      hash.update(chunk);
    });

    stream.on('end', () => {
      resolve(hash.digest('hex'));
    });

    stream.on('error', (err) => {
      reject(new Error(`Failed to hash file: ${err.message}`));
    });
  });
}

/**
 * Calculate hash and file size together (common operation)
 */
export async function hashFileWithSize(
  filePath: string
): Promise<{ hash: string; size: number }> {
  const [hash, stats] = await Promise.all([
    hashFile(filePath),
    stat(filePath),
  ]);

  return { hash, size: stats.size };
}

/**
 * Verify a buffer matches an expected hash
 */
export function verifyHash(buffer: Buffer, expectedHash: string): boolean {
  const actualHash = hashBuffer(buffer);
  return constantTimeEqual(actualHash, expectedHash);
}

/**
 * Constant-time comparison to prevent timing attacks
 */
function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}
