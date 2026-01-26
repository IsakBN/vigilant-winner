/**
 * Patch application utilities for bundle patching with hash verification
 */
import type { ParsedBundle, ParsedModule } from './parser'
import type { ModulePatch, PatchOperation } from './diff'
import { parseBundle, assembleBundle, hashString } from './parser'
import { hashBundle, isValidHashFormat } from './hash'

export interface PatchResult {
  success: boolean
  bundle?: string
  error?: string
}

export interface PatchPayload {
  patch: ModulePatch
  targetHash: string
}

function createModule(id: number, code: string, deps: number[]): ParsedModule {
  return { id, code, dependencies: deps, hash: hashString(code) }
}

/** Apply a single patch operation to a parsed bundle */
export function applyOperation(bundle: ParsedBundle, op: PatchOperation): void {
  const { op: opType, moduleId, code, dependencies } = op

  switch (opType) {
    case 'add':
      if (bundle.modules.has(moduleId)) {
        throw new Error(`Module ${String(moduleId)} already exists, cannot add`)
      }
      if (!code) throw new Error(`Module code required for add operation`)
      bundle.modules.set(moduleId, createModule(moduleId, code, dependencies ?? []))
      break
    case 'replace':
      if (!bundle.modules.has(moduleId)) {
        throw new Error(`Module ${String(moduleId)} does not exist, cannot replace`)
      }
      if (!code) throw new Error(`Module code required for replace operation`)
      bundle.modules.set(moduleId, createModule(moduleId, code, dependencies ?? []))
      break
    case 'delete':
      if (!bundle.modules.has(moduleId)) {
        throw new Error(`Module ${String(moduleId)} does not exist, cannot delete`)
      }
      bundle.modules.delete(moduleId)
      break
    default: {
      const _exhaustive: never = opType
      throw new Error(`Unknown operation type: ${String(_exhaustive)}`)
    }
  }
}

/** Apply a complete patch to a parsed bundle (mutates the bundle) */
export function applyPatch(bundle: ParsedBundle, patch: ModulePatch): void {
  if (patch.prelude !== undefined) bundle.prelude = patch.prelude
  if (patch.postlude !== undefined) bundle.postlude = patch.postlude
  for (const op of patch.operations) applyOperation(bundle, op)
}

/** Full patch workflow: apply patch and verify resulting hash */
export async function applyPatchWithVerification(
  currentBundleSource: string,
  payload: PatchPayload
): Promise<PatchResult> {
  const { patch, targetHash } = payload

  if (!isValidHashFormat(targetHash)) {
    return { success: false, error: `Invalid target hash format: ${targetHash}` }
  }

  try {
    const bundle = parseBundle(currentBundleSource)
    applyPatch(bundle, patch)
    const patchedSource = assembleBundle(bundle)
    const actualHash = await hashBundle(patchedSource)

    if (actualHash !== targetHash) {
      return { success: false, error: `Hash mismatch: expected ${targetHash}, got ${actualHash}` }
    }

    return { success: true, bundle: patchedSource }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { success: false, error: `Patch application failed: ${message}` }
  }
}
