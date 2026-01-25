/**
 * Device registration endpoints
 *
 * Handles device registration and token management.
 */

import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { deviceRegisterRequestSchema } from '@bundlenudge/shared'

import type { Env } from '../types/env'

export const devicesRouter = new Hono<{ Bindings: Env }>()

/**
 * POST /v1/devices/register
 *
 * Register a new device and get an access token.
 */
devicesRouter.post('/register', zValidator('json', deviceRegisterRequestSchema), (c) => {
  const body = c.req.valid('json')

  // TODO: Implement device registration
  // 1. Validate appId exists
  // 2. Create or update device record
  // 3. Generate JWT access token
  // 4. Return token

  // eslint-disable-next-line no-console
  console.log('[devices/register] Request for app:', body.appId)

  return c.json({
    accessToken: 'placeholder-token',
    expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
  })
})

/**
 * POST /v1/devices/refresh
 *
 * Refresh an expiring access token.
 */
devicesRouter.post('/refresh', (c) => {
  // TODO: Implement token refresh
  // 1. Validate current token
  // 2. Generate new token
  // 3. Return new token

  return c.json({
    accessToken: 'placeholder-refreshed-token',
    expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
  })
})
