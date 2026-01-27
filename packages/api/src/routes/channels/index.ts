/**
 * Channels CRUD Routes
 *
 * Handles channel management for release deployment environments.
 * Channels are named release tracks (production, staging, beta) that allow
 * apps to have different releases for different audiences.
 *
 * @agent channels-system
 * @created 2026-01-25
 */
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import {
  ERROR_CODES,
  createChannelSchema,
  updateChannelSchema,
  isDefaultChannelName,
  getDefaultChannelDisplayName,
} from '@bundlenudge/shared'
import { authMiddleware, type AuthUser } from '../../middleware/auth'
import type { Env } from '../../types/env'

interface ChannelRow {
  id: string
  app_id: string
  name: string
  display_name: string
  description: string | null
  is_default: number
  rollout_percentage: number
  targeting_rules: string | null
  active_release_id: string | null
  created_at: number
  updated_at: number
}

interface AuthVars { user: AuthUser }

export const channelsRouter = new Hono<{ Bindings: Env; Variables: AuthVars }>()
channelsRouter.use('*', authMiddleware)

async function verifyAppOwnership(db: Env['DB'], appId: string, userId: string): Promise<boolean> {
  const app = await db.prepare(
    'SELECT id FROM apps WHERE id = ? AND owner_id = ? AND deleted_at IS NULL'
  ).bind(appId, userId).first()
  return !!app
}

