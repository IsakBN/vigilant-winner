/**
 * Integrations CRUD Routes
 *
 * Manages third-party crash reporting and notification integrations.
 */

import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { ERROR_CODES } from '@bundlenudge/shared'
import { authMiddleware, type AuthUser } from '../../middleware/auth'
import type { Env } from '../../types/env'
import { encrypt, decrypt } from '../../lib/encryption'
import { testIntegration, type IntegrationProvider } from '../../lib/integrations'

// =============================================================================
// Schemas
// =============================================================================

const createIntegrationSchema = z.object({
  provider: z.enum(['sentry', 'bugsnag', 'crashlytics', 'slack', 'discord']),
  config: z.record(z.string()),
})

const updateIntegrationSchema = z.object({
  config: z.record(z.string()).optional(),
  isActive: z.boolean().optional(),
})

// =============================================================================
// Types
// =============================================================================

interface IntegrationRow {
  id: string
  app_id: string
  provider: string
  config: string
  is_active: number
  last_triggered_at: number | null
  created_at: number
  updated_at: number
}

interface AuthVariables {
  user: AuthUser
}

// =============================================================================
// Router
// =============================================================================

export const integrationsRouter = new Hono<{ Bindings: Env; Variables: AuthVariables }>()

// All routes require authentication
integrationsRouter.use('*', authMiddleware)

/**
 * GET /v1/apps/:appId/integrations
 * List integrations for an app
 */
integrationsRouter.get('/:appId/integrations', async (c) => {
  const user = c.get('user')
  const appId = c.req.param('appId')

  // Verify app ownership
  const app = await c.env.DB.prepare(
    'SELECT id FROM apps WHERE id = ? AND owner_id = ? AND deleted_at IS NULL'
  ).bind(appId, user.id).first()

  if (!app) {
    return c.json({ error: ERROR_CODES.NOT_FOUND, message: 'App not found' }, 404)
  }

  const results = await c.env.DB.prepare(`
    SELECT id, app_id, provider, is_active, last_triggered_at, created_at, updated_at
    FROM crash_integrations
    WHERE app_id = ?
    ORDER BY created_at DESC
  `).bind(appId).all<IntegrationRow>()

  return c.json({
    integrations: results.results.map(formatIntegration),
  })
})

/**
 * GET /v1/apps/:appId/integrations/:integrationId
 * Get a single integration
 */
integrationsRouter.get('/:appId/integrations/:integrationId', async (c) => {
  const user = c.get('user')
  const appId = c.req.param('appId')
  const integrationId = c.req.param('integrationId')

  // Verify app ownership
  const app = await c.env.DB.prepare(
    'SELECT id FROM apps WHERE id = ? AND owner_id = ? AND deleted_at IS NULL'
  ).bind(appId, user.id).first()

  if (!app) {
    return c.json({ error: ERROR_CODES.NOT_FOUND, message: 'App not found' }, 404)
  }

  const integration = await c.env.DB.prepare(`
    SELECT id, app_id, provider, is_active, last_triggered_at, created_at, updated_at
    FROM crash_integrations
    WHERE id = ? AND app_id = ?
  `).bind(integrationId, appId).first<IntegrationRow>()

  if (!integration) {
    return c.json({ error: ERROR_CODES.NOT_FOUND, message: 'Integration not found' }, 404)
  }

  return c.json({ integration: formatIntegration(integration) })
})

/**
 * POST /v1/apps/:appId/integrations
 * Create an integration
 */
integrationsRouter.post(
  '/:appId/integrations',
  zValidator('json', createIntegrationSchema),
  async (c) => {
    const user = c.get('user')
    const appId = c.req.param('appId')
    const body = c.req.valid('json')

    // Verify app ownership
    const app = await c.env.DB.prepare(
      'SELECT id FROM apps WHERE id = ? AND owner_id = ? AND deleted_at IS NULL'
    ).bind(appId, user.id).first()

    if (!app) {
      return c.json({ error: ERROR_CODES.NOT_FOUND, message: 'App not found' }, 404)
    }

    // Check if integration already exists for this provider
    const existing = await c.env.DB.prepare(
      'SELECT id FROM crash_integrations WHERE app_id = ? AND provider = ?'
    ).bind(appId, body.provider).first()

    if (existing) {
      return c.json(
        {
          error: 'already_exists',
          message: `${body.provider} integration already exists`,
        },
        409
      )
    }

    // Encrypt sensitive config
    const encryptedConfig = await encrypt(
      JSON.stringify(body.config),
      c.env.ENCRYPTION_KEY
    )

    const integrationId = crypto.randomUUID()
    const now = Math.floor(Date.now() / 1000)

    await c.env.DB.prepare(`
      INSERT INTO crash_integrations (id, app_id, provider, config, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, 1, ?, ?)
    `).bind(integrationId, appId, body.provider, encryptedConfig, now, now).run()

    return c.json(
      {
        integration: {
          id: integrationId,
          appId,
          provider: body.provider,
          isActive: true,
          lastTriggeredAt: null,
          createdAt: now,
          updatedAt: now,
        },
      },
      201
    )
  }
)

