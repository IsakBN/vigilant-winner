## Feature: sdk/rollback-manager

Implement rollback management with tiered behavior.

### Critical Decision (from DECISIONS.md)
- Free/Pro: 60-second crash detection, then cleanup
- Team/Enterprise: Route monitoring for critical routes
- Device rollback on first crash

### Files to Modify/Create

`packages/sdk/src/rollback-manager.ts` - Complete implementation
`packages/sdk/src/rollback-manager.test.ts` - Tests

### Implementation

```typescript
// rollback-manager.ts
import type { Storage } from './storage'
import type { DeviceAuth } from './auth'
import type { BundleNudgeConfig, NativeModuleInterface } from './types'
import { CrashDetector } from './crash-detector'
import { RouteMonitor, type CriticalRoute } from './route-monitor'
import { NativeModules } from 'react-native'

const BundleNudgeNative: NativeModuleInterface = NativeModules.BundleNudge

export type RollbackReason =
  | 'crash_detected'
  | 'route_failure'
  | 'server_triggered'
  | 'manual'

export type TierType = 'free' | 'pro' | 'team' | 'enterprise'

export interface RollbackManagerConfig {
  storage: Storage
  auth: DeviceAuth
  config: BundleNudgeConfig
  tier: TierType
  criticalRoutes?: CriticalRoute[]
}

export class RollbackManager {
  private storage: Storage
  private auth: DeviceAuth
  private config: BundleNudgeConfig
  private tier: TierType
  private crashDetector: CrashDetector
  private routeMonitor: RouteMonitor | null = null

  constructor(deps: RollbackManagerConfig) {
    this.storage = deps.storage
    this.auth = deps.auth
    this.config = deps.config
    this.tier = deps.tier

    // Initialize crash detector (all tiers)
    this.crashDetector = new CrashDetector(this.storage, {
      verificationWindowMs: 60000,
      onRollback: () => this.triggerRollback('crash_detected'),
      onVerified: () => this.markUpdateVerified(),
      onCrashReported: (count) => this.reportCrash(count),
    })

    // Initialize route monitor (Team/Enterprise only)
    if ((deps.tier === 'team' || deps.tier === 'enterprise') && deps.criticalRoutes?.length) {
      this.routeMonitor = new RouteMonitor({
        routes: deps.criticalRoutes,
        timeoutMs: 5 * 60 * 1000, // 5 minutes
        onRollback: () => this.triggerRollback('route_failure'),
        onVerified: () => this.markUpdateVerified(),
        onRouteResult: (id, success, code) => this.reportRouteResult(id, success, code),
      })
    }
  }

  /**
   * Check for crash on app start.
   */
  async checkForCrash(): Promise<boolean> {
    return this.crashDetector.checkForCrash()
  }

  /**
   * Start verification after update.
   */
  start(): void {
    if (this.routeMonitor) {
      // Team/Enterprise: use route monitoring
      this.routeMonitor.start()
    } else {
      // Free/Pro: use crash detection
      this.crashDetector.startVerificationWindow()
    }
  }

  /**
   * Stop verification (cleanup).
   */
  stop(): void {
    this.crashDetector.stop()
    this.routeMonitor?.stop()
  }

  /**
   * Notify that app is ready (verification passed).
   */
  async notifyAppReady(): Promise<void> {
    await this.crashDetector.notifyAppReady()
    await BundleNudgeNative.notifyAppReady()
  }

  /**
   * Check if rollback is available.
   */
  canRollback(): boolean {
    const metadata = this.storage.getMetadata()
    return metadata.previousVersion !== null
  }

  /**
   * Get the version we would rollback to.
   */
  getRollbackVersion(): string | null {
    return this.storage.getMetadata().previousVersion
  }

  /**
   * Trigger a rollback.
   */
  async triggerRollback(reason: RollbackReason): Promise<void> {
    const metadata = this.storage.getMetadata()
    const currentVersion = metadata.currentVersion
    const previousVersion = metadata.previousVersion

    if (!previousVersion) {
      console.warn('[BundleNudge] No previous version to rollback to')
      return
    }

    // 1. Update storage state
    await this.storage.rollback()

    // 2. Report rollback to server
    await this.reportRollback(reason, currentVersion, previousVersion)

    // 3. Restart app with previous bundle
    await BundleNudgeNative.restartApp(false)
  }

  /**
   * Mark current update as verified.
   * Cleanup previous bundle.
   */
  async markUpdateVerified(): Promise<void> {
    await this.storage.clearPreviousVersion()

    // Report success
    await this.reportUpdateVerified()

    // TODO: Clean up old bundle files via native module
  }

  private async reportRollback(
    reason: RollbackReason,
    fromVersion: string | null,
    toVersion: string
  ): Promise<void> {
    const apiUrl = this.config.apiUrl || 'https://api.bundlenudge.com'

    try {
      await this.auth.authenticatedFetch(`${apiUrl}/v1/telemetry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId: this.storage.getDeviceId(),
          appId: this.config.appId,
          eventType: 'rollback_triggered',
          bundleVersion: fromVersion,
          metadata: { reason, rolledBackTo: toVersion },
          timestamp: Date.now(),
        }),
      })
    } catch {
      // Non-fatal
    }
  }

  private async reportCrash(crashCount: number): Promise<void> {
    const apiUrl = this.config.apiUrl || 'https://api.bundlenudge.com'
    const metadata = this.storage.getMetadata()

    try {
      await this.auth.authenticatedFetch(`${apiUrl}/v1/telemetry/crash`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId: this.storage.getDeviceId(),
          appId: this.config.appId,
          bundleVersion: metadata.currentVersion,
          metadata: { crashCount },
          timestamp: Date.now(),
        }),
      })
    } catch {
      // Non-fatal
    }
  }

  private async reportRouteResult(routeId: string, success: boolean, statusCode?: number): Promise<void> {
    const apiUrl = this.config.apiUrl || 'https://api.bundlenudge.com'

    try {
      await this.auth.authenticatedFetch(`${apiUrl}/v1/telemetry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId: this.storage.getDeviceId(),
          appId: this.config.appId,
          eventType: success ? 'route_success' : 'route_failure',
          metadata: { routeId, statusCode },
          timestamp: Date.now(),
        }),
      })
    } catch {
      // Non-fatal
    }
  }

  private async reportUpdateVerified(): Promise<void> {
    const apiUrl = this.config.apiUrl || 'https://api.bundlenudge.com'

    try {
      await this.auth.authenticatedFetch(`${apiUrl}/v1/telemetry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId: this.storage.getDeviceId(),
          appId: this.config.appId,
          eventType: 'update_applied',
          bundleVersion: this.storage.getCurrentVersion(),
          timestamp: Date.now(),
        }),
      })
    } catch {
      // Non-fatal
    }
  }
}
```

### Tests Required

1. **Free/Pro tier**
   - Uses crash detection only
   - No route monitoring

2. **Team/Enterprise tier**
   - Uses route monitoring
   - Falls back to crash detection

3. **Rollback**
   - Updates storage
   - Reports to server
   - Restarts app

4. **Verification**
   - Clears previous version
   - Reports success
