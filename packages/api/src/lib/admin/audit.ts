/**
 * Admin audit logging helper
 *
 * Logs all admin actions for compliance and debugging
 *
 * @agent wave5-admin
 */

import type { D1Database } from '@cloudflare/workers-types'

/**
 * Admin action types for categorization
 */
export type AdminAction =
  | 'send_otp'
  | 'verify_otp'
  | 'override_limits'
  | 'remove_override_limits'
  | 'suspend_user'
  | 'unsuspend_user'
  | 'disable_app'
  | 'enable_app'
  | 'delete_app'
  | 'view_user'
  | 'view_app'
  | 'view_dashboard'

/**
 * Admin action log entry
 */
export interface AdminActionParams {
  adminId: string
  action: AdminAction
  targetUserId?: string
  targetAppId?: string
  details?: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
}

/**
 * Log an admin action to the audit trail
 *
 * @param db - D1 database instance
 * @param params - Action details to log
 * @returns The created audit log entry ID
 */
export async function logAdminAction(
  db: D1Database,
  params: AdminActionParams
): Promise<string> {
  const {
    adminId,
    action,
    targetUserId,
    targetAppId,
    details,
    ipAddress,
    userAgent,
  } = params

  const id = crypto.randomUUID()
  const now = Date.now()

  await db.prepare(`
    INSERT INTO admin_audit_log (
      id, admin_id, action, target_user_id, target_app_id,
      details, ip_address, user_agent, created_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id,
    adminId,
    action,
    targetUserId ?? null,
    targetAppId ?? null,
    details ? JSON.stringify(details) : null,
    ipAddress ?? null,
    userAgent ?? null,
    now
  ).run()

  return id
}

/**
 * Query audit log entries with filtering
 */
export interface AuditLogQuery {
  adminId?: string
  action?: AdminAction
  targetUserId?: string
  targetAppId?: string
  startDate?: number
  endDate?: number
  limit?: number
  offset?: number
}

/**
 * Audit log entry from database
 */
export interface AuditLogEntry {
  id: string
  adminId: string
  action: string
  targetUserId: string | null
  targetAppId: string | null
  details: Record<string, unknown> | null
  ipAddress: string | null
  userAgent: string | null
  createdAt: number
}

/**
 * Get audit log entries with optional filtering
 */
export async function getAuditLog(
  db: D1Database,
  query: AuditLogQuery = {}
): Promise<{ entries: AuditLogEntry[]; total: number }> {
  const {
    adminId,
    action,
    targetUserId,
    targetAppId,
    startDate,
    endDate,
    limit = 50,
    offset = 0,
  } = query

  const conditions: string[] = []
  const bindings: (string | number)[] = []

  if (adminId) {
    conditions.push('admin_id = ?')
    bindings.push(adminId)
  }
  if (action) {
    conditions.push('action = ?')
    bindings.push(action)
  }
  if (targetUserId) {
    conditions.push('target_user_id = ?')
    bindings.push(targetUserId)
  }
  if (targetAppId) {
    conditions.push('target_app_id = ?')
    bindings.push(targetAppId)
  }
  if (startDate) {
    conditions.push('created_at >= ?')
    bindings.push(startDate)
  }
  if (endDate) {
    conditions.push('created_at <= ?')
    bindings.push(endDate)
  }

  const whereClause = conditions.length > 0
    ? `WHERE ${conditions.join(' AND ')}`
    : ''

  // Get total count
  const countResult = await db.prepare(`
    SELECT COUNT(*) as total FROM admin_audit_log ${whereClause}
  `).bind(...bindings).first<{ total: number }>()

  const total = countResult?.total ?? 0

  // Get paginated results
  const results = await db.prepare(`
    SELECT
      id, admin_id, action, target_user_id, target_app_id,
      details, ip_address, user_agent, created_at
    FROM admin_audit_log
    ${whereClause}
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `).bind(...bindings, limit, offset).all<{
    id: string
    admin_id: string
    action: string
    target_user_id: string | null
    target_app_id: string | null
    details: string | null
    ip_address: string | null
    user_agent: string | null
    created_at: number
  }>()

  const entries: AuditLogEntry[] = results.results.map((row) => ({
    id: row.id,
    adminId: row.admin_id,
    action: row.action,
    targetUserId: row.target_user_id,
    targetAppId: row.target_app_id,
    details: row.details ? (JSON.parse(row.details) as Record<string, unknown>) : null,
    ipAddress: row.ip_address,
    userAgent: row.user_agent,
    createdAt: row.created_at,
  }))

  return { entries, total }
}
