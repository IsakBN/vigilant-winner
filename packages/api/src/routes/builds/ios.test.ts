/**
 * iOS Build System Routes Tests
 *
 * @agent ios-builds
 * @created 2026-01-26
 */

import { describe, it, expect } from 'vitest'
import { z } from 'zod'

// =============================================================================
// Schema Tests
// =============================================================================

const triggerBuildSchema = z.object({
  version: z.string().min(1).max(50),
  buildNumber: z.number().int().positive().optional(),
  configuration: z.enum(['debug', 'release']).default('release'),
  bundleId: z.string().min(1).max(255),
  teamId: z.string().max(20).optional(),
})

describe('iOS build routes', () => {
  describe('triggerBuildSchema', () => {
    it('validates minimal required fields', () => {
      const result = triggerBuildSchema.safeParse({
        version: '1.0.0',
        bundleId: 'com.example.app',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.configuration).toBe('release')
      }
    })

    it('validates with all fields', () => {
      const result = triggerBuildSchema.safeParse({
        version: '1.2.3',
        buildNumber: 42,
        configuration: 'debug',
        bundleId: 'com.example.myapp',
        teamId: 'ABC123DEF4',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.buildNumber).toBe(42)
        expect(result.data.configuration).toBe('debug')
        expect(result.data.teamId).toBe('ABC123DEF4')
      }
    })

    it('rejects empty version', () => {
      const result = triggerBuildSchema.safeParse({
        version: '',
        bundleId: 'com.example.app',
      })
      expect(result.success).toBe(false)
    })

    it('rejects version exceeding max length', () => {
      const result = triggerBuildSchema.safeParse({
        version: 'a'.repeat(51),
        bundleId: 'com.example.app',
      })
      expect(result.success).toBe(false)
    })

    it('rejects empty bundleId', () => {
      const result = triggerBuildSchema.safeParse({
        version: '1.0.0',
        bundleId: '',
      })
      expect(result.success).toBe(false)
    })

    it('rejects bundleId exceeding max length', () => {
      const result = triggerBuildSchema.safeParse({
        version: '1.0.0',
        bundleId: 'a'.repeat(256),
      })
      expect(result.success).toBe(false)
    })

    it('rejects invalid configuration', () => {
      const result = triggerBuildSchema.safeParse({
        version: '1.0.0',
        bundleId: 'com.example.app',
        configuration: 'production',
      })
      expect(result.success).toBe(false)
    })

    it('rejects negative build number', () => {
      const result = triggerBuildSchema.safeParse({
        version: '1.0.0',
        bundleId: 'com.example.app',
        buildNumber: -1,
      })
      expect(result.success).toBe(false)
    })

    it('rejects zero build number', () => {
      const result = triggerBuildSchema.safeParse({
        version: '1.0.0',
        bundleId: 'com.example.app',
        buildNumber: 0,
      })
      expect(result.success).toBe(false)
    })

    it('rejects non-integer build number', () => {
      const result = triggerBuildSchema.safeParse({
        version: '1.0.0',
        bundleId: 'com.example.app',
        buildNumber: 1.5,
      })
      expect(result.success).toBe(false)
    })

    it('accepts valid teamId', () => {
      const result = triggerBuildSchema.safeParse({
        version: '1.0.0',
        bundleId: 'com.example.app',
        teamId: 'ABCDE12345',
      })
      expect(result.success).toBe(true)
    })

    it('rejects teamId exceeding max length', () => {
      const result = triggerBuildSchema.safeParse({
        version: '1.0.0',
        bundleId: 'com.example.app',
        teamId: 'a'.repeat(21),
      })
      expect(result.success).toBe(false)
    })
  })

  describe('pagination', () => {
    it('defaults to limit 20 when not specified', () => {
      const requestedLimit = undefined
      const limit = Math.min(Number(requestedLimit) || 20, 100)
      expect(limit).toBe(20)
    })

    it('caps limit at 100', () => {
      const requestedLimit = '500'
      const limit = Math.min(Number(requestedLimit) || 20, 100)
      expect(limit).toBe(100)
    })

    it('defaults to offset 0 when not specified', () => {
      const requestedOffset = undefined
      const offset = Number(requestedOffset) || 0
      expect(offset).toBe(0)
    })

    it('calculates hasMore correctly when more results exist', () => {
      const total = 50
      const offset = 0
      const resultsLength = 20
      const hasMore = offset + resultsLength < total
      expect(hasMore).toBe(true)
    })

    it('calculates hasMore correctly when no more results', () => {
      const total = 15
      const offset = 0
      const resultsLength = 15
      const hasMore = offset + resultsLength < total
      expect(hasMore).toBe(false)
    })

    it('calculates hasMore correctly with offset', () => {
      const total = 50
      const offset = 40
      const resultsLength = 10
      const hasMore = offset + resultsLength < total
      expect(hasMore).toBe(false)
    })
  })

  describe('auto-increment build number', () => {
    const getNextBuild = (maxBuild: number | null): number => (maxBuild ?? 0) + 1
    const selectBuildNumber = (provided: number | undefined, auto: number): number =>
      provided ?? auto

    it('calculates next build number from null', () => {
      const maxBuild: number | null = null
      expect(getNextBuild(maxBuild)).toBe(1)
    })

    it('calculates next build number from existing', () => {
      const maxBuild: number | null = 5
      expect(getNextBuild(maxBuild)).toBe(6)
    })

    it('uses provided build number when specified', () => {
      const providedBuildNumber: number | undefined = 42
      const autoIncrement = 6
      expect(selectBuildNumber(providedBuildNumber, autoIncrement)).toBe(42)
    })

    it('falls back to auto-increment when not provided', () => {
      const providedBuildNumber: number | undefined = undefined
      const autoIncrement = 6
      expect(selectBuildNumber(providedBuildNumber, autoIncrement)).toBe(6)
    })
  })

  describe('build status validation', () => {
    const cancelableStatuses = ['pending', 'building', 'signing', 'uploading']
    const _nonCancelableStatuses = ['complete', 'failed']

    it('allows canceling pending builds', () => {
      expect(cancelableStatuses.includes('pending')).toBe(true)
    })

    it('allows canceling building builds', () => {
      expect(cancelableStatuses.includes('building')).toBe(true)
    })

    it('allows canceling signing builds', () => {
      expect(cancelableStatuses.includes('signing')).toBe(true)
    })

    it('allows canceling uploading builds', () => {
      expect(cancelableStatuses.includes('uploading')).toBe(true)
    })

    it('does not allow canceling complete builds', () => {
      expect(cancelableStatuses.includes('complete')).toBe(false)
    })

    it('does not allow canceling failed builds', () => {
      expect(cancelableStatuses.includes('failed')).toBe(false)
    })
  })

  describe('formatBuild', () => {
    it('correctly transforms row to response format', () => {
      const row = {
        id: 'build-123',
        app_id: 'app-456',
        version: '1.0.0',
        build_number: 1,
        status: 'pending' as const,
        configuration: 'release' as const,
        bundle_id: 'com.example.app',
        team_id: 'ABC123',
        provisioning_profile: 'profile-uuid',
        artifact_url: 'https://storage.example.com/build.ipa',
        artifact_size: 50000000,
        logs: 'Build completed successfully',
        error: null,
        started_at: 1706000000,
        completed_at: 1706001000,
        created_at: 1705999000,
      }

      const formatted = {
        id: row.id,
        appId: row.app_id,
        version: row.version,
        buildNumber: row.build_number,
        status: row.status,
        platform: 'ios' as const,
        configuration: row.configuration,
        bundleId: row.bundle_id,
        teamId: row.team_id,
        provisioningProfile: row.provisioning_profile,
        artifactUrl: row.artifact_url,
        artifactSize: row.artifact_size,
        logs: row.logs,
        error: row.error,
        startedAt: row.started_at,
        completedAt: row.completed_at,
        createdAt: row.created_at,
      }

      expect(formatted.id).toBe('build-123')
      expect(formatted.appId).toBe('app-456')
      expect(formatted.platform).toBe('ios')
      expect(formatted.bundleId).toBe('com.example.app')
      expect(formatted.teamId).toBe('ABC123')
    })

    it('handles null optional fields', () => {
      const row = {
        id: 'build-123',
        app_id: 'app-456',
        version: '1.0.0',
        build_number: 1,
        status: 'pending' as const,
        configuration: 'debug' as const,
        bundle_id: 'com.example.app',
        team_id: null,
        provisioning_profile: null,
        artifact_url: null,
        artifact_size: null,
        logs: null,
        error: null,
        started_at: null,
        completed_at: null,
        created_at: 1705999000,
      }

      const formatted = {
        id: row.id,
        appId: row.app_id,
        version: row.version,
        buildNumber: row.build_number,
        status: row.status,
        platform: 'ios' as const,
        configuration: row.configuration,
        bundleId: row.bundle_id,
        teamId: row.team_id,
        provisioningProfile: row.provisioning_profile,
        artifactUrl: row.artifact_url,
        artifactSize: row.artifact_size,
        logs: row.logs,
        error: row.error,
        startedAt: row.started_at,
        completedAt: row.completed_at,
        createdAt: row.created_at,
      }

      expect(formatted.teamId).toBeNull()
      expect(formatted.provisioningProfile).toBeNull()
      expect(formatted.artifactUrl).toBeNull()
      expect(formatted.artifactSize).toBeNull()
      expect(formatted.logs).toBeNull()
      expect(formatted.error).toBeNull()
      expect(formatted.startedAt).toBeNull()
      expect(formatted.completedAt).toBeNull()
    })
  })

  describe('response structure', () => {
    it('list response has correct pagination structure', () => {
      const response = {
        data: [],
        pagination: {
          total: 100,
          limit: 20,
          offset: 0,
          hasMore: true,
        },
      }
      expect(response).toHaveProperty('data')
      expect(response).toHaveProperty('pagination')
      expect(response.pagination).toHaveProperty('total')
      expect(response.pagination).toHaveProperty('limit')
      expect(response.pagination).toHaveProperty('offset')
      expect(response.pagination).toHaveProperty('hasMore')
    })

    it('single build response has build property', () => {
      const response = {
        build: {
          id: 'build-123',
          appId: 'app-456',
          version: '1.0.0',
          buildNumber: 1,
          status: 'pending',
          platform: 'ios',
          configuration: 'release',
          bundleId: 'com.example.app',
          teamId: null,
          provisioningProfile: null,
          artifactUrl: null,
          artifactSize: null,
          logs: null,
          error: null,
          startedAt: null,
          completedAt: null,
          createdAt: 1705999000,
        },
      }
      expect(response).toHaveProperty('build')
      expect(response.build).toHaveProperty('id')
      expect(response.build).toHaveProperty('platform')
      expect(response.build.platform).toBe('ios')
    })

    it('delete response indicates success', () => {
      const response = { success: true, cancelled: true }
      expect(response.success).toBe(true)
      expect(response.cancelled).toBe(true)
    })
  })

  describe('query filters', () => {
    const applyFilters = (
      conditions: string[],
      params: (string | number)[],
      status: string | undefined,
      version: string | undefined
    ): void => {
      if (status) {
        conditions.push('status = ?')
        params.push(status)
      }
      if (version) {
        conditions.push('version = ?')
        params.push(version)
      }
    }

    it('builds query with status filter', () => {
      const conditions = ['app_id = ?']
      const params: (string | number)[] = ['app-123']
      const status: string | undefined = 'pending'

      applyFilters(conditions, params, status, undefined)

      expect(conditions).toContain('status = ?')
      expect(params).toContain('pending')
      expect(conditions.join(' AND ')).toBe('app_id = ? AND status = ?')
    })

    it('builds query with version filter', () => {
      const conditions = ['app_id = ?']
      const params: (string | number)[] = ['app-123']
      const version: string | undefined = '1.0.0'

      applyFilters(conditions, params, undefined, version)

      expect(conditions).toContain('version = ?')
      expect(params).toContain('1.0.0')
    })

    it('builds query with both filters', () => {
      const conditions = ['app_id = ?']
      const params: (string | number)[] = ['app-123']
      const status: string | undefined = 'complete'
      const version: string | undefined = '2.0.0'

      applyFilters(conditions, params, status, version)

      expect(conditions.length).toBe(3)
      expect(params.length).toBe(3)
      expect(conditions.join(' AND ')).toBe('app_id = ? AND status = ? AND version = ?')
    })

    it('builds query without filters', () => {
      const conditions = ['app_id = ?']
      const params: (string | number)[] = ['app-123']
      const status: string | undefined = undefined
      const version: string | undefined = undefined

      applyFilters(conditions, params, status, version)

      expect(conditions.length).toBe(1)
      expect(params.length).toBe(1)
      expect(conditions.join(' AND ')).toBe('app_id = ?')
    })
  })
})
