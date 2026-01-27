# @bundlenudge/worker

Mac build worker for processing iOS native builds. Polls the BundleNudge API for build jobs, executes xcodebuild, handles code signing, and uploads artifacts.

## Architecture

```
┌────────────────────────────────────────────────────────────────────────────┐
│                           Build Worker Architecture                         │
└────────────────────────────────────────────────────────────────────────────┘

┌─────────────┐          ┌─────────────┐          ┌─────────────┐
│   API       │◀────────▶│   Worker    │─────────▶│   Storage   │
│  (Queue)    │  poll/   │   (Mac)     │  upload  │   (R2)      │
└─────────────┘  claim   └─────────────┘          └─────────────┘
                              │
                    ┌─────────┼─────────┐
                    │         │         │
              ┌─────▼───┐ ┌───▼───┐ ┌───▼────┐
              │ Clone   │ │ Build │ │ Sign   │
              │ & Setup │ │ (xc)  │ │ & Ship │
              └─────────┘ └───────┘ └────────┘
```

## Tech Stack

| Technology | Purpose |
|------------|---------|
| Node.js | Runtime environment |
| TypeScript | Type safety |
| Xcode | iOS builds |
| CocoaPods | iOS dependencies |
| Apple codesign | Code signing |
| Vitest | Testing |

## Directory Structure

```
packages/worker/
├── src/
│   ├── index.ts              # Entry point + exports
│   ├── types.ts              # Type definitions
│   ├── worker.ts             # Main worker loop
│   ├── builder.ts            # Build execution phases
│   ├── api.ts                # API client
│   ├── signing.ts            # Apple code signing
│   ├── exec.ts               # Command execution
│   ├── metrics.ts            # System metrics
│   └── appstore.ts           # App Store utilities
├── package.json
├── tsconfig.json
└── wrangler.toml             # Cloudflare config
```

## How Job Claiming Works

The worker uses **atomic job claiming** to prevent race conditions:

```
┌─────────────────────────────────────────────────────────────────┐
│                      Atomic Job Claiming                         │
└─────────────────────────────────────────────────────────────────┘

  Worker A          API (D1)              Worker B
     │                 │                     │
     │── claim ───────▶│                     │
     │                 │◀─── claim ──────────│
     │                 │                     │
     │          ┌──────┴──────┐              │
     │          │  SELECT ... │              │
     │          │  FOR UPDATE │              │
     │          │  LIMIT 1    │              │
     │          └──────┬──────┘              │
     │                 │                     │
     │◀── job:123 ─────│                     │
     │                 │───── null ─────────▶│
     │                 │                     │
```

The claim endpoint:
1. Selects oldest pending build for the worker's node pool
2. Atomically updates status to `building` and assigns `worker_id`
3. Returns build details, credentials, and test devices
4. Returns null if no jobs available

## Build Phases

### Phase 1: Clone Repository

```
clone: git clone --depth 1 --branch <branch> <url>
       git checkout <commit>
```

- Shallow clone for speed
- Captures commit hash and message
- Reports to API: `status: preparing`

### Phase 2: Install Dependencies

```
install: yarn install --frozen-lockfile  (or npm ci)
         cd ios && pod install
```

- Detects package manager from lockfile
- Installs CocoaPods with retry on failure
- Reports to API: `status: preparing`

### Phase 3: Code Signing Setup

```typescript
// Creates temporary keychain for build isolation
security create-keychain -p <random> build.keychain
security unlock-keychain -p <random> build.keychain

// Import certificate and provisioning profile
// Generate ExportOptions.plist
```

- Isolated keychain per build (prevents conflicts)
- Supports: ad-hoc, development, app-store, enterprise
- Cleans up keychain after build

### Phase 4: Build Archive

