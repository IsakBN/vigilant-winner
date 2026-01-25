## Feature: api/update-check

Implement the core update check endpoint with targeting rules.

### Critical Decision (from DECISIONS.md)
- "Newest wins" - return the newest release that matches
- Use targeting rules engine for device matching
- Check minAppVersion/maxAppVersion constraints

### Files to Modify/Create

`packages/api/src/routes/updates.ts` - Implement update check
`packages/api/src/routes/updates.test.ts` - Tests

### Dependencies

Requires: api/database-schema, api/device-registration, api/targeting-engine

### Implementation

```typescript
// updates.ts
import { getDb } from '../db'
import { devices, releases, apps } from '../db/schema'
import { resolveRelease } from '../lib/targeting'
import { deviceAuth } from '../middleware/auth'
import { eq, desc, and } from 'drizzle-orm'

updatesRouter.post('/check', deviceAuth, zValidator('json', updateCheckRequestSchema), async (c) => {
  const body = c.req.valid('json')
  const devicePayload = c.get('device')
  const db = getDb(c.env.DB)

  // 1. Update device last seen and current bundle
  await db.update(devices)
    .set({
      appVersion: body.appVersion,
      currentBundleVersion: body.currentBundleVersion,
      currentBundleHash: body.currentBundleHash,
      lastSeenAt: new Date(),
    })
    .where(eq(devices.id, devicePayload.deviceId))

  // 2. Get app and check min native version
  const app = await db.select()
    .from(apps)
    .where(eq(apps.id, body.appId))
    .get()

  if (!app) {
    return c.json({ error: 'app_not_found' }, 404)
  }

  // 3. Get active releases for this app, sorted by createdAt DESC
  const activeReleases = await db.select()
    .from(releases)
    .where(and(
      eq(releases.appId, body.appId),
      eq(releases.status, 'active')
    ))
    .orderBy(desc(releases.createdAt))

  // 4. Build device attributes for targeting
  const deviceAttributes = {
    deviceId: body.deviceId,
    os: body.platform,
    osVersion: body.deviceInfo?.osVersion ?? '',
    deviceModel: body.deviceInfo?.deviceModel ?? '',
    timezone: body.deviceInfo?.timezone ?? '',
    locale: body.deviceInfo?.locale ?? '',
    appVersion: body.appVersion,
    currentBundleVersion: body.currentBundleVersion ?? null,
  }

  // 5. Find matching release
  const matchingRelease = resolveRelease(activeReleases, deviceAttributes)

  if (!matchingRelease) {
    return c.json({ updateAvailable: false })
  }

  // 6. Check if update is actually newer
  if (body.currentBundleVersion === matchingRelease.version) {
    return c.json({ updateAvailable: false })
  }

  // 7. Check native version constraints
  if (matchingRelease.minAppVersion) {
    if (compareSemver(body.appVersion, matchingRelease.minAppVersion) < 0) {
      return c.json({
        updateAvailable: false,
        requiresAppStoreUpdate: true,
        appStoreMessage: `Please update to version ${matchingRelease.minAppVersion} or later`,
      })
    }
  }

  if (matchingRelease.maxAppVersion) {
    if (compareSemver(body.appVersion, matchingRelease.maxAppVersion) > 0) {
      // App version too new for this release - skip it
      return c.json({ updateAvailable: false })
    }
  }

  // 8. Return update info
  return c.json({
    updateAvailable: true,
    release: {
      version: matchingRelease.version,
      bundleUrl: matchingRelease.bundleUrl,
      bundleSize: matchingRelease.bundleSize,
      bundleHash: matchingRelease.bundleHash,
      releaseId: matchingRelease.id,
      releaseNotes: matchingRelease.releaseNotes,
    },
  })
})

// Helper for semver comparison
function compareSemver(a: string, b: string): number {
  const partsA = a.split('.').map(Number)
  const partsB = b.split('.').map(Number)
  for (let i = 0; i < 3; i++) {
    const diff = (partsA[i] || 0) - (partsB[i] || 0)
    if (diff !== 0) return diff > 0 ? 1 : -1
  }
  return 0
}
```

### Tests Required

1. **No update available**
   - No releases for app
   - All releases inactive
   - Device already on latest

2. **Update available**
   - Returns newest matching release
   - Includes all release info

3. **Targeting**
   - Respects targeting rules
   - Skips non-matching releases
   - Returns newest that matches

4. **Version constraints**
   - Returns requiresAppStoreUpdate if below minAppVersion
   - Skips release if above maxAppVersion

5. **Device update**
   - Updates device lastSeenAt
   - Updates device bundle info
