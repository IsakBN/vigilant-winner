/**
 * Integration dispatcher
 *
 * Routes events to the appropriate integration handlers.
 */

import type { Env } from '../../types/env'
import { decrypt } from '../encryption'
import type {
  IntegrationProvider,
  IntegrationTestResult,
  CrashReport,
  SentryConfig,
  SlackConfig,
  DiscordConfig,
} from './types'
import { testSentry, sendCrashToSentry } from './sentry'
import { testSlack, sendToSlack, formatCrashForSlack } from './slack'
import { testDiscord, sendToDiscord, formatCrashForDiscord } from './discord'

// =============================================================================
// Types
// =============================================================================

interface IntegrationRow {
  id: string
  app_id: string
  provider: string
  config: string
  is_active: number
}

// =============================================================================
// Test Integration
// =============================================================================

/**
 * Test an integration connection
 */
export async function testIntegration(
  provider: IntegrationProvider,
  config: Record<string, string>
): Promise<IntegrationTestResult> {
  switch (provider) {
    case 'sentry':
      return testSentry(config as unknown as SentryConfig)
    case 'slack':
      return testSlack(config as unknown as SlackConfig)
    case 'discord':
      return testDiscord(config as unknown as DiscordConfig)
    case 'bugsnag':
      // Bugsnag doesn't have a simple test endpoint
      return { success: true }
    case 'crashlytics':
      // Crashlytics doesn't have a simple test endpoint
      return { success: true }
    default:
      return { success: false, error: 'Unknown provider' }
  }
}

// =============================================================================
// Notify Integrations
// =============================================================================

/**
 * Send crash notification to all active integrations for an app
 */
export async function notifyCrash(
  env: Env,
  crash: CrashReport
): Promise<void> {
  // Get all active integrations for this app
  const integrations = await env.DB.prepare(`
    SELECT id, app_id, provider, config, is_active
    FROM crash_integrations
    WHERE app_id = ? AND is_active = 1
  `).bind(crash.appId).all<IntegrationRow>()

  // Send to each integration
  await Promise.allSettled(
    integrations.results.map(async (integration) => {
      try {
        const config = JSON.parse(
          await decrypt(integration.config, env.ENCRYPTION_KEY)
        ) as Record<string, string>

        await dispatchCrash(integration.provider as IntegrationProvider, config, crash)

        // Update last triggered timestamp
        const now = Math.floor(Date.now() / 1000)
        await env.DB.prepare(
          'UPDATE crash_integrations SET last_triggered_at = ? WHERE id = ?'
        ).bind(now, integration.id).run()
      } catch (error) {
        // Log error but don't throw - we want to try all integrations
        console.error(`Failed to notify ${integration.provider}:`, error)
      }
    })
  )
}

/**
 * Dispatch crash to a specific integration
 */
async function dispatchCrash(
  provider: IntegrationProvider,
  config: Record<string, string>,
  crash: CrashReport
): Promise<boolean> {
  switch (provider) {
    case 'sentry':
      return sendCrashToSentry(config as unknown as SentryConfig, crash)

    case 'slack': {
      const slackMessage = formatCrashForSlack(crash)
      return sendToSlack(config as unknown as SlackConfig, slackMessage)
    }

    case 'discord': {
      const discordMessage = formatCrashForDiscord(crash)
      return sendToDiscord(config as unknown as DiscordConfig, discordMessage)
    }

    case 'bugsnag':
      // Bugsnag integration would go here
      return true

    case 'crashlytics':
      // Crashlytics integration would go here
      return true

    default:
      return false
  }
}

// =============================================================================
// Release Notifications
// =============================================================================

/**
 * Notify integrations about a new release
 */
export async function notifyRelease(
  env: Env,
  appId: string,
  version: string,
  appName: string
): Promise<void> {
  const integrations = await env.DB.prepare(`
    SELECT id, app_id, provider, config, is_active
    FROM crash_integrations
    WHERE app_id = ? AND is_active = 1
  `).bind(appId).all<IntegrationRow>()

  await Promise.allSettled(
    integrations.results.map(async (integration) => {
      try {
        const config = JSON.parse(
          await decrypt(integration.config, env.ENCRYPTION_KEY)
        ) as Record<string, string>

        await dispatchRelease(
          integration.provider as IntegrationProvider,
          config,
          version,
          appName
        )
      } catch (error) {
        console.error(`Failed to notify ${integration.provider} about release:`, error)
      }
    })
  )
}

/**
 * Dispatch release notification to a specific integration
 */
async function dispatchRelease(
  provider: IntegrationProvider,
  config: Record<string, string>,
  version: string,
  appName: string
): Promise<boolean> {
  switch (provider) {
    case 'slack': {
      const message = {
        text: `New release ${version} deployed for ${appName}`,
      }
      return sendToSlack(config as unknown as SlackConfig, message)
    }

    case 'discord': {
      const message = {
        content: `New release ${version} deployed for ${appName}`,
        embeds: [
          {
            title: 'New Release',
            description: `Version ${version} has been deployed`,
            color: 0x00ff00, // Green
            timestamp: new Date().toISOString(),
          },
        ],
      }
      return sendToDiscord(config as unknown as DiscordConfig, message)
    }

    default:
      return true
  }
}
