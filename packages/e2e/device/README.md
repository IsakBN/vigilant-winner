# Device Testing with Detox

End-to-end device testing for the BundleNudge SDK using [Detox](https://wix.github.io/Detox/).

## Prerequisites

### macOS

- macOS 12.0 or later
- Node.js 18+
- pnpm 8+

### iOS Testing

1. **Xcode** (15.0+)
   ```bash
   # Verify Xcode installation
   xcodebuild -version

   # Accept license
   sudo xcodebuild -license accept
   ```

2. **Xcode Command Line Tools**
   ```bash
   xcode-select --install
   ```

3. **CocoaPods**
   ```bash
   sudo gem install cocoapods
   ```

4. **iOS Simulators**
   ```bash
   # List available simulators
   xcrun simctl list devices

   # The default configuration uses iPhone 15
   # Download if needed via Xcode > Preferences > Platforms
   ```

5. **applesimutils** (required by Detox)
   ```bash
   brew tap wix/brew
   brew install applesimutils
   ```

### Android Testing

1. **Android Studio** (Hedgehog 2023.1+)
   - Download from [developer.android.com](https://developer.android.com/studio)

2. **Android SDK**
   ```bash
   # Set environment variables in ~/.zshrc or ~/.bashrc
   export ANDROID_HOME=$HOME/Library/Android/sdk
   export PATH=$PATH:$ANDROID_HOME/emulator
   export PATH=$PATH:$ANDROID_HOME/platform-tools
   export PATH=$PATH:$ANDROID_HOME/tools
   export PATH=$PATH:$ANDROID_HOME/tools/bin
   ```

3. **Java Development Kit** (JDK 17)
   ```bash
   brew install openjdk@17

   # Add to path
   export JAVA_HOME=$(/usr/libexec/java_home -v 17)
   ```

4. **Android Emulator**
   ```bash
   # Create emulator via Android Studio:
   # Tools > AVD Manager > Create Virtual Device
   # Select: Pixel 5, API 34
   # Name: Pixel_5_API_34

   # Or via command line:
   sdkmanager "system-images;android-34;google_apis;arm64-v8a"
   avdmanager create avd -n Pixel_5_API_34 -k "system-images;android-34;google_apis;arm64-v8a"
   ```

## Test App Setup

The tests require a React Native test app with BundleNudge SDK integrated.

### Creating the Test App

```bash
# From project root
npx react-native init TestApp --version 0.73

cd TestApp

# Add BundleNudge SDK
pnpm add @bundlenudge/sdk

# iOS pods
cd ios && pod install && cd ..
```

### Test App Requirements

The test app must include:

1. **Test IDs** for UI elements (see `helpers/app.ts` for TestIds)
2. **BundleNudge SDK** initialized on app launch
3. **Debug controls** for testing (crash button, manual rollback, etc.)

Example App.tsx:

```tsx
import React, { useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { BundleNudge } from '@bundlenudge/sdk';

export default function App() {
  const [status, setStatus] = useState('idle');
  const [version, setVersion] = useState('bundled');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    BundleNudge.initialize({
      appId: 'test-app-id',
      apiUrl: 'http://localhost:8787', // Local dev server
      debug: true,
    }, {
      onStatusChange: setStatus,
      onError: (e) => setError(e.message),
    });
  }, []);

  return (
    <View testID="main-screen" style={styles.container}>
      <Text testID="bundle-version-text">{version}</Text>
      <Text testID="content-text">Welcome to TestApp</Text>
      <Text testID="update-status">{status}</Text>
      {error && <Text testID="error-text">{error}</Text>}

      <Button
        testID="check-update-button"
        title="Check Update"
        onPress={() => BundleNudge.getInstance().checkForUpdate()}
      />
      {/* Add more test controls */}
    </View>
  );
}
```

## Running Tests

### Install Dependencies

```bash
# From packages/e2e
pnpm install

# Build Detox (first time only)
cd device && npx detox build -c ios.sim.release
```

### iOS Simulator

```bash
# Build the app
npx detox build -c ios.sim.release

# Run tests
npx detox test -c ios.sim.release

# Run specific test file
npx detox test -c ios.sim.release specs/update-flow.test.ts

# Debug mode (with app logs)
npx detox test -c ios.sim.debug --loglevel trace
```

### Android Emulator

```bash
# Start emulator
emulator -avd Pixel_5_API_34

# Build the app
npx detox build -c android.emu.release

# Run tests
npx detox test -c android.emu.release
```

### Physical Android Device

```bash
# Connect device via USB, enable USB debugging
adb devices

# Build and run
npx detox build -c android.att.release
npx detox test -c android.att.release
```

## Test Structure

```
device/
├── .detoxrc.js          # Detox configuration
├── jest.config.js       # Jest configuration for Detox
├── tsconfig.json        # TypeScript config
├── README.md            # This file
├── helpers/
│   ├── app.ts           # App interaction helpers
│   ├── setup.ts         # Jest setup
│   └── index.ts         # Helper exports
└── specs/
    ├── update-flow.test.ts  # Main update tests
    ├── rollback.test.ts     # Rollback tests
    └── offline.test.ts      # Offline behavior tests
```

## Test Suites

### Update Flow (`update-flow.test.ts`)

Tests the complete update lifecycle:
- App launches with bundled JS
- SDK checks for updates
- Update downloads with progress
- App restarts with new bundle
- Version verification

### Rollback (`rollback.test.ts`)

Tests automatic and manual rollback:
- Crash detection and automatic rollback
- Manual rollback trigger
- Rollback state persistence
- Rollback reporting to server

### Offline (`offline.test.ts`)

Tests offline behavior:
- App works without network
- Graceful error handling
- Cached bundle usage
- Network recovery

## Configuration

### Detox Configuration (`.detoxrc.js`)

| Config | Description |
|--------|-------------|
| `ios.sim.debug` | iOS Simulator, Debug build |
| `ios.sim.release` | iOS Simulator, Release build |
| `android.emu.debug` | Android Emulator, Debug build |
| `android.emu.release` | Android Emulator, Release build |
| `android.att.release` | Physical Android device |

### Environment Variables

```bash
# Optional: Override default test timeout
DETOX_TEST_TIMEOUT=180000

# Optional: Keep artifacts on success
DETOX_ARTIFACTS_ON_SUCCESS=true
```

## CI Integration

### GitHub Actions

```yaml
name: Device Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  ios-e2e:
    runs-on: macos-14
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Install Dependencies
        run: pnpm install

      - name: Install applesimutils
        run: |
          brew tap wix/brew
          brew install applesimutils

      - name: Build iOS
        working-directory: packages/e2e/device
        run: npx detox build -c ios.sim.release

      - name: Run iOS Tests
        working-directory: packages/e2e/device
        run: npx detox test -c ios.sim.release --headless

      - name: Upload Artifacts
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: detox-artifacts-ios
          path: packages/e2e/device/artifacts/

  android-e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Setup JDK
        uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: '17'

      - name: Setup Android SDK
        uses: android-actions/setup-android@v3

      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Install Dependencies
        run: pnpm install

      - name: Create AVD
        run: |
          echo "y" | $ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager --install "system-images;android-34;google_apis;x86_64"
          echo "no" | $ANDROID_HOME/cmdline-tools/latest/bin/avdmanager create avd -n Pixel_5_API_34 -k "system-images;android-34;google_apis;x86_64" --force

      - name: Start Emulator
        uses: reactivecircus/android-emulator-runner@v2
        with:
          api-level: 34
          target: google_apis
          arch: x86_64
          profile: Pixel 5
          script: |
            cd packages/e2e/device
            npx detox build -c android.emu.release
            npx detox test -c android.emu.release

      - name: Upload Artifacts
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: detox-artifacts-android
          path: packages/e2e/device/artifacts/
```

## Troubleshooting

### iOS Issues

**Simulator not found:**
```bash
# List available simulators
xcrun simctl list devices

# Update .detoxrc.js with correct device name
```

**Build failures:**
```bash
# Clean and rebuild
cd TestApp/ios
rm -rf build Pods Podfile.lock
pod install
cd ../..
npx detox build -c ios.sim.release
```

### Android Issues

**Emulator not starting:**
```bash
# Check ANDROID_HOME
echo $ANDROID_HOME

# Start emulator manually
emulator -list-avds
emulator -avd Pixel_5_API_34
```

**ADB not finding device:**
```bash
# Kill and restart ADB
adb kill-server
adb start-server
adb devices
```

### General Issues

**Timeout errors:**
- Increase timeout in `jest.config.js`
- Check network connectivity for update tests
- Ensure test server is running

**Flaky tests:**
- Add explicit waits: `await wait(1000)`
- Use `waitFor` with proper timeouts
- Check for race conditions

## Writing New Tests

1. Create test file in `specs/`
2. Import helpers from `../helpers`
3. Follow existing test patterns
4. Use TestIds for element selection
5. Add screenshots at key points

```typescript
import { describe, it } from '@jest/globals'
import { expect, element, by } from 'detox'
import { launchApp, TestIds, takeScreenshot } from '../helpers'

describe('My Feature', () => {
  it('should do something', async () => {
    await launchApp()

    // Test logic
    await element(by.id(TestIds.SOME_BUTTON)).tap()
    await expect(element(by.id(TestIds.SOME_TEXT))).toHaveText('Expected')

    await takeScreenshot('my-feature-result')
  })
})
```

## Notes

- Tests require a test React Native app (not included in this package)
- The test server must have appropriate test data/updates published
- Offline tests use URL blacklisting, not actual airplane mode
- Screenshots are saved to `./artifacts` on failure
