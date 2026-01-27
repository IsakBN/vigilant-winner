/**
 * Team invitation email for users who don't have a BundleNudge account yet
 */

import { baseTemplate } from './base'

export interface TeamInviteNewData {
  inviterName: string
  inviterEmail: string
  teamName: string
  role: 'admin' | 'member'
  scope: 'full' | 'projects'
  projectNames?: string[]
  otp: string
  signUpUrl: string
}

export function teamInviteNewEmail(data: TeamInviteNewData): { html: string; text: string } {
  const roleDisplay = data.role === 'admin' ? 'Admin' : 'Member'

  const scopeHtml =
    data.scope === 'full'
      ? '<strong>Full access</strong> to all projects'
      : data.projectNames && data.projectNames.length > 0
        ? `Access to: <strong>${data.projectNames.join(', ')}</strong>`
        : 'Limited project access'

  const scopeText =
    data.scope === 'full'
      ? 'Full access to all projects'
      : data.projectNames && data.projectNames.length > 0
        ? `Access to: ${data.projectNames.join(', ')}`
        : 'Limited project access'

  const encodedTeam = encodeURIComponent(data.teamName)

  const html = baseTemplate(`
    <h1>${data.inviterName} invited you to BundleNudge</h1>
    <p>
      <strong>${data.inviterName}</strong> (${data.inviterEmail}) has invited you
      to join their team on BundleNudge.
    </p>

    <p style="color: #555;">
      BundleNudge lets you push JavaScript updates to React Native apps instantly -
      no App Store review required.
    </p>

    <div style="background: #F9FAFB; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #6B7280;">Team</td>
          <td style="padding: 8px 0; text-align: right; font-weight: 500;">${data.teamName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6B7280;">Role</td>
          <td style="padding: 8px 0; text-align: right; font-weight: 500;">${roleDisplay}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6B7280;">Access</td>
          <td style="padding: 8px 0; text-align: right;">${scopeHtml}</td>
        </tr>
      </table>
    </div>

    <h2 style="font-size: 18px; margin-top: 32px;">How to join</h2>
    <ol style="color: #555; padding-left: 20px;">
      <li style="margin-bottom: 12px;">
        <strong>Create your account</strong> - Sign up for BundleNudge (it's free)
      </li>
      <li style="margin-bottom: 12px;">
        <strong>Enter the invitation code</strong> - Use the code below when prompted
      </li>
    </ol>

    <p style="margin-top: 24px;">Your invitation code:</p>
    <div class="otp-code">${data.otp}</div>

    <p class="warning" style="text-align: center;">
      This code expires in 1 hour.
    </p>

    <p style="text-align: center; margin-top: 24px;">
      <a href="${data.signUpUrl}?invite=${encodedTeam}" class="button">Sign Up & Join Team</a>
    </p>

    <p style="margin-top: 32px; color: #666; font-size: 14px;">
      If you don't want to join this team, you can safely ignore this email.
    </p>
  `)

  const text = `
${data.inviterName} invited you to BundleNudge

${data.inviterName} (${data.inviterEmail}) has invited you to join their team on BundleNudge.

BundleNudge lets you push JavaScript updates to React Native apps instantly - no App Store review required.

Team: ${data.teamName}
Role: ${roleDisplay}
Access: ${scopeText}

How to join:
1. Create your account - Sign up for BundleNudge (it's free)
2. Enter the invitation code - Use the code below when prompted

Your invitation code: ${data.otp}

This code expires in 1 hour.

Sign up and join the team: ${data.signUpUrl}?invite=${encodedTeam}

If you don't want to join this team, you can safely ignore this email.
`.trim()

  return { html, text }
}
