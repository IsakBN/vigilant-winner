/**
 * Scheduled email service for managing time-delayed emails
 *
 * Used for follow-up emails, inactive reminders, etc.
 *
 * @agent scheduled-emails
 * @created 2026-01-27
 */

// =============================================================================
// Types
// =============================================================================

export interface ScheduledEmail {
  id: string
  userId: string
  email: string
  template: string
  scheduledFor: number
  sentAt: number | null
  failedAt: number | null
  failureReason: string | null
  metadata: string | null
  createdAt: number
}

export interface ScheduleEmailParams {
  userId: string
  email: string
  template: string
  scheduledFor: number
  metadata?: Record<string, unknown>
}

// =============================================================================
// Functions
// =============================================================================

/**
 * Schedule an email to be sent at a future time
 */
export async function scheduleEmail(
  db: D1Database,
  params: ScheduleEmailParams
): Promise<string> {
  const id = crypto.randomUUID()
  const now = Date.now()

  await db.prepare(`
    INSERT INTO scheduled_emails (id, user_id, email, template, scheduled_for, metadata, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id,
    params.userId,
    params.email,
    params.template,
    params.scheduledFor,
    params.metadata ? JSON.stringify(params.metadata) : null,
    now
  ).run()

  return id
}

/**
 * Get emails that are due to be sent
 *
 * Returns emails where:
 * - scheduledFor <= now
 * - sentAt is NULL (not already sent)
 * - failedAt is NULL (not failed)
 */
export async function getScheduledEmails(
  db: D1Database,
  limit = 100
): Promise<ScheduledEmail[]> {
  const now = Date.now()

  const result = await db.prepare(`
    SELECT id, user_id, email, template, scheduled_for, sent_at, failed_at, failure_reason, metadata, created_at
    FROM scheduled_emails
    WHERE sent_at IS NULL
      AND failed_at IS NULL
      AND scheduled_for <= ?
    ORDER BY scheduled_for ASC
    LIMIT ?
  `).bind(now, limit).all<{
    id: string
    user_id: string
    email: string
    template: string
    scheduled_for: number
    sent_at: number | null
    failed_at: number | null
    failure_reason: string | null
    metadata: string | null
    created_at: number
  }>()

  return result.results.map((row) => ({
    id: row.id,
    userId: row.user_id,
    email: row.email,
    template: row.template,
    scheduledFor: row.scheduled_for,
    sentAt: row.sent_at,
    failedAt: row.failed_at,
    failureReason: row.failure_reason,
    metadata: row.metadata,
    createdAt: row.created_at,
  }))
}

/**
 * Mark an email as successfully sent
 */
export async function markEmailSent(db: D1Database, id: string): Promise<void> {
  await db.prepare(`
    UPDATE scheduled_emails SET sent_at = ? WHERE id = ?
  `).bind(Date.now(), id).run()
}

/**
 * Mark an email as failed with a reason
 */
export async function markEmailFailed(
  db: D1Database,
  id: string,
  reason: string
): Promise<void> {
  await db.prepare(`
    UPDATE scheduled_emails SET failed_at = ?, failure_reason = ? WHERE id = ?
  `).bind(Date.now(), reason, id).run()
}

/**
 * Cancel a scheduled email (by marking it as failed)
 */
export async function cancelScheduledEmail(
  db: D1Database,
  id: string
): Promise<void> {
  await markEmailFailed(db, id, 'cancelled')
}

/**
 * Check if a follow-up email is already scheduled for a user
 */
export async function hasScheduledFollowUp(
  db: D1Database,
  userId: string
): Promise<boolean> {
  const result = await db.prepare(`
    SELECT id FROM scheduled_emails
    WHERE user_id = ?
      AND template = 'follow_up'
      AND sent_at IS NULL
      AND failed_at IS NULL
    LIMIT 1
  `).bind(userId).first<{ id: string }>()

  return result !== null
}
