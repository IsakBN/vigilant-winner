/**
 * Discord integration
 */

import type { DiscordConfig, CrashReport, DiscordMessage, IntegrationTestResult } from './types'

const REQUEST_TIMEOUT_MS = 10000

/**
 * Test Discord webhook connection
 */
export async function testDiscord(config: DiscordConfig): Promise<IntegrationTestResult> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

    const response = await fetch(config.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: 'Test message from BundleNudge - connection successful!',
      }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      return {
        success: false,
        error: `Discord webhook returned ${String(response.status)}`,
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
 * Send a message to Discord
 */
export async function sendToDiscord(
  config: DiscordConfig,
  message: DiscordMessage
): Promise<boolean> {
  try {
    const payload: Record<string, unknown> = {
      content: message.content,
    }

    if (message.embeds) {
      payload.embeds = message.embeds
    }

    const response = await fetch(config.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    return response.ok
  } catch {
    return false
  }
}

/**
 * Format crash report for Discord
 */
export function formatCrashForDiscord(crash: CrashReport): DiscordMessage {
  const embed = {
    title: `Crash in ${crash.appName}`,
    color: 0xff0000, // Red
    fields: [
      {
        name: 'Platform',
        value: crash.platform,
        inline: true,
      },
      {
        name: 'Version',
        value: crash.releaseVersion,
        inline: true,
      },
      {
        name: 'Bundle',
        value: crash.bundleVersion,
        inline: true,
      },
      {
        name: 'Error',
        value: `\`\`\`${crash.errorMessage.slice(0, 1000)}\`\`\``,
        inline: false,
      },
    ],
    timestamp: crash.timestamp,
    footer: {
      text: `Device: ${crash.deviceId}`,
    },
  }

  if (crash.stackTrace) {
    embed.fields.push({
      name: 'Stack Trace',
      value: `\`\`\`${crash.stackTrace.slice(0, 1000)}${crash.stackTrace.length > 1000 ? '...' : ''}\`\`\``,
      inline: false,
    })
  }

  return {
    content: `Crash detected in ${crash.appName}`,
    embeds: [embed],
  }
}
