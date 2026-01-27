/**
 * Team Invitations Routes
 *
 * Handles team invitation flow with OTP email verification.
 *
 * @agent remediate-otp-bcrypt
 */

import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import * as bcrypt from 'bcryptjs'
import type { Env } from '../../types/env'
import { sendEmail } from '../../lib/email'

// =============================================================================
// Constants
// =============================================================================

const OTP_EXPIRY_MS = 30 * 60 * 1000 // 30 minutes
const OTP_LENGTH = 6
const BCRYPT_ROUNDS = 10
const BCRYPT_PREFIX = '$2'

// =============================================================================
// Schemas
// =============================================================================

const createInvitationSchema = z.object({
  email: z.string().email(),
  role: z.enum(['admin', 'member']).default('member'),
  scope: z.enum(['full', 'projects']).default('full'),
  projectIds: z.array(z.string().uuid()).optional(),
}).refine(
  (data) => {
    // projectIds required when scope='projects', forbidden when scope='full'
    if (data.scope === 'projects') {
      return Array.isArray(data.projectIds) && data.projectIds.length > 0
    }
    return data.projectIds === undefined || data.projectIds.length === 0
  },
  { message: 'projectIds required for scope=projects, forbidden for scope=full' }
)

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
    SELECT id, email, role, scope, project_ids, invited_by, expires_at, created_at
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

    // If scope='projects', validate all project IDs belong to this team's org
    if (body.scope === 'projects' && body.projectIds) {
      const projectCount = await c.env.DB.prepare(`
        SELECT COUNT(*) as count FROM apps
        WHERE id IN (${body.projectIds.map(() => '?').join(',')})
        AND owner_id IN (SELECT owner_id FROM organizations WHERE id = ?)
      `).bind(...body.projectIds, teamId).first<{ count: number }>()

      if (projectCount?.count !== body.projectIds.length) {
        return c.json({
          error: 'invalid_project_ids',
          message: 'One or more project IDs are invalid or not in this organization',
        }, 400)
      }
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

    // Prepare projectIds JSON
    const projectIdsJson = body.scope === 'projects' && body.projectIds
      ? JSON.stringify(body.projectIds)
      : null

    // Create invitation with scope and projectIds
    await c.env.DB.prepare(`
      INSERT INTO team_invitations
        (id, organization_id, email, role, token, invited_by, scope, project_ids, expires_at, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      invitationId,
      teamId,
      body.email,
      body.role,
      otpHash, // Store OTP hash in token field
      userId,
      body.scope,
      projectIdsJson,
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
      scope: body.scope,
      projectIds: body.projectIds ?? null,
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
 *
 * Permission rules:
 * - Owner can cancel any invitation
 * - Admins can cancel any invitation
 * - Members CANNOT cancel invitations (they can't create them either)
 *
 * @agent owner-only-deletion
 * @modified 2026-01-27
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

  if (!membership) {
    return c.json({ error: 'not_found', message: 'Team not found' }, 404)
  }

  // Members cannot cancel invitations
  if (membership.role === 'member') {
    return c.json({
      error: 'ADMIN_REQUIRED',
      code: 'ADMIN_REQUIRED',
      message: 'Only admins and owners can cancel invitations',
    }, 403)
  }

  if (membership.role !== 'owner' && membership.role !== 'admin') {
    return c.json({ error: 'forbidden', message: 'Requires admin or owner role' }, 403)
  }

  // Get invitation details for audit log
  const invitation = await c.env.DB.prepare(`
    SELECT email, role, invited_by FROM team_invitations
    WHERE id = ? AND organization_id = ? AND accepted_at IS NULL
  `).bind(invitationId, teamId).first<{ email: string; role: string; invited_by: string }>()

  if (!invitation) {
    return c.json({ error: 'not_found', message: 'Invitation not found' }, 404)
  }

  // Delete invitation
  await c.env.DB.prepare(`
    DELETE FROM team_invitations
    WHERE id = ? AND organization_id = ? AND accepted_at IS NULL
  `).bind(invitationId, teamId).run()

  // Log the cancellation
  await logAuditEvent(c.env.DB, teamId, userId, 'team.invitation_cancelled', {
    invitationId,
    email: invitation.email,
    role: invitation.role,
    originalInviter: invitation.invited_by,
  })

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
      scope: 'full' | 'projects'
      project_ids: string | null
      expires_at: number
      team_name: string
      invited_by: string
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

    // If project-scoped, create member_project_access entries
    if (invitation.scope === 'projects' && invitation.project_ids) {
      const projectIds = JSON.parse(invitation.project_ids) as string[]
      for (const appId of projectIds) {
        await c.env.DB.prepare(`
          INSERT INTO member_project_access
            (id, organization_id, user_id, app_id, granted_by, granted_at)
          VALUES (?, ?, ?, ?, ?, ?)
        `).bind(
          crypto.randomUUID(),
          invitation.organization_id,
          userId,
          appId,
          invitation.invited_by,
          now
        ).run()
      }
    }

    // Mark invitation as accepted
    await c.env.DB.prepare(`
      UPDATE team_invitations SET accepted_at = ? WHERE id = ?
    `).bind(now, invitation.id).run()

    // Audit log
    await logAuditEvent(c.env.DB, invitation.organization_id, userId, 'team.member_joined', {
      email: body.email,
      role: invitation.role,
      scope: invitation.scope,
      projectIds: invitation.project_ids ? JSON.parse(invitation.project_ids) : null,
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
  const value = array[0]
  return (value % 1000000).toString().padStart(OTP_LENGTH, '0')
}

/**
 * Hash OTP using bcrypt (10 rounds).
 * bcrypt is slow and salted, making brute-force attacks impractical
 * even for 6-digit OTPs (1M possibilities).
 */
async function hashOTP(otp: string): Promise<string> {
  return bcrypt.hash(otp, BCRYPT_ROUNDS)
}

/**
 * Verify OTP against stored hash.
 * Supports both bcrypt (new) and SHA-256 (legacy) hashes for migration.
 */
async function verifyOTP(otp: string, storedHash: string): Promise<boolean> {
  // bcrypt hashes start with $2a$, $2b$, or $2y$
  if (storedHash.startsWith(BCRYPT_PREFIX)) {
    return bcrypt.compare(otp, storedHash)
  }

  // Legacy SHA-256 hash - log warning for monitoring
  // TODO: Remove legacy support after migration period
   
  console.warn('[OTP] Legacy SHA-256 hash detected - consider re-sending invitation')
  // eslint-disable-next-line @typescript-eslint/no-deprecated
  return verifyOTPLegacy(otp, storedHash)
}

/**
 * Legacy SHA-256 verification for backwards compatibility.
 * @deprecated Use bcrypt hashes for new invitations
 */
async function verifyOTPLegacy(otp: string, storedHash: string): Promise<boolean> {
  const encoder = new TextEncoder()
  const data = encoder.encode(otp)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = new Uint8Array(hashBuffer)
  const inputHash = Array.from(hashArray)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
  return inputHash === storedHash
}

interface FormattedInvitation {
  id: unknown
  email: unknown
  role: unknown
  scope: unknown
  projectIds: unknown
  invitedBy: unknown
  expiresAt: unknown
  createdAt: unknown
}

function formatInvitation(inv: Record<string, unknown>): FormattedInvitation {
  // Parse projectIds from JSON if it's a string
  let projectIds = inv.project_ids
  if (typeof projectIds === 'string') {
    try {
      projectIds = JSON.parse(projectIds)
    } catch {
      projectIds = null
    }
  }

  return {
    id: inv.id,
    email: inv.email,
    role: inv.role,
    scope: inv.scope ?? 'full',
    projectIds,
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
