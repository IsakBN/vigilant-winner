# Feature: api/email-service

Implement email sending via Resend.

## Knowledge Docs to Read First

- `.claude/knowledge/IMPLEMENTATION_DETAILS.md` → Email templates
- `.claude/knowledge/API_FEATURES.md` → Email use cases

## Dependencies

- `shared/constants` (for email from address)

## What to Implement

### 1. Email Client

```typescript
// packages/api/src/lib/email/client.ts
import { Resend } from 'resend'

export function createEmailClient(apiKey: string) {
  return new Resend(apiKey)
}

export interface EmailOptions {
  to: string | string[]
  subject: string
  html: string
  text?: string
  replyTo?: string
}

export async function sendEmail(
  env: Env,
  options: EmailOptions
): Promise<{ success: boolean; id?: string; error?: string }> {
  const resend = createEmailClient(env.RESEND_API_KEY)

  try {
    const { data, error } = await resend.emails.send({
      from: env.EMAIL_FROM || 'BundleNudge <noreply@bundlenudge.com>',
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      replyTo: options.replyTo,
    })

    if (error) {
      console.error('Email send error:', error)
      return { success: false, error: error.message }
    }

    return { success: true, id: data?.id }
  } catch (error) {
    console.error('Email error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
```

### 2. Email Templates

```typescript
// packages/api/src/lib/email/templates/base.ts
export function baseTemplate(content: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>BundleNudge</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      text-align: center;
      padding: 20px 0;
      border-bottom: 1px solid #eee;
    }
    .logo {
      font-size: 24px;
      font-weight: bold;
      color: #4F46E5;
    }
    .content {
      padding: 30px 0;
    }
    .button {
      display: inline-block;
      background-color: #4F46E5;
      color: white;
      padding: 12px 24px;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 500;
    }
    .otp-code {
      font-size: 32px;
      font-weight: bold;
      letter-spacing: 4px;
      color: #4F46E5;
      text-align: center;
      padding: 20px;
      background: #F3F4F6;
      border-radius: 8px;
      margin: 20px 0;
    }
    .footer {
      text-align: center;
      padding: 20px 0;
      border-top: 1px solid #eee;
      color: #666;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">BundleNudge</div>
  </div>
  <div class="content">
    ${content}
  </div>
  <div class="footer">
    <p>BundleNudge - OTA Updates for React Native</p>
    <p>If you didn't request this email, you can safely ignore it.</p>
  </div>
</body>
</html>
`
}
```

```typescript
// packages/api/src/lib/email/templates/verification.ts
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
`

  return { html, text }
}
```

```typescript
// packages/api/src/lib/email/templates/team-invite.ts
import { baseTemplate } from './base'

interface TeamInviteData {
  teamName: string
  inviterName: string
  inviterEmail: string
  otp: string
  isNewUser: boolean
  dashboardUrl: string
}

export function teamInviteEmail(data: TeamInviteData): { html: string; text: string } {
  const actionText = data.isNewUser
    ? 'Create your account to join the team'
    : 'Accept this invitation to join the team'

  const html = baseTemplate(`
    <h1>You've been invited to ${data.teamName}</h1>
    <p>${data.inviterName} (${data.inviterEmail}) has invited you to join their team on BundleNudge.</p>
    <p>${actionText}:</p>
    <div class="otp-code">${data.otp}</div>
    <p>This invitation expires in 30 minutes.</p>
    <p style="text-align: center;">
      <a href="${data.dashboardUrl}/join?team=${data.teamName}" class="button">
        ${data.isNewUser ? 'Create Account' : 'Join Team'}
      </a>
    </p>
  `)

  const text = `
You've been invited to ${data.teamName}

${data.inviterName} (${data.inviterEmail}) has invited you to join their team on BundleNudge.

Your invitation code: ${data.otp}

${actionText} at: ${data.dashboardUrl}/join

This invitation expires in 30 minutes.
`

  return { html, text }
}
```

```typescript
// packages/api/src/lib/email/templates/admin-otp.ts
import { baseTemplate } from './base'

export function adminOtpEmail(otp: string): { html: string; text: string } {
  const html = baseTemplate(`
    <h1>Admin Login Code</h1>
    <p>Use this code to access the BundleNudge admin dashboard:</p>
    <div class="otp-code">${otp}</div>
    <p><strong>This code expires in 10 minutes.</strong></p>
    <p style="color: #EF4444; font-weight: 500;">
      Never share this code with anyone. BundleNudge will never ask for your login code.
    </p>
  `)

  const text = `
