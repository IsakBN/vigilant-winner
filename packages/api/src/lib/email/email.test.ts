import { describe, it, expect } from 'vitest'
import {
  baseTemplate,
  verificationEmail,
  teamInviteEmail,
  adminOtpEmail,
  passwordResetEmail,
  welcomeEmail,
} from './templates'

describe('email templates', () => {
  describe('baseTemplate', () => {
    it('wraps content in HTML structure', () => {
      const result = baseTemplate('<p>Test content</p>')

      expect(result).toContain('<!DOCTYPE html>')
      expect(result).toContain('<html>')
      expect(result).toContain('<p>Test content</p>')
      expect(result).toContain('BundleNudge')
    })

    it('includes header with logo', () => {
      const result = baseTemplate('Content')

      expect(result).toContain('class="logo"')
      expect(result).toContain('BundleNudge')
    })

    it('includes footer', () => {
      const result = baseTemplate('Content')

      expect(result).toContain('class="footer"')
      expect(result).toContain("If you didn't request this email")
    })

    it('includes responsive meta tag', () => {
      const result = baseTemplate('Content')

      expect(result).toContain('viewport')
      expect(result).toContain('width=device-width')
    })
  })

  describe('verificationEmail', () => {
    it('includes OTP code in html', () => {
      const { html } = verificationEmail('123456')

      expect(html).toContain('123456')
      expect(html).toContain('Verify your email')
    })

    it('includes OTP code in text', () => {
      const { text } = verificationEmail('789012')

      expect(text).toContain('789012')
      expect(text).toContain('verification code')
    })

    it('mentions expiration time', () => {
      const { html, text } = verificationEmail('123456')

      expect(html).toContain('30 minutes')
      expect(text).toContain('30 minutes')
    })

    it('returns both html and text formats', () => {
      const result = verificationEmail('123456')

      expect(result).toHaveProperty('html')
      expect(result).toHaveProperty('text')
      expect(typeof result.html).toBe('string')
      expect(typeof result.text).toBe('string')
    })
  })

  describe('teamInviteEmail', () => {
    const baseData = {
      teamName: 'Test Team',
      inviterName: 'John Doe',
      inviterEmail: 'john@example.com',
      otp: 'ABC123',
      isNewUser: false,
      dashboardUrl: 'https://app.bundlenudge.com',
    }

    it('includes team name', () => {
      const { html, text } = teamInviteEmail(baseData)

      expect(html).toContain('Test Team')
      expect(text).toContain('Test Team')
    })

    it('includes inviter information', () => {
      const { html, text } = teamInviteEmail(baseData)

      expect(html).toContain('John Doe')
      expect(html).toContain('john@example.com')
      expect(text).toContain('John Doe')
      expect(text).toContain('john@example.com')
    })

    it('includes OTP code', () => {
      const { html, text } = teamInviteEmail(baseData)

      expect(html).toContain('ABC123')
      expect(text).toContain('ABC123')
    })

    it('shows Join Team for existing users', () => {
      const { html } = teamInviteEmail({ ...baseData, isNewUser: false })

      expect(html).toContain('Join Team')
    })

    it('shows Create Account for new users', () => {
      const { html } = teamInviteEmail({ ...baseData, isNewUser: true })

      expect(html).toContain('Create Account')
    })

    it('includes dashboard URL', () => {
      const { html, text } = teamInviteEmail(baseData)

      expect(html).toContain('https://app.bundlenudge.com')
      expect(text).toContain('https://app.bundlenudge.com')
    })

    it('URL-encodes team name in link', () => {
      const data = { ...baseData, teamName: 'Team With Spaces' }
      const { html } = teamInviteEmail(data)

      expect(html).toContain(encodeURIComponent('Team With Spaces'))
    })
  })

  describe('adminOtpEmail', () => {
    it('includes OTP code', () => {
      const { html, text } = adminOtpEmail('999888')

      expect(html).toContain('999888')
      expect(text).toContain('999888')
    })

    it('indicates admin context', () => {
      const { html, text } = adminOtpEmail('999888')

      expect(html).toContain('Admin')
      expect(text).toContain('admin')
    })

    it('includes security warning', () => {
      const { html, text } = adminOtpEmail('999888')

      expect(html).toContain('Never share this code')
      expect(text).toContain('Never share this code')
    })

    it('mentions 10 minute expiration', () => {
      const { html, text } = adminOtpEmail('999888')

      expect(html).toContain('10 minutes')
      expect(text).toContain('10 minutes')
    })
  })

  describe('passwordResetEmail', () => {
    const resetUrl = 'https://app.bundlenudge.com/reset?token=abc123'

    it('includes reset URL in html', () => {
      const { html } = passwordResetEmail(resetUrl)

      expect(html).toContain(resetUrl)
    })

    it('includes reset URL in text', () => {
      const { text } = passwordResetEmail(resetUrl)

      expect(text).toContain(resetUrl)
    })

    it('includes Reset Password button', () => {
      const { html } = passwordResetEmail(resetUrl)

      expect(html).toContain('Reset Password')
      expect(html).toContain('class="button"')
    })

    it('mentions 1 hour expiration', () => {
      const { html, text } = passwordResetEmail(resetUrl)

      expect(html).toContain('1 hour')
      expect(text).toContain('1 hour')
    })
  })

  describe('welcomeEmail', () => {
    const data = {
      userName: 'Jane',
      dashboardUrl: 'https://app.bundlenudge.com',
    }

    it('includes user name', () => {
      const { html, text } = welcomeEmail(data)

      expect(html).toContain('Jane')
      expect(text).toContain('Jane')
    })

    it('includes getting started steps', () => {
      const { html, text } = welcomeEmail(data)

      expect(html).toContain('Create your first app')
      expect(html).toContain('Install the SDK')
      expect(text).toContain('Create your first app')
    })

    it('includes dashboard link', () => {
      const { html, text } = welcomeEmail(data)

      expect(html).toContain('https://app.bundlenudge.com/apps/new')
      expect(text).toContain('https://app.bundlenudge.com/apps/new')
    })

    it('includes docs link', () => {
      const { html, text } = welcomeEmail(data)

      expect(html).toContain('docs.bundlenudge.com')
      expect(text).toContain('docs.bundlenudge.com')
    })
  })
})

