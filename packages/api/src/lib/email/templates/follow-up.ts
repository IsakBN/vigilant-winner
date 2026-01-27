/**
 * Follow-up email template sent 1 week after signup
 */

import { baseTemplate } from './base'

export interface FollowUpData {
  userName: string
  dashboardUrl: string
  surveyUrl?: string
  supportEmail?: string
}

export function followUpEmail(data: FollowUpData): { html: string; text: string } {
  const supportEmail = data.supportEmail ?? 'support@bundlenudge.com'

  const surveySection = data.surveyUrl
    ? `
    <p style="margin-top: 24px;">
      <a href="${data.surveyUrl}" style="color: #FF6B35;">Take a 2-minute survey</a> (optional)
    </p>`
    : ''

  const surveyTextSection = data.surveyUrl
    ? `\nOptionally, take a quick 2-minute survey: ${data.surveyUrl}\n`
    : ''

  const html = baseTemplate(`
    <h1>How's it going with BundleNudge?</h1>
    <p>Hi ${data.userName},</p>
    <p>
      You've been with us for about a week now, and we'd love to hear how things are going.
    </p>
    <p style="background: #FFF7ED; border-left: 4px solid #FF6B35; padding: 16px; margin: 24px 0;">
      <em>This is an automated email, but we personally read and respond to every reply.</em>
    </p>
    <p>
      We'd really appreciate your feedback - good or bad. What's working well? What could be better?
      Just hit reply and let us know.
    </p>

    <h2 style="font-size: 18px; margin-top: 32px;">Features you might not have tried yet</h2>
    <ul style="color: #555; padding-left: 20px;">
      <li style="margin-bottom: 8px;">
        <strong>Staged Rollouts</strong> - Release to 10% of users first, then expand
      </li>
      <li style="margin-bottom: 8px;">
        <strong>Automatic Rollbacks</strong> - Auto-revert if crash rate spikes
      </li>
      <li style="margin-bottom: 8px;">
        <strong>Release Channels</strong> - Separate beta and production tracks
      </li>
    </ul>

    <p style="text-align: center; margin-top: 32px;">
      <a href="${data.dashboardUrl}" class="button">Open Dashboard</a>
    </p>
    ${surveySection}

    <p style="margin-top: 32px; color: #666;">
      Questions? Just reply to this email. We're here to help.
    </p>
    <p style="color: #666;">
      - The BundleNudge Team
    </p>
  `)

  const text = `
How's it going with BundleNudge?

Hi ${data.userName},

You've been with us for about a week now, and we'd love to hear how things are going.

This is an automated email, but we personally read and respond to every reply.

We'd really appreciate your feedback - good or bad. What's working well? What could be better? Just hit reply and let us know.

Features you might not have tried yet:
- Staged Rollouts - Release to 10% of users first, then expand
- Automatic Rollbacks - Auto-revert if crash rate spikes
- Release Channels - Separate beta and production tracks

Open your dashboard: ${data.dashboardUrl}
${surveyTextSection}
Questions? Just reply to this email or reach out at ${supportEmail}. We're here to help.

- The BundleNudge Team
`.trim()

  return { html, text }
}
