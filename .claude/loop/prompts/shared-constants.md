# Feature: shared/constants

Define all constants used across the system.

## Knowledge Docs to Read First

- `.claude/knowledge/IMPLEMENTATION_DETAILS.md` → Plan limits, timeouts
- `.claude/knowledge/API_FEATURES.md` → Error codes, event types

## Dependencies

- None (foundation)

## What to Implement

### 1. Plan Limits

```typescript
// packages/shared/src/constants/plans.ts
export const PLAN_LIMITS = {
  free: {
    mauLimit: 1_000,
    storageGb: 1,
    appsLimit: 2,
    teamMembersLimit: 1,
    releasesPerMonth: 10,
    retentionDays: 7,
    features: ['basic_updates', 'rollback'],
  },
  pro: {
    mauLimit: 10_000,
    storageGb: 10,
    appsLimit: 10,
    teamMembersLimit: 5,
    releasesPerMonth: 100,
    retentionDays: 30,
    features: ['basic_updates', 'rollback', 'staged_rollout', 'ab_testing'],
  },
  team: {
    mauLimit: 100_000,
    storageGb: 50,
    appsLimit: 50,
    teamMembersLimit: 20,
    releasesPerMonth: 500,
    retentionDays: 90,
    features: ['basic_updates', 'rollback', 'staged_rollout', 'ab_testing', 'teams', 'webhooks'],
  },
  enterprise: {
    mauLimit: Infinity,
    storageGb: Infinity,
    appsLimit: Infinity,
    teamMembersLimit: Infinity,
    releasesPerMonth: Infinity,
    retentionDays: 365,
    features: ['basic_updates', 'rollback', 'staged_rollout', 'ab_testing', 'teams', 'webhooks', 'sso', 'audit_log', 'sla'],
  },
} as const

export type PlanId = keyof typeof PLAN_LIMITS
export type PlanLimits = typeof PLAN_LIMITS[PlanId]
```

### 2. Auth Constants

```typescript
// packages/shared/src/constants/auth.ts
export const AUTH = {
  SESSION_EXPIRY_DAYS: 7,
  OTP_EXPIRY_MINUTES: 30,
  OTP_LENGTH: 6,
  OTP_MAX_ATTEMPTS: 5,
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 72,
  BCRYPT_ROUNDS: 10,
  ADMIN_DOMAIN: '@bundlenudge.com',
  ADMIN_LOCKOUT_MINUTES: 30,
  ADMIN_MAX_FAILURES: 10,
  DEVICE_TOKEN_EXPIRY_DAYS: 30,
} as const
```

### 3. Rate Limits

```typescript
// packages/shared/src/constants/rate-limits.ts
export const RATE_LIMITS = {
  // API endpoints
  default: { requests: 100, windowMs: 60_000 },
  auth: { requests: 5, windowMs: 60_000 },
  updateCheck: { requests: 60, windowMs: 60_000 },
  upload: { requests: 10, windowMs: 60_000 },

  // Admin OTP
  adminOtpSend: { requests: 3, windowMs: 900_000 }, // 15 min
  adminOtpVerify: { requests: 5, windowMs: 60_000 },

  // Webhooks
  webhookRetry: { maxAttempts: 3, backoffMs: [1000, 5000, 30000] },
} as const
```

### 4. Event Types