```
xcodebuild \
  -workspace App.xcworkspace \
  -scheme App \
  -configuration Release \
  -archivePath App.xcarchive \
  archive \
  CODE_SIGN_STYLE=Manual \
  DEVELOPMENT_TEAM=<team-id> \
  PRODUCT_BUNDLE_IDENTIFIER=<bundle-id>
```

- 30-minute timeout
- Extracts meaningful errors from xcodebuild output
- Reports to API: `status: building`

### Phase 5: Export IPA

```
xcodebuild -exportArchive \
  -archivePath App.xcarchive \
  -exportPath export/ \
  -exportOptionsPlist ExportOptions.plist
```

- Generates IPA from archive
- ExportOptions controls signing method

### Phase 6: Upload Artifact

```typescript
// Upload IPA to R2
await api.uploadArtifact(
  `builds/${appId}/${buildId}/app.ipa`,
  ipaData
)

// Report success
await api.updateStatus(buildId, {
  status: 'success',
  artifactKey: key,
  artifactSize: size,
})
```

## API Client

```typescript
import { ApiClient } from '@bundlenudge/worker'

const api = new ApiClient(apiUrl, workerToken)

// Claim a job
const { build, credentials, devices } = await api.claimJob(workerId, nodePool)

// Update build status
await api.updateStatus(buildId, {
  status: 'building',
  gitCommit: 'abc123',
  gitCommitMessage: 'Fix bug',
})

// Append logs
await api.appendLog(buildId, [
  { level: 'info', message: 'Installing pods...', phase: 'install' },
])

// Send heartbeat
await api.heartbeat({
  status: 'busy',
  currentBuildId: buildId,
  cpuUsage: 45.2,
  memoryUsage: 68.1,
  diskUsage: 52.0,
})

// Mark offline (graceful shutdown)
await api.goOffline()
```

## Metrics Collection

```typescript
import { getSystemMetrics, getCpuUsage, getMemoryUsage } from '@bundlenudge/worker'

// Get all metrics
const metrics = await getSystemMetrics()
// { cpuUsage: 45.2, memoryUsage: 68.1, diskUsage: 52.0, loadAverage: [1.5, 1.2, 1.0] }

// Individual metrics
const cpu = await getCpuUsage()        // percentage
const memory = await getMemoryUsage()  // percentage
const disk = await getDiskUsage()      // percentage
const load = getLoadAverage()          // [1min, 5min, 15min]
```

## Code Signing

### Setup Requirements

1. **Apple Developer Account** with appropriate membership
2. **Distribution Certificate** (.p12 file)
3. **Provisioning Profile** (.mobileprovision)
4. **Team ID** from Apple Developer portal

### ExportOptions.plist

Generated automatically based on export method:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<plist version="1.0">
<dict>
    <key>method</key>
    <string>ad-hoc</string>
    <key>teamID</key>
    <string>ABCD1234</string>
    <key>signingStyle</key>
    <string>manual</string>
    <key>stripSwiftSymbols</key>
    <true/>
    <key>compileBitcode</key>
    <false/>
</dict>
</plist>
```

### Supported Export Methods

| Method | Use Case |
|--------|----------|
| `development` | Internal testing on registered devices |
| `ad-hoc` | Distribution to limited devices (100) |
| `app-store` | App Store / TestFlight distribution |
| `enterprise` | Enterprise in-house distribution |

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `WORKER_API_URL` | Yes | - | BundleNudge API URL |
| `WORKER_TOKEN` | Yes | - | Worker authentication token |
| `WORKER_ID` | Yes | - | Unique worker identifier |
| `NODE_POOL` | No | `default` | Worker pool name |
| `WORK_DIR` | No | `/tmp/bundlenudge-builds` | Build working directory |
| `POLL_INTERVAL` | No | `5000` | Job polling interval (ms) |
| `HEARTBEAT_INTERVAL` | No | `30000` | Heartbeat interval (ms) |

## Running the Worker

### Development

```bash
# Start worker in development
pnpm dev

