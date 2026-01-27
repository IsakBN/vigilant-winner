# BundleNudge SDK Integration Guide

## Installation

### React Native CLI

```bash
# Install the package
npm install @bundlenudge/sdk

# iOS: Install pods
cd ios && pod install && cd ..

# Android: No additional steps needed
```

### Expo

```bash
# Install the package
npx expo install @bundlenudge/sdk

# Add the config plugin to app.json
```

```json
{
  "expo": {
    "plugins": [
      ["@bundlenudge/sdk", {
        "appId": "your-app-id"
      }]
    ]
  }
}
```

## Basic Setup

Initialize the SDK as early as possible in your app:

```typescript
// App.tsx or index.js
import { BundleNudge } from '@bundlenudge/sdk';

// Initialize before rendering
BundleNudge.init({
  appId: 'app_abc123',  // From your dashboard
  apiKey: 'bnk_xxx',    // From your dashboard
});

export default function App() {
  return <YourApp />;
}
```

## Checking for Updates

```typescript
import { BundleNudge } from '@bundlenudge/sdk';

// Manual check
const result = await BundleNudge.checkForUpdates();

if (result.updateAvailable) {
  console.log('New version:', result.version);
  console.log('Size:', result.size);

  // Download and apply
  await BundleNudge.downloadAndApply();
}
```

## Configuration Options

```typescript
interface BundleNudgeConfig {
  // Required
  appId: string;           // Your app ID from dashboard
  apiKey: string;          // Your API key from dashboard

  // Optional
  channel?: string;        // Default: 'production'
  autoUpdate?: boolean;    // Default: true
  autoReload?: boolean;    // Default: false (restart required)
  minBinaryVersion?: string;  // Minimum native version
  updateCheckInterval?: number;  // Milliseconds between checks

  // Callbacks
  onUpdateAvailable?: (update: UpdateInfo) => void;
  onDownloadProgress?: (progress: number) => void;
  onUpdateApplied?: () => void;
  onError?: (error: Error) => void;
}
```

## Channels

Channels let you deploy different versions to different users:

```typescript
// Production users
BundleNudge.init({
  appId: 'app_abc123',
  apiKey: 'bnk_xxx',
  channel: 'production',
});

// Beta testers
BundleNudge.init({
  appId: 'app_abc123',
  apiKey: 'bnk_xxx',
  channel: 'beta',
});
```

Common channel patterns:
- `production` - All users (default)
- `staging` - Internal testing
- `beta` - Beta testers
- `canary` - Small % of users for early testing

## Rollback Protection

BundleNudge automatically protects against bad updates:

### How It Works

1. Update is downloaded and verified
2. App restarts with new bundle
3. SDK monitors for crashes
4. If app crashes within 10 seconds, automatically rollback
5. Bad version is marked and won't be retried

### Manual Rollback

```typescript
// Check if rollback is available
const canRollback = await BundleNudge.canRollback();

// Trigger rollback
if (canRollback) {
  await BundleNudge.rollback();
  // App will restart with previous version
}
```

### Health Monitoring

```typescript
// Mark app as healthy (call after successful launch)
BundleNudge.markHealthy();

// Custom health check
BundleNudge.init({
  appId: 'app_abc123',
  apiKey: 'bnk_xxx',
  healthCheck: async () => {
    // Return true if app is working correctly
    const apiWorking = await checkApiConnection();
    const dbWorking = await checkDatabase();
    return apiWorking && dbWorking;
  },
});
```

## Native Modules

For React Native CLI projects, native modules provide:
- Cryptographic bundle verification
- Efficient bundle storage
- Crash detection

### iOS (Swift)

The native module is automatically linked. No manual setup required.

### Android (Kotlin)

The native module is automatically linked. No manual setup required.

### Verifying Installation

```typescript
import { BundleNudge } from '@bundlenudge/sdk';

const info = BundleNudge.getNativeInfo();
console.log('Native module:', info.nativeModuleAvailable);
console.log('Platform:', info.platform);
console.log('Version:', info.sdkVersion);
```

## Debug Mode

```typescript
// Enable verbose logging
BundleNudge.init({
  appId: 'app_abc123',
  apiKey: 'bnk_xxx',
  debug: true,  // Logs all SDK activity
});

// Check current state
const state = await BundleNudge.getState();
console.log('Current bundle:', state.currentBundleId);
console.log('Pending update:', state.pendingUpdate);
console.log('Last check:', state.lastUpdateCheck);
```

## Error Handling

```typescript
import { BundleNudge, BundleNudgeError } from '@bundlenudge/sdk';

try {
  await BundleNudge.checkForUpdates();
} catch (error) {
  if (error instanceof BundleNudgeError) {
    switch (error.code) {
      case 'NETWORK_ERROR':
        console.log('No internet connection');
        break;
      case 'INVALID_BUNDLE':
        console.log('Bundle verification failed');
        break;
      case 'VERSION_MISMATCH':
        console.log('Update not compatible with this binary');
        break;
      default:
        console.log('Update error:', error.message);
    }
  }
}
```

## CI/CD Integration

### Deploying from CI

```bash
# Install CLI
npm install -g @bundlenudge/cli

# Build your bundle
npx react-native bundle \
  --platform ios \
  --entry-file index.js \
  --bundle-output bundle.jsbundle

# Deploy
bundlenudge deploy \
  --app-id app_abc123 \
  --api-key $BUNDLENUDGE_API_KEY \
  --bundle bundle.jsbundle \
  --channel production
```

### GitHub Actions Example

```yaml
- name: Deploy to BundleNudge
  run: |
    npm install -g @bundlenudge/cli
    npx react-native bundle --platform ios --entry-file index.js --bundle-output bundle.jsbundle
    bundlenudge deploy --app-id ${{ secrets.BN_APP_ID }} --api-key ${{ secrets.BN_API_KEY }} --bundle bundle.jsbundle
```

## Offline Support

The SDK handles offline gracefully:

```typescript
// Updates are cached locally
// If offline, app runs with last known good bundle
// When online, SDK checks for updates automatically

BundleNudge.init({
  appId: 'app_abc123',
  apiKey: 'bnk_xxx',
  offlineMode: 'cache-first',  // Use cached bundle if available
});
```

## Testing

### In Development

```typescript
// Force a specific bundle for testing
if (__DEV__) {
  BundleNudge.setTestBundle('test-bundle-id');
}
```

### Simulating Updates

```typescript
// In development, simulate an update
await BundleNudge.simulateUpdate({
  version: '1.2.0',
  size: 1024000,
});
```
