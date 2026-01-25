/**
 * Team Invitations Routes
 *
 * Handles team invitation flow with OTP email verification.
 */

import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import type { Env } from '../../types/env'
import { sendEmail } from '../../lib/email'

// =============================================================================
// Constants
// =============================================================================

const OTP_EXPIRY_MS = 30 * 60 * 1000 // 30 minutes
const OTP_LENGTH = 6

// =============================================================================
// Schemas
// =============================================================================

const createInvitationSchema = z.object({
  email: z.string().email(),
  role: z.enum(['admin', 'member']).default('member'),
})

const verifyInvitationSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(OTP_LENGTH),
})

// =============================================================================
// Router
// =============================================================================

export const invitationsRouter = new Hono<{ Bindings: Env }>()

/**
 * GET /v1/teams/:teamId/invitations
 * List pending invitations
 */
invitationsRouter.get('/:teamId/invitations', async (c) => {
  const userId = c.req.header('X-User-Id')
  const teamId = c.req.param('teamId')

  if (!userId) {
    return c.json({ error: 'unauthorized', message: 'Authentication required' }, 401)
  }

  // Check admin/owner role
  const membership = await c.env.DB.prepare(`
    SELECT role FROM organization_members
    WHERE organization_id = ? AND user_id = ?
  `).bind(teamId, userId).first<{ role: string }>()

  if (!membership || (membership.role !== 'owner' && membership.role !== 'admin')) {
    return c.json({ error: 'forbidden', message: 'Requires admin or owner role' }, 403)
  }

  const results = await c.env.DB.prepare(`
    SELECT id, email, role, invited_by, expires_at, created_at
    FROM team_invitations
    WHERE organization_id = ? AND accepted_at IS NULL
    ORDER BY created_at DESC
  `).bind(teamId).all()

  return c.json({
    invitations: results.results.map(formatInvitation),
  })
})

/**
 * POST /v1/teams/:teamId/invitations
 * Create invitation
 */
