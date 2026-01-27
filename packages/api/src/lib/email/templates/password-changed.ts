/**
 * Password changed notification email template
 */

import { baseTemplate } from './base'

export function passwordChangedEmail(): { html: string; text: string } {
  const html = baseTemplate(`
    <h1>Your password has been changed</h1>
    <p>This is a confirmation that the password for your BundleNudge account has been successfully changed.</p>
    <p>If you made this change, you can safely ignore this email.</p>
    <p class="warning">
      If you did not change your password, please contact support immediately and secure your account.
    </p>
    <p style="margin-top: 24px;">
      <strong>What to do if you didn't make this change:</strong>
    </p>
    <ol style="color: #555;">
      <li>Reset your password immediately</li>
      <li>Review your account activity</li>
      <li>Enable two-factor authentication if not already enabled</li>
    </ol>
  `)

  const text = `
Your BundleNudge password has been changed

This is a confirmation that the password for your BundleNudge account has been successfully changed.

If you made this change, you can safely ignore this email.

SECURITY WARNING: If you did not change your password, please contact support immediately and secure your account.

What to do if you didn't make this change:
1. Reset your password immediately
2. Review your account activity
3. Enable two-factor authentication if not already enabled
`.trim()

  return { html, text }
}
