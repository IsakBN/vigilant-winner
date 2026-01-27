# BundleNudge SDK Knowledge

> **For LLMs**: Read this file first, then refer to the others as needed.

## What is BundleNudge?

BundleNudge is an OTA (over-the-air) update system for React Native apps. It lets you push JavaScript bundle updates directly to users without going through App Store review.

**Key concepts:**
- **Bundle**: Your compiled JavaScript code (what Metro produces)
- **Release**: A specific version of your bundle deployed to users
- **Channel**: A deployment track (production, staging, beta)
- **Rollback**: Reverting to a previous bundle if something goes wrong

## When to Use This Knowledge

Use this when helping with:
- Installing/configuring the BundleNudge SDK
- Debugging update issues
- Setting up release channels
- Implementing rollback protection
- Integrating with CI/CD pipelines
- Using the BundleNudge API

## Quick Reference

### SDK Installation

```bash
npm install @bundlenudge/sdk
# or
yarn add @bundlenudge/sdk
```

### Basic Setup

```typescript
// App.tsx
import { BundleNudge } from '@bundlenudge/sdk';

// Initialize early in your app
BundleNudge.init({
  appId: 'your-app-id',
  apiKey: 'your-api-key',
});

// Check for updates (usually on app launch)
await BundleNudge.checkForUpdates();
```

### Configuration Options

```typescript
BundleNudge.init({
  appId: 'your-app-id',        // Required: from dashboard
  apiKey: 'your-api-key',      // Required: from dashboard
  channel: 'production',        // Optional: default is 'production'
  autoUpdate: true,             // Optional: apply updates automatically
  minBinaryVersion: '1.0.0',    // Optional: minimum native version
});
```

## Files in This Folder

| File | Use When |
|------|----------|
| `sdk-integration.md` | Setting up the SDK, configuration, native modules |
| `api-reference.md` | Making API calls, authentication, endpoints |
| `troubleshooting.md` | Debugging issues, error messages, common problems |
| `context.json` | Programmatic access to metadata |

## Common Tasks

### "Help me install BundleNudge"
→ See `sdk-integration.md`, section "Installation"

### "Updates aren't being applied"
→ See `troubleshooting.md`, section "Updates Not Applying"

### "How do I rollback?"
→ See `sdk-integration.md`, section "Rollback Protection"

### "I want to use the API directly"
→ See `api-reference.md`

### "How do staged rollouts work?"
→ See `sdk-integration.md`, section "Channels"

## Important Constraints

1. **Hermes Only**: BundleNudge works with Hermes bytecode (React Native 0.73+)
2. **JS Only**: You cannot update native code via OTA
3. **Same Binary**: Updates must be compatible with the user's native binary version
4. **Signing**: Bundles are signed and verified for security

## Version

This knowledge pack is for BundleNudge SDK v1.x. Check `context.json` for the exact version.
