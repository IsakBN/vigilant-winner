/**
 * Device authentication middleware
 *
 * Validates device tokens for SDK requests
 */

import { createMiddleware } from 'hono/factory'
import { verifyDeviceToken, decodeJwtPayload } from '../lib/device-token'
import { ERROR_CODES } from '@bundlenudge/shared'
import type { Env } from '../types/env'

export interface DeviceContext {
  id: string
  appId: string
  bundleId: string
  platform: 'ios' | 'android'
}

interface DeviceAuthVariables {
  device: DeviceContext
}

/**
 * Middleware that requires a valid device token
 * Expects "Device {token}" in Authorization header
 * Sets c.var.device on success
 */
export const deviceAuthMiddleware = createMiddleware<{
  Bindings: Env
  Variables: DeviceAuthVariables
}>(async (c, next) => {
  const authHeader = c.req.header('Authorization')

  if (!authHeader) {
    return c.json(
      { error: ERROR_CODES.UNAUTHORIZED, message: 'Authorization header required' },
      401
    )
  }

  const parts = authHeader.split(' ')
  const scheme = parts[0]
  const token = parts[1]

  if (scheme !== 'Device' || !token) {
    return c.json(
      { error: ERROR_CODES.UNAUTHORIZED, message: 'Invalid authorization format. Use "Device {token}"' },
      401
    )
  }

  // First decode to get appId (to lookup per-app secret)
  const decoded = decodeJwtPayload(token)
  if (!decoded) {
    return c.json(
      { error: ERROR_CODES.INVALID_TOKEN, message: 'Invalid token format' },
      401
    )
  }

  // Lookup app to get its secret
  const app = await c.env.DB.prepare(
    'SELECT webhook_secret FROM apps WHERE id = ? AND deleted_at IS NULL'
  ).bind(decoded.appId).first<{ webhook_secret: string }>()

  if (!app) {
    return c.json(
      { error: ERROR_CODES.APP_NOT_FOUND, message: 'App not found' },
      404
    )
  }

  // Verify token with app's secret
  const payload = await verifyDeviceToken(token, app.webhook_secret)
  if (!payload) {
    return c.json(
      { error: ERROR_CODES.INVALID_TOKEN, message: 'Invalid or expired device token' },
      401
    )
  }

  // Check if device is revoked
  const device = await c.env.DB.prepare(
    'SELECT revoked_at FROM registered_devices WHERE app_id = ? AND device_id = ?'
  ).bind(payload.appId, payload.deviceId).first<{ revoked_at: number | null }>()

  if (device?.revoked_at) {
    return c.json(
      { error: ERROR_CODES.FORBIDDEN, message: 'Device access has been revoked' },
      403
    )
  }

  c.set('device', {
    id: payload.deviceId,
    appId: payload.appId,
    bundleId: payload.bundleId,
    platform: payload.platform,
  })

  return next()
})
