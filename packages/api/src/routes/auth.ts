/**
 * Authentication routes
 *
 * Handles Better Auth endpoints at /api/auth/*
 */

import { Hono } from 'hono'
import { createAuth } from '../lib/auth'
import type { Env } from '../types/env'

export const authRoutes = new Hono<{ Bindings: Env }>()

/**
 * Handle all Better Auth routes
 * Better Auth manages its own routing under this path
 */
authRoutes.all('/*', async (c) => {
  const auth = createAuth(c.env)
  return auth.handler(c.req.raw)
})
