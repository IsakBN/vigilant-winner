/**
 * Seed the email_allowlist table for admin access control
 *
 * Run with: npx tsx scripts/seed-admin-allowlist.ts
 *
 * Uses DATABASE_URL from environment or wrangler.toml default
 */

import postgres from 'postgres'

const DATABASE_URL = process.env.DATABASE_URL
  ?? 'postgresql://postgres:UmCrzLjCAQbiyugXvrzrvHyojxRiYkAe@nozomi.proxy.rlwy.net:51415/railway'

async function seedAdminAllowlist() {
  console.log('Connecting to database...')
  const sql = postgres(DATABASE_URL)

  try {
    // Create table if it doesn't exist
    console.log('Creating email_allowlist table if not exists...')
    await sql`
      CREATE TABLE IF NOT EXISTS email_allowlist (
        id TEXT PRIMARY KEY,
        email_pattern TEXT NOT NULL,
        added_by TEXT NOT NULL,
        added_at TIMESTAMP DEFAULT NOW(),
        note TEXT
      )
    `

    // Check if pattern already exists
    const existing = await sql`
      SELECT id FROM email_allowlist WHERE email_pattern = '*@bundlenudge.com'
    `

    if (existing.length > 0) {
      console.log('Pattern *@bundlenudge.com already exists, skipping...')
    } else {
      // Insert the allowlist pattern
      const id = crypto.randomUUID()
      await sql`
        INSERT INTO email_allowlist (id, email_pattern, added_by, note)
        VALUES (${id}, '*@bundlenudge.com', 'system', 'Initial setup - all company emails allowed')
      `
      console.log('Added *@bundlenudge.com to allowlist')
    }

    // Show current allowlist
    const patterns = await sql`SELECT * FROM email_allowlist`
    console.log('\nCurrent email allowlist:')
    for (const p of patterns) {
      console.log(`  - ${p.email_pattern} (added by ${p.added_by})`)
    }

    console.log('\nDone!')
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  } finally {
    await sql.end()
  }
}

seedAdminAllowlist()
