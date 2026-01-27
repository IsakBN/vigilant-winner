/**
 * Newsletter admin routes
 *
 * Manages newsletter subscribers and campaigns
 *
 * @agent newsletter-system
 * @created 2026-01-27
 */

import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { ERROR_CODES } from '@bundlenudge/shared'
import {
  verifyUnsubscribeToken,
  sendNewsletter,
  sendTestEmail,
  parseSubscriberCsv,
  exportSubscribersCsv,
  type Subscriber,
  type Campaign,
} from '../../lib/newsletter'
import { logAdminAction } from '../../lib/admin/audit'
import { getAdminId } from '../../middleware/admin'
import type { Env } from '../../types/env'

// =============================================================================
// Validation Schemas
// =============================================================================

const listSubscribersSchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
  search: z.string().optional(),
  active: z.enum(['true', 'false']).optional(),
})

const subscribeSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  source: z.string().optional(),
})

const listCampaignsSchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
  status: z.enum(['draft', 'scheduled', 'sending', 'sent']).optional(),
})

const createCampaignSchema = z.object({
  subject: z.string().min(1).max(200),
  content: z.string().min(1),
  previewText: z.string().max(150).optional(),
})

const updateCampaignSchema = z.object({
  subject: z.string().min(1).max(200).optional(),
  content: z.string().min(1).optional(),
  previewText: z.string().max(150).optional(),
})

const sendCampaignSchema = z.object({
  scheduledFor: z.number().int().positive().optional(),
})

const testEmailSchema = z.object({
  email: z.string().email(),
})

const importSubscribersSchema = z.object({
  csv: z.string(),
  source: z.string().default('import'),
})

// =============================================================================
// Router
// =============================================================================

export const newsletterRouter = new Hono<{ Bindings: Env }>()

// =============================================================================
// Public Endpoints (no auth required)
// =============================================================================

/**
 * POST /admin/newsletter/subscribe
 * Public endpoint for landing page subscriptions
 */
newsletterRouter.post('/subscribe', zValidator('json', subscribeSchema), async (c) => {
  const { email, name, source } = c.req.valid('json')
  const now = Date.now()

  // Check if already subscribed
  const existing = await c.env.DB.prepare(
    'SELECT id, unsubscribed_at FROM newsletter_subscribers WHERE email = ?'
  ).bind(email).first<{ id: string; unsubscribed_at: number | null }>()

  if (existing) {
    // If previously unsubscribed, resubscribe
    if (existing.unsubscribed_at) {
      await c.env.DB.prepare(
        'UPDATE newsletter_subscribers SET unsubscribed_at = NULL, subscribed_at = ? WHERE id = ?'
      ).bind(now, existing.id).run()

      return c.json({ success: true, message: 'Resubscribed successfully' })
    }

    return c.json({ success: true, message: 'Already subscribed' })
  }

  // Create new subscriber
  const id = crypto.randomUUID()
  await c.env.DB.prepare(`
    INSERT INTO newsletter_subscribers (id, email, name, subscribed_at, source)
    VALUES (?, ?, ?, ?, ?)
  `).bind(id, email, name ?? null, now, source ?? 'landing_page').run()

  return c.json({ success: true, message: 'Subscribed successfully' })
})

/**
 * GET /admin/newsletter/unsubscribe
 * Public endpoint for unsubscribing via token
 */
