/**
 * BundleValidator
 *
 * Validates bundle integrity by comparing stored hashes with actual file hashes.
 * Detects corruption and removes invalid bundles to prevent loading bad code.
 */

import type { Storage } from './storage'

/**
 * Configuration for bundle validation.
 */
export interface BundleValidatorConfig {
  /** Calculate hash of file at path */
  hashFile: (path: string) => Promise<string>

  /** Called when validation fails (optional) */
  onValidationFailed?: (version: string, expected: string, actual: string) => void
}

/**
 * Result of a validation check.
 */
export interface ValidationResult {
  valid: boolean
  reason?: 'hash_match' | 'legacy_bundle' | 'hash_mismatch'
}

/**
 * Validates bundle hashes before execution to detect corruption.
 */
export class BundleValidator {
  constructor(
    private storage: Storage,
    private config: BundleValidatorConfig
  ) {}

  /**
   * Validate a bundle's hash before loading.
   *
   * @param version - Bundle version identifier
   * @param bundlePath - Path to bundle file on disk
   * @returns true if valid, false if invalid (bundle removed)
   */
  async validateBundle(version: string, bundlePath: string): Promise<boolean> {
    const result = await this.validateBundleDetailed(version, bundlePath)
    return result.valid
  }

  /**
   * Validate a bundle with detailed result information.
   *
   * @param version - Bundle version identifier
   * @param bundlePath - Path to bundle file on disk
   * @returns Detailed validation result
   */
  async validateBundleDetailed(
    version: string,
    bundlePath: string
  ): Promise<ValidationResult> {
    const expectedHash = this.storage.getBundleHash(version)

    // Legacy bundle without stored hash - allow it
    if (!expectedHash) {
      return { valid: true, reason: 'legacy_bundle' }
    }

    const actualHash = await this.config.hashFile(bundlePath)

    if (actualHash === expectedHash) {
      return { valid: true, reason: 'hash_match' }
    }

    // Hash mismatch - bundle is corrupted
    console.warn(
      `[BundleNudge] Hash mismatch for version ${version}: ` +
        `expected ${expectedHash}, got ${actualHash}`
    )

    // Remove corrupted bundle from storage
    await this.storage.removeBundleVersion(version)

    // Notify callback if provided
    this.config.onValidationFailed?.(version, expectedHash, actualHash)

    return { valid: false, reason: 'hash_mismatch' }
  }
}