/**
 * PATCH /v1/apps/:appId/integrations/:integrationId
 * Update an integration
 */
integrationsRouter.patch(
  '/:appId/integrations/:integrationId',
  zValidator('json', updateIntegrationSchema),
  async (c) => {
    const user = c.get('user')
    const appId = c.req.param('appId')
    const integrationId = c.req.param('integrationId')
    const body = c.req.valid('json')

    // Verify app ownership
    const app = await c.env.DB.prepare(
      'SELECT id FROM apps WHERE id = ? AND owner_id = ? AND deleted_at IS NULL'
    ).bind(appId, user.id).first()

    if (!app) {
      return c.json({ error: ERROR_CODES.NOT_FOUND, message: 'App not found' }, 404)
    }

    const existing = await c.env.DB.prepare(
      'SELECT * FROM crash_integrations WHERE id = ? AND app_id = ?'
    ).bind(integrationId, appId).first<IntegrationRow>()

    if (!existing) {
      return c.json({ error: ERROR_CODES.NOT_FOUND, message: 'Integration not found' }, 404)
    }

    const updates: string[] = []
    const values: (string | number)[] = []

    if (body.config !== undefined) {
      const encryptedConfig = await encrypt(
        JSON.stringify(body.config),
        c.env.ENCRYPTION_KEY
      )
      updates.push('config = ?')
      values.push(encryptedConfig)
    }

    if (body.isActive !== undefined) {
      updates.push('is_active = ?')
      values.push(body.isActive ? 1 : 0)
    }

    if (updates.length > 0) {
      const now = Math.floor(Date.now() / 1000)
      updates.push('updated_at = ?')
      values.push(now)
      values.push(integrationId)
      values.push(appId)

      await c.env.DB.prepare(`
        UPDATE crash_integrations SET ${updates.join(', ')} WHERE id = ? AND app_id = ?
      `).bind(...values).run()
    }

    const integration = await c.env.DB.prepare(`
      SELECT id, app_id, provider, is_active, last_triggered_at, created_at, updated_at
      FROM crash_integrations
      WHERE id = ?
    `).bind(integrationId).first<IntegrationRow>()

    return c.json({ integration: formatIntegration(integration!) })
  }
)

/**
 * DELETE /v1/apps/:appId/integrations/:integrationId
 * Delete an integration
 */
integrationsRouter.delete('/:appId/integrations/:integrationId', async (c) => {
  const user = c.get('user')
  const appId = c.req.param('appId')
  const integrationId = c.req.param('integrationId')

  // Verify app ownership
  const app = await c.env.DB.prepare(
    'SELECT id FROM apps WHERE id = ? AND owner_id = ? AND deleted_at IS NULL'
  ).bind(appId, user.id).first()

  if (!app) {
    return c.json({ error: ERROR_CODES.NOT_FOUND, message: 'App not found' }, 404)
  }

  const result = await c.env.DB.prepare(
    'DELETE FROM crash_integrations WHERE id = ? AND app_id = ?'
  ).bind(integrationId, appId).run()

  if (!result.meta.changes) {
    return c.json({ error: ERROR_CODES.NOT_FOUND, message: 'Integration not found' }, 404)
  }

  return c.json({ success: true })
})

/**
 * POST /v1/apps/:appId/integrations/:integrationId/test
 * Test an integration
 */
integrationsRouter.post('/:appId/integrations/:integrationId/test', async (c) => {
  const user = c.get('user')
  const appId = c.req.param('appId')
  const integrationId = c.req.param('integrationId')

  // Verify app ownership
  const app = await c.env.DB.prepare(
    'SELECT id FROM apps WHERE id = ? AND owner_id = ? AND deleted_at IS NULL'
  ).bind(appId, user.id).first()

  if (!app) {
    return c.json({ error: ERROR_CODES.NOT_FOUND, message: 'App not found' }, 404)
  }

  const integration = await c.env.DB.prepare(
    'SELECT * FROM crash_integrations WHERE id = ? AND app_id = ?'
  ).bind(integrationId, appId).first<IntegrationRow>()

  if (!integration) {
    return c.json({ error: ERROR_CODES.NOT_FOUND, message: 'Integration not found' }, 404)
  }

  // Decrypt config
  const config = JSON.parse(
    await decrypt(integration.config, c.env.ENCRYPTION_KEY)
  ) as Record<string, string>

  // Test the integration
  const result = await testIntegration(integration.provider as IntegrationProvider, config)

  return c.json(result)
})

// =============================================================================
// Helpers
// =============================================================================

interface FormattedIntegration {
  id: string
  appId: string
  provider: string
  isActive: boolean
  lastTriggeredAt: number | null
  createdAt: number
  updatedAt: number
}

function formatIntegration(integration: IntegrationRow): FormattedIntegration {
  return {
    id: integration.id,
    appId: integration.app_id,
    provider: integration.provider,
    isActive: integration.is_active === 1,
    lastTriggeredAt: integration.last_triggered_at,
    createdAt: integration.created_at,
    updatedAt: integration.updated_at,
  }
}
