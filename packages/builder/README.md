# @bundlenudge/builder

Bundle processing service for BundleNudge. Clones repositories, builds React Native bundles, compiles to Hermes bytecode, validates output, and uploads to R2 storage.

## Overview

The builder transforms React Native source code into distributable OTA bundles:

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Bundle Build Pipeline                         │
└─────────────────────────────────────────────────────────────────────┘

  GitHub Repo          Build Process                    R2 Storage
  ┌─────────┐    ┌─────────────────────────┐    ┌─────────────────┐
  │ source  │───▶│ clone → install → build │───▶│ bundle.hbc     │
  │ code    │    │   → hermes → validate   │    │ (Hermes)       │
  └─────────┘    │   → compress → upload   │    │ or bundle.js   │
                 └─────────────────────────┘    └─────────────────┘
```

## Tech Stack

| Technology | Purpose |
|------------|---------|
| Node.js | Runtime environment |
| TypeScript | Type safety |
| React Native CLI | Bundle generation |
| Hermes | Bytecode compilation |
| Vitest | Testing |

## Directory Structure

```
packages/builder/
├── src/
│   ├── index.ts              # Public exports
│   ├── types.ts              # Type definitions
│   ├── build.ts              # Main build orchestration
│   ├── hermes.ts             # Hermes bytecode compilation
│   ├── upload.ts             # R2 upload functionality
│   ├── validator.ts          # Bundle validation
│   ├── manifest.ts           # Bundle metadata generation
│   └── utils/
│       ├── hash.ts           # SHA-256 hashing
│       └── compress.ts       # gzip compression
├── package.json
├── tsconfig.json
└── CLAUDE.md
```

## Build Pipeline

### Phase 1: Clone Repository

```typescript
// Clone with shallow depth for speed
git clone --depth 1 <repo-url> /tmp/build
git fetch --depth 1 origin <commit-sha>
git checkout <commit-sha>
```

- Shallow clone for faster builds
- Supports monorepos with `BUILD_FOLDER` env var
- Private repos via `GITHUB_TOKEN`

### Phase 2: Install Dependencies

```typescript
// Auto-detect package manager
if (pnpm-lock.yaml) → pnpm install --frozen-lockfile
if (yarn.lock) → yarn install --frozen-lockfile
else → npm ci --legacy-peer-deps
```

- Automatic package manager detection
- Lockfile-based installs for reproducibility
- Monorepo support (installs from root if lockfile there)

### Phase 3: Build Bundle

```typescript
// Generate JavaScript bundle
react-native bundle \
  --platform ios \
  --dev false \
  --entry-file index.js \
  --bundle-output bundle.js \
  --minify true
```

- Uses local `react-native` CLI if available
- Falls back to `npx react-native`
- Auto-detects entry file (index.js, index.tsx, src/index.js)

### Phase 4: Hermes Compilation (Optional)

```typescript
import { compileToHermes, isHermesBytecode } from '@bundlenudge/builder'

// Detect Hermes compiler location
const config = detectHermesCompiler(appDir)
// Returns: { enabled: true, compilerPath: '/path/to/hermesc' }

// Compile JavaScript to Hermes bytecode
const result = await compileToHermes(bundlePath, config)
// result.compiled: true if successful
// result.originalSize: JS size
// result.compiledSize: HBC size
```

Hermes benefits:
- Faster startup (pre-parsed bytecode)
- Smaller memory footprint
- Consistent with production RN builds

### Phase 5: Bundle Validation

```typescript
import { validateBundle, validateBuffer } from '@bundlenudge/builder'

// Validate a bundle file
const result = await validateBundle('/path/to/bundle.js', {
  maxSize: 50 * 1024 * 1024,  // 50MB max
  minSize: 100,               // 100 bytes min
  allowHermes: true,
  allowJavaScript: true,
})

// Result structure
interface ValidationResult {
  valid: boolean
  bundleType: 'hermes' | 'javascript' | 'unknown'
  size: number
  errors: string[]
  warnings: string[]
}
```

Validation checks:
- Size limits (configurable)
- Bundle type detection (Hermes magic bytes)
- JavaScript syntax sanity checks
- Corruption detection (null bytes, invalid UTF-8)

### Phase 6: Manifest Generation

```typescript
import { createManifest, verifyManifest } from '@bundlenudge/builder'

// Create manifest from bundle file
const manifest = await createManifest('/path/to/bundle', {
  version: '1.2.3',
  platform: 'ios',
  minAppVersion: '2.0.0',
  releaseNotes: 'Bug fixes',
})

// Manifest structure
interface BundleManifest {
  version: string
  hash: string           // SHA-256
  size: number
  platform: 'ios' | 'android'
  isHermes: boolean
  bundleType: 'hermes' | 'javascript' | 'unknown'
  contentType: string
  createdAt: number      // Unix timestamp
  minAppVersion?: string
  maxAppVersion?: string
  releaseNotes?: string
}

// Verify bundle matches manifest
const { valid, errors } = verifyManifest(bundleBuffer, manifest)
```

### Phase 7: Upload to R2

```typescript
import { uploadToR2, getBundleContentType } from '@bundlenudge/builder'

