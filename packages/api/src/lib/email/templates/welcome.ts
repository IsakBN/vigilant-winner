/**
 * Welcome email template for new users
 */

import { baseTemplate } from './base'

export interface WelcomeData {
  userName: string
  dashboardUrl: string
  docsUrl?: string
  supportEmail?: string
}

export function welcomeEmail(data: WelcomeData): { html: string; text: string } {
  const docsUrl = data.docsUrl ?? 'https://docs.bundlenudge.com'
  const supportEmail = data.supportEmail ?? 'support@bundlenudge.com'

  const html = baseTemplate(`
    <h1>Welcome to BundleNudge!</h1>
    <p>Hi ${data.userName},</p>
    <p>
      Thanks for signing up! You're now ready to start deploying OTA updates
      to your React Native apps - no App Store review required.
    </p>

    <h2 style="font-size: 18px; margin-top: 32px;">Get started in 3 steps</h2>
    <ol style="color: #555; padding-left: 20px;">
      <li style="margin-bottom: 12px;">
        <strong>Create your first app</strong> - Add your React Native project to BundleNudge
      </li>
      <li style="margin-bottom: 12px;">
        <strong>Install the SDK</strong> - Add our package to your app with <code>npm install @bundlenudge/sdk</code>
      </li>
      <li style="margin-bottom: 12px;">
        <strong>Push your first update</strong> - Deploy JavaScript changes instantly to your users
      </li>
    </ol>

    <p style="text-align: center; margin-top: 32px;">
      <a href="${data.dashboardUrl}/apps/new" class="button">Create Your First App</a>
    </p>

    <h2 style="font-size: 18px; margin-top: 32px;">Resources</h2>
    <ul style="color: #555; padding-left: 20px;">
      <li style="margin-bottom: 8px;">
        <a href="${docsUrl}/quickstart">Quickstart Guide</a> - Get up and running in 5 minutes
      </li>
      <li style="margin-bottom: 8px;">
        <a href="${docsUrl}/sdk">SDK Documentation</a> - Full API reference
      </li>
      <li style="margin-bottom: 8px;">
        <a href="${data.dashboardUrl}">Your Dashboard</a> - Manage apps and releases
      </li>
    </ul>

    <p style="margin-top: 32px; color: #666;">
      Need help? Reply to this email or reach out at
      <a href="mailto:${supportEmail}">${supportEmail}</a>.
      We're here to help you succeed.
    </p>
  `)

  const text = `
Welcome to BundleNudge!

Hi ${data.userName},

Thanks for signing up! You're now ready to start deploying OTA updates to your React Native apps - no App Store review required.

Get started in 3 steps:

1. Create your first app - Add your React Native project to BundleNudge
2. Install the SDK - Add our package with: npm install @bundlenudge/sdk
3. Push your first update - Deploy JavaScript changes instantly to your users

Get started at: ${data.dashboardUrl}/apps/new

Resources:
- Quickstart Guide: ${docsUrl}/quickstart
- SDK Documentation: ${docsUrl}/sdk
- Your Dashboard: ${data.dashboardUrl}

Need help? Reply to this email or reach out at ${supportEmail}. We're here to help you succeed.
`.trim()

  return { html, text }
}