function formatChannel(row: ChannelRow) {
  return {
    id: row.id,
    appId: row.app_id,
    name: row.name,
    displayName: row.display_name,
    description: row.description,
    isDefault: Boolean(row.is_default),
    is_default: row.is_default, // Backwards compatibility
    rolloutPercentage: row.rollout_percentage,
    targetingRules: row.targeting_rules ? (JSON.parse(row.targeting_rules) as unknown) : null,
    activeReleaseId: row.active_release_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

/** GET /v1/apps/:appId/channels - List channels */
channelsRouter.get('/:appId/channels', async (c) => {
  const user = c.get('user')
  const appId = c.req.param('appId')
  const limit = Math.min(Number(c.req.query('limit')) || 20, 100)
  const offset = Number(c.req.query('offset')) || 0

  if (!await verifyAppOwnership(c.env.DB, appId, user.id)) {
    return c.json({ error: ERROR_CODES.APP_NOT_FOUND, message: 'App not found' }, 404)
  }

  const countResult = await c.env.DB.prepare(
    'SELECT COUNT(*) as total FROM channels WHERE app_id = ?'
  ).bind(appId).first<{ total: number }>()
  const total = countResult?.total ?? 0

  const results = await c.env.DB.prepare(`
    SELECT * FROM channels WHERE app_id = ?
    ORDER BY is_default DESC, created_at ASC LIMIT ? OFFSET ?
  `).bind(appId, limit, offset).all<ChannelRow>()

  return c.json({
    data: results.results.map(formatChannel),
    pagination: { total, limit, offset, hasMore: offset + results.results.length < total },
  })
})

/** GET /v1/apps/:appId/channels/:channelId - Get single channel */
channelsRouter.get('/:appId/channels/:channelId', async (c) => {
  const user = c.get('user')
  const { appId, channelId } = c.req.param()

  if (!await verifyAppOwnership(c.env.DB, appId, user.id)) {
    return c.json({ error: ERROR_CODES.APP_NOT_FOUND, message: 'App not found' }, 404)
  }

  const channel = await c.env.DB.prepare(
    'SELECT * FROM channels WHERE id = ? AND app_id = ?'
  ).bind(channelId, appId).first<ChannelRow>()

  if (!channel) {
    return c.json({ error: ERROR_CODES.CHANNEL_NOT_FOUND, message: 'Channel not found' }, 404)
  }
  return c.json({ channel: formatChannel(channel) })
})

/** POST /v1/apps/:appId/channels - Create channel */
channelsRouter.post('/:appId/channels', zValidator('json', createChannelSchema), async (c) => {
  const user = c.get('user')
  const appId = c.req.param('appId')
  const data = c.req.valid('json')

  if (!await verifyAppOwnership(c.env.DB, appId, user.id)) {
    return c.json({ error: ERROR_CODES.APP_NOT_FOUND, message: 'App not found' }, 404)
  }

  const existing = await c.env.DB.prepare(
    'SELECT id FROM channels WHERE app_id = ? AND name = ?'
  ).bind(appId, data.name).first()

  if (existing) {
    return c.json({ error: ERROR_CODES.ALREADY_EXISTS, message: 'Channel name already exists' }, 409)
  }

  const channelId = crypto.randomUUID()
  const now = Math.floor(Date.now() / 1000)
  const targetingRules = data.targetingRules ? JSON.stringify(data.targetingRules) : null

  await c.env.DB.prepare(`
    INSERT INTO channels (id, app_id, name, display_name, description, is_default, rollout_percentage, targeting_rules, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?, ?)
  `).bind(channelId, appId, data.name, data.displayName, data.description ?? null,
    data.rolloutPercentage, targetingRules, now, now).run()

  const channel = await c.env.DB.prepare('SELECT * FROM channels WHERE id = ?')
    .bind(channelId).first<ChannelRow>()
  if (!channel) {
    return c.json({ error: ERROR_CODES.CHANNEL_NOT_FOUND, message: 'Channel not found' }, 404)
  }
  return c.json({ channel: formatChannel(channel) }, 201)
})

/** PATCH /v1/apps/:appId/channels/:channelId - Update channel */
channelsRouter.patch('/:appId/channels/:channelId', zValidator('json', updateChannelSchema), async (c) => {
  const user = c.get('user')
  const { appId, channelId } = c.req.param()
  const data = c.req.valid('json')

  if (!await verifyAppOwnership(c.env.DB, appId, user.id)) {
    return c.json({ error: ERROR_CODES.APP_NOT_FOUND, message: 'App not found' }, 404)
  }

  const existing = await c.env.DB.prepare(
    'SELECT * FROM channels WHERE id = ? AND app_id = ?'
  ).bind(channelId, appId).first<ChannelRow>()

  if (!existing) {
    return c.json({ error: ERROR_CODES.CHANNEL_NOT_FOUND, message: 'Channel not found' }, 404)
  }

  // Prevent renaming default channels
  if (data.name && isDefaultChannelName(existing.name) && data.name !== existing.name) {
    return c.json({ error: ERROR_CODES.FORBIDDEN, message: 'Cannot rename default channels' }, 403)
  }

  // Check duplicate name
  if (data.name && data.name !== existing.name) {
    const dup = await c.env.DB.prepare(
      'SELECT id FROM channels WHERE app_id = ? AND name = ? AND id != ?'
    ).bind(appId, data.name, channelId).first()
    if (dup) return c.json({ error: ERROR_CODES.ALREADY_EXISTS, message: 'Channel name already exists' }, 409)
  }

  // Handle isDefault: only one can be default per app
  if (data.isDefault === true && !existing.is_default) {
    await c.env.DB.prepare(
      'UPDATE channels SET is_default = 0, updated_at = ? WHERE app_id = ? AND is_default = 1'
    ).bind(Math.floor(Date.now() / 1000), appId).run()
  }

  const updates: string[] = []
  const values: (string | number | null)[] = []
  if (data.name !== undefined) { updates.push('name = ?'); values.push(data.name) }
  if (data.displayName !== undefined) { updates.push('display_name = ?'); values.push(data.displayName) }
  if (data.description !== undefined) { updates.push('description = ?'); values.push(data.description) }
  if (data.isDefault !== undefined) { updates.push('is_default = ?'); values.push(data.isDefault ? 1 : 0) }
  if (data.rolloutPercentage !== undefined) { updates.push('rollout_percentage = ?'); values.push(data.rolloutPercentage) }
  if (data.targetingRules !== undefined) {
    updates.push('targeting_rules = ?')
    values.push(data.targetingRules ? JSON.stringify(data.targetingRules) : null)
  }
  if (data.activeReleaseId !== undefined) { updates.push('active_release_id = ?'); values.push(data.activeReleaseId) }

  if (updates.length === 0) return c.json({ channel: formatChannel(existing) })

  updates.push('updated_at = ?')
  values.push(Math.floor(Date.now() / 1000))
  values.push(channelId)

  await c.env.DB.prepare(`UPDATE channels SET ${updates.join(', ')} WHERE id = ?`).bind(...values).run()
  const channel = await c.env.DB.prepare('SELECT * FROM channels WHERE id = ?').bind(channelId).first<ChannelRow>()
  if (!channel) {
    return c.json({ error: ERROR_CODES.CHANNEL_NOT_FOUND, message: 'Channel not found' }, 404)
  }
  return c.json({ channel: formatChannel(channel) })
})

/** DELETE /v1/apps/:appId/channels/:channelId - Delete channel */
channelsRouter.delete('/:appId/channels/:channelId', async (c) => {
  const user = c.get('user')
  const { appId, channelId } = c.req.param()

  if (!await verifyAppOwnership(c.env.DB, appId, user.id)) {
    return c.json({ error: ERROR_CODES.APP_NOT_FOUND, message: 'App not found' }, 404)
  }

  const channel = await c.env.DB.prepare(
    'SELECT * FROM channels WHERE id = ? AND app_id = ?'
  ).bind(channelId, appId).first<ChannelRow>()

  if (!channel) {
    return c.json({ error: ERROR_CODES.CHANNEL_NOT_FOUND, message: 'Channel not found' }, 404)
  }

  // Prevent deleting default channels (production, staging, development)
  if (isDefaultChannelName(channel.name)) {
    return c.json({ error: ERROR_CODES.FORBIDDEN, message: 'Cannot delete default channels' }, 403)
  }

  // Prevent deleting the current default channel (is_default = 1)
  if (channel.is_default) {
    return c.json({ error: ERROR_CODES.FORBIDDEN, message: 'Cannot delete the default channel' }, 403)
  }

  await c.env.DB.prepare('DELETE FROM channels WHERE id = ?').bind(channelId).run()
  return c.json({ success: true })
})

export { isDefaultChannelName, getDefaultChannelDisplayName }
