/**
 * Testers Routes
 *
 * Manage test users who receive build notifications via email.
 * Supports CSV import/export and bulk operations.
 *
 * @agent testers-routes
 * @created 2026-01-27
 */

import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { ERROR_CODES } from '@bundlenudge/shared'
import { authMiddleware, type AuthUser } from '../../middleware/auth'
import type { Env } from '../../types/env'
import {
  createTesterSchema,
  updateTesterSchema,
  bulkCreateSchema,
  importCsvSchema,
  formatTester,
  verifyAppOwnership,
  parseCsvLine,
  type TesterRow,
} from './helpers'

interface AuthVars { user: AuthUser }

export const testersRouter = new Hono<{ Bindings: Env; Variables: AuthVars }>()
testersRouter.use('*', authMiddleware)

/** GET /v1/testers/:appId - List testers */
testersRouter.get('/:appId', async (c) => {
  const user = c.get('user')
  const appId = c.req.param('appId')
  const limit = Math.min(Number(c.req.query('limit')) || 50, 100)
  const offset = Number(c.req.query('offset')) || 0

  if (!await verifyAppOwnership(c.env.DB, appId, user.id)) {
    return c.json({ error: ERROR_CODES.APP_NOT_FOUND, message: 'App not found' }, 404)
  }

  const countResult = await c.env.DB.prepare(
    'SELECT COUNT(*) as total FROM testers WHERE app_id = ?'
  ).bind(appId).first<{ total: number }>()
  const total = countResult?.total ?? 0

  const results = await c.env.DB.prepare(`
    SELECT * FROM testers WHERE app_id = ?
    ORDER BY created_at DESC LIMIT ? OFFSET ?
  `).bind(appId, limit, offset).all<TesterRow>()

  return c.json({
    data: results.results.map(formatTester),
    pagination: { total, limit, offset, hasMore: offset + results.results.length < total },
  })
})

/** GET /v1/testers/:appId/export - Export testers as CSV */
testersRouter.get('/:appId/export', async (c) => {
  const user = c.get('user')
  const appId = c.req.param('appId')

  if (!await verifyAppOwnership(c.env.DB, appId, user.id)) {
    return c.json({ error: ERROR_CODES.APP_NOT_FOUND, message: 'App not found' }, 404)
  }

  const results = await c.env.DB.prepare(
    'SELECT email, name FROM testers WHERE app_id = ? ORDER BY created_at ASC'
  ).bind(appId).all<{ email: string; name: string | null }>()

  let csv = 'email,name\n'
  for (const tester of results.results) {
    const name = tester.name ? `"${tester.name.replace(/"/g, '""')}"` : ''
    csv += `${tester.email},${name}\n`
  }

  return c.json({ csv })
})

/** GET /v1/testers/:appId/:testerId - Get single tester */
testersRouter.get('/:appId/:testerId', async (c) => {
  const user = c.get('user')
  const { appId, testerId } = c.req.param()

  if (!await verifyAppOwnership(c.env.DB, appId, user.id)) {
    return c.json({ error: ERROR_CODES.APP_NOT_FOUND, message: 'App not found' }, 404)
  }

  const tester = await c.env.DB.prepare(
    'SELECT * FROM testers WHERE id = ? AND app_id = ?'
  ).bind(testerId, appId).first<TesterRow>()

  if (!tester) {
    return c.json({ error: ERROR_CODES.NOT_FOUND, message: 'Tester not found' }, 404)
  }

  return c.json({ tester: formatTester(tester) })
})

/** POST /v1/testers/:appId - Create single tester */
testersRouter.post('/:appId', zValidator('json', createTesterSchema), async (c) => {
  const user = c.get('user')
  const appId = c.req.param('appId')
  const data = c.req.valid('json')

  if (!await verifyAppOwnership(c.env.DB, appId, user.id)) {
    return c.json({ error: ERROR_CODES.APP_NOT_FOUND, message: 'App not found' }, 404)
  }

  const email = data.email.toLowerCase()
  const existing = await c.env.DB.prepare(
    'SELECT id FROM testers WHERE app_id = ? AND email = ?'
  ).bind(appId, email).first()

  if (existing) {
    return c.json({ error: ERROR_CODES.ALREADY_EXISTS, message: 'Tester already exists' }, 409)
  }

  const id = crypto.randomUUID()
  const now = Math.floor(Date.now() / 1000)

  await c.env.DB.prepare(`
    INSERT INTO testers (id, app_id, email, name, created_at, created_by)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(id, appId, email, data.name ?? null, now, user.id).run()

  return c.json({ id, email, name: data.name ?? null, createdAt: now }, 201)
})

/** POST /v1/testers/:appId/bulk - Bulk create testers */
testersRouter.post('/:appId/bulk', zValidator('json', bulkCreateSchema), async (c) => {
  const user = c.get('user')
  const appId = c.req.param('appId')
  const data = c.req.valid('json')

  if (!await verifyAppOwnership(c.env.DB, appId, user.id)) {
    return c.json({ error: ERROR_CODES.APP_NOT_FOUND, message: 'App not found' }, 404)
  }

  const existingResult = await c.env.DB.prepare(
    'SELECT email FROM testers WHERE app_id = ?'
  ).bind(appId).all<{ email: string }>()
  const existingEmails = new Set(existingResult.results.map(t => t.email.toLowerCase()))

  const now = Math.floor(Date.now() / 1000)
  let added = 0
  let duplicates = 0

  for (const tester of data.testers) {
    const email = tester.email.toLowerCase()
    if (existingEmails.has(email)) {
      duplicates++
      continue
    }

    const id = crypto.randomUUID()
    await c.env.DB.prepare(`
      INSERT INTO testers (id, app_id, email, name, created_at, created_by)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(id, appId, email, tester.name ?? null, now, user.id).run()

    existingEmails.add(email)
    added++
  }

  return c.json({ added, duplicates, total: data.testers.length })
})

