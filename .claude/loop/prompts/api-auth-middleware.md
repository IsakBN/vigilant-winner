# Feature: api/auth-middleware

Implement authentication middleware for all API routes.

## Knowledge Docs to Read First

- `.claude/knowledge/IMPLEMENTATION_DETAILS.md` → Auth flows, middleware patterns
- `.claude/knowledge/API_FEATURES.md` → Protected endpoints

## Dependencies

- `api/database-schema` (must complete first)
- `api/better-auth-setup` (must complete first)

## What to Implement

### 1. Session Middleware

```typescript
// packages/api/src/middleware/auth.ts
import { Context, Next } from 'hono'
import { auth } from '../lib/auth'
import { ERROR_CODES } from '@bundlenudge/shared'

export interface AuthContext {
  user: {
    id: string
    email: string
    name: string
    isAdmin: boolean
  }
  session: {
    id: string
    expiresAt: Date
  }
}

export async function authMiddleware(c: Context, next: Next) {
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  })

  if (!session) {
    return c.json(
      { error: ERROR_CODES.UNAUTHORIZED, message: 'Authentication required' },
      401
    )
  }

  // Check if admin based on email domain
  const isAdmin = session.user.email.endsWith('@bundlenudge.com')

  c.set('user', {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    isAdmin,
  })
  c.set('session', session.session)

  await next()
}
```

### 2. Device Token Middleware

```typescript
// packages/api/src/middleware/device-auth.ts
import { Context, Next } from 'hono'
import { verifyDeviceToken } from '../lib/device-token'
import { ERROR_CODES } from '@bundlenudge/shared'

export interface DeviceContext {
  device: {
    id: string
    appId: string
  }
}

export async function deviceAuthMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization')

  if (!authHeader) {
    return c.json(
      { error: ERROR_CODES.UNAUTHORIZED, message: 'Authorization header required' },
      401
    )
  }

  // Support both "Device {token}" and "Bearer {apiKey}" formats
  const [scheme, token] = authHeader.split(' ')

  if (scheme === 'Device') {
    const payload = await verifyDeviceToken(token, c.env.JWT_SECRET)
    if (!payload) {
      return c.json(
        { error: ERROR_CODES.UNAUTHORIZED, message: 'Invalid device token' },
        401
      )
    }
    c.set('device', { id: payload.deviceId, appId: payload.appId })
  } else if (scheme === 'Bearer') {
    // API key auth - lookup app by key
    const app = await getAppByApiKey(c.env.DB, token)
    if (!app) {
      return c.json(
        { error: ERROR_CODES.UNAUTHORIZED, message: 'Invalid API key' },
        401
      )
    }
    c.set('device', { id: 'api-key', appId: app.id })
  } else {
    return c.json(
      { error: ERROR_CODES.UNAUTHORIZED, message: 'Invalid authorization scheme' },
      401
    )
  }

  await next()
}
```

### 3. Admin Middleware

```typescript
// packages/api/src/middleware/admin.ts
import { Context, Next } from 'hono'
import { verifyAdminSession } from '../lib/admin-session'
import { ERROR_CODES } from '@bundlenudge/shared'

export async function adminMiddleware(c: Context, next: Next) {
  const adminSessionId = c.req.header('X-Admin-Session')

  if (!adminSessionId) {
    return c.json(
      { error: ERROR_CODES.UNAUTHORIZED, message: 'Admin session required' },
      401
    )
  }

  const session = await verifyAdminSession(c.env.KV, adminSessionId)

  if (!session) {
    return c.json(
      { error: ERROR_CODES.UNAUTHORIZED, message: 'Invalid or expired admin session' },
      401
    )
  }

  c.set('adminUser', {
    email: session.email,
    sessionId: adminSessionId,
  })

  await next()
}
```

### 4. API Key Middleware

```typescript
// packages/api/src/middleware/api-key.ts
import { Context, Next } from 'hono'
import { ERROR_CODES } from '@bundlenudge/shared'

export async function apiKeyMiddleware(c: Context, next: Next) {
  const apiKey = c.req.header('X-API-Key')

  if (!apiKey) {
    return c.json(
      { error: ERROR_CODES.UNAUTHORIZED, message: 'API key required' },
      401
    )
  }

  const app = await getAppByApiKey(c.env.DB, apiKey)

  if (!app) {
    return c.json(
      { error: ERROR_CODES.UNAUTHORIZED, message: 'Invalid API key' },
      401
    )
  }

  c.set('app', app)
  await next()
}

async function getAppByApiKey(db: D1Database, apiKey: string) {
  const result = await db
    .prepare('SELECT * FROM apps WHERE api_key = ?')
    .bind(apiKey)
    .first()
  return result
}
```

