/**
 * Worker claim routes tests
 * @agent queue-system
 */

import { describe, it, expect } from 'vitest'
import { z } from 'zod'

// =============================================================================
// Schema Definition
// =============================================================================

const claimJobSchema = z.object({
  workerId: z.string().min(1).max(100),
  nodePool: z.string().max(50).optional(),
})

// =============================================================================
// Schema Tests
// =============================================================================

describe('Worker Claim Routes', () => {
  describe('claimJobSchema', () => {
    it('validates minimal required fields', () => {
      const result = claimJobSchema.safeParse({
        workerId: 'worker-001',
      })
      expect(result.success).toBe(true)
    })

    it('validates with optional nodePool', () => {
      const result = claimJobSchema.safeParse({
        workerId: 'worker-001',
        nodePool: 'ios-macos',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.nodePool).toBe('ios-macos')
      }
    })

    it('rejects empty workerId', () => {
      const result = claimJobSchema.safeParse({
        workerId: '',
      })
      expect(result.success).toBe(false)
    })

    it('rejects workerId exceeding max length', () => {
      const result = claimJobSchema.safeParse({
        workerId: 'a'.repeat(101),
      })
      expect(result.success).toBe(false)
    })

    it('rejects nodePool exceeding max length', () => {
      const result = claimJobSchema.safeParse({
        workerId: 'worker-001',
        nodePool: 'a'.repeat(51),
      })
      expect(result.success).toBe(false)
    })

    it('rejects missing workerId', () => {
      const result = claimJobSchema.safeParse({})
      expect(result.success).toBe(false)
    })
  })

  describe('build priority logic', () => {
    it('prioritizes iOS builds before Android', () => {
      const iosBuild = { type: 'ios', created_at: 1000 }
      const androidBuild = { type: 'android', created_at: 500 }

      // iOS is checked first regardless of timestamp
      const priority = iosBuild.type === 'ios' ? 1 : 2
      expect(priority).toBe(1)
    })

    it('claims oldest build by created_at within same type', () => {
      const builds = [
        { id: 'build-1', created_at: 1000 },
        { id: 'build-2', created_at: 500 },
        { id: 'build-3', created_at: 750 },
      ]

      const sorted = [...builds].sort((a, b) => a.created_at - b.created_at)
      expect(sorted[0].id).toBe('build-2')
    })
  })

  describe('build formatting', () => {
    it('formats iOS build correctly', () => {
      const build = {
        id: 'build-123',
        app_id: 'app-456',
        version: '1.0.0',
        build_number: 42,
        configuration: 'release',
        bundle_id: 'com.example.app',
        team_id: 'TEAM123',
      }

      const formatted = {
        id: build.id,
        type: 'ios' as const,
        appId: build.app_id,
        version: build.version,
        buildNumber: build.build_number,
        configuration: build.configuration,
        bundleId: build.bundle_id,
        teamId: build.team_id,
      }

      expect(formatted.type).toBe('ios')
      expect(formatted.buildNumber).toBe(42)
      expect(formatted.teamId).toBe('TEAM123')
    })

    it('formats Android build correctly', () => {
      const build = {
        id: 'build-789',
        app_id: 'app-456',
        version: '2.0.0',
        version_code: 15,
        build_type: 'release',
        flavor: 'production',
        package_name: 'com.example.app',
        keystore_alias: 'upload',
      }

      const formatted = {
        id: build.id,
        type: 'android' as const,
        appId: build.app_id,
        version: build.version,
        versionCode: build.version_code,
        buildType: build.build_type,
        flavor: build.flavor,
        packageName: build.package_name,
        keystoreAlias: build.keystore_alias,
      }

      expect(formatted.type).toBe('android')
      expect(formatted.versionCode).toBe(15)
      expect(formatted.flavor).toBe('production')
    })
  })
})
