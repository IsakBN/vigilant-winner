import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { emailOTP } from 'better-auth/plugins'
import { db } from './db'

const SESSION_EXPIRY_DAYS = 7
const SECONDS_PER_DAY = 60 * 60 * 24

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
  },
  plugins: [
    emailOTP({
      sendVerificationOTP: async ({ email, otp }) => {
        // TODO: Implement email sending with Resend or similar
        console.log(`[DEV] OTP for ${email}: ${otp}`)
      },
    }),
  ],
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID ?? '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET ?? '',
    },
  },
  session: {
    expiresIn: SECONDS_PER_DAY * SESSION_EXPIRY_DAYS,
  },
  trustedOrigins: [
    process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3001',
    'http://localhost:3001',
  ],
})

export type Session = typeof auth.$Infer.Session
