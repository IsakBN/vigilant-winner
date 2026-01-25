/**
 * Dashboard metrics calculation tests
 *
 * @module lib/admin/dashboard-metrics.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { calculateOverviewMetrics } from './dashboard-metrics'

describe('Dashboard Metrics', () => {
  let mockDb: {
    batch: ReturnType<typeof vi.fn>
    prepare: ReturnType<typeof vi.fn>
  }

  beforeEach(() => {
    vi.clearAllMocks()

    mockDb = {
      batch: vi.fn(),
      prepare: vi.fn().mockReturnValue({
        bind: vi.fn().mockReturnThis(),
        first: vi.fn(),
        all: vi.fn(),
      }),
    }
  })

  describe('calculateOverviewMetrics', () => {
    it('calculates all metric categories', async () => {
      // Mock batch responses for all parallel queries
      mockDb.batch.mockResolvedValue([
        // User metrics batch
        { results: [{ cnt: 1000 }] },
        { results: [{ cnt: 800 }] },
        { results: [{ cnt: 10 }] },
        { results: [{ cnt: 50 }] },
        { results: [{ cnt: 200 }] },
      ])

      // Second batch call for app metrics
      mockDb.batch
        .mockResolvedValueOnce([
          { results: [{ cnt: 1000 }] },
          { results: [{ cnt: 800 }] },
          { results: [{ cnt: 10 }] },
          { results: [{ cnt: 50 }] },
          { results: [{ cnt: 200 }] },
        ])
        .mockResolvedValueOnce([
          { results: [{ cnt: 500 }] },
          { results: [{ cnt: 400 }] },
          { results: [{ cnt: 20 }] },
        ])
        .mockResolvedValueOnce([
          { results: [{ cnt: 10000 }] },
          { results: [{ cnt: 8000 }] },
          { results: [{ platform: 'ios', cnt: 6000 }, { platform: 'android', cnt: 4000 }] },
        ])
        .mockResolvedValueOnce([
          { results: [{ cnt: 2000 }] },
          { results: [{ cnt: 100 }] },
          { results: [{ avg: 5000000 }] },
        ])
        .mockResolvedValueOnce([
          { results: [{ name: 'free', cnt: 300 }, { name: 'pro', cnt: 150 }, { name: 'team', cnt: 50 }] },
          { results: [{ mrr: 150000 }] },
          { results: [{ cnt: 10 }] },
          { results: [{ cnt: 400 }] },
        ])

      const result = await calculateOverviewMetrics(mockDb as unknown as D1Database)

      expect(result).toHaveProperty('users')
      expect(result).toHaveProperty('apps')
      expect(result).toHaveProperty('devices')
      expect(result).toHaveProperty('releases')
      expect(result).toHaveProperty('subscriptions')
    })

    it('handles empty database gracefully', async () => {
      mockDb.batch
        .mockResolvedValueOnce([
          { results: [{ cnt: 0 }] },
          { results: [{ cnt: 0 }] },
          { results: [{ cnt: 0 }] },
          { results: [{ cnt: 0 }] },
          { results: [{ cnt: 0 }] },
        ])
        .mockResolvedValueOnce([
          { results: [{ cnt: 0 }] },
          { results: [{ cnt: 0 }] },
          { results: [{ cnt: 0 }] },
        ])
        .mockResolvedValueOnce([
          { results: [{ cnt: 0 }] },
          { results: [{ cnt: 0 }] },
          { results: [] },
        ])
        .mockResolvedValueOnce([
          { results: [{ cnt: 0 }] },
          { results: [{ cnt: 0 }] },
          { results: [{ avg: null }] },
        ])
        .mockResolvedValueOnce([
          { results: [] },
          { results: [{ mrr: null }] },
          { results: [{ cnt: 0 }] },
          { results: [{ cnt: 0 }] },
        ])

      const result = await calculateOverviewMetrics(mockDb as unknown as D1Database)

      expect(result.users.total).toBe(0)
      expect(result.apps.total).toBe(0)
      expect(result.devices.total).toBe(0)
      expect(result.devices.byPlatform.ios).toBe(0)
      expect(result.devices.byPlatform.android).toBe(0)
      expect(result.releases.total).toBe(0)
      expect(result.releases.avgBundleSize).toBe(0)
      expect(result.subscriptions.mrr).toBe(0)
      expect(result.subscriptions.churnRate).toBe(0)
    })

    it('calculates churn rate correctly', async () => {
      mockDb.batch
        .mockResolvedValueOnce([
          { results: [{ cnt: 100 }] },
          { results: [{ cnt: 80 }] },
          { results: [{ cnt: 5 }] },
          { results: [{ cnt: 20 }] },
          { results: [{ cnt: 50 }] },
        ])
        .mockResolvedValueOnce([
          { results: [{ cnt: 50 }] },
          { results: [{ cnt: 40 }] },
          { results: [{ cnt: 5 }] },
        ])
        .mockResolvedValueOnce([
          { results: [{ cnt: 500 }] },
          { results: [{ cnt: 400 }] },
          { results: [{ platform: 'ios', cnt: 300 }, { platform: 'android', cnt: 200 }] },
        ])
        .mockResolvedValueOnce([
          { results: [{ cnt: 100 }] },
          { results: [{ cnt: 10 }] },
          { results: [{ avg: 3000000 }] },
        ])
        .mockResolvedValueOnce([
          { results: [{ name: 'free', cnt: 50 }, { name: 'pro', cnt: 30 }] },
          { results: [{ mrr: 30000 }] },
          { results: [{ cnt: 5 }] }, // 5 cancelled
          { results: [{ cnt: 100 }] }, // 100 total in window
        ])

      const result = await calculateOverviewMetrics(mockDb as unknown as D1Database)

      // Churn rate = (cancelled / total) * 100 = (5 / 100) * 100 = 5%
      expect(result.subscriptions.churnRate).toBe(5)
    })

    it('handles null values in aggregations', async () => {
      mockDb.batch
        .mockResolvedValueOnce([
          { results: [{ cnt: 10 }] },
          { results: [undefined] },
          { results: [null] },
          { results: [{ cnt: 2 }] },
          { results: [{ cnt: 5 }] },
        ])
        .mockResolvedValueOnce([
          { results: [{ cnt: 5 }] },
          { results: [undefined] },
          { results: [{ cnt: 1 }] },
        ])
        .mockResolvedValueOnce([
          { results: [{ cnt: 50 }] },
          { results: [{ cnt: 40 }] },
          { results: [] },
        ])
        .mockResolvedValueOnce([
          { results: [{ cnt: 20 }] },
          { results: [{ cnt: 5 }] },
          { results: [{ avg: null }] },
        ])
        .mockResolvedValueOnce([
          { results: [{ name: null, cnt: 10 }] },
          { results: [{ mrr: null }] },
          { results: [{ cnt: 0 }] },
          { results: [{ cnt: 0 }] },
        ])

      const result = await calculateOverviewMetrics(mockDb as unknown as D1Database)

      expect(result.users.active).toBe(0)
      expect(result.users.newToday).toBe(0)
      expect(result.apps.active).toBe(0)
      expect(result.releases.avgBundleSize).toBe(0)
      expect(result.subscriptions.mrr).toBe(0)
    })

    it('rounds average bundle size', async () => {
      mockDb.batch
        .mockResolvedValueOnce([
          { results: [{ cnt: 100 }] },
          { results: [{ cnt: 80 }] },
          { results: [{ cnt: 5 }] },
          { results: [{ cnt: 20 }] },
          { results: [{ cnt: 50 }] },
        ])
        .mockResolvedValueOnce([
          { results: [{ cnt: 50 }] },
          { results: [{ cnt: 40 }] },
          { results: [{ cnt: 5 }] },
        ])
        .mockResolvedValueOnce([
          { results: [{ cnt: 500 }] },
          { results: [{ cnt: 400 }] },
          { results: [] },
        ])
        .mockResolvedValueOnce([
          { results: [{ cnt: 100 }] },
          { results: [{ cnt: 10 }] },
          { results: [{ avg: 3456789.123 }] },
        ])
        .mockResolvedValueOnce([
          { results: [] },
          { results: [{ mrr: 0 }] },
          { results: [{ cnt: 0 }] },
          { results: [{ cnt: 0 }] },
        ])

      const result = await calculateOverviewMetrics(mockDb as unknown as D1Database)

      expect(result.releases.avgBundleSize).toBe(3456789)
    })

    it('rounds churn rate to 2 decimal places', async () => {
      mockDb.batch
        .mockResolvedValueOnce([
          { results: [{ cnt: 100 }] },
          { results: [{ cnt: 80 }] },
          { results: [{ cnt: 5 }] },
          { results: [{ cnt: 20 }] },
          { results: [{ cnt: 50 }] },
        ])
        .mockResolvedValueOnce([
          { results: [{ cnt: 50 }] },
          { results: [{ cnt: 40 }] },
          { results: [{ cnt: 5 }] },
        ])
        .mockResolvedValueOnce([
          { results: [{ cnt: 500 }] },
          { results: [{ cnt: 400 }] },
          { results: [] },
        ])
        .mockResolvedValueOnce([
          { results: [{ cnt: 100 }] },
          { results: [{ cnt: 10 }] },
          { results: [{ avg: 3000000 }] },
        ])
        .mockResolvedValueOnce([
          { results: [] },
          { results: [{ mrr: 0 }] },
          { results: [{ cnt: 7 }] }, // 7 cancelled
          { results: [{ cnt: 300 }] }, // 300 total
        ])

      const result = await calculateOverviewMetrics(mockDb as unknown as D1Database)

      // 7 / 300 * 100 = 2.333... should round to 2.33
      expect(result.subscriptions.churnRate).toBe(2.33)
    })
  })
})
