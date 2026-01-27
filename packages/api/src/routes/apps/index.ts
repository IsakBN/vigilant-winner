/**
 * Apps CRUD routes
 *
 * Handles app registration and management
 *
 * @agent remediate-pagination
 * @modified 2026-01-25
 *
 * @agent remediate-project-members
 * @modified 2026-01-25
 * @description Wired in project members router
 *
 * @agent remediate-api-key-middleware
 * @modified 2026-01-25
 * @description Added API keys routes
 *
 * @agent wave4-channels
 * @modified 2026-01-25
 * @description Auto-create default channels on app creation
 *
 * @agent wave4a-health-config
 * @modified 2026-01-26
 * @description Added health config routes
 */

import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { nanoid } from 'nanoid'
import { createAppSchema, updateAppSchema, ERROR_CODES } from '@bundlenudge/shared'
import { authMiddleware, type AuthUser } from '../../middleware/auth'
import type { Env } from '../../types/env'
import { projectMembersRouter } from './members'
import { apiKeysRoutes } from './api-keys'
import { healthConfigRoutes } from './health-config'

const API_KEY_PREFIX = 'bn_'
const API_KEY_LENGTH = 32
const DEFAULT_CHANNELS = ['production', 'staging', 'development'] as const

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
 * List user's apps with pagination
 *
 * Returns apps the user has access to via:
 * 1. Direct ownership
 * 2. Full organization membership (scope='full')
 * 3. Project-scoped organization membership (via member_project_access)
 *
 * @agent per-project-invitations
 * @modified 2026-01-27
 */
