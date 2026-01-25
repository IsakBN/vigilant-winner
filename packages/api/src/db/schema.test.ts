import { describe, it, expect } from 'vitest'
import { getTableName } from 'drizzle-orm'
import {
  apps,
  devices,
  releases,
  telemetryEvents,
  releaseStats,
} from './schema'

describe('database schema', () => {
  describe('apps table', () => {
    it('exports apps table with correct name', () => {
      expect(getTableName(apps)).toBe('apps')
    })

    it('has required columns', () => {
      const columns = Object.keys(apps)
      expect(columns).toContain('id')
      expect(columns).toContain('name')
      expect(columns).toContain('bundleId')
      expect(columns).toContain('platform')
      expect(columns).toContain('ownerId')
      expect(columns).toContain('createdAt')
      expect(columns).toContain('updatedAt')
    })
  })

  describe('devices table', () => {
    it('exports devices table with correct name', () => {
      expect(getTableName(devices)).toBe('devices')
    })

    it('has required columns', () => {
      const columns = Object.keys(devices)
      expect(columns).toContain('id')
      expect(columns).toContain('appId')
      expect(columns).toContain('platform')
      expect(columns).toContain('appVersion')
      expect(columns).toContain('createdAt')
    })
  })

  describe('releases table', () => {
    it('exports releases table with correct name', () => {
      expect(getTableName(releases)).toBe('releases')
    })

    it('has required columns', () => {
      const columns = Object.keys(releases)
      expect(columns).toContain('id')
      expect(columns).toContain('appId')
      expect(columns).toContain('version')
      expect(columns).toContain('bundleUrl')
      expect(columns).toContain('bundleSize')
      expect(columns).toContain('bundleHash')
      expect(columns).toContain('status')
    })
  })

  describe('telemetryEvents table', () => {
    it('exports telemetryEvents table with correct name', () => {
      expect(getTableName(telemetryEvents)).toBe('telemetry_events')
    })

    it('has required columns', () => {
      const columns = Object.keys(telemetryEvents)
      expect(columns).toContain('id')
      expect(columns).toContain('deviceId')
      expect(columns).toContain('appId')
      expect(columns).toContain('eventType')
      expect(columns).toContain('timestamp')
    })
  })

  describe('releaseStats table', () => {
    it('exports releaseStats table with correct name', () => {
      expect(getTableName(releaseStats)).toBe('release_stats')
    })

    it('has required columns', () => {
      const columns = Object.keys(releaseStats)
      expect(columns).toContain('releaseId')
      expect(columns).toContain('totalDownloads')
      expect(columns).toContain('totalInstalls')
      expect(columns).toContain('totalRollbacks')
      expect(columns).toContain('totalCrashes')
    })
  })
})
