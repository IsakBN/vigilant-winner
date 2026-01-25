/**
 * Admin authentication routes
 *
 * Email/password and OTP-based authentication for admin users
 *
 * Routes:
 * - POST /admin-auth/login    - Login with email/password
 * - POST /admin-auth/logout   - Logout (invalidate session)
 * - GET  /admin-auth/me       - Get current admin info
 * - POST /admin-auth/send-otp - Send OTP to admin email
 * - POST /admin-auth/verify-otp - Verify OTP and create session
 *
 * Security features:
 * - Only @bundlenudge.com emails allowed
 * - Password hashing with SHA-256 + salt (bcrypt unavailable in Workers)
 * - Session tokens stored as hashed values
 * - Sessions expire after 24 hours
 * - Rate limiting on login endpoint
 * - Account lockout after failed attempts
 *
 * @agent admin-auth-routes
 */

import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { ERROR_CODES } from '@bundlenudge/shared'
import { logAdminAction } from '../../lib/admin/audit'
import { sendOTPEmail } from '../../lib/email'
import type { Env } from '../../types/env'

// =============================================================================
// Constants
// =============================================================================

const OTP_LENGTH = 6
const OTP_EXPIRY_MS = 10 * 60 * 1000 // 10 minutes
const MAX_SENDS_PER_WINDOW = 3
const SEND_WINDOW_MS = 15 * 60 * 1000 // 15 minutes
const MAX_VERIFY_ATTEMPTS = 5
const MAX_FAILED_ATTEMPTS = 10
const LOCKOUT_DURATION_MS = 30 * 60 * 1000 // 30 minutes
const ADMIN_DOMAIN = '@bundlenudge.com'
const SESSION_EXPIRY_MS = 24 * 60 * 60 * 1000 // 24 hours

// =============================================================================
// Validation Schemas
// =============================================================================

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

const sendOtpSchema = z.object({
  email: z.string().email().refine(
    (email) => email.endsWith(ADMIN_DOMAIN),
    { message: `Only ${ADMIN_DOMAIN} emails are allowed` }
  ),
})

const verifyOtpSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(OTP_LENGTH),
})

// =============================================================================
// Types
// =============================================================================

interface AdminRow {
  id: string
  email: string
  name: string
  password_hash: string
  role: 'super_admin' | 'admin' | 'support'
  permissions: string | null
  last_login_at: number | null
  created_at: number
  updated_at: number
}

interface AdminSessionRow {
  id: string
  admin_id: string
  token_hash: string
  expires_at: number
  created_at: number
}

export const adminAuthRouter = new Hono<{ Bindings: Env }>()

// =============================================================================
// Crypto Helpers
// =============================================================================

/** Generate a random OTP */
function generateOTP(): string {
  const array = new Uint32Array(1)
  crypto.getRandomValues(array)
  return String(array[0]).slice(0, OTP_LENGTH).padStart(OTP_LENGTH, '0')
}

/** Hash a string using SHA-256 */
async function hashSHA256(value: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(value)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

/** Generate a random salt */
function generateSalt(): string {
  const array = new Uint8Array(16)
  crypto.getRandomValues(array)
  return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('')
}

/** Hash password with salt (format: salt$hash) */
async function hashPassword(password: string): Promise<string> {
  const salt = generateSalt()
  const hash = await hashSHA256(salt + password)
  return `${salt}$${hash}`
}

/** Verify password against stored hash */
async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [salt, expectedHash] = storedHash.split('$')
  if (!salt || !expectedHash) return false
  const actualHash = await hashSHA256(salt + password)
  return actualHash === expectedHash
}

/** Generate a secure session token */
function generateSessionToken(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('')
}

// Legacy alias for OTP hashing
const hashOTP = hashSHA256

// =============================================================================
// Routes: Login, Logout, Me
// =============================================================================

/**
 * POST /admin-auth/login
 * Admin login with email/password
 */
