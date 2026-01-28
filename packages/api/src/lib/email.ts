/**
 * Email utilities using Resend
 */

import type { Env } from '../types/env'

interface SendEmailParams {
  to: string
  subject: string
  html: string
  env: Env
}

const RESEND_API_URL = 'https://api.resend.com/emails'
const FROM_ADDRESS = 'BundleNudge <noreply@bundlenudge.com>'

/**
 * Send an email via Resend API
 */
export async function sendEmail(params: SendEmailParams): Promise<{ success: boolean; error?: string }> {
  const { to, subject, html, env } = params

  try {
    const response = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: FROM_ADDRESS,
        to: [to],
        subject,
        html,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({})) as { message?: string }
      return { success: false, error: errorData.message ?? `HTTP ${String(response.status)}` }
    }

    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Send OTP verification email
 */
export async function sendOTPEmail(email: string, otp: string, env: Env): Promise<void> {
  const html = generateOTPEmailHtml(otp)

  const result = await sendEmail({
    to: email,
    subject: 'Your BundleNudge verification code',
    html,
    env,
  })

  if (!result.success) {
    throw new Error(`Failed to send OTP email: ${result.error ?? 'Unknown error'}`)
  }
}

/**
 * Generate HTML for OTP email
 */
function generateOTPEmailHtml(otp: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verification Code</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 40px 20px; background-color: #f5f5f5;">
  <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 8px; padding: 40px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <h1 style="margin: 0 0 24px; font-size: 24px; color: #111;">Verification Code</h1>
    <p style="margin: 0 0 24px; color: #555; line-height: 1.5;">Enter this code to verify your email address:</p>
    <div style="background: #f8f8f8; border-radius: 8px; padding: 24px; text-align: center; margin: 0 0 24px;">
      <span style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #111;">${otp}</span>
    </div>
    <p style="margin: 0; color: #888; font-size: 14px;">This code expires in 10 minutes. If you didn't request this, you can safely ignore this email.</p>
  </div>
</body>
</html>
`.trim()
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  email: string,
  resetUrl: string,
  env: Env
): Promise<void> {
  const html = generatePasswordResetEmailHtml(resetUrl)

  const result = await sendEmail({
    to: email,
    subject: 'Reset your BundleNudge password',
    html,
    env,
  })

  if (!result.success) {
    throw new Error(`Failed to send password reset email: ${result.error ?? 'Unknown error'}`)
  }
}

/**
 * Generate HTML for password reset email
 */
function generatePasswordResetEmailHtml(resetUrl: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Password</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 40px 20px; background-color: #f5f5f5;">
  <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 8px; padding: 40px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <h1 style="margin: 0 0 24px; font-size: 24px; color: #111;">Reset Your Password</h1>
    <p style="margin: 0 0 24px; color: #555; line-height: 1.5;">We received a request to reset your password. Click the button below to create a new password:</p>
    <div style="text-align: center; margin: 0 0 24px;">
      <a href="${resetUrl}" style="display: inline-block; background: #5E7CFF; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">Reset Password</a>
    </div>
    <p style="margin: 0 0 16px; color: #888; font-size: 14px;">This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>
    <p style="margin: 0; color: #888; font-size: 12px;">If the button doesn't work, copy and paste this link into your browser:<br><a href="${resetUrl}" style="color: #5E7CFF; word-break: break-all;">${resetUrl}</a></p>
  </div>
</body>
</html>
`.trim()
}
