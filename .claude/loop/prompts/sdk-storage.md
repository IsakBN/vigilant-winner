## Feature: sdk/storage

Implement AsyncStorage-based metadata persistence.

### Files to Modify/Create

`packages/sdk/src/storage.ts` - Complete implementation with AsyncStorage
`packages/sdk/src/storage.test.ts` - Tests with mocked AsyncStorage

### Implementation

```typescript
// storage.ts
import AsyncStorage from '@react-native-async-storage/async-storage'
import type { StoredMetadata } from './types'
import { generateDeviceId } from './utils'

const STORAGE_KEY = '@bundlenudge:metadata'

export class Storage {
  private metadata: StoredMetadata | null = null

  async initialize(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY)
      if (stored) {
        this.metadata = JSON.parse(stored)
      } else {
        this.metadata = this.getDefaultMetadata()
        await this.persist()
      }
    } catch {
      this.metadata = this.getDefaultMetadata()
      await this.persist()
    }
  }

  getMetadata(): StoredMetadata {
    if (!this.metadata) {
      throw new Error('Storage not initialized')
    }
    return this.metadata
  }

  async updateMetadata(updates: Partial<StoredMetadata>): Promise<void> {
    if (!this.metadata) {
      throw new Error('Storage not initialized')
    }
    this.metadata = { ...this.metadata, ...updates }
    await this.persist()
  }

  getDeviceId(): string {
    return this.getMetadata().deviceId
  }

  getAccessToken(): string | null {
    return this.getMetadata().accessToken
  }

  async setAccessToken(token: string): Promise<void> {
    await this.updateMetadata({ accessToken: token })
  }

  getCurrentVersion(): string | null {
    return this.getMetadata().currentVersion
  }

  getCurrentVersionHash(): string | null {
    return this.getMetadata().currentVersionHash
  }

  async setPendingUpdate(version: string, hash: string): Promise<void> {
    await this.updateMetadata({
      pendingVersion: version,
      currentVersionHash: hash,
      pendingUpdateFlag: true,
    })
  }

  hasPendingUpdate(): boolean {
    const metadata = this.getMetadata()
    return metadata.pendingUpdateFlag && metadata.pendingVersion !== null
  }

  async applyPendingUpdate(): Promise<void> {
    const metadata = this.getMetadata()
    if (!metadata.pendingVersion) return

    await this.updateMetadata({
      previousVersion: metadata.currentVersion,
      currentVersion: metadata.pendingVersion,
      pendingVersion: null,
      pendingUpdateFlag: false,
      crashCount: 0,
      lastCrashTime: null,
    })
  }

  async recordCrash(): Promise<number> {
    const metadata = this.getMetadata()
    const newCount = metadata.crashCount + 1

    await this.updateMetadata({
      crashCount: newCount,
      lastCrashTime: Date.now(),
    })

    return newCount
  }

  async clearCrashCount(): Promise<void> {
    await this.updateMetadata({
      crashCount: 0,
      lastCrashTime: null,
    })
  }

  async rollback(): Promise<void> {
    const metadata = this.getMetadata()
    if (!metadata.previousVersion) return

    await this.updateMetadata({
      currentVersion: metadata.previousVersion,
      previousVersion: null,
      pendingVersion: null,
      pendingUpdateFlag: false,
      crashCount: 0,
      lastCrashTime: null,
    })
  }

  async clearPreviousVersion(): Promise<void> {
    await this.updateMetadata({ previousVersion: null })
  }

  async recordLastCheckTime(): Promise<void> {
    await this.updateMetadata({ lastCheckTime: Date.now() })
  }

  shouldCheckForUpdate(minimumIntervalMs: number): boolean {
    const metadata = this.getMetadata()
    if (!metadata.lastCheckTime) return true
    return Date.now() - metadata.lastCheckTime >= minimumIntervalMs
  }

  async clear(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEY)
    this.metadata = null
  }

  private getDefaultMetadata(): StoredMetadata {
    return {
      deviceId: generateDeviceId(),
      accessToken: null,
      currentVersion: null,
      currentVersionHash: null,
      previousVersion: null,
      pendingVersion: null,
      pendingUpdateFlag: false,
      lastCheckTime: null,
      crashCount: 0,
      lastCrashTime: null,
    }
  }

  private async persist(): Promise<void> {
    if (!this.metadata) return
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(this.metadata))
  }
}
```

### Package.json Update

Add dependency:
```json
{
  "dependencies": {
    "@react-native-async-storage/async-storage": "^1.21.0"
  }
}
```

### Tests Required

```typescript
// Mock AsyncStorage
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  },
}))

// Tests
1. initialize() - creates default metadata on first launch
2. initialize() - loads existing metadata
3. initialize() - resets on corrupted data
4. updateMetadata() - merges updates
5. setAccessToken() - persists token
6. setPendingUpdate() - sets pending state
7. applyPendingUpdate() - moves pending to current
8. recordCrash() - increments crash count
9. rollback() - swaps current with previous
10. shouldCheckForUpdate() - respects interval
```
