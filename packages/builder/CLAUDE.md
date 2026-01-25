# @bundlenudge/builder

## Purpose

Bundle builder service for processing uploaded JavaScript bundles. Validates bundles, generates diffs for incremental updates, and prepares bundles for distribution.

## Reference

```
/Users/isaks_macbook/Desktop/Dev/codepush/packages/builder
```

## Tech Stack

- Node.js
- TypeScript (strict mode)
- Vitest (testing)

## Directory Structure

```
packages/builder/
├── src/
│   ├── index.ts              # Public exports
│   ├── types.ts              # Type definitions
│   ├── processor.ts          # Main processing logic
│   ├── validator.ts          # Bundle validation
│   ├── differ.ts             # Diff generation
│   ├── manifest.ts           # Bundle manifest
│   └── utils/
│       ├── hash.ts           # Hash utilities
│       └── compress.ts       # Compression
├── package.json
├── tsconfig.json
└── CLAUDE.md
```

## DO's

### Code Style

- Max 250 lines per file
- Max 50 lines per function
- Named exports only
- Explicit error handling

### Patterns

```typescript
// ✅ Bundle validation
export async function validateBundle(buffer: Buffer): Promise<ValidationResult> {
  // Check magic bytes
  // Parse structure
  // Verify integrity
  return { valid: true, metadata };
}

// ✅ Diff generation
export async function generateDiff(
  oldBundle: Buffer,
  newBundle: Buffer
): Promise<DiffResult> {
  // Binary diff
  // Compress
  return { diff, size, compressionRatio };
}

// ✅ Error handling
if (!isValidBundle(buffer)) {
  throw new InvalidBundleError('Invalid bundle structure', { size: buffer.length });
}
```

## DON'Ts

### Never

- No `any` types
- No synchronous file operations on large files
- No unbounded memory allocation
- No silent failures

### Avoid

- Processing without size limits
- Uncompressed diff storage
- Missing manifest data

## Key Files

| File | Purpose |
|------|---------|
| `src/processor.ts` | Main bundle processing |
| `src/validator.ts` | Bundle validation |
| `src/differ.ts` | Diff generation |
| `src/manifest.ts` | Manifest creation |

## Commands

```bash
# Build
pnpm --filter @bundlenudge/builder build

# Test
pnpm --filter @bundlenudge/builder test
```

## Dependencies

- `@bundlenudge/shared` - Types and schemas

## Notes

- Bundle processing should be streamable
- Diff generation is optional (first release has no diff)
- Manifest contains metadata for SDK
