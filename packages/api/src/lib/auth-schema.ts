/**
 * Better Auth schema for Neon Postgres
 *
 * These tables are managed by Better Auth for authentication.
 * Uses Drizzle ORM with Postgres adapter.
 */

import { pgTable, text, boolean, timestamp, index } from 'drizzle-orm/pg-core'

/**
 * User table - primary user records
 */
export const user = pgTable('user', {
  id: text('id').primaryKey(),
  email: text('email').unique().notNull(),
  emailVerified: boolean('emailVerified').default(false),
  name: text('name'),
  image: text('image'),
  createdAt: timestamp('createdAt').defaultNow(),
  updatedAt: timestamp('updatedAt').defaultNow(),
}, (table) => ({
  emailIdx: index('user_email_idx').on(table.email),
}))

/**
 * Session table - active user sessions
 */
export const session = pgTable('session', {
  id: text('id').primaryKey(),
  userId: text('userId').notNull().references(() => user.id, { onDelete: 'cascade' }),
  token: text('token').unique().notNull(),
  expiresAt: timestamp('expiresAt').notNull(),
  ipAddress: text('ipAddress'),
  userAgent: text('userAgent'),
  createdAt: timestamp('createdAt').defaultNow(),
  updatedAt: timestamp('updatedAt').defaultNow(),
}, (table) => ({
  userIdIdx: index('session_userId_idx').on(table.userId),
  tokenIdx: index('session_token_idx').on(table.token),
}))

/**
 * Account table - OAuth providers and email/password credentials
 */
export const account = pgTable('account', {
  id: text('id').primaryKey(),
  userId: text('userId').notNull().references(() => user.id, { onDelete: 'cascade' }),
  accountId: text('accountId').notNull(),
  providerId: text('providerId').notNull(),
  accessToken: text('accessToken'),
  refreshToken: text('refreshToken'),
  accessTokenExpiresAt: timestamp('accessTokenExpiresAt'),
  refreshTokenExpiresAt: timestamp('refreshTokenExpiresAt'),
  scope: text('scope'),
  idToken: text('idToken'),
  password: text('password'),
  createdAt: timestamp('createdAt').defaultNow(),
  updatedAt: timestamp('updatedAt').defaultNow(),
}, (table) => ({
  userIdIdx: index('account_userId_idx').on(table.userId),
}))

/**
 * Verification table - email verification tokens and password reset
 */
export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expiresAt').notNull(),
  createdAt: timestamp('createdAt').defaultNow(),
  updatedAt: timestamp('updatedAt').defaultNow(),
})
