/**
 * Device token utilities for SDK authentication
 *
 * Uses JWT for stateless device authentication
 */

const DEVICE_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000  // 30 days
const REFRESH_WINDOW_MS = 7 * 24 * 60 * 60 * 1000     // 7 days before expiry

export interface DeviceTokenPayload {
  deviceId: string
  appId: string
  bundleId: string
  platform: 'ios' | 'android'
  iat: number
  exp: number
}

export interface DeviceTokenResult {
  token: string
  expiresAt: number
}

/**
 * Generate a device token for SDK authentication
 */
export async function generateDeviceToken(
  payload: Omit<DeviceTokenPayload, 'iat' | 'exp'>,
  secret: string
): Promise<DeviceTokenResult> {
  const now = Date.now()
  const expiresAt = now + DEVICE_TOKEN_TTL_MS

  const fullPayload: DeviceTokenPayload = {
    ...payload,
    iat: now,
    exp: expiresAt,
  }

  const token = await signJwt(fullPayload, secret)

  return { token, expiresAt }
}

/**
 * Verify and decode a device token
 * Returns null if invalid or expired
 */
export async function verifyDeviceToken(
  token: string,
  secret: string
): Promise<DeviceTokenPayload | null> {
  try {
    const payload = await verifyJwt(token, secret)

    if (!payload) {
      return null
    }

    // Check expiration
    if (payload.exp < Date.now()) {
      return null
    }

    return payload
  } catch {
    return null
  }
}

/**
 * Check if a token should be refreshed (within 7 days of expiry)
 */
export function shouldRefreshToken(payload: DeviceTokenPayload): boolean {
  const timeUntilExpiry = payload.exp - Date.now()
  return timeUntilExpiry < REFRESH_WINDOW_MS
}

/**
 * Decode JWT payload without verification (for getting appId before secret lookup)
 */
export function decodeJwtPayload(token: string): DeviceTokenPayload | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) {
      return null
    }

    const payloadBase64 = parts[1]
    if (!payloadBase64) {
      return null
    }

    const payload = JSON.parse(atob(payloadBase64)) as DeviceTokenPayload
    return payload
  } catch {
    return null
  }
}

// JWT implementation using Web Crypto API
async function signJwt(payload: DeviceTokenPayload, secret: string): Promise<string> {
  const header = { alg: 'HS256', typ: 'JWT' }

  const encodedHeader = btoa(JSON.stringify(header))
  const encodedPayload = btoa(JSON.stringify(payload))
  const dataToSign = `${encodedHeader}.${encodedPayload}`

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )

  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(dataToSign))
  const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)))

  return `${dataToSign}.${encodedSignature}`
}

async function verifyJwt(token: string, secret: string): Promise<DeviceTokenPayload | null> {
  const parts = token.split('.')
  if (parts.length !== 3) {
    return null
  }

  const [encodedHeader, encodedPayload, encodedSignature] = parts
  if (!encodedHeader || !encodedPayload || !encodedSignature) {
    return null
  }

  const dataToVerify = `${encodedHeader}.${encodedPayload}`

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  )

  const signatureBytes = Uint8Array.from(atob(encodedSignature), (c) => c.charCodeAt(0))

  const isValid = await crypto.subtle.verify(
    'HMAC',
    key,
    signatureBytes,
    new TextEncoder().encode(dataToVerify)
  )

  if (!isValid) {
    return null
  }

  return JSON.parse(atob(encodedPayload)) as DeviceTokenPayload
}
