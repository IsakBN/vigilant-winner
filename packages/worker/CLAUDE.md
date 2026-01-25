# @bundlenudge/worker

## Purpose

Mac build worker for native iOS/Android builds with code signing. Processes native build requests from the queue and manages build environments.

## Reference

```
/Users/isaks_macbook/Desktop/Dev/codepush/packages/worker
```

## Tech Stack

- Node.js
- TypeScript (strict mode)
- Vitest (testing)

## Directory Structure

```
packages/worker/
├── src/
│   ├── index.ts              # Entry point
│   ├── types.ts              # Type definitions
│   ├── worker.ts             # Main worker loop
│   ├── builder.ts            # Build execution
│   ├── signing.ts            # Code signing
│   └── queue.ts              # Queue consumer
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
// ✅ Worker loop
export class BuildWorker {
  async start(): Promise<void> {
    while (this.running) {
      const job = await this.queue.poll();
      if (job) {
        await this.processJob(job);
      }
    }
  }

  async processJob(job: BuildJob): Promise<void> {
    try {
      await this.build(job);
      await this.sign(job);
      await this.upload(job);
      await this.complete(job);
    } catch (error) {
      await this.fail(job, error);
    }
  }
}

// ✅ Build execution
async function executeBuild(config: BuildConfig): Promise<BuildResult> {
  // Set up environment
  // Run build command
  // Capture output
  return { artifact, logs };
}
```

## DON'Ts

### Never

- No `any` types
- No storing secrets in logs
- No unbounded resource usage
- No silent build failures

## Key Files

| File | Purpose |
|------|---------|
| `src/worker.ts` | Main worker loop |
| `src/builder.ts` | Build execution |
| `src/signing.ts` | Code signing |
| `src/queue.ts` | Queue consumer |

## Commands

```bash
# Build
pnpm --filter @bundlenudge/worker build

# Test
pnpm --filter @bundlenudge/worker test

# Run worker
pnpm --filter @bundlenudge/worker start
```

## Dependencies

- `@bundlenudge/shared` - Types and schemas

## Notes

- Runs on Mac for iOS/Android builds
- Needs Xcode and Android SDK
- Code signing requires certificates
- Lowest priority package
