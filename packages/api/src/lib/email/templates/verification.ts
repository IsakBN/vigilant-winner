/**
 * Email verification template
 */

import { baseTemplate } from './base'

export function verificationEmail(otp: string): { html: string; text: string } {
  const html = baseTemplate(`
    <h1>Verify your email</h1>
    <p>Enter this code to verify your email address:</p>
    <div class="otp-code">${otp}</div>
    <p>This code expires in 30 minutes.</p>
    <p>If you didn't create a BundleNudge account, please ignore this email.</p>
  `)

  const text = `
Your BundleNudge verification code is: ${otp}

This code expires in 30 minutes.

If you didn't create a BundleNudge account, please ignore this email.
`.trim()

  return { html, text }
}
