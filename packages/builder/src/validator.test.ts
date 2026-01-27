/**
 * Bundle validator tests
 * @agent builder-completion
 */

import { describe, it, expect } from 'vitest';
import { validateBuffer, detectBundleType } from './validator.js';
import { HERMES_MAGIC } from './types.js';

describe('Bundle Validator', () => {
  describe('detectBundleType', () => {
    it('should detect Hermes bytecode', () => {
      const hermes = Buffer.concat([HERMES_MAGIC, Buffer.alloc(100)]);
      expect(detectBundleType(hermes)).toBe('hermes');
    });

    it('should detect JavaScript with var', () => {
      const js = Buffer.from('var x = 1;');
      expect(detectBundleType(js)).toBe('javascript');
    });

    it('should detect JavaScript with function', () => {
      const js = Buffer.from('function test() {}');
      expect(detectBundleType(js)).toBe('javascript');
    });

    it('should detect Metro bundler output', () => {
      const metro = Buffer.from('__d(function(g,r,i,a,m,e,d){});');
      expect(detectBundleType(metro)).toBe('javascript');
    });

    it('should return unknown for empty buffer', () => {
      expect(detectBundleType(Buffer.alloc(0))).toBe('unknown');
    });

    it('should return unknown for random binary', () => {
      const random = Buffer.from([0xff, 0xfe, 0x00, 0x01]);
      expect(detectBundleType(random)).toBe('unknown');
    });
  });

  describe('validateBuffer', () => {
    it('should validate valid JavaScript bundle', () => {
      const js = Buffer.from('var React = require("react");'.repeat(10));
      const result = validateBuffer(js);

      expect(result.valid).toBe(true);
      expect(result.bundleType).toBe('javascript');
      expect(result.errors).toHaveLength(0);
    });

    it('should validate valid Hermes bundle', () => {
      const hermes = Buffer.concat([HERMES_MAGIC, Buffer.alloc(200)]);
      const result = validateBuffer(hermes);

      expect(result.valid).toBe(true);
      expect(result.bundleType).toBe('hermes');
    });

    it('should reject too small bundle', () => {
      const tiny = Buffer.from('x');
      const result = validateBuffer(tiny);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('too small'))).toBe(true);
    });

    it('should reject too large bundle', () => {
      const huge = Buffer.alloc(60 * 1024 * 1024); // 60MB
      const result = validateBuffer(huge, { maxSize: 50 * 1024 * 1024 });

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('too large'))).toBe(true);
    });

    it('should warn for large bundles', () => {
      const large = Buffer.alloc(15 * 1024 * 1024).fill('x');
      const result = validateBuffer(large);

      expect(result.warnings.some(w => w.includes('larger than 10MB'))).toBe(true);
    });

    it('should respect allowHermes option', () => {
      const hermes = Buffer.concat([HERMES_MAGIC, Buffer.alloc(200)]);
      const result = validateBuffer(hermes, { allowHermes: false });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Hermes bytecode not allowed');
    });

    it('should respect allowJavaScript option', () => {
      const js = Buffer.from('var x = 1;'.repeat(20));
      const result = validateBuffer(js, { allowJavaScript: false });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('JavaScript bundles not allowed');
    });
  });
});