/** POST /v1/testers/:appId/import - Import testers from CSV */
testersRouter.post('/:appId/import', zValidator('json', importCsvSchema), async (c) => {
  const user = c.get('user')
  const appId = c.req.param('appId')
  const data = c.req.valid('json')

  if (!await verifyAppOwnership(c.env.DB, appId, user.id)) {
    return c.json({ error: ERROR_CODES.APP_NOT_FOUND, message: 'App not found' }, 404)
  }

  const lines = data.csv.trim().split('\n')
  const testers: { email: string; name?: string }[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    if (i === 0 && (line.toLowerCase().includes('email') || line.toLowerCase().includes('name'))) {
      continue // Skip header
    }
    const parsed = parseCsvLine(line)
    if (parsed) testers.push(parsed)
  }

  if (testers.length === 0) {
    return c.json({ error: ERROR_CODES.INVALID_INPUT, message: 'No valid testers in CSV' }, 400)
  }

  const existingResult = await c.env.DB.prepare(
    'SELECT email FROM testers WHERE app_id = ?'
  ).bind(appId).all<{ email: string }>()
  const existingEmails = new Set(existingResult.results.map(t => t.email.toLowerCase()))

  const now = Math.floor(Date.now() / 1000)
  let added = 0
  let duplicates = 0

  for (const tester of testers) {
    const email = tester.email.toLowerCase()
    if (existingEmails.has(email)) {
      duplicates++
      continue
    }

    const id = crypto.randomUUID()
    await c.env.DB.prepare(`
      INSERT INTO testers (id, app_id, email, name, created_at, created_by)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(id, appId, email, tester.name ?? null, now, user.id).run()

    existingEmails.add(email)
    added++
  }

  return c.json({ added, duplicates, total: testers.length })
})

/** PATCH /v1/testers/:appId/:testerId - Update tester */
testersRouter.patch('/:appId/:testerId', zValidator('json', updateTesterSchema), async (c) => {
  const user = c.get('user')
  const { appId, testerId } = c.req.param()
  const data = c.req.valid('json')

  if (!await verifyAppOwnership(c.env.DB, appId, user.id)) {
    return c.json({ error: ERROR_CODES.APP_NOT_FOUND, message: 'App not found' }, 404)
  }

  const tester = await c.env.DB.prepare(
    'SELECT id FROM testers WHERE id = ? AND app_id = ?'
  ).bind(testerId, appId).first()

  if (!tester) {
    return c.json({ error: ERROR_CODES.NOT_FOUND, message: 'Tester not found' }, 404)
  }

  if (data.name !== undefined) {
    await c.env.DB.prepare('UPDATE testers SET name = ? WHERE id = ?')
      .bind(data.name, testerId).run()
  }

  return c.json({ success: true })
})

/** DELETE /v1/testers/:appId/:testerId - Delete tester */
testersRouter.delete('/:appId/:testerId', async (c) => {
  const user = c.get('user')
  const { appId, testerId } = c.req.param()

  if (!await verifyAppOwnership(c.env.DB, appId, user.id)) {
    return c.json({ error: ERROR_CODES.APP_NOT_FOUND, message: 'App not found' }, 404)
  }

  const result = await c.env.DB.prepare(
    'DELETE FROM testers WHERE id = ? AND app_id = ?'
  ).bind(testerId, appId).run()

  if (result.meta.changes === 0) {
    return c.json({ error: ERROR_CODES.NOT_FOUND, message: 'Tester not found' }, 404)
  }

  return c.json({ success: true })
})
