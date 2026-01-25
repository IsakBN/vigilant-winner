## Feature: shared/types

Create the shared type definitions used across all packages.

### Files to Create

`packages/shared/src/types.ts` - Core type definitions
`packages/shared/src/index.ts` - Re-exports

### Types Required

```typescript
// Device attributes for targeting
export interface DeviceAttributes {
  deviceId: string
  os: 'ios' | 'android'
  osVersion: string
  deviceModel: string
  timezone: string
  locale: string
  appVersion: string
  currentBundleVersion: string | null
}

// Targeting rules
export interface TargetingRule {
  field: keyof DeviceAttributes | 'percentage'
  op: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' |
      'starts_with' | 'ends_with' | 'contains' |
      'in' | 'not_in' |
      'semver_gt' | 'semver_gte' | 'semver_lt' | 'semver_lte'
  value: string | number | string[]
}

export interface TargetingRules {
  match: 'all' | 'any'
  rules: TargetingRule[]
}

// Release
export interface Release {
  id: string
  appId: string
  version: string
  bundleUrl: string
  bundleSize: number
  bundleHash: string
  targetingRules: TargetingRules | null
  status: 'active' | 'paused' | 'rolled_back'
  createdAt: number
  minIosVersion: string | null
  minAndroidVersion: string | null
}

// Update check
export interface UpdateCheckRequest {
  appId: string
  deviceId: string
  platform: 'ios' | 'android'
  appVersion: string
  currentBundleVersion?: string
  currentBundleHash?: string
  deviceInfo?: Partial<DeviceAttributes>
}

export interface UpdateCheckResponse {
  updateAvailable: boolean
  requiresAppStoreUpdate?: boolean
  appStoreMessage?: string
  release?: {
    version: string
    bundleUrl: string
    bundleSize: number
    bundleHash: string
    releaseId: string
    criticalRoutes?: CriticalRoute[]
  }
}

// Critical routes (Team/Enterprise)
export interface CriticalRoute {
  id: string
  pattern: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | '*'
  name?: string
}

// Telemetry events
export type TelemetryEvent =
  | { type: 'applied'; version: string; previousVersion: string | null }
  | { type: 'rollback'; fromVersion: string; toVersion: string; reason: RollbackReason }
  | { type: 'error'; errorType: string; errorMessage: string; targetVersion?: string }
  | { type: 'route'; routeId: string; success: boolean; statusCode?: number }

export type RollbackReason = 'crash' | 'route_failure' | 'manual'

// SDK metadata (stored on device)
export interface SDKMetadata {
  deviceId: string
  accessToken: string | null
  currentVersion: string | null
  currentVersionHash: string | null
  previousVersion: string | null
  pendingUpdateFlag: boolean
  lastSuccessTime: number | null
}

// Error codes
export type SDKErrorCode =
  | 'NO_UPDATE'
  | 'ALREADY_LATEST'
  | 'DOWNLOAD_FAILED'
  | 'HASH_MISMATCH'
  | 'STORAGE_ERROR'
  | 'APPLY_FAILED'
  | 'ROLLBACK_FAILED'
  | 'NETWORK_ERROR'
  | 'UNAUTHORIZED'
```

### Tests Required

- Type exports are valid TypeScript
- Zod schemas validate correctly (if using runtime validation)
