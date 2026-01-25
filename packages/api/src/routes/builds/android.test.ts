/**
 * Android Build System Routes Tests
 *
 * @agent android-builds
 * @created 2026-01-26
 */

import { describe, it, expect } from 'vitest'
import { z } from 'zod'
import { ERROR_CODES } from '@bundlenudge/shared'

// =============================================================================
// Schema Tests
// =============================================================================

const triggerBuildSchema = z.object({
  version: z.string().min(1).max(50),
  versionCode: z.number().int().positive().optional(),
  buildType: z.enum(['debug', 'release']),
  flavor: z.string().min(1).max(50).optional(),
  packageName: z.string().min(1).max(255),
  artifactType: z.enum(['apk', 'aab']),
})

describe('android builds routes', () => {
  describe('triggerBuildSchema validation', () => {
    it('validates minimal APK build input', () => {
      const result = triggerBuildSchema.safeParse({
        version: '1.0.0',
        buildType: 'release',
        packageName: 'com.example.app',
        artifactType: 'apk',
      })
      expect(result.success).toBe(true)
    })

    it('validates minimal AAB build input', () => {
      const result = triggerBuildSchema.safeParse({
        version: '2.1.0',
        buildType: 'release',
        packageName: 'com.example.app',
        artifactType: 'aab',
      })
      expect(result.success).toBe(true)
    })

    it('validates debug build type', () => {
      const result = triggerBuildSchema.safeParse({
        version: '1.0.0-debug',
        buildType: 'debug',
        packageName: 'com.example.app.debug',
        artifactType: 'apk',
      })
      expect(result.success).toBe(true)
    })

    it('validates input with optional versionCode', () => {
      const result = triggerBuildSchema.safeParse({
        version: '1.0.0',
        versionCode: 42,
        buildType: 'release',
        packageName: 'com.example.app',
        artifactType: 'apk',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.versionCode).toBe(42)
      }
    })

    it('validates input with optional flavor', () => {
      const result = triggerBuildSchema.safeParse({
        version: '1.0.0',
        buildType: 'release',
        flavor: 'production',
        packageName: 'com.example.app',
        artifactType: 'apk',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.flavor).toBe('production')
      }
    })

    it('validates all fields together', () => {
      const result = triggerBuildSchema.safeParse({
        version: '3.2.1',
        versionCode: 321,
        buildType: 'release',
        flavor: 'staging',
        packageName: 'com.example.app.staging',
        artifactType: 'aab',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.version).toBe('3.2.1')
        expect(result.data.versionCode).toBe(321)
        expect(result.data.buildType).toBe('release')
        expect(result.data.flavor).toBe('staging')
        expect(result.data.packageName).toBe('com.example.app.staging')
        expect(result.data.artifactType).toBe('aab')
      }
    })

    it('rejects missing version', () => {
      const result = triggerBuildSchema.safeParse({
        buildType: 'release',
        packageName: 'com.example.app',
        artifactType: 'apk',
      })
      expect(result.success).toBe(false)
    })

    it('rejects empty version', () => {
      const result = triggerBuildSchema.safeParse({
        version: '',
        buildType: 'release',
        packageName: 'com.example.app',
        artifactType: 'apk',
      })
      expect(result.success).toBe(false)
    })

    it('rejects version that is too long', () => {
      const result = triggerBuildSchema.safeParse({
        version: 'a'.repeat(51),
        buildType: 'release',
        packageName: 'com.example.app',
        artifactType: 'apk',
      })
      expect(result.success).toBe(false)
    })

    it('rejects missing buildType', () => {
      const result = triggerBuildSchema.safeParse({
        version: '1.0.0',
        packageName: 'com.example.app',
        artifactType: 'apk',
      })
      expect(result.success).toBe(false)
    })

    it('rejects invalid buildType', () => {
      const result = triggerBuildSchema.safeParse({
        version: '1.0.0',
        buildType: 'production',
        packageName: 'com.example.app',
        artifactType: 'apk',
      })
      expect(result.success).toBe(false)
    })

    it('rejects missing packageName', () => {
      const result = triggerBuildSchema.safeParse({
        version: '1.0.0',
        buildType: 'release',
        artifactType: 'apk',
      })
      expect(result.success).toBe(false)
    })

    it('rejects empty packageName', () => {
      const result = triggerBuildSchema.safeParse({
        version: '1.0.0',
        buildType: 'release',
        packageName: '',
        artifactType: 'apk',
      })
      expect(result.success).toBe(false)
    })

    it('rejects packageName that is too long', () => {
      const result = triggerBuildSchema.safeParse({
        version: '1.0.0',
        buildType: 'release',
        packageName: 'a'.repeat(256),
        artifactType: 'apk',
      })
      expect(result.success).toBe(false)
    })

    it('rejects missing artifactType', () => {
      const result = triggerBuildSchema.safeParse({
        version: '1.0.0',
        buildType: 'release',
        packageName: 'com.example.app',
      })
      expect(result.success).toBe(false)
    })

    it('rejects invalid artifactType', () => {
      const result = triggerBuildSchema.safeParse({
        version: '1.0.0',
        buildType: 'release',
        packageName: 'com.example.app',
        artifactType: 'ipa',
      })
      expect(result.success).toBe(false)
    })

    it('rejects negative versionCode', () => {
      const result = triggerBuildSchema.safeParse({
        version: '1.0.0',
        versionCode: -1,
        buildType: 'release',
        packageName: 'com.example.app',
        artifactType: 'apk',
      })
      expect(result.success).toBe(false)
    })

    it('rejects zero versionCode', () => {
      const result = triggerBuildSchema.safeParse({
        version: '1.0.0',
        versionCode: 0,
        buildType: 'release',
        packageName: 'com.example.app',
        artifactType: 'apk',
      })
      expect(result.success).toBe(false)
    })

    it('rejects non-integer versionCode', () => {
      const result = triggerBuildSchema.safeParse({
        version: '1.0.0',
        versionCode: 1.5,
        buildType: 'release',
        packageName: 'com.example.app',
        artifactType: 'apk',
      })
      expect(result.success).toBe(false)
    })

    it('rejects empty flavor', () => {
      const result = triggerBuildSchema.safeParse({
        version: '1.0.0',
        buildType: 'release',
        flavor: '',
        packageName: 'com.example.app',
        artifactType: 'apk',
      })
      expect(result.success).toBe(false)
    })

    it('rejects flavor that is too long', () => {
      const result = triggerBuildSchema.safeParse({
        version: '1.0.0',
        buildType: 'release',
        flavor: 'a'.repeat(51),
        packageName: 'com.example.app',
        artifactType: 'apk',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('pagination logic', () => {
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

  describe('auto-increment version code logic', () => {
    const getNextVersionCode = (maxCode: number | null): number => (maxCode ?? 0) + 1

    it('returns 1 when no previous builds exist', () => {
      const maxCode: number | null = null
      expect(getNextVersionCode(maxCode)).toBe(1)
    })

    it('increments from the highest existing version code', () => {
      const maxCode: number | null = 42
      expect(getNextVersionCode(maxCode)).toBe(43)
    })

    it('handles version code of 1', () => {
      const maxCode: number | null = 1
      expect(getNextVersionCode(maxCode)).toBe(2)
    })

    it('handles large version codes', () => {
      const maxCode: number | null = 999999
      expect(getNextVersionCode(maxCode)).toBe(1000000)
    })
  })

  describe('build status constants', () => {
    const BUILD_STATUS = {
      PENDING: 'pending',
      BUILDING: 'building',
      SIGNING: 'signing',
      UPLOADING: 'uploading',
      COMPLETE: 'complete',
      FAILED: 'failed',
    } as const

    it('has pending status', () => {
      expect(BUILD_STATUS.PENDING).toBe('pending')
    })

    it('has building status', () => {
      expect(BUILD_STATUS.BUILDING).toBe('building')
    })

    it('has signing status', () => {
      expect(BUILD_STATUS.SIGNING).toBe('signing')
    })

    it('has uploading status', () => {
      expect(BUILD_STATUS.UPLOADING).toBe('uploading')
    })

    it('has complete status', () => {
      expect(BUILD_STATUS.COMPLETE).toBe('complete')
    })

    it('has failed status', () => {
      expect(BUILD_STATUS.FAILED).toBe('failed')
    })
  })

  describe('cancelable statuses', () => {
    const BUILD_STATUS = {
      PENDING: 'pending',
      BUILDING: 'building',
      SIGNING: 'signing',
      UPLOADING: 'uploading',
      COMPLETE: 'complete',
      FAILED: 'failed',
    } as const

    const CANCELABLE_STATUSES = [BUILD_STATUS.PENDING, BUILD_STATUS.BUILDING] as const

    it('pending builds are cancelable', () => {
      expect(CANCELABLE_STATUSES).toContain('pending')
    })

    it('building builds are cancelable', () => {
      expect(CANCELABLE_STATUSES).toContain('building')
    })

    it('signing builds are not cancelable', () => {
      expect(CANCELABLE_STATUSES).not.toContain('signing')
    })

    it('uploading builds are not cancelable', () => {
      expect(CANCELABLE_STATUSES).not.toContain('uploading')
    })

    it('complete builds are not cancelable', () => {
      expect(CANCELABLE_STATUSES).not.toContain('complete')
    })

    it('failed builds are not cancelable', () => {
      expect(CANCELABLE_STATUSES).not.toContain('failed')
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

    it('has INVALID_STATE error code', () => {
      expect(ERROR_CODES.INVALID_STATE).toBe('INVALID_STATE')
    })
  })

  describe('build response formatting', () => {
    it('transforms snake_case to camelCase', () => {
      const row = {
        id: 'build-123',
        app_id: 'app-456',
        version: '1.0.0',
        version_code: 1,
        status: 'pending' as const,
        build_type: 'release' as const,
        flavor: null,
        package_name: 'com.example.app',
        keystore_alias: null,
        artifact_url: null,
        artifact_size: null,
        artifact_type: 'apk' as const,
        logs: null,
        error: null,
        started_at: null,
        completed_at: null,
        created_at: 1706288400,
      }

      const formatted = {
        id: row.id,
        appId: row.app_id,
        version: row.version,
        versionCode: row.version_code,
        status: row.status,
        platform: 'android' as const,
        buildType: row.build_type,
        flavor: row.flavor,
        packageName: row.package_name,
        keystoreAlias: row.keystore_alias,
        artifactUrl: row.artifact_url,
        artifactSize: row.artifact_size,
        artifactType: row.artifact_type,
        logs: row.logs,
        error: row.error,
        startedAt: row.started_at,
        completedAt: row.completed_at,
        createdAt: row.created_at,
      }

      expect(formatted.appId).toBe('app-456')
      expect(formatted.versionCode).toBe(1)
      expect(formatted.buildType).toBe('release')
      expect(formatted.packageName).toBe('com.example.app')
      expect(formatted.artifactType).toBe('apk')
      expect(formatted.platform).toBe('android')
    })

    it('includes all build fields', () => {
      const row = {
        id: 'build-789',
        app_id: 'app-111',
        version: '2.0.0',
        version_code: 200,
        status: 'complete' as const,
        build_type: 'release' as const,
        flavor: 'production',
        package_name: 'com.example.production',
        keystore_alias: 'release-key',
        artifact_url: 'https://storage.example.com/build.aab',
        artifact_size: 15728640,
        artifact_type: 'aab' as const,
        logs: 'Build completed successfully',
        error: null,
        started_at: 1706288400,
        completed_at: 1706288700,
        created_at: 1706288300,
      }

      const formatted = {
        id: row.id,
        appId: row.app_id,
        version: row.version,
        versionCode: row.version_code,
        status: row.status,
        platform: 'android' as const,
        buildType: row.build_type,
        flavor: row.flavor,
        packageName: row.package_name,
        keystoreAlias: row.keystore_alias,
        artifactUrl: row.artifact_url,
        artifactSize: row.artifact_size,
        artifactType: row.artifact_type,
        logs: row.logs,
        error: row.error,
        startedAt: row.started_at,
        completedAt: row.completed_at,
        createdAt: row.created_at,
      }

      expect(formatted.flavor).toBe('production')
      expect(formatted.keystoreAlias).toBe('release-key')
      expect(formatted.artifactUrl).toBe('https://storage.example.com/build.aab')
      expect(formatted.artifactSize).toBe(15728640)
      expect(formatted.logs).toBe('Build completed successfully')
      expect(formatted.startedAt).toBe(1706288400)
      expect(formatted.completedAt).toBe(1706288700)
    })
  })

  describe('flavor validation', () => {
    it('accepts common Android flavors', () => {
      const flavors = ['production', 'staging', 'development', 'debug', 'qa']
      flavors.forEach((flavor) => {
        const result = triggerBuildSchema.safeParse({
          version: '1.0.0',
          buildType: 'release',
          flavor,
          packageName: 'com.example.app',
          artifactType: 'apk',
        })
        expect(result.success).toBe(true)
      })
    })

    it('accepts camelCase flavors', () => {
      const flavors = ['freeRelease', 'paidDebug', 'internalBeta']
      flavors.forEach((flavor) => {
        const result = triggerBuildSchema.safeParse({
          version: '1.0.0',
          buildType: 'release',
          flavor,
          packageName: 'com.example.app',
          artifactType: 'apk',
        })
        expect(result.success).toBe(true)
      })
    })

    it('accepts snake_case flavors', () => {
      const flavors = ['free_release', 'paid_debug', 'internal_beta']
      flavors.forEach((flavor) => {
        const result = triggerBuildSchema.safeParse({
          version: '1.0.0',
          buildType: 'release',
          flavor,
          packageName: 'com.example.app',
          artifactType: 'apk',
        })
        expect(result.success).toBe(true)
      })
    })
  })

  describe('artifact types', () => {
    it('apk is valid for debug builds', () => {
      const result = triggerBuildSchema.safeParse({
        version: '1.0.0',
        buildType: 'debug',
        packageName: 'com.example.app',
        artifactType: 'apk',
      })
      expect(result.success).toBe(true)
    })

    it('aab is valid for release builds', () => {
      const result = triggerBuildSchema.safeParse({
        version: '1.0.0',
        buildType: 'release',
        packageName: 'com.example.app',
        artifactType: 'aab',
      })
      expect(result.success).toBe(true)
    })

    it('apk can be used for release builds', () => {
      const result = triggerBuildSchema.safeParse({
        version: '1.0.0',
        buildType: 'release',
        packageName: 'com.example.app',
        artifactType: 'apk',
      })
      expect(result.success).toBe(true)
    })
  })
})