invitationsRouter.post(
  '/:teamId/invitations',
  zValidator('json', createInvitationSchema),
  async (c) => {
    const userId = c.req.header('X-User-Id')
    const teamId = c.req.param('teamId')
    const body = c.req.valid('json')

    if (!userId) {
      return c.json({ error: 'unauthorized', message: 'Authentication required' }, 401)
    }

    // Check admin/owner role
    const membership = await c.env.DB.prepare(`
      SELECT role FROM organization_members
      WHERE organization_id = ? AND user_id = ?
    `).bind(teamId, userId).first<{ role: string }>()

    if (!membership || (membership.role !== 'owner' && membership.role !== 'admin')) {
      return c.json({ error: 'forbidden', message: 'Requires admin or owner role' }, 403)
    }

    // Only owner can invite admins
    if (body.role === 'admin' && membership.role !== 'owner') {
      return c.json({ error: 'forbidden', message: 'Only owner can invite admins' }, 403)
    }

    // Check if already a member (we don't have users table lookup here, simplified)
    const existingMember = await c.env.DB.prepare(`
      SELECT om.id FROM organization_members om
      WHERE om.organization_id = ?
      AND EXISTS (SELECT 1 FROM users u WHERE u.id = om.user_id AND u.email = ?)
    `).bind(teamId, body.email).first()

    if (existingMember) {
      return c.json({ error: 'already_member', message: 'User is already a member' }, 409)
    }

    // Check for pending invitation
    const existingInvite = await c.env.DB.prepare(`
      SELECT id FROM team_invitations
      WHERE organization_id = ? AND email = ? AND accepted_at IS NULL
    `).bind(teamId, body.email).first()

    if (existingInvite) {
      return c.json({ error: 'already_invited', message: 'Invitation already pending' }, 409)
    }

    // Generate OTP
    const otp = generateOTP()
    const otpHash = await hashOTP(otp)
    const now = Math.floor(Date.now() / 1000)
    const expiresAt = now + Math.floor(OTP_EXPIRY_MS / 1000)
    const invitationId = crypto.randomUUID()

    // Get team name
    const team = await c.env.DB.prepare(
      'SELECT name FROM organizations WHERE id = ?'
    ).bind(teamId).first<{ name: string }>()

    // Create invitation
    await c.env.DB.prepare(`
      INSERT INTO team_invitations
        (id, organization_id, email, role, token, invited_by, expires_at, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      invitationId,
      teamId,
      body.email,
      body.role,
      otpHash, // Store OTP hash in token field
      userId,
      expiresAt,
      now
    ).run()

    // Send invitation email
    c.executionCtx.waitUntil(
      sendInvitationEmail(c.env, body.email, otp, team?.name ?? 'Team', 30)
    )

    // Audit log
    await logAuditEvent(c.env.DB, teamId, userId, 'team.member_invited', {
      email: body.email,
      role: body.role,
    })

    return c.json({ success: true, invitationId }, 201)
  }
)

/**
 * POST /v1/teams/:teamId/invitations/:invitationId/resend
 * Resend invitation email with new OTP
 */
invitationsRouter.post('/:teamId/invitations/:invitationId/resend', async (c) => {
  const userId = c.req.header('X-User-Id')
  const teamId = c.req.param('teamId')
  const invitationId = c.req.param('invitationId')

  if (!userId) {
    return c.json({ error: 'unauthorized', message: 'Authentication required' }, 401)
  }

  // Check admin/owner role
  const membership = await c.env.DB.prepare(`
    SELECT role FROM organization_members
    WHERE organization_id = ? AND user_id = ?
  `).bind(teamId, userId).first<{ role: string }>()

  if (!membership || (membership.role !== 'owner' && membership.role !== 'admin')) {
    return c.json({ error: 'forbidden', message: 'Requires admin or owner role' }, 403)
  }

  // Get invitation
  const invitation = await c.env.DB.prepare(`
    SELECT * FROM team_invitations
    WHERE id = ? AND organization_id = ? AND accepted_at IS NULL
  `).bind(invitationId, teamId).first<{ email: string }>()

  if (!invitation) {
    return c.json({ error: 'not_found', message: 'Invitation not found' }, 404)
  }

  // Generate new OTP
  const otp = generateOTP()
  const otpHash = await hashOTP(otp)
  const now = Math.floor(Date.now() / 1000)
  const expiresAt = now + Math.floor(OTP_EXPIRY_MS / 1000)

  // Update invitation
  await c.env.DB.prepare(`
    UPDATE team_invitations SET token = ?, expires_at = ? WHERE id = ?
  `).bind(otpHash, expiresAt, invitationId).run()

  // Get team name
  const team = await c.env.DB.prepare(
    'SELECT name FROM organizations WHERE id = ?'
  ).bind(teamId).first<{ name: string }>()

  // Send email
  c.executionCtx.waitUntil(
    sendInvitationEmail(c.env, invitation.email, otp, team?.name ?? 'Team', 30)
  )

  return c.json({ success: true })
})

/**
 * DELETE /v1/teams/:teamId/invitations/:invitationId
 * Cancel invitation
 */
invitationsRouter.delete('/:teamId/invitations/:invitationId', async (c) => {
  const userId = c.req.header('X-User-Id')
  const teamId = c.req.param('teamId')
  const invitationId = c.req.param('invitationId')

  if (!userId) {
    return c.json({ error: 'unauthorized', message: 'Authentication required' }, 401)
  }

  // Check admin/owner role
  const membership = await c.env.DB.prepare(`
    SELECT role FROM organization_members
    WHERE organization_id = ? AND user_id = ?
  `).bind(teamId, userId).first<{ role: string }>()

  if (!membership || (membership.role !== 'owner' && membership.role !== 'admin')) {
    return c.json({ error: 'forbidden', message: 'Requires admin or owner role' }, 403)
  }

  // Delete invitation
  const result = await c.env.DB.prepare(`
    DELETE FROM team_invitations
    WHERE id = ? AND organization_id = ? AND accepted_at IS NULL
  `).bind(invitationId, teamId).run()

  if (!result.meta.changes) {
    return c.json({ error: 'not_found', message: 'Invitation not found' }, 404)
  }

  return c.json({ success: true })
})

/**
 * POST /v1/teams/verify-invite
 * Verify OTP and join team (public endpoint)
 */
invitationsRouter.post(
  '/verify-invite',
  zValidator('json', verifyInvitationSchema),
  async (c) => {
    const body = c.req.valid('json')
    const now = Math.floor(Date.now() / 1000)

    // Find pending invitation
    const invitation = await c.env.DB.prepare(`
      SELECT i.*, o.name as team_name
      FROM team_invitations i
      JOIN organizations o ON o.id = i.organization_id
      WHERE i.email = ? AND i.accepted_at IS NULL
      ORDER BY i.created_at DESC LIMIT 1
    `).bind(body.email).first<{
      id: string
      organization_id: string
      token: string
      role: string
      expires_at: number
      team_name: string
    }>()

    if (!invitation) {
      return c.json({ error: 'not_found', message: 'Invitation not found' }, 404)
    }

    // Check expiration
    if (now > invitation.expires_at) {
      return c.json({ error: 'expired', message: 'OTP has expired' }, 400)
    }

    // Verify OTP
    const isValid = await verifyOTP(body.otp, invitation.token)
    if (!isValid) {
      return c.json({ error: 'invalid_otp', message: 'Invalid OTP' }, 400)
    }

    // Check if user exists (simplified - using email lookup in users table if exists)
    // For now, assume the caller provides X-User-Id if logged in
    const userId = c.req.header('X-User-Id')

    if (!userId) {
      // User needs to sign up first
      return c.json({
        success: false,
        requiresSignup: true,
        email: body.email,
        teamName: invitation.team_name,
        invitationId: invitation.id,
      })
    }

    // Add user to team
    await c.env.DB.prepare(`
      INSERT INTO organization_members (id, organization_id, user_id, role, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).bind(
      crypto.randomUUID(),
      invitation.organization_id,
      userId,
      invitation.role,
      now
    ).run()

    // Mark invitation as accepted
    await c.env.DB.prepare(`
      UPDATE team_invitations SET accepted_at = ? WHERE id = ?
    `).bind(now, invitation.id).run()

    // Audit log
    await logAuditEvent(c.env.DB, invitation.organization_id, userId, 'team.member_joined', {
      email: body.email,
      role: invitation.role,
      invitationId: invitation.id,
    })

    return c.json({
      success: true,
      teamId: invitation.organization_id,
      teamName: invitation.team_name,
    })
  }
)

// =============================================================================
// Helpers
// =============================================================================

/**
 * Generate a cryptographically secure 6-digit OTP
 */
export function generateOTP(): string {
  const array = new Uint32Array(1)
  crypto.getRandomValues(array)
  return (array[0] % 1000000).toString().padStart(OTP_LENGTH, '0')
}

/**
 * Hash OTP using SHA-256 (suitable for short-lived tokens)
 */
async function hashOTP(otp: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(otp)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = new Uint8Array(hashBuffer)
  return Array.from(hashArray)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Verify OTP against stored hash
 */
async function verifyOTP(otp: string, storedHash: string): Promise<boolean> {
  const inputHash = await hashOTP(otp)
  return inputHash === storedHash
}

interface FormattedInvitation {
  id: unknown
  email: unknown
  role: unknown
  invitedBy: unknown
  expiresAt: unknown
  createdAt: unknown
}

function formatInvitation(inv: Record<string, unknown>): FormattedInvitation {
  return {
    id: inv.id,
    email: inv.email,
    role: inv.role,
    invitedBy: inv.invited_by,
    expiresAt: inv.expires_at,
    createdAt: inv.created_at,
  }
}

async function sendInvitationEmail(
  env: Env,
  email: string,
  otp: string,
  teamName: string,
  expiresInMinutes: number
): Promise<void> {
  await sendEmail({
    to: email,
    subject: `You're invited to join ${teamName} on BundleNudge`,
    html: `
      <h2>You've been invited to join ${teamName}</h2>
      <p>Enter this code to accept the invitation:</p>
      <h1 style="font-size: 32px; letter-spacing: 4px; font-family: monospace;">${otp}</h1>
      <p>This code expires in ${String(expiresInMinutes)} minutes.</p>
      <p>If you didn't expect this invitation, you can safely ignore this email.</p>
    `,
    env,
  })
}

async function logAuditEvent(
  db: D1Database,
  organizationId: string,
  userId: string,
  event: string,
  metadata: Record<string, unknown>
): Promise<void> {
  await db.prepare(`
    INSERT INTO team_audit_log (id, organization_id, user_id, event, metadata, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(
    crypto.randomUUID(),
    organizationId,
    userId,
    event,
    JSON.stringify(metadata),
    Math.floor(Date.now() / 1000)
  ).run()
}
