/**
 * Authentication schema tables for BundleNudge API
 *
 * Contains user authentication, email verification, and password reset tables
 *
 * @agent email-password-auth
 * @created 2026-01-26
 */

import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core'
import { relations } from 'drizzle-orm'

// ============================================
// Users Table
// ============================================

/**
 * Users table
 * Stores user account information for email/password authentication
 *
 * @agent email-password-auth
 * @created 2026-01-26
 */
export const users = sqliteTable('users', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: text('email').notNull().unique(),
  name: text('name'),
  passwordHash: text('password_hash'), // nullable for OAuth-only users
  emailVerified: integer('email_verified', { mode: 'boolean' }).default(false),
  emailVerifiedAt: integer('email_verified_at', { mode: 'timestamp' }),
  avatarUrl: text('avatar_url'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
}, (table) => ({
  emailIdx: index('users_email_idx').on(table.email),
}))

// ============================================
// Email Verification Tokens Table
// ============================================

/**
 * Email verification tokens table
 * Stores tokens for verifying user email addresses
 *
 * @agent email-password-auth
 * @created 2026-01-26
 */
export const emailVerificationTokens = sqliteTable('email_verification_tokens', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
}, (table) => ({
  userIdx: index('email_verification_tokens_user_idx').on(table.userId),
  tokenIdx: index('email_verification_tokens_token_idx').on(table.token),
  expiresIdx: index('email_verification_tokens_expires_idx').on(table.expiresAt),
}))

// ============================================
// Password Reset Tokens Table
// ============================================

/**
 * Password reset tokens table
 * Stores tokens for resetting user passwords
 *
 * @agent email-password-auth
 * @created 2026-01-26
 */
export const passwordResetTokens = sqliteTable('password_reset_tokens', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  usedAt: integer('used_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
}, (table) => ({
  userIdx: index('password_reset_tokens_user_idx').on(table.userId),
  tokenIdx: index('password_reset_tokens_token_idx').on(table.token),
  expiresIdx: index('password_reset_tokens_expires_idx').on(table.expiresAt),
}))

// ============================================
// User Sessions Table
// ============================================

/**
 * User sessions table
 * Stores active user sessions for email/password authentication
 *
 * @agent email-password-auth
 * @created 2026-01-26
 */
export const userSessions = sqliteTable('user_sessions', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
}, (table) => ({
  userIdx: index('user_sessions_user_idx').on(table.userId),
  tokenIdx: index('user_sessions_token_idx').on(table.token),
  expiresIdx: index('user_sessions_expires_idx').on(table.expiresAt),
}))

// ============================================
// Relations
// ============================================

/**
 * User relations
 */
export const usersRelations = relations(users, ({ many }) => ({
  emailVerificationTokens: many(emailVerificationTokens),
  passwordResetTokens: many(passwordResetTokens),
  sessions: many(userSessions),
}))

/**
 * Email verification token relations
 */
export const emailVerificationTokensRelations = relations(emailVerificationTokens, ({ one }) => ({
  user: one(users, {
    fields: [emailVerificationTokens.userId],
    references: [users.id],
  }),
}))

/**
 * Password reset token relations
 */
export const passwordResetTokensRelations = relations(passwordResetTokens, ({ one }) => ({
  user: one(users, {
    fields: [passwordResetTokens.userId],
    references: [users.id],
  }),
}))

/**
 * User session relations
 */
export const userSessionsRelations = relations(userSessions, ({ one }) => ({
  user: one(users, {
    fields: [userSessions.userId],
    references: [users.id],
  }),
}))

// ============================================
// Type Exports
// ============================================

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert

export type EmailVerificationToken = typeof emailVerificationTokens.$inferSelect
export type NewEmailVerificationToken = typeof emailVerificationTokens.$inferInsert

export type PasswordResetToken = typeof passwordResetTokens.$inferSelect
export type NewPasswordResetToken = typeof passwordResetTokens.$inferInsert

export type UserSession = typeof userSessions.$inferSelect
export type NewUserSession = typeof userSessions.$inferInsert
