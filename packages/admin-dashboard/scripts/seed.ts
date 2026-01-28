import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import { emailAllowlist } from '../src/lib/db/schema'

async function seed() {
  const client = postgres(process.env.DATABASE_URL!)
  const db = drizzle(client)

  await db.insert(emailAllowlist).values({
    id: crypto.randomUUID(),
    emailPattern: '*@bundlenudge.com',
    addedBy: 'system',
    note: 'Initial setup - all company emails',
  })

  console.log('Admin allowlist seeded')
  await client.end()
}

seed().catch(console.error)