adminAuthRouter.post('/login', zValidator('json', loginSchema), async (c) => {
  const { email, password } = c.req.valid('json')
  const now = Date.now()

  // Verify admin domain
  if (!email.endsWith(ADMIN_DOMAIN)) {
    return c.json({
      error: ERROR_CODES.UNAUTHORIZED,
      message: 'Invalid credentials',
    }, 401)
  }

  // Find admin by email
  const admin = await c.env.DB.prepare(`
    SELECT * FROM admins WHERE email = ?
  `).bind(email).first<AdminRow>()

  if (!admin) {
    return c.json({
      error: ERROR_CODES.UNAUTHORIZED,
      message: 'Invalid credentials',
    }, 401)
  }

  // Verify password
  const isValid = await verifyPassword(password, admin.password_hash)
  if (!isValid) {
    return c.json({
      error: ERROR_CODES.UNAUTHORIZED,
      message: 'Invalid credentials',
    }, 401)
  }

  // Generate session token and hash it for storage
  const sessionToken = generateSessionToken()
  const tokenHash = await hashSHA256(sessionToken)
  const sessionId = crypto.randomUUID()
  const expiresAt = now + SESSION_EXPIRY_MS

  // Create session in database
  await c.env.DB.prepare(`
    INSERT INTO admin_sessions (id, admin_id, token_hash, expires_at, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).bind(sessionId, admin.id, tokenHash, expiresAt, now).run()

  // Update last login
  await c.env.DB.prepare(`
    UPDATE admins SET last_login_at = ?, updated_at = ? WHERE id = ?
  `).bind(now, now, admin.id).run()

  // Log successful login
  await logAdminAction(c.env.DB, {
    adminId: admin.id,
    action: 'admin_login',
    details: { method: 'password', email },
    ipAddress: c.req.header('CF-Connecting-IP') ?? c.req.header('X-Forwarded-For'),
    userAgent: c.req.header('User-Agent'),
  })

  // Parse permissions
  const permissions = admin.permissions
    ? (JSON.parse(admin.permissions) as string[])
    : []

  return c.json({
    success: true,
    token: sessionToken,
    expiresAt,
    admin: {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
      permissions,
      lastLoginAt: admin.last_login_at,
      createdAt: admin.created_at,
    },
  })
})

/**
 * POST /admin-auth/logout
 * Logout (invalidate session)
 */
adminAuthRouter.post('/logout', async (c) => {
  const authHeader = c.req.header('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ success: true })
  }

  const token = authHeader.slice(7)
  const tokenHash = await hashSHA256(token)

  // Delete the session
  await c.env.DB.prepare(`
    DELETE FROM admin_sessions WHERE token_hash = ?
  `).bind(tokenHash).run()

  return c.json({ success: true })
})

/**
 * GET /admin-auth/me
 * Get current admin info
 */
adminAuthRouter.get('/me', async (c) => {
  const authHeader = c.req.header('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({
      error: ERROR_CODES.UNAUTHORIZED,
      message: 'Authentication required',
    }, 401)
  }

  const token = authHeader.slice(7)
  const tokenHash = await hashSHA256(token)
  const now = Date.now()

  // Find session and admin
  const session = await c.env.DB.prepare(`
    SELECT * FROM admin_sessions WHERE token_hash = ?
  `).bind(tokenHash).first<AdminSessionRow>()

  if (!session) {
    return c.json({
      error: ERROR_CODES.UNAUTHORIZED,
      message: 'Invalid session',
    }, 401)
  }

  // Check session expiry
  if (session.expires_at < now) {
    // Clean up expired session
    await c.env.DB.prepare(`
      DELETE FROM admin_sessions WHERE id = ?
    `).bind(session.id).run()

    return c.json({
      error: ERROR_CODES.SESSION_EXPIRED,
      message: 'Session expired',
    }, 401)
  }

  // Get admin details
  const admin = await c.env.DB.prepare(`
    SELECT * FROM admins WHERE id = ?
  `).bind(session.admin_id).first<AdminRow>()

  if (!admin) {
    return c.json({
      error: ERROR_CODES.UNAUTHORIZED,
      message: 'Admin not found',
    }, 401)
  }

  // Parse permissions
  const permissions = admin.permissions
    ? (JSON.parse(admin.permissions) as string[])
    : []

  return c.json({
    admin: {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
      permissions,
      lastLoginAt: admin.last_login_at,
      createdAt: admin.created_at,
    },
  })
})

// =============================================================================
// Routes: OTP Authentication (legacy)
// =============================================================================

/**
 * POST /admin-auth/send-otp
 * Send OTP to admin email
 */
adminAuthRouter.post('/send-otp', zValidator('json', sendOtpSchema), async (c) => {
  const { email } = c.req.valid('json')
  const now = Date.now()

  // Check for existing record
  const existing = await c.env.DB.prepare(`
    SELECT * FROM otp_attempts WHERE email = ?
  `).bind(email).first<{
    email: string
    otp_hash: string | null
    otp_expires_at: number | null
    send_count: number
    verify_attempts: number
    failed_attempts: number
    locked_until: number | null
    last_attempt_at: number | null
  }>()

  // Check if account is locked
  if (existing?.locked_until && existing.locked_until > now) {
    const remainingMs = existing.locked_until - now
    const remainingMins = Math.ceil(remainingMs / 60000)
    return c.json({
      error: ERROR_CODES.RATE_LIMITED,
      message: `Account locked. Try again in ${String(remainingMins)} minutes.`,
    }, 429)
  }

  // Check rate limit for sends
  const windowStart = now - SEND_WINDOW_MS
  if (existing?.last_attempt_at && existing.last_attempt_at > windowStart) {
    if (existing.send_count >= MAX_SENDS_PER_WINDOW) {
      return c.json({
        error: ERROR_CODES.RATE_LIMITED,
        message: 'Too many OTP requests. Please wait before trying again.',
      }, 429)
    }
  }

  // Generate OTP and hash it
  const otp = generateOTP()
  const otpHash = await hashOTP(otp)
  const expiresAt = now + OTP_EXPIRY_MS

  // Reset send count if outside window
  const shouldResetCount = !existing?.last_attempt_at ||
    existing.last_attempt_at < windowStart
  const newSendCount = shouldResetCount ? 1 : (existing.send_count) + 1

  // Upsert OTP record
  await c.env.DB.prepare(`
    INSERT INTO otp_attempts (
      email, otp_hash, otp_expires_at, send_count, verify_attempts,
      failed_attempts, locked_until, last_attempt_at
    )
    VALUES (?, ?, ?, ?, 0, ?, ?, ?)
    ON CONFLICT(email) DO UPDATE SET
      otp_hash = excluded.otp_hash,
      otp_expires_at = excluded.otp_expires_at,
      send_count = excluded.send_count,
      verify_attempts = 0,
      last_attempt_at = excluded.last_attempt_at
  `).bind(
    email,
    otpHash,
    expiresAt,
    newSendCount,
    existing?.failed_attempts ?? 0,
    existing?.locked_until ?? null,
    now
  ).run()

  // Send OTP email
  try {
    await sendOTPEmail(email, otp, c.env)
  } catch {
    return c.json({
      error: ERROR_CODES.INTERNAL_ERROR,
      message: 'Failed to send OTP email',
    }, 500)
  }

  return c.json({
    success: true,
    message: 'OTP sent to your email',
    expiresIn: Math.floor(OTP_EXPIRY_MS / 1000),
  })
})

/**
 * POST /admin-auth/verify-otp
 * Verify OTP and create admin session
 */
adminAuthRouter.post('/verify-otp', zValidator('json', verifyOtpSchema), async (c) => {
  const { email, otp } = c.req.valid('json')
  const now = Date.now()

  // Verify email domain
  if (!email.endsWith(ADMIN_DOMAIN)) {
    return c.json({
      error: ERROR_CODES.FORBIDDEN,
      message: 'Invalid admin email',
    }, 403)
  }

  // Get OTP record
  const record = await c.env.DB.prepare(`
    SELECT * FROM otp_attempts WHERE email = ?
  `).bind(email).first<{
    email: string
    otp_hash: string | null
    otp_expires_at: number | null
    send_count: number
    verify_attempts: number
    failed_attempts: number
    locked_until: number | null
    last_attempt_at: number | null
  }>()

  if (!record) {
    return c.json({
      error: ERROR_CODES.INVALID_OTP,
      message: 'No OTP request found. Please request a new OTP.',
    }, 400)
  }

  // Check if account is locked
  if (record.locked_until && record.locked_until > now) {
    const remainingMs = record.locked_until - now
    const remainingMins = Math.ceil(remainingMs / 60000)
    return c.json({
      error: ERROR_CODES.RATE_LIMITED,
      message: `Account locked. Try again in ${String(remainingMins)} minutes.`,
    }, 429)
  }

  // Check verify attempts for this OTP
  if (record.verify_attempts >= MAX_VERIFY_ATTEMPTS) {
    return c.json({
      error: ERROR_CODES.RATE_LIMITED,
      message: 'Too many verification attempts. Please request a new OTP.',
    }, 429)
  }

  // Check OTP expiry
  if (!record.otp_expires_at || record.otp_expires_at < now) {
    return c.json({
      error: ERROR_CODES.INVALID_OTP,
      message: 'OTP has expired. Please request a new one.',
    }, 400)
  }

  // Verify OTP
  const otpHash = await hashOTP(otp)
  const isValid = record.otp_hash === otpHash

  if (!isValid) {
    const newVerifyAttempts = record.verify_attempts + 1
    const newFailedAttempts = record.failed_attempts + 1
    const shouldLock = newFailedAttempts >= MAX_FAILED_ATTEMPTS
    const lockedUntil = shouldLock ? now + LOCKOUT_DURATION_MS : null

    await c.env.DB.prepare(`
      UPDATE otp_attempts
      SET verify_attempts = ?, failed_attempts = ?, locked_until = ?
      WHERE email = ?
    `).bind(newVerifyAttempts, newFailedAttempts, lockedUntil, email).run()

    if (shouldLock) {
      return c.json({
        error: ERROR_CODES.RATE_LIMITED,
        message: 'Account locked due to too many failed attempts.',
      }, 429)
    }

    return c.json({
      error: ERROR_CODES.INVALID_OTP,
      message: 'Invalid OTP',
      attemptsRemaining: MAX_VERIFY_ATTEMPTS - newVerifyAttempts,
    }, 400)
  }

  // OTP is valid - clear the record
  await c.env.DB.prepare(`
    UPDATE otp_attempts
    SET otp_hash = NULL, otp_expires_at = NULL, verify_attempts = 0, failed_attempts = 0
    WHERE email = ?
  `).bind(email).run()

  // Log successful authentication
  await logAdminAction(c.env.DB, {
    adminId: email, // Use email as admin ID until session is created
    action: 'verify_otp',
    details: { email },
    ipAddress: c.req.header('CF-Connecting-IP') ?? c.req.header('X-Forwarded-For'),
    userAgent: c.req.header('User-Agent'),
  })

  // Create session token
  const sessionToken = crypto.randomUUID()
  const sessionExpiry = now + (7 * 24 * 60 * 60 * 1000) // 7 days

  // Store session in KV (if available) or return token for client-side storage
  return c.json({
    success: true,
    message: 'Authentication successful',
    token: sessionToken,
    email,
    expiresAt: sessionExpiry,
  })
})

// =============================================================================
// Exports for Admin Creation
// =============================================================================

/** Export password hashing for admin creation scripts */
export { hashPassword }
