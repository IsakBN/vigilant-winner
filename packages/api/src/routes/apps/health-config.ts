/**
 * Health Config routes for apps
 *
 * Endpoints:
 * - POST /apps/:appId/health-config - Save health check configuration
 * - GET /apps/:appId/health-config - Get health check configuration
 *
 * @agent wave4a-health-config
 * @created 2026-01-26
 */

import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { ERROR_CODES } from '@bundlenudge/shared'
import { authMiddleware, type AuthUser } from '../../middleware/auth'
import type { Env } from '../../types/env'

/** Maximum timeout for critical events (5 minutes) */
const MAX_EVENT_TIMEOUT_MS = 300000

/** Minimum timeout for critical events (1 second) */
const MIN_EVENT_TIMEOUT_MS = 1000

/** Maximum number of critical events */
const MAX_EVENTS = 20

/** Maximum number of critical endpoints */
const MAX_ENDPOINTS = 20

/** Default health config */
const DEFAULT_HEALTH_CONFIG = {
  events: [{ name: 'onAppReady', required: true, timeoutMs: 30000 }],
  endpoints: [],
}

interface AuthVariables {
  user: AuthUser
}

interface HealthConfigRow {
  id: string
  app_id: string
  config: string
  created_at: number
  updated_at: number
}

/**
 * Zod schema for critical events
 */
const criticalEventSchema = z.object({
  name: z.string()
    .min(1, 'Event name is required')
    .max(100, 'Event name must be at most 100 characters')
    .regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, 'Event name must start with a letter and contain only alphanumeric characters and underscores'),
  required: z.boolean(),
  timeoutMs: z.number()
    .int('Timeout must be an integer')
    .min(MIN_EVENT_TIMEOUT_MS, `Timeout must be at least ${MIN_EVENT_TIMEOUT_MS}ms`)
    .max(MAX_EVENT_TIMEOUT_MS, `Timeout must be at most ${MAX_EVENT_TIMEOUT_MS}ms`),
})

/**
 * Zod schema for critical endpoints
 */
const criticalEndpointSchema = z.object({
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE']),
  url: z.string()
    .min(1, 'URL is required')
    .max(500, 'URL must be at most 500 characters')
    .regex(/^\/[a-zA-Z0-9/_\-.?&=]*$/, 'URL must be a valid relative path starting with /'),
  expectedStatus: z.array(z.number().int().min(100).max(599))
    .min(1, 'At least one expected status code is required')
    .max(10, 'At most 10 expected status codes allowed'),
  required: z.boolean(),
})

/**
 * Zod schema for health config
 */
const healthConfigSchema = z.object({
  events: z.array(criticalEventSchema)
    .max(MAX_EVENTS, `At most ${MAX_EVENTS} events allowed`)
    .default([]),
  endpoints: z.array(criticalEndpointSchema)
    .max(MAX_ENDPOINTS, `At most ${MAX_ENDPOINTS} endpoints allowed`)
    .default([]),
})

const appIdParamsSchema = z.object({
  appId: z.string().uuid(),
})

export type CriticalEvent = z.infer<typeof criticalEventSchema>
export type CriticalEndpoint = z.infer<typeof criticalEndpointSchema>
export type HealthConfig = z.infer<typeof healthConfigSchema>

export const healthConfigRoutes = new Hono<{ Bindings: Env; Variables: AuthVariables }>()

// All routes require authentication
healthConfigRoutes.use('*', authMiddleware)

/**
 * GET /apps/:appId/health-config
 * Get health check configuration for an app
 */
healthConfigRoutes.get(
  '/',
  zValidator('param', appIdParamsSchema),
  async (c) => {
    const user = c.get('user')
    const { appId } = c.req.valid('param')

    // Verify app ownership
    const app = await c.env.DB.prepare(
      'SELECT id FROM apps WHERE id = ? AND owner_id = ? AND deleted_at IS NULL'
    ).bind(appId, user.id).first()

    if (!app) {
      return c.json(
        { error: ERROR_CODES.APP_NOT_FOUND, message: 'App not found' },
        404
      )
    }

    // Get health config
    const configRow = await c.env.DB.prepare(
      'SELECT * FROM health_configs WHERE app_id = ?'
    ).bind(appId).first<HealthConfigRow>()

    if (!configRow) {
      return c.json({ config: DEFAULT_HEALTH_CONFIG })
    }

    const config = JSON.parse(configRow.config) as HealthConfig
    return c.json({ config })
  }
)

/**
 * POST /apps/:appId/health-config
 * Save health check configuration for an app
 */
healthConfigRoutes.post(
  '/',
  zValidator('param', appIdParamsSchema),
  zValidator('json', healthConfigSchema),
  async (c) => {
    const user = c.get('user')
    const { appId } = c.req.valid('param')
    const config = c.req.valid('json')

    // Verify app ownership
    const app = await c.env.DB.prepare(
      'SELECT id FROM apps WHERE id = ? AND owner_id = ? AND deleted_at IS NULL'
    ).bind(appId, user.id).first()

    if (!app) {
      return c.json(
        { error: ERROR_CODES.APP_NOT_FOUND, message: 'App not found' },
        404
      )
    }

    const now = Math.floor(Date.now() / 1000)
    const configJson = JSON.stringify(config)

    // Check if config already exists
    const existingConfig = await c.env.DB.prepare(
      'SELECT id FROM health_configs WHERE app_id = ?'
    ).bind(appId).first<{ id: string }>()

    if (existingConfig) {
      // Update existing config
      await c.env.DB.prepare(
        'UPDATE health_configs SET config = ?, updated_at = ? WHERE app_id = ?'
      ).bind(configJson, now, appId).run()
    } else {
      // Insert new config
      const configId = crypto.randomUUID()
      await c.env.DB.prepare(`
        INSERT INTO health_configs (id, app_id, config, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?)
      `).bind(configId, appId, configJson, now, now).run()
    }

    return c.json({ success: true, config })
  }
)