### 5. Combined Auth (User OR Device)

```typescript
// packages/api/src/middleware/combined-auth.ts
import { Context, Next } from 'hono'
import { auth } from '../lib/auth'
import { verifyDeviceToken } from '../lib/device-token'
import { ERROR_CODES } from '@bundlenudge/shared'

export async function combinedAuthMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization')

  if (!authHeader) {
    return c.json(
      { error: ERROR_CODES.UNAUTHORIZED, message: 'Authorization required' },
      401
    )
  }

  const [scheme, token] = authHeader.split(' ')

  if (scheme === 'Bearer') {
    // Try session auth first
    const session = await auth.api.getSession({
      headers: c.req.raw.headers,
    })

    if (session) {
      c.set('authType', 'user')
      c.set('user', session.user)
      c.set('session', session.session)
      await next()
      return
    }

    // Try API key
    const app = await getAppByApiKey(c.env.DB, token)
    if (app) {
      c.set('authType', 'apiKey')
      c.set('app', app)
      await next()
      return
    }
  }

  if (scheme === 'Device') {
    const payload = await verifyDeviceToken(token, c.env.JWT_SECRET)
    if (payload) {
      c.set('authType', 'device')
      c.set('device', { id: payload.deviceId, appId: payload.appId })
      await next()
      return
    }
  }

  return c.json(
    { error: ERROR_CODES.UNAUTHORIZED, message: 'Invalid credentials' },
    401
  )
}
```

### 6. Team Permission Middleware

```typescript
// packages/api/src/middleware/team-permission.ts
import { Context, Next } from 'hono'
import { ERROR_CODES } from '@bundlenudge/shared'

type TeamRole = 'owner' | 'admin' | 'member'

export function requireTeamRole(minRole: TeamRole) {
  const roleHierarchy: Record<TeamRole, number> = {
    member: 1,
    admin: 2,
    owner: 3,
  }

  return async (c: Context, next: Next) => {
    const user = c.get('user')
    const teamId = c.req.param('teamId')

    if (!teamId) {
      return c.json(
        { error: ERROR_CODES.INVALID_INPUT, message: 'Team ID required' },
        400
      )
    }

    const membership = await getTeamMembership(c.env.DB, teamId, user.id)

    if (!membership) {
      return c.json(
        { error: ERROR_CODES.FORBIDDEN, message: 'Not a member of this team' },
        403
      )
    }

    if (roleHierarchy[membership.role] < roleHierarchy[minRole]) {
      return c.json(
        { error: ERROR_CODES.FORBIDDEN, message: `Requires ${minRole} role or higher` },
        403
      )
    }

    c.set('teamMembership', membership)
    await next()
  }
}
```

## Files to Create

1. `packages/api/src/middleware/auth.ts`
2. `packages/api/src/middleware/device-auth.ts`
3. `packages/api/src/middleware/admin.ts`
4. `packages/api/src/middleware/api-key.ts`
5. `packages/api/src/middleware/combined-auth.ts`
6. `packages/api/src/middleware/team-permission.ts`
7. `packages/api/src/middleware/index.ts` - Barrel export

## Tests Required

```typescript
// packages/api/src/middleware/__tests__/auth.test.ts
describe('authMiddleware', () => {
  it('allows authenticated requests', async () => {
    // Mock session
    const response = await app.request('/protected', {
      headers: { Cookie: 'session=valid-session' },
    })
    expect(response.status).toBe(200)
  })

  it('rejects unauthenticated requests', async () => {
    const response = await app.request('/protected')
    expect(response.status).toBe(401)
  })
})
```

## Acceptance Criteria

- [ ] Session middleware validates Better Auth sessions
- [ ] Device middleware validates JWT tokens
- [ ] Admin middleware validates OTP sessions
- [ ] API key middleware validates app keys
- [ ] Team permission checks role hierarchy
- [ ] All errors use ERROR_CODES constants
- [ ] Tests pass
