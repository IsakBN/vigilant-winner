/**
 * Invoice Routes
 *
 * Provides billing history and invoice access for users.
 *
 * @agent billing-system
 * @created 2026-01-26
 */

import { Hono } from 'hono'
import type { Env } from '../../types/env'
import { listInvoices } from '../../lib/stripe'

// =============================================================================
// Types
// =============================================================================

interface InvoiceRow {
  id: string
  user_id: string
  subscription_id: string | null
  stripe_customer_id: string
  stripe_invoice_url: string | null
  stripe_pdf_url: string | null
  status: string
  currency: string
  amount_due: number
  amount_paid: number
  period_start: number | null
  period_end: number | null
  paid_at: number | null
  created_at: number
}

// =============================================================================
// Router
// =============================================================================

export const invoicesRouter = new Hono<{ Bindings: Env }>()

/**
 * GET /v1/invoices
 * List user's invoices
 */
invoicesRouter.get('/', async (c) => {
  const userId = c.req.header('X-User-Id')
  const limit = Math.min(Number(c.req.query('limit')) || 20, 100)
  const offset = Number(c.req.query('offset')) || 0

  if (!userId) {
    return c.json({ error: 'unauthorized', message: 'Authentication required' }, 401)
  }

  // Get invoices from DB
  const result = await c.env.DB.prepare(`
    SELECT * FROM invoices
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `).bind(userId, limit, offset).all<InvoiceRow>()

  const countResult = await c.env.DB.prepare(`
    SELECT COUNT(*) as total FROM invoices WHERE user_id = ?
  `).bind(userId).first<{ total: number }>()

  return c.json({
    invoices: result.results.map(formatInvoice),
    pagination: {
      total: countResult?.total ?? 0,
      limit,
      offset,
      hasMore: offset + result.results.length < (countResult?.total ?? 0),
    },
  })
})

/**
 * GET /v1/invoices/:invoiceId
 * Get a single invoice
 */
invoicesRouter.get('/:invoiceId', async (c) => {
  const userId = c.req.header('X-User-Id')
  const invoiceId = c.req.param('invoiceId')

  if (!userId) {
    return c.json({ error: 'unauthorized', message: 'Authentication required' }, 401)
  }

  // Get from DB first
  const invoice = await c.env.DB.prepare(`
    SELECT * FROM invoices WHERE id = ? AND user_id = ?
  `).bind(invoiceId, userId).first<InvoiceRow>()

  if (!invoice) {
    return c.json({ error: 'not_found', message: 'Invoice not found' }, 404)
  }

  return c.json({ invoice: formatInvoice(invoice) })
})

/**
 * POST /v1/invoices/sync
 * Sync invoices from Stripe (admin or user can call)
 */
invoicesRouter.post('/sync', async (c) => {
  const userId = c.req.header('X-User-Id')

  if (!userId) {
    return c.json({ error: 'unauthorized', message: 'Authentication required' }, 401)
  }

  // Get user's Stripe customer ID
  const subscription = await c.env.DB.prepare(`
    SELECT stripe_customer_id FROM subscriptions
    WHERE user_id = ? AND stripe_customer_id IS NOT NULL
    ORDER BY created_at DESC LIMIT 1
  `).bind(userId).first<{ stripe_customer_id: string }>()

  if (!subscription?.stripe_customer_id) {
    return c.json({ error: 'no_subscription', message: 'No subscription found' }, 404)
  }

  // Fetch from Stripe
  const result = await listInvoices(c.env.STRIPE_SECRET_KEY, subscription.stripe_customer_id, 100)

  if (result.error) {
    return c.json({ error: 'stripe_error', message: result.error.message }, 500)
  }

  const now = Math.floor(Date.now() / 1000)
  let synced = 0

  // Upsert invoices
  for (const invoice of result.data?.data ?? []) {
    await c.env.DB.prepare(`
      INSERT INTO invoices (
        id, user_id, stripe_customer_id, stripe_invoice_url, stripe_pdf_url,
        status, currency, amount_due, amount_paid, period_start, period_end,
        paid_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        status = excluded.status,
        amount_paid = excluded.amount_paid,
        stripe_invoice_url = excluded.stripe_invoice_url,
        stripe_pdf_url = excluded.stripe_pdf_url,
        paid_at = excluded.paid_at,
        updated_at = excluded.updated_at
    `).bind(
      invoice.id,
      userId,
      invoice.customer,
      invoice.hosted_invoice_url,
      invoice.invoice_pdf,
      invoice.status,
      invoice.currency,
      invoice.amount_due,
      invoice.amount_paid,
      invoice.period_start,
      invoice.period_end,
      invoice.status === 'paid' ? now : null,
      invoice.created,
      now
    ).run()
    synced++
  }

  return c.json({ synced, total: result.data?.data.length ?? 0 })
})

// =============================================================================
// Helpers
// =============================================================================

function formatInvoice(row: InvoiceRow): {
  id: string
  status: string
  currency: string
  amountDue: number
  amountPaid: number
  invoiceUrl: string | null
  pdfUrl: string | null
  periodStart: number | null
  periodEnd: number | null
  paidAt: number | null
  createdAt: number
} {
  return {
    id: row.id,
    status: row.status,
    currency: row.currency,
    amountDue: row.amount_due,
    amountPaid: row.amount_paid,
    invoiceUrl: row.stripe_invoice_url,
    pdfUrl: row.stripe_pdf_url,
    periodStart: row.period_start,
    periodEnd: row.period_end,
    paidAt: row.paid_at,
    createdAt: row.created_at,
  }
}
