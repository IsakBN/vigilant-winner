/**
 * Bundle manifest tests
 * @agent builder-completion
 */

import { describe, it, expect } from 'vitest';
import {
  createManifestFromBuffer,
  verifyManifest,
  serializeManifest,
  parseManifest,
  formatManifest,
} from './manifest.js';
import { HERMES_MAGIC } from './types.js';

describe('Bundle Manifest', () => {
  const jsBundle = Buffer.from('var x = 1;'.repeat(20));
  const hermesBundle = Buffer.concat([HERMES_MAGIC, Buffer.alloc(200)]);

  describe('createManifestFromBuffer', () => {
    it('should create manifest for JavaScript bundle', () => {
      const manifest = createManifestFromBuffer(jsBundle, {
        version: '1.0.0',
        platform: 'ios',
      });

      expect(manifest.version).toBe('1.0.0');
      expect(manifest.platform).toBe('ios');
      expect(manifest.bundleType).toBe('javascript');
      expect(manifest.isHermes).toBe(false);
      expect(manifest.hash).toHaveLength(64);
      expect(manifest.size).toBe(jsBundle.length);
      expect(manifest.contentType).toBe('application/javascript');
    });

    it('should create manifest for Hermes bundle', () => {
      const manifest = createManifestFromBuffer(hermesBundle, {
        version: '2.0.0',
        platform: 'android',
      });

      expect(manifest.bundleType).toBe('hermes');
      expect(manifest.isHermes).toBe(true);
      expect(manifest.contentType).toBe('application/octet-stream');
    });

    it('should include optional fields', () => {
      const manifest = createManifestFromBuffer(jsBundle, {
        version: '1.0.0',
        platform: 'ios',
        minAppVersion: '1.0.0',
        maxAppVersion: '2.0.0',
        releaseNotes: 'Bug fixes',
      });

      expect(manifest.minAppVersion).toBe('1.0.0');
      expect(manifest.maxAppVersion).toBe('2.0.0');
      expect(manifest.releaseNotes).toBe('Bug fixes');
    });

    it('should set createdAt timestamp', () => {
      const before = Math.floor(Date.now() / 1000);
      const manifest = createManifestFromBuffer(jsBundle, {
        version: '1.0.0',
        platform: 'ios',
      });
      const after = Math.floor(Date.now() / 1000);

      expect(manifest.createdAt).toBeGreaterThanOrEqual(before);
      expect(manifest.createdAt).toBeLessThanOrEqual(after);
    });
  });

  describe('verifyManifest', () => {
    it('should verify valid manifest', () => {
      const manifest = createManifestFromBuffer(jsBundle, {
        version: '1.0.0',
        platform: 'ios',
      });

      const result = verifyManifest(jsBundle, manifest);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect hash mismatch', () => {
      const manifest = createManifestFromBuffer(jsBundle, {
        version: '1.0.0',
        platform: 'ios',
      });

      const differentBuffer = Buffer.from('different content'.repeat(20));
      const result = verifyManifest(differentBuffer, manifest);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Hash mismatch'))).toBe(true);
    });

    it('should detect size mismatch', () => {
      const manifest = createManifestFromBuffer(jsBundle, {
        version: '1.0.0',
        platform: 'ios',
      });
      manifest.size = 999999; // Wrong size

      const result = verifyManifest(jsBundle, manifest);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Size mismatch'))).toBe(true);
    });
  });

  describe('serializeManifest / parseManifest', () => {
    it('should roundtrip manifest', () => {
      const original = createManifestFromBuffer(jsBundle, {
        version: '1.0.0',
        platform: 'ios',
        releaseNotes: 'Test',
      });

      const json = serializeManifest(original);
      const parsed = parseManifest(json);

      expect(parsed.version).toBe(original.version);
      expect(parsed.hash).toBe(original.hash);
      expect(parsed.size).toBe(original.size);
      expect(parsed.platform).toBe(original.platform);
    });

    it('should throw for invalid manifest', () => {
      expect(() => parseManifest('{}')).toThrow('Invalid manifest');
    });
  });

  describe('formatManifest', () => {
    it('should format manifest for display', () => {
      const manifest = createManifestFromBuffer(jsBundle, {
        version: '1.0.0',
        platform: 'ios',
      });

      const formatted = formatManifest(manifest);
      expect(formatted).toContain('Version: 1.0.0');
      expect(formatted).toContain('Platform: ios');
      expect(formatted).toContain('Type: javascript');
    });
  });
});
