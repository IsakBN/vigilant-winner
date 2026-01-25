/**
 * Email service for sending templated emails
 */

import type { Env } from '../../types/env'
import { sendEmail, type EmailResult } from './client'
import {
  verificationEmail,
  teamInviteEmail,
  adminOtpEmail,
  passwordResetEmail,
  welcomeEmail,
  type TeamInviteData,
  type WelcomeData,
} from './templates'

// =============================================================================
// Email Service
// =============================================================================

export class EmailService {
  constructor(private env: Env) {}

  /**
   * Send email verification code
   */
  async sendVerificationEmail(to: string, otp: string): Promise<EmailResult> {
    const { html, text } = verificationEmail(otp)
    return sendEmail(this.env, {
      to,
      subject: 'Verify your BundleNudge email',
      html,
      text,
    })
  }

  /**
   * Send team invitation email
   */
  async sendTeamInvitation(to: string, data: TeamInviteData): Promise<EmailResult> {
    const { html, text } = teamInviteEmail(data)
    return sendEmail(this.env, {
      to,
      subject: `You've been invited to ${data.teamName} on BundleNudge`,
      html,
      text,
      replyTo: data.inviterEmail,
    })
  }

  /**
   * Send admin OTP login code
   */
  async sendAdminOtp(to: string, otp: string): Promise<EmailResult> {
    const { html, text } = adminOtpEmail(otp)
    return sendEmail(this.env, {
      to,
      subject: 'BundleNudge Admin Login Code',
      html,
      text,
    })
  }

  /**
   * Send password reset link
   */
  async sendPasswordReset(to: string, resetUrl: string): Promise<EmailResult> {
    const { html, text } = passwordResetEmail(resetUrl)
    return sendEmail(this.env, {
      to,
      subject: 'Reset your BundleNudge password',
      html,
      text,
    })
  }

  /**
   * Send welcome email to new users
   */
  async sendWelcome(to: string, data: WelcomeData): Promise<EmailResult> {
    const { html, text } = welcomeEmail(data)
    return sendEmail(this.env, {
      to,
      subject: `Welcome to BundleNudge, ${data.userName}!`,
      html,
      text,
    })
  }
}

/**
 * Create an email service instance
 */
export function createEmailService(env: Env): EmailService {
  return new EmailService(env)
}
