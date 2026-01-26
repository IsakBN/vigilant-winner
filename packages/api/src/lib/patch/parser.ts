/**
 * Metro Bundle Parser
 *
 * Parses React Native Metro bundles into modules for delta patching.
 */

export interface ParsedModule {
  id: number
  code: string
  dependencies: number[]
  hash: string
}

export interface ParsedBundle {
  prelude: string
  modules: Map<number, ParsedModule>
  postlude: string
}

/**
 * Parse a Metro bundle into its constituent parts
 */
export function parseBundle(source: string): ParsedBundle {
  const modules = new Map<number, ParsedModule>()
  const firstModuleIndex = source.indexOf('__d(')
  if (firstModuleIndex === -1) {
    throw new Error('Invalid bundle: no __d() calls found')
  }

  const prelude = source.slice(0, firstModuleIndex)
  let position = firstModuleIndex
  let lastModuleEnd = firstModuleIndex

  while (position < source.length) {
    const nextD = source.indexOf('__d(', position)
    if (nextD === -1) break

    const moduleEnd = findMatchingBracket(source, nextD + 3, '(', ')')
    if (moduleEnd === -1) {
      throw new Error(`Invalid bundle: unmatched parenthesis at position ${String(nextD)}`)
    }

    const moduleContent = source.slice(nextD + 4, moduleEnd)
    const parsed = parseModuleContent(moduleContent)
    modules.set(parsed.id, parsed)
    lastModuleEnd = skipWhitespace(source, moduleEnd + 1)
    position = lastModuleEnd
  }

  return { prelude, modules, postlude: source.slice(lastModuleEnd) }
}

/**
 * Reassemble a parsed bundle back into source code
 */
export function assembleBundle(parsed: ParsedBundle): string {
  const sorted = Array.from(parsed.modules.values()).sort((a, b) => a.id - b.id)
  const moduleStrings = sorted.map(m => `__d(${m.code},${String(m.id)},[${m.dependencies.join(',')}]);`)
  return parsed.prelude + moduleStrings.join('\n') + '\n' + parsed.postlude
}

function skipWhitespace(source: string, pos: number): number {
  while (pos < source.length && /[;\n\r ]/.test(source[pos])) pos++
  return pos
}

/**
 * Find matching bracket while handling string literals
 */
function findMatchingBracket(
  source: string,
  start: number,
  open: string,
  close: string
): number {
  let depth = 0
  let inString: string | null = null
  let escaped = false

  for (let i = start; i < source.length; i++) {
    const char = source[i]
    if (escaped) { escaped = false; continue }
    if (char === '\\') { escaped = true; continue }
    if (inString) {
      if (char === inString) inString = null
      continue
    }
    if (char === '"' || char === "'" || char === '`') { inString = char; continue }
    if (char === open) depth++
    else if (char === close) {
      depth--
      if (depth === 0) return i
    }
  }
  return -1
}

/**
 * Parse content inside __d(...)
 */
function parseModuleContent(content: string): ParsedModule {
  const functionEnd = findMatchingBracket(content, 0, '{', '}')
  if (functionEnd === -1) {
    throw new Error('Invalid module: could not find function end')
  }

  const code = content.slice(0, functionEnd + 1)
  const remainder = content.slice(functionEnd + 1)
  const regex = /,\s*(\d+)\s*,\s*\[([\d,\s]*)\]/
  const match = regex.exec(remainder)
  if (!match) {
    throw new Error(`Invalid module format: ${remainder.slice(0, 50)}...`)
  }

  const id = parseInt(match[1], 10)
  const deps = match[2].split(',').map(s => s.trim()).filter(Boolean).map(s => parseInt(s, 10))

  return { id, code, dependencies: deps, hash: hashString(code) }
}

/**
 * Simple synchronous hash for module comparison
 */
export function hashString(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return hash.toString(16).padStart(8, '0')
}
