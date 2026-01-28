/**
 * Authentication routes
 *
 * Handles Better Auth endpoints at /api/auth/*
 * Includes email allowlist middleware for admin OTP
 */

import { Hono } from 'hono'
import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import { createAuth } from '../../lib/auth'
import * as schema from '../../lib/auth-schema'
import type { Env } from '../../types/env'

export const authRoutes = new Hono<{ Bindings: Env }>()

/**
 * Check if email is in the allowlist
 * SECURITY: Returns false if table is empty (fail closed)
 */
async function isEmailAllowed(email: string, databaseUrl: string): Promise<boolean> {
  const client = postgres(databaseUrl)
  const db = drizzle(client, { schema })

  try {
    const patterns = await db.select().from(schema.emailAllowlist)

    // Fail closed: if no patterns, reject all
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
  } finally {
    await client.end()
  }
}

/**
 * Intercept OTP send request to validate email allowlist BEFORE Better Auth
 * Returns 400 for unauthorized emails (blocks the request entirely)
 */
authRoutes.post('/email-otp/send-verification-otp', async (c) => {
  let bodyText: string
  let body: { email?: string }

  try {
    // Read body as text so we can re-use it
    bodyText = await c.req.text()
    body = JSON.parse(bodyText) as { email?: string }
  } catch {
    return c.json({ error: 'Invalid request body' }, 400)
  }

  const email = body.email

  if (!email || typeof email !== 'string') {
    return c.json({ error: 'Email is required' }, 400)
  }

  // Check allowlist
  try {
    const allowed = await isEmailAllowed(email, c.env.DATABASE_URL)

    if (!allowed) {
      console.log(`[AUTH] Blocked unauthorized email: ${email}`)
      return c.json({ error: 'Email not authorized for admin access' }, 400)
    }

    console.log(`[AUTH] Email allowed, forwarding to Better Auth: ${email}`)
  } catch (error) {
    console.error('[AUTH] Allowlist check error:', error)
    // Fail closed on error
    return c.json({ error: 'Authorization check failed' }, 500)
  }

  // Email is allowed - create new request with body for Better Auth
  const auth = createAuth(c.env)
  const newRequest = new Request(c.req.raw.url, {
    method: c.req.raw.method,
    headers: c.req.raw.headers,
    body: bodyText,
  })

  return auth.handler(newRequest)
})

/**
 * Handle all other Better Auth routes
 * Better Auth manages its own routing under this path
 */
authRoutes.all('/*', async (c) => {
  const auth = createAuth(c.env)
  return auth.handler(c.req.raw)
})
