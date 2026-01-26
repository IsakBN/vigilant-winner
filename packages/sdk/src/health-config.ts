/**
 * Health Config Fetcher
 *
 * Fetches health configuration (critical events and endpoints)
 * from the API during SDK initialization.
 *
 * Fail-safe design: never throws, returns default config on error.
 */

// =============================================================================
// Types
// =============================================================================

export interface CriticalEvent {
  name: string
  required: boolean
  timeoutMs: number
}

export interface CriticalEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  url: string
  expectedStatus: number[]
  required: boolean
}

export interface HealthConfig {
  events: CriticalEvent[]
  endpoints: CriticalEndpoint[]
}

export interface HealthConfigFetcherConfig {
  apiUrl: string
  appId: string
  getAccessToken: () => string | null
}

// =============================================================================
// Constants
// =============================================================================

/** Default empty config returned on fetch failure (fail-safe) */
export const DEFAULT_HEALTH_CONFIG: HealthConfig = {
  events: [],
  endpoints: [],
}

/** Timeout for config fetch in milliseconds */
export const CONFIG_FETCH_TIMEOUT_MS = 10_000

// =============================================================================
// Health Config Fetcher
// =============================================================================

export class HealthConfigFetcher {
  private config: HealthConfigFetcherConfig

  constructor(config: HealthConfigFetcherConfig) {
    this.config = config
  }

  /**
   * Fetch health config from API.
   * Returns default empty config on error (fail-safe).
   * Never throws - health config fetch failure should not break the app.
   */
  async fetchConfig(): Promise<HealthConfig> {
    try {
      const response = await this.makeRequest()
      return await this.parseResponse(response)
    } catch {
      // Fail-safe: return default config on any error
      return DEFAULT_HEALTH_CONFIG
    }
  }

  private async makeRequest(): Promise<Response> {
    const accessToken = this.config.getAccessToken()
    const url = `${this.config.apiUrl}/v1/apps/${this.config.appId}/health-config`

    const controller = new AbortController()
    const timeoutId = setTimeout(() => {
      controller.abort()
    }, CONFIG_FETCH_TIMEOUT_MS)

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
        },
        signal: controller.signal,
      })

      return response
    } finally {
      clearTimeout(timeoutId)
    }
  }

  private parseResponse(response: Response): Promise<HealthConfig> {
    if (!response.ok) {
      // Non-2xx status - return default config
      return Promise.resolve(DEFAULT_HEALTH_CONFIG)
    }

    return response.json().then((data: unknown) => {
      if (!this.isValidHealthConfig(data)) {
        return DEFAULT_HEALTH_CONFIG
      }
      return data
    }).catch(() => {
      // JSON parse error - return default config
      return DEFAULT_HEALTH_CONFIG
    })
  }

  private isValidHealthConfig(data: unknown): data is HealthConfig {
    if (typeof data !== 'object' || data === null) {
      return false
    }

    const config = data as Record<string, unknown>

    if (!Array.isArray(config.events) || !Array.isArray(config.endpoints)) {
      return false
    }

    // Validate events
    for (const event of config.events) {
      if (!this.isValidCriticalEvent(event)) {
        return false
      }
    }

    // Validate endpoints
    for (const endpoint of config.endpoints) {
      if (!this.isValidCriticalEndpoint(endpoint)) {
        return false
      }
    }

    return true
  }

  private isValidCriticalEvent(event: unknown): event is CriticalEvent {
    if (typeof event !== 'object' || event === null) {
      return false
    }

    const e = event as Record<string, unknown>

    return (
      typeof e.name === 'string' &&
      typeof e.required === 'boolean' &&
      typeof e.timeoutMs === 'number'
    )
  }

  private isValidCriticalEndpoint(endpoint: unknown): endpoint is CriticalEndpoint {
    if (typeof endpoint !== 'object' || endpoint === null) {
      return false
    }

    const e = endpoint as Record<string, unknown>

    const validMethods = ['GET', 'POST', 'PUT', 'DELETE']

    return (
      typeof e.method === 'string' &&
      validMethods.includes(e.method) &&
      typeof e.url === 'string' &&
      Array.isArray(e.expectedStatus) &&
      e.expectedStatus.every((s: unknown) => typeof s === 'number') &&
      typeof e.required === 'boolean'
    )
  }
}

// =============================================================================
// Factory Function
// =============================================================================

export function createHealthConfigFetcher(
  config: HealthConfigFetcherConfig
): HealthConfigFetcher {
  return new HealthConfigFetcher(config)
}
