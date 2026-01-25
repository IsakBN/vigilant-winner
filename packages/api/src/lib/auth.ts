/**
 * Better Auth configuration for BundleNudge
 *
 * Uses Neon Postgres for auth tables and supports:
 * - Email/password authentication
 * - Email OTP verification
 * - GitHub OAuth
 */

import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { emailOTP } from 'better-auth/plugins'
import { Pool } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-serverless'
import { sendOTPEmail } from './email'
import * as schema from './auth-schema'
import type { Env } from '../types/env'

const SESSION_EXPIRY_SECONDS = 60 * 60 * 24 * 7  // 7 days
const SESSION_UPDATE_AGE_SECONDS = 60 * 60 * 24  // Update every 24 hours
const OTP_LENGTH = 6
const OTP_EXPIRY_SECONDS = 600  // 10 minutes

/**
 * Create a Better Auth instance for the given environment
 */
export function createAuth(env: Env): ReturnType<typeof betterAuth> {
  const pool = new Pool({ connectionString: env.DATABASE_URL })
  const db = drizzle(pool, { schema })

  return betterAuth({
    database: drizzleAdapter(db, {
      provider: 'pg',
    }),
    emailAndPassword: {
      enabled: true,
    },
    socialProviders: {
      github: {
        clientId: env.GITHUB_CLIENT_ID,
        clientSecret: env.GITHUB_CLIENT_SECRET,
      },
    },
    plugins: [
      emailOTP({
        async sendVerificationOTP({ email, otp }) {
          await sendOTPEmail(email, otp, env)
        },
        otpLength: OTP_LENGTH,
        expiresIn: OTP_EXPIRY_SECONDS,
      }),
    ],
    session: {
      expiresIn: SESSION_EXPIRY_SECONDS,
      updateAge: SESSION_UPDATE_AGE_SECONDS,
    },
    trustedOrigins: [
      env.DASHBOARD_URL,
      env.API_URL,
    ],
    secret: env.BETTER_AUTH_SECRET,
  })
}

/**
 * Check if an email address belongs to an admin
 * Admins are identified by @bundlenudge.com email domain
 */
export function isAdmin(email: string | null | undefined): boolean {
  return email?.endsWith('@bundlenudge.com') ?? false
}