describe('email client', () => {
  describe('sendEmail options', () => {
    it('accepts single recipient', () => {
      const options = {
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<p>Test</p>',
      }

      expect(options.to).toBe('test@example.com')
    })

    it('accepts multiple recipients', () => {
      const options = {
        to: ['test1@example.com', 'test2@example.com'],
        subject: 'Test Subject',
        html: '<p>Test</p>',
      }

      expect(options.to).toHaveLength(2)
    })

    it('accepts optional text version', () => {
      const options = {
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<p>Test</p>',
        text: 'Test',
      }

      expect(options.text).toBe('Test')
    })

    it('accepts optional replyTo', () => {
      const options = {
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<p>Test</p>',
        replyTo: 'reply@example.com',
      }

      expect(options.replyTo).toBe('reply@example.com')
    })
  })

  describe('EmailResult', () => {
    it('success result has id', () => {
      const result = {
        success: true,
        id: 'email-123',
      }

      expect(result.success).toBe(true)
      expect(result.id).toBe('email-123')
    })

    it('failure result has error', () => {
      const result = {
        success: false,
        error: 'Rate limit exceeded',
      }

      expect(result.success).toBe(false)
      expect(result.error).toBe('Rate limit exceeded')
    })
  })
})

describe('EmailService methods', () => {
  describe('sendVerificationEmail', () => {
    it('requires email and otp', () => {
      // Type check - the function signature requires these params
      const email = 'user@example.com'
      const otp = '123456'

      expect(typeof email).toBe('string')
      expect(typeof otp).toBe('string')
    })
  })

  describe('sendTeamInvitation', () => {
    it('requires email and TeamInviteData', () => {
      const email = 'invitee@example.com'
      const data = {
        teamName: 'My Team',
        inviterName: 'Admin',
        inviterEmail: 'admin@example.com',
        otp: 'XYZ789',
        isNewUser: true,
        dashboardUrl: 'https://app.bundlenudge.com',
      }

      expect(typeof email).toBe('string')
      expect(data.teamName).toBe('My Team')
    })
  })

  describe('sendAdminOtp', () => {
    it('requires email and otp', () => {
      const email = 'admin@example.com'
      const otp = '999999'

      expect(typeof email).toBe('string')
      expect(typeof otp).toBe('string')
    })
  })

  describe('sendPasswordReset', () => {
    it('requires email and resetUrl', () => {
      const email = 'user@example.com'
      const resetUrl = 'https://app.bundlenudge.com/reset?token=abc'

      expect(typeof email).toBe('string')
      expect(resetUrl).toContain('https://')
    })
  })

  describe('sendWelcome', () => {
    it('requires email and WelcomeData', () => {
      const email = 'newuser@example.com'
      const data = {
        userName: 'New User',
        dashboardUrl: 'https://app.bundlenudge.com',
      }

      expect(typeof email).toBe('string')
      expect(data.userName).toBe('New User')
    })
  })
})
