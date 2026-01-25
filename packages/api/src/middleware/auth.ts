/**
 * Session authentication middleware
 *
 * Validates Better Auth sessions and sets user context
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

/**
 * Middleware that requires a valid user session
 * Sets c.var.user and c.var.session on success
 */
export const authMiddleware = createMiddleware<{
  Bindings: Env
  Variables: AuthVariables
}>(async (c, next) => {
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