# Or with environment variables
WORKER_API_URL=http://localhost:8787 \
WORKER_TOKEN=dev-token \
WORKER_ID=dev-worker-1 \
pnpm start
```

### Production

```bash
# Build
pnpm build

# Start
node dist/index.js
```

### As a Service (macOS)

Create `/Library/LaunchDaemons/com.bundlenudge.worker.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.bundlenudge.worker</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/node</string>
        <string>/opt/bundlenudge/worker/dist/index.js</string>
    </array>
    <key>EnvironmentVariables</key>
    <dict>
        <key>WORKER_API_URL</key>
        <string>https://api.bundlenudge.com</string>
        <key>WORKER_TOKEN</key>
        <string>your-token</string>
        <key>WORKER_ID</key>
        <string>mac-worker-1</string>
    </dict>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/var/log/bundlenudge-worker.log</string>
    <key>StandardErrorPath</key>
    <string>/var/log/bundlenudge-worker.error.log</string>
</dict>
</plist>
```

Load with: `sudo launchctl load /Library/LaunchDaemons/com.bundlenudge.worker.plist`

## Deployment on Fly.io

### fly.toml

```toml
app = "bundlenudge-worker"
primary_region = "sjc"

[build]
  dockerfile = "Dockerfile"

[env]
  NODE_POOL = "default"
  POLL_INTERVAL = "5000"

[[vm]]
  cpu_kind = "shared"
  cpus = 4
  memory_mb = 8192
```

### Dockerfile

```dockerfile
FROM --platform=linux/amd64 ghcr.io/cirruslabs/macos-ventura-base:latest

# Install dependencies
RUN brew install node@20 cocoapods

# Copy worker
WORKDIR /app
COPY packages/worker/dist ./dist
COPY packages/worker/package.json .

# Start worker
CMD ["node", "dist/index.js"]
```

Note: Fly.io macOS runners require a paid plan and special access.

## Signal Handling

The worker handles graceful shutdown:

```
SIGINT/SIGTERM received
    │
    ├── Stop polling for new jobs
    │
    ├── If build in progress:
    │   └── Mark build as failed (WORKER_SHUTDOWN)
    │
    ├── Call api.goOffline()
    │
    └── Exit with code 0
```

## Testing

```bash
# Run all tests
pnpm test

# Watch mode
pnpm test --watch

# Coverage
pnpm test --coverage
```

### Test Coverage

| Module | Tests |
|--------|-------|
| index.ts | 12 |
| worker.ts | 18 |
| api.ts | 22 |
| builder.ts | 15 |
| signing.ts | 12 |
| exec.ts | 10 |
| metrics.ts | 11 |
| **Total** | **100** |

## Library Usage

```typescript
import {
  BuildWorker,
  ApiClient,
  exec,
  getSystemMetrics,
} from '@bundlenudge/worker'

// Create worker programmatically
const worker = new BuildWorker({
  apiUrl: 'https://api.bundlenudge.com',
  workerToken: 'xxx',
  workerId: 'my-worker',
  nodePool: 'default',
  pollInterval: 5000,
  heartbeatInterval: 30000,
  workDir: '/tmp/builds',
})

// Start processing
await worker.start()

// Stop gracefully
await worker.stop()
```

## Troubleshooting

### Common Issues

**"No Xcode workspace or project found"**
- Ensure the repository has an `ios/` directory with `.xcworkspace` or `.xcodeproj`

**"Pod install failed"**
- Worker auto-retries with `pod repo update`
- Check CocoaPods version compatibility

**"Code signing failed"**
- Verify certificate is not expired
- Ensure provisioning profile matches bundle ID
- Check Team ID is correct

**"Build timeout"**
- Default timeout is 30 minutes
- Large projects may need worker scaling

### Debug Mode

```bash
# Enable verbose logging
DEBUG=bundlenudge:* node dist/index.js
```

## License

BSL 1.1 - See LICENSE in repository root.
