## Feature: sdk/route-monitor

Implement critical route monitoring for Team/Enterprise tiers.

### Critical Decision (from DECISIONS.md)
- Team/Enterprise: Keep previous bundle until ALL critical routes return 200
- If any critical route fails → immediate rollback
- Timeout: 5 minutes (if routes not called, treat as success)

### Files to Create

`packages/sdk/src/route-monitor.ts` - Route monitoring
`packages/sdk/src/route-monitor.test.ts` - Tests

### Implementation

```typescript
// route-monitor.ts
import { CriticalRoute, RollbackReason } from '@bundlenudge/shared'

export interface RouteMonitorConfig {
  routes: CriticalRoute[]
  timeoutMs: number  // Default: 5 * 60 * 1000 (5 minutes)
  onRollback: (reason: RollbackReason) => Promise<void>
  onVerified: () => Promise<void>
  onRouteResult: (routeId: string, success: boolean, statusCode?: number) => void
}

export class RouteMonitor {
  private config: RouteMonitorConfig
  private routeResults: Map<string, boolean> = new Map()
  private timeoutId: NodeJS.Timeout | null = null
  private isActive = false

  constructor(config: RouteMonitorConfig) {
    this.config = config
  }

  /**
   * Start monitoring. Call this after update is applied.
   */
  start(): void {
    if (this.isActive) return
    this.isActive = true
    this.routeResults.clear()

    // Set timeout - if not all routes called within window, treat as success
    this.timeoutId = setTimeout(() => {
      this.handleTimeout()
    }, this.config.timeoutMs)

    // Intercept fetch globally
    this.interceptFetch()
  }

  /**
   * Stop monitoring and clean up.
   */
  stop(): void {
    this.isActive = false
    if (this.timeoutId) {
      clearTimeout(this.timeoutId)
      this.timeoutId = null
    }
    this.restoreFetch()
  }

  private interceptFetch(): void {
    const originalFetch = global.fetch
    const self = this

    global.fetch = async function(input: RequestInfo | URL, init?: RequestInit) {
      const response = await originalFetch(input, init)

      if (self.isActive) {
        self.checkRoute(input, init?.method || 'GET', response.status)
      }

      return response
    }

    // Store original for restoration
    (global as any).__originalFetch = originalFetch
  }

  private restoreFetch(): void {
    if ((global as any).__originalFetch) {
      global.fetch = (global as any).__originalFetch
      delete (global as any).__originalFetch
    }
  }

  private checkRoute(
    input: RequestInfo | URL,
    method: string,
    statusCode: number
  ): void {
    const url = typeof input === 'string' ? input : input.toString()

    for (const route of this.config.routes) {
      if (this.matchesRoute(url, method, route)) {
        const success = statusCode >= 200 && statusCode < 300
        this.recordResult(route.id, success, statusCode)
        break
      }
    }
  }

  private matchesRoute(url: string, method: string, route: CriticalRoute): boolean {
    // Check method
    if (route.method !== '*' && route.method !== method.toUpperCase()) {
      return false
    }

    // Check URL pattern (simple glob matching)
    const pattern = route.pattern
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.')

    return new RegExp(`^${pattern}$`).test(url)
  }

  private recordResult(routeId: string, success: boolean, statusCode?: number): void {
    this.routeResults.set(routeId, success)
    this.config.onRouteResult(routeId, success, statusCode)

    if (!success) {
      // Critical route failed - immediate rollback
      this.stop()
      this.config.onRollback('route_failure')
      return
    }

    // Check if all routes have succeeded
    this.checkAllRoutesSucceeded()
  }

  private checkAllRoutesSucceeded(): void {
    const allRouteIds = this.config.routes.map(r => r.id)
    const allSucceeded = allRouteIds.every(id => this.routeResults.get(id) === true)

    if (allSucceeded) {
      this.stop()
      this.config.onVerified()
    }
  }

  private handleTimeout(): void {
    // Timeout reached - check current state
    const anyFailed = Array.from(this.routeResults.values()).some(v => v === false)

    this.stop()

    if (anyFailed) {
      this.config.onRollback('route_failure')
    } else {
      // No failures (some routes may not have been called) - treat as success
      this.config.onVerified()
    }
  }
}
```

### Tests Required

1. **Route matching**
   - Exact URL match
   - Wildcard patterns (`/api/*`)
   - Method matching (`GET` vs `POST` vs `*`)

2. **Success flow**
   - All routes return 200 → `onVerified` called
   - `onRollback` not called

3. **Failure flow**
   - One route returns 500 → `onRollback` called immediately
   - Other routes not waited for

4. **Timeout flow**
   - Only some routes called, all succeed → `onVerified` after timeout
   - No routes called → `onVerified` after timeout
   - Some routes called, one failed → `onRollback` (before timeout)

5. **Cleanup**
   - `stop()` clears timeout
   - `stop()` restores original fetch

### Mock Strategy

```typescript
// Mock global fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

// Simulate successful response
mockFetch.mockResolvedValue({ status: 200 })

// Simulate failed response
mockFetch.mockResolvedValue({ status: 500 })
```

### Integration with RollbackManager

The RouteMonitor is only active for Team/Enterprise tiers:

```typescript
// In RollbackManager
if (tier === 'team' || tier === 'enterprise') {
  if (criticalRoutes && criticalRoutes.length > 0) {
    this.routeMonitor = new RouteMonitor({
      routes: criticalRoutes,
      timeoutMs: 5 * 60 * 1000,
      onRollback: (reason) => this.triggerRollback(reason),
      onVerified: () => this.markUpdateVerified(),
      onRouteResult: (id, success, code) => this.reportRouteResult(id, success, code)
    })
    this.routeMonitor.start()
  }
} else {
  // Free/Pro: just use 60-second crash detection
  this.crashDetector.startVerificationWindow()
}
```
