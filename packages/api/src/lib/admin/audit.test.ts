/**
 * Admin audit logging tests
 *
 * @agent wave5-admin
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { logAdminAction, getAuditLog } from './audit'

describe('Admin Audit Logging', () => {
  let mockDb: {
    prepare: ReturnType<typeof vi.fn>
  }
  let mockStatement: {
    bind: ReturnType<typeof vi.fn>
    run: ReturnType<typeof vi.fn>
    first: ReturnType<typeof vi.fn>
    all: ReturnType<typeof vi.fn>
  }

  beforeEach(() => {
    mockStatement = {
      bind: vi.fn().mockReturnThis(),
      run: vi.fn().mockResolvedValue({ success: true }),
      first: vi.fn(),
      all: vi.fn(),
    }
    mockDb = {
      prepare: vi.fn().mockReturnValue(mockStatement),
    }
  })

  describe('logAdminAction', () => {
    it('logs basic admin action', async () => {
      const id = await logAdminAction(mockDb as never, {
        adminId: 'admin-123',
        action: 'suspend_user',
        targetUserId: 'user-456',
      })

      expect(id).toBeDefined()
      expect(mockDb.prepare).toHaveBeenCalled()
      expect(mockStatement.bind).toHaveBeenCalledWith(
        expect.any(String), // id
        'admin-123',
        'suspend_user',
        'user-456',
        null, // targetAppId
        null, // details
        null, // ipAddress
        null, // userAgent
        expect.any(Number) // createdAt
      )
      expect(mockStatement.run).toHaveBeenCalled()
    })

    it('logs action with details', async () => {
      await logAdminAction(mockDb as never, {
        adminId: 'admin-123',
        action: 'override_limits',
        targetUserId: 'user-456',
        details: { mauLimit: 50000, reason: 'Trial extension' },
      })

      expect(mockStatement.bind).toHaveBeenCalledWith(
        expect.any(String),
        'admin-123',
        'override_limits',
        'user-456',
        null,
        JSON.stringify({ mauLimit: 50000, reason: 'Trial extension' }),
        null,
        null,
        expect.any(Number)
      )
    })

    it('logs action with IP and user agent', async () => {
      await logAdminAction(mockDb as never, {
        adminId: 'admin-123',
        action: 'disable_app',
        targetAppId: 'app-789',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
      })

      expect(mockStatement.bind).toHaveBeenCalledWith(
        expect.any(String),
        'admin-123',
        'disable_app',
        null, // targetUserId
        'app-789',
        null,
        '192.168.1.1',
        'Mozilla/5.0',
        expect.any(Number)
      )
    })

    it('logs app deletion with full details', async () => {
      await logAdminAction(mockDb as never, {
        adminId: 'admin-123',
        action: 'delete_app',
        targetUserId: 'user-456',
        targetAppId: 'app-789',
        details: { appName: 'MyApp', reason: 'TOS violation' },
      })

      expect(mockStatement.bind).toHaveBeenCalledWith(
        expect.any(String),
        'admin-123',
        'delete_app',
        'user-456',
        'app-789',
        JSON.stringify({ appName: 'MyApp', reason: 'TOS violation' }),
        null,
        null,
        expect.any(Number)
      )
    })
  })

  describe('getAuditLog', () => {
    it('returns paginated audit log', async () => {
      mockStatement.first.mockResolvedValue({ total: 100 })
      mockStatement.all.mockResolvedValue({
        results: [
          {
            id: 'log-1',
            admin_id: 'admin-123',
            action: 'suspend_user',
            target_user_id: 'user-456',
            target_app_id: null,
            details: null,
            ip_address: null,
            user_agent: null,
            created_at: 1706200000000,
          },
        ],
      })

      const result = await getAuditLog(mockDb as never, {
        limit: 20,
        offset: 0,
      })

      expect(result.total).toBe(100)
      expect(result.entries).toHaveLength(1)
      expect(result.entries[0]).toEqual({
        id: 'log-1',
        adminId: 'admin-123',
        action: 'suspend_user',
        targetUserId: 'user-456',
        targetAppId: null,
        details: null,
        ipAddress: null,
        userAgent: null,
        createdAt: 1706200000000,
      })
    })

    it('filters by admin ID', async () => {
      mockStatement.first.mockResolvedValue({ total: 5 })
      mockStatement.all.mockResolvedValue({ results: [] })

      await getAuditLog(mockDb as never, { adminId: 'admin-123' })

      const prepareCall = mockDb.prepare.mock.calls[0]?.[0] as string | undefined
      expect(prepareCall).toContain('WHERE')
      expect(prepareCall).toContain('admin_id = ?')
    })

    it('filters by action type', async () => {
      mockStatement.first.mockResolvedValue({ total: 10 })
      mockStatement.all.mockResolvedValue({ results: [] })

      await getAuditLog(mockDb as never, { action: 'suspend_user' })

      const prepareCall = mockDb.prepare.mock.calls[0]?.[0] as string | undefined
      expect(prepareCall).toContain('action = ?')
    })

    it('filters by date range', async () => {
      mockStatement.first.mockResolvedValue({ total: 50 })
      mockStatement.all.mockResolvedValue({ results: [] })

      await getAuditLog(mockDb as never, {
        startDate: 1706100000000,
        endDate: 1706200000000,
      })

      const prepareCall = mockDb.prepare.mock.calls[0]?.[0] as string | undefined
      expect(prepareCall).toContain('created_at >= ?')
      expect(prepareCall).toContain('created_at <= ?')
    })

    it('parses JSON details correctly', async () => {
      mockStatement.first.mockResolvedValue({ total: 1 })
      mockStatement.all.mockResolvedValue({
        results: [
          {
            id: 'log-1',
            admin_id: 'admin-123',
            action: 'override_limits',
            target_user_id: 'user-456',
            target_app_id: null,
            details: '{"mauLimit":50000}',
            ip_address: null,
            user_agent: null,
            created_at: 1706200000000,
          },
        ],
      })

      const result = await getAuditLog(mockDb as never)

      expect(result.entries[0]?.details).toEqual({ mauLimit: 50000 })
    })

    it('handles empty results', async () => {
      mockStatement.first.mockResolvedValue({ total: 0 })
      mockStatement.all.mockResolvedValue({ results: [] })

      const result = await getAuditLog(mockDb as never, {
        adminId: 'nonexistent',
      })

      expect(result.total).toBe(0)
      expect(result.entries).toEqual([])
    })

    it('combines multiple filters', async () => {
      mockStatement.first.mockResolvedValue({ total: 3 })
      mockStatement.all.mockResolvedValue({ results: [] })

      await getAuditLog(mockDb as never, {
        adminId: 'admin-123',
        action: 'suspend_user',
        targetUserId: 'user-456',
      })

      const prepareCall = mockDb.prepare.mock.calls[0]?.[0] as string | undefined
      expect(prepareCall).toContain('admin_id = ?')
      expect(prepareCall).toContain('action = ?')
      expect(prepareCall).toContain('target_user_id = ?')
    })
  })
})
