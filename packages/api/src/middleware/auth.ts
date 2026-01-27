/**
 * Session authentication middleware
 *
 * Validates both Better Auth sessions and custom Bearer tokens
 */

import { createMiddleware } from 'hono/factory'
import { createAuth, isAdmin } from '../lib/auth'
import { ERROR_CODES } from '@bundlenudge/shared'
import type { Env } from '../types/env'

export interface AuthUser {
  id: string
  email: string
  name: string | null
  isAdmin: boolean
}

export interface AuthSession {
  id: string
  expiresAt: Date
}

interface AuthVariables {
  user: AuthUser
  session: AuthSession
}

interface UserSessionRow {
  id: string
  user_id: string
  expires_at: number
}

interface UserRow {
  id: string
  email: string
  name: string | null
}

/**
 * Middleware that requires a valid user session
 * Supports both Better Auth sessions and custom Bearer tokens
 * Sets c.var.user and c.var.session on success
 */
export const authMiddleware = createMiddleware<{
  Bindings: Env
  Variables: AuthVariables
}>(async (c, next) => {
  // First, check for Bearer token in Authorization header
  const authHeader = c.req.header('Authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7)

    // Validate against user_sessions table
    const sessionRow = await c.env.DB.prepare(
      `SELECT id, user_id, expires_at FROM user_sessions WHERE token = ?`
    ).bind(token).first<UserSessionRow>()

    if (sessionRow) {
      const now = Math.floor(Date.now() / 1000)
      if (sessionRow.expires_at > now) {
        // Get user data
        const userRow = await c.env.DB.prepare(
          `SELECT id, email, name FROM users WHERE id = ?`
        ).bind(sessionRow.user_id).first<UserRow>()

        if (userRow) {
          c.set('user', {
            id: userRow.id,
            email: userRow.email,
            name: userRow.name,
            isAdmin: isAdmin(userRow.email),
          })

          c.set('session', {
            id: sessionRow.id,
            expiresAt: new Date(sessionRow.expires_at * 1000),
          })

          return next()
        }
      }
    }

    // Bearer token invalid or expired
    return c.json(
      { error: ERROR_CODES.UNAUTHORIZED, message: 'Invalid or expired token' },
      401
    )
  }

  // Fall back to Better Auth session
  try {
    const auth = createAuth(c.env)

    const session = await auth.api.getSession({
      headers: c.req.raw.headers,
    })

    if (!session?.user) {
      return c.json(
        { error: ERROR_CODES.UNAUTHORIZED, message: 'Authentication required' },
        401
      )
    }

    c.set('user', {
      id: session.user.id,
      email: session.user.email,
      name: (session.user.name as string | null | undefined) ?? null,
      isAdmin: isAdmin(session.user.email),
    })

    c.set('session', {
      id: session.session.id,
      expiresAt: session.session.expiresAt,
    })

    return next()
  } catch {
    // Better Auth may throw on missing/invalid session
    return c.json(
      { error: ERROR_CODES.UNAUTHORIZED, message: 'Authentication required' },
      401
    )
  }
})

/**
 * Middleware that requires admin access
 * Must be used after authMiddleware
 */
export const requireAdmin = createMiddleware<{
  Bindings: Env
  Variables: AuthVariables
}>(async (c, next) => {
  const user = c.get('user') as AuthUser | undefined

  if (!user) {
    return c.json(
      { error: ERROR_CODES.UNAUTHORIZED, message: 'Authentication required' },
      401
    )
  }

  if (!user.isAdmin) {
    return c.json(
      { error: ERROR_CODES.FORBIDDEN, message: 'Admin access required' },
      403
    )
  }

  return next()
})
