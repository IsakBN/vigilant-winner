/**
 * Device Registration Routes
 *
 * Handles device registration and token management for SDK authentication.
 * Devices register once and receive a JWT token for subsequent requests.
 */

import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { deviceRegisterRequestSchema, ERROR_CODES } from '@bundlenudge/shared'
import { generateDeviceToken, verifyDeviceToken, decodeJwtPayload } from '../../lib/device-token'
import { authMiddleware, type AuthUser } from '../../middleware/auth'
import type { Env } from '../../types/env'

interface DeviceRow {
  id: string
  app_id: string
  device_id: string
  platform: 'ios' | 'android'
  token_hash: string | null
  token_expires_at: number | null
  revoked_at: number | null
}

interface AppRow {
  id: string
  webhook_secret: string
  deleted_at: number | null
}

interface AuthVariables {
  user: AuthUser
}

export const devicesRoutes = new Hono<{ Bindings: Env; Variables: AuthVariables }>()

/**
 * Hash a token for storage (using SHA-256)
 */
async function hashToken(token: string): Promise<string> {
  const data = new TextEncoder().encode(token)
  const hash = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hash))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * POST /v1/devices/register
 *
 * Register a new device and get an access token.
 * Called by SDK on first launch or when token is missing.
 */
devicesRoutes.post(
  '/register',
  zValidator('json', deviceRegisterRequestSchema),
  async (c) => {
    const body = c.req.valid('json')

    // Validate app exists
    const app = await c.env.DB.prepare(
      'SELECT id, webhook_secret, deleted_at FROM apps WHERE id = ? AND deleted_at IS NULL'
    ).bind(body.appId).first<AppRow>()

    if (!app) {
      return c.json(
        { error: ERROR_CODES.INVALID_INPUT, message: 'Invalid app' },
        400
      )
    }

    // Generate device token
    const tokenResult = await generateDeviceToken(
      {
        deviceId: body.deviceId,
        appId: body.appId,
        bundleId: body.appId, // Using appId as bundleId for now
        platform: body.platform,
      },
      app.webhook_secret
    )

    const tokenHash = await hashToken(tokenResult.token)
    const now = Math.floor(Date.now() / 1000)
    const deviceRecordId = crypto.randomUUID()

    // Upsert device record
    await c.env.DB.prepare(`
      INSERT INTO devices (
        id, app_id, device_id, platform, os_version, device_model,
        timezone, locale, app_version, token_hash, token_expires_at,
        last_seen_at, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(app_id, device_id) DO UPDATE SET
        platform = excluded.platform,
        os_version = excluded.os_version,
        device_model = excluded.device_model,
        timezone = excluded.timezone,
        locale = excluded.locale,
        app_version = excluded.app_version,
        token_hash = excluded.token_hash,
        token_expires_at = excluded.token_expires_at,
        last_seen_at = excluded.last_seen_at,
        revoked_at = NULL
    `).bind(
      deviceRecordId,
      body.appId,
      body.deviceId,
      body.platform,
      body.deviceInfo?.osVersion ?? null,
      body.deviceInfo?.deviceModel ?? null,
      body.deviceInfo?.timezone ?? null,
      body.deviceInfo?.locale ?? null,
      body.appVersion,
      tokenHash,
      tokenResult.expiresAt,
      now,
      now
    ).run()

    return c.json({
      accessToken: tokenResult.token,
      expiresAt: tokenResult.expiresAt,
    }, 201)
  }
)

/**
 * POST /v1/devices/refresh
 *
 * Refresh an expiring access token.
 * Token must be in Authorization header.
 */
