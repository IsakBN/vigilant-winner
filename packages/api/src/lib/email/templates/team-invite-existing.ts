/**
 * Team invitation email for existing BundleNudge users
 */

import { baseTemplate } from './base'

export interface TeamInviteExistingData {
  inviterName: string
  inviterEmail: string
  teamName: string
  role: 'admin' | 'member'
  scope: 'full' | 'projects'
  projectNames?: string[]
  otp: string
  dashboardUrl: string
}

export function teamInviteExistingEmail(
  data: TeamInviteExistingData
): { html: string; text: string } {
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
    <h1>You've been invited to join ${data.teamName}</h1>
    <p>
      <strong>${data.inviterName}</strong> (${data.inviterEmail}) has invited you
      to join their team on BundleNudge.
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

    <p>Enter this code to accept the invitation:</p>
    <div class="otp-code">${data.otp}</div>

    <p class="warning" style="text-align: center;">
      This code expires in 1 hour.
    </p>

    <p style="text-align: center; margin-top: 24px;">
      <a href="${data.dashboardUrl}/join?team=${encodedTeam}" class="button">Accept Invitation</a>
    </p>

    <p style="margin-top: 32px; color: #666; font-size: 14px;">
      If you don't want to join this team, you can safely ignore this email.
    </p>
  `)

  const text = `
You've been invited to join ${data.teamName} on BundleNudge

${data.inviterName} (${data.inviterEmail}) has invited you to join their team.

Team: ${data.teamName}
Role: ${roleDisplay}
Access: ${scopeText}

Your invitation code: ${data.otp}

This code expires in 1 hour.

Accept the invitation at: ${data.dashboardUrl}/join?team=${encodedTeam}

If you don't want to join this team, you can safely ignore this email.
`.trim()

  return { html, text }
}
