/**
 * Team Audit Log Routes
 *
 * Provides read-only access to team audit logs for compliance.
 *
 * @agent remediate-pagination
 * @modified 2026-01-25
 */

import { Hono } from 'hono'
import { ERROR_CODES } from '@bundlenudge/shared'
import { authMiddleware, type AuthUser } from '../../middleware/auth'
import { requireOrgPermission } from '../../middleware/permissions'
import type { Env } from '../../types/env'
import type { OrgRole } from '../../lib/permissions'

// =============================================================================
// Types
// =============================================================================

interface AuditEntryRow {
  id: string
  organization_id: string
  user_id: string
  event: string
  metadata: string | null
  ip_address: string | null
  user_agent: string | null
  created_at: number
}

interface AuditPermissionVariables {
  user: AuthUser
  teamMembership: {
    orgId: string
    userId: string
    role: OrgRole
  }
}

// =============================================================================
// Router
// =============================================================================

export const auditRouter = new Hono<{ Bindings: Env; Variables: AuditPermissionVariables }>()

// All routes require authentication
auditRouter.use('*', authMiddleware)

/**
 * GET /v1/teams/:teamId/audit-log
 * List audit log entries with pagination and filtering
 */
auditRouter.get(
  '/:teamId/audit-log',
  requireOrgPermission('canViewAuditLog'),
  async (c) => {
    const teamId = c.req.param('teamId')
    const limit = Math.min(parseInt(c.req.query('limit') ?? '50', 10), 100)
    const offset = parseInt(c.req.query('offset') ?? '0', 10)
    const eventFilter = c.req.query('event')
    const userFilter = c.req.query('userId')

    // Build query
    const conditions: string[] = ['organization_id = ?']
    const params: unknown[] = [teamId]

    if (eventFilter) {
      conditions.push('event = ?')
      params.push(eventFilter)
    }

    if (userFilter) {
      conditions.push('user_id = ?')
      params.push(userFilter)
    }

    const whereClause = conditions.join(' AND ')

    // Get entries
    const query = `
      SELECT id, organization_id, user_id, event, metadata, ip_address, user_agent, created_at
      FROM team_audit_log
      WHERE ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `
    params.push(limit, offset)

    const results = await c.env.DB.prepare(query).bind(...params).all<AuditEntryRow>()

    // Get total count
    const countParams = params.slice(0, -2) // Remove limit and offset
    const countResult = await c.env.DB.prepare(`
      SELECT COUNT(*) as total FROM team_audit_log WHERE ${whereClause}
    `).bind(...countParams).first<{ total: number }>()

    const data = results.results.map(formatAuditEntry)
    const total = countResult?.total ?? 0

    return c.json({
      data,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + data.length < total,
      },
    })
  }
)

/**
 * GET /v1/teams/:teamId/audit-log/:entryId
 * Get a single audit log entry
 */
auditRouter.get(
  '/:teamId/audit-log/:entryId',
  requireOrgPermission('canViewAuditLog'),
  async (c) => {
    const teamId = c.req.param('teamId')
    const entryId = c.req.param('entryId')

    const entry = await c.env.DB.prepare(`
      SELECT id, organization_id, user_id, event, metadata, ip_address, user_agent, created_at
      FROM team_audit_log
      WHERE id = ? AND organization_id = ?
    `).bind(entryId, teamId).first<AuditEntryRow>()

    if (!entry) {
      return c.json(
        { error: ERROR_CODES.NOT_FOUND, message: 'Audit entry not found' },
        404
      )
    }

    return c.json({ entry: formatAuditEntry(entry) })
  }
)

/**
 * GET /v1/teams/:teamId/audit-log/export
 * Export audit log as CSV
 */
