/**
 * Testers Route Helpers
 *
 * @agent testers-routes
 * @created 2026-01-27
 */

import { z } from 'zod'
import type { Env } from '../../types/env'

// =============================================================================
// Schemas
// =============================================================================

export const createTesterSchema = z.object({
  email: z.string().email(),
  name: z.string().max(100).optional(),
})

export const updateTesterSchema = z.object({
  name: z.string().max(100).nullable().optional(),
})

export const bulkCreateSchema = z.object({
  testers: z.array(z.object({
    email: z.string().email(),
    name: z.string().max(100).optional(),
  })).min(1).max(100),
})

export const importCsvSchema = z.object({
  csv: z.string().min(1),
})

// =============================================================================
// Types
// =============================================================================

export interface TesterRow {
  id: string
  app_id: string
  email: string
  name: string | null
  created_at: number
  created_by: string
}

export interface FormattedTester {
  id: string
  appId: string
  email: string
  name: string | null
  createdAt: number
  createdBy: string
}

// =============================================================================
// Helpers
// =============================================================================

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function formatTester(row: TesterRow): FormattedTester {
  return {
    id: row.id,
    appId: row.app_id,
    email: row.email,
    name: row.name,
    createdAt: row.created_at,
    createdBy: row.created_by,
  }
}

export async function verifyAppOwnership(
  db: Env['DB'],
  appId: string,
  userId: string
): Promise<boolean> {
  const app = await db.prepare(
    'SELECT id FROM apps WHERE id = ? AND owner_id = ? AND deleted_at IS NULL'
  ).bind(appId, userId).first()
  return !!app
}

export function parseCsvLine(line: string): { email: string; name?: string } | null {
  const parts = line.split(',').map(p => p.trim().replace(/^["']|["']$/g, ''))
  const email = parts[0]
  const name = parts[1] || undefined

  if (!email || !isValidEmail(email)) return null
  return { email, name }
}
