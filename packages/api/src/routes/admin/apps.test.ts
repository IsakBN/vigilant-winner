/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/**
 * Admin app management route tests
 *
 * @agent wave5-admin
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Hono } from 'hono'
import { adminAppsRouter } from './apps'

// Mock audit logging
vi.mock('../../lib/admin/audit', () => ({
  logAdminAction: vi.fn().mockResolvedValue('audit-id'),
}))

// Mock admin middleware helper
vi.mock('../../middleware/admin', () => ({
  getAdminId: vi.fn().mockReturnValue('admin-123'),
}))

describe('Admin App Management Routes', () => {
  let app: Hono
  let mockDb: { prepare: ReturnType<typeof vi.fn>; batch: ReturnType<typeof vi.fn> }
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
      all: vi.fn().mockResolvedValue({ results: [] }),
    }
    mockDb = {
      prepare: vi.fn().mockReturnValue(mockStatement),
      batch: vi.fn().mockResolvedValue([]),
    }

    app = new Hono()
    app.use('*', async (c, next) => {
      c.env = { DB: mockDb } as unknown
      await next()
    })
    app.route('/admin/apps', adminAppsRouter)
  })

  describe('GET /admin/apps', () => {
    it('returns paginated app list', async () => {
      mockStatement.first.mockResolvedValue({ total: 50 })
      mockStatement.all.mockResolvedValue({
        results: [
          {
            id: 'app-1',
            name: 'Test App',
            bundle_id: 'com.test.app',
            platform: 'ios',
            owner_id: 'user-1',
            created_at: 1706200000000,
            owner_email: 'user@test.com',
            owner_name: 'Test User',
            release_count: 10,
            device_count: 100,
          },
        ],
      })

      const res = await app.request('/admin/apps?limit=20&offset=0')

      expect(res.status).toBe(200)
       
      const data = await res.json()
      expect(data.apps).toHaveLength(1)
      expect(data.apps[0]?.name).toBe('Test App')
      expect(data.pagination.total).toBe(50)
    })

    it('filters by search query', async () => {
      mockStatement.first.mockResolvedValue({ total: 1 })
      mockStatement.all.mockResolvedValue({ results: [] })

      const res = await app.request('/admin/apps?search=MyApp')

      expect(res.status).toBe(200)
    })

    it('filters by owner ID', async () => {
      mockStatement.first.mockResolvedValue({ total: 5 })
      mockStatement.all.mockResolvedValue({ results: [] })

      const res = await app.request('/admin/apps?ownerId=550e8400-e29b-41d4-a716-446655440000')

      expect(res.status).toBe(200)
    })

    it('filters by platform', async () => {
      mockStatement.first.mockResolvedValue({ total: 10 })
      mockStatement.all.mockResolvedValue({ results: [] })

      const res = await app.request('/admin/apps?platform=ios')

      expect(res.status).toBe(200)
    })
  })

  describe('GET /admin/apps/:appId', () => {
    it('returns app details', async () => {
      mockStatement.first
        .mockResolvedValueOnce({
          id: 'app-1',
          name: 'Test App',
          bundle_id: 'com.test.app',
          platform: 'ios',
          owner_id: 'user-1',
          api_key: 'bn_1234567890abcdef',
          webhook_secret: 'whsec_secret',
          settings: null,
          created_at: 1706200000000,
          updated_at: 1706200000000,
          owner_email: 'user@test.com',
          owner_name: 'Test User',
          owner_plan: 'pro',
        })
        .mockResolvedValueOnce({ cnt: 10 })
        .mockResolvedValueOnce({ cnt: 100 })
        .mockResolvedValueOnce({ cnt: 3 })
      mockStatement.all.mockResolvedValue({ results: [] })

      const res = await app.request('/admin/apps/550e8400-e29b-41d4-a716-446655440000')

      expect(res.status).toBe(200)
       
      const data = await res.json()
      expect(data.app.name).toBe('Test App')
      expect(data.owner.email).toBe('user@test.com')
      expect(data.stats.releases).toBe(10)
    })

    it('returns 404 for non-existent app', async () => {
      mockStatement.first.mockResolvedValue(null)

      const res = await app.request('/admin/apps/550e8400-e29b-41d4-a716-446655440000')

      expect(res.status).toBe(404)
    })

    it('validates UUID format', async () => {
      const res = await app.request('/admin/apps/invalid-id')

      expect(res.status).toBe(400)
    })
  })

  describe('POST /admin/apps/:appId/disable', () => {
    it('disables an app', async () => {
      mockStatement.first.mockResolvedValue({
        id: 'app-1',
        name: 'Test App',
        owner_id: 'user-1',
      })

      const res = await app.request('/admin/apps/550e8400-e29b-41d4-a716-446655440000/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Policy violation detected' }),
      })

      expect(res.status).toBe(200)
      const data = (await res.json())
      expect(data.message).toContain('disabled')
    })

    it('returns 404 for non-existent app', async () => {
      mockStatement.first.mockResolvedValue(null)

      const res = await app.request('/admin/apps/550e8400-e29b-41d4-a716-446655440000/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Policy violation detected' }),
      })

      expect(res.status).toBe(404)
    })

    it('requires reason with minimum length', async () => {
      const res = await app.request('/admin/apps/550e8400-e29b-41d4-a716-446655440000/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'short' }),
      })

      expect(res.status).toBe(400)
    })
  })

  describe('DELETE /admin/apps/:appId/disable', () => {
    it('re-enables an app', async () => {
      mockStatement.first.mockResolvedValue({
        id: 'app-1',
        name: 'Test App',
        owner_id: 'user-1',
      })

      const res = await app.request('/admin/apps/550e8400-e29b-41d4-a716-446655440000/disable', {
        method: 'DELETE',
      })

      expect(res.status).toBe(200)
      const data = (await res.json())
      expect(data.message).toContain('enabled')
    })

    it('returns 404 for non-existent app', async () => {
      mockStatement.first.mockResolvedValue(null)

      const res = await app.request('/admin/apps/550e8400-e29b-41d4-a716-446655440000/disable', {
        method: 'DELETE',
      })

      expect(res.status).toBe(404)
    })
  })

  describe('DELETE /admin/apps/:appId', () => {
    it('deletes app with confirmation', async () => {
      mockStatement.first
        .mockResolvedValueOnce({ id: 'app-1', name: 'Test App', owner_id: 'user-1' })
        .mockResolvedValueOnce({ cnt: 10 }) // releases
        .mockResolvedValueOnce({ cnt: 100 }) // devices
        .mockResolvedValueOnce({ cnt: 3 }) // channels

      const res = await app.request('/admin/apps/550e8400-e29b-41d4-a716-446655440000', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          confirmName: 'Test App',
          reason: 'Requested by owner for account closure',
        }),
      })

      expect(res.status).toBe(200)
      const data = (await res.json())
      expect(data.message).toContain('deleted')
      expect(mockDb.batch).toHaveBeenCalled()
    })

    it('rejects mismatched confirmation name', async () => {
      mockStatement.first.mockResolvedValue({
        id: 'app-1',
        name: 'Test App',
        owner_id: 'user-1',
      })

      const res = await app.request('/admin/apps/550e8400-e29b-41d4-a716-446655440000', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          confirmName: 'Wrong Name',
          reason: 'Test deletion',
        }),
      })

      expect(res.status).toBe(400)
      const data = (await res.json())
      expect(data.expected).toBe('Test App')
    })

    it('returns 404 for non-existent app', async () => {
      mockStatement.first.mockResolvedValue(null)

      const res = await app.request('/admin/apps/550e8400-e29b-41d4-a716-446655440000', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          confirmName: 'Test App',
          reason: 'Test deletion',
        }),
      })

      expect(res.status).toBe(404)
    })

    it('requires reason with minimum length', async () => {
      const res = await app.request('/admin/apps/550e8400-e29b-41d4-a716-446655440000', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          confirmName: 'Test App',
          reason: 'short',
        }),
      })

      expect(res.status).toBe(400)
    })
  })
})
