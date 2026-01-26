import { describe, expect, it } from 'vitest'
import type { ParsedBundle, ParsedModule } from './parser'
import { calculatePatchSize, diffBundles } from './diff'

function createModule(id: number, code: string, deps: number[] = [], hash?: string): ParsedModule {
  return { id, code, dependencies: deps, hash: hash ?? `hash-${String(id)}-${String(code.length)}` }
}

function createBundle(modules: ParsedModule[], prelude = 'prelude', postlude = 'postlude'): ParsedBundle {
  const moduleMap = new Map<number, ParsedModule>()
  for (const m of modules) moduleMap.set(m.id, m)
  return { prelude, modules: moduleMap, postlude }
}

describe('diffBundles', () => {
  it('detects added modules', () => {
    const oldBundle = createBundle([createModule(1, 'code1')])
    const newBundle = createBundle([createModule(1, 'code1'), createModule(2, 'code2', [1])])
    const patch = diffBundles(oldBundle, newBundle)
    expect(patch.operations).toHaveLength(1)
    expect(patch.operations[0]).toEqual({ op: 'add', moduleId: 2, code: 'code2', dependencies: [1] })
  })

  it('detects deleted modules', () => {
    const oldBundle = createBundle([createModule(1, 'code1'), createModule(2, 'code2')])
    const newBundle = createBundle([createModule(1, 'code1')])
    const patch = diffBundles(oldBundle, newBundle)
    expect(patch.operations).toHaveLength(1)
    expect(patch.operations[0]).toEqual({ op: 'delete', moduleId: 2 })
  })

  it('detects replaced modules when hash changes', () => {
    const oldBundle = createBundle([createModule(1, 'code1', [], 'hash-old')])
    const newBundle = createBundle([createModule(1, 'code1-updated', [], 'hash-new')])
    const patch = diffBundles(oldBundle, newBundle)
    expect(patch.operations).toHaveLength(1)
    expect(patch.operations[0]).toEqual({ op: 'replace', moduleId: 1, code: 'code1-updated', dependencies: [] })
  })

  it('ignores unchanged modules', () => {
    const module = createModule(1, 'code1', [])
    const patch = diffBundles(createBundle([module]), createBundle([module]))
    expect(patch.operations).toHaveLength(0)
  })

  it('includes prelude when changed', () => {
    const patch = diffBundles(createBundle([], 'old'), createBundle([], 'new'))
    expect(patch.prelude).toBe('new')
  })

  it('includes postlude when changed', () => {
    const patch = diffBundles(createBundle([], 'p', 'old'), createBundle([], 'p', 'new'))
    expect(patch.postlude).toBe('new')
  })

  it('omits prelude when unchanged', () => {
    const patch = diffBundles(createBundle([], 'same'), createBundle([], 'same'))
    expect(patch.prelude).toBeUndefined()
  })

  it('omits postlude when unchanged', () => {
    const patch = diffBundles(createBundle([], 'p', 'same'), createBundle([], 'p', 'same'))
    expect(patch.postlude).toBeUndefined()
  })

  it('returns empty patch for identical bundles', () => {
    const bundle = createBundle([createModule(1, 'code1')])
    const patch = diffBundles(bundle, bundle)
    expect(patch.operations).toHaveLength(0)
    expect(patch.prelude).toBeUndefined()
    expect(patch.postlude).toBeUndefined()
  })

  it('handles complex diff with multiple changes', () => {
    const oldBundle = createBundle([
      createModule(1, 'unchanged', [], 'hash1'),
      createModule(2, 'to-delete', [], 'hash2'),
      createModule(3, 'to-replace', [], 'hash3'),
    ])
    const newBundle = createBundle([
      createModule(1, 'unchanged', [], 'hash1'),
      createModule(3, 'replaced', [1], 'hash3-new'),
      createModule(4, 'added', [1, 3], 'hash4'),
    ])
    const patch = diffBundles(oldBundle, newBundle)
    expect(patch.operations).toHaveLength(3)
    expect(patch.operations.find((o) => o.op === 'delete')).toEqual({ op: 'delete', moduleId: 2 })
    expect(patch.operations.find((o) => o.op === 'add')).toEqual({ op: 'add', moduleId: 4, code: 'added', dependencies: [1, 3] })
    expect(patch.operations.find((o) => o.op === 'replace')).toEqual({ op: 'replace', moduleId: 3, code: 'replaced', dependencies: [1] })
  })
})

describe('calculatePatchSize', () => {
  it('returns zero for empty patch', () => {
    expect(calculatePatchSize({ operations: [] })).toBe(0)
  })

  it('includes prelude length', () => {
    expect(calculatePatchSize({ operations: [], prelude: '12345' })).toBe(5)
  })

  it('includes postlude length', () => {
    expect(calculatePatchSize({ operations: [], postlude: '1234567890' })).toBe(10)
  })

  it('includes operation overhead', () => {
    expect(calculatePatchSize({ operations: [{ op: 'delete' as const, moduleId: 1 }] })).toBe(20)
  })

  it('includes code length in operations', () => {
    const patch = { operations: [{ op: 'add' as const, moduleId: 1, code: '12345' }] }
    expect(calculatePatchSize(patch)).toBe(25) // 20 overhead + 5 code
  })

  it('includes dependencies size', () => {
    const patch = { operations: [{ op: 'add' as const, moduleId: 1, dependencies: [1, 2, 3] }] }
    expect(calculatePatchSize(patch)).toBe(32) // 20 overhead + 12 deps (3*4)
  })

  it('calculates total size correctly', () => {
    const patch = {
      prelude: '12345',
      postlude: '12345',
      operations: [
        { op: 'add' as const, moduleId: 1, code: '1234567890', dependencies: [1, 2] },
        { op: 'delete' as const, moduleId: 2 },
      ],
    }
    expect(calculatePatchSize(patch)).toBe(68) // 5 + 5 + (20 + 10 + 8) + 20
  })
})
