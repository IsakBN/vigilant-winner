/**
 * @agent remediate-api-key-middleware
 * @modified 2026-01-25
 *
 * API key authentication middleware for SDK and CI/CD integrations.
 *
 * Key features:
 * - Validates bn_live_ or bn_test_ prefixed API keys
 * - Bcrypt verification with KV caching (5 min TTL)
 * - Permission-based authorization
 * - Tracks last_used_at for analytics
 */

import { createMiddleware } from 'hono/factory'
import bcrypt from 'bcryptjs'
import { ERROR_CODES } from '@bundlenudge/shared'
import type { Env } from '../types/env'

/** Bcrypt cost factor - 12 rounds for secure hashing */
const BCRYPT_ROUNDS = 12

/** Cache TTL for verified API keys (5 minutes) */
const AUTH_CACHE_TTL_SECONDS = 300

/** API key format: bn_{live|test}_{8 alphanumeric}_{24+ base64url} */
const API_KEY_REGEX = /^bn_(live|test)_[a-z0-9]{8}_[A-Za-z0-9_-]{24,}$/

/** First 16 chars used as lookup prefix */
const API_KEY_PREFIX_LENGTH = 16

/** Available API key permissions */
export const API_KEY_PERMISSIONS = {
  'release:create': 'Create new releases',
  'release:read': 'Read release information',
  'release:update': 'Update release settings',
  'release:delete': 'Delete releases',
  'device:read': 'Read device information',
  'update:check': 'Check for updates (SDK)',
} as const

export type ApiKeyPermission = keyof typeof API_KEY_PERMISSIONS

export interface ApiKeyData {
  id: string
  appId: string
  name: string
  permissions: ApiKeyPermission[]
}

interface AuthCacheEntry {
  appId: string
  keyId: string
  name: string
  permissions: ApiKeyPermission[]
  verifiedAt: number
}

interface ApiKeyVariables {
  apiKey: ApiKeyData
}

/**
 * Generate SHA-256 hash for cache key
 */
async function sha256(data: string): Promise<string> {
  const encoder = new TextEncoder()
  const dataBuffer = encoder.encode(data)
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Generate cache key for API key verification
 */
async function generateAuthCacheKey(prefix: string, fullKey: string): Promise<string> {
  const keyHash = await sha256(fullKey)
  return `api-key:${prefix}:${keyHash}`
}

/**
 * Validate API key format
 */
function isValidApiKeyFormat(apiKey: string): boolean {
  return API_KEY_REGEX.test(apiKey)
}

/**
 * Hash an API key for storage using bcrypt
 */
export async function hashApiKey(apiKey: string): Promise<string> {
  return bcrypt.hash(apiKey, BCRYPT_ROUNDS)
}

/**
 * Verify an API key against a bcrypt hash
 */
async function verifyApiKey(plainKey: string, storedHash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(plainKey, storedHash)
  } catch {
    return false
  }
}

/**
 * Middleware that authenticates via API key
 * Expects: Authorization: Bearer bn_xxx
 * Sets: c.set('apiKey', apiKeyData)
 */
export const apiKeyMiddleware = createMiddleware<{
  Bindings: Env
  Variables: ApiKeyVariables
}>(async (c, next) => {
  const authHeader = c.req.header('Authorization')

  if (!authHeader?.startsWith('Bearer ')) {
    return c.json(
      { error: ERROR_CODES.UNAUTHORIZED, message: 'Missing API key' },
      401
    )
  }

  const apiKey = authHeader.slice(7)

  if (!isValidApiKeyFormat(apiKey)) {
    return c.json(
      { error: ERROR_CODES.UNAUTHORIZED, message: 'Invalid API key format' },
      401
    )
  }

  const prefix = apiKey.slice(0, API_KEY_PREFIX_LENGTH)
  const cacheKey = await generateAuthCacheKey(prefix, apiKey)

  // Check KV cache first
  const cachedResult = await c.env.RATE_LIMIT.get<AuthCacheEntry>(cacheKey, 'json')

  if (cachedResult) {
    const cacheAge = Date.now() - cachedResult.verifiedAt
    if (cacheAge < AUTH_CACHE_TTL_SECONDS * 1000) {
      c.set('apiKey', {
        id: cachedResult.keyId,
        appId: cachedResult.appId,
        name: cachedResult.name,
        permissions: cachedResult.permissions,
      })
      return next()
    }
  }

  // Look up by prefix in database
  const keyRecords = await c.env.DB.prepare(`
    SELECT ak.id, ak.key_hash, ak.permissions, ak.revoked_at, ak.name, a.id as app_id
    FROM api_keys ak
    JOIN apps a ON ak.app_id = a.id
    WHERE ak.key_prefix = ? AND a.deleted_at IS NULL
  `).bind(prefix).all<{
    id: string
    key_hash: string
    app_id: string
    permissions: string
    revoked_at: number | null
    name: string
  }>()

  if (keyRecords.results.length === 0) {
    return c.json(
      { error: ERROR_CODES.UNAUTHORIZED, message: 'Invalid API key' },
      401
    )
  }

  // Verify against stored hashes
  let matchedKey: typeof keyRecords.results[0] | null = null

  for (const record of keyRecords.results) {
    const isValid = await verifyApiKey(apiKey, record.key_hash)
    if (isValid) {
      matchedKey = record
      break
    }
  }

  if (!matchedKey) {
    return c.json(
      { error: ERROR_CODES.UNAUTHORIZED, message: 'Invalid API key' },
      401
    )
  }

  if (matchedKey.revoked_at) {
    return c.json(
      { error: ERROR_CODES.UNAUTHORIZED, message: 'API key has been revoked' },
      401
    )
  }

  const permissions = JSON.parse(matchedKey.permissions) as ApiKeyPermission[]

  // Cache successful verification
  const cacheEntry: AuthCacheEntry = {
    appId: matchedKey.app_id,
    keyId: matchedKey.id,
    name: matchedKey.name,
    permissions,
    verifiedAt: Date.now(),
  }
  c.executionCtx.waitUntil(
    c.env.RATE_LIMIT.put(cacheKey, JSON.stringify(cacheEntry), {
      expirationTtl: AUTH_CACHE_TTL_SECONDS,
    })
  )

  // Update last_used_at asynchronously
  c.executionCtx.waitUntil(
    c.env.DB.prepare(
      'UPDATE api_keys SET last_used_at = ? WHERE id = ?'
    ).bind(Math.floor(Date.now() / 1000), matchedKey.id).run()
  )

  c.set('apiKey', {
    id: matchedKey.id,
    appId: matchedKey.app_id,
    name: matchedKey.name,
    permissions,
  })

  return next()
})

/**
 * Create a middleware that requires specific permissions
 */
export function requirePermission(required: ApiKeyPermission | ApiKeyPermission[]): ReturnType<typeof createMiddleware<{
  Bindings: Env
  Variables: ApiKeyVariables
}>> {
  const requiredPerms = Array.isArray(required) ? required : [required]

  return createMiddleware<{
    Bindings: Env
    Variables: ApiKeyVariables
  }>(async (c, next) => {
    const apiKey = c.get('apiKey') as ApiKeyData | undefined

    if (!apiKey) {
      return c.json(
        { error: ERROR_CODES.UNAUTHORIZED, message: 'API key required' },
        401
      )
    }

    const hasPermission = requiredPerms.every(p => apiKey.permissions.includes(p))

    if (!hasPermission) {
      return c.json(
        {
          error: ERROR_CODES.FORBIDDEN,
          message: `Missing required permission(s): ${requiredPerms.join(', ')}`,
        },
        403
      )
    }

    return next()
  })
}
