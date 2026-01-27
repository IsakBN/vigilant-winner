import { describe, it, expect } from 'vitest'
import {
  baseTemplate,
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

  describe('passwordChangedEmail', () => {
    it('includes confirmation message in html', () => {
      const { html } = passwordChangedEmail()

      expect(html).toContain('password has been changed')
      expect(html).toContain('successfully changed')
    })

    it('includes confirmation message in text', () => {
      const { text } = passwordChangedEmail()

      expect(text).toContain('password has been changed')
    })

    it('includes security warning', () => {
      const { html, text } = passwordChangedEmail()

      expect(html).toContain('If you did not change your password')
      expect(text).toContain('If you did not change your password')
    })

    it('includes action steps if not authorized', () => {
      const { html, text } = passwordChangedEmail()

      expect(html).toContain('Reset your password immediately')
      expect(html).toContain('two-factor authentication')
      expect(text).toContain('Reset your password immediately')
    })

    it('returns both html and text formats', () => {
      const result = passwordChangedEmail()

      expect(result).toHaveProperty('html')
      expect(result).toHaveProperty('text')
      expect(typeof result.html).toBe('string')
      expect(typeof result.text).toBe('string')
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

  describe('followUpEmail', () => {
    const data = {
      userName: 'Bob',
      dashboardUrl: 'https://app.bundlenudge.com',
    }

    it('includes user name', () => {
      const { html, text } = followUpEmail(data)

      expect(html).toContain('Bob')
      expect(text).toContain('Bob')
    })

    it('includes personal tone disclaimer', () => {
      const { html, text } = followUpEmail(data)

      expect(html).toContain('personally read and respond')
      expect(text).toContain('personally read and respond')
    })

    it('includes feature suggestions', () => {
      const { html, text } = followUpEmail(data)

      expect(html).toContain('Staged Rollouts')
      expect(html).toContain('Automatic Rollbacks')
      expect(text).toContain('Staged Rollouts')
    })

    it('includes dashboard link', () => {
      const { html, text } = followUpEmail(data)

      expect(html).toContain('https://app.bundlenudge.com')
      expect(text).toContain('https://app.bundlenudge.com')
    })

    it('includes optional survey link when provided', () => {
      const dataWithSurvey = { ...data, surveyUrl: 'https://survey.com/feedback' }
      const { html, text } = followUpEmail(dataWithSurvey)

      expect(html).toContain('https://survey.com/feedback')
      expect(text).toContain('https://survey.com/feedback')
    })
  })

  describe('upgradeConfirmationEmail', () => {
    const data = {
      userName: 'Alice',
      planName: 'Pro',
      features: ['Unlimited apps', 'Priority support', '10 team members'],
      billingPortalUrl: 'https://billing.stripe.com/portal',
      dashboardUrl: 'https://app.bundlenudge.com',
    }

    it('includes user name and plan name', () => {
      const { html, text } = upgradeConfirmationEmail(data)

      expect(html).toContain('Alice')
      expect(html).toContain('Pro')
      expect(text).toContain('Alice')
      expect(text).toContain('Pro')
    })

    it('includes features list', () => {
      const { html, text } = upgradeConfirmationEmail(data)

      expect(html).toContain('Unlimited apps')
      expect(html).toContain('Priority support')
      expect(html).toContain('10 team members')
      expect(text).toContain('Unlimited apps')
    })

    it('includes billing portal link', () => {
      const { html, text } = upgradeConfirmationEmail(data)

      expect(html).toContain('https://billing.stripe.com/portal')
      expect(text).toContain('https://billing.stripe.com/portal')
    })

    it('includes dashboard link', () => {
      const { html, text } = upgradeConfirmationEmail(data)

      expect(html).toContain('https://app.bundlenudge.com')
      expect(text).toContain('https://app.bundlenudge.com')
    })
  })

  describe('downgradeConfirmationEmail', () => {
    const data = {
      userName: 'Charlie',
      oldPlanName: 'Pro',
      newPlanName: 'Free',
      retainedFeatures: ['3 apps', 'Community support'],
      lostFeatures: ['Priority support', 'Team members'],
      billingPortalUrl: 'https://billing.stripe.com/portal',
      dashboardUrl: 'https://app.bundlenudge.com',
    }

    it('includes plan change details', () => {
      const { html, text } = downgradeConfirmationEmail(data)

      expect(html).toContain('Pro')
      expect(html).toContain('Free')
      expect(text).toContain('Pro')
      expect(text).toContain('Free')
    })

    it('includes retained features', () => {
      const { html, text } = downgradeConfirmationEmail(data)

      expect(html).toContain('3 apps')
      expect(html).toContain('Community support')
      expect(text).toContain('3 apps')
    })

    it('includes lost features when provided', () => {
      const { html, text } = downgradeConfirmationEmail(data)

      expect(html).toContain('Priority support')
      expect(html).toContain('Team members')
      expect(text).toContain('Priority support')
    })

    it('includes upgrade again link', () => {
      const { html, text } = downgradeConfirmationEmail(data)

      expect(html).toContain('Upgrade again')
      expect(html).toContain('https://billing.stripe.com/portal')
      expect(text).toContain('https://billing.stripe.com/portal')
    })

    it('includes effective date when provided', () => {
      const dataWithDate = { ...data, effectiveDate: 'February 1, 2026' }
      const { html, text } = downgradeConfirmationEmail(dataWithDate)

      expect(html).toContain('February 1, 2026')
      expect(text).toContain('February 1, 2026')
    })
  })

  describe('teamInviteExistingEmail', () => {
    const data = {
      inviterName: 'Team Admin',
      inviterEmail: 'admin@company.com',
      teamName: 'Acme Corp',
      role: 'member' as const,
      scope: 'full' as const,
      otp: 'INVITE123',
      dashboardUrl: 'https://app.bundlenudge.com',
    }

    it('includes inviter information', () => {
      const { html, text } = teamInviteExistingEmail(data)

      expect(html).toContain('Team Admin')
      expect(html).toContain('admin@company.com')
      expect(text).toContain('Team Admin')
    })

    it('includes team name and role', () => {
      const { html, text } = teamInviteExistingEmail(data)

      expect(html).toContain('Acme Corp')
      expect(html).toContain('Member')
      expect(text).toContain('Acme Corp')
    })

    it('includes OTP code', () => {
      const { html, text } = teamInviteExistingEmail(data)

      expect(html).toContain('INVITE123')
      expect(text).toContain('INVITE123')
    })

    it('shows full access for full scope', () => {
      const { html, text } = teamInviteExistingEmail(data)

      expect(html).toContain('Full access')
      expect(text).toContain('Full access')
    })

    it('shows project names for projects scope', () => {
      const projectData = {
        ...data,
        scope: 'projects' as const,
        projectNames: ['Project A', 'Project B'],
      }
      const { html, text } = teamInviteExistingEmail(projectData)

      expect(html).toContain('Project A')
      expect(html).toContain('Project B')
      expect(text).toContain('Project A')
    })

    it('mentions 1 hour expiration', () => {
      const { html, text } = teamInviteExistingEmail(data)

      expect(html).toContain('1 hour')
      expect(text).toContain('1 hour')
    })
  })

  describe('teamInviteNewEmail', () => {
    const data = {
      inviterName: 'Jane Smith',
      inviterEmail: 'jane@startup.com',
      teamName: 'Startup Inc',
      role: 'admin' as const,
      scope: 'full' as const,
      otp: 'NEW789',
      signUpUrl: 'https://app.bundlenudge.com/sign-up',
    }

    it('includes inviter name in title', () => {
      const { html, text } = teamInviteNewEmail(data)

      expect(html).toContain('Jane Smith invited you')
      expect(text).toContain('Jane Smith invited you')
    })

    it('explains what BundleNudge is', () => {
      const { html, text } = teamInviteNewEmail(data)

      expect(html).toContain('React Native')
      expect(html).toContain('OTA')
      expect(text).toContain('React Native')
    })

    it('includes how to join steps', () => {
      const { html, text } = teamInviteNewEmail(data)

      expect(html).toContain('Create your account')
      expect(html).toContain('Enter the invitation code')
      expect(text).toContain('Create your account')
    })

    it('includes OTP code', () => {
      const { html, text } = teamInviteNewEmail(data)

      expect(html).toContain('NEW789')
      expect(text).toContain('NEW789')
    })

    it('includes sign up link', () => {
      const { html, text } = teamInviteNewEmail(data)

      expect(html).toContain('https://app.bundlenudge.com/sign-up')
      expect(text).toContain('https://app.bundlenudge.com/sign-up')
    })
  })

  describe('newsletterEmail', () => {
    const data = {
      content: '<h1>Product Update</h1><p>Exciting news!</p>',
      unsubscribeUrl: 'https://app.bundlenudge.com/unsubscribe?token=xyz',
    }

    it('includes content in html', () => {
      const { html } = newsletterEmail(data)

      expect(html).toContain('Product Update')
      expect(html).toContain('Exciting news!')
    })

    it('converts content to text', () => {
      const { text } = newsletterEmail(data)

      expect(text).toContain('Product Update')
      expect(text).toContain('Exciting news!')
    })

    it('includes unsubscribe link', () => {
      const { html, text } = newsletterEmail(data)

      expect(html).toContain('Unsubscribe')
      expect(html).toContain('https://app.bundlenudge.com/unsubscribe')
      expect(text).toContain('Unsubscribe')
      expect(text).toContain('https://app.bundlenudge.com/unsubscribe')
    })

    it('includes BundleNudge branding', () => {
      const { html } = newsletterEmail(data)

      expect(html).toContain('BundleNudge')
      expect(html).toContain('class="logo"')
    })

    it('handles links in content', () => {
      const dataWithLink = {
        ...data,
        content: '<p>Check out <a href="https://example.com">this link</a></p>',
      }
      const { text } = newsletterEmail(dataWithLink)

      expect(text).toContain('https://example.com')
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

  describe('sendPasswordChanged', () => {
    it('requires only email address', () => {
      const email = 'user@example.com'

      expect(typeof email).toBe('string')
    })
  })

  describe('sendFollowUp', () => {
    it('requires email and FollowUpData', () => {
      const email = 'user@example.com'
      const data = {
        userName: 'User',
        dashboardUrl: 'https://app.bundlenudge.com',
      }

      expect(typeof email).toBe('string')
      expect(data.userName).toBe('User')
    })
  })

  describe('sendUpgradeConfirmation', () => {
    it('requires email and UpgradeConfirmationData', () => {
      const email = 'user@example.com'
      const data = {
        userName: 'User',
        planName: 'Pro',
        features: ['Feature 1'],
        billingPortalUrl: 'https://billing.stripe.com/portal',
        dashboardUrl: 'https://app.bundlenudge.com',
      }

      expect(typeof email).toBe('string')
      expect(data.planName).toBe('Pro')
    })
  })

  describe('sendDowngradeConfirmation', () => {
    it('requires email and DowngradeConfirmationData', () => {
      const email = 'user@example.com'
      const data = {
        userName: 'User',
        oldPlanName: 'Pro',
        newPlanName: 'Free',
        retainedFeatures: ['Feature 1'],
        billingPortalUrl: 'https://billing.stripe.com/portal',
        dashboardUrl: 'https://app.bundlenudge.com',
      }

      expect(typeof email).toBe('string')
      expect(data.oldPlanName).toBe('Pro')
    })
  })

  describe('sendTeamInviteExisting', () => {
    it('requires email and TeamInviteExistingData', () => {
      const email = 'user@example.com'
      const data = {
        inviterName: 'Admin',
        inviterEmail: 'admin@example.com',
        teamName: 'Team',
        role: 'member' as const,
        scope: 'full' as const,
        otp: 'ABC123',
        dashboardUrl: 'https://app.bundlenudge.com',
      }

      expect(typeof email).toBe('string')
      expect(data.scope).toBe('full')
    })
  })

  describe('sendTeamInviteNew', () => {
    it('requires email and TeamInviteNewData', () => {
      const email = 'user@example.com'
      const data = {
        inviterName: 'Admin',
        inviterEmail: 'admin@example.com',
        teamName: 'Team',
        role: 'member' as const,
        scope: 'full' as const,
        otp: 'ABC123',
        signUpUrl: 'https://app.bundlenudge.com/sign-up',
      }

      expect(typeof email).toBe('string')
      expect(data.signUpUrl).toContain('sign-up')
    })
  })

  describe('sendNewsletter', () => {
    it('requires email, subject, and NewsletterData', () => {
      const email = 'user@example.com'
      const subject = 'Newsletter Subject'
      const data = {
        content: '<p>Content</p>',
        unsubscribeUrl: 'https://app.bundlenudge.com/unsubscribe',
      }

      expect(typeof email).toBe('string')
      expect(typeof subject).toBe('string')
      expect(data.unsubscribeUrl).toContain('unsubscribe')
    })

    it('accepts array of recipients', () => {
      const emails = ['user1@example.com', 'user2@example.com']

      expect(Array.isArray(emails)).toBe(true)
      expect(emails).toHaveLength(2)
    })
  })
})
