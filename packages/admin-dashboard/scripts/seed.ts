import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { emailAllowlist } from '../src/lib/db/schema'

async function seed() {
  const sql = neon(process.env.DATABASE_URL!)
  const db = drizzle(sql)

  await db.insert(emailAllowlist).values({
    id: crypto.randomUUID(),
    emailPattern: '*@bundlenudge.com',
    addedBy: 'system',
    note: 'Initial setup - all company emails',
  })

  console.log('Admin allowlist seeded')
}

seed().catch(console.error)