```typescript
// packages/shared/src/constants/events.ts
export const TELEMETRY_EVENTS = {
  CHECK: 'check',
  DOWNLOAD: 'download',
  APPLY: 'apply',
  ROLLBACK: 'rollback',
  CRASH: 'crash',
  SESSION_START: 'session_start',
  SESSION_END: 'session_end',
} as const

export type TelemetryEvent = typeof TELEMETRY_EVENTS[keyof typeof TELEMETRY_EVENTS]

export const WEBHOOK_EVENTS = {
  RELEASE_CREATED: 'release.created',
  RELEASE_UPDATED: 'release.updated',
  RELEASE_DISABLED: 'release.disabled',
  DEVICE_REGISTERED: 'device.registered',
  CRASH_DETECTED: 'crash.detected',
} as const

export type WebhookEvent = typeof WEBHOOK_EVENTS[keyof typeof WEBHOOK_EVENTS]

export const AUDIT_EVENTS = {
  USER_CREATED: 'user.created',
  USER_UPDATED: 'user.updated',
  TEAM_MEMBER_ADDED: 'team.member_added',
  TEAM_MEMBER_REMOVED: 'team.member_removed',
  TEAM_ROLE_CHANGED: 'team.role_changed',
  SUBSCRIPTION_CREATED: 'subscription.created',
  SUBSCRIPTION_UPDATED: 'subscription.updated',
  SUBSCRIPTION_CANCELLED: 'subscription.cancelled',
} as const

export type AuditEvent = typeof AUDIT_EVENTS[keyof typeof AUDIT_EVENTS]
```

### 5. Error Codes

```typescript
// packages/shared/src/constants/errors.ts
export const ERROR_CODES = {
  // Auth errors
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  INVALID_OTP: 'INVALID_OTP',
  OTP_EXPIRED: 'OTP_EXPIRED',
  ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',

  // Resource errors
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  CONFLICT: 'CONFLICT',

  // Limit errors
  MAU_LIMIT_EXCEEDED: 'MAU_LIMIT_EXCEEDED',
  STORAGE_LIMIT_EXCEEDED: 'STORAGE_LIMIT_EXCEEDED',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  PLAN_LIMIT_EXCEEDED: 'PLAN_LIMIT_EXCEEDED',

  // Update errors
  NO_UPDATE_AVAILABLE: 'NO_UPDATE_AVAILABLE',
  UPDATE_REQUIRES_APP_STORE: 'UPDATE_REQUIRES_APP_STORE',
  HASH_MISMATCH: 'HASH_MISMATCH',

  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',

  // Server errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
} as const

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES]
```

### 6. Channels and Platforms

```typescript
// packages/shared/src/constants/platform.ts
export const CHANNELS = {
  PRODUCTION: 'production',
  STAGING: 'staging',
  DEVELOPMENT: 'development',
} as const

export type Channel = typeof CHANNELS[keyof typeof CHANNELS]

export const PLATFORMS = {
  IOS: 'ios',
  ANDROID: 'android',
} as const

export type Platform = typeof PLATFORMS[keyof typeof PLATFORMS]
```

### 7. Rollback Constants

```typescript
// packages/shared/src/constants/rollback.ts
export const ROLLBACK = {
  MAX_CRASH_COUNT: 3,
  CRASH_WINDOW_MS: 60_000, // 1 minute
  SUCCESS_TIMEOUT_MS: 30_000, // 30 seconds
} as const

export const ROLLBACK_REASONS = {
  CRASH_THRESHOLD: 'crash_threshold',
  HEALTH_CHECK_FAILED: 'health_check_failed',
  MANUAL: 'manual',
  TIMEOUT: 'timeout',
} as const

export type RollbackReason = typeof ROLLBACK_REASONS[keyof typeof ROLLBACK_REASONS]
```

## Files to Create

1. `packages/shared/src/constants/plans.ts`
2. `packages/shared/src/constants/auth.ts`
3. `packages/shared/src/constants/rate-limits.ts`
4. `packages/shared/src/constants/events.ts`
5. `packages/shared/src/constants/errors.ts`
6. `packages/shared/src/constants/platform.ts`
7. `packages/shared/src/constants/rollback.ts`
8. `packages/shared/src/constants/index.ts` - Barrel export

## Acceptance Criteria

- [ ] All constants defined with `as const`
- [ ] Types exported from constants
- [ ] No magic strings/numbers in codebase after this
- [ ] All values documented
- [ ] TypeScript strict mode passes
