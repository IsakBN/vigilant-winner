/**
 * Team invitation email template
 */

import { baseTemplate } from './base'

export interface TeamInviteData {
  teamName: string
  inviterName: string
  inviterEmail: string
  otp: string
  isNewUser: boolean
  dashboardUrl: string
}

export function teamInviteEmail(data: TeamInviteData): { html: string; text: string } {
  const actionText = data.isNewUser
    ? 'Create your account to join the team'
    : 'Accept this invitation to join the team'

  const buttonText = data.isNewUser ? 'Create Account' : 'Join Team'
  const encodedTeam = encodeURIComponent(data.teamName)

  const html = baseTemplate(`
    <h1>You've been invited to ${data.teamName}</h1>
    <p>${data.inviterName} (${data.inviterEmail}) has invited you to join their team on BundleNudge.</p>
    <p>${actionText}. Your invitation code:</p>
    <div class="otp-code">${data.otp}</div>
    <p>This invitation expires in 30 minutes.</p>
    <p style="text-align: center; margin-top: 24px;">
      <a href="${data.dashboardUrl}/join?team=${encodedTeam}" class="button">${buttonText}</a>
    </p>
  `)

  const text = `
You've been invited to ${data.teamName}

${data.inviterName} (${data.inviterEmail}) has invited you to join their team on BundleNudge.

Your invitation code: ${data.otp}

${actionText} at: ${data.dashboardUrl}/join

This invitation expires in 30 minutes.
`.trim()

  return { html, text }
}
