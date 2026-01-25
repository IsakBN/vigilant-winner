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
import { adminSubscriptionsRouter } from './subscriptions'
import type { Env } from '../../types/env'

/**
 * Admin routes - all protected by auth + admin middleware
 *
 * Routes:
 * - GET    /admin/users              - List users with pagination
 * - GET    /admin/users/:userId      - User details with stats
 * - PATCH  /admin/users/:userId      - Update user (ban, change plan)
 * - DELETE /admin/users/:userId      - Soft delete user
 *
 * - GET    /admin/apps               - List apps
 * - GET    /admin/apps/:appId        - App details
 * - POST   /admin/apps/:appId/disable           - Disable app
 * - DELETE /admin/apps/:appId/disable           - Enable app
 * - DELETE /admin/apps/:appId                   - Delete app
 *
 * - GET    /admin/dashboard/overview  - System overview metrics (cached 5 min)
 * - GET    /admin/dashboard/activity  - Recent activity feed (paginated)
 * - GET    /admin/dashboard/alerts    - System alerts and warnings
 *
 * - GET    /admin/subscriptions              - List subscriptions
 * - GET    /admin/subscriptions/plans        - List plans
 * - PATCH  /admin/subscriptions/:id          - Update subscription
 * - POST   /admin/subscriptions/grant        - Grant subscription
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
adminRouter.route('/subscriptions', adminSubscriptionsRouter)

// Re-export individual routers for testing
export { adminUsersRouter, adminAppsRouter, adminDashboardRouter, adminSubscriptionsRouter }
