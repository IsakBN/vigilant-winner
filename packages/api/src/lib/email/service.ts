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
  passwordChangedEmail,
  welcomeEmail,
  followUpEmail,
  upgradeConfirmationEmail,
  downgradeConfirmationEmail,
  teamInviteExistingEmail,
  teamInviteNewEmail,
  newsletterEmail,
  type TeamInviteData,
  type WelcomeData,
  type FollowUpData,
  type UpgradeConfirmationData,
  type DowngradeConfirmationData,
  type TeamInviteExistingData,
  type TeamInviteNewData,
  type NewsletterData,
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
   * Send team invitation email (legacy)
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
      subject: 'Welcome to BundleNudge!',
      html,
      text,
    })
  }

  /**
   * Send password changed notification
   */
  async sendPasswordChanged(to: string): Promise<EmailResult> {
    const { html, text } = passwordChangedEmail()
    return sendEmail(this.env, {
      to,
      subject: 'Your BundleNudge password has been changed',
      html,
      text,
    })
  }

  /**
   * Send follow-up email (1 week after signup)
   */
  async sendFollowUp(to: string, data: FollowUpData): Promise<EmailResult> {
    const { html, text } = followUpEmail(data)
    return sendEmail(this.env, {
      to,
      subject: "How's it going with BundleNudge?",
      html,
      text,
    })
  }

  /**
   * Send upgrade confirmation email
   */
  async sendUpgradeConfirmation(
    to: string,
    data: UpgradeConfirmationData
  ): Promise<EmailResult> {
    const { html, text } = upgradeConfirmationEmail(data)
    return sendEmail(this.env, {
      to,
      subject: `You're now on BundleNudge ${data.planName}!`,
      html,
      text,
    })
  }

  /**
   * Send downgrade confirmation email
   */
  async sendDowngradeConfirmation(
    to: string,
    data: DowngradeConfirmationData
  ): Promise<EmailResult> {
    const { html, text } = downgradeConfirmationEmail(data)
    return sendEmail(this.env, {
      to,
      subject: 'Your BundleNudge plan has been updated',
      html,
      text,
    })
  }

  /**
   * Send team invite to existing user
   */
  async sendTeamInviteExisting(
    to: string,
    data: TeamInviteExistingData
  ): Promise<EmailResult> {
    const { html, text } = teamInviteExistingEmail(data)
    return sendEmail(this.env, {
      to,
      subject: `You've been invited to join ${data.teamName} on BundleNudge`,
      html,
      text,
      replyTo: data.inviterEmail,
    })
  }

  /**
   * Send team invite to new user
   */
  async sendTeamInviteNew(to: string, data: TeamInviteNewData): Promise<EmailResult> {
    const { html, text } = teamInviteNewEmail(data)
    return sendEmail(this.env, {
      to,
      subject: `${data.inviterName} invited you to BundleNudge`,
      html,
      text,
      replyTo: data.inviterEmail,
    })
  }

  /**
   * Send newsletter email
   */
  async sendNewsletter(
    to: string | string[],
    subject: string,
    data: NewsletterData
  ): Promise<EmailResult> {
    const { html, text } = newsletterEmail(data)
    return sendEmail(this.env, {
      to,
      subject,
      html,
      text,
    })
  }
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Create an email service instance
 */
export function createEmailService(env: Env): EmailService {
  return new EmailService(env)
}

// =============================================================================
// Convenience Functions (for direct use without service instance)
// =============================================================================

export type { EmailResult } from './client'
export type {
  WelcomeData,
  FollowUpData,
  UpgradeConfirmationData,
  DowngradeConfirmationData,
  TeamInviteExistingData,
  TeamInviteNewData,
  NewsletterData,
}
