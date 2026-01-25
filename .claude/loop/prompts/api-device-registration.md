## Feature: api/device-registration

Implement device registration and JWT token management.

### Critical Decision (from DECISIONS.md)
- No secrets in app - first-launch registration
- Server generates JWT tokens, validates appId

### Files to Modify/Create

`packages/api/src/routes/devices.ts` - Update stub implementation
`packages/api/src/lib/auth/jwt.ts` - JWT utilities
`packages/api/src/lib/auth/index.ts` - Auth exports
`packages/api/src/routes/devices.test.ts` - Tests

### Implementation

```typescript
// jwt.ts
import { SignJWT, jwtVerify } from 'jose'

interface TokenPayload {
  deviceId: string
  appId: string
  iat: number
  exp: number
}

const TOKEN_EXPIRY = '30d'

export async function createDeviceToken(
  deviceId: string,
  appId: string,
  secret: string
): Promise<{ token: string; expiresAt: number }> {
  const secretKey = new TextEncoder().encode(secret)
  const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000

  const token = await new SignJWT({ deviceId, appId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRY)
    .sign(secretKey)

  return { token, expiresAt }
}

export async function verifyDeviceToken(
  token: string,
  secret: string
): Promise<TokenPayload | null> {
  try {
    const secretKey = new TextEncoder().encode(secret)
    const { payload } = await jwtVerify(token, secretKey)
    return payload as TokenPayload
  } catch {
    return null
  }
}
```

```typescript
// devices.ts route implementation
import { getDb } from '../db'
import { apps, devices } from '../db/schema'
import { createDeviceToken } from '../lib/auth/jwt'
import { eq } from 'drizzle-orm'

devicesRouter.post('/register', zValidator('json', deviceRegisterRequestSchema), async (c) => {
  const body = c.req.valid('json')
  const db = getDb(c.env.DB)

  // 1. Validate appId exists
  const app = await db.select()
    .from(apps)
    .where(eq(apps.id, body.appId))
    .get()

  if (!app) {
    return c.json({ error: 'invalid_app', message: 'App not found' }, 404)
  }

  // 2. Create or update device record
  const now = new Date()
  await db.insert(devices)
    .values({
      id: body.deviceId,
      appId: body.appId,
      platform: body.platform,
      appVersion: body.appVersion,
      createdAt: now,
      lastSeenAt: now,
    })
    .onConflictDoUpdate({
      target: devices.id,
      set: {
        appVersion: body.appVersion,
        lastSeenAt: now,
      },
    })

  // 3. Generate JWT access token
  const { token, expiresAt } = await createDeviceToken(
    body.deviceId,
    body.appId,
    c.env.JWT_SECRET
  )

  // 4. Return token
  return c.json({
    accessToken: token,
    expiresAt,
  })
})

devicesRouter.post('/refresh', async (c) => {
  const authHeader = c.req.header('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'unauthorized' }, 401)
  }

  const oldToken = authHeader.slice(7)
  const payload = await verifyDeviceToken(oldToken, c.env.JWT_SECRET)

  if (!payload) {
    return c.json({ error: 'invalid_token' }, 401)
  }

  // Generate new token
  const { token, expiresAt } = await createDeviceToken(
    payload.deviceId,
    payload.appId,
    c.env.JWT_SECRET
  )

  return c.json({
    accessToken: token,
    expiresAt,
  })
})
```

### Auth Middleware

```typescript
// middleware/auth.ts
import { verifyDeviceToken } from '../lib/auth/jwt'

export const deviceAuth = async (c, next) => {
  const authHeader = c.req.header('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'unauthorized' }, 401)
  }

  const token = authHeader.slice(7)
  const payload = await verifyDeviceToken(token, c.env.JWT_SECRET)

  if (!payload) {
    return c.json({ error: 'invalid_token' }, 401)
  }

  c.set('device', payload)
  await next()
}
```

### Tests Required

1. **Registration**
   - Valid appId returns token
   - Invalid appId returns 404
   - Device is created in DB
   - Repeat registration updates lastSeenAt

2. **Refresh**
   - Valid token returns new token
   - Invalid token returns 401
   - No auth header returns 401

3. **JWT**
   - Token verifies correctly
   - Expired token fails verification
   - Invalid signature fails
