/**
 * Welcome email template for new users
 */

import { baseTemplate } from './base'

export interface WelcomeData {
  userName: string
  dashboardUrl: string
}

export function welcomeEmail(data: WelcomeData): { html: string; text: string } {
  const html = baseTemplate(`
    <h1>Welcome to BundleNudge, ${data.userName}!</h1>
    <p>Thanks for signing up! You're now ready to start deploying OTA updates to your React Native apps.</p>

    <h2 style="font-size: 18px; margin-top: 24px;">Get Started</h2>
    <ol style="color: #555;">
      <li>Create your first app in the dashboard</li>
      <li>Install the SDK in your React Native project</li>
      <li>Deploy your first update</li>
    </ol>

    <p style="text-align: center; margin-top: 24px;">
      <a href="${data.dashboardUrl}/apps/new" class="button">Create Your First App</a>
    </p>

    <p style="margin-top: 24px;">Need help? Check out our <a href="https://docs.bundlenudge.com">documentation</a> or reach out to support.</p>
  `)

  const text = `
Welcome to BundleNudge, ${data.userName}!

Thanks for signing up! You're now ready to start deploying OTA updates to your React Native apps.

Get Started:
1. Create your first app in the dashboard
2. Install the SDK in your React Native project
3. Deploy your first update

Get started at: ${data.dashboardUrl}/apps/new

Need help? Check out our documentation at https://docs.bundlenudge.com
`.trim()

  return { html, text }
}
