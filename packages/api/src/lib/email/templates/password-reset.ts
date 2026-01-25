/**
 * Password reset email template
 */

import { baseTemplate } from './base'

export function passwordResetEmail(resetUrl: string): { html: string; text: string } {
  const html = baseTemplate(`
    <h1>Reset your password</h1>
    <p>Click the button below to reset your password:</p>
    <p style="text-align: center; margin: 24px 0;">
      <a href="${resetUrl}" class="button">Reset Password</a>
    </p>
    <p>Or copy this link: <a href="${resetUrl}">${resetUrl}</a></p>
    <p>This link expires in 1 hour.</p>
    <p>If you didn't request a password reset, you can safely ignore this email.</p>
  `)

  const text = `
Reset your BundleNudge password

Click here to reset your password: ${resetUrl}

This link expires in 1 hour.

If you didn't request a password reset, you can safely ignore this email.
`.trim()

  return { html, text }
}
