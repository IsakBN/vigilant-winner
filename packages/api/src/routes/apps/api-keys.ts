/**
 * @agent remediate-api-key-middleware
 * @modified 2026-01-25
 *
 * API Key CRUD routes for apps.
 *
 * Endpoints:
 * - POST /apps/:appId/keys - Create a new API key (returns plaintext once)
 * - GET /apps/:appId/keys - List API keys (redacted)
 * - DELETE /apps/:appId/keys/:keyId - Revoke an API key
 */

import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { ERROR_CODES } from '@bundlenudge/shared'
import { authMiddleware, type AuthUser } from '../../middleware/auth'
import {
  hashApiKey,
  API_KEY_PERMISSIONS,
  type ApiKeyPermission,
} from '../../middleware/api-key'
import type { Env } from '../../types/env'

/** API key prefix for BundleNudge */
const API_KEY_PREFIX = 'bn_live_'

/** Characters used in the random prefix portion */
const PREFIX_CHARS = 'abcdefghijklmnopqrstuvwxyz0123456789'

/** Length of the random prefix portion */
const PREFIX_LENGTH = 8

/** Bytes for the secret portion */
const SECRET_BYTES = 24

/** First 16 chars used as DB lookup prefix */
const DB_PREFIX_LENGTH = 16

/** Default permissions for new keys */
const DEFAULT_PERMISSIONS: ApiKeyPermission[] = ['release:read', 'update:check']

interface AuthVariables {
  user: AuthUser
}

interface ApiKeyRow {
  id: string
  app_id: string
  name: string
  key_prefix: string
  permissions: string
  created_at: number
  last_used_at: number | null
  revoked_at: number | null
}

/**
 * Generate a new API key
 * Format: bn_live_{8 random alphanumeric}_{24+ base64url chars}
 */
function generateApiKey(): string {
  const prefixRandom = crypto.getRandomValues(new Uint8Array(PREFIX_LENGTH))
  const prefix = Array.from(prefixRandom)
    .map(b => PREFIX_CHARS[b % PREFIX_CHARS.length])
    .join('')

  const secretRandom = crypto.getRandomValues(new Uint8Array(SECRET_BYTES))
  const secret = btoa(String.fromCharCode(...secretRandom))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')

  return `${API_KEY_PREFIX}${prefix}_${secret}`
}

const createKeySchema = z.object({
  name: z.string().min(1).max(100),
  permissions: z.array(
    z.enum(Object.keys(API_KEY_PERMISSIONS) as [ApiKeyPermission, ...ApiKeyPermission[]])
  ).optional(),
})

const appIdParamsSchema = z.object({
  appId: z.string().uuid(),
})

const keyIdParamsSchema = z.object({
  appId: z.string().uuid(),
  keyId: z.string().uuid(),
})

export const apiKeysRoutes = new Hono<{ Bindings: Env; Variables: AuthVariables }>()

// All routes require authentication
apiKeysRoutes.use('*', authMiddleware)

/**
 * GET /apps/:appId/keys
 * List API keys for an app (excludes actual key hash)
 */
apiKeysRoutes.get(
  '/',
  zValidator('param', appIdParamsSchema),
  async (c) => {
    const user = c.get('user')
    const { appId } = c.req.valid('param')

    // Verify ownership
    const app = await c.env.DB.prepare(
      'SELECT id FROM apps WHERE id = ? AND owner_id = ? AND deleted_at IS NULL'
    ).bind(appId, user.id).first()

    if (!app) {
      return c.json(
        { error: ERROR_CODES.APP_NOT_FOUND, message: 'App not found' },
        404
      )
    }

    const keys = await c.env.DB.prepare(`
      SELECT id, app_id, name, key_prefix, permissions, created_at, last_used_at, revoked_at
      FROM api_keys
      WHERE app_id = ?
      ORDER BY created_at DESC
    `).bind(appId).all<ApiKeyRow>()

    const apiKeys = keys.results.map(k => ({
      id: k.id,
      name: k.name,
      prefix: k.key_prefix,
      keyPrefix: k.key_prefix,
      permissions: JSON.parse(k.permissions) as ApiKeyPermission[],
      createdAt: k.created_at,
      lastUsedAt: k.last_used_at,
      revokedAt: k.revoked_at,
    }))

    return c.json({ keys: apiKeys })
  }
)

/**
 * POST /apps/:appId/keys
 * Create a new API key (returns plaintext once)
 */
apiKeysRoutes.post(
  '/',
  zValidator('param', appIdParamsSchema),
  zValidator('json', createKeySchema),
  async (c) => {
    const user = c.get('user')
    const { appId } = c.req.valid('param')
    const body = c.req.valid('json')

    // Verify ownership
    const app = await c.env.DB.prepare(
      'SELECT id FROM apps WHERE id = ? AND owner_id = ? AND deleted_at IS NULL'
    ).bind(appId, user.id).first()

    if (!app) {
      return c.json(
        { error: ERROR_CODES.APP_NOT_FOUND, message: 'App not found' },
        404
      )
    }

    // Check for duplicate name
    const existingKey = await c.env.DB.prepare(
      'SELECT id FROM api_keys WHERE app_id = ? AND name = ? AND revoked_at IS NULL'
    ).bind(appId, body.name).first()

    if (existingKey) {
      return c.json(
        { error: ERROR_CODES.CONFLICT, message: 'API key with this name already exists' },
        409
      )
    }

    const apiKey = generateApiKey()
    const keyId = crypto.randomUUID()
    const keyHash = await hashApiKey(apiKey)
    const keyPrefix = apiKey.slice(0, DB_PREFIX_LENGTH)
    const permissions = JSON.stringify(body.permissions ?? DEFAULT_PERMISSIONS)
    const now = Math.floor(Date.now() / 1000)

    await c.env.DB.prepare(`
      INSERT INTO api_keys (id, app_id, name, key_prefix, key_hash, permissions, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      keyId,
      appId,
      body.name,
      keyPrefix,
      keyHash,
      permissions,
      now
    ).run()

    return c.json(
      {
        key: {
          id: keyId,
          name: body.name,
          prefix: keyPrefix,
          keyPrefix,
          permissions: body.permissions ?? DEFAULT_PERMISSIONS,
          createdAt: now,
        },
        fullKey: apiKey, // Only returned once at creation
      },
      201
    )
  }
)

/**
 * DELETE /apps/:appId/keys/:keyId
 * Revoke an API key (soft delete)
 */
apiKeysRoutes.delete(
  '/:keyId',
  zValidator('param', keyIdParamsSchema),
  async (c) => {
    const user = c.get('user')
    const { appId, keyId } = c.req.valid('param')

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

    // Verify key exists and belongs to app
    const key = await c.env.DB.prepare(
      'SELECT id, revoked_at FROM api_keys WHERE id = ? AND app_id = ?'
    ).bind(keyId, appId).first<{ id: string; revoked_at: number | null }>()

    if (!key) {
      return c.json(
        { error: ERROR_CODES.NOT_FOUND, message: 'API key not found' },
        404
      )
    }

    if (key.revoked_at) {
      return c.json(
        { error: ERROR_CODES.INVALID_STATE, message: 'API key already revoked' },
        400
      )
    }

    const now = Math.floor(Date.now() / 1000)

    await c.env.DB.prepare(
      'UPDATE api_keys SET revoked_at = ? WHERE id = ?'
    ).bind(now, keyId).run()

    return c.json({ success: true })
  }
)
