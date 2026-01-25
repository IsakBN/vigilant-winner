/**
 * Database exports for BundleNudge API
 */

import { drizzle } from 'drizzle-orm/d1'
import * as schema from './schema'

export type Database = ReturnType<typeof getDb>

/**
 * Create a Drizzle database instance from a D1 binding
 */
export function getDb(d1: D1Database): ReturnType<typeof drizzle<typeof schema>> {
  return drizzle(d1, { schema })
}

export * from './schema'
export type { InferSelectModel, InferInsertModel } from 'drizzle-orm'
