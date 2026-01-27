/**
 * Compression utilities tests
 * @agent builder-completion
 */

import { describe, it, expect } from 'vitest';
import {
  compressBuffer,
  decompressBuffer,
  isGzipCompressed,
  formatCompressionRatio,
} from './compress.js';

describe('Compression Utilities', () => {
  describe('compressBuffer', () => {
    it('should compress data', async () => {
      // Use highly repetitive data that compresses well
      const original = Buffer.from('hello world '.repeat(100));
      const result = await compressBuffer(original);

      expect(result.compressed.length).toBeLessThan(original.length);
      expect(result.originalSize).toBe(original.length);
      expect(result.compressedSize).toBe(result.compressed.length);
      expect(result.ratio).toBeLessThan(1);
    });

    it('should handle empty buffer', async () => {
      const result = await compressBuffer(Buffer.alloc(0));
      expect(result.originalSize).toBe(0);
      expect(result.compressed).toBeDefined();
    });

    it('should produce valid gzip output', async () => {
      const original = Buffer.from('test data');
      const result = await compressBuffer(original);
      expect(isGzipCompressed(result.compressed)).toBe(true);
    });
  });

  describe('decompressBuffer', () => {
    it('should decompress to original data', async () => {
      const original = Buffer.from('hello world');
      const compressed = await compressBuffer(original);
      const decompressed = await decompressBuffer(compressed.compressed);

      expect(decompressed.toString()).toBe(original.toString());
    });

    it('should handle large data', async () => {
      const original = Buffer.alloc(100000, 'x');
      const compressed = await compressBuffer(original);
      const decompressed = await decompressBuffer(compressed.compressed);

      expect(decompressed.length).toBe(original.length);
    });
  });

  describe('isGzipCompressed', () => {
    it('should detect gzip magic bytes', async () => {
      const original = Buffer.from('test');
      const compressed = await compressBuffer(original);
      expect(isGzipCompressed(compressed.compressed)).toBe(true);
    });

    it('should return false for non-gzip data', () => {
      const plain = Buffer.from('hello world');
      expect(isGzipCompressed(plain)).toBe(false);
    });

    it('should return false for empty buffer', () => {
      expect(isGzipCompressed(Buffer.alloc(0))).toBe(false);
    });

    it('should return false for single byte', () => {
      expect(isGzipCompressed(Buffer.from([0x1f]))).toBe(false);
    });
  });

  describe('formatCompressionRatio', () => {
    it('should format 50% compression', () => {
      expect(formatCompressionRatio(0.5)).toBe('50.0% smaller');
    });

    it('should format 25% compression', () => {
      expect(formatCompressionRatio(0.75)).toBe('25.0% smaller');
    });

    it('should handle no compression', () => {
      expect(formatCompressionRatio(1.0)).toBe('0.0% smaller');
    });

    it('should handle expansion (negative compression)', () => {
      expect(formatCompressionRatio(1.1)).toBe('-10.0% smaller');
    });
  });
});
