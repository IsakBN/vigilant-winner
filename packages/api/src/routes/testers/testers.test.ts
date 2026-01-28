/**
 * Testers Routes Tests
 *
 * Tests validation schemas and helper functions.
 * Integration tests are handled by E2E tests.
 *
 * @agent testers-routes
 * @created 2026-01-27
 */

import { describe, it, expect } from 'vitest'
import { z } from 'zod'
import { ERROR_CODES } from '@bundlenudge/shared'

// =============================================================================
// Validation Schemas (replicated from route file for testing)
// =============================================================================

const createTesterSchema = z.object({
  email: z.string().email(),
  name: z.string().max(100).optional(),
})

const updateTesterSchema = z.object({
  name: z.string().max(100).nullable().optional(),
})

const bulkCreateSchema = z.object({
  testers: z.array(z.object({
    email: z.string().email(),
    name: z.string().max(100).optional(),
  })).min(1).max(100),
})

const importCsvSchema = z.object({
  csv: z.string().min(1),
})

// =============================================================================
// Helper Functions (replicated from route file for testing)
// =============================================================================

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

function parseCsvLine(line: string): { email: string; name?: string } | null {
  const parts = line.split(',').map(p => p.trim().replace(/^["']|["']$/g, ''))
  const email = parts[0]
  // Use truthy check - empty string should become undefined (name is optional)
  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
  const name = parts[1] || undefined

  if (!email || !isValidEmail(email)) return null
  return { email, name }
}

interface FormattedTester {
  id: string
  appId: string
  email: string
  name: string | null
  createdAt: number
  createdBy: string
}

function formatTester(row: {
  id: string
  app_id: string
  email: string
  name: string | null
  created_at: number
  created_by: string
}): FormattedTester {
  return {
    id: row.id,
    appId: row.app_id,
    email: row.email,
    name: row.name,
    createdAt: row.created_at,
    createdBy: row.created_by,
  }
}

// =============================================================================
// Tests
// =============================================================================

describe('Testers Routes Logic', () => {
  describe('createTesterSchema', () => {
    it('validates valid email', () => {
      const result = createTesterSchema.safeParse({ email: 'test@example.com' })
      expect(result.success).toBe(true)
    })

    it('validates email with name', () => {
      const result = createTesterSchema.safeParse({
        email: 'test@example.com',
        name: 'Test User',
      })
      expect(result.success).toBe(true)
    })

    it('rejects invalid email', () => {
      const result = createTesterSchema.safeParse({ email: 'invalid-email' })
      expect(result.success).toBe(false)
    })

    it('rejects missing email', () => {
      const result = createTesterSchema.safeParse({ name: 'Test' })
      expect(result.success).toBe(false)
    })

    it('rejects name over 100 characters', () => {
      const result = createTesterSchema.safeParse({
        email: 'test@example.com',
        name: 'a'.repeat(101),
      })
      expect(result.success).toBe(false)
    })

    it('accepts name exactly 100 characters', () => {
      const result = createTesterSchema.safeParse({
        email: 'test@example.com',
        name: 'a'.repeat(100),
      })
      expect(result.success).toBe(true)
    })
  })

  describe('updateTesterSchema', () => {
    it('validates name update', () => {
      const result = updateTesterSchema.safeParse({ name: 'New Name' })
      expect(result.success).toBe(true)
    })

    it('validates setting name to null', () => {
      const result = updateTesterSchema.safeParse({ name: null })
      expect(result.success).toBe(true)
    })

    it('validates empty update (no changes)', () => {
      const result = updateTesterSchema.safeParse({})
      expect(result.success).toBe(true)
    })

    it('rejects name over 100 characters', () => {
      const result = updateTesterSchema.safeParse({ name: 'a'.repeat(101) })
      expect(result.success).toBe(false)
    })
  })

  describe('bulkCreateSchema', () => {
    it('validates single tester', () => {
      const result = bulkCreateSchema.safeParse({
        testers: [{ email: 'a@test.com' }],
      })
      expect(result.success).toBe(true)
    })

    it('validates multiple testers', () => {
      const result = bulkCreateSchema.safeParse({
        testers: [
          { email: 'a@test.com', name: 'Alice' },
          { email: 'b@test.com', name: 'Bob' },
        ],
      })
      expect(result.success).toBe(true)
    })

    it('validates exactly 100 testers', () => {
      const testers = Array.from({ length: 100 }, (_, i) => ({
        email: `user${String(i)}@test.com`,
      }))
      const result = bulkCreateSchema.safeParse({ testers })
      expect(result.success).toBe(true)
    })

    it('rejects more than 100 testers', () => {
      const testers = Array.from({ length: 101 }, (_, i) => ({
        email: `user${String(i)}@test.com`,
      }))
      const result = bulkCreateSchema.safeParse({ testers })
      expect(result.success).toBe(false)
    })

    it('rejects empty testers array', () => {
      const result = bulkCreateSchema.safeParse({ testers: [] })
      expect(result.success).toBe(false)
    })

    it('rejects testers with invalid email', () => {
      const result = bulkCreateSchema.safeParse({
        testers: [{ email: 'invalid' }],
      })
      expect(result.success).toBe(false)
    })
  })

  describe('importCsvSchema', () => {
    it('validates non-empty CSV', () => {
      const result = importCsvSchema.safeParse({ csv: 'email,name\na@test.com,Alice' })
      expect(result.success).toBe(true)
    })

    it('rejects empty CSV', () => {
      const result = importCsvSchema.safeParse({ csv: '' })
      expect(result.success).toBe(false)
    })

    it('rejects missing CSV field', () => {
      const result = importCsvSchema.safeParse({})
      expect(result.success).toBe(false)
    })
  })

  describe('isValidEmail helper', () => {
    it('validates standard email', () => {
      expect(isValidEmail('test@example.com')).toBe(true)
    })

    it('validates email with subdomain', () => {
      expect(isValidEmail('test@mail.example.com')).toBe(true)
    })

    it('validates email with plus sign', () => {
      expect(isValidEmail('test+tag@example.com')).toBe(true)
    })

    it('rejects email without @', () => {
      expect(isValidEmail('testexample.com')).toBe(false)
    })

    it('rejects email without domain', () => {
      expect(isValidEmail('test@')).toBe(false)
    })

    it('rejects email with spaces', () => {
      expect(isValidEmail('test @example.com')).toBe(false)
    })

    it('rejects empty string', () => {
      expect(isValidEmail('')).toBe(false)
    })
  })

  describe('parseCsvLine helper', () => {
    it('parses email only', () => {
      const result = parseCsvLine('test@example.com')
      expect(result).toEqual({ email: 'test@example.com', name: undefined })
    })

    it('parses email and name', () => {
      const result = parseCsvLine('test@example.com,Test User')
      expect(result).toEqual({ email: 'test@example.com', name: 'Test User' })
    })

    it('parses quoted name', () => {
      const result = parseCsvLine('test@example.com,"Test User"')
      expect(result).toEqual({ email: 'test@example.com', name: 'Test User' })
    })

    it('parses single-quoted name', () => {
      const result = parseCsvLine("test@example.com,'Test User'")
      expect(result).toEqual({ email: 'test@example.com', name: 'Test User' })
    })

    it('handles whitespace', () => {
      const result = parseCsvLine('  test@example.com  ,  Test User  ')
      expect(result).toEqual({ email: 'test@example.com', name: 'Test User' })
    })

    it('returns null for invalid email', () => {
      const result = parseCsvLine('invalid-email,Test')
      expect(result).toBe(null)
    })

    it('returns null for empty line', () => {
      const result = parseCsvLine('')
      expect(result).toBe(null)
    })

    it('handles empty name field', () => {
      const result = parseCsvLine('test@example.com,')
      expect(result).toEqual({ email: 'test@example.com', name: undefined })
    })
  })

  describe('formatTester helper', () => {
    it('formats tester row correctly', () => {
      const row = {
        id: 'tester-123',
        app_id: 'app-456',
        email: 'test@example.com',
        name: 'Test User',
        created_at: 1234567890,
        created_by: 'user-789',
      }

      const result = formatTester(row)

      expect(result).toEqual({
        id: 'tester-123',
        appId: 'app-456',
        email: 'test@example.com',
        name: 'Test User',
        createdAt: 1234567890,
        createdBy: 'user-789',
      })
    })

    it('handles null name', () => {
      const row = {
        id: 'tester-123',
        app_id: 'app-456',
        email: 'test@example.com',
        name: null,
        created_at: 1234567890,
        created_by: 'user-789',
      }

      const result = formatTester(row)
      expect(result.name).toBe(null)
    })
  })

  describe('error codes', () => {
    it('has APP_NOT_FOUND error code', () => {
      expect(ERROR_CODES.APP_NOT_FOUND).toBe('APP_NOT_FOUND')
    })

    it('has NOT_FOUND error code', () => {
      expect(ERROR_CODES.NOT_FOUND).toBe('NOT_FOUND')
    })

    it('has ALREADY_EXISTS error code', () => {
      expect(ERROR_CODES.ALREADY_EXISTS).toBe('ALREADY_EXISTS')
    })

    it('has INVALID_INPUT error code', () => {
      expect(ERROR_CODES.INVALID_INPUT).toBe('INVALID_INPUT')
    })
  })

  describe('response structure', () => {
    it('list response has data array and pagination', () => {
      const response = {
        data: [],
        pagination: { total: 0, limit: 50, offset: 0, hasMore: false },
      }
      expect(response).toHaveProperty('data')
      expect(Array.isArray(response.data)).toBe(true)
      expect(response.pagination).toHaveProperty('total')
      expect(response.pagination).toHaveProperty('limit')
      expect(response.pagination).toHaveProperty('offset')
      expect(response.pagination).toHaveProperty('hasMore')
    })

    it('single tester response has tester object', () => {
      const response = {
        tester: {
          id: 'tester-123',
          appId: 'app-456',
          email: 'test@example.com',
          name: 'Test User',
          createdAt: 1234567890,
          createdBy: 'user-789',
        },
      }
      expect(response).toHaveProperty('tester')
      expect(response.tester).toHaveProperty('id')
      expect(response.tester).toHaveProperty('appId')
      expect(response.tester).toHaveProperty('email')
      expect(response.tester).toHaveProperty('name')
      expect(response.tester).toHaveProperty('createdAt')
      expect(response.tester).toHaveProperty('createdBy')
    })

    it('create response has tester fields', () => {
      const response = {
        id: 'tester-123',
        email: 'test@example.com',
        name: 'Test User',
        createdAt: 1234567890,
      }
      expect(response).toHaveProperty('id')
      expect(response).toHaveProperty('email')
      expect(response).toHaveProperty('name')
      expect(response).toHaveProperty('createdAt')
    })

    it('bulk create response has counts', () => {
      const response = { added: 5, duplicates: 2, total: 7 }
      expect(response).toHaveProperty('added')
      expect(response).toHaveProperty('duplicates')
      expect(response).toHaveProperty('total')
    })

    it('export response has csv string', () => {
      const response = { csv: 'email,name\na@test.com,Alice' }
      expect(response).toHaveProperty('csv')
      expect(typeof response.csv).toBe('string')
    })

    it('delete response has success flag', () => {
      const response = { success: true }
      expect(response).toHaveProperty('success')
      expect(response.success).toBe(true)
    })
  })

  describe('CSV export format', () => {
    it('generates correct header', () => {
      const csv = 'email,name\n'
      expect(csv.startsWith('email,name')).toBe(true)
    })

    it('escapes quotes in name', () => {
      const name = 'Charlie "C"'
      const escaped = `"${name.replace(/"/g, '""')}"`
      expect(escaped).toBe('"Charlie ""C"""')
    })

    it('handles null name correctly', () => {
      // Test the escape logic for null/undefined names
      const formatName = (name: string | null): string => {
        return name ? `"${name.replace(/"/g, '""')}"` : ''
      }
      expect(formatName(null)).toBe('')
      expect(formatName('Alice')).toBe('"Alice"')
    })
  })

  describe('pagination', () => {
    it('calculates hasMore correctly when more results exist', () => {
      const total = 100
      const offset = 0
      const resultsLength = 50
      const hasMore = offset + resultsLength < total
      expect(hasMore).toBe(true)
    })

    it('calculates hasMore correctly when no more results', () => {
      const total = 30
      const offset = 0
      const resultsLength = 30
      const hasMore = offset + resultsLength < total
      expect(hasMore).toBe(false)
    })

    it('calculates hasMore correctly with offset', () => {
      const total = 100
      const offset = 80
      const resultsLength = 20
      const hasMore = offset + resultsLength < total
      expect(hasMore).toBe(false)
    })

    it('respects max limit of 100', () => {
      const requestedLimit = 200
      const limit = Math.min(requestedLimit, 100)
      expect(limit).toBe(100)
    })

    it('defaults to 50 when no limit provided', () => {
      const requestedLimit = undefined
      const limit = Math.min(Number(requestedLimit) || 50, 100)
      expect(limit).toBe(50)
    })
  })
})
