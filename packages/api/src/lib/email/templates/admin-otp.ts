/**
 * Admin OTP login email template
 */

import { baseTemplate } from './base'

export function adminOtpEmail(otp: string): { html: string; text: string } {
  const html = baseTemplate(`
    <h1>Admin Login Code</h1>
    <p>Use this code to access the BundleNudge admin dashboard:</p>
    <div class="otp-code">${otp}</div>
    <p><strong>This code expires in 10 minutes.</strong></p>
    <p class="warning">
      Never share this code with anyone. BundleNudge will never ask for your login code.
    </p>
  `)

  const text = `
Your BundleNudge admin login code is: ${otp}

This code expires in 10 minutes.

SECURITY WARNING: Never share this code with anyone. BundleNudge will never ask for your login code.
`.trim()

  return { html, text }
}
