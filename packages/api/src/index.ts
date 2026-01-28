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

import { updatesRouter } from './routes/updates/index'
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
import { emailAuthRoutes, githubLinkRoutes, passwordResetRoutes, verifyEmailRoutes } from './routes/auth'
import { createAuth } from './lib/auth'
import { adminAuthRouter } from './routes/admin-auth'
import { adminRouter } from './routes/admin'
import { metricsRouter } from './routes/metrics'
import { healthRouter } from './routes/health'
import { uploadsRouter } from './routes/uploads'
import { bundlesRouter } from './routes/bundles'
import { iosBuildRoutes, androidBuildsRouter } from './routes/builds'
import { workerRoutes } from './routes/worker'
import { realtimeRouter } from './routes/realtime'
import { testersRouter } from './routes/testers'
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

// Allowed origins for CORS with credentials
const ALLOWED_ORIGINS = [
  // Production subdomains
  'https://app.bundlenudge.com',
  'https://admin.bundlenudge.com',
  'https://bundlenudge.com',
  'https://www.bundlenudge.com',
  // Development
  'http://localhost:3000',  // landing page
  'http://localhost:3001',  // app-dashboard
  'http://localhost:3002',  // admin-dashboard
]

// Middleware
app.use('*', logger())
app.use('*', cors({
  origin: (origin) => {
    // Allow requests with no origin (like mobile apps, curl, etc.)
    if (!origin) return '*'
    // Check if origin is in allowed list
    if (ALLOWED_ORIGINS.includes(origin)) return origin
    // For other origins, don't allow credentials
    return '*'
  },
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposeHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
  maxAge: 86400,
}))

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

// Better Auth routes
// Note: We manually handle CORS because Better Auth returns a raw Response
// that bypasses Hono's middleware chain
app.all('/api/auth/*', async (c) => {
  // DEBUG: Log env vars to diagnose "Invalid URL string" error
  console.log('[AUTH DEBUG] API_URL:', c.env.API_URL)
  console.log('[AUTH DEBUG] DASHBOARD_URL:', c.env.DASHBOARD_URL)
  console.log('[AUTH DEBUG] DATABASE_URL exists:', !!c.env.DATABASE_URL)
  console.log('[AUTH DEBUG] DATABASE_URL starts with:', c.env.DATABASE_URL?.substring(0, 30))
  console.log('[AUTH DEBUG] Request path:', c.req.path)
  console.log('[AUTH DEBUG] Request method:', c.req.method)

  const origin = c.req.header('Origin')

  const allowedOrigins = [
    c.env.DASHBOARD_URL,
    // Production subdomains
    'https://app.bundlenudge.com',
    'https://admin.bundlenudge.com',
    'https://bundlenudge.com',
    'https://www.bundlenudge.com',
    // Development
    'http://localhost:3000',  // landing page
    'http://localhost:3001',  // app-dashboard
    'http://localhost:3002',  // admin-dashboard
  ].filter(Boolean)

  const isAllowed = origin && allowedOrigins.includes(origin)

  // Handle CORS preflight
  if (c.req.method === 'OPTIONS' && isAllowed) {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
      },
    })
  }

  const auth = createAuth(c.env)
  let response: Response
  try {
    response = await auth.handler(c.req.raw)
  } catch (err) {
    console.error('[AUTH ERROR] Caught exception:', err)
    console.error('[AUTH ERROR] Stack:', err instanceof Error ? err.stack : 'no stack')
    throw err
  }

  // Add CORS headers to the response from Better Auth
  if (isAllowed) {
    const newHeaders = new Headers(response.headers)
    newHeaders.set('Access-Control-Allow-Origin', origin)
    newHeaders.set('Access-Control-Allow-Credentials', 'true')

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    })
  }

  return response
})
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
app.route('/v1/testers', testersRouter)

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
