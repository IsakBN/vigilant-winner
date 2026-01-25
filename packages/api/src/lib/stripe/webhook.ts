/**
 * Stripe Webhook Signature Verification
 *
 * Verifies Stripe webhook signatures using HMAC-SHA256.
 */

/**
 * Verify a Stripe webhook signature
 *
 * @param payload - Raw request body as string
 * @param signature - Stripe-Signature header value
 * @param secret - Webhook signing secret
 * @returns true if signature is valid
 */
export async function verifyStripeSignature(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  try {
    // Parse signature header: t=timestamp,v1=signature
    const elements = parseSignatureHeader(signature)
    const timestamp = elements.t
    const sig = elements.v1

    if (!timestamp || !sig) {
      return false
    }

    // Verify timestamp is within tolerance (5 minutes)
    const now = Math.floor(Date.now() / 1000)
    const tolerance = 300 // 5 minutes
    if (Math.abs(now - parseInt(timestamp, 10)) > tolerance) {
      return false
    }

    // Compute expected signature
    const signedPayload = `${timestamp}.${payload}`
    const expectedSignature = await computeHmacSha256(signedPayload, secret)

    // Constant-time comparison
    return constantTimeEqual(sig, expectedSignature)
  } catch {
    return false
  }
}

/**
 * Parse the Stripe-Signature header
 */
function parseSignatureHeader(header: string): Record<string, string> {
  const result: Record<string, string> = {}

  for (const part of header.split(',')) {
    const [key, value] = part.split('=')
    if (key && value) {
      result[key] = value
    }
  }

  return result
}

/**
 * Compute HMAC-SHA256 signature
 */
async function computeHmacSha256(message: string, secret: string): Promise<string> {
  const encoder = new TextEncoder()

  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )

  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(message)
  )

  return bufferToHex(signature)
}

/**
 * Convert ArrayBuffer to hex string
 */
function bufferToHex(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Constant-time string comparison to prevent timing attacks
 */
function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false
  }

  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }

  return result === 0
}

// =============================================================================
// Stripe Event Types
// =============================================================================

export interface StripeEvent {
  id: string
  type: string
  data: {
    object: Record<string, unknown>
  }
}

export type StripeEventType =
  | 'checkout.session.completed'
  | 'customer.subscription.updated'
  | 'customer.subscription.deleted'
  | 'invoice.payment_failed'
