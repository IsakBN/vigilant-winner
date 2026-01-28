import { neon, NeonQueryFunction } from '@neondatabase/serverless'
import { drizzle, NeonHttpDatabase } from 'drizzle-orm/neon-http'

let _db: NeonHttpDatabase | null = null
let _sql: NeonQueryFunction<false, false> | null = null

function getDb(): NeonHttpDatabase {
  if (_db) return _db

  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is not set')
  }

  _sql = neon(databaseUrl)
  _db = drizzle(_sql)
  return _db
}

export const db = new Proxy({} as NeonHttpDatabase, {
  get(_target, prop: string | symbol) {
    const database = getDb()
    return Reflect.get(database, prop) as unknown
  },
})
