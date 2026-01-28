/**
 * Better Auth configuration for BundleNudge
 *
 * Uses Railway Postgres for auth tables and supports:
 * - Email/password authentication
 * - Email OTP verification (with allowlist for admin)
 * - GitHub OAuth
 */

import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { emailOTP } from 'better-auth/plugins'
import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import { sendOTPEmail, sendPasswordResetEmail } from './email'
import * as schema from './auth-schema'
import type { Env } from '../types/env'

const SESSION_EXPIRY_SECONDS = 60 * 60 * 24 * 7  // 7 days
const SESSION_UPDATE_AGE_SECONDS = 60 * 60 * 24  // Update every 24 hours
const OTP_LENGTH = 6
const OTP_EXPIRY_SECONDS = 600  // 10 minutes

type DrizzleDb = ReturnType<typeof drizzle<typeof schema>>

/**
 * Check if an email is allowed for admin access
 * Queries the email_allowlist table and matches against patterns
 * SECURITY: Returns false if table is empty (fail closed)
 */
async function isEmailAllowedForAdmin(email: string, db: DrizzleDb): Promise<boolean> {
  const patterns = await db.select().from(schema.emailAllowlist)

  // Fail closed: if no patterns defined, reject all emails
  if (patterns.length === 0) {
    return false
  }

  const lowerEmail = email.toLowerCase()

  for (const { emailPattern } of patterns) {
    // Wildcard domain match: *@example.com
    if (emailPattern.startsWith('*@')) {
      const domain = emailPattern.slice(2).toLowerCase()
      if (lowerEmail.endsWith(`@${domain}`)) {
        return true
      }
    }
    // Exact match (case-insensitive)
    else if (lowerEmail === emailPattern.toLowerCase()) {
      return true
    }
  }

  return false
}

/**
 * Create a Better Auth instance for the given environment
 */
export function createAuth(env: Env): ReturnType<typeof betterAuth> {
  const client = postgres(env.DATABASE_URL)
  const db = drizzle(client, { schema })

  const isProduction = !env.API_URL?.includes('localhost')

  return betterAuth({
    database: drizzleAdapter(db, {
      provider: 'pg',
      schema,
    }),
    baseURL: env.API_URL || 'http://localhost:8787',
    basePath: '/api/auth',
    secret: env.BETTER_AUTH_SECRET,
    emailAndPassword: {
      enabled: true,
      async sendResetPassword({ user, url }) {
        await sendPasswordResetEmail(user.email, url, env)
      },
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
          // Check allowlist before sending OTP (fail closed)
          const allowed = await isEmailAllowedForAdmin(email, db)
          if (!allowed) {
            throw new Error('Email not authorized for admin access')
          }
          await sendOTPEmail(email, otp, env)
        },
        otpLength: OTP_LENGTH,
        expiresIn: OTP_EXPIRY_SECONDS,
      }),
    ],
    session: {
      expiresIn: SESSION_EXPIRY_SECONDS,
      updateAge: SESSION_UPDATE_AGE_SECONDS,
      cookieCache: {
        enabled: true,
        maxAge: 60 * 5, // 5 minutes
      },
    },
    trustedOrigins: [
      // Environment-configured URLs
      env.DASHBOARD_URL,
      env.API_URL,
      // Production subdomains
      'https://app.bundlenudge.com',
      'https://admin.bundlenudge.com',
      'https://bundlenudge.com',
      'https://www.bundlenudge.com',
      // Development
      'http://localhost:3000',  // landing page
      'http://localhost:3001',  // app-dashboard
      'http://localhost:3002',  // admin-dashboard
    ].filter(Boolean) as string[],
    // Cross-subdomain cookie support for api.bundlenudge.com -> www.bundlenudge.com
    advanced: {
      crossSubDomainCookies: {
        enabled: isProduction,
        domain: '.bundlenudge.com',
      },
      defaultCookieAttributes: {
        sameSite: isProduction ? 'none' : 'lax',
        secure: isProduction,
        httpOnly: true,
        path: '/',
      },
    },
  })
}

/**
 * Check if an email address belongs to an admin
 * Admins are identified by @bundlenudge.com email domain
 */
export function isAdmin(email: string | null | undefined): boolean {
  return email?.endsWith('@bundlenudge.com') ?? false
}
