/**
 * @agent fix-rate-limiting
 * @modified 2026-01-25
 * @description Added rate limiting middleware to SDK endpoints
 *
 * @agent fix-validation
 * @modified 2026-01-25
 * @description Added body size limit middleware
 *
 * @agent remediate-auth-rate-limit
 * @modified 2026-01-25
 * @description Added rate limiting to auth routes
 *
 * @agent remediate-project-members
 * @modified 2026-01-25
 * @description Wired in apps routes with project members
 *
 * @agent wave5-admin
 * @modified 2026-01-25
 * @description Added admin authentication and management routes
 *
 * @agent health-reports
 * @modified 2026-01-25
 * @description Added health reports routes for app health monitoring
 *
 * @agent bundle-size-tracking
 * @modified 2026-01-25
 * @description Added bundle size tracking routes for monitoring bundle sizes
 *
 * @agent android-builds
 * @modified 2026-01-26
 * @description Added Android build system routes for managing app builds
 *
 * @agent queue-system
 * @modified 2026-01-26
 * @description Wired worker routes for build queue claim/status/heartbeat
 */

/**
 * BundleNudge API
 *
 * Cloudflare Workers API for OTA updates.
 */

import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'

import { updatesRouter } from './routes/updates'
import { devicesRouter, deviceManagementRouter, rollbackRouter, rollbackReportsRouter } from './routes/devices/index'
import { releasesRouter } from './routes/releases/index'
import { telemetryRouter } from './routes/telemetry'
import { appsRoutes } from './routes/apps/index'
import { channelsRouter } from './routes/channels'
import { subscriptionsRouter } from './routes/subscriptions'
import { invoicesRouter } from './routes/invoices'
import { teamsRouter } from './routes/teams'
import { integrationsRouter } from './routes/integrations'
import { githubRouter } from './routes/github'
import { githubWebhookRouter } from './routes/github/webhook'
import { authRoutes, emailAuthRoutes, githubLinkRoutes, passwordResetRoutes, verifyEmailRoutes } from './routes/auth'
import { adminAuthRouter } from './routes/admin-auth'
import { adminRouter } from './routes/admin'
import { metricsRouter } from './routes/metrics'
import { healthRouter } from './routes/health'
import { uploadsRouter } from './routes/uploads'
import { bundlesRouter } from './routes/bundles'
import { iosBuildRoutes, androidBuildsRouter } from './routes/builds'
import { workerRoutes } from './routes/worker'
import { realtimeRouter } from './routes/realtime'
import {
  rateLimitUpdates,
  rateLimitDevices,
  rateLimitTelemetry,
  rateLimitAuth,
} from './middleware/rate-limit'
import {
  bodySizeLimit,
  bundleUploadSizeLimit,
} from './middleware/body-size'
import { processScheduledEmails } from './lib/scheduled-email-processor'

import type { Env } from './types/env'

const app = new Hono<{ Bindings: Env }>()

// Middleware
app.use('*', logger())
app.use('*', cors())

// Health check
app.get('/', (c) => c.json({ status: 'ok', service: 'bundlenudge-api' }))
app.get('/health', (c) => c.json({ status: 'healthy' }))

// Body size limits - general 1MB limit, except for bundle uploads (50MB)
app.use('/v1/releases/*/bundle', bundleUploadSizeLimit)
app.use('/v1/*', bodySizeLimit)

// SDK routes with rate limiting
app.use('/v1/updates/*', rateLimitUpdates)
app.use('/v1/devices/*', rateLimitDevices)
app.use('/v1/telemetry/*', rateLimitTelemetry)

// Auth routes with rate limiting (prevents brute force, OTP guessing, OAuth abuse)
app.use('/api/auth/*', rateLimitAuth)
app.use('/v1/auth/github/*', rateLimitAuth)
app.use('/v1/auth/email/*', rateLimitAuth)
app.use('/v1/auth/password/*', rateLimitAuth)
app.use('/v1/auth/verify-email/*', rateLimitAuth)
app.use('/v1/github/callback', rateLimitAuth)
app.use('/v1/github/install', rateLimitAuth)
app.route('/api/auth', authRoutes)
app.route('/v1/auth/email', emailAuthRoutes)
app.route('/v1/auth/github', githubLinkRoutes)
app.route('/v1/auth/password', passwordResetRoutes)
app.route('/v1/auth/verify-email', verifyEmailRoutes)

// API routes
app.route('/v1/updates', updatesRouter)
app.route('/v1/devices', devicesRouter)
app.route('/v1/devices', rollbackRouter)
app.route('/v1/releases', releasesRouter)
app.route('/v1/releases', rollbackReportsRouter)
app.route('/v1/telemetry', telemetryRouter)
app.route('/v1/apps', appsRoutes)
app.route('/v1/apps', channelsRouter)
app.route('/v1/subscriptions', subscriptionsRouter)
app.route('/v1/invoices', invoicesRouter)
app.route('/v1/teams', teamsRouter)
app.route('/v1/apps', integrationsRouter)
app.route('/v1/apps', deviceManagementRouter)
app.route('/v1/github', githubRouter)
app.route('/v1/github/webhook', githubWebhookRouter)
app.route('/v1/apps', metricsRouter)
app.route('/v1/apps', healthRouter)
app.route('/v1/uploads', uploadsRouter)
app.route('/v1/apps', bundlesRouter)
app.route('/v1/apps', iosBuildRoutes)
app.route('/v1/apps', androidBuildsRouter)
app.route('/v1', workerRoutes)
app.route('/v1/realtime', realtimeRouter)

// Admin routes (OTP-based auth, no rate limiting on auth routes themselves)
app.use('/v1/admin-auth/*', rateLimitAuth)
app.route('/v1/admin-auth', adminAuthRouter)
app.route('/v1/admin', adminRouter)

// 404 handler
app.notFound((c) => c.json({ error: 'not_found', message: 'Route not found' }, 404))

// Error handler
app.onError((err, c) => {
  console.error('Unhandled error:', err)
  return c.json({ error: 'internal_error', message: 'Internal server error' }, 500)
})

// Durable Object exports (required by Cloudflare Workers)
export { RealtimeDO } from './durable-objects'

// Export app for testing
export { app }

// eslint-disable-next-line no-restricted-syntax
export default {
  fetch: app.fetch,

  /**
   * Scheduled handler for cron jobs
   * Processes scheduled emails (follow-ups, reminders, etc.)
   */
  async scheduled(
    _event: ScheduledEvent,
    env: Env,
    ctx: ExecutionContext
  ): Promise<void> {
    ctx.waitUntil(processScheduledEmails(env))
  },
}
