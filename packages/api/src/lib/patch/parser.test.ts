import { describe, it, expect } from 'vitest'
import { parseBundle, assembleBundle, hashString } from './parser'

describe('parseBundle', () => {
  it('parses a simple bundle with 2 modules', () => {
    const bundle = `var __BUNDLE_START_TIME__=Date.now();
__d(function(g,r,i,a,m,e,d){m.exports={name:"app"}},0,[]);
__d(function(g,r,i,a,m,e,d){console.log("hello")},1,[0]);
require(0);`
    const result = parseBundle(bundle)
    expect(result.modules.size).toBe(2)
    expect(result.prelude).toContain('__BUNDLE_START_TIME__')
    expect(result.postlude).toContain('require(0)')
  })

  it('extracts module IDs correctly', () => {
    const bundle = `pre\n__d(function(g,r,i,a,m,e,d){},42,[]);\n__d(function(g,r,i,a,m,e,d){},100,[42]);\npost`
    const result = parseBundle(bundle)
    expect(result.modules.has(42)).toBe(true)
    expect(result.modules.has(100)).toBe(true)
    expect(result.modules.get(42)?.id).toBe(42)
    expect(result.modules.get(100)?.id).toBe(100)
  })

  it('extracts dependencies correctly', () => {
    const bundle = `pre\n__d(function(g,r,i,a,m,e,d){},0,[]);\n__d(function(g,r,i,a,m,e,d){},1,[0]);\n__d(function(g,r,i,a,m,e,d){},2,[0, 1, 42]);\nend`
    const result = parseBundle(bundle)
    expect(result.modules.get(0)?.dependencies).toEqual([])
    expect(result.modules.get(1)?.dependencies).toEqual([0])
    expect(result.modules.get(2)?.dependencies).toEqual([0, 1, 42])
  })

  it('handles strings with special characters', () => {
    const bundle = `pre\n__d(function(g,r,i,a,m,e,d){var x="hello (world)";var y='test\\'s';},0,[]);\npost`
    const result = parseBundle(bundle)
    expect(result.modules.size).toBe(1)
    const mod = result.modules.get(0)
    expect(mod?.code).toContain('"hello (world)"')
    expect(mod?.code).toContain("'test\\'s'")
  })

  it('handles nested braces correctly', () => {
    const bundle = `pre\n__d(function(g,r,i,a,m,e,d){if(true){if(false){var x=1;}}},0,[]);\npost`
    const result = parseBundle(bundle)
    expect(result.modules.size).toBe(1)
    expect(result.modules.get(0)?.code).toContain('if(true){if(false)')
  })

  it('handles template literals', () => {
    const bundle = `pre\n__d(function(g,r,i,a,m,e,d){var x=\`hello \${name}\`;},0,[]);\npost`
    const result = parseBundle(bundle)
    expect(result.modules.size).toBe(1)
    expect(result.modules.get(0)?.code).toContain('`hello ${name}`')
  })

  it('throws on invalid bundle without __d calls', () => {
    const bundle = `var x = 1; console.log(x);`
    expect(() => parseBundle(bundle)).toThrow('Invalid bundle: no __d() calls found')
  })

  it('throws on unmatched parenthesis', () => {
    const bundle = `pre\n__d(function(g,r,i,a,m,e,d){console.log("unclosed`
    expect(() => parseBundle(bundle)).toThrow('unmatched parenthesis')
  })
})

describe('assembleBundle', () => {
  it('reassembles bundle correctly', () => {
    const original = `prelude\n__d(function(g,r,i,a,m,e,d){},0,[]);\n__d(function(g,r,i,a,m,e,d){},1,[0]);\npostlude`
    const parsed = parseBundle(original)
    const assembled = assembleBundle(parsed)
    expect(assembled).toContain('prelude')
    expect(assembled).toContain('__d(function(g,r,i,a,m,e,d){},0,[]);')
    expect(assembled).toContain('__d(function(g,r,i,a,m,e,d){},1,[0]);')
    expect(assembled).toContain('postlude')
  })

  it('sorts modules by ID', () => {
    const parsed = {
      prelude: 'pre\n',
      modules: new Map([
        [5, { id: 5, code: 'function(g,r,i,a,m,e,d){}', dependencies: [], hash: '1' }],
        [1, { id: 1, code: 'function(g,r,i,a,m,e,d){}', dependencies: [], hash: '2' }],
        [3, { id: 3, code: 'function(g,r,i,a,m,e,d){}', dependencies: [], hash: '3' }],
      ]),
      postlude: 'post',
    }
    const assembled = assembleBundle(parsed)
    const idx1 = assembled.indexOf(',1,[')
    const idx3 = assembled.indexOf(',3,[')
    const idx5 = assembled.indexOf(',5,[')
    expect(idx1).toBeLessThan(idx3)
    expect(idx3).toBeLessThan(idx5)
  })

  it('preserves prelude and postlude', () => {
    const parsed = {
      prelude: 'var START=Date.now();\n',
      modules: new Map([
        [0, { id: 0, code: 'function(g,r,i,a,m,e,d){}', dependencies: [], hash: 'x' }],
      ]),
      postlude: 'require(0);',
    }
    const assembled = assembleBundle(parsed)
    expect(assembled.startsWith('var START=Date.now();\n')).toBe(true)
    expect(assembled.endsWith('require(0);')).toBe(true)
  })

  it('handles empty dependencies', () => {
    const parsed = {
      prelude: '',
      modules: new Map([[0, { id: 0, code: 'function(){}', dependencies: [], hash: 'x' }]]),
      postlude: '',
    }
    const assembled = assembleBundle(parsed)
    expect(assembled).toContain('[]);')
  })
})

describe('hashString', () => {
  it('returns consistent hash for same input', () => {
    const input = 'function(g,r,i,a,m,e,d){console.log("test")}'
    expect(hashString(input)).toBe(hashString(input))
  })

  it('returns different hash for different input', () => {
    expect(hashString('function(){return 1}')).not.toBe(hashString('function(){return 2}'))
  })

  it('returns 8-character hex string', () => {
    expect(hashString('test')).toMatch(/^[0-9a-f]{8}$/)
  })

  it('handles empty string', () => {
    expect(hashString('')).toBe('00000000')
  })
})

describe('round-trip parsing', () => {
  it('parse then assemble preserves module count', () => {
    const original = `var pre=1;\n__d(function(g,r,i,a,m,e,d){var a=1;},0,[]);\n__d(function(g,r,i,a,m,e,d){var b=2;},1,[0]);\n__d(function(g,r,i,a,m,e,d){var c=3;},2,[0,1]);\nrequire(0);`
    const parsed = parseBundle(original)
    const assembled = assembleBundle(parsed)
    const reparsed = parseBundle(assembled)
    expect(reparsed.modules.size).toBe(parsed.modules.size)
  })

  it('preserves module code through round-trip', () => {
    const original = `pre\n__d(function(g,r,i,a,m,e,d){var x="test";console.log(x);},0,[]);\npost`
    const parsed = parseBundle(original)
    const assembled = assembleBundle(parsed)
    const reparsed = parseBundle(assembled)
    expect(reparsed.modules.get(0)?.code).toBe(parsed.modules.get(0)?.code)
  })
})
