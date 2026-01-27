/**
 * Bundle Validator
 * Validates JavaScript and Hermes bytecode bundles before distribution.
 * @agent builder-completion
 */

import { readFile, stat } from 'fs/promises';
import { HERMES_MAGIC } from './types.js';

export interface ValidationResult {
  valid: boolean;
  bundleType: 'hermes' | 'javascript' | 'unknown';
  size: number;
  errors: string[];
  warnings: string[];
}

export interface ValidationOptions {
  maxSize?: number;
  minSize?: number;
  allowHermes?: boolean;
  allowJavaScript?: boolean;
}

const DEFAULT_OPTIONS: Required<ValidationOptions> = {
  maxSize: 50 * 1024 * 1024,
  minSize: 100,
  allowHermes: true,
  allowJavaScript: true,
};
export async function validateBundle(
  filePath: string,
  options: ValidationOptions = {}
): Promise<ValidationResult> {
  try {
    await stat(filePath);
  } catch {
    return {
      valid: false,
      bundleType: 'unknown',
      size: 0,
      errors: ['Bundle file not found'],
      warnings: [],
    };
  }

  const buffer = await readFile(filePath);
  return validateBuffer(buffer, options);
}

export function validateBuffer(
  buffer: Buffer,
  options: ValidationOptions = {}
): ValidationResult {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const errors: string[] = [];
  const warnings: string[] = [];
  const size = buffer.length;

  // Size validation
  if (size < opts.minSize) {
    errors.push(`Bundle too small: ${size.toString()} bytes (min: ${opts.minSize.toString()})`);
  }
  if (size > opts.maxSize) {
    errors.push(`Bundle too large: ${size.toString()} bytes (max: ${opts.maxSize.toString()})`);
  }

  const bundleType = detectBundleType(buffer);

  // Type validation
  if (bundleType === 'hermes' && !opts.allowHermes) {
    errors.push('Hermes bytecode not allowed');
  }
  if (bundleType === 'javascript' && !opts.allowJavaScript) {
    errors.push('JavaScript bundles not allowed');
  }
  if (bundleType === 'unknown') {
    errors.push('Unknown bundle format');
  }

  // Content validation
  const contentErrors = validateContent(buffer, bundleType);
  errors.push(...contentErrors);

  // Warnings
  if (size > 10 * 1024 * 1024) {
    warnings.push('Bundle is larger than 10MB');
  }

  return {
    valid: errors.length === 0,
    bundleType,
    size,
    errors,
    warnings,
  };
}

export function detectBundleType(buffer: Buffer): 'hermes' | 'javascript' | 'unknown' {
  if (buffer.length < 4) {
    return 'unknown';
  }

  const isHermes = buffer[0] === HERMES_MAGIC[0] &&
    buffer[1] === HERMES_MAGIC[1] &&
    buffer[2] === HERMES_MAGIC[2] &&
    buffer[3] === HERMES_MAGIC[3];

  if (isHermes) return 'hermes';

  const start = buffer.subarray(0, Math.min(1000, buffer.length)).toString('utf8');
  return looksLikeJavaScript(start) ? 'javascript' : 'unknown';
}

function looksLikeJavaScript(content: string): boolean {
  const jsPatterns = [
    /^var\s+/, /^"use strict"/, /^\/\*\*/, /^\/\//, /^function\s+/,
    /^const\s+/, /^let\s+/, /^\(function/, /^!function/, /__d\(/, /__r\(/,
  ];
  return jsPatterns.some(pattern => pattern.test(content.trim()));
}

function validateContent(
  buffer: Buffer,
  bundleType: 'hermes' | 'javascript' | 'unknown'
): string[] {
  if (bundleType === 'hermes') return validateHermesBytecode(buffer);
  if (bundleType === 'javascript') return validateJavaScript(buffer);
  return [];
}

function validateHermesBytecode(buffer: Buffer): string[] {
  const errors: string[] = [];
  if (buffer.length < 128) {
    errors.push('Hermes bytecode too small - possibly corrupted');
    return errors;
  }
  const version = buffer[4];
  if (version > 100) {
    errors.push(`Suspicious Hermes version: ${version.toString()}`);
  }
  return errors;
}

function validateJavaScript(buffer: Buffer): string[] {
  const errors: string[] = [];
  const content = buffer.toString('utf8');
  if (content.includes('\0')) {
    errors.push('JavaScript contains null bytes - possibly corrupted');
  }
  if (content.includes('�')) {
    errors.push('JavaScript contains invalid UTF-8 sequences');
  }
  return errors;
}
