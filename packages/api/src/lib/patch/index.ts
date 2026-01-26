/**
 * Patch module - bundle parsing, diffing, and application
 *
 * This module provides utilities for working with Metro-format React Native
 * bundles, including parsing, diffing, patching, and hash verification.
 */

// Parser - bundle parsing and assembly
export { parseBundle, assembleBundle } from './parser'
export type { ParsedModule, ParsedBundle } from './parser'

// Diff - generating patches between bundles
export { diffBundles, calculatePatchSize } from './diff'
export type { PatchOperation, PatchOperationType, ModulePatch } from './diff'

// Apply - applying patches to bundles
export { applyPatch, applyOperation, applyPatchWithVerification } from './apply'
export type { PatchResult, PatchPayload } from './apply'

// Hash - bundle verification
export { hashBundle, isValidHashFormat, verifyHash, HASH_REGEX } from './hash'
