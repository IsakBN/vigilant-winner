/**
 * Bundle diffing utilities for generating patch operations
 */

import type { ParsedBundle } from './parser'

export type PatchOperationType = 'add' | 'replace' | 'delete'

export interface PatchOperation {
  op: PatchOperationType
  moduleId: number
  code?: string
  dependencies?: number[]
}

export interface ModulePatch {
  prelude?: string
  postlude?: string
  operations: PatchOperation[]
}

/**
 * Generate a patch that transforms oldBundle into newBundle
 */
export function diffBundles(oldBundle: ParsedBundle, newBundle: ParsedBundle): ModulePatch {
  const operations: PatchOperation[] = []

  // Check for deleted modules
  for (const [id] of oldBundle.modules) {
    if (!newBundle.modules.has(id)) {
      operations.push({ op: 'delete', moduleId: id })
    }
  }

  // Check for added or modified modules
  for (const [id, newMod] of newBundle.modules) {
    const oldMod = oldBundle.modules.get(id)
    if (!oldMod) {
      operations.push({ op: 'add', moduleId: id, code: newMod.code, dependencies: newMod.dependencies })
    } else if (hasModuleChanged(oldMod, newMod)) {
      operations.push({ op: 'replace', moduleId: id, code: newMod.code, dependencies: newMod.dependencies })
    }
  }

  const patch: ModulePatch = { operations }
  if (oldBundle.prelude !== newBundle.prelude) patch.prelude = newBundle.prelude
  if (oldBundle.postlude !== newBundle.postlude) patch.postlude = newBundle.postlude

  return patch
}

function hasModuleChanged(
  oldMod: { code: string; dependencies: number[] },
  newMod: { code: string; dependencies: number[] }
): boolean {
  if (oldMod.code !== newMod.code) return true
  if (oldMod.dependencies.length !== newMod.dependencies.length) return true
  return oldMod.dependencies.some((d, i) => d !== newMod.dependencies[i])
}

/**
 * Calculate the approximate size of a patch in bytes
 */
export function calculatePatchSize(patch: ModulePatch): number {
  let size = 0
  if (patch.prelude) size += patch.prelude.length
  if (patch.postlude) size += patch.postlude.length

  for (const op of patch.operations) {
    size += 20 // Overhead for operation metadata
    if (op.code) size += op.code.length
    if (op.dependencies) size += op.dependencies.length * 4 // 4 bytes per dependency ID
  }

  return size
}
