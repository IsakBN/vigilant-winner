/**
 * Compression Utilities
 *
 * Gzip compression for optimizing bundle downloads.
 * While Hermes bytecode is already compact, gzip can still
 * provide 20-40% size reduction for network transfer.
 *
 * @agent builder-completion
 * @created 2026-01-26
 */

import { gzip, gunzip, constants } from 'zlib';
import { promisify } from 'util';
import { createReadStream, createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import { createGzip, createGunzip } from 'zlib';

const gzipAsync = promisify(gzip);
const gunzipAsync = promisify(gunzip);

/**
 * Compression result with metadata
 */
export interface CompressionResult {
  compressed: Buffer;
  originalSize: number;
  compressedSize: number;
  ratio: number;
}

/**
 * Compress a buffer using gzip
 */
export async function compressBuffer(buffer: Buffer): Promise<CompressionResult> {
  const compressed = await gzipAsync(buffer, {
    level: constants.Z_BEST_COMPRESSION,
  });

  return {
    compressed,
    originalSize: buffer.length,
    compressedSize: compressed.length,
    ratio: compressed.length / buffer.length,
  };
}

/**
 * Decompress a gzip buffer
 */
export async function decompressBuffer(buffer: Buffer): Promise<Buffer> {
  return gunzipAsync(buffer);
}

/**
 * Compress a file to a new file using streaming
 * More memory efficient for large bundles
 */
export async function compressFile(
  inputPath: string,
  outputPath: string
): Promise<void> {
  const gzipStream = createGzip({
    level: constants.Z_BEST_COMPRESSION,
  });

  await pipeline(
    createReadStream(inputPath),
    gzipStream,
    createWriteStream(outputPath)
  );
}

/**
 * Decompress a gzip file using streaming
 */
export async function decompressFile(
  inputPath: string,
  outputPath: string
): Promise<void> {
  await pipeline(
    createReadStream(inputPath),
    createGunzip(),
    createWriteStream(outputPath)
  );
}

/**
 * Check if a buffer is gzip compressed
 * Gzip magic bytes: 1f 8b
 */
export function isGzipCompressed(buffer: Buffer): boolean {
  if (buffer.length < 2) return false;
  return buffer[0] === 0x1f && buffer[1] === 0x8b;
}

/**
 * Format compression ratio as percentage saved
 */
export function formatCompressionRatio(ratio: number): string {
  const saved = (1 - ratio) * 100;
  return `${saved.toFixed(1)}% smaller`;
}
