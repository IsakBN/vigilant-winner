/**
 * Dashboard activity feed tests
 *
 * @module lib/admin/dashboard-activity.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getActivityFeed } from './dashboard-activity'

describe('Dashboard Activity', () => {
  let mockDb: {
    prepare: ReturnType<typeof vi.fn>
  }
  let mockStatement: {
    bind: ReturnType<typeof vi.fn>
    first: ReturnType<typeof vi.fn>
    all: ReturnType<typeof vi.fn>
  }

  beforeEach(() => {
    vi.clearAllMocks()

    mockStatement = {
      bind: vi.fn().mockReturnThis(),
      first: vi.fn().mockResolvedValue({ total: 0 }),
      all: vi.fn().mockResolvedValue({ results: [] }),
    }

    mockDb = {
      prepare: vi.fn().mockReturnValue(mockStatement),
    }
  })

  describe('getActivityFeed', () => {
    it('returns empty feed for empty database', async () => {
      mockStatement.first.mockResolvedValue({ total: 0 })
      mockStatement.all.mockResolvedValue({ results: [] })

      const result = await getActivityFeed(mockDb as unknown as D1Database, {
        limit: 50,
        offset: 0,
      })

      expect(result.items).toHaveLength(0)
      expect(result.total).toBe(0)
    })

    it('fetches and combines multiple activity sources', async () => {
      mockStatement.first.mockResolvedValue({ total: 4 })
      mockStatement.all
        .mockResolvedValueOnce({
          results: [
            { id: 'user-1', email: 'user@test.com', name: 'Test', created_at: 1000 },
          ],
        })
        .mockResolvedValueOnce({
          results: [
            { id: 'app-1', name: 'App', platform: 'ios', owner_id: 'user-1', created_at: 900, email: 'user@test.com' },
          ],
        })
        .mockResolvedValueOnce({
          results: [
            { id: 'rel-1', version: '1.0.0', app_id: 'app-1', created_at: 800, app_name: 'App', owner_id: 'user-1', email: 'user@test.com' },
          ],
        })
        .mockResolvedValueOnce({
          results: [
            { id: 'sub-1', user_id: 'user-1', status: 'active', created_at: 700, updated_at: 700, email: 'user@test.com', plan_name: 'pro' },
          ],
        })

      const result = await getActivityFeed(mockDb as unknown as D1Database, {
        limit: 50,
        offset: 0,
      })

      expect(result.items).toHaveLength(4)
      expect(result.items[0].type).toBe('user_signup')
      expect(result.items[1].type).toBe('app_created')
      expect(result.items[2].type).toBe('release_published')
      expect(result.items[3].type).toBe('subscription_started')
    })

    it('sorts activities by createdAt descending', async () => {
      mockStatement.first.mockResolvedValue({ total: 3 })
      mockStatement.all
        .mockResolvedValueOnce({
          results: [
            { id: 'user-1', email: 'a@b.com', name: null, created_at: 100 },
          ],
        })
        .mockResolvedValueOnce({
          results: [
            { id: 'app-1', name: 'App', platform: 'ios', owner_id: 'user-1', created_at: 300, email: 'a@b.com' },
          ],
        })
        .mockResolvedValueOnce({
          results: [
            { id: 'rel-1', version: '1.0', app_id: 'app-1', created_at: 200, app_name: 'App', owner_id: 'user-1', email: 'a@b.com' },
          ],
        })
        .mockResolvedValueOnce({
          results: [],
        })

      const result = await getActivityFeed(mockDb as unknown as D1Database, {
        limit: 50,
        offset: 0,
      })

      expect(result.items[0].createdAt).toBe(300)
      expect(result.items[1].createdAt).toBe(200)
      expect(result.items[2].createdAt).toBe(100)
    })

    it('filters by activity type', async () => {
      mockStatement.first.mockResolvedValue({ total: 3 })
      mockStatement.all
        .mockResolvedValueOnce({
          results: [
            { id: 'user-1', email: 'a@b.com', name: null, created_at: 100 },
            { id: 'user-2', email: 'c@d.com', name: null, created_at: 200 },
          ],
        })
        .mockResolvedValueOnce({
          results: [
            { id: 'app-1', name: 'App', platform: 'ios', owner_id: 'user-1', created_at: 150, email: 'a@b.com' },
          ],
        })
        .mockResolvedValueOnce({ results: [] })
        .mockResolvedValueOnce({ results: [] })

      const result = await getActivityFeed(mockDb as unknown as D1Database, {
        limit: 50,
        offset: 0,
        type: 'user_signup',
      })

      expect(result.items).toHaveLength(2)
      expect(result.items.every(i => i.type === 'user_signup')).toBe(true)
    })

    it('applies pagination correctly', async () => {
      mockStatement.first.mockResolvedValue({ total: 10 })
      const manyUsers = Array.from({ length: 10 }, (_, i) => ({
        id: `user-${String(i)}`,
        email: `user${String(i)}@test.com`,
        name: null,
        created_at: 1000 - i * 10,
      }))
      mockStatement.all
        .mockResolvedValueOnce({ results: manyUsers })
        .mockResolvedValueOnce({ results: [] })
        .mockResolvedValueOnce({ results: [] })
        .mockResolvedValueOnce({ results: [] })

      const result = await getActivityFeed(mockDb as unknown as D1Database, {
        limit: 3,
        offset: 2,
      })

      expect(result.items).toHaveLength(3)
      expect(result.items[0].id).toBe('signup_user-2')
    })

    it('handles cancelled subscriptions correctly', async () => {
      mockStatement.first.mockResolvedValue({ total: 2 })
      mockStatement.all
        .mockResolvedValueOnce({ results: [] })
        .mockResolvedValueOnce({ results: [] })
        .mockResolvedValueOnce({ results: [] })
        .mockResolvedValueOnce({
          results: [
            { id: 'sub-1', user_id: 'user-1', status: 'cancelled', created_at: 100, updated_at: 200, email: 'a@b.com', plan_name: 'pro' },
            { id: 'sub-2', user_id: 'user-2', status: 'active', created_at: 150, updated_at: 150, email: 'c@d.com', plan_name: 'team' },
          ],
        })

      const result = await getActivityFeed(mockDb as unknown as D1Database, {
        limit: 50,
        offset: 0,
      })

      const cancelled = result.items.find(i => i.type === 'subscription_cancelled')
      const started = result.items.find(i => i.type === 'subscription_started')

      expect(cancelled).toBeDefined()
      expect(cancelled?.createdAt).toBe(200) // Uses updated_at for cancelled
      expect(started).toBeDefined()
      expect(started?.createdAt).toBe(150) // Uses created_at for active
    })

    it('handles missing email gracefully', async () => {
      mockStatement.first.mockResolvedValue({ total: 1 })
      mockStatement.all
        .mockResolvedValueOnce({ results: [] })
        .mockResolvedValueOnce({
          results: [
            { id: 'app-1', name: 'App', platform: 'android', owner_id: 'user-1', created_at: 100, email: null },
          ],
        })
        .mockResolvedValueOnce({ results: [] })
        .mockResolvedValueOnce({ results: [] })

      const result = await getActivityFeed(mockDb as unknown as D1Database, {
        limit: 50,
        offset: 0,
      })

      expect(result.items[0].userEmail).toBe('unknown')
    })

    it('includes correct metadata for each activity type', async () => {
      mockStatement.first.mockResolvedValue({ total: 4 })
      mockStatement.all
        .mockResolvedValueOnce({
          results: [{ id: 'user-1', email: 'a@b.com', name: 'John', created_at: 400 }],
        })
        .mockResolvedValueOnce({
          results: [{ id: 'app-1', name: 'MyApp', platform: 'ios', owner_id: 'user-1', created_at: 300, email: 'a@b.com' }],
        })
        .mockResolvedValueOnce({
          results: [{ id: 'rel-1', version: '2.0.0', app_id: 'app-1', created_at: 200, app_name: 'MyApp', owner_id: 'user-1', email: 'a@b.com' }],
        })
        .mockResolvedValueOnce({
          results: [{ id: 'sub-1', user_id: 'user-1', status: 'active', created_at: 100, updated_at: 100, email: 'a@b.com', plan_name: 'pro' }],
        })

      const result = await getActivityFeed(mockDb as unknown as D1Database, {
        limit: 50,
        offset: 0,
      })

      // User signup metadata
      const signup = result.items.find(i => i.type === 'user_signup')
      expect(signup?.metadata).toEqual({ name: 'John' })

      // App created metadata
      const appCreated = result.items.find(i => i.type === 'app_created')
      expect(appCreated?.metadata).toEqual({ appId: 'app-1', appName: 'MyApp', platform: 'ios' })

      // Release published metadata
      const release = result.items.find(i => i.type === 'release_published')
      expect(release?.metadata).toEqual({ releaseId: 'rel-1', version: '2.0.0', appName: 'MyApp' })

      // Subscription started metadata
      const sub = result.items.find(i => i.type === 'subscription_started')
      expect(sub?.metadata).toEqual({ subscriptionId: 'sub-1', plan: 'pro' })
    })

    it('generates unique IDs for each activity', async () => {
      mockStatement.first.mockResolvedValue({ total: 2 })
      mockStatement.all
        .mockResolvedValueOnce({
          results: [
            { id: 'user-1', email: 'a@b.com', name: null, created_at: 100 },
          ],
        })
        .mockResolvedValueOnce({ results: [] })
        .mockResolvedValueOnce({ results: [] })
        .mockResolvedValueOnce({
          results: [
            { id: 'sub-1', user_id: 'user-1', status: 'active', created_at: 100, updated_at: 100, email: 'a@b.com', plan_name: 'pro' },
          ],
        })

      const result = await getActivityFeed(mockDb as unknown as D1Database, {
        limit: 50,
        offset: 0,
      })

      const ids = result.items.map(i => i.id)
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(ids.length)
    })
  })
})
