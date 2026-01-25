## Feature: sdk/device-auth

Implement device registration and token management in SDK.

### Files to Modify/Create

`packages/sdk/src/auth.ts` - Device authentication
`packages/sdk/src/auth.test.ts` - Tests

### Implementation

```typescript
// auth.ts
import type { Storage } from './storage'
import type { BundleNudgeConfig } from './types'
import { retry } from './utils'

export interface DeviceAuthConfig {
  storage: Storage
  config: BundleNudgeConfig
}

export class DeviceAuth {
  private storage: Storage
  private config: BundleNudgeConfig

  constructor({ storage, config }: DeviceAuthConfig) {
    this.storage = storage
    this.config = config
  }

  /**
   * Check if device is registered (has valid token).
   */
  isRegistered(): boolean {
    return this.storage.getAccessToken() !== null
  }

  /**
   * Get the current access token.
   */
  getToken(): string | null {
    return this.storage.getAccessToken()
  }

  /**
   * Get headers for authenticated API requests.
   */
  getAuthHeaders(): Record<string, string> {
    const token = this.storage.getAccessToken()
    if (!token) return {}
    return { Authorization: `Bearer ${token}` }
  }

  /**
   * Register device with server.
   * Called on first launch or if token is invalid.
   */
  async register(): Promise<void> {
    const apiUrl = this.config.apiUrl || 'https://api.bundlenudge.com'

    const response = await retry(async () => {
      const res = await fetch(`${apiUrl}/v1/devices/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appId: this.config.appId,
          deviceId: this.storage.getDeviceId(),
          platform: await this.getPlatform(),
          appVersion: await this.getAppVersion(),
        }),
      })

      if (!res.ok) {
        throw new Error(`Registration failed: ${res.status}`)
      }

      return res
    })

    const data = await response.json()
    await this.storage.setAccessToken(data.accessToken)
  }

  /**
   * Refresh token before expiry.
   */
  async refreshToken(): Promise<void> {
    const currentToken = this.storage.getAccessToken()
    if (!currentToken) {
      throw new Error('No token to refresh')
    }

    const apiUrl = this.config.apiUrl || 'https://api.bundlenudge.com'

    const response = await retry(async () => {
      const res = await fetch(`${apiUrl}/v1/devices/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${currentToken}`,
        },
      })

      if (res.status === 401) {
        // Token expired or invalid - re-register
        await this.register()
        return null
      }

      if (!res.ok) {
        throw new Error(`Refresh failed: ${res.status}`)
      }

      return res
    })

    if (response) {
      const data = await response.json()
      await this.storage.setAccessToken(data.accessToken)
    }
  }

  /**
   * Make an authenticated API request.
   * Handles token refresh on 401.
   */
  async authenticatedFetch(
    url: string,
    options: RequestInit = {}
  ): Promise<Response> {
    const headers = {
      ...options.headers,
      ...this.getAuthHeaders(),
    }

    const response = await fetch(url, { ...options, headers })

    if (response.status === 401) {
      // Try refresh and retry
      await this.refreshToken()
      const newHeaders = {
        ...options.headers,
        ...this.getAuthHeaders(),
      }
      return fetch(url, { ...options, headers: newHeaders })
    }

    return response
  }

  private async getPlatform(): Promise<'ios' | 'android'> {
    // TODO: Use Platform from react-native
    return 'ios'
  }

  private async getAppVersion(): Promise<string> {
    // TODO: Get from native module
    return '1.0.0'
  }
}
```

### Integration with BundleNudge

```typescript
// In bundlenudge.ts
import { DeviceAuth } from './auth'

class BundleNudge {
  private auth: DeviceAuth

  constructor(config, callbacks) {
    this.storage = new Storage()
    this.auth = new DeviceAuth({ storage: this.storage, config })
    // ...
  }

  private async init() {
    await this.storage.initialize()

    if (!this.auth.isRegistered()) {
      await this.auth.register()
    }
    // ...
  }
}
```

### Tests Required

1. **Registration**
   - Calls /v1/devices/register
   - Stores token in storage
   - Retries on failure

2. **Token refresh**
   - Calls /v1/devices/refresh
   - Updates stored token
   - Falls back to register on 401

3. **Authenticated fetch**
   - Adds auth header
   - Refreshes token on 401
   - Retries with new token
