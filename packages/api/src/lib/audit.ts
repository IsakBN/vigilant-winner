/**
 * Audit logging utilities
 *
 * Provides functions for logging team actions for compliance and debugging.
 */

import type { Context } from 'hono'
import type { Env } from '../types/env'

// =============================================================================
// Types
// =============================================================================

export interface AuditLogEntry {
  organizationId: string
  userId: string
  event: string
  metadata?: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
}

// =============================================================================
// Core Functions
// =============================================================================

/**
 * Log an audit event to the database
 */
export async function logAuditEvent(
  db: D1Database,
  entry: AuditLogEntry
): Promise<void> {
  const now = Math.floor(Date.now() / 1000)

  await db.prepare(`
    INSERT INTO team_audit_log (
      id, organization_id, user_id, event, metadata, ip_address, user_agent, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    crypto.randomUUID(),
    entry.organizationId,
    entry.userId,
    entry.event,
    JSON.stringify(entry.metadata ?? {}),
    entry.ipAddress ?? null,
    entry.userAgent ?? null,
    now
  ).run()
}

// =============================================================================
// Context-Aware Logger
// =============================================================================

export type AuditLogFunction = (
  organizationId: string,
  userId: string,
  event: string,
  metadata?: Record<string, unknown>
) => Promise<void>

/**
 * Create an audit logger that automatically captures IP and User-Agent from context
 */
export function createAuditLogger(c: Context<{ Bindings: Env }>): AuditLogFunction {
  const ipAddress = c.req.header('CF-Connecting-IP') ?? c.req.header('X-Forwarded-For')
  const userAgent = c.req.header('User-Agent')

  return async (
    organizationId: string,
    userId: string,
    event: string,
    metadata?: Record<string, unknown>
  ): Promise<void> => {
    await logAuditEvent(c.env.DB, {
      organizationId,
      userId,
      event,
      metadata,
      ipAddress,
      userAgent,
    })
  }
}

// =============================================================================
// Audit Event Constants
// =============================================================================

export const AUDIT_EVENTS = {
  // Team events
  TEAM_CREATED: 'team.created',
  TEAM_UPDATED: 'team.updated',
  TEAM_DELETED: 'team.deleted',

  // Member events
  MEMBER_INVITED: 'team.member_invited',
  MEMBER_JOINED: 'team.member_joined',
  MEMBER_REMOVED: 'team.member_removed',
  ROLE_CHANGED: 'team.role_changed',
  INVITATION_RESENT: 'team.invitation_resent',
  INVITATION_CANCELLED: 'team.invitation_cancelled',

  // Project events
  PROJECT_CREATED: 'project.created',
  PROJECT_UPDATED: 'project.updated',
  PROJECT_DELETED: 'project.deleted',
  PROJECT_MEMBER_ADDED: 'project.member_added',
  PROJECT_MEMBER_REMOVED: 'project.member_removed',
  PROJECT_MEMBER_ROLE_CHANGED: 'project.member_role_changed',

  // Release events
  RELEASE_CREATED: 'release.created',
  RELEASE_UPDATED: 'release.updated',
  RELEASE_PAUSED: 'release.paused',
  RELEASE_RESUMED: 'release.resumed',
  RELEASE_ROLLED_BACK: 'release.rolled_back',

  // Billing events
  SUBSCRIPTION_CREATED: 'subscription.created',
  SUBSCRIPTION_UPDATED: 'subscription.updated',
  SUBSCRIPTION_CANCELLED: 'subscription.cancelled',
} as const

export type AuditEvent = (typeof AUDIT_EVENTS)[keyof typeof AUDIT_EVENTS]
