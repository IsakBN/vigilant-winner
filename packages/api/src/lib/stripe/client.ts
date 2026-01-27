/**
 * Stripe API Client
 *
 * Lightweight client for Stripe API using fetch.
 * No SDK required - uses direct API calls.
 */

const STRIPE_API_BASE = 'https://api.stripe.com/v1'

export interface StripeError {
  error: {
    type: string
    code?: string
    message: string
    param?: string
  }
}

export interface StripeResponse<T> {
  data?: T
  error?: StripeError['error']
}

/**
 * Make a request to the Stripe API
 */
export async function stripeRequest<T>(
  secretKey: string,
  endpoint: string,
  method: 'GET' | 'POST' | 'DELETE',
  params?: Record<string, string>
): Promise<StripeResponse<T>> {
  const url = `${STRIPE_API_BASE}${endpoint}`

  const headers: HeadersInit = {
    'Authorization': `Bearer ${secretKey}`,
    'Content-Type': 'application/x-www-form-urlencoded',
  }

  const response = await fetch(url, {
    method,
    headers,
    body: params ? new URLSearchParams(params).toString() : undefined,
  })

  const json = await response.json() as T | StripeError

  if (!response.ok) {
    return { error: (json as StripeError).error }
  }

  return { data: json as T }
}

/**
 * Create a Stripe checkout session
 */
export async function createCheckoutSession(
  secretKey: string,
  params: {
    priceId: string
    successUrl: string
    cancelUrl: string
    clientReferenceId: string
    metadata?: Record<string, string>
  }
): Promise<StripeResponse<{ id: string; url: string }>> {
  const requestParams: Record<string, string> = {
    'mode': 'subscription',
    'line_items[0][price]': params.priceId,
    'line_items[0][quantity]': '1',
    'success_url': params.successUrl,
    'cancel_url': params.cancelUrl,
    'client_reference_id': params.clientReferenceId,
  }

  if (params.metadata) {
    for (const [key, value] of Object.entries(params.metadata)) {
      requestParams[`metadata[${key}]`] = value
      requestParams[`subscription_data[metadata][${key}]`] = value
    }
  }

  return stripeRequest(secretKey, '/checkout/sessions', 'POST', requestParams)
}

/**
 * Create a Stripe customer portal session
 */
export async function createPortalSession(
  secretKey: string,
  customerId: string,
  returnUrl: string
): Promise<StripeResponse<{ id: string; url: string }>> {
  return stripeRequest(secretKey, '/billing_portal/sessions', 'POST', {
    'customer': customerId,
    'return_url': returnUrl,
  })
}

/**
 * Get a Stripe subscription
 */
export async function getSubscription(
  secretKey: string,
  subscriptionId: string
): Promise<StripeResponse<StripeSubscription>> {
  return stripeRequest(secretKey, `/subscriptions/${subscriptionId}`, 'GET')
}

/**
 * Cancel a Stripe subscription at period end
 */
export async function cancelSubscription(
  secretKey: string,
  subscriptionId: string
): Promise<StripeResponse<StripeSubscription>> {
  return stripeRequest(secretKey, `/subscriptions/${subscriptionId}`, 'POST', {
    'cancel_at_period_end': 'true',
  })
}

// =============================================================================
// Stripe Types
// =============================================================================

export interface StripeSubscription {
  id: string
  customer: string
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid'
  current_period_start: number
  current_period_end: number
  cancel_at_period_end: boolean
  metadata: Record<string, string>
}

export interface StripeCheckoutSession {
  id: string
  customer: string
  subscription: string
  client_reference_id: string
  metadata: Record<string, string>
}

export interface StripeInvoice {
  id: string
  subscription: string | null
  customer: string
  status: 'draft' | 'open' | 'paid' | 'uncollectible' | 'void'
  currency: string
  amount_due: number
  amount_paid: number
  hosted_invoice_url: string | null
  invoice_pdf: string | null
  period_start: number
  period_end: number
  created: number
}

/**
 * List invoices for a customer
 */
export async function listInvoices(
  secretKey: string,
  customerId: string,
  limit: number = 10
): Promise<StripeResponse<{ data: StripeInvoice[] }>> {
  return stripeRequest(secretKey, '/invoices', 'GET', {
    'customer': customerId,
    'limit': String(limit),
  })
}

/**
 * Get a single invoice
 */
export async function getInvoice(
  secretKey: string,
  invoiceId: string
): Promise<StripeResponse<StripeInvoice>> {
  return stripeRequest(secretKey, `/invoices/${invoiceId}`, 'GET')
}