Your BundleNudge admin login code is: ${otp}

This code expires in 10 minutes.

SECURITY WARNING: Never share this code with anyone. BundleNudge will never ask for your login code.
`

  return { html, text }
}
```

```typescript
// packages/api/src/lib/email/templates/password-reset.ts
import { baseTemplate } from './base'

export function passwordResetEmail(resetUrl: string): { html: string; text: string } {
  const html = baseTemplate(`
    <h1>Reset your password</h1>
    <p>Click the button below to reset your password:</p>
    <p style="text-align: center;">
      <a href="${resetUrl}" class="button">Reset Password</a>
    </p>
    <p>This link expires in 1 hour.</p>
    <p>If you didn't request a password reset, you can safely ignore this email.</p>
  `)

  const text = `
Reset your BundleNudge password

Click here to reset your password: ${resetUrl}

This link expires in 1 hour.

If you didn't request a password reset, you can safely ignore this email.
`

  return { html, text }
}
```

### 3. Email Service

```typescript
// packages/api/src/lib/email/service.ts
import { sendEmail } from './client'
import { verificationEmail } from './templates/verification'
import { teamInviteEmail } from './templates/team-invite'
import { adminOtpEmail } from './templates/admin-otp'
import { passwordResetEmail } from './templates/password-reset'

export class EmailService {
  constructor(private env: Env) {}

  async sendVerificationEmail(to: string, otp: string) {
    const { html, text } = verificationEmail(otp)
    return sendEmail(this.env, {
      to,
      subject: 'Verify your BundleNudge email',
      html,
      text,
    })
  }

  async sendTeamInvitation(to: string, data: TeamInviteData) {
    const { html, text } = teamInviteEmail(data)
    return sendEmail(this.env, {
      to,
      subject: `You've been invited to ${data.teamName} on BundleNudge`,
      html,
      text,
      replyTo: data.inviterEmail,
    })
  }

  async sendAdminOtp(to: string, otp: string) {
    const { html, text } = adminOtpEmail(otp)
    return sendEmail(this.env, {
      to,
      subject: 'BundleNudge Admin Login Code',
      html,
      text,
    })
  }

  async sendPasswordReset(to: string, resetUrl: string) {
    const { html, text } = passwordResetEmail(resetUrl)
    return sendEmail(this.env, {
      to,
      subject: 'Reset your BundleNudge password',
      html,
      text,
    })
  }
}

export function createEmailService(env: Env) {
  return new EmailService(env)
}
```

## Files to Create

1. `packages/api/src/lib/email/client.ts`
2. `packages/api/src/lib/email/service.ts`
3. `packages/api/src/lib/email/templates/base.ts`
4. `packages/api/src/lib/email/templates/verification.ts`
5. `packages/api/src/lib/email/templates/team-invite.ts`
6. `packages/api/src/lib/email/templates/admin-otp.ts`
7. `packages/api/src/lib/email/templates/password-reset.ts`
8. `packages/api/src/lib/email/index.ts`

## Tests Required

```typescript
describe('Email Service', () => {
  it('sends verification email', async () => {
    const mockResend = { emails: { send: vi.fn().mockResolvedValue({ data: { id: '123' } }) } }
    vi.mock('resend', () => ({ Resend: vi.fn(() => mockResend) }))

    const service = createEmailService(env)
    const result = await service.sendVerificationEmail('test@example.com', '123456')

    expect(result.success).toBe(true)
    expect(mockResend.emails.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'test@example.com',
        subject: expect.stringContaining('Verify'),
      })
    )
  })

  it('includes OTP in verification email', async () => {
    const { html, text } = verificationEmail('123456')
    expect(html).toContain('123456')
    expect(text).toContain('123456')
  })

  it('handles send errors', async () => {
    const mockResend = { emails: { send: vi.fn().mockResolvedValue({ error: { message: 'Failed' } }) } }
    vi.mock('resend', () => ({ Resend: vi.fn(() => mockResend) }))

    const service = createEmailService(env)
    const result = await service.sendVerificationEmail('test@example.com', '123456')

    expect(result.success).toBe(false)
    expect(result.error).toBe('Failed')
  })
})
```

## Acceptance Criteria

- [ ] Resend client configured
- [ ] Base template with styling
- [ ] Verification email template
- [ ] Team invite email template
- [ ] Admin OTP email template
- [ ] Password reset email template
- [ ] All templates have text fallback
- [ ] Error handling
- [ ] Tests pass
