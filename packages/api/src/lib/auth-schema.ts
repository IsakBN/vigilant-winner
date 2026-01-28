/**
 * Better Auth schema for Railway Postgres
 *
 * These tables are managed by Better Auth for authentication.
 * Uses Drizzle ORM with Postgres adapter.
 * Column names use snake_case to match Better Auth defaults.
 */

import { pgTable, text, boolean, timestamp, index } from 'drizzle-orm/pg-core'

/**
 * User table - primary user records
 */
export const user = pgTable('user', {
  id: text('id').primaryKey(),
  email: text('email').unique().notNull(),
  emailVerified: boolean('email_verified').default(false),
  name: text('name'),
  image: text('image'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  emailIdx: index('user_email_idx').on(table.email),
}))

/**
 * Session table - active user sessions
 */
export const session = pgTable('session', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  token: text('token').unique().notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  userIdIdx: index('session_user_id_idx').on(table.userId),
  tokenIdx: index('session_token_idx').on(table.token),
}))

/**
 * Account table - OAuth providers and email/password credentials
 */
export const account = pgTable('account', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  idToken: text('id_token'),
  password: text('password'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  userIdIdx: index('account_user_id_idx').on(table.userId),
}))

/**
 * Verification table - email verification tokens and password reset
 */
export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

/**
 * Email allowlist for admin access
 * Controls which emails can request OTP for admin dashboard
 */
export const emailAllowlist = pgTable('email_allowlist', {
  id: text('id').primaryKey(),
  emailPattern: text('email_pattern').notNull(), // e.g., "*@bundlenudge.com" or "admin@example.com"
  addedBy: text('added_by').notNull(),
  addedAt: timestamp('added_at').defaultNow(),
  note: text('note'),
})
