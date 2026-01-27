/**
 * Upgrade confirmation email template
 */

import { baseTemplate } from './base'

export interface UpgradeConfirmationData {
  userName: string
  planName: string
  features: string[]
  billingPortalUrl: string
  dashboardUrl: string
  supportEmail?: string
}

export function upgradeConfirmationEmail(
  data: UpgradeConfirmationData
): { html: string; text: string } {
  const supportEmail = data.supportEmail ?? 'support@bundlenudge.com'

  const featuresHtml = data.features
    .map((feature) => `<li style="margin-bottom: 8px;">${feature}</li>`)
    .join('\n')

  const featuresText = data.features.map((feature) => `- ${feature}`).join('\n')

  const html = baseTemplate(`
    <h1>You're now on BundleNudge ${data.planName}!</h1>
    <p>Hi ${data.userName},</p>
    <p>
      Thank you for upgrading! Your new plan is now active and you have access
      to all the features included with ${data.planName}.
    </p>

    <h2 style="font-size: 18px; margin-top: 32px;">What's included in your plan</h2>
    <ul style="color: #555; padding-left: 20px;">
      ${featuresHtml}
    </ul>

    <p style="text-align: center; margin-top: 32px;">
      <a href="${data.dashboardUrl}" class="button">Go to Dashboard</a>
    </p>

    <h2 style="font-size: 18px; margin-top: 32px;">Billing</h2>
    <p>
      You can manage your subscription, view invoices, and update payment methods
      in the <a href="${data.billingPortalUrl}">billing portal</a>.
    </p>

    <p style="margin-top: 32px; color: #666;">
      Questions about your plan? Reach out at
      <a href="mailto:${supportEmail}">${supportEmail}</a>.
    </p>
  `)

  const text = `
You're now on BundleNudge ${data.planName}!

Hi ${data.userName},

Thank you for upgrading! Your new plan is now active and you have access to all the features included with ${data.planName}.

What's included in your plan:
${featuresText}

Go to your dashboard: ${data.dashboardUrl}

Billing:
You can manage your subscription, view invoices, and update payment methods in the billing portal: ${data.billingPortalUrl}

Questions about your plan? Reach out at ${supportEmail}.
`.trim()

  return { html, text }
}
