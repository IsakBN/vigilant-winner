/**
 * Scheduled emails service tests
 *
 * @agent scheduled-emails
 * @created 2026-01-27
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  scheduleEmail,
  getScheduledEmails,
  markEmailSent,
  markEmailFailed,
  cancelScheduledEmail,
  hasScheduledFollowUp,
} from './scheduled-emails'

// =============================================================================
// Mocks
// =============================================================================

interface MockPrepared {
  bind: ReturnType<typeof vi.fn>
  run: ReturnType<typeof vi.fn>
  first: ReturnType<typeof vi.fn>
  all: ReturnType<typeof vi.fn>
}

interface MockRow {
  id: string
  user_id: string
  email: string
  template: string
  scheduled_for: number
  sent_at: number | null
  failed_at: number | null
  failure_reason: string | null
  metadata: string | null
  created_at: number
}

function createMockDb(options: {
  allResults?: MockRow[]
  firstResult?: { id: string } | null
} = {}): D1Database {
  const prepared: MockPrepared = {
    bind: vi.fn().mockReturnThis(),
    run: vi.fn().mockResolvedValue({ success: true }),
    first: vi.fn().mockResolvedValue(options.firstResult ?? null),
    all: vi.fn().mockResolvedValue({ results: options.allResults ?? [] }),
  }

  return {
    prepare: vi.fn().mockReturnValue(prepared),
  } as unknown as D1Database
}

// =============================================================================
// Tests
// =============================================================================

describe('Scheduled Emails', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('scheduleEmail', () => {
    it('should schedule an email with all parameters', async () => {
      const mockDb = createMockDb()
      const prepareMock = mockDb.prepare as ReturnType<typeof vi.fn>

      const id = await scheduleEmail(mockDb, {
        userId: 'user-123',
        email: 'test@example.com',
        template: 'follow_up',
        scheduledFor: 1700000000000,
        metadata: { userName: 'John' },
      })

      expect(id).toBeDefined()
      expect(typeof id).toBe('string')

      // Check the INSERT query was called
      const prepareCall = prepareMock.mock.calls[0]?.[0] as string
      expect(prepareCall).toContain('INSERT INTO scheduled_emails')
      expect(prepareCall).toContain('user_id')
      expect(prepareCall).toContain('email')
      expect(prepareCall).toContain('template')
      expect(prepareCall).toContain('scheduled_for')
      expect(prepareCall).toContain('metadata')
    })

    it('should schedule an email without metadata', async () => {
      const mockDb = createMockDb()

      const id = await scheduleEmail(mockDb, {
        userId: 'user-123',
        email: 'test@example.com',
        template: 'follow_up',
        scheduledFor: 1700000000000,
      })

      expect(id).toBeDefined()
    })

    it('should bind correct values', async () => {
      const mockDb = createMockDb()
      const prepareMock = mockDb.prepare as ReturnType<typeof vi.fn>

      await scheduleEmail(mockDb, {
        userId: 'user-123',
        email: 'test@example.com',
        template: 'follow_up',
        scheduledFor: 1700000000000,
        metadata: { userName: 'John' },
      })

      const prepared = prepareMock.mock.results[0]?.value as MockPrepared
      const bindCall = prepared.bind.mock.calls[0] as unknown[]

      // id, userId, email, template, scheduledFor, metadata, createdAt
      expect(bindCall[1]).toBe('user-123')
      expect(bindCall[2]).toBe('test@example.com')
      expect(bindCall[3]).toBe('follow_up')
      expect(bindCall[4]).toBe(1700000000000)
      expect(bindCall[5]).toBe('{"userName":"John"}')
    })
  })

  describe('getScheduledEmails', () => {
    it('should retrieve due emails', async () => {
      const mockEmails: MockRow[] = [
        {
          id: 'email-1',
          user_id: 'user-123',
          email: 'test1@example.com',
          template: 'follow_up',
          scheduled_for: Date.now() - 1000,
          sent_at: null,
          failed_at: null,
          failure_reason: null,
          metadata: '{"userName":"John"}',
          created_at: Date.now() - 100000,
        },
        {
          id: 'email-2',
          user_id: 'user-456',
          email: 'test2@example.com',
          template: 'follow_up',
          scheduled_for: Date.now() - 2000,
          sent_at: null,
          failed_at: null,
          failure_reason: null,
          metadata: null,
          created_at: Date.now() - 200000,
        },
      ]

      const mockDb = createMockDb({ allResults: mockEmails })

      const result = await getScheduledEmails(mockDb, 100)

      expect(result).toHaveLength(2)
      expect(result[0]?.id).toBe('email-1')
      expect(result[0]?.userId).toBe('user-123')
      expect(result[0]?.email).toBe('test1@example.com')
      expect(result[0]?.template).toBe('follow_up')
      expect(result[0]?.metadata).toBe('{"userName":"John"}')
    })

    it('should query with correct WHERE conditions', async () => {
      const mockDb = createMockDb()
      const prepareMock = mockDb.prepare as ReturnType<typeof vi.fn>

      await getScheduledEmails(mockDb, 50)

      const prepareCall = prepareMock.mock.calls[0]?.[0] as string
      expect(prepareCall).toContain('sent_at IS NULL')
      expect(prepareCall).toContain('failed_at IS NULL')
      expect(prepareCall).toContain('scheduled_for <=')
      expect(prepareCall).toContain('ORDER BY scheduled_for ASC')
      expect(prepareCall).toContain('LIMIT')
    })

    it('should not retrieve future emails', async () => {
      const mockDb = createMockDb({ allResults: [] })

      const result = await getScheduledEmails(mockDb, 100)

      expect(result).toHaveLength(0)
    })

    it('should respect the limit parameter', async () => {
      const mockDb = createMockDb()
      const prepareMock = mockDb.prepare as ReturnType<typeof vi.fn>

      await getScheduledEmails(mockDb, 25)

      const prepared = prepareMock.mock.results[0]?.value as MockPrepared
      const bindCall = prepared.bind.mock.calls[0] as unknown[]

      expect(bindCall[1]).toBe(25)
    })
  })

  describe('markEmailSent', () => {
    it('should mark email as sent', async () => {
      const mockDb = createMockDb()
      const prepareMock = mockDb.prepare as ReturnType<typeof vi.fn>

      await markEmailSent(mockDb, 'email-123')

      const prepareCall = prepareMock.mock.calls[0]?.[0] as string
      expect(prepareCall).toContain('UPDATE scheduled_emails')
      expect(prepareCall).toContain('sent_at = ?')
      expect(prepareCall).toContain('WHERE id = ?')
    })

    it('should bind correct timestamp and id', async () => {
      const mockDb = createMockDb()
      const prepareMock = mockDb.prepare as ReturnType<typeof vi.fn>

      const beforeTime = Date.now()
      await markEmailSent(mockDb, 'email-123')
      const afterTime = Date.now()

      const prepared = prepareMock.mock.results[0]?.value as MockPrepared
      const bindCall = prepared.bind.mock.calls[0] as unknown[]

      const timestamp = bindCall[0] as number
      expect(timestamp).toBeGreaterThanOrEqual(beforeTime)
      expect(timestamp).toBeLessThanOrEqual(afterTime)
      expect(bindCall[1]).toBe('email-123')
    })
  })

  describe('markEmailFailed', () => {
    it('should mark email as failed with reason', async () => {
      const mockDb = createMockDb()
      const prepareMock = mockDb.prepare as ReturnType<typeof vi.fn>

      await markEmailFailed(mockDb, 'email-123', 'SMTP error')

      const prepareCall = prepareMock.mock.calls[0]?.[0] as string
      expect(prepareCall).toContain('UPDATE scheduled_emails')
      expect(prepareCall).toContain('failed_at = ?')
      expect(prepareCall).toContain('failure_reason = ?')
    })

    it('should bind correct values', async () => {
      const mockDb = createMockDb()
      const prepareMock = mockDb.prepare as ReturnType<typeof vi.fn>

      const beforeTime = Date.now()
      await markEmailFailed(mockDb, 'email-123', 'Connection timeout')
      const afterTime = Date.now()

      const prepared = prepareMock.mock.results[0]?.value as MockPrepared
      const bindCall = prepared.bind.mock.calls[0] as unknown[]

      const timestamp = bindCall[0] as number
      expect(timestamp).toBeGreaterThanOrEqual(beforeTime)
      expect(timestamp).toBeLessThanOrEqual(afterTime)
      expect(bindCall[1]).toBe('Connection timeout')
      expect(bindCall[2]).toBe('email-123')
    })
  })

  describe('cancelScheduledEmail', () => {
    it('should mark email as failed with cancelled reason', async () => {
      const mockDb = createMockDb()
      const prepareMock = mockDb.prepare as ReturnType<typeof vi.fn>

      await cancelScheduledEmail(mockDb, 'email-123')

      const prepared = prepareMock.mock.results[0]?.value as MockPrepared
      const bindCall = prepared.bind.mock.calls[0] as unknown[]

      expect(bindCall[1]).toBe('cancelled')
      expect(bindCall[2]).toBe('email-123')
    })
  })

  describe('hasScheduledFollowUp', () => {
    it('should return true if follow-up is scheduled', async () => {
      const mockDb = createMockDb({ firstResult: { id: 'email-123' } })

      const result = await hasScheduledFollowUp(mockDb, 'user-123')

      expect(result).toBe(true)
    })

    it('should return false if no follow-up is scheduled', async () => {
      const mockDb = createMockDb({ firstResult: null })

      const result = await hasScheduledFollowUp(mockDb, 'user-123')

      expect(result).toBe(false)
    })

    it('should query for follow_up template only', async () => {
      const mockDb = createMockDb()
      const prepareMock = mockDb.prepare as ReturnType<typeof vi.fn>

      await hasScheduledFollowUp(mockDb, 'user-123')

      const prepareCall = prepareMock.mock.calls[0]?.[0] as string
      expect(prepareCall).toContain("template = 'follow_up'")
      expect(prepareCall).toContain('sent_at IS NULL')
      expect(prepareCall).toContain('failed_at IS NULL')
    })
  })
})
