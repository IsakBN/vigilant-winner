/**
 * Admin routes aggregator
 *
 * Combines all admin sub-routes and applies admin middleware
 *
 * @agent wave5-admin
 */

import { Hono } from 'hono'
import { authMiddleware } from '../../middleware/auth'
import { requireAdminMiddleware } from '../../middleware/admin'
import { adminUsersRouter } from './users'
import { adminAppsRouter } from './apps'
import { adminDashboardRouter } from './dashboard'
import type { Env } from '../../types/env'

/**
 * Admin routes - all protected by auth + admin middleware
 *
 * Routes:
 * - GET    /admin/users              - List users
 * - GET    /admin/users/:userId      - User details
 * - POST   /admin/users/:userId/override-limits - Set limits
 * - DELETE /admin/users/:userId/override-limits - Remove limits
 * - POST   /admin/users/:userId/suspend         - Suspend user
 * - DELETE /admin/users/:userId/suspend         - Unsuspend user
 *
 * - GET    /admin/apps               - List apps
 * - GET    /admin/apps/:appId        - App details
 * - POST   /admin/apps/:appId/disable           - Disable app
 * - DELETE /admin/apps/:appId/disable           - Enable app
 * - DELETE /admin/apps/:appId                   - Delete app
 *
 * - GET    /admin/dashboard/overview - Platform stats
 * - GET    /admin/dashboard/audit-log - Audit history
 * - GET    /admin/dashboard/health   - System health
 */
export const adminRouter = new Hono<{ Bindings: Env }>()

// Apply authentication middleware to all admin routes
adminRouter.use('*', authMiddleware)

// Apply admin verification middleware
adminRouter.use('*', requireAdminMiddleware)

// Mount sub-routers
adminRouter.route('/users', adminUsersRouter)
adminRouter.route('/apps', adminAppsRouter)
adminRouter.route('/dashboard', adminDashboardRouter)

// Re-export individual routers for testing
export { adminUsersRouter, adminAppsRouter, adminDashboardRouter }