devicesRoutes.post('/refresh', async (c) => {
  const authHeader = c.req.header('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json(
      { error: ERROR_CODES.UNAUTHORIZED, message: 'Missing token' },
      401
    )
  }

  const token = authHeader.slice(7)

  // Decode token to get appId (for secret lookup)
  const decoded = decodeJwtPayload(token)
  if (!decoded?.appId) {
    return c.json(
      { error: ERROR_CODES.INVALID_TOKEN, message: 'Invalid token' },
      401
    )
  }

  // Get app for secret
  const app = await c.env.DB.prepare(
    'SELECT id, webhook_secret FROM apps WHERE id = ? AND deleted_at IS NULL'
  ).bind(decoded.appId).first<AppRow>()

  if (!app) {
    return c.json(
      { error: ERROR_CODES.INVALID_TOKEN, message: 'Invalid token' },
      401
    )
  }

  // Verify token
  const payload = await verifyDeviceToken(token, app.webhook_secret)
  if (!payload) {
    return c.json(
      { error: ERROR_CODES.TOKEN_EXPIRED, message: 'Token expired' },
      401
    )
  }

  // Check if device is revoked
  const device = await c.env.DB.prepare(
    'SELECT id, revoked_at FROM devices WHERE app_id = ? AND device_id = ?'
  ).bind(payload.appId, payload.deviceId).first<DeviceRow>()

  if (!device) {
    return c.json(
      { error: ERROR_CODES.DEVICE_NOT_FOUND, message: 'Device not registered' },
      401
    )
  }

  if (device.revoked_at) {
    return c.json(
      { error: ERROR_CODES.FORBIDDEN, message: 'Device revoked' },
      401
    )
  }

  // Generate new token
  const tokenResult = await generateDeviceToken(
    {
      deviceId: payload.deviceId,
      appId: payload.appId,
      bundleId: payload.bundleId,
      platform: payload.platform,
    },
    app.webhook_secret
  )

  const tokenHash = await hashToken(tokenResult.token)
  const now = Math.floor(Date.now() / 1000)

  // Update device record
  await c.env.DB.prepare(`
    UPDATE devices
    SET token_hash = ?, token_expires_at = ?, last_seen_at = ?
    WHERE app_id = ? AND device_id = ?
  `).bind(
    tokenHash,
    tokenResult.expiresAt,
    now,
    payload.appId,
    payload.deviceId
  ).run()

  return c.json({
    accessToken: tokenResult.token,
    expiresAt: tokenResult.expiresAt,
  })
})

/**
 * GET /v1/devices
 *
 * List registered devices for an app (dashboard only).
 */
devicesRoutes.get('/', authMiddleware, async (c) => {
  const user = c.get('user')
  const appId = c.req.query('appId')

  if (!appId) {
    return c.json(
      { error: ERROR_CODES.VALIDATION_ERROR, message: 'appId required' },
      400
    )
  }

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

  const devices = await c.env.DB.prepare(`
    SELECT
      id, device_id, platform, os_version, device_model, app_version,
      current_bundle_version, last_seen_at, revoked_at, created_at
    FROM devices
    WHERE app_id = ?
    ORDER BY last_seen_at DESC
    LIMIT 100
  `).bind(appId).all()

  return c.json({ devices: devices.results })
})

/**
 * POST /v1/devices/revoke
 *
 * Revoke a device's token (dashboard only).
 */
devicesRoutes.post('/revoke', authMiddleware, async (c) => {
  const user = c.get('user')
  const body = await c.req.json<{ appId: string; deviceId: string }>()

  if (!body.appId || !body.deviceId) {
    return c.json(
      { error: ERROR_CODES.VALIDATION_ERROR, message: 'appId and deviceId required' },
      400
    )
  }

  // Verify app ownership
  const app = await c.env.DB.prepare(
    'SELECT * FROM apps WHERE id = ? AND owner_id = ? AND deleted_at IS NULL'
  ).bind(body.appId, user.id).first()

  if (!app) {
    return c.json(
      { error: ERROR_CODES.APP_NOT_FOUND, message: 'App not found' },
      404
    )
  }

  const now = Math.floor(Date.now() / 1000)

  const result = await c.env.DB.prepare(`
    UPDATE devices
    SET revoked_at = ?
    WHERE app_id = ? AND device_id = ? AND revoked_at IS NULL
  `).bind(now, body.appId, body.deviceId).run()

  if (!result.meta.changes) {
    return c.json(
      { error: ERROR_CODES.DEVICE_NOT_FOUND, message: 'Device not found' },
      404
    )
  }

  return c.json({ success: true, revokedAt: now })
})
