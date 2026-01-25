/**
 * Dashboard system alerts tests
 *
 * @module lib/admin/dashboard-alerts.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getSystemAlerts } from './dashboard-alerts'

describe('Dashboard Alerts', () => {
  let mockDb: {
    batch: ReturnType<typeof vi.fn>
    prepare: ReturnType<typeof vi.fn>
  }
  let mockStatement: {
    bind: ReturnType<typeof vi.fn>
    first: ReturnType<typeof vi.fn>
  }

  beforeEach(() => {
    vi.clearAllMocks()

    mockStatement = {
      bind: vi.fn().mockReturnThis(),
      first: vi.fn().mockResolvedValue(null),
    }

    mockDb = {
      batch: vi.fn().mockResolvedValue([]),
      prepare: vi.fn().mockReturnValue(mockStatement),
    }
  })

  describe('getSystemAlerts', () => {
    it('returns empty alerts when no issues detected', async () => {
      mockStatement.first
        .mockResolvedValueOnce({ total: 1000, errors: 10 }) // 1% error rate - below threshold
        .mockResolvedValueOnce({ failed_count: 5 }) // Below 50 threshold
        .mockResolvedValueOnce({ cnt: 0 }) // No users near storage limit

      mockDb.batch.mockResolvedValue([
        { results: [{ current_hour: 100 }] },
        { results: [{ daily_avg: 100 }] }, // Normal traffic
      ])

      const result = await getSystemAlerts(mockDb as unknown as D1Database, {
        limit: 50,
        offset: 0,
      })

      expect(result.items).toHaveLength(0)
    })

    it('generates high error rate warning at 5%', async () => {
      mockStatement.first
        .mockResolvedValueOnce({ total: 1000, errors: 75 }) // 7.5% error rate
        .mockResolvedValueOnce({ failed_count: 0 })
        .mockResolvedValueOnce({ cnt: 0 })

      mockDb.batch.mockResolvedValue([
        { results: [{ current_hour: 100 }] },
        { results: [{ daily_avg: 100 }] },
      ])

      const result = await getSystemAlerts(mockDb as unknown as D1Database, {
        limit: 50,
        offset: 0,
      })

      const errorAlert = result.items.find(a => a.type === 'high_error_rate')
      expect(errorAlert).toBeDefined()
      expect(errorAlert?.severity).toBe('warning')
      expect(errorAlert?.metadata.errorRate).toBe(7.5)
    })

    it('generates high error rate critical at 10%', async () => {
      mockStatement.first
        .mockResolvedValueOnce({ total: 1000, errors: 150 }) // 15% error rate
        .mockResolvedValueOnce({ failed_count: 0 })
        .mockResolvedValueOnce({ cnt: 0 })

      mockDb.batch.mockResolvedValue([
        { results: [{ current_hour: 100 }] },
        { results: [{ daily_avg: 100 }] },
      ])

      const result = await getSystemAlerts(mockDb as unknown as D1Database, {
        limit: 50,
        offset: 0,
      })

      const errorAlert = result.items.find(a => a.type === 'high_error_rate')
      expect(errorAlert).toBeDefined()
      expect(errorAlert?.severity).toBe('critical')
    })

    it('generates webhook failures warning at 50+', async () => {
      mockStatement.first
        .mockResolvedValueOnce({ total: 0, errors: 0 })
        .mockResolvedValueOnce({ failed_count: 75 })
        .mockResolvedValueOnce({ cnt: 0 })

      mockDb.batch.mockResolvedValue([
        { results: [{ current_hour: 100 }] },
        { results: [{ daily_avg: 100 }] },
      ])

      const result = await getSystemAlerts(mockDb as unknown as D1Database, {
        limit: 50,
        offset: 0,
      })

      const webhookAlert = result.items.find(a => a.type === 'webhook_failures_accumulating')
      expect(webhookAlert).toBeDefined()
      expect(webhookAlert?.severity).toBe('warning')
      expect(webhookAlert?.metadata.failedCount).toBe(75)
    })

    it('generates webhook failures critical at 200+', async () => {
      mockStatement.first
        .mockResolvedValueOnce({ total: 0, errors: 0 })
        .mockResolvedValueOnce({ failed_count: 250 })
        .mockResolvedValueOnce({ cnt: 0 })

      mockDb.batch.mockResolvedValue([
        { results: [{ current_hour: 100 }] },
        { results: [{ daily_avg: 100 }] },
      ])

      const result = await getSystemAlerts(mockDb as unknown as D1Database, {
        limit: 50,
        offset: 0,
      })

      const webhookAlert = result.items.find(a => a.type === 'webhook_failures_accumulating')
      expect(webhookAlert?.severity).toBe('critical')
    })

    it('generates storage approaching limit warning', async () => {
      mockStatement.first
        .mockResolvedValueOnce({ total: 0, errors: 0 })
        .mockResolvedValueOnce({ failed_count: 0 })
        .mockResolvedValueOnce({ cnt: 5 }) // 5 users near limit

      mockDb.batch.mockResolvedValue([
        { results: [{ current_hour: 100 }] },
        { results: [{ daily_avg: 100 }] },
      ])

      const result = await getSystemAlerts(mockDb as unknown as D1Database, {
        limit: 50,
        offset: 0,
      })

      const storageAlert = result.items.find(a => a.type === 'storage_approaching_limit')
      expect(storageAlert).toBeDefined()
      expect(storageAlert?.severity).toBe('warning')
      expect(storageAlert?.metadata.usersAffected).toBe(5)
    })

    it('generates traffic spike info at 3x average', async () => {
      mockStatement.first
        .mockResolvedValueOnce({ total: 0, errors: 0 })
        .mockResolvedValueOnce({ failed_count: 0 })
        .mockResolvedValueOnce({ cnt: 0 })

      mockDb.batch.mockResolvedValue([
        { results: [{ current_hour: 400 }] },
        { results: [{ daily_avg: 100 }] }, // 4x average
      ])

      const result = await getSystemAlerts(mockDb as unknown as D1Database, {
        limit: 50,
        offset: 0,
      })

      const trafficAlert = result.items.find(a => a.type === 'unusual_traffic_pattern')
      expect(trafficAlert).toBeDefined()
      expect(trafficAlert?.severity).toBe('info')
    })

    it('generates traffic spike critical at 5x average', async () => {
      mockStatement.first
        .mockResolvedValueOnce({ total: 0, errors: 0 })
        .mockResolvedValueOnce({ failed_count: 0 })
        .mockResolvedValueOnce({ cnt: 0 })

      mockDb.batch.mockResolvedValue([
        { results: [{ current_hour: 600 }] },
        { results: [{ daily_avg: 100 }] }, // 6x average
      ])

      const result = await getSystemAlerts(mockDb as unknown as D1Database, {
        limit: 50,
        offset: 0,
      })

      const trafficAlert = result.items.find(a => a.type === 'unusual_traffic_pattern')
      expect(trafficAlert?.severity).toBe('critical')
    })

    it('does not generate traffic alert when daily avg is 0', async () => {
      mockStatement.first
        .mockResolvedValueOnce({ total: 0, errors: 0 })
        .mockResolvedValueOnce({ failed_count: 0 })
        .mockResolvedValueOnce({ cnt: 0 })

      mockDb.batch.mockResolvedValue([
        { results: [{ current_hour: 100 }] },
        { results: [{ daily_avg: 0 }] },
      ])

      const result = await getSystemAlerts(mockDb as unknown as D1Database, {
        limit: 50,
        offset: 0,
      })

      const trafficAlert = result.items.find(a => a.type === 'unusual_traffic_pattern')
      expect(trafficAlert).toBeUndefined()
    })

    it('filters by severity', async () => {
      mockStatement.first
        .mockResolvedValueOnce({ total: 1000, errors: 150 }) // Critical error rate
        .mockResolvedValueOnce({ failed_count: 75 }) // Warning webhook
        .mockResolvedValueOnce({ cnt: 3 }) // Warning storage

      mockDb.batch.mockResolvedValue([
        { results: [{ current_hour: 400 }] },
        { results: [{ daily_avg: 100 }] }, // Info traffic
      ])

      const result = await getSystemAlerts(mockDb as unknown as D1Database, {
        limit: 50,
        offset: 0,
        severity: 'warning',
      })

      expect(result.items.every(a => a.severity === 'warning')).toBe(true)
    })

    it('filters by resolved status', async () => {
      mockStatement.first
        .mockResolvedValueOnce({ total: 1000, errors: 100 })
        .mockResolvedValueOnce({ failed_count: 0 })
        .mockResolvedValueOnce({ cnt: 0 })

      mockDb.batch.mockResolvedValue([
        { results: [{ current_hour: 100 }] },
        { results: [{ daily_avg: 100 }] },
      ])

      const result = await getSystemAlerts(mockDb as unknown as D1Database, {
        limit: 50,
        offset: 0,
        resolved: false,
      })

      // All generated alerts have resolvedAt: null
      expect(result.items.every(a => a.resolvedAt === null)).toBe(true)
    })

    it('sorts alerts by severity then createdAt', async () => {
      mockStatement.first
        .mockResolvedValueOnce({ total: 1000, errors: 150 }) // Critical
        .mockResolvedValueOnce({ failed_count: 75 }) // Warning
        .mockResolvedValueOnce({ cnt: 5 }) // Warning

      mockDb.batch.mockResolvedValue([
        { results: [{ current_hour: 400 }] },
        { results: [{ daily_avg: 100 }] }, // Info
      ])

      const result = await getSystemAlerts(mockDb as unknown as D1Database, {
        limit: 50,
        offset: 0,
      })

      expect(result.items[0].severity).toBe('critical')
      expect(result.items.slice(1, 3).every(a => a.severity === 'warning')).toBe(true)
      expect(result.items[result.items.length - 1].severity).toBe('info')
    })

    it('applies pagination correctly', async () => {
      mockStatement.first
        .mockResolvedValueOnce({ total: 1000, errors: 150 })
        .mockResolvedValueOnce({ failed_count: 75 })
        .mockResolvedValueOnce({ cnt: 5 })

      mockDb.batch.mockResolvedValue([
        { results: [{ current_hour: 400 }] },
        { results: [{ daily_avg: 100 }] },
      ])

      const result = await getSystemAlerts(mockDb as unknown as D1Database, {
        limit: 2,
        offset: 1,
      })

      expect(result.items).toHaveLength(2)
      expect(result.total).toBe(4) // Total alerts before pagination
    })

    it('handles null query results gracefully', async () => {
      mockStatement.first
        .mockResolvedValueOnce(null) // No telemetry
        .mockResolvedValueOnce(null) // No webhooks
        .mockResolvedValueOnce(null) // No storage data

      mockDb.batch.mockResolvedValue([
        { results: [undefined] },
        { results: [undefined] },
      ])

      const result = await getSystemAlerts(mockDb as unknown as D1Database, {
        limit: 50,
        offset: 0,
      })

      expect(result.items).toHaveLength(0)
    })

    it('includes all required fields in alert objects', async () => {
      mockStatement.first
        .mockResolvedValueOnce({ total: 1000, errors: 100 })
        .mockResolvedValueOnce({ failed_count: 0 })
        .mockResolvedValueOnce({ cnt: 0 })

      mockDb.batch.mockResolvedValue([
        { results: [{ current_hour: 100 }] },
        { results: [{ daily_avg: 100 }] },
      ])

      const result = await getSystemAlerts(mockDb as unknown as D1Database, {
        limit: 50,
        offset: 0,
      })

      if (result.items.length > 0) {
        const alert = result.items[0]
        expect(alert).toHaveProperty('id')
        expect(alert).toHaveProperty('severity')
        expect(alert).toHaveProperty('type')
        expect(alert).toHaveProperty('message')
        expect(alert).toHaveProperty('metadata')
        expect(alert).toHaveProperty('createdAt')
        expect(alert).toHaveProperty('resolvedAt')
      }
    })

    it('generates unique IDs for alerts', async () => {
      mockStatement.first
        .mockResolvedValueOnce({ total: 1000, errors: 100 })
        .mockResolvedValueOnce({ failed_count: 100 })
        .mockResolvedValueOnce({ cnt: 5 })

      mockDb.batch.mockResolvedValue([
        { results: [{ current_hour: 400 }] },
        { results: [{ daily_avg: 100 }] },
      ])

      const result = await getSystemAlerts(mockDb as unknown as D1Database, {
        limit: 50,
        offset: 0,
      })

      const ids = result.items.map(a => a.id)
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(ids.length)
    })

    it('does not generate error rate alert when total events is 0', async () => {
      mockStatement.first
        .mockResolvedValueOnce({ total: 0, errors: 0 })
        .mockResolvedValueOnce({ failed_count: 0 })
        .mockResolvedValueOnce({ cnt: 0 })

      mockDb.batch.mockResolvedValue([
        { results: [{ current_hour: 0 }] },
        { results: [{ daily_avg: 0 }] },
      ])

      const result = await getSystemAlerts(mockDb as unknown as D1Database, {
        limit: 50,
        offset: 0,
      })

      const errorAlert = result.items.find(a => a.type === 'high_error_rate')
      expect(errorAlert).toBeUndefined()
    })
  })
})