appsRoutes.get('/', async (c) => {
  const user = c.get('user')
  const limit = Math.min(Number(c.req.query('limit')) || 20, 100)
  const offset = Number(c.req.query('offset')) || 0

  // Get apps with access logic:
  // 1. Apps user owns directly
  // 2. Apps from orgs where user has full access (member but no project_access entries)
  // 3. Apps user has explicit project access to (member_project_access)
  const countResult = await c.env.DB.prepare(`
    SELECT COUNT(DISTINCT a.id) as total
    FROM apps a
    LEFT JOIN organization_members om ON a.owner_id = (
      SELECT owner_id FROM organizations WHERE id = om.organization_id
    )
    LEFT JOIN member_project_access mpa ON mpa.app_id = a.id AND mpa.user_id = ?
    WHERE a.deleted_at IS NULL AND (
      -- Direct ownership
      a.owner_id = ?
      -- Or user is org member with full access (no project-scoped entries for this org)
      OR (
        om.user_id = ?
        AND NOT EXISTS (
          SELECT 1 FROM member_project_access
          WHERE organization_id = om.organization_id AND user_id = ?
        )
      )
      -- Or user has explicit project access
      OR mpa.id IS NOT NULL
    )
  `).bind(user.id, user.id, user.id, user.id).first<{ total: number }>()
  const total = countResult?.total ?? 0

  // Get paginated results with same access logic
  const results = await c.env.DB.prepare(`
    SELECT DISTINCT
      a.*,
      (SELECT COUNT(*) FROM releases WHERE app_id = a.id) as release_count,
      (SELECT COUNT(*) FROM devices WHERE app_id = a.id) as device_count
    FROM apps a
    LEFT JOIN organization_members om ON a.owner_id = (
      SELECT owner_id FROM organizations WHERE id = om.organization_id
    )
    LEFT JOIN member_project_access mpa ON mpa.app_id = a.id AND mpa.user_id = ?
    WHERE a.deleted_at IS NULL AND (
      -- Direct ownership
      a.owner_id = ?
      -- Or user is org member with full access (no project-scoped entries for this org)
      OR (
        om.user_id = ?
        AND NOT EXISTS (
          SELECT 1 FROM member_project_access
          WHERE organization_id = om.organization_id AND user_id = ?
        )
      )
      -- Or user has explicit project access
      OR mpa.id IS NOT NULL
    )
    ORDER BY a.created_at DESC
    LIMIT ? OFFSET ?
  `).bind(user.id, user.id, user.id, user.id, limit, offset).all<AppRow>()

  return c.json({
    data: results.results,
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + results.results.length < total,
    },
  })
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

  // Auto-create default channels (production, staging, development)
  await createDefaultChannels(c.env.DB, appId, now)

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
 *
 * ONLY the organization owner can delete projects.
 * Admins and members cannot delete projects.
 *
 * @agent owner-only-deletion
 * @created 2026-01-27
 */
appsRoutes.delete('/:appId', async (c) => {
  const user = c.get('user')
  const appId = c.req.param('appId')

  // First, find the app
  const existing = await c.env.DB.prepare(
    'SELECT * FROM apps WHERE id = ? AND deleted_at IS NULL'
  ).bind(appId).first<AppRow>()

  if (!existing) {
    return c.json(
      { error: ERROR_CODES.APP_NOT_FOUND, message: 'App not found' },
      404
    )
  }

  // Check if user is the direct owner
  const isDirectOwner = existing.owner_id === user.id

  // Check if user is an organization owner for this app
  const orgMembership = await c.env.DB.prepare(`
    SELECT om.role, o.id as org_id
    FROM organization_members om
    JOIN organizations o ON o.id = om.organization_id
    WHERE om.user_id = ? AND o.owner_id = ?
  `).bind(user.id, existing.owner_id).first<{ role: string; org_id: string }>()

  const isOrgOwner = orgMembership?.role === 'owner'

  // Log the deletion attempt for audit purposes
  if (orgMembership?.org_id) {
    await logProjectAction(c.env.DB, {
      orgId: orgMembership.org_id,
      actorId: user.id,
      action: 'project.delete_attempted',
      targetAppId: appId,
      details: {
        allowed: isDirectOwner || isOrgOwner,
        reason: isDirectOwner ? 'direct_owner' : isOrgOwner ? 'org_owner' : 'not_owner',
      },
    })
  }

  // Only direct owner or organization owner can delete
  if (!isDirectOwner && !isOrgOwner) {
    return c.json({
      error: 'OWNER_REQUIRED',
      message: 'Only the organization owner can delete projects',
    }, 403)
  }

  const now = Math.floor(Date.now() / 1000)

  // Soft delete the app
  await c.env.DB.prepare(
    'UPDATE apps SET deleted_at = ?, updated_at = ? WHERE id = ?'
  ).bind(now, now, appId).run()

  // Log successful deletion
  if (orgMembership?.org_id) {
    await logProjectAction(c.env.DB, {
      orgId: orgMembership.org_id,
      actorId: user.id,
      action: 'project.deleted',
      targetAppId: appId,
      details: { appName: existing.name },
    })
  }

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

/**
 * Create default channels for a new app
 * @agent wave4-channels
 * @modified 2026-01-25
 * @description Updated to include new channel fields (display_name, is_default, updated_at)
 */
async function createDefaultChannels(
  db: Env['DB'],
  appId: string,
  timestamp: number
): Promise<void> {
  const displayNames: Record<string, string> = {
    production: 'Production',
    staging: 'Staging',
    development: 'Development',
  }

  for (let i = 0; i < DEFAULT_CHANNELS.length; i++) {
    const channelName = DEFAULT_CHANNELS[i]
    const channelId = crypto.randomUUID()
    const isDefault = i === 0 // production is the default channel
    await db.prepare(`
      INSERT INTO channels (id, app_id, name, display_name, is_default, rollout_percentage, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 100, ?, ?)
    `).bind(channelId, appId, channelName, displayNames[channelName], isDefault ? 1 : 0, timestamp, timestamp).run()
  }
}

/**
 * Log project-related audit events
 *
 * @agent owner-only-deletion
 * @created 2026-01-27
 */
interface ProjectActionParams {
  orgId: string
  actorId: string
  action: string
  targetAppId: string
  details: Record<string, unknown>
}

async function logProjectAction(
  db: Env['DB'],
  params: ProjectActionParams
): Promise<void> {
  await db.prepare(`
    INSERT INTO team_audit_log (id, organization_id, user_id, event, metadata, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(
    crypto.randomUUID(),
    params.orgId,
    params.actorId,
    params.action,
    JSON.stringify({
      targetAppId: params.targetAppId,
      ...params.details,
    }),
    Math.floor(Date.now() / 1000)
  ).run()
}

// Mount project members routes
appsRoutes.route('/', projectMembersRouter)

// Mount API keys routes
appsRoutes.route('/:appId/keys', apiKeysRoutes)

// Mount health config routes
appsRoutes.route('/:appId/health-config', healthConfigRoutes)
