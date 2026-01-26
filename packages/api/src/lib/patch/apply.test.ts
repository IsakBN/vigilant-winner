import { describe, it, expect } from 'vitest'
import { applyOperation, applyPatch, applyPatchWithVerification } from './apply'
import type { ParsedBundle, ParsedModule } from './parser'
import type { ModulePatch, PatchOperation } from './diff'
import { hashBundle } from './hash'
import { assembleBundle, hashString } from './parser'

function createModule(id: number, code: string, deps: number[]): ParsedModule {
  const fullCode = `function(g,r,i,a,m,e,d){${code}}`
  return { id, code: fullCode, dependencies: deps, hash: hashString(fullCode) }
}

function createTestBundle(): ParsedBundle {
  return {
    prelude: 'var __DEV__=true;',
    modules: new Map([
      [0, createModule(0, 'console.log("main")', [1, 2])],
      [1, createModule(1, 'exports.foo="bar"', [])],
      [2, createModule(2, 'exports.baz=42', [])],
    ]),
    postlude: 'require(0);',
  }
}

function getModuleCode(innerCode: string): string {
  return `function(g,r,i,a,m,e,d){${innerCode}}`
}

describe('applyOperation', () => {
  it('applies add operation', () => {
    const bundle = createTestBundle()
    const code = getModuleCode('exports.new="module"')
    const op: PatchOperation = { op: 'add', moduleId: 3, code, dependencies: [] }

    applyOperation(bundle, op)

    expect(bundle.modules.has(3)).toBe(true)
    expect(bundle.modules.get(3)?.code).toBe(code)
  })

  it('applies replace operation', () => {
    const bundle = createTestBundle()
    const code = getModuleCode('exports.foo="updated"')
    const op: PatchOperation = { op: 'replace', moduleId: 1, code, dependencies: [] }

    applyOperation(bundle, op)

    expect(bundle.modules.get(1)?.code).toBe(code)
  })

  it('applies delete operation', () => {
    const bundle = createTestBundle()
    const op: PatchOperation = { op: 'delete', moduleId: 2 }

    applyOperation(bundle, op)

    expect(bundle.modules.has(2)).toBe(false)
    expect(bundle.modules.size).toBe(2)
  })

  it('throws on duplicate add', () => {
    const bundle = createTestBundle()
    const op: PatchOperation = { op: 'add', moduleId: 1, code: 'duplicate', dependencies: [] }

    expect(() => { applyOperation(bundle, op) }).toThrow('already exists')
  })

  it('throws on missing replace', () => {
    const bundle = createTestBundle()
    const op: PatchOperation = { op: 'replace', moduleId: 99, code: 'nonexistent', dependencies: [] }

    expect(() => { applyOperation(bundle, op) }).toThrow('does not exist')
  })

  it('throws on missing delete', () => {
    const bundle = createTestBundle()
    const op: PatchOperation = { op: 'delete', moduleId: 99 }

    expect(() => { applyOperation(bundle, op) }).toThrow('does not exist')
  })
})

describe('applyPatch', () => {
  it('applies prelude change', () => {
    const bundle = createTestBundle()
    const patch: ModulePatch = { prelude: 'var __DEV__=false;', operations: [] }

    applyPatch(bundle, patch)

    expect(bundle.prelude).toBe('var __DEV__=false;')
  })

  it('applies postlude change', () => {
    const bundle = createTestBundle()
    const patch: ModulePatch = { postlude: ';require(0);console.log("done");', operations: [] }

    applyPatch(bundle, patch)

    expect(bundle.postlude).toBe(';require(0);console.log("done");')
  })

  it('applies multiple operations', () => {
    const bundle = createTestBundle()
    const newCode = getModuleCode('new')
    const updatedCode = getModuleCode('updated')
    const patch: ModulePatch = {
      operations: [
        { op: 'delete', moduleId: 2 },
        { op: 'add', moduleId: 3, code: newCode, dependencies: [] },
        { op: 'replace', moduleId: 1, code: updatedCode, dependencies: [3] },
      ],
    }

    applyPatch(bundle, patch)

    expect(bundle.modules.has(2)).toBe(false)
    expect(bundle.modules.has(3)).toBe(true)
    expect(bundle.modules.get(1)?.code).toBe(updatedCode)
    expect(bundle.modules.get(1)?.dependencies).toEqual([3])
  })
})

describe('applyPatchWithVerification', () => {
  it('succeeds with valid patch and hash', async () => {
    const bundle = createTestBundle()
    const originalSource = assembleBundle(bundle)

    // Create patched version
    const patchedBundle = createTestBundle()
    const patchedMod = createModule(1, 'exports.foo="patched"', [])
    patchedBundle.modules.set(1, patchedMod)
    const expectedSource = assembleBundle(patchedBundle)
    const targetHash = await hashBundle(expectedSource)

    const patch: ModulePatch = {
      operations: [{ op: 'replace', moduleId: 1, code: patchedMod.code, dependencies: [] }],
    }

    const result = await applyPatchWithVerification(originalSource, { patch, targetHash })

    expect(result.success).toBe(true)
    expect(result.bundle).toBe(expectedSource)
    expect(result.error).toBeUndefined()
  })

  it('fails with hash mismatch', async () => {
    const bundle = createTestBundle()
    const originalSource = assembleBundle(bundle)

    const wrongHash = 'sha256:' + '0'.repeat(64)
    const patchedMod = createModule(1, 'exports.foo="patched"', [])
    const patch: ModulePatch = {
      operations: [{ op: 'replace', moduleId: 1, code: patchedMod.code, dependencies: [] }],
    }

    const result = await applyPatchWithVerification(originalSource, { patch, targetHash: wrongHash })

    expect(result.success).toBe(false)
    expect(result.error).toContain('Hash mismatch')
    expect(result.bundle).toBeUndefined()
  })

  it('fails with invalid hash format', async () => {
    const bundle = createTestBundle()
    const originalSource = assembleBundle(bundle)

    const patch: ModulePatch = { operations: [] }

    const result = await applyPatchWithVerification(originalSource, { patch, targetHash: 'invalid' })

    expect(result.success).toBe(false)
    expect(result.error).toContain('Invalid target hash format')
  })

  it('fails when patch operation fails', async () => {
    const bundle = createTestBundle()
    const originalSource = assembleBundle(bundle)

    const patch: ModulePatch = { operations: [{ op: 'delete', moduleId: 999 }] }
    const targetHash = 'sha256:' + 'a'.repeat(64)

    const result = await applyPatchWithVerification(originalSource, { patch, targetHash })

    expect(result.success).toBe(false)
    expect(result.error).toContain('does not exist')
  })
})
