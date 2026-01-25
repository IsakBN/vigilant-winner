/**
 * BundleNudge API
 *
 * Cloudflare Workers API for OTA updates.
 */

import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'

import { updatesRouter } from './routes/updates'
import { devicesRouter } from './routes/devices'
import { releasesRouter } from './routes/releases'
import { telemetryRouter } from './routes/telemetry'
import { appsRouter } from './routes/apps'
import { subscriptionsRouter } from './routes/subscriptions'
import { teamsRouter } from './routes/teams'

import type { Env } from './types/env'

const app = new Hono<{ Bindings: Env }>()

// Middleware
app.use('*', logger())
app.use('*', cors())

// Health check
app.get('/', (c) => c.json({ status: 'ok', service: 'bundlenudge-api' }))
app.get('/health', (c) => c.json({ status: 'healthy' }))

// API routes
app.route('/v1/updates', updatesRouter)
app.route('/v1/devices', devicesRouter)
app.route('/v1/releases', releasesRouter)
app.route('/v1/telemetry', telemetryRouter)
app.route('/v1/apps', appsRouter)
app.route('/v1/subscriptions', subscriptionsRouter)
app.route('/v1/teams', teamsRouter)

// 404 handler
app.notFound((c) => c.json({ error: 'not_found', message: 'Route not found' }, 404))

// Error handler
app.onError((err, c) => {
  console.error('Unhandled error:', err)
  return c.json({ error: 'internal_error', message: 'Internal server error' }, 500)
})

export default app
