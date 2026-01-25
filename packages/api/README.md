# @bundlenudge/api

Cloudflare Workers API for BundleNudge OTA updates.

## Stack

- **Runtime**: Cloudflare Workers
- **Framework**: Hono
- **Database**: D1 (SQLite) via Drizzle ORM
- **Storage**: R2 (bundles)
- **Cache**: KV (rate limiting)
- **Auth**: JWT tokens (jose)

## Routes

### Device Registration
```
POST /v1/devices/register
  Body: { appId, deviceId, platform, appVersion }
  Response: { accessToken, expiresAt }

POST /v1/devices/refresh
  Headers: Authorization: Bearer <token>
  Response: { accessToken, expiresAt }
```

### Update Check
```
POST /v1/updates/check
  Headers: Authorization: Bearer <token>
  Body: { appId, deviceId, platform, appVersion, currentBundleVersion? }
  Response: { updateAvailable, release? }
```

### Telemetry
```
POST /v1/telemetry
  Body: { deviceId, appId, eventType, timestamp, ... }

POST /v1/telemetry/batch
  Body: { events: [...] }

POST /v1/telemetry/crash
  Body: { deviceId, appId, bundleVersion, ... }
```

### Releases (Dashboard)
```
GET    /v1/releases?appId=<uuid>
POST   /v1/releases
GET    /v1/releases/:id
PATCH  /v1/releases/:id
POST   /v1/releases/:id/rollback
```

### Apps (Dashboard)
```
GET    /v1/apps
POST   /v1/apps
GET    /v1/apps/:id
PATCH  /v1/apps/:id
DELETE /v1/apps/:id
GET    /v1/apps/:id/stats
```

## Key Implementation Details

### Targeting Rules Engine
Located in `src/lib/targeting/`:
- `evaluate.ts` - Rule evaluation logic
- `resolve.ts` - Release resolution (newest matching wins)
- `hash.ts` - FNV-1a hash for percentage targeting

```typescript
// Example: 50% rollout to iOS devices
const rules: TargetingRules = {
  match: 'all',
  rules: [
    { field: 'os', op: 'eq', value: 'ios' },
    { field: 'percentage', op: 'lte', value: 50 }
  ]
}
```

### Percentage Targeting
Uses FNV-1a hash for sticky bucketing:
```typescript
function evaluatePercentage(deviceId: string, percentage: number): boolean {
  const bucket = fnv1aHash(deviceId) % 100
  return bucket < percentage  // Same device always in same bucket
}
```

### Release Resolution
"Newest wins" - returns the newest active release matching device attributes:
```typescript
function resolveRelease(releases: Release[], device: DeviceAttributes): Release | null {
  // Releases sorted by createdAt DESC
  for (const release of releases) {
    if (release.status !== 'active') continue
    if (evaluateRules(release.targetingRules, device)) {
      return release
    }
  }
  return null
}
```

## Environment Bindings

```typescript
interface Env {
  DB: D1Database           // Primary database
  BUNDLES: R2Bucket        // Bundle storage
  RATE_LIMIT: KVNamespace  // Rate limiting
  JWT_SECRET: string       // Token signing
}
```

## Development

```bash
pnpm dev        # Start local dev server
pnpm test       # Run tests
pnpm typecheck  # Type check
pnpm deploy     # Deploy to Cloudflare
```

## Database Schema

Key tables (Drizzle):
- `apps` - Registered applications
- `devices` - Device registrations
- `releases` - Bundle releases
- `telemetry_events` - Analytics data
