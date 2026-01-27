/**
 * Hermes compilation tests
 */

import { describe, it, expect } from 'vitest';
import { isHermesBytecode, detectHermesCompiler } from './hermes.js';
import { HERMES_MAGIC } from './types.js';

describe('isHermesBytecode', () => {
  it('returns true for valid Hermes bytecode', () => {
    const buffer = Buffer.from([0xc6, 0x1f, 0xbc, 0x03, 0x00, 0x00]);
    expect(isHermesBytecode(buffer)).toBe(true);
  });

  it('returns false for JavaScript bundle', () => {
    const buffer = Buffer.from('var __BUNDLE_START_TIME__=this.nativePerformanceNow?nativePerformanceNow():Date.now()');
    expect(isHermesBytecode(buffer)).toBe(false);
  });

  it('returns false for empty buffer', () => {
    const buffer = Buffer.alloc(0);
    expect(isHermesBytecode(buffer)).toBe(false);
  });

  it('returns false for buffer smaller than magic bytes', () => {
    const buffer = Buffer.from([0xc6, 0x1f]);
    expect(isHermesBytecode(buffer)).toBe(false);
  });

  it('returns false for wrong magic bytes', () => {
    const buffer = Buffer.from([0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
    expect(isHermesBytecode(buffer)).toBe(false);
  });
});

describe('HERMES_MAGIC', () => {
  it('contains correct magic bytes', () => {
    expect(HERMES_MAGIC[0]).toBe(0xc6);
    expect(HERMES_MAGIC[1]).toBe(0x1f);
    expect(HERMES_MAGIC[2]).toBe(0xbc);
    expect(HERMES_MAGIC[3]).toBe(0x03);
  });
});

describe('detectHermesCompiler', () => {
  it('returns disabled config when compiler not found', () => {
    const result = detectHermesCompiler('/nonexistent/path');
    expect(result.enabled).toBe(false);
    expect(result.compilerPath).toBeNull();
  });

  it('returns disabled config for non-existent iOS path', () => {
    const result = detectHermesCompiler('/tmp', 'ios');
    expect(result.enabled).toBe(false);
    expect(result.compilerPath).toBeNull();
  });

  it('returns disabled config for non-existent Android path', () => {
    const result = detectHermesCompiler('/tmp', 'android');
    expect(result.enabled).toBe(false);
    expect(result.compilerPath).toBeNull();
  });
});
