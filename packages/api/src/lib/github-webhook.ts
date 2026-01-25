/**
 * GitHub Webhook Signature Verification
 *
 * Verifies HMAC-SHA256 signatures from GitHub webhook events
 */

const encoder = new TextEncoder()

/**
 * Verify a GitHub webhook signature
 */
export async function verifyGitHubWebhook(
  payload: string,
  signature: string | undefined,
  secret: string
): Promise<boolean> {
  if (!signature) return false

  try {
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )

    const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(payload))
    const expected = `sha256=${Array.from(new Uint8Array(sig))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')}`

    // Constant-time comparison to prevent timing attacks
    if (signature.length !== expected.length) {
      return false
    }

    let result = 0
    for (let i = 0; i < signature.length; i++) {
      result |= signature.charCodeAt(i) ^ expected.charCodeAt(i)
    }

    return result === 0
  } catch {
    return false
  }
}

/**
 * Generate a webhook signature for testing
 */
export async function generateGitHubSignature(
  payload: string,
  secret: string
): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )

  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(payload))
  return `sha256=${Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')}`
}
