# BundleNudge Troubleshooting Guide

## Common Issues

### Updates Not Applying

**Symptoms:** `checkForUpdates()` returns success but app doesn't update.

**Causes and Solutions:**

1. **Auto-reload disabled**
   ```typescript
   // Updates download but require restart
   BundleNudge.init({
     appId: 'app_abc123',
     apiKey: 'bnk_xxx',
     autoReload: true,  // Enable auto-reload
   });
   ```

2. **Version mismatch**
   ```
   Error: VERSION_MISMATCH
   ```
   Your update targets a different binary version. Check your `minBinaryVersion`:
   ```typescript
   BundleNudge.init({
     appId: 'app_abc123',
     apiKey: 'bnk_xxx',
     minBinaryVersion: '1.0.0',  // Must match deployed release
   });
   ```

3. **Wrong channel**
   ```typescript
   // Make sure channel matches your release
   BundleNudge.init({
     appId: 'app_abc123',
     apiKey: 'bnk_xxx',
     channel: 'production',  // Check this matches
   });
   ```

4. **Cached bundle**
   Clear the app's cache and try again:
   ```typescript
   await BundleNudge.clearCache();
   await BundleNudge.checkForUpdates();
   ```

### Network Errors

**Symptoms:** `NETWORK_ERROR` when checking for updates.

**Solutions:**

1. **Check API key**
   ```typescript
   // Verify your API key is correct
   const isValid = await BundleNudge.validateApiKey();
   console.log('API key valid:', isValid);
   ```

2. **Check connectivity**
   ```typescript
   // The SDK handles offline gracefully, but verify:
   const status = await BundleNudge.getNetworkStatus();
   console.log('Can reach API:', status.canReachApi);
   ```

3. **Proxy/firewall issues**
   Ensure these domains are accessible:
   - `api.bundlenudge.com` (API)
   - `cdn.bundlenudge.com` (Bundles)

### Bundle Verification Failed

**Symptoms:** `INVALID_BUNDLE` error during update.

**Causes:**

1. **Corrupted download** - Retry the download
2. **Tampered bundle** - Bundle signature doesn't match
3. **Wrong platform** - iOS bundle on Android or vice versa

**Solution:**
```typescript
// Force re-download
await BundleNudge.clearCache();
await BundleNudge.checkForUpdates({ forceDownload: true });
```

### Crash Loop After Update

**Symptoms:** App crashes immediately after update, keeps restarting.

**What happens:**
The SDK detects the crash loop and automatically rolls back.

**If rollback doesn't work:**
1. User can reinstall the app from the store
2. You can disable the release from the dashboard
3. Use the API to force-rollback all devices:
   ```bash
   curl -X POST https://api.bundlenudge.com/v1/apps/APP_ID/releases/REL_ID/rollback \
     -H "Authorization: Bearer YOUR_API_KEY"
   ```

### Native Module Not Found

**Symptoms:**
```
[BundleNudge] Native module not found. Make sure you have linked the native module correctly.
```

**Solutions:**

**iOS:**
```bash
cd ios && pod install && cd ..
# Then rebuild: npx react-native run-ios
```

**Android:**
```bash
cd android && ./gradlew clean && cd ..
# Then rebuild: npx react-native run-android
```

**Expo:**
```bash
# Rebuild with native modules
npx expo prebuild --clean
npx expo run:ios  # or run:android
```

### Release Stuck in "Processing"

**Symptoms:** Dashboard shows release as "Processing" for more than 5 minutes.

**Causes:**
1. Large bundle (>50MB) - processing takes longer
2. Build worker issue - rare, usually auto-recovers

**Solutions:**
1. Wait up to 10 minutes for large bundles
2. Check release status via API:
   ```bash
   curl https://api.bundlenudge.com/v1/apps/APP_ID/releases/REL_ID \
     -H "Authorization: Bearer YOUR_API_KEY"
   ```
3. If stuck >15 minutes, create a new release

### Devices Not Receiving Updates

**Symptoms:** Release is active but devices don't update.

**Debugging steps:**

1. **Check device registration**
   ```typescript
   const info = await BundleNudge.getDeviceInfo();
   console.log('Device ID:', info.deviceId);
   console.log('Registered:', info.isRegistered);
   ```

2. **Check rollout percentage**
   If using staged rollout, not all devices get the update:
   ```bash
   # Via dashboard or API, check rollout %
   curl https://api.bundlenudge.com/v1/apps/APP_ID/channels/production
   ```

3. **Check targeting rules**
   If using device targeting, verify the device matches:
   ```typescript
   const state = await BundleNudge.getState();
   console.log('Matches targeting:', state.matchesTargeting);
   ```

## Debug Mode

Enable verbose logging to diagnose issues:

```typescript
BundleNudge.init({
  appId: 'app_abc123',
  apiKey: 'bnk_xxx',
  debug: true,
});
```

This logs:
- All API requests/responses
- Bundle download progress
- Verification steps
- State changes

## Getting State

Dump the full SDK state for debugging:

```typescript
const state = await BundleNudge.getFullState();
console.log(JSON.stringify(state, null, 2));

// Returns:
{
  "deviceId": "device_xyz",
  "currentBundle": "bundle_abc",
  "pendingBundle": null,
  "lastCheck": "2024-01-15T10:00:00Z",
  "lastError": null,
  "rollbackAvailable": true,
  "channel": "production",
  "config": { ... }
}
```

## Reporting Issues

When reporting issues, include:

1. SDK version: `BundleNudge.getVersion()`
2. Platform: iOS/Android
3. React Native version
4. Full state: `await BundleNudge.getFullState()`
5. Error message and stack trace
6. Steps to reproduce

## FAQ

**Q: Can I update native code?**
A: No, only JavaScript/TypeScript. Native code requires an app store update.

**Q: What happens offline?**
A: The app runs with the last downloaded bundle. Updates resume when online.

**Q: How big can bundles be?**
A: Max 50MB. Most bundles are 1-5MB. Use code splitting if larger.

**Q: Is it safe?**
A: Yes. Bundles are signed, verified, and rollback is automatic.

**Q: Does it work with Expo?**
A: Yes, with the Expo config plugin. See sdk-integration.md.
