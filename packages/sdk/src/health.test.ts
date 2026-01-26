/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/**
 * Health Monitoring Tests
 *
 * Critical tests for privacy-first health monitoring.
 * The key guarantee: healthy devices send ZERO network calls.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  startHealthMonitoring,
  reportHealthEvent,
  stopHealthMonitoring,
  isHealthMonitoringActive,
  getHealthMonitoringState,
  DEFAULT_HEALTH_WINDOW_MS,
} from './health'

describe('health', () => {
  const mockFetch = vi.fn()

  beforeEach(() => {
    vi.useFakeTimers()
    global.fetch = mockFetch
    mockFetch.mockResolvedValue({ ok: true })
  })

  afterEach(() => {
    stopHealthMonitoring()
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  describe('startHealthMonitoring', () => {
    it('starts monitoring with specified events', () => {
      startHealthMonitoring(
        { events: ['app_ready', 'home_loaded'] },
        'release-123',
        'device-456',
        'https://api.bundlenudge.com',
        'token'
      )

      expect(isHealthMonitoringActive()).toBe(true)
      const state = getHealthMonitoringState()
      expect(state?.events).toContain('app_ready')
      expect(state?.events).toContain('home_loaded')
      expect(state?.firedEvents).toEqual([])
    })

    it('does nothing with empty events array', () => {
      startHealthMonitoring(
        { events: [] },
        'release-123',
        'device-456',
        'https://api.bundlenudge.com',
        'token'
      )

      expect(isHealthMonitoringActive()).toBe(false)
    })

    it('stops previous monitoring when starting new', () => {
      startHealthMonitoring(
        { events: ['event1'] },
        'release-1',
        'device-1',
        'https://api.bundlenudge.com',
        'token'
      )

      startHealthMonitoring(
        { events: ['event2'] },
        'release-2',
        'device-2',
        'https://api.bundlenudge.com',
        'token'
      )

      const state = getHealthMonitoringState()
      expect(state?.events).toContain('event2')
      expect(state?.events).not.toContain('event1')
    })

    it('works with null accessToken', () => {
      startHealthMonitoring(
        { events: ['app_ready'] },
        'release-123',
        'device-456',
        'https://api.bundlenudge.com',
        null
      )

      expect(isHealthMonitoringActive()).toBe(true)
    })
  })

  describe('reportHealthEvent', () => {
    it('tracks fired events', () => {
      startHealthMonitoring(
        { events: ['app_ready', 'home_loaded'] },
        'release-123',
        'device-456',
        'https://api.bundlenudge.com',
        'token'
      )

      reportHealthEvent('app_ready')

      const state = getHealthMonitoringState()
      expect(state?.firedEvents).toContain('app_ready')
    })

    it('ignores unknown events', () => {
      startHealthMonitoring(
        { events: ['app_ready'] },
        'release-123',
        'device-456',
        'https://api.bundlenudge.com',
        'token'
      )

      reportHealthEvent('unknown_event')

      const state = getHealthMonitoringState()
      expect(state?.firedEvents).toEqual([])
    })

    it('does nothing when not monitoring', () => {
      // Should not throw
      reportHealthEvent('app_ready')
      expect(isHealthMonitoringActive()).toBe(false)
    })

    it('ignores duplicate events (Set behavior)', () => {
      startHealthMonitoring(
        { events: ['app_ready', 'home_loaded'] },
        'release-123',
        'device-456',
        'https://api.bundlenudge.com',
        'token'
      )

      reportHealthEvent('app_ready')
      reportHealthEvent('app_ready')
      reportHealthEvent('app_ready')

      const state = getHealthMonitoringState()
      expect(state?.firedEvents).toHaveLength(1)
      expect(state?.firedEvents).toContain('app_ready')
    })
  })

  describe('privacy guarantee', () => {
    it('CRITICAL: sends ZERO network calls when all events fire', async () => {
      startHealthMonitoring(
        { events: ['app_ready', 'home_loaded', 'data_loaded'], windowMs: 30000 },
        'release-123',
        'device-456',
        'https://api.bundlenudge.com',
        'token'
      )

      // Fire all events
      reportHealthEvent('app_ready')
      reportHealthEvent('home_loaded')
      reportHealthEvent('data_loaded')

      // Wait well past the timeout
      await vi.advanceTimersByTimeAsync(100000)

      // CRITICAL: No network calls
      expect(mockFetch).not.toHaveBeenCalled()
      expect(isHealthMonitoringActive()).toBe(false)
    })

    it('CRITICAL: sends exactly ONE network call on failure', async () => {
      startHealthMonitoring(
        { events: ['app_ready', 'home_loaded'], windowMs: 30000 },
        'release-123',
        'device-456',
        'https://api.bundlenudge.com',
        'token'
      )

      // Fire only one event
      reportHealthEvent('app_ready')

      // Wait for timeout
      await vi.advanceTimersByTimeAsync(30001)

      // Exactly ONE network call
      expect(mockFetch).toHaveBeenCalledTimes(1)
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.bundlenudge.com/v1/health/failure',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            Authorization: 'Bearer token',
          }),
        })
      )
    })

    it('includes missing events in failure report', async () => {
      startHealthMonitoring(
        { events: ['app_ready', 'home_loaded', 'data_loaded'], windowMs: 30000 },
        'release-123',
        'device-456',
        'https://api.bundlenudge.com',
        'token'
      )

      // Fire only one event
      reportHealthEvent('app_ready')

      // Wait for timeout
      await vi.advanceTimersByTimeAsync(30001)

      const [, options] = mockFetch.mock.calls[0]
      const body = JSON.parse(options.body)

      expect(body.releaseId).toBe('release-123')
      expect(body.deviceId).toBe('device-456')
      expect(body.missingEvents).toContain('home_loaded')
      expect(body.missingEvents).toContain('data_loaded')
      expect(body.missingEvents).not.toContain('app_ready')
    })

    it('CRITICAL: does not send network call when no events were expected', async () => {
      startHealthMonitoring(
        { events: [], windowMs: 30000 },
        'release-123',
        'device-456',
        'https://api.bundlenudge.com',
        'token'
      )

      // Wait past timeout
      await vi.advanceTimersByTimeAsync(50000)

      // No network call
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('does not include Authorization header when accessToken is null', async () => {
      startHealthMonitoring(
        { events: ['app_ready'], windowMs: 30000 },
        'release-123',
        'device-456',
        'https://api.bundlenudge.com',
        null
      )

      // Let timeout happen
      await vi.advanceTimersByTimeAsync(30001)

      const [, options] = mockFetch.mock.calls[0]
      expect(options.headers.Authorization).toBeUndefined()
    })
  })

  describe('stopHealthMonitoring', () => {
    it('stops active monitoring', () => {
      startHealthMonitoring(
        { events: ['app_ready'] },
        'release-123',
        'device-456',
        'https://api.bundlenudge.com',
        'token'
      )

      stopHealthMonitoring()

      expect(isHealthMonitoringActive()).toBe(false)
    })

    it('is safe to call multiple times', () => {
      stopHealthMonitoring()
      stopHealthMonitoring()
      expect(isHealthMonitoringActive()).toBe(false)
    })

    it('cancels pending timeout', async () => {
      startHealthMonitoring(
        { events: ['app_ready'], windowMs: 30000 },
        'release-123',
        'device-456',
        'https://api.bundlenudge.com',
        'token'
      )

      stopHealthMonitoring()

      // Wait past original timeout
      await vi.advanceTimersByTimeAsync(50000)

      // No network call should have been made
      expect(mockFetch).not.toHaveBeenCalled()
    })
  })

  describe('getHealthMonitoringState', () => {
    it('returns null when not monitoring', () => {
      expect(getHealthMonitoringState()).toBeNull()
    })

    it('returns current state when monitoring', () => {
      startHealthMonitoring(
        { events: ['app_ready', 'home_loaded'], windowMs: 30000 },
        'release-123',
        'device-456',
        'https://api.bundlenudge.com',
        'token'
      )

      reportHealthEvent('app_ready')

      const state = getHealthMonitoringState()
      expect(state).not.toBeNull()
      expect(state?.isActive).toBe(true)
      expect(state?.events).toContain('app_ready')
      expect(state?.events).toContain('home_loaded')
      expect(state?.firedEvents).toContain('app_ready')
      expect(state?.remainingMs).toBeLessThanOrEqual(30000)
    })

    it('returns decreasing remainingMs over time', () => {
      startHealthMonitoring(
        { events: ['app_ready'], windowMs: 30000 },
        'release-123',
        'device-456',
        'https://api.bundlenudge.com',
        'token'
      )

      const state1 = getHealthMonitoringState()
      expect(state1?.remainingMs).toBeLessThanOrEqual(30000)

      vi.advanceTimersByTime(10000)

      const state2 = getHealthMonitoringState()
      expect(state2?.remainingMs).toBeLessThanOrEqual(20000)
    })
  })

  describe('network error handling', () => {
    it('ignores network errors (fire-and-forget)', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))

      startHealthMonitoring(
        { events: ['app_ready'], windowMs: 30000 },
        'release-123',
        'device-456',
        'https://api.bundlenudge.com',
        'token'
      )

      // Don't fire event, let timeout happen
      await vi.advanceTimersByTimeAsync(30001)

      // Should not throw, monitoring should be stopped
      expect(isHealthMonitoringActive()).toBe(false)
    })

    it('handles server error responses gracefully', async () => {
      mockFetch.mockResolvedValue({ ok: false, status: 500 })

      startHealthMonitoring(
        { events: ['app_ready'], windowMs: 30000 },
        'release-123',
        'device-456',
        'https://api.bundlenudge.com',
        'token'
      )

      // Let timeout happen
      await vi.advanceTimersByTimeAsync(30001)

      // Should not throw
      expect(isHealthMonitoringActive()).toBe(false)
    })
  })

  describe('default values', () => {
    it('uses DEFAULT_HEALTH_WINDOW_MS when not specified', () => {
      expect(DEFAULT_HEALTH_WINDOW_MS).toBe(30000)
    })

    it('applies default window when not provided in config', async () => {
      startHealthMonitoring(
        { events: ['app_ready'] },
        'release-123',
        'device-456',
        'https://api.bundlenudge.com',
        'token'
      )

      // Wait less than default window
      await vi.advanceTimersByTimeAsync(25000)
      expect(mockFetch).not.toHaveBeenCalled()

      // Wait past default window
      await vi.advanceTimersByTimeAsync(10000)
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })
  })

  describe('edge cases', () => {
    it('handles single event correctly', async () => {
      startHealthMonitoring(
        { events: ['app_ready'], windowMs: 30000 },
        'release-123',
        'device-456',
        'https://api.bundlenudge.com',
        'token'
      )

      reportHealthEvent('app_ready')

      // All events fired, should stop immediately
      expect(isHealthMonitoringActive()).toBe(false)

      // Wait past timeout
      await vi.advanceTimersByTimeAsync(50000)

      // No network call
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('handles events fired in any order', () => {
      startHealthMonitoring(
        { events: ['first', 'second', 'third'] },
        'release-123',
        'device-456',
        'https://api.bundlenudge.com',
        'token'
      )

      reportHealthEvent('third')
      reportHealthEvent('first')
      reportHealthEvent('second')

      // All events fired, monitoring should be stopped
      expect(isHealthMonitoringActive()).toBe(false)
    })

    it('includes appVersion and osVersion when provided', async () => {
      startHealthMonitoring(
        { events: ['app_ready'], windowMs: 1000 },
        'release-123',
        'device-456',
        'https://api.bundlenudge.com',
        'token',
        '1.0.0',
        'iOS 17.0'
      )

      await vi.advanceTimersByTimeAsync(1001)

      const [, options] = mockFetch.mock.calls[0]
      const body = JSON.parse(options.body)

      expect(body.appVersion).toBe('1.0.0')
      expect(body.osVersion).toBe('iOS 17.0')
    })

    it('handles race condition where all events fire during timeout', async () => {
      startHealthMonitoring(
        { events: ['app_ready', 'home_loaded'], windowMs: 1000 },
        'release-123',
        'device-456',
        'https://api.bundlenudge.com',
        'token'
      )

      // Fire events just before timeout
      vi.advanceTimersByTime(999)
      reportHealthEvent('app_ready')
      reportHealthEvent('home_loaded')

      // Monitoring should have stopped
      expect(isHealthMonitoringActive()).toBe(false)

      // Wait past timeout
      await vi.advanceTimersByTimeAsync(100)

      // No network call
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('reports all events as missing if none fire', async () => {
      startHealthMonitoring(
        { events: ['app_ready', 'home_loaded', 'data_loaded'], windowMs: 1000 },
        'release-123',
        'device-456',
        'https://api.bundlenudge.com',
        'token'
      )

      // Don't fire any events
      await vi.advanceTimersByTimeAsync(1001)

      const [, options] = mockFetch.mock.calls[0]
      const body = JSON.parse(options.body)

      expect(body.missingEvents).toHaveLength(3)
      expect(body.missingEvents).toContain('app_ready')
      expect(body.missingEvents).toContain('home_loaded')
      expect(body.missingEvents).toContain('data_loaded')
    })
  })
})
