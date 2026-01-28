import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { emailOTP } from 'better-auth/plugins'
import { db } from '../db'
import { isEmailAllowed } from './allowlist'

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: 'pg' }),
  plugins: [
    emailOTP({
      async sendVerificationOTP({ email, otp }) {
        const allowed = await isEmailAllowed(email)
        if (!allowed) {
          throw new Error('Email not authorized for admin access')
        }
        // In dev, log to console. In prod, send via email service
        if (process.env.NODE_ENV === 'development') {
          // eslint-disable-next-line no-console
          console.log(`[DEV] Admin OTP for ${email}: ${otp}`)
        } else {
          // TODO: Integrate with email service (Resend, SendGrid, etc.)
          // eslint-disable-next-line no-console
          console.log(`Would send OTP to ${email}`)
        }
      },
      otpLength: 6,
      expiresIn: 300, // 5 minutes
    }),
  ],
  session: {
    expiresIn: 60 * 60 * 4, // 4 hours (shorter for admin)
  },
  trustedOrigins: [
    process.env.NEXT_PUBLIC_ADMIN_URL || 'http://localhost:3002',
  ],
})

export type Session = typeof auth.$Infer.Session
