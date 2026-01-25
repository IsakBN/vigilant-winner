/**
 * Sentry integration
 */

import type { SentryConfig, CrashReport, IntegrationTestResult } from './types'

const SENTRY_API_BASE = 'https://sentry.io/api/0'
const REQUEST_TIMEOUT_MS = 10000

/**
 * Test Sentry connection
 */
export async function testSentry(config: SentryConfig): Promise<IntegrationTestResult> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => { controller.abort(); }, REQUEST_TIMEOUT_MS)

    const response = await fetch(
      `${SENTRY_API_BASE}/organizations/${config.organization}/`,
      {
        headers: {
          Authorization: `Bearer ${config.authToken}`,
        },
        signal: controller.signal,
      }
    )

    clearTimeout(timeoutId)

    if (!response.ok) {
      return {
        success: false,
        error: `Sentry API returned ${String(response.status)}`,
      }
    }

    return { success: true }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return { success: false, error: 'Request timed out' }
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Create a release in Sentry
 */
export async function createSentryRelease(
  config: SentryConfig,
  version: string
): Promise<boolean> {
  try {
    const response = await fetch(
      `${SENTRY_API_BASE}/organizations/${config.organization}/releases/`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          version,
          projects: [config.project],
        }),
      }
    )

    return response.ok || response.status === 409 // 409 means release already exists
  } catch {
    return false
  }
}

/**
 * Send crash report to Sentry (via store endpoint)
 */
export async function sendCrashToSentry(
  config: SentryConfig,
  crash: CrashReport
): Promise<boolean> {
  try {
    // Parse DSN to get project ID and key
    const dsnMatch = /https:\/\/([^@]+)@[^/]+\/(\d+)/.exec(config.dsn)
    if (!dsnMatch) {
      return false
    }

    const [, publicKey, projectId] = dsnMatch
    const storeUrl = `https://sentry.io/api/${projectId}/store/`

    const event = {
      event_id: crypto.randomUUID().replace(/-/g, ''),
      timestamp: crash.timestamp,
      platform: crash.platform === 'ios' ? 'cocoa' : 'java',
      release: crash.releaseVersion,
      environment: 'production',
      exception: {
        values: [
          {
            type: 'CrashError',
            value: crash.errorMessage,
            stacktrace: crash.stackTrace
              ? { frames: parseStackTrace(crash.stackTrace) }
              : undefined,
          },
        ],
      },
      tags: {
        app_id: crash.appId,
        bundle_version: crash.bundleVersion,
        device_id: crash.deviceId,
      },
      extra: crash.metadata,
    }

    const response = await fetch(storeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Sentry-Auth': `Sentry sentry_version=7, sentry_key=${publicKey}`,
      },
      body: JSON.stringify(event),
    })

    return response.ok
  } catch {
    return false
  }
}

/**
 * Parse stack trace into Sentry frames
 */
function parseStackTrace(stackTrace: string): { filename: string; lineno?: number; function?: string }[] {
  const lines = stackTrace.split('\n')
  return lines
    .filter((line) => line.trim())
    .map((line) => {
      const match = /at\s+(.+?)\s*\((.+?):(\d+)/.exec(line)
      if (match && match[1] && match[2] && match[3]) {
        return {
          function: match[1],
          filename: match[2],
          lineno: parseInt(match[3], 10),
        }
      }
      return { filename: line.trim() }
    })
    .reverse() // Sentry expects frames in reverse order
}
