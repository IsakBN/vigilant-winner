import { neon, NeonQueryFunction } from '@neondatabase/serverless'
import { drizzle, NeonHttpDatabase } from 'drizzle-orm/neon-http'
import * as schema from './schema'

type Database = NeonHttpDatabase<typeof schema>

let _db: Database | null = null
let _sql: NeonQueryFunction<false, false> | null = null

function getDb(): Database {
  if (_db) return _db

  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is not set')
  }
  _sql = neon(databaseUrl)
  _db = drizzle(_sql, { schema })
  return _db
}

export const db = new Proxy({} as Database, {
  get(_target, prop) {
    return (getDb() as unknown as Record<string | symbol, unknown>)[prop]
  },
})