await uploadToR2({
  endpoint: process.env.R2_ENDPOINT,
  accessKey: process.env.R2_ACCESS_KEY,
  secretKey: process.env.R2_SECRET_KEY,
  bucket: process.env.R2_BUCKET,
  key: 'bundles/app-id/release-id/bundle.hbc',
  body: bundleBuffer,
  contentType: getBundleContentType(isHermes),
})
```

## Utility Functions

### Hashing

```typescript
import { hashBuffer, hashFile, verifyHash } from '@bundlenudge/builder'

// Hash a buffer
const hash = hashBuffer(buffer)  // SHA-256 hex string

// Hash a file
const { hash, size } = await hashFileWithSize('/path/to/file')

// Verify hash matches
const valid = verifyHash(buffer, expectedHash)
```

### Compression

```typescript
import {
  compressBuffer,
  decompressBuffer,
  isGzipCompressed,
  formatCompressionRatio,
} from '@bundlenudge/builder'

// Compress buffer
const { compressed, originalSize, compressedSize, ratio } = compressBuffer(buffer)

// Check if already compressed
if (!isGzipCompressed(buffer)) {
  const result = compressBuffer(buffer)
  console.log(formatCompressionRatio(result))  // "1.2 MB → 450 KB (62% reduction)"
}

// Decompress
const original = decompressBuffer(compressed)
```

## API Reference

### build()

Main build function - runs the complete pipeline.

```typescript
import { build } from '@bundlenudge/builder'

const result = await build()
// result: { success: boolean, bundleSize: number, hermesCompiled: boolean, error?: string }
```

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `REPO` | Yes | GitHub repository (owner/repo) |
| `COMMIT_SHA` | Yes | Git commit to build |
| `GITHUB_TOKEN` | Yes | Token for cloning private repos |
| `BUNDLE_KEY` | Yes | R2 key for uploading bundle |
| `RELEASE_ID` | Yes | Release ID for callback |
| `CALLBACK_URL` | Yes | API URL to call when done |
| `BUILD_FOLDER` | No | Subdirectory for monorepos |
| `ENABLE_HERMES` | No | Set to 'true' to enable Hermes |
| `R2_ENDPOINT` | Yes | R2 endpoint URL |
| `R2_ACCESS_KEY` | Yes | R2 access key |
| `R2_SECRET_KEY` | Yes | R2 secret key |
| `R2_BUCKET` | Yes | R2 bucket name |

## Usage Examples

### As a Library

```typescript
import {
  validateBundle,
  createManifest,
  compressBuffer,
  hashBuffer,
} from '@bundlenudge/builder'

// Validate an existing bundle
const validation = await validateBundle('./bundle.js')
if (!validation.valid) {
  console.error('Invalid bundle:', validation.errors)
  process.exit(1)
}

// Create manifest
const manifest = await createManifest('./bundle.js', {
  version: '1.0.0',
  platform: 'ios',
})

// Compress for storage
const compressed = compressBuffer(await fs.readFile('./bundle.js'))
console.log(`Compressed: ${formatCompressionRatio(compressed)}`)
```

### As a CLI Tool

```bash
# Build from environment variables
REPO=myorg/myapp \
COMMIT_SHA=abc123 \
GITHUB_TOKEN=ghp_xxx \
BUNDLE_KEY=bundles/app/release/bundle.hbc \
RELEASE_ID=rel_123 \
CALLBACK_URL=https://api.bundlenudge.com/builds/callback \
R2_ENDPOINT=https://xxx.r2.cloudflarestorage.com \
R2_ACCESS_KEY=xxx \
R2_SECRET_KEY=xxx \
R2_BUCKET=bundlenudge-bundles \
ENABLE_HERMES=true \
npx bundlenudge-build
```

## Integration with Worker

The builder is typically invoked by the worker package:

```typescript
// In worker package
import { build, validateBundle, createManifest } from '@bundlenudge/builder'

async function processBuildJob(job: BuildJob) {
  // Set environment variables from job
  process.env.REPO = job.repo
  process.env.COMMIT_SHA = job.commitSha
  // ... etc

  // Run build
  const result = await build()

  if (!result.success) {
    throw new Error(result.error)
  }

  return result
}
```

## Testing

```bash
# Run all tests
pnpm test

# Watch mode
pnpm test --watch

# Coverage report
pnpm test --coverage
```

### Test Coverage

| Module | Tests |
|--------|-------|
| build.ts | 16 |
| hermes.ts | 9 |
| upload.ts | 10 |
| validator.ts | 13 |
| manifest.ts | 10 |
| utils/hash.ts | 10 |
| utils/compress.ts | 13 |
| **Total** | **81** |

## Performance

- Build timeout: 5 minutes
- Shallow clone for speed
- Frozen lockfile installs
- Hermes compilation adds ~30s but reduces bundle size

## Error Handling

All functions throw descriptive errors:

```typescript
try {
  await build()
} catch (error) {
  if (error.message.includes('Missing required config')) {
    // Environment variable missing
  } else if (error.message.includes('Git clone failed')) {
    // Repository access issue
  } else if (error.message.includes('Build failed')) {
    // React Native CLI error
  }
}
```

## License

BSL 1.1 - See LICENSE in repository root.
