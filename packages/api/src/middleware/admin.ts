/**
 * Admin authentication middleware
 *
 * Validates admin sessions and sets context for audit logging
 *
 * @agent wave5-admin
 */

import { createMiddleware } from 'hono/factory'
import { ERROR_CODES } from '@bundlenudge/shared'
import { isAdmin } from '../lib/auth'
import type { Env } from '../types/env'

const ADMIN_DOMAIN = '@bundlenudge.com'

export interface AdminUser {
  id: string
  email: string
  name: string | null
  isAdmin: true
}

interface AdminVariables {
  adminUser: AdminUser
  adminId: string
}

/**
 * Middleware that requires a valid admin session
 *
 * - Verifies user is authenticated
 * - Verifies email domain is @bundlenudge.com
 * - Sets adminUser and adminId in context
 *
 * Use this middleware on all /admin/* routes
 */
export const requireAdminMiddleware = createMiddleware<{
  Bindings: Env
  Variables: AdminVariables & { user?: { id: string; email: string | null; name: string | null; isAdmin: boolean } }
}>(async (c, next) => {
  // Get user from existing auth middleware
  const user = c.get('user')

  // Check if user is authenticated
  if (!user) {
    return c.json(
      { error: ERROR_CODES.UNAUTHORIZED, message: 'Authentication required' },
      401
    )
  }

  // Check if email domain is admin domain
  if (!user.email?.endsWith(ADMIN_DOMAIN)) {
    return c.json(
      { error: ERROR_CODES.FORBIDDEN, message: 'Admin access required' },
      403
    )
  }

  // Verify isAdmin flag is set correctly
  if (!isAdmin(user.email)) {
    return c.json(
      { error: ERROR_CODES.FORBIDDEN, message: 'Admin access required' },
      403
    )
  }

  // Set admin context for downstream handlers
  const adminUser: AdminUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    isAdmin: true,
  }

  c.set('adminUser', adminUser)
  c.set('adminId', user.id)

  return next()
})

/**
 * Helper to get admin user from context
 * Throws if called without admin middleware
 */
export function getAdminUser(c: { get: (key: 'adminUser') => AdminUser | undefined }): AdminUser {
  const adminUser = c.get('adminUser')
  if (!adminUser) {
    throw new Error('Admin middleware not applied')
  }
  return adminUser
}

/**
 * Helper to get admin ID from context for audit logging
 */
export function getAdminId(c: { get: (key: 'adminId') => string | undefined }): string {
  const adminId = c.get('adminId')
  if (!adminId) {
    throw new Error('Admin middleware not applied')
  }
  return adminId
}

/**
 * Validates email is from admin domain
 */
export function isAdminEmail(email: string): boolean {
  return email.endsWith(ADMIN_DOMAIN)
}
