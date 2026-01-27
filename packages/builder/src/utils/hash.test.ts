/**
 * Hash utilities tests
 * @agent builder-completion
 */

import { describe, it, expect } from 'vitest';
import { hashBuffer, hashString, verifyHash } from './hash.js';

describe('Hash Utilities', () => {
  describe('hashBuffer', () => {
    it('should return consistent hash for same content', () => {
      const buffer = Buffer.from('hello world');
      const hash1 = hashBuffer(buffer);
      const hash2 = hashBuffer(buffer);
      expect(hash1).toBe(hash2);
    });

    it('should return different hash for different content', () => {
      const hash1 = hashBuffer(Buffer.from('hello'));
      const hash2 = hashBuffer(Buffer.from('world'));
      expect(hash1).not.toBe(hash2);
    });

    it('should return 64 character hex string', () => {
      const hash = hashBuffer(Buffer.from('test'));
      expect(hash).toHaveLength(64);
      expect(hash).toMatch(/^[a-f0-9]+$/);
    });

    it('should match known SHA-256 hash', () => {
      // SHA-256 of "hello world" is well-known
      const hash = hashBuffer(Buffer.from('hello world'));
      expect(hash).toBe('b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9');
    });
  });

  describe('hashString', () => {
    it('should hash string content', () => {
      const hash = hashString('hello world');
      expect(hash).toBe('b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9');
    });

    it('should handle empty string', () => {
      const hash = hashString('');
      expect(hash).toHaveLength(64);
    });

    it('should handle unicode', () => {
      const hash = hashString('こんにちは');
      expect(hash).toHaveLength(64);
    });
  });

  describe('verifyHash', () => {
    it('should return true for matching hash', () => {
      const buffer = Buffer.from('hello world');
      const hash = hashBuffer(buffer);
      expect(verifyHash(buffer, hash)).toBe(true);
    });

    it('should return false for non-matching hash', () => {
      const buffer = Buffer.from('hello world');
      const wrongHash = 'a'.repeat(64);
      expect(verifyHash(buffer, wrongHash)).toBe(false);
    });

    it('should return false for different length hash', () => {
      const buffer = Buffer.from('hello');
      expect(verifyHash(buffer, 'short')).toBe(false);
    });
  });
});
