import { db } from '../db'
import { emailAllowlist } from '../db/schema'

export async function isEmailAllowed(email: string): Promise<boolean> {
  const patterns = await db.select().from(emailAllowlist)

  for (const { emailPattern } of patterns) {
    // Wildcard domain match: *@example.com
    if (emailPattern.startsWith('*@')) {
      const domain = emailPattern.slice(2)
      if (email.toLowerCase().endsWith(`@${domain}`)) {
        return true
      }
    }
    // Exact match
    else if (email.toLowerCase() === emailPattern.toLowerCase()) {
      return true
    }
  }

  return false
}
