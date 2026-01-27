/**
 * Scheduled email processor
 *
 * Processes scheduled emails from the queue and sends them.
 * Called by the cron handler in index.ts.
 *
 * @agent scheduled-emails
 * @created 2026-01-27
 */

import {
  getScheduledEmails,
  markEmailSent,
  markEmailFailed,
  type ScheduledEmail,
} from './scheduled-emails'
import { createEmailService } from './email/service'
import type { Env } from '../types/env'

// =============================================================================
// Constants
// =============================================================================

const BATCH_SIZE = 50

// =============================================================================
// Processor
// =============================================================================

/**
 * Process all due scheduled emails
 *
 * Fetches emails that are due to be sent and processes them one by one.
 * Each email is marked as sent or failed after processing.
 */
export async function processScheduledEmails(env: Env): Promise<void> {
  const emails = await getScheduledEmails(env.DB, BATCH_SIZE)

  if (emails.length === 0) {
    return
  }

  console.log(`Processing ${String(emails.length)} scheduled emails`)

  for (const email of emails) {
    try {
      await sendScheduledEmail(env, email)
      await markEmailSent(env.DB, email.id)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error(`Failed to send scheduled email ${email.id}:`, errorMessage)
      await markEmailFailed(env.DB, email.id, errorMessage)
    }
  }
}

/**
 * Send a single scheduled email based on its template
 */
async function sendScheduledEmail(env: Env, scheduled: ScheduledEmail): Promise<void> {
  const emailService = createEmailService(env)
  const metadata = parseMetadata(scheduled.metadata)

  switch (scheduled.template) {
    case 'follow_up': {
      const userName = typeof metadata.userName === 'string' ? metadata.userName : 'there'
      await emailService.sendFollowUp(scheduled.email, {
        userName,
        dashboardUrl: `${env.DASHBOARD_URL}/dashboard`,
      })
      break
    }

    default:
      throw new Error(`Unknown email template: ${scheduled.template}`)
  }
}

/**
 * Parse JSON metadata from string
 */
function parseMetadata(metadata: string | null): Record<string, unknown> {
  if (!metadata) {
    return {}
  }

  try {
    return JSON.parse(metadata) as Record<string, unknown>
  } catch {
    return {}
  }
}
