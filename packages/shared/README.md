# @bundlenudge/shared

Shared types, schemas, and constants for BundleNudge.

## Purpose

This package provides type-safe contracts between API and SDK:
- Zod schemas for runtime validation
- TypeScript types for compile-time safety
- Constants (API URLs, error codes, timeouts)

## Key Types

### Device Attributes
```typescript
interface DeviceAttributes {
  deviceId: string          // Unique device ID (UUID)
  os: 'ios' | 'android'     // Platform
  osVersion: string         // e.g., "17.0"
  deviceModel: string       // e.g., "iPhone15,2"
  timezone: string          // e.g., "America/New_York"
  locale: string            // e.g., "en-US"
  appVersion: string        // Native app version (semver)
  currentBundleVersion: string | null  // Current OTA version
}
```

### Targeting Rules
```typescript
interface TargetingRules {
  match: 'all' | 'any'      // All rules or any rule
  rules: TargetingRule[]    // List of rules
}

interface TargetingRule {
  field: string             // Device attribute field
  op: TargetingOperator     // Comparison operator
  value: string | number | string[]  // Value to compare
}

// Operators: eq, neq, gt, gte, lt, lte, starts_with, ends_with,
//            contains, in, not_in, semver_gt, semver_gte, semver_lt, semver_lte
```

### Update Check Request/Response
```typescript
// Request
interface UpdateCheckRequest {
  appId: string             // App UUID
  deviceId: string          // Device UUID
  platform: 'ios' | 'android'
  appVersion: string        // Native version
  currentBundleVersion?: string  // Current OTA version
  currentBundleHash?: string     // Current bundle hash
  deviceInfo?: object       // Optional device metadata
}

// Response
interface UpdateCheckResponse {
  updateAvailable: boolean
  requiresAppStoreUpdate?: boolean  // Native version too old
  appStoreMessage?: string          // Message to show user
  release?: {
    version: string
    bundleUrl: string
    bundleSize: number
    bundleHash: string      // sha256:...
    releaseId: string
    releaseNotes?: string
  }
}
```

## Schemas

All schemas use Zod for runtime validation:

```typescript
import { updateCheckRequestSchema } from '@bundlenudge/shared'

const result = updateCheckRequestSchema.safeParse(body)
if (!result.success) {
  // Handle validation error
}
```

## Constants

```typescript
export const API_URL = 'https://api.bundlenudge.com'
export const VERIFICATION_WINDOW_MS = 60_000  // 60 seconds
export const ROUTE_MONITOR_TIMEOUT_MS = 5 * 60 * 1000  // 5 minutes
```

## Usage in API

```typescript
import { updateCheckRequestSchema, UpdateCheckResponse } from '@bundlenudge/shared'

app.post('/v1/updates/check', async (c) => {
  const body = updateCheckRequestSchema.parse(c.req.body)
  // ...
  const response: UpdateCheckResponse = { updateAvailable: false }
  return c.json(response)
})
```

## Usage in SDK

```typescript
import type { UpdateCheckResponse, DeviceAttributes } from '@bundlenudge/shared'

const response: UpdateCheckResponse = await fetch('/v1/updates/check')
```
