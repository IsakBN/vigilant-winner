# Feature: shared/schemas

Create Zod validation schemas for the entire system.

## Knowledge Docs to Read First

- `.claude/knowledge/API_FEATURES.md` → API request/response structures
- `.claude/knowledge/IMPLEMENTATION_DETAILS.md` → Data validation requirements

## Dependencies

- `shared/types` (must complete first)

## What to Implement

### 1. Auth Schemas

```typescript
// packages/shared/src/schemas/auth.ts
import { z } from 'zod'

export const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(72),
  name: z.string().min(1).max(100),
})

export const signInSchema = z.object({
  email: z.string().email(),
  password: z.string(),
})

export const emailVerificationSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6).regex(/^\d{6}$/),
})

export const adminOtpRequestSchema = z.object({
  email: z.string().email().refine(
    (email) => email.endsWith('@bundlenudge.com'),
    { message: 'Admin access restricted to @bundlenudge.com domain' }
  ),
})

export const adminOtpVerifySchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6).regex(/^\d{6}$/),
})
```

### 2. App Schemas

```typescript
// packages/shared/src/schemas/apps.ts
import { z } from 'zod'

export const createAppSchema = z.object({
  name: z.string().min(1).max(100),
  platform: z.enum(['ios', 'android', 'both']),
  bundleId: z.string().min(1).max(255).optional(),
})

export const updateAppSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  bundleId: z.string().min(1).max(255).optional(),
})

export const appIdParamSchema = z.object({
  appId: z.string().uuid(),
})
```

### 3. Release Schemas

```typescript
// packages/shared/src/schemas/releases.ts
import { z } from 'zod'

export const createReleaseSchema = z.object({
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  channel: z.enum(['production', 'staging', 'development']).default('production'),
  description: z.string().max(1000).optional(),
  targetVersions: z.array(z.string()).optional(),
  rolloutPercentage: z.number().min(0).max(100).default(100),
  isMandatory: z.boolean().default(false),
})

export const updateRolloutSchema = z.object({
  rolloutPercentage: z.number().min(0).max(100),
})

export const releaseIdParamSchema = z.object({
  appId: z.string().uuid(),
  releaseId: z.string().uuid(),
})
```

### 4. Update Check Schemas

```typescript
// packages/shared/src/schemas/updates.ts
import { z } from 'zod'

export const updateCheckRequestSchema = z.object({
  appId: z.string().uuid(),
  deviceId: z.string().uuid(),
  currentVersion: z.string().nullable(),
  currentVersionHash: z.string().nullable(),
  channel: z.enum(['production', 'staging', 'development']).default('production'),
  appVersion: z.string(),
  platform: z.enum(['ios', 'android']),
  deviceInfo: z.object({
    model: z.string().optional(),
    osVersion: z.string().optional(),
    locale: z.string().optional(),
  }).optional(),
})

export const telemetryEventSchema = z.object({
  appId: z.string().uuid(),
  deviceId: z.string().uuid(),
  releaseId: z.string().uuid().optional(),
  event: z.enum(['check', 'download', 'apply', 'rollback', 'crash']),
  metadata: z.record(z.unknown()).optional(),
})
```

### 5. Team Schemas

```typescript
// packages/shared/src/schemas/teams.ts
import { z } from 'zod'

export const createTeamSchema = z.object({
  name: z.string().min(1).max(100),
})

export const inviteMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(['admin', 'member']).default('member'),
})

export const verifyInvitationSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6).regex(/^\d{6}$/),
  teamId: z.string().uuid(),
})

export const updateMemberRoleSchema = z.object({
  role: z.enum(['owner', 'admin', 'member']),
})
```

### 6. Billing Schemas

```typescript
// packages/shared/src/schemas/billing.ts
import { z } from 'zod'

export const createCheckoutSchema = z.object({
  planId: z.string(),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
})

export const stripeWebhookEventSchema = z.object({
  id: z.string(),
  type: z.string(),
  data: z.object({
    object: z.record(z.unknown()),
  }),
})
```

### 7. Device Schemas

```typescript
// packages/shared/src/schemas/devices.ts
import { z } from 'zod'

export const registerDeviceSchema = z.object({
  appId: z.string().uuid(),
  deviceInfo: z.object({
    platform: z.enum(['ios', 'android']),
    model: z.string(),
    osVersion: z.string(),
    appVersion: z.string(),
  }),
})

export const deviceTokenPayloadSchema = z.object({
  deviceId: z.string().uuid(),
  appId: z.string().uuid(),
  iat: z.number(),
  exp: z.number(),
})
```

### 8. Webhook Schemas

```typescript
// packages/shared/src/schemas/webhooks.ts
import { z } from 'zod'

export const createWebhookSchema = z.object({
  url: z.string().url(),
  events: z.array(z.enum([
    'release.created',
    'release.updated',
    'release.disabled',
    'device.registered',
    'crash.detected',
  ])),
  secret: z.string().min(16).optional(),
})

export const webhookPayloadSchema = z.object({
  event: z.string(),
  timestamp: z.string().datetime(),
  data: z.record(z.unknown()),
})
```

## Files to Create

1. `packages/shared/src/schemas/auth.ts`
2. `packages/shared/src/schemas/apps.ts`
3. `packages/shared/src/schemas/releases.ts`
4. `packages/shared/src/schemas/updates.ts`
5. `packages/shared/src/schemas/teams.ts`
6. `packages/shared/src/schemas/billing.ts`
7. `packages/shared/src/schemas/devices.ts`
8. `packages/shared/src/schemas/webhooks.ts`
9. `packages/shared/src/schemas/index.ts` - Barrel export

## Tests Required

```typescript
// packages/shared/src/schemas/__tests__/auth.test.ts
import { signUpSchema, signInSchema } from '../auth'

describe('signUpSchema', () => {
  it('validates correct data', () => {
    const result = signUpSchema.safeParse({
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
    })
    expect(result.success).toBe(true)
  })

  it('rejects short passwords', () => {
    const result = signUpSchema.safeParse({
      email: 'test@example.com',
      password: 'short',
      name: 'Test User',
    })
    expect(result.success).toBe(false)
  })
})
```

## Acceptance Criteria

- [ ] All schemas created and exported
- [ ] Zod used for all validation
- [ ] Types inferred from schemas
- [ ] Tests pass
- [ ] No `any` types
