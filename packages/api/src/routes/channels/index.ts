/**
 * Channels CRUD Routes
 *
 * Handles channel management for release deployment environments
 *
 * @agent wave4-channels
 * @created 2026-01-25
 */

import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { ERROR_CODES } from '@bundlenudge/shared'
import { authMiddleware, type AuthUser } from '../../middleware/auth'
import type { Env } from '../../types/env'

const DEFAULT_CHANNELS = ['production', 'staging', 'development'] as const

interface ChannelRow {
  id: string
  app_id: string
  name: string
  active_release_id: string | null
  created_at: number
}

interface AuthVariables {
  user: AuthUser
}

// Schemas
const createChannelSchema = z.object({
  name: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/, {
    message: 'Channel name must be lowercase alphanumeric with hyphens only',
  }),
})

const updateChannelSchema = z.object({
  name: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/, {
    message: 'Channel name must be lowercase alphanumeric with hyphens only',
  }).optional(),
  activeReleaseId: z.string().uuid().nullable().optional(),
})

export const channelsRouter = new Hono<{
  Bindings: Env
  Variables: AuthVariables
}>()

channelsRouter.use('*', authMiddleware)

/**
 * List channels for an app
 */
channelsRouter.get('/:appId/channels', async (c) => {
  const user = c.get('user')
  const appId = c.req.param('appId')

  // Verify app ownership
  const app = await c.env.DB.prepare(
    'SELECT * FROM apps WHERE id = ? AND owner_id = ? AND deleted_at IS NULL'
  ).bind(appId, user.id).first()

  if (!app) {
    return c.json(
      { error: ERROR_CODES.APP_NOT_FOUND, message: 'App not found' },
      404
    )
  }

  const results = await c.env.DB.prepare(`
    SELECT * FROM channels
    WHERE app_id = ?
    ORDER BY created_at ASC
  `).bind(appId).all<ChannelRow>()

  return c.json({ channels: results.results })
})

/**
 * Get single channel
 */
channelsRouter.get('/:appId/channels/:channelId', async (c) => {
  const user = c.get('user')
  const appId = c.req.param('appId')
  const channelId = c.req.param('channelId')

  // Verify app ownership
  const app = await c.env.DB.prepare(
    'SELECT * FROM apps WHERE id = ? AND owner_id = ? AND deleted_at IS NULL'
  ).bind(appId, user.id).first()

  if (!app) {
    return c.json(
      { error: ERROR_CODES.APP_NOT_FOUND, message: 'App not found' },
      404
    )
  }

  const channel = await c.env.DB.prepare(
    'SELECT * FROM channels WHERE id = ? AND app_id = ?'
  ).bind(channelId, appId).first<ChannelRow>()

  if (!channel) {
    return c.json(
      { error: ERROR_CODES.NOT_FOUND, message: 'Channel not found' },
      404
    )
  }

  return c.json({ channel })
})

/**
 * Create new channel
 */
channelsRouter.post(
  '/:appId/channels',
  zValidator('json', createChannelSchema),
  async (c) => {
    const user = c.get('user')
    const appId = c.req.param('appId')
    const data = c.req.valid('json')

    // Verify app ownership
    const app = await c.env.DB.prepare(
      'SELECT * FROM apps WHERE id = ? AND owner_id = ? AND deleted_at IS NULL'
    ).bind(appId, user.id).first()

    if (!app) {
      return c.json(
        { error: ERROR_CODES.APP_NOT_FOUND, message: 'App not found' },
        404
      )
    }

    // Check for duplicate channel name
    const existing = await c.env.DB.prepare(
      'SELECT id FROM channels WHERE app_id = ? AND name = ?'
    ).bind(appId, data.name).first()

    if (existing) {
      return c.json(
        { error: ERROR_CODES.ALREADY_EXISTS, message: 'Channel name already exists' },
        409
      )
    }

    const channelId = crypto.randomUUID()
    const now = Math.floor(Date.now() / 1000)

    await c.env.DB.prepare(`
      INSERT INTO channels (id, app_id, name, created_at)
      VALUES (?, ?, ?, ?)
    `).bind(channelId, appId, data.name, now).run()

    const channel = await c.env.DB.prepare(
      'SELECT * FROM channels WHERE id = ?'
    ).bind(channelId).first<ChannelRow>()

    return c.json({ channel }, 201)
  }
)

