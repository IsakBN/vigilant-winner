/**
 * Update check endpoint
 *
 * SDK calls this to check for available updates.
 */

import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { updateCheckRequestSchema } from '@bundlenudge/shared'

import type { Env } from '../types/env'

export const updatesRouter = new Hono<{ Bindings: Env }>()

/**
 * POST /v1/updates/check
 *
 * Check for available updates for a device.
 */
updatesRouter.post('/check', zValidator('json', updateCheckRequestSchema), async (c) => {
  const body = c.req.valid('json')

  // TODO: Implement update check logic
  // 1. Validate device token
  // 2. Get device attributes
  // 3. Find matching release using targeting rules
  // 4. Return update info or no-update response

  console.log('[updates/check] Request for app:', body.appId, 'device:', body.deviceId)

  return c.json({
    updateAvailable: false,
  })
})
