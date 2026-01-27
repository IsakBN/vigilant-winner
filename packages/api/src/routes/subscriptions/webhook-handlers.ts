/**
 * Stripe Webhook Event Handlers
 *
 * Processes different Stripe webhook events for subscription management.
 */

import type { Env } from '../../types/env'
import type { StripeEvent } from '../../lib/stripe'

/**
 * Handle Stripe webhook events with database access
 */
export async function handleStripeEvent(env: Env, event: StripeEvent): Promise<void> {
  const db = env.DB
  const now = Math.floor(Date.now() / 1000)

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as {
        client_reference_id: string
        customer: string
        subscription: string
        metadata: { plan_id: string }
      }

      // Create subscription record
      await db.prepare(`
        INSERT INTO subscriptions (id, user_id, plan_id, status, stripe_customer_id,
          stripe_subscription_id, created_at, updated_at)
        VALUES (?, ?, ?, 'active', ?, ?, ?, ?)
      `).bind(
        crypto.randomUUID(),
        session.client_reference_id,
        session.metadata.plan_id,
        session.customer,
        session.subscription,
        now,
        now
      ).run()
      break
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as {
        id: string
        status: string
        current_period_start: number
        current_period_end: number
        cancel_at_period_end: boolean
      }

      await db.prepare(`
        UPDATE subscriptions SET
          status = ?,
          current_period_start = ?,
          current_period_end = ?,
          cancel_at_period_end = ?,
          updated_at = ?
        WHERE stripe_subscription_id = ?
      `).bind(
        mapStripeStatus(subscription.status),
        subscription.current_period_start,
        subscription.current_period_end,
        subscription.cancel_at_period_end ? 1 : 0,
        now,
        subscription.id
      ).run()
      break
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as { id: string }

      await db.prepare(`
        UPDATE subscriptions SET status = 'expired', updated_at = ?
        WHERE stripe_subscription_id = ?
      `).bind(now, subscription.id).run()
      break
    }

    case 'invoice.created': {
      const invoice = event.data.object as {
        id: string
        customer: string
        subscription: string | null
        status: string
        currency: string
        amount_due: number
        amount_paid: number
        hosted_invoice_url: string | null
        invoice_pdf: string | null
        period_start: number
        period_end: number
        created: number
      }

      // Get user ID from subscription or customer
      const sub = await db.prepare(`
        SELECT user_id FROM subscriptions WHERE stripe_customer_id = ? LIMIT 1
      `).bind(invoice.customer).first<{ user_id: string }>()

      if (sub) {
        await db.prepare(`
          INSERT INTO invoices (
            id, user_id, stripe_customer_id, stripe_invoice_url, stripe_pdf_url,
            status, currency, amount_due, amount_paid, period_start, period_end,
            created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            status = excluded.status,
            stripe_invoice_url = excluded.stripe_invoice_url,
            stripe_pdf_url = excluded.stripe_pdf_url,
            updated_at = excluded.updated_at
        `).bind(
          invoice.id,
          sub.user_id,
          invoice.customer,
          invoice.hosted_invoice_url,
          invoice.invoice_pdf,
          invoice.status,
          invoice.currency,
          invoice.amount_due,
          invoice.amount_paid,
          invoice.period_start,
          invoice.period_end,
          invoice.created,
          now
        ).run()
      }
      break
    }

    case 'invoice.paid': {
      const invoice = event.data.object as {
        id: string
        amount_paid: number
        hosted_invoice_url: string | null
        invoice_pdf: string | null
      }

      await db.prepare(`
        UPDATE invoices SET
          status = 'paid',
          amount_paid = ?,
          stripe_invoice_url = COALESCE(?, stripe_invoice_url),
          stripe_pdf_url = COALESCE(?, stripe_pdf_url),
          paid_at = ?,
          updated_at = ?
        WHERE id = ?
      `).bind(
        invoice.amount_paid,
        invoice.hosted_invoice_url,
        invoice.invoice_pdf,
        now,
        now,
        invoice.id
      ).run()
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as {
        id: string
        subscription: string
      }

      // Update invoice status
      await db.prepare(`
        UPDATE invoices SET status = 'open', updated_at = ? WHERE id = ?
      `).bind(now, invoice.id).run()

      // Update subscription status
      await db.prepare(`
        UPDATE subscriptions SET status = 'past_due', updated_at = ?
        WHERE stripe_subscription_id = ?
      `).bind(now, invoice.subscription).run()
      break
    }

    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as {
        id: string
        subscription: string
        amount_paid: number
      }

      await db.prepare(`
        UPDATE invoices SET status = 'paid', amount_paid = ?, paid_at = ?, updated_at = ?
        WHERE id = ?
      `).bind(invoice.amount_paid, now, now, invoice.id).run()

      // Ensure subscription is active
      await db.prepare(`
        UPDATE subscriptions SET status = 'active', updated_at = ?
        WHERE stripe_subscription_id = ? AND status = 'past_due'
      `).bind(now, invoice.subscription).run()
      break
    }

    case 'customer.updated': {
      // Optional: sync customer email or other metadata
      // For now, just log that we received it
      break
    }

    case 'charge.failed': {
      // Log failed charge - invoice.payment_failed handles subscription status
      break
    }

    case 'charge.succeeded': {
      // Log successful charge - invoice.paid handles invoice status
      break
    }
  }
}

/**
 * Map Stripe subscription status to our internal status
 */
function mapStripeStatus(status: string): string {
  switch (status) {
    case 'active': return 'active'
    case 'trialing': return 'trialing'
    case 'past_due': return 'past_due'
    case 'canceled': return 'cancelled'
    default: return 'active'
  }
}
