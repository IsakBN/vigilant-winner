/**
 * Downgrade confirmation email template
 */

import { baseTemplate } from './base'

export interface DowngradeConfirmationData {
  userName: string
  oldPlanName: string
  newPlanName: string
  retainedFeatures: string[]
  lostFeatures?: string[]
  effectiveDate?: string
  billingPortalUrl: string
  dashboardUrl: string
  supportEmail?: string
}

export function downgradeConfirmationEmail(
  data: DowngradeConfirmationData
): { html: string; text: string } {
  const supportEmail = data.supportEmail ?? 'support@bundlenudge.com'

  const retainedHtml = data.retainedFeatures
    .map((feature) => `<li style="margin-bottom: 8px;">${feature}</li>`)
    .join('\n')

  const retainedText = data.retainedFeatures.map((f) => `- ${f}`).join('\n')

  const lostSection =
    data.lostFeatures && data.lostFeatures.length > 0
      ? `
    <h2 style="font-size: 18px; margin-top: 32px; color: #DC2626;">Features no longer available</h2>
    <ul style="color: #555; padding-left: 20px;">
      ${data.lostFeatures.map((f) => `<li style="margin-bottom: 8px;">${f}</li>`).join('\n')}
    </ul>
    `
      : ''

  const lostText =
    data.lostFeatures && data.lostFeatures.length > 0
      ? `\nFeatures no longer available:\n${data.lostFeatures.map((f) => `- ${f}`).join('\n')}\n`
      : ''

  const effectiveDateSection = data.effectiveDate
    ? `<p style="color: #666;">This change takes effect on ${data.effectiveDate}.</p>`
    : ''

  const effectiveDateText = data.effectiveDate
    ? `\nThis change takes effect on ${data.effectiveDate}.`
    : ''

  const html = baseTemplate(`
    <h1>Your BundleNudge plan has been updated</h1>
    <p>Hi ${data.userName},</p>
    <p>
      Your plan has been changed from <strong>${data.oldPlanName}</strong> to
      <strong>${data.newPlanName}</strong>.
    </p>
    ${effectiveDateSection}

    <h2 style="font-size: 18px; margin-top: 32px;">What you still have access to</h2>
    <ul style="color: #555; padding-left: 20px;">
      ${retainedHtml}
    </ul>
    ${lostSection}

    <p style="background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 16px; margin: 24px 0;">
      Have concerns about this change? We'd love to chat and understand how we can
      better serve your needs. Just reply to this email.
    </p>

    <p style="text-align: center; margin-top: 32px;">
      <a href="${data.dashboardUrl}" class="button">Go to Dashboard</a>
    </p>

    <p style="margin-top: 24px; text-align: center;">
      <a href="${data.billingPortalUrl}" style="color: #FF6B35;">
        Upgrade again
      </a>
      if you change your mind
    </p>

    <p style="margin-top: 32px; color: #666;">
      Questions? Reach out at <a href="mailto:${supportEmail}">${supportEmail}</a>.
    </p>
  `)

  const text = `
Your BundleNudge plan has been updated

Hi ${data.userName},

Your plan has been changed from ${data.oldPlanName} to ${data.newPlanName}.
${effectiveDateText}

What you still have access to:
${retainedText}
${lostText}
Have concerns about this change? We'd love to chat and understand how we can better serve your needs. Just reply to this email.

Go to your dashboard: ${data.dashboardUrl}

Upgrade again if you change your mind: ${data.billingPortalUrl}

Questions? Reach out at ${supportEmail}.
`.trim()

  return { html, text }
}
