/**
 * HealthMonitor Tests
 *
 * Tests for the HealthMonitor class that tracks critical events/endpoints
 * and notifies CrashDetector when all pass.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  HealthMonitor,
  type HealthMonitorConfig,
  type CriticalEndpoint,
} from './health-monitor'
import type { CrashDetector } from './crash-detector'

function createMockCrashDetector(): CrashDetector {
  return {
    notifyHealthPassed: vi.fn().mockResolvedValue(undefined),
    notifyAppReady: vi.fn().mockResolvedValue(undefined),
    checkForCrash: vi.fn().mockResolvedValue(false),
    startVerificationWindow: vi.fn(),
    stop: vi.fn(),
  } as unknown as CrashDetector
}

function createConfig(
  overrides: Partial<HealthMonitorConfig> = {}
): HealthMonitorConfig {
  return {
    events: [],
    endpoints: [],
    crashDetector: createMockCrashDetector(),
    ...overrides,
  }
}

describe('HealthMonitor', () => {
  let mockCrashDetector: CrashDetector

  beforeEach(() => {
    mockCrashDetector = createMockCrashDetector()
    vi.clearAllMocks()
  })

  describe('single required event', () => {
    it('notifyHealthPassed is called when single required event passes', () => {
      const config = createConfig({
        events: [{ name: 'app_loaded', required: true }],
        crashDetector: mockCrashDetector,
      })
      const monitor = new HealthMonitor(config)

      monitor.reportEvent('app_loaded')

      expect(mockCrashDetector.notifyHealthPassed).toHaveBeenCalledTimes(1)
      expect(monitor.isFullyVerified()).toBe(true)
    })

    it('onAllPassed callback is called when event passes', () => {
      const onAllPassed = vi.fn()
      const config = createConfig({
        events: [{ name: 'app_loaded', required: true }],
        crashDetector: mockCrashDetector,
        onAllPassed,
      })
      const monitor = new HealthMonitor(config)

      monitor.reportEvent('app_loaded')

      expect(onAllPassed).toHaveBeenCalledTimes(1)
    })
  })

  describe('multiple required events', () => {
    it('only passes when ALL required events fire', () => {
      const config = createConfig({
        events: [
          { name: 'app_loaded', required: true },
          { name: 'user_logged_in', required: true },
          { name: 'data_fetched', required: true },
        ],
        crashDetector: mockCrashDetector,
      })
      const monitor = new HealthMonitor(config)

      // First event
      monitor.reportEvent('app_loaded')
      expect(mockCrashDetector.notifyHealthPassed).not.toHaveBeenCalled()
      expect(monitor.isFullyVerified()).toBe(false)

      // Second event
      monitor.reportEvent('user_logged_in')
      expect(mockCrashDetector.notifyHealthPassed).not.toHaveBeenCalled()
      expect(monitor.isFullyVerified()).toBe(false)

      // Third event - should trigger verification
      monitor.reportEvent('data_fetched')
      expect(mockCrashDetector.notifyHealthPassed).toHaveBeenCalledTimes(1)
      expect(monitor.isFullyVerified()).toBe(true)
    })

    it('order of events does not matter', () => {
      const config = createConfig({
        events: [
          { name: 'event_a', required: true },
          { name: 'event_b', required: true },
        ],
        crashDetector: mockCrashDetector,
      })
      const monitor = new HealthMonitor(config)

      // Fire in reverse order
      monitor.reportEvent('event_b')
      expect(monitor.isFullyVerified()).toBe(false)

      monitor.reportEvent('event_a')
      expect(monitor.isFullyVerified()).toBe(true)
      expect(mockCrashDetector.notifyHealthPassed).toHaveBeenCalledTimes(1)
    })
  })

  describe('optional events', () => {
    it('optional events do not block verification', () => {
      const config = createConfig({
        events: [
          { name: 'app_loaded', required: true },
          { name: 'analytics_init', required: false },
        ],
        crashDetector: mockCrashDetector,
      })
      const monitor = new HealthMonitor(config)

      // Only fire required event
      monitor.reportEvent('app_loaded')

      expect(mockCrashDetector.notifyHealthPassed).toHaveBeenCalledTimes(1)
      expect(monitor.isFullyVerified()).toBe(true)
    })

    it('optional events can still be reported', () => {
      const config = createConfig({
        events: [
          { name: 'app_loaded', required: true },
          { name: 'analytics_init', required: false },
        ],
        crashDetector: mockCrashDetector,
      })
      const monitor = new HealthMonitor(config)

      monitor.reportEvent('analytics_init')
      expect(monitor.isFullyVerified()).toBe(false)

      monitor.reportEvent('app_loaded')
      expect(monitor.isFullyVerified()).toBe(true)
    })
  })

  describe('endpoint verification', () => {
    it('endpoint status matching works correctly', () => {
      const config = createConfig({
        endpoints: [
          {
            method: 'GET',
            url: '/api/health',
            expectedStatus: [200],
            required: true,
          },
        ],
        crashDetector: mockCrashDetector,
      })
      const monitor = new HealthMonitor(config)

      monitor.reportEndpoint('GET', '/api/health', 200)

      expect(mockCrashDetector.notifyHealthPassed).toHaveBeenCalledTimes(1)
      expect(monitor.isFullyVerified()).toBe(true)
    })

    it('multiple expected statuses are supported', () => {
      const config = createConfig({
        endpoints: [
          {
            method: 'GET',
            url: '/api/data',
            expectedStatus: [200, 201, 204],
            required: true,
          },
        ],
        crashDetector: mockCrashDetector,
      })
      const monitor = new HealthMonitor(config)

      // 204 should be accepted
      monitor.reportEndpoint('GET', '/api/data', 204)

      expect(monitor.isFullyVerified()).toBe(true)
    })

    it('unexpected status does not mark endpoint as passed', () => {
      const config = createConfig({
        endpoints: [
          {
            method: 'GET',
            url: '/api/health',
            expectedStatus: [200],
            required: true,
          },
        ],
        crashDetector: mockCrashDetector,
      })
      const monitor = new HealthMonitor(config)

      monitor.reportEndpoint('GET', '/api/health', 500)

      expect(mockCrashDetector.notifyHealthPassed).not.toHaveBeenCalled()
      expect(monitor.isFullyVerified()).toBe(false)
    })

    it('onEndpointFailed callback is called for failed required endpoints', () => {
      const onEndpointFailed = vi.fn()
      const endpoint: CriticalEndpoint = {
        method: 'GET',
        url: '/api/health',
        expectedStatus: [200],
        required: true,
      }
      const config = createConfig({
        endpoints: [endpoint],
        crashDetector: mockCrashDetector,
        onEndpointFailed,
      })
      const monitor = new HealthMonitor(config)

      monitor.reportEndpoint('GET', '/api/health', 503)

      expect(onEndpointFailed).toHaveBeenCalledWith(endpoint, 503)
    })
  })

  describe('combined events and endpoints', () => {
    it('requires both events AND endpoints to pass', () => {
      const config = createConfig({
        events: [{ name: 'app_loaded', required: true }],
        endpoints: [
          {
            method: 'GET',
            url: '/api/health',
            expectedStatus: [200],
            required: true,
          },
        ],
        crashDetector: mockCrashDetector,
      })
      const monitor = new HealthMonitor(config)

      // Only event
      monitor.reportEvent('app_loaded')
      expect(monitor.isFullyVerified()).toBe(false)

      // Now endpoint
      monitor.reportEndpoint('GET', '/api/health', 200)
      expect(monitor.isFullyVerified()).toBe(true)
      expect(mockCrashDetector.notifyHealthPassed).toHaveBeenCalledTimes(1)
    })
  })

  describe('getMissingEvents', () => {
    it('returns missing required events', () => {
      const config = createConfig({
        events: [
          { name: 'event_a', required: true },
          { name: 'event_b', required: true },
          { name: 'event_c', required: false },
        ],
        crashDetector: mockCrashDetector,
      })
      const monitor = new HealthMonitor(config)

      monitor.reportEvent('event_a')

      const missing = monitor.getMissingEvents()
      expect(missing).toEqual(['event_b'])
    })

    it('returns empty array when all required events passed', () => {
      const config = createConfig({
        events: [{ name: 'event_a', required: true }],
        crashDetector: mockCrashDetector,
      })
      const monitor = new HealthMonitor(config)

      monitor.reportEvent('event_a')

      expect(monitor.getMissingEvents()).toEqual([])
    })
  })

  describe('getMissingEndpoints', () => {
    it('returns missing required endpoints', () => {
      const endpoint1: CriticalEndpoint = {
        method: 'GET',
        url: '/api/health',
        expectedStatus: [200],
        required: true,
      }
      const endpoint2: CriticalEndpoint = {
        method: 'POST',
        url: '/api/data',
        expectedStatus: [201],
        required: true,
      }
      const config = createConfig({
        endpoints: [endpoint1, endpoint2],
        crashDetector: mockCrashDetector,
      })
      const monitor = new HealthMonitor(config)

      monitor.reportEndpoint('GET', '/api/health', 200)

      const missing = monitor.getMissingEndpoints()
      expect(missing).toEqual([endpoint2])
    })
  })

  describe('reset', () => {
    it('clears all state', () => {
      const config = createConfig({
        events: [{ name: 'app_loaded', required: true }],
        endpoints: [
          {
            method: 'GET',
            url: '/api/health',
            expectedStatus: [200],
            required: true,
          },
        ],
        crashDetector: mockCrashDetector,
      })
      const monitor = new HealthMonitor(config)

      // Complete verification
      monitor.reportEvent('app_loaded')
      monitor.reportEndpoint('GET', '/api/health', 200)
      expect(monitor.isFullyVerified()).toBe(true)

      // Reset
      monitor.reset()

      expect(monitor.isFullyVerified()).toBe(false)
      expect(monitor.getMissingEvents()).toEqual(['app_loaded'])
      expect(monitor.getMissingEndpoints()).toHaveLength(1)
    })

    it('allows re-verification after reset', () => {
      const config = createConfig({
        events: [{ name: 'app_loaded', required: true }],
        crashDetector: mockCrashDetector,
      })
      const monitor = new HealthMonitor(config)

      monitor.reportEvent('app_loaded')
      expect(mockCrashDetector.notifyHealthPassed).toHaveBeenCalledTimes(1)

      monitor.reset()
      monitor.reportEvent('app_loaded')

      expect(mockCrashDetector.notifyHealthPassed).toHaveBeenCalledTimes(2)
    })
  })

  describe('edge cases', () => {
    it('ignores unknown events', () => {
      const config = createConfig({
        events: [{ name: 'app_loaded', required: true }],
        crashDetector: mockCrashDetector,
      })
      const monitor = new HealthMonitor(config)

      monitor.reportEvent('unknown_event')

      expect(monitor.isFullyVerified()).toBe(false)
      expect(monitor.getMissingEvents()).toEqual(['app_loaded'])
    })

    it('ignores unknown endpoints', () => {
      const config = createConfig({
        endpoints: [
          {
            method: 'GET',
            url: '/api/health',
            expectedStatus: [200],
            required: true,
          },
        ],
        crashDetector: mockCrashDetector,
      })
      const monitor = new HealthMonitor(config)

      monitor.reportEndpoint('POST', '/api/unknown', 200)

      expect(monitor.isFullyVerified()).toBe(false)
    })

    it('duplicate event reports are idempotent', () => {
      const onAllPassed = vi.fn()
      const config = createConfig({
        events: [{ name: 'app_loaded', required: true }],
        crashDetector: mockCrashDetector,
        onAllPassed,
      })
      const monitor = new HealthMonitor(config)

      monitor.reportEvent('app_loaded')
      monitor.reportEvent('app_loaded')
      monitor.reportEvent('app_loaded')

      expect(onAllPassed).toHaveBeenCalledTimes(1)
      expect(mockCrashDetector.notifyHealthPassed).toHaveBeenCalledTimes(1)
    })

    it('empty config passes immediately with no events/endpoints', () => {
      const config = createConfig({
        events: [],
        endpoints: [],
        crashDetector: mockCrashDetector,
      })
      const monitor = new HealthMonitor(config)

      // Should already be "verified" since no required items
      expect(monitor.getMissingEvents()).toEqual([])
      expect(monitor.getMissingEndpoints()).toEqual([])
    })

    it('reports after completion are ignored', () => {
      const onAllPassed = vi.fn()
      const config = createConfig({
        events: [{ name: 'event_a', required: true }],
        crashDetector: mockCrashDetector,
        onAllPassed,
      })
      const monitor = new HealthMonitor(config)

      monitor.reportEvent('event_a')
      expect(monitor.isFullyVerified()).toBe(true)

      // Should not trigger again
      monitor.reportEvent('event_a')

      expect(onAllPassed).toHaveBeenCalledTimes(1)
    })
  })
})
