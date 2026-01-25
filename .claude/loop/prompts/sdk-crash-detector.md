## Feature: sdk/crash-detection

Implement immediate crash detection and rollback for BundleNudge SDK.

### Critical Decision (from DECISIONS.md)
- Device rollback is IMMEDIATE on first crash after update
- 60-second window: if no crash, delete previous bundle
- This is the FREE/PRO tier behavior

### Files to Create

`packages/sdk/src/crash-detection.ts` - Main crash detection logic
`packages/sdk/src/crash-detection.test.ts` - Tests

### Implementation

```typescript
// The core algorithm:
//
// 1. Before applying update:
//    - storage.setPendingUpdateFlag(true)
//
// 2. On app launch (in RollbackManager):
//    - Check: storage.getPendingUpdateFlag()
//    - If true: PREVIOUS LAUNCH CRASHED → rollback immediately
//    - If false: normal startup
//
// 3. After 60 seconds of successful running:
//    - storage.setPendingUpdateFlag(false)
//    - storage.commitUpdate() // deletes previous bundle
//
// This is different from codepush which aggregates crashes server-side!

export class CrashDetector {
  private storage: Storage
  private successTimer: NodeJS.Timeout | null = null
  private readonly VERIFICATION_WINDOW_MS = 60_000

  constructor(storage: Storage) {
    this.storage = storage
  }

  /**
   * Call this on app launch, BEFORE loading any bundle.
   * Returns true if we detected a crash and rolled back.
   */
  async checkAndRollbackIfCrashed(): Promise<boolean> {
    const pendingFlag = await this.storage.getPendingUpdateFlag()

    if (pendingFlag) {
      // Previous launch crashed after update was applied
      await this.storage.rollbackToPrevious()
      await this.storage.setPendingUpdateFlag(false)
      return true
    }

    return false
  }

  /**
   * Call this right before applying a new update.
   */
  async markUpdatePending(): Promise<void> {
    await this.storage.setPendingUpdateFlag(true)
  }

  /**
   * Call this once the app is running successfully.
   * Starts the 60-second verification timer.
   */
  startVerificationWindow(): void {
    if (this.successTimer) {
      clearTimeout(this.successTimer)
    }

    this.successTimer = setTimeout(async () => {
      await this.markUpdateVerified()
    }, this.VERIFICATION_WINDOW_MS)
  }

  /**
   * Called after 60 seconds of successful running.
   */
  async markUpdateVerified(): Promise<void> {
    await this.storage.setPendingUpdateFlag(false)
    await this.storage.commitUpdate() // Delete previous bundle
  }

  /**
   * Clean up timer if app is closing.
   */
  cleanup(): void {
    if (this.successTimer) {
      clearTimeout(this.successTimer)
      this.successTimer = null
    }
  }
}
```

### Tests Required

1. **Crash detection**
   - `pendingUpdateFlag = true` → `checkAndRollbackIfCrashed()` returns true, rollback called
   - `pendingUpdateFlag = false` → returns false, no rollback

2. **Verification window**
   - After 60 seconds, `commitUpdate()` is called
   - Timer is cancellable via `cleanup()`

3. **Integration**
   - Full flow: markPending → simulate crash → launch → rollback detected

### Mock Strategy

```typescript
// Mock storage for testing
const mockStorage = {
  getPendingUpdateFlag: vi.fn(),
  setPendingUpdateFlag: vi.fn(),
  rollbackToPrevious: vi.fn(),
  commitUpdate: vi.fn(),
}
```
