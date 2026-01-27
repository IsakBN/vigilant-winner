/**
 * Email verification utilities
 *
 * Sends email verification links using Resend
 *
 * @agent email-password-auth
 * @created 2026-01-26
 */

import { sendEmail } from './email'
import type { Env } from '../types/env'

/**
 * Send email verification link
 */
export async function sendVerificationEmail(
  email: string,
  token: string,
  env: Env
): Promise<void> {
  const verifyUrl = `${env.APP_URL}/verify-email?token=${token}`
  const html = generateVerificationEmailHtml(verifyUrl)

  const result = await sendEmail({
    to: email,
    subject: 'Verify your BundleNudge email',
    html,
    env,
  })

  if (!result.success) {
    throw new Error(`Failed to send verification email: ${result.error ?? 'Unknown error'}`)
  }
}

/**
 * Generate HTML for verification email
 */
function generateVerificationEmailHtml(verifyUrl: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 40px 20px; background-color: #f5f5f5;">
  <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 8px; padding: 40px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <h1 style="margin: 0 0 24px; font-size: 24px; color: #111;">Verify Your Email</h1>
    <p style="margin: 0 0 24px; color: #555; line-height: 1.5;">Click the button below to verify your email address and complete your account setup.</p>
    <div style="text-align: center; margin: 0 0 24px;">
      <a href="${verifyUrl}" style="display: inline-block; background: #0066cc; color: white; text-decoration: none; padding: 12px 32px; border-radius: 6px; font-weight: 500;">Verify Email</a>
    </div>
    <p style="margin: 0 0 16px; color: #888; font-size: 14px;">Or copy and paste this link into your browser:</p>
    <p style="margin: 0 0 24px; color: #0066cc; font-size: 14px; word-break: break-all;">${verifyUrl}</p>
    <p style="margin: 0; color: #888; font-size: 14px;">This link expires in 24 hours. If you didn't create an account, you can safely ignore this email.</p>
  </div>
</body>
</html>
`.trim()
}
