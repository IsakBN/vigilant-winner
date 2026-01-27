/**
 * @bundlenudge/builder
 *
 * Bundle builder with Hermes bytecode compilation support.
 *
 * @agent builder-completion
 * @modified 2026-01-26
 */

// Build functionality
export { build } from './build.js';

// Hermes compilation
export {
  detectHermesCompiler,
  compileToHermes,
  isHermesBytecode,
} from './hermes.js';

// Upload
export { uploadToR2, getBundleContentType } from './upload.js';

// Validation
export {
  validateBundle,
  validateBuffer,
  detectBundleType,
  type ValidationResult,
  type ValidationOptions,
} from './validator.js';

// Manifest
export {
  createManifest,
  createManifestFromBuffer,
  verifyManifest,
  serializeManifest,
  parseManifest,
  formatManifest,
  type BundleManifest,
  type ManifestOptions,
} from './manifest.js';

// Hash utilities
export {
  hashBuffer,
  hashString,
  hashFile,
  hashFileWithSize,
  verifyHash,
} from './utils/hash.js';

// Compression utilities
export {
  compressBuffer,
  decompressBuffer,
  compressFile,
  decompressFile,
  isGzipCompressed,
  formatCompressionRatio,
  type CompressionResult,
} from './utils/compress.js';

// Types
export type {
  BuildConfig,
  BuildResult,
  HermesConfig,
  HermesResult,
  UploadOptions,
  Platform,
  PackageManager,
} from './types.js';

export { HERMES_MAGIC } from './types.js';
