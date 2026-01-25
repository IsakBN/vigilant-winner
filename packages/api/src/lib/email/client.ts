/**
 * Email client using Resend API
 *
 * Uses direct fetch instead of Resend SDK for Cloudflare Workers compatibility.
 */

import type { Env } from '../../types/env'

// =============================================================================
// Types
// =============================================================================

export interface EmailOptions {
  to: string | string[]
  subject: string
  html: string
  text?: string
  replyTo?: string
}

export interface EmailResult {
  success: boolean
  id?: string
  error?: string
}

// =============================================================================
// Constants
// =============================================================================

const RESEND_API_URL = 'https://api.resend.com/emails'
const DEFAULT_FROM = 'BundleNudge <noreply@bundlenudge.com>'

// =============================================================================
// Client
// =============================================================================

/**
 * Send an email via Resend API
 */
export async function sendEmail(env: Env, options: EmailOptions): Promise<EmailResult> {
  try {
    const toAddresses = Array.isArray(options.to) ? options.to : [options.to]

    const body: Record<string, unknown> = {
      from: DEFAULT_FROM,
      to: toAddresses,
      subject: options.subject,
      html: options.html,
    }

    if (options.text) {
      body.text = options.text
    }

    if (options.replyTo) {
      body.reply_to = options.replyTo
    }

    const response = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorData = (await response.json().catch(() => ({}))) as { message?: string }
      return {
        success: false,
        error: errorData.message ?? `HTTP ${String(response.status)}`,
      }
    }

    const data = (await response.json())
    return { success: true, id: data.id }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
