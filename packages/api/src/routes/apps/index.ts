/**
 * Apps CRUD routes
 *
 * Handles app registration and management
 */

import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { nanoid } from 'nanoid'
import { createAppSchema, updateAppSchema, ERROR_CODES } from '@bundlenudge/shared'
import { authMiddleware, type AuthUser } from '../../middleware/auth'
import type { Env } from '../../types/env'

const API_KEY_PREFIX = 'bn_'
const API_KEY_LENGTH = 32

interface AppRow {
  id: string
  name: string
  bundle_id: string | null
  platform: 'ios' | 'android'
  owner_id: string
  api_key: string
  webhook_secret: string
  settings: string | null
  created_at: number
  updated_at: number
  deleted_at: number | null
  release_count?: number
  device_count?: number
}

interface AuthVariables {
  user: AuthUser
}

export const appsRoutes = new Hono<{ Bindings: Env; Variables: AuthVariables }>()

// All routes require authentication
appsRoutes.use('*', authMiddleware)

/**
 * List user's apps
 */
appsRoutes.get('/', async (c) => {
  const user = c.get('user')

  const results = await c.env.DB.prepare(`
    SELECT
      a.*,
      (SELECT COUNT(*) FROM releases WHERE app_id = a.id) as release_count,
      (SELECT COUNT(*) FROM devices WHERE app_id = a.id) as device_count
    FROM apps a
    WHERE a.owner_id = ? AND a.deleted_at IS NULL
    ORDER BY a.created_at DESC
  `).bind(user.id).all<AppRow>()

  return c.json({ apps: results.results ?? [] })
})

/**
 * Get single app by ID
 */
appsRoutes.get('/:appId', async (c) => {
  const user = c.get('user')
  const appId = c.req.param('appId')

  const app = await c.env.DB.prepare(`
    SELECT
      a.*,
      (SELECT COUNT(*) FROM releases WHERE app_id = a.id) as release_count,
      (SELECT COUNT(*) FROM devices WHERE app_id = a.id) as device_count
    FROM apps a
    WHERE a.id = ? AND a.owner_id = ? AND a.deleted_at IS NULL
  `).bind(appId, user.id).first<AppRow>()

  if (!app) {
    return c.json(
      { error: ERROR_CODES.APP_NOT_FOUND, message: 'App not found' },
      404
    )
  }

  return c.json({ app })
})

/**
 * Create new app
 */
appsRoutes.post('/', zValidator('json', createAppSchema), async (c) => {
  const user = c.get('user')
  const data = c.req.valid('json')

  const appId = crypto.randomUUID()
  const apiKey = `${API_KEY_PREFIX}${nanoid(API_KEY_LENGTH)}`
  const webhookSecret = `whsec_${nanoid(API_KEY_LENGTH)}`
  const now = Math.floor(Date.now() / 1000)

  await c.env.DB.prepare(`
    INSERT INTO apps (id, owner_id, name, platform, bundle_id, api_key, webhook_secret, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    appId,
    user.id,
    data.name,
    data.platform,
    data.bundleId ?? null,
    apiKey,
    webhookSecret,
    now,
    now
  ).run()

  const app = await c.env.DB.prepare(
    'SELECT * FROM apps WHERE id = ?'
  ).bind(appId).first<AppRow>()

  return c.json({ app }, 201)
})

/**
 * Update app
 */
appsRoutes.patch('/:appId', zValidator('json', updateAppSchema), async (c) => {
  const user = c.get('user')
  const appId = c.req.param('appId')
  const data = c.req.valid('json')

  // Verify ownership
  const existing = await c.env.DB.prepare(
    'SELECT * FROM apps WHERE id = ? AND owner_id = ? AND deleted_at IS NULL'
  ).bind(appId, user.id).first<AppRow>()

  if (!existing) {
    return c.json(
      { error: ERROR_CODES.APP_NOT_FOUND, message: 'App not found' },
      404
    )
  }

  const updates: string[] = []
  const values: (string | null)[] = []

  if (data.name !== undefined) {
    updates.push('name = ?')
    values.push(data.name)
  }
  if (data.bundleId !== undefined) {
    updates.push('bundle_id = ?')
    values.push(data.bundleId)
  }

  if (updates.length === 0) {
    return c.json({ app: existing })
  }

  const now = Math.floor(Date.now() / 1000)
  updates.push('updated_at = ?')
  values.push(String(now))
  values.push(appId)
  values.push(user.id)

  await c.env.DB.prepare(`
    UPDATE apps SET ${updates.join(', ')} WHERE id = ? AND owner_id = ?
  `).bind(...values).run()

  const app = await c.env.DB.prepare(
    'SELECT * FROM apps WHERE id = ?'
  ).bind(appId).first<AppRow>()

  return c.json({ app })
})

/**
 * Delete app (soft delete)
 */
appsRoutes.delete('/:appId', async (c) => {
  const user = c.get('user')
  const appId = c.req.param('appId')

  // Verify ownership
  const existing = await c.env.DB.prepare(
    'SELECT * FROM apps WHERE id = ? AND owner_id = ? AND deleted_at IS NULL'
  ).bind(appId, user.id).first<AppRow>()

  if (!existing) {
    return c.json(
      { error: ERROR_CODES.APP_NOT_FOUND, message: 'App not found' },
      404
    )
  }

  const now = Math.floor(Date.now() / 1000)

  // Soft delete the app
  await c.env.DB.prepare(
    'UPDATE apps SET deleted_at = ?, updated_at = ? WHERE id = ?'
  ).bind(now, now, appId).run()

  return c.json({ success: true })
})

/**
 * Regenerate API key
 */
appsRoutes.post('/:appId/regenerate-key', async (c) => {
  const user = c.get('user')
  const appId = c.req.param('appId')

  const existing = await c.env.DB.prepare(
    'SELECT * FROM apps WHERE id = ? AND owner_id = ? AND deleted_at IS NULL'
  ).bind(appId, user.id).first<AppRow>()

  if (!existing) {
    return c.json(
      { error: ERROR_CODES.APP_NOT_FOUND, message: 'App not found' },
      404
    )
  }

  const newApiKey = `${API_KEY_PREFIX}${nanoid(API_KEY_LENGTH)}`
  const now = Math.floor(Date.now() / 1000)

  await c.env.DB.prepare(
    'UPDATE apps SET api_key = ?, updated_at = ? WHERE id = ?'
  ).bind(newApiKey, now, appId).run()

  return c.json({ apiKey: newApiKey })
})
