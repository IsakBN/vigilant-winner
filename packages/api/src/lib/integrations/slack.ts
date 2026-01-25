/**
 * Slack integration
 */

import type { SlackConfig, CrashReport, SlackMessage, IntegrationTestResult } from './types'

const REQUEST_TIMEOUT_MS = 10000

/**
 * Test Slack webhook connection
 */
export async function testSlack(config: SlackConfig): Promise<IntegrationTestResult> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => { controller.abort(); }, REQUEST_TIMEOUT_MS)

    const response = await fetch(config.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: 'Test message from BundleNudge - connection successful!',
      }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      return {
        success: false,
        error: `Slack webhook returned ${String(response.status)}`,
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
 * Send a message to Slack
 */
export async function sendToSlack(
  config: SlackConfig,
  message: SlackMessage
): Promise<boolean> {
  try {
    const payload: Record<string, unknown> = {
      text: message.text,
    }

    if (message.blocks) {
      payload.blocks = message.blocks
    }

    if (config.channel) {
      payload.channel = config.channel
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
 * Format crash report for Slack
 */
export function formatCrashForSlack(crash: CrashReport): SlackMessage {
  return {
    text: `Crash detected in ${crash.appName}`,
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `Crash in ${crash.appName}`,
        },
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Platform:*\n${crash.platform}`,
          },
          {
            type: 'mrkdwn',
            text: `*Version:*\n${crash.releaseVersion}`,
          },
          {
            type: 'mrkdwn',
            text: `*Bundle:*\n${crash.bundleVersion}`,
          },
          {
            type: 'mrkdwn',
            text: `*Time:*\n${crash.timestamp}`,
          },
        ],
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Error:*\n\`\`\`${crash.errorMessage}\`\`\``,
        },
      },
      ...(crash.stackTrace
        ? [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `*Stack Trace:*\n\`\`\`${crash.stackTrace.slice(0, 1000)}${crash.stackTrace.length > 1000 ? '...' : ''}\`\`\``,
              },
            },
          ]
        : []),
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `Device: ${crash.deviceId} | App: ${crash.appId}`,
          },
        ],
      },
    ],
  }
}