newsletterRouter.get('/unsubscribe', async (c) => {
  const token = c.req.query('token')

  if (!token) {
    return c.json({ error: ERROR_CODES.VALIDATION_ERROR, message: 'Token required' }, 400)
  }

  const email = await verifyUnsubscribeToken(token, c.env.BETTER_AUTH_SECRET)

  if (!email) {
    return c.json({ error: ERROR_CODES.INVALID_TOKEN, message: 'Invalid token' }, 400)
  }

  const now = Date.now()
  await c.env.DB.prepare(
    'UPDATE newsletter_subscribers SET unsubscribed_at = ? WHERE email = ?'
  ).bind(now, email).run()

  // Return HTML page
  return c.html(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Unsubscribed - BundleNudge</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 600px; margin: 100px auto; padding: 20px; text-align: center; }
        h1 { color: #333; }
        p { color: #666; }
      </style>
    </head>
    <body>
      <h1>Unsubscribed</h1>
      <p>You have been successfully unsubscribed from BundleNudge emails.</p>
      <p>We're sorry to see you go!</p>
    </body>
    </html>
  `)
})

// =============================================================================
// Admin Subscriber Endpoints
// =============================================================================

/**
 * GET /admin/newsletter/subscribers
 * List all subscribers with pagination
 */
newsletterRouter.get('/subscribers', zValidator('query', listSubscribersSchema), async (c) => {
  const { limit, offset, search, active } = c.req.valid('query')

  const conditions: string[] = []
  const bindings: (string | number)[] = []

  if (search) {
    conditions.push('(email LIKE ? OR name LIKE ?)')
    bindings.push(`%${search}%`, `%${search}%`)
  }

  if (active === 'true') {
    conditions.push('unsubscribed_at IS NULL')
  } else if (active === 'false') {
    conditions.push('unsubscribed_at IS NOT NULL')
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  const countResult = await c.env.DB.prepare(
    `SELECT COUNT(*) as total FROM newsletter_subscribers ${whereClause}`
  ).bind(...bindings).first<{ total: number }>()

  const total = countResult?.total ?? 0

  const results = await c.env.DB.prepare(`
    SELECT id, email, name, subscribed_at, unsubscribed_at, source
    FROM newsletter_subscribers
    ${whereClause}
    ORDER BY subscribed_at DESC
    LIMIT ? OFFSET ?
  `).bind(...bindings, limit, offset).all<{
    id: string
    email: string
    name: string | null
    subscribed_at: number
    unsubscribed_at: number | null
    source: string | null
  }>()

  const subscribers = results.results.map((s) => ({
    id: s.id,
    email: s.email,
    name: s.name,
    subscribedAt: s.subscribed_at,
    unsubscribedAt: s.unsubscribed_at,
    source: s.source,
    isActive: s.unsubscribed_at === null,
  }))

  return c.json({
    subscribers,
    pagination: { total, limit, offset, hasMore: offset + subscribers.length < total },
  })
})

/**
 * POST /admin/newsletter/subscribers/import
 * Import subscribers from CSV
 */
newsletterRouter.post(
  '/subscribers/import',
  zValidator('json', importSubscribersSchema),
  async (c) => {
    const { csv, source } = c.req.valid('json')
    const adminId = getAdminId(c)
    const now = Date.now()

    const parsed = parseSubscriberCsv(csv)

    if (parsed.length === 0) {
      return c.json(
        { error: ERROR_CODES.VALIDATION_ERROR, message: 'No valid subscribers found' },
        400
      )
    }

    let imported = 0
    let skipped = 0

    for (const sub of parsed) {
      try {
        const id = crypto.randomUUID()
        await c.env.DB.prepare(`
          INSERT INTO newsletter_subscribers (id, email, name, subscribed_at, source)
          VALUES (?, ?, ?, ?, ?)
          ON CONFLICT(email) DO NOTHING
        `).bind(id, sub.email, sub.name ?? null, now, source).run()

        imported++
      } catch {
        skipped++
      }
    }

    await logAdminAction(c.env.DB, {
      adminId,
      action: 'import_newsletter_subscribers',
      details: { imported, skipped, total: parsed.length },
    })

    return c.json({ success: true, imported, skipped })
  }
)

/**
 * GET /admin/newsletter/subscribers/export
 * Export subscribers as CSV
 */
newsletterRouter.get('/subscribers/export', async (c) => {
  const adminId = getAdminId(c)

  const results = await c.env.DB.prepare(`
    SELECT id, email, name, subscribed_at, unsubscribed_at, source
    FROM newsletter_subscribers
    WHERE unsubscribed_at IS NULL
    ORDER BY subscribed_at DESC
  `).all<{
    id: string
    email: string
    name: string | null
    subscribed_at: number
    unsubscribed_at: number | null
    source: string | null
  }>()

  const subscribers: Subscriber[] = results.results.map((s) => ({
    id: s.id,
    email: s.email,
    name: s.name,
    subscribedAt: new Date(s.subscribed_at),
    unsubscribedAt: s.unsubscribed_at ? new Date(s.unsubscribed_at) : null,
    source: s.source,
  }))

  const csv = exportSubscribersCsv(subscribers)

  await logAdminAction(c.env.DB, {
    adminId,
    action: 'export_newsletter_subscribers',
    details: { count: subscribers.length },
  })

  return c.text(csv, 200, {
    'Content-Type': 'text/csv',
    'Content-Disposition': 'attachment; filename="subscribers.csv"',
  })
})

// =============================================================================
// Admin Campaign Endpoints
// =============================================================================

/**
 * GET /admin/newsletter/campaigns
 * List all campaigns with pagination
 */
newsletterRouter.get('/campaigns', zValidator('query', listCampaignsSchema), async (c) => {
  const { limit, offset, status } = c.req.valid('query')

  const conditions: string[] = []
  const bindings: (string | number)[] = []

  if (status) {
    conditions.push('status = ?')
    bindings.push(status)
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  const countResult = await c.env.DB.prepare(
    `SELECT COUNT(*) as total FROM newsletter_campaigns ${whereClause}`
  ).bind(...bindings).first<{ total: number }>()

  const total = countResult?.total ?? 0

  const results = await c.env.DB.prepare(`
    SELECT id, subject, preview_text, status, scheduled_for, sent_at,
           recipient_count, open_count, click_count, created_by, created_at, updated_at
    FROM newsletter_campaigns
    ${whereClause}
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `).bind(...bindings, limit, offset).all<{
    id: string
    subject: string
    preview_text: string | null
    status: string
    scheduled_for: number | null
    sent_at: number | null
    recipient_count: number | null
    open_count: number
    click_count: number
    created_by: string
    created_at: number
    updated_at: number | null
  }>()

  const campaigns = results.results.map((c) => ({
    id: c.id,
    subject: c.subject,
    previewText: c.preview_text,
    status: c.status,
    scheduledFor: c.scheduled_for,
    sentAt: c.sent_at,
    recipientCount: c.recipient_count,
    openCount: c.open_count,
    clickCount: c.click_count,
    createdBy: c.created_by,
    createdAt: c.created_at,
    updatedAt: c.updated_at,
  }))

  return c.json({
    campaigns,
    pagination: { total, limit, offset, hasMore: offset + campaigns.length < total },
  })
})

/**
 * GET /admin/newsletter/campaigns/:id
 * Get a single campaign with full content
 */
newsletterRouter.get('/campaigns/:id', async (c) => {
  const campaignId = c.req.param('id')

  const campaign = await c.env.DB.prepare(`
    SELECT id, subject, content, preview_text, status, scheduled_for, sent_at,
           recipient_count, open_count, click_count, created_by, created_at, updated_at
    FROM newsletter_campaigns
    WHERE id = ?
  `).bind(campaignId).first<{
    id: string
    subject: string
    content: string
    preview_text: string | null
    status: string
    scheduled_for: number | null
    sent_at: number | null
    recipient_count: number | null
    open_count: number
    click_count: number
    created_by: string
    created_at: number
    updated_at: number | null
  }>()

  if (!campaign) {
    return c.json({ error: ERROR_CODES.NOT_FOUND, message: 'Campaign not found' }, 404)
  }

  return c.json({
    campaign: {
      id: campaign.id,
      subject: campaign.subject,
      content: campaign.content,
      previewText: campaign.preview_text,
      status: campaign.status,
      scheduledFor: campaign.scheduled_for,
      sentAt: campaign.sent_at,
      recipientCount: campaign.recipient_count,
      openCount: campaign.open_count,
      clickCount: campaign.click_count,
      createdBy: campaign.created_by,
      createdAt: campaign.created_at,
      updatedAt: campaign.updated_at,
    },
  })
})

/**
 * POST /admin/newsletter/campaigns
 * Create a new draft campaign
 */
newsletterRouter.post('/campaigns', zValidator('json', createCampaignSchema), async (c) => {
  const { subject, content, previewText } = c.req.valid('json')
  const adminId = getAdminId(c)
  const now = Date.now()

  const id = crypto.randomUUID()
  await c.env.DB.prepare(`
    INSERT INTO newsletter_campaigns (id, subject, content, preview_text, status, created_by, created_at)
    VALUES (?, ?, ?, ?, 'draft', ?, ?)
  `).bind(id, subject, content, previewText ?? null, adminId, now).run()

  await logAdminAction(c.env.DB, {
    adminId,
    action: 'create_newsletter_campaign',
    details: { campaignId: id, subject },
  })

  return c.json({ success: true, campaignId: id })
})

/**
 * PATCH /admin/newsletter/campaigns/:id
 * Update a draft campaign
 */
newsletterRouter.patch(
  '/campaigns/:id',
  zValidator('json', updateCampaignSchema),
  async (c) => {
    const campaignId = c.req.param('id')
    const body = c.req.valid('json')
    const adminId = getAdminId(c)
    const now = Date.now()

    // Check campaign exists and is draft
    const campaign = await c.env.DB.prepare(
      'SELECT status FROM newsletter_campaigns WHERE id = ?'
    ).bind(campaignId).first<{ status: string }>()

    if (!campaign) {
      return c.json({ error: ERROR_CODES.NOT_FOUND, message: 'Campaign not found' }, 404)
    }

    if (campaign.status !== 'draft') {
      return c.json(
        { error: ERROR_CODES.INVALID_STATE, message: 'Can only edit draft campaigns' },
        400
      )
    }

    const updates: string[] = ['updated_at = ?']
    const bindings: (string | number | null)[] = [now]

    if (body.subject !== undefined) {
      updates.push('subject = ?')
      bindings.push(body.subject)
    }

    if (body.content !== undefined) {
      updates.push('content = ?')
      bindings.push(body.content)
    }

    if (body.previewText !== undefined) {
      updates.push('preview_text = ?')
      bindings.push(body.previewText ?? null)
    }

    bindings.push(campaignId)

    await c.env.DB.prepare(
      `UPDATE newsletter_campaigns SET ${updates.join(', ')} WHERE id = ?`
    ).bind(...bindings).run()

    await logAdminAction(c.env.DB, {
      adminId,
      action: 'update_newsletter_campaign',
      details: { campaignId, updates: Object.keys(body) },
    })

    return c.json({ success: true })
  }
)

/**
 * DELETE /admin/newsletter/campaigns/:id
 * Delete a draft campaign
 */
newsletterRouter.delete('/campaigns/:id', async (c) => {
  const campaignId = c.req.param('id')
  const adminId = getAdminId(c)

  const campaign = await c.env.DB.prepare(
    'SELECT status, subject FROM newsletter_campaigns WHERE id = ?'
  ).bind(campaignId).first<{ status: string; subject: string }>()

  if (!campaign) {
    return c.json({ error: ERROR_CODES.NOT_FOUND, message: 'Campaign not found' }, 404)
  }

  if (campaign.status !== 'draft') {
    return c.json(
      { error: ERROR_CODES.INVALID_STATE, message: 'Can only delete draft campaigns' },
      400
    )
  }

  await c.env.DB.prepare('DELETE FROM newsletter_campaigns WHERE id = ?')
    .bind(campaignId).run()

  await logAdminAction(c.env.DB, {
    adminId,
    action: 'delete_newsletter_campaign',
    details: { campaignId, subject: campaign.subject },
  })

  return c.json({ success: true })
})

/**
 * GET /admin/newsletter/campaigns/:id/preview
 * Preview rendered campaign HTML
 */
newsletterRouter.get('/campaigns/:id/preview', async (c) => {
  const campaignId = c.req.param('id')

  const campaign = await c.env.DB.prepare(
    'SELECT subject, content, preview_text FROM newsletter_campaigns WHERE id = ?'
  ).bind(campaignId).first<{
    subject: string
    content: string
    preview_text: string | null
  }>()

  if (!campaign) {
    return c.json({ error: ERROR_CODES.NOT_FOUND, message: 'Campaign not found' }, 404)
  }

  const previewUrl = `${c.env.API_URL}/v1/admin/newsletter/unsubscribe?token=preview`

  // Import the newsletter email template
  const { newsletterEmail } = await import('../../lib/email/templates')
  const { html } = newsletterEmail({
    content: campaign.content,
    previewText: campaign.preview_text ?? undefined,
    unsubscribeUrl: previewUrl,
  })

  return c.json({ subject: campaign.subject, html })
})

/**
 * POST /admin/newsletter/campaigns/:id/test
 * Send a test email
 */
newsletterRouter.post(
  '/campaigns/:id/test',
  zValidator('json', testEmailSchema),
  async (c) => {
    const campaignId = c.req.param('id')
    const { email } = c.req.valid('json')
    const adminId = getAdminId(c)

    const campaign = await c.env.DB.prepare(`
      SELECT id, subject, content, preview_text, status
      FROM newsletter_campaigns WHERE id = ?
    `).bind(campaignId).first<{
      id: string
      subject: string
      content: string
      preview_text: string | null
      status: string
    }>()

    if (!campaign) {
      return c.json({ error: ERROR_CODES.NOT_FOUND, message: 'Campaign not found' }, 404)
    }

    const success = await sendTestEmail(
      c.env,
      {
        id: campaign.id,
        subject: campaign.subject,
        content: campaign.content,
        previewText: campaign.preview_text,
        status: campaign.status as Campaign['status'],
        scheduledFor: null,
        sentAt: null,
        recipientCount: null,
        openCount: 0,
        clickCount: 0,
        createdBy: adminId,
        createdAt: new Date(),
        updatedAt: null,
      },
      email
    )

    if (!success) {
      return c.json(
        { error: ERROR_CODES.INTERNAL_ERROR, message: 'Failed to send test email' },
        500
      )
    }

    await logAdminAction(c.env.DB, {
      adminId,
      action: 'send_test_newsletter',
      details: { campaignId, testEmail: email },
    })

    return c.json({ success: true })
  }
)

/**
 * POST /admin/newsletter/campaigns/:id/send
 * Send or schedule a campaign
 */
newsletterRouter.post(
  '/campaigns/:id/send',
  zValidator('json', sendCampaignSchema),
  async (c) => {
    const campaignId = c.req.param('id')
    const { scheduledFor } = c.req.valid('json')
    const adminId = getAdminId(c)
    const now = Date.now()

    const campaign = await c.env.DB.prepare(`
      SELECT id, subject, content, preview_text, status
      FROM newsletter_campaigns WHERE id = ?
    `).bind(campaignId).first<{
      id: string
      subject: string
      content: string
      preview_text: string | null
      status: string
    }>()

    if (!campaign) {
      return c.json({ error: ERROR_CODES.NOT_FOUND, message: 'Campaign not found' }, 404)
    }

    if (campaign.status !== 'draft' && campaign.status !== 'scheduled') {
      return c.json(
        { error: ERROR_CODES.INVALID_STATE, message: 'Campaign already sent or sending' },
        400
      )
    }

    // If scheduling for later
    if (scheduledFor && scheduledFor > now) {
      await c.env.DB.prepare(`
        UPDATE newsletter_campaigns
        SET status = 'scheduled', scheduled_for = ?, updated_at = ?
        WHERE id = ?
      `).bind(scheduledFor, now, campaignId).run()

      await logAdminAction(c.env.DB, {
        adminId,
        action: 'schedule_newsletter_campaign',
        details: { campaignId, scheduledFor: new Date(scheduledFor).toISOString() },
      })

      return c.json({ success: true, scheduled: true, scheduledFor })
    }

    // Send immediately
    // Get active subscribers
    const subscribersResult = await c.env.DB.prepare(`
      SELECT id, email, name, subscribed_at, unsubscribed_at, source
      FROM newsletter_subscribers
      WHERE unsubscribed_at IS NULL
    `).all<{
      id: string
      email: string
      name: string | null
      subscribed_at: number
      unsubscribed_at: number | null
      source: string | null
    }>()

    const subscribers: Subscriber[] = subscribersResult.results.map((s) => ({
      id: s.id,
      email: s.email,
      name: s.name,
      subscribedAt: new Date(s.subscribed_at),
      unsubscribedAt: null,
      source: s.source,
    }))

    if (subscribers.length === 0) {
      return c.json(
        { error: ERROR_CODES.VALIDATION_ERROR, message: 'No active subscribers' },
        400
      )
    }

    // Update status to sending
    await c.env.DB.prepare(`
      UPDATE newsletter_campaigns
      SET status = 'sending', updated_at = ?
      WHERE id = ?
    `).bind(now, campaignId).run()

    // Send emails
    const results = await sendNewsletter(
      c.env,
      {
        id: campaign.id,
        subject: campaign.subject,
        content: campaign.content,
        previewText: campaign.preview_text,
        status: 'sending',
        scheduledFor: null,
        sentAt: null,
        recipientCount: subscribers.length,
        openCount: 0,
        clickCount: 0,
        createdBy: adminId,
        createdAt: new Date(),
        updatedAt: null,
      },
      subscribers
    )

    // Update campaign as sent
    const sentAt = Date.now()
    await c.env.DB.prepare(`
      UPDATE newsletter_campaigns
      SET status = 'sent', sent_at = ?, recipient_count = ?, updated_at = ?
      WHERE id = ?
    `).bind(sentAt, results.sent, sentAt, campaignId).run()

    await logAdminAction(c.env.DB, {
      adminId,
      action: 'send_newsletter_campaign',
      details: {
        campaignId,
        subject: campaign.subject,
        sent: results.sent,
        failed: results.failed,
      },
    })

    return c.json({ success: true, sent: results.sent, failed: results.failed })
  }
)

/**
 * GET /admin/newsletter/campaigns/:id/stats
 * Get campaign statistics
 */
newsletterRouter.get('/campaigns/:id/stats', async (c) => {
  const campaignId = c.req.param('id')

  const campaign = await c.env.DB.prepare(`
    SELECT recipient_count, open_count, click_count, sent_at
    FROM newsletter_campaigns WHERE id = ?
  `).bind(campaignId).first<{
    recipient_count: number | null
    open_count: number
    click_count: number
    sent_at: number | null
  }>()

  if (!campaign) {
    return c.json({ error: ERROR_CODES.NOT_FOUND, message: 'Campaign not found' }, 404)
  }

  const recipientCount = campaign.recipient_count ?? 0
  const openRate = recipientCount > 0 ? (campaign.open_count / recipientCount) * 100 : 0
  const clickRate = recipientCount > 0 ? (campaign.click_count / recipientCount) * 100 : 0

  return c.json({
    stats: {
      recipientCount,
      openCount: campaign.open_count,
      clickCount: campaign.click_count,
      openRate: Math.round(openRate * 100) / 100,
      clickRate: Math.round(clickRate * 100) / 100,
      sentAt: campaign.sent_at,
    },
  })
})
