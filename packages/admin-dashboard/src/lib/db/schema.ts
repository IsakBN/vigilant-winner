import { pgTable, text, timestamp, boolean } from 'drizzle-orm/pg-core'

export const emailAllowlist = pgTable('email_allowlist', {
  id: text('id').primaryKey(),
  emailPattern: text('email_pattern').notNull(), // e.g., "*@bundlenudge.com"
  addedBy: text('added_by').notNull(),
  addedAt: timestamp('added_at').defaultNow(),
  note: text('note'),
})

export const backupCodes = pgTable('backup_codes', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  codeHash: text('code_hash').notNull(),
  used: boolean('used').default(false),
  usedAt: timestamp('used_at'),
  createdAt: timestamp('created_at').defaultNow(),
})

export const auditLogs = pgTable('audit_logs', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  action: text('action').notNull(),
  resource: text('resource'),
  details: text('details'),
  ipAddress: text('ip_address'),
  createdAt: timestamp('created_at').defaultNow(),
})
