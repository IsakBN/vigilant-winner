/**
 * Bundle Manifest
 *
 * Creates manifest metadata for bundles that the SDK uses to
 * verify downloads and manage updates.
 *
 * @agent builder-completion
 * @created 2026-01-26
 */

import { readFile, stat } from 'fs/promises';
import { hashBuffer } from './utils/hash.js';
import { detectBundleType } from './validator.js';
import type { Platform } from './types.js';

/**
 * Bundle manifest structure
 */
export interface BundleManifest {
  /** Bundle version */
  version: string;
  /** SHA-256 hash of bundle content */
  hash: string;
  /** Bundle size in bytes */
  size: number;
  /** Target platform */
  platform: Platform;
  /** Whether bundle is Hermes bytecode */
  isHermes: boolean;
  /** Minimum app version required */
  minAppVersion?: string;
  /** Maximum app version supported */
  maxAppVersion?: string;
  /** Creation timestamp (Unix epoch seconds) */
  createdAt: number;
  /** Optional release notes */
  releaseNotes?: string;
  /** Bundle type (hermes/javascript) */
  bundleType: 'hermes' | 'javascript' | 'unknown';
  /** Content type for HTTP headers */
  contentType: string;
}

/**
 * Options for creating a manifest
 */
export interface ManifestOptions {
  version: string;
  platform: Platform;
  minAppVersion?: string;
  maxAppVersion?: string;
  releaseNotes?: string;
}

/**
 * Create a manifest from a bundle file
 */
export async function createManifest(
  filePath: string,
  options: ManifestOptions
): Promise<BundleManifest> {
  const [buffer, stats] = await Promise.all([
    readFile(filePath),
    stat(filePath),
  ]);

  return createManifestFromBuffer(buffer, {
    ...options,
    size: stats.size,
  });
}

/**
 * Create a manifest from a buffer
 */
export function createManifestFromBuffer(
  buffer: Buffer,
  options: ManifestOptions & { size?: number }
): BundleManifest {
  const hash = hashBuffer(buffer);
  const size = options.size ?? buffer.length;
  const bundleType = detectBundleType(buffer);
  const isHermes = bundleType === 'hermes';

  return {
    version: options.version,
    hash,
    size,
    platform: options.platform,
    isHermes,
    bundleType,
    contentType: getContentType(bundleType),
    createdAt: Math.floor(Date.now() / 1000),
    minAppVersion: options.minAppVersion,
    maxAppVersion: options.maxAppVersion,
    releaseNotes: options.releaseNotes,
  };
}

/**
 * Verify a bundle matches its manifest
 */
export function verifyManifest(buffer: Buffer, manifest: BundleManifest): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Verify hash
  const actualHash = hashBuffer(buffer);
  if (actualHash !== manifest.hash) {
    errors.push(`Hash mismatch: expected ${manifest.hash}, got ${actualHash}`);
  }

  // Verify size
  if (buffer.length !== manifest.size) {
    errors.push(`Size mismatch: expected ${String(manifest.size)}, got ${String(buffer.length)}`);
  }

  // Verify bundle type
  const actualType = detectBundleType(buffer);
  if (actualType !== manifest.bundleType) {
    errors.push(`Type mismatch: expected ${manifest.bundleType}, got ${actualType}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Serialize manifest to JSON string
 */
export function serializeManifest(manifest: BundleManifest): string {
  return JSON.stringify(manifest, null, 2);
}

/**
 * Parse manifest from JSON string
 */
export function parseManifest(json: string): BundleManifest {
  const parsed = JSON.parse(json) as BundleManifest;

  // Validate required fields
  const required: (keyof BundleManifest)[] = [
    'version', 'hash', 'size', 'platform', 'isHermes',
    'bundleType', 'contentType', 'createdAt',
  ];

  for (const field of required) {
    if (parsed[field] === undefined) {
      throw new Error(`Invalid manifest: missing ${field}`);
    }
  }

  return parsed;
}

/**
 * Get content type for bundle
 */
function getContentType(bundleType: 'hermes' | 'javascript' | 'unknown'): string {
  return bundleType === 'hermes'
    ? 'application/octet-stream'
    : 'application/javascript';
}

/**
 * Format manifest for logging
 */
export function formatManifest(manifest: BundleManifest): string {
  const lines = [
    `Version: ${manifest.version}`,
    `Platform: ${manifest.platform}`,
    `Type: ${manifest.bundleType}${manifest.isHermes ? ' (Hermes)' : ''}`,
    `Size: ${formatBytes(manifest.size)}`,
    `Hash: ${manifest.hash.slice(0, 16)}...`,
    `Created: ${new Date(manifest.createdAt * 1000).toISOString()}`,
  ];

  if (manifest.minAppVersion) {
    lines.push(`Min App Version: ${manifest.minAppVersion}`);
  }
  if (manifest.maxAppVersion) {
    lines.push(`Max App Version: ${manifest.maxAppVersion}`);
  }

  return lines.join('\n');
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${String(bytes)} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