auditRouter.get(
  '/:teamId/audit-log/export',
  requireOrgPermission('canViewAuditLog'),
  async (c) => {
    const teamId = c.req.param('teamId')
    const startDate = c.req.query('start')
    const endDate = c.req.query('end')

    // Build query
    const conditions: string[] = ['organization_id = ?']
    const params: unknown[] = [teamId]

    if (startDate) {
      conditions.push('created_at >= ?')
      params.push(parseInt(startDate, 10))
    }

    if (endDate) {
      conditions.push('created_at <= ?')
      params.push(parseInt(endDate, 10))
    }

    const whereClause = conditions.join(' AND ')

    const results = await c.env.DB.prepare(`
      SELECT id, user_id, event, metadata, ip_address, created_at
      FROM team_audit_log
      WHERE ${whereClause}
      ORDER BY created_at DESC
      LIMIT 10000
    `).bind(...params).all<AuditEntryRow>()

    // Build CSV
    const headers = ['ID', 'Timestamp', 'Event', 'User ID', 'IP Address', 'Details']
    const rows = results.results.map((entry) => [
      entry.id,
      formatTimestamp(entry.created_at),
      entry.event,
      entry.user_id,
      entry.ip_address ?? '',
      entry.metadata ?? '{}',
    ])

    const csv = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => escapeCsvCell(cell)).join(',')),
    ].join('\n')

    c.header('Content-Type', 'text/csv; charset=utf-8')
    c.header('Content-Disposition', `attachment; filename="audit-log-${teamId}.csv"`)

    return c.body(csv)
  }
)

/**
 * GET /v1/teams/:teamId/audit-log/stats
 * Get audit log statistics
 */
auditRouter.get(
  '/:teamId/audit-log/stats',
  requireOrgPermission('canViewAuditLog'),
  async (c) => {
    const teamId = c.req.param('teamId')
    const days = Math.min(parseInt(c.req.query('days') ?? '30', 10), 90)
    const cutoff = Math.floor(Date.now() / 1000) - days * 24 * 60 * 60

    // Get event counts
    const eventCounts = await c.env.DB.prepare(`
      SELECT event, COUNT(*) as count
      FROM team_audit_log
      WHERE organization_id = ? AND created_at >= ?
      GROUP BY event
      ORDER BY count DESC
    `).bind(teamId, cutoff).all<{ event: string; count: number }>()

    // Get user activity counts
    const userCounts = await c.env.DB.prepare(`
      SELECT user_id, COUNT(*) as count
      FROM team_audit_log
      WHERE organization_id = ? AND created_at >= ?
      GROUP BY user_id
      ORDER BY count DESC
      LIMIT 10
    `).bind(teamId, cutoff).all<{ user_id: string; count: number }>()

    // Get total count
    const totalResult = await c.env.DB.prepare(`
      SELECT COUNT(*) as total
      FROM team_audit_log
      WHERE organization_id = ? AND created_at >= ?
    `).bind(teamId, cutoff).first<{ total: number }>()

    return c.json({
      days,
      totalEvents: totalResult?.total ?? 0,
      eventsByType: eventCounts.results.map((e) => ({
        event: e.event,
        count: e.count,
      })),
      topUsers: userCounts.results.map((u) => ({
        userId: u.user_id,
        count: u.count,
      })),
    })
  }
)

// =============================================================================
// Helpers
// =============================================================================

interface FormattedAuditEntry {
  id: string
  organizationId: string
  userId: string
  event: string
  metadata: Record<string, unknown>
  ipAddress: string | null
  userAgent: string | null
  createdAt: number
}

function formatAuditEntry(entry: AuditEntryRow): FormattedAuditEntry {
  let metadata: Record<string, unknown> = {}
  if (entry.metadata) {
    try {
      metadata = JSON.parse(entry.metadata) as Record<string, unknown>
    } catch {
      metadata = {}
    }
  }

  return {
    id: entry.id,
    organizationId: entry.organization_id,
    userId: entry.user_id,
    event: entry.event,
    metadata,
    ipAddress: entry.ip_address,
    userAgent: entry.user_agent,
    createdAt: entry.created_at,
  }
}

function formatTimestamp(timestamp: number): string {
  return new Date(timestamp * 1000).toISOString()
}

function escapeCsvCell(value: string): string {
  // Escape double quotes and wrap in quotes if necessary
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}