/**
 * Update channel
 */
channelsRouter.patch(
  '/:appId/channels/:channelId',
  zValidator('json', updateChannelSchema),
  async (c) => {
    const user = c.get('user')
    const appId = c.req.param('appId')
    const channelId = c.req.param('channelId')
    const data = c.req.valid('json')

    // Verify app ownership
    const app = await c.env.DB.prepare(
      'SELECT * FROM apps WHERE id = ? AND owner_id = ? AND deleted_at IS NULL'
    ).bind(appId, user.id).first()

    if (!app) {
      return c.json(
        { error: ERROR_CODES.APP_NOT_FOUND, message: 'App not found' },
        404
      )
    }

    const existing = await c.env.DB.prepare(
      'SELECT * FROM channels WHERE id = ? AND app_id = ?'
    ).bind(channelId, appId).first<ChannelRow>()

    if (!existing) {
      return c.json(
        { error: ERROR_CODES.NOT_FOUND, message: 'Channel not found' },
        404
      )
    }

    // Prevent renaming default channels
    if (data.name && isDefaultChannel(existing.name) && data.name !== existing.name) {
      return c.json(
        { error: ERROR_CODES.FORBIDDEN, message: 'Cannot rename default channels' },
        403
      )
    }

    // Check for duplicate name if changing
    if (data.name && data.name !== existing.name) {
      const duplicate = await c.env.DB.prepare(
        'SELECT id FROM channels WHERE app_id = ? AND name = ? AND id != ?'
      ).bind(appId, data.name, channelId).first()

      if (duplicate) {
        return c.json(
          { error: ERROR_CODES.ALREADY_EXISTS, message: 'Channel name already exists' },
          409
        )
      }
    }

    const updates: string[] = []
    const values: (string | null)[] = []

    if (data.name !== undefined) {
      updates.push('name = ?')
      values.push(data.name)
    }
    if (data.activeReleaseId !== undefined) {
      updates.push('active_release_id = ?')
      values.push(data.activeReleaseId)
    }

    if (updates.length === 0) {
      return c.json({ channel: existing })
    }

    values.push(channelId)

    await c.env.DB.prepare(
      `UPDATE channels SET ${updates.join(', ')} WHERE id = ?`
    ).bind(...values).run()

    const channel = await c.env.DB.prepare(
      'SELECT * FROM channels WHERE id = ?'
    ).bind(channelId).first<ChannelRow>()

    return c.json({ channel })
  }
)

/**
 * Delete channel (not allowed for default channels)
 */
channelsRouter.delete('/:appId/channels/:channelId', async (c) => {
  const user = c.get('user')
  const appId = c.req.param('appId')
  const channelId = c.req.param('channelId')

  // Verify app ownership
  const app = await c.env.DB.prepare(
    'SELECT * FROM apps WHERE id = ? AND owner_id = ? AND deleted_at IS NULL'
  ).bind(appId, user.id).first()

  if (!app) {
    return c.json(
      { error: ERROR_CODES.APP_NOT_FOUND, message: 'App not found' },
      404
    )
  }

  const channel = await c.env.DB.prepare(
    'SELECT * FROM channels WHERE id = ? AND app_id = ?'
  ).bind(channelId, appId).first<ChannelRow>()

  if (!channel) {
    return c.json(
      { error: ERROR_CODES.NOT_FOUND, message: 'Channel not found' },
      404
    )
  }

  // Prevent deleting default channels
  if (isDefaultChannel(channel.name)) {
    return c.json(
      { error: ERROR_CODES.FORBIDDEN, message: 'Cannot delete default channels' },
      403
    )
  }

  await c.env.DB.prepare('DELETE FROM channels WHERE id = ?').bind(channelId).run()

  return c.json({ success: true })
})

/**
 * Check if channel name is a default channel
 */
function isDefaultChannel(name: string): boolean {
  return DEFAULT_CHANNELS.includes(name as typeof DEFAULT_CHANNELS[number])
}

export { DEFAULT_CHANNELS }
