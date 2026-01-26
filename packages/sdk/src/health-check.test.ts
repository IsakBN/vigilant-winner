/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/**
 * Endpoint Health Check Tests
 *
 * Tests for HTTP endpoint verification with retry logic,
 * timeout handling, and fire-and-forget reporting.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  createHealthCheckService,
  DEFAULT_TIMEOUT_MS,
  DEFAULT_RETRY_COUNT,
  DEFAULT_RETRY_DELAY_MS,
} from './health-check'
import type { EndpointHealthCheckConfig } from './health-check'

describe('health-check', () => {
  const mockFetch = vi.fn()

  beforeEach(() => {
    vi.useFakeTimers()
    global.fetch = mockFetch
    mockFetch.mockResolvedValue({ ok: true, status: 200 })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  const createService = (): ReturnType<typeof createHealthCheckService> =>
    createHealthCheckService({
      apiUrl: 'https://api.bundlenudge.com',
      appId: 'test-app',
      getAccessToken: () => 'test-token',
    })

  describe('verifyHealth', () => {
    it('returns passed=true when disabled', async () => {
      const service = createService()
      const result = await service.verifyHealth({ enabled: false, endpoints: [] })

      expect(result.passed).toBe(true)
      expect(result.results).toEqual([])
    })

    it('returns passed=true when no endpoints', async () => {
      const service = createService()
      const result = await service.verifyHealth({ enabled: true, endpoints: [] })

      expect(result.passed).toBe(true)
    })

    it('passes when endpoint returns expected status', async () => {
      mockFetch.mockResolvedValue({ status: 200, ok: true })

      const service = createService()
      const config: EndpointHealthCheckConfig = {
        enabled: true,
        endpoints: [
          {
            id: 'api-health',
            name: 'API Health',
            url: 'https://api.example.com/health',
            method: 'GET',
            expectedStatus: 200,
          },
        ],
      }

      const result = await service.verifyHealth(config)

      expect(result.passed).toBe(true)
      expect(result.results[0].status).toBe('pass')
      expect(result.results[0].responseStatus).toBe(200)
    })

    it('fails when endpoint returns unexpected status', async () => {
      mockFetch.mockResolvedValue({ status: 500, ok: false })

      const service = createService()
      const config: EndpointHealthCheckConfig = {
        enabled: true,
        endpoints: [
          {
            id: 'api-health',
            name: 'API Health',
            url: 'https://api.example.com/health',
            method: 'GET',
            expectedStatus: 200,
          },
        ],
        retryCount: 0, // No retries for this test
      }

      const result = await service.verifyHealth(config)

      expect(result.passed).toBe(false)
      expect(result.results[0].status).toBe('fail')
      expect(result.results[0].responseStatus).toBe(500)
    })

    it('checks multiple endpoints sequentially', async () => {
      mockFetch
        .mockResolvedValueOnce({ status: 200, ok: true })
        .mockResolvedValueOnce({ status: 200, ok: true })
        .mockResolvedValueOnce({ status: 200, ok: true })

      const service = createService()
      const config: EndpointHealthCheckConfig = {
        enabled: true,
        endpoints: [
          {
            id: 'endpoint-1',
            name: 'First',
            url: 'https://api.example.com/1',
            method: 'GET',
            expectedStatus: 200,
          },
          {
            id: 'endpoint-2',
            name: 'Second',
            url: 'https://api.example.com/2',
            method: 'GET',
            expectedStatus: 200,
          },
          {
            id: 'endpoint-3',
            name: 'Third',
            url: 'https://api.example.com/3',
            method: 'GET',
            expectedStatus: 200,
          },
        ],
        retryCount: 0,
      }

      const result = await service.verifyHealth(config)

      expect(result.passed).toBe(true)
      expect(result.results).toHaveLength(3)
      expect(mockFetch).toHaveBeenCalledTimes(3)
    })

    it('fails if any endpoint fails', async () => {
      mockFetch
        .mockResolvedValueOnce({ status: 200, ok: true })
        .mockResolvedValueOnce({ status: 500, ok: false })
        .mockResolvedValueOnce({ status: 200, ok: true })

      const service = createService()
      const config: EndpointHealthCheckConfig = {
        enabled: true,
        endpoints: [
          {
            id: 'endpoint-1',
            name: 'First',
            url: 'https://api.example.com/1',
            method: 'GET',
            expectedStatus: 200,
          },
          {
            id: 'endpoint-2',
            name: 'Second',
            url: 'https://api.example.com/2',
            method: 'GET',
            expectedStatus: 200,
          },
          {
            id: 'endpoint-3',
            name: 'Third',
            url: 'https://api.example.com/3',
            method: 'GET',
            expectedStatus: 200,
          },
        ],
        retryCount: 0,
      }

      const result = await service.verifyHealth(config)

      expect(result.passed).toBe(false)
      expect(result.results[1].status).toBe('fail')
    })
  })

  describe('retry logic', () => {
    it('retries failed requests', async () => {
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({ status: 200, ok: true })

      const service = createService()
      const config: EndpointHealthCheckConfig = {
        enabled: true,
        endpoints: [
          {
            id: 'api-health',
            name: 'API Health',
            url: 'https://api.example.com/health',
            method: 'GET',
            expectedStatus: 200,
          },
        ],
        retryCount: 3,
        retryDelayMs: 100,
      }

      const resultPromise = service.verifyHealth(config)

      // Advance through retry delays
      await vi.advanceTimersByTimeAsync(100) // First retry delay
      await vi.advanceTimersByTimeAsync(100) // Second retry delay

      const result = await resultPromise

      expect(result.passed).toBe(true)
      expect(result.results[0].retryCount).toBe(2) // Succeeded on third attempt
      expect(mockFetch).toHaveBeenCalledTimes(3)
    })

    it('fails after max retries', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))

      const service = createService()
      const config: EndpointHealthCheckConfig = {
        enabled: true,
        endpoints: [
          {
            id: 'api-health',
            name: 'API Health',
            url: 'https://api.example.com/health',
            method: 'GET',
            expectedStatus: 200,
          },
        ],
        retryCount: 2,
        retryDelayMs: 100,
      }

      const resultPromise = service.verifyHealth(config)

      // Advance through all retry delays
      await vi.advanceTimersByTimeAsync(100)
      await vi.advanceTimersByTimeAsync(100)

      const result = await resultPromise

      expect(result.passed).toBe(false)
      expect(result.results[0].status).toBe('error')
      expect(result.results[0].retryCount).toBe(2)
      expect(mockFetch).toHaveBeenCalledTimes(3) // Initial + 2 retries
    })

    it('does not retry on successful check', async () => {
      mockFetch.mockResolvedValue({ status: 200, ok: true })

      const service = createService()
      const config: EndpointHealthCheckConfig = {
        enabled: true,
        endpoints: [
          {
            id: 'api-health',
            name: 'API Health',
            url: 'https://api.example.com/health',
            method: 'GET',
            expectedStatus: 200,
          },
        ],
        retryCount: 3,
        retryDelayMs: 100,
      }

      const result = await service.verifyHealth(config)

      expect(result.passed).toBe(true)
      expect(result.results[0].retryCount).toBe(0)
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })
  })

  describe('timeout handling', () => {
    it('times out slow endpoints', async () => {
      // Mock AbortController and AbortError
      const abortError = new Error('Aborted')
      abortError.name = 'AbortError'

      mockFetch.mockImplementation(
        () =>
          new Promise((_, reject) => {
            // Simulate the abort signal triggering after timeout
            setTimeout(() => {
              reject(abortError)
            }, 5001)
          })
      )

      const service = createService()
      const config: EndpointHealthCheckConfig = {
        enabled: true,
        endpoints: [
          {
            id: 'slow-api',
            name: 'Slow API',
            url: 'https://api.example.com/slow',
            method: 'GET',
            expectedStatus: 200,
            timeoutMs: 5000,
          },
        ],
        retryCount: 0,
      }

      const resultPromise = service.verifyHealth(config)

      // Advance past timeout
      await vi.advanceTimersByTimeAsync(5001)

      const result = await resultPromise

      expect(result.passed).toBe(false)
      expect(result.results[0].status).toBe('timeout')
    })

    it('uses default timeout when not specified', async () => {
      mockFetch.mockResolvedValue({ status: 200, ok: true })

      const service = createService()
      const config: EndpointHealthCheckConfig = {
        enabled: true,
        endpoints: [
          {
            id: 'api-health',
            name: 'API Health',
            url: 'https://api.example.com/health',
            method: 'GET',
            expectedStatus: 200,
            // No timeoutMs specified - should use DEFAULT_TIMEOUT_MS
          },
        ],
        retryCount: 0,
      }

      await service.verifyHealth(config)

      // Verify it was called (timeout was set internally)
      expect(mockFetch).toHaveBeenCalled()
    })
  })

  describe('reportToServer', () => {
    it('sends report without blocking', async () => {
      const service = createService()
      const result = { passed: true, results: [], durationMs: 100 }

      // Should not throw or block
      service.reportToServer('release-123', 'device-456', result)

      // Verify fetch was called
      await vi.advanceTimersByTimeAsync(0)
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.bundlenudge.com/v1/health/endpoint-check',
        expect.objectContaining({ method: 'POST' })
      )
    })

    it('includes authorization header when token available', async () => {
      const service = createService()
      const result = { passed: true, results: [], durationMs: 100 }

      service.reportToServer('release-123', 'device-456', result)

      await vi.advanceTimersByTimeAsync(0)
      const [, options] = mockFetch.mock.calls[0]
      expect(options.headers.Authorization).toBe('Bearer test-token')
    })

    it('excludes authorization header when no token', async () => {
      const service = createHealthCheckService({
        apiUrl: 'https://api.bundlenudge.com',
        appId: 'test-app',
        getAccessToken: () => null,
      })
      const result = { passed: true, results: [], durationMs: 100 }

      service.reportToServer('release-123', 'device-456', result)

      await vi.advanceTimersByTimeAsync(0)
      const [, options] = mockFetch.mock.calls[0]
      expect(options.headers.Authorization).toBeUndefined()
    })

    it('ignores network errors (fire-and-forget)', () => {
      mockFetch.mockRejectedValue(new Error('Network error'))

      const service = createService()
      const result = { passed: true, results: [], durationMs: 100 }

      // Should not throw (fire-and-forget)
      service.reportToServer('release-123', 'device-456', result)
      // No assertion needed - test passes if no exception thrown
    })

    it('includes all required fields in report', async () => {
      const service = createService()
      const result = {
        passed: false,
        results: [
          {
            endpointId: 'api-health',
            status: 'fail' as const,
            responseStatus: 500,
            responseTimeMs: 150,
            retryCount: 2,
            errorMessage: 'Server error',
          },
        ],
        durationMs: 500,
      }

      service.reportToServer('release-123', 'device-456', result)

      await vi.advanceTimersByTimeAsync(0)
      const [, options] = mockFetch.mock.calls[0]
      const body = JSON.parse(options.body)

      expect(body.appId).toBe('test-app')
      expect(body.releaseId).toBe('release-123')
      expect(body.deviceId).toBe('device-456')
      expect(body.passed).toBe(false)
      expect(body.results).toHaveLength(1)
      expect(body.durationMs).toBe(500)
      expect(body.timestamp).toBeDefined()
    })
  })

  describe('default values', () => {
    it('has correct default timeout', () => {
      expect(DEFAULT_TIMEOUT_MS).toBe(10000)
    })

    it('has correct default retry count', () => {
      expect(DEFAULT_RETRY_COUNT).toBe(3)
    })

    it('has correct default retry delay', () => {
      expect(DEFAULT_RETRY_DELAY_MS).toBe(5000)
    })
  })

  describe('HTTP methods', () => {
    it('supports GET method', async () => {
      mockFetch.mockResolvedValue({ status: 200, ok: true })

      const service = createService()
      const config: EndpointHealthCheckConfig = {
        enabled: true,
        endpoints: [
          {
            id: 'get-endpoint',
            name: 'GET Endpoint',
            url: 'https://api.example.com/health',
            method: 'GET',
            expectedStatus: 200,
          },
        ],
        retryCount: 0,
      }

      await service.verifyHealth(config)

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/health',
        expect.objectContaining({ method: 'GET' })
      )
    })

    it('supports POST method with body', async () => {
      mockFetch.mockResolvedValue({ status: 201, ok: true })

      const service = createService()
      const config: EndpointHealthCheckConfig = {
        enabled: true,
        endpoints: [
          {
            id: 'post-endpoint',
            name: 'POST Endpoint',
            url: 'https://api.example.com/check',
            method: 'POST',
            body: JSON.stringify({ test: true }),
            expectedStatus: 201,
          },
        ],
        retryCount: 0,
      }

      await service.verifyHealth(config)

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/check',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ test: true }),
        })
      )
    })

    it('supports custom headers', async () => {
      mockFetch.mockResolvedValue({ status: 200, ok: true })

      const service = createService()
      const config: EndpointHealthCheckConfig = {
        enabled: true,
        endpoints: [
          {
            id: 'custom-headers',
            name: 'Custom Headers',
            url: 'https://api.example.com/health',
            method: 'GET',
            headers: {
              'X-Custom-Header': 'custom-value',
              'X-Another-Header': 'another-value',
            },
            expectedStatus: 200,
          },
        ],
        retryCount: 0,
      }

      await service.verifyHealth(config)

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/health',
        expect.objectContaining({
          headers: {
            'X-Custom-Header': 'custom-value',
            'X-Another-Header': 'another-value',
          },
        })
      )
    })
  })

  describe('edge cases', () => {
    it('handles empty response', async () => {
      mockFetch.mockResolvedValue({ status: 204, ok: true })

      const service = createService()
      const config: EndpointHealthCheckConfig = {
        enabled: true,
        endpoints: [
          {
            id: 'no-content',
            name: 'No Content',
            url: 'https://api.example.com/health',
            method: 'GET',
            expectedStatus: 204,
          },
        ],
        retryCount: 0,
      }

      const result = await service.verifyHealth(config)

      expect(result.passed).toBe(true)
      expect(result.results[0].status).toBe('pass')
      expect(result.results[0].responseStatus).toBe(204)
    })

    it('tracks response time for each endpoint', async () => {
      mockFetch.mockResolvedValue({ status: 200, ok: true })

      const service = createService()
      const config: EndpointHealthCheckConfig = {
        enabled: true,
        endpoints: [
          {
            id: 'api-health',
            name: 'API Health',
            url: 'https://api.example.com/health',
            method: 'GET',
            expectedStatus: 200,
          },
        ],
        retryCount: 0,
      }

      const result = await service.verifyHealth(config)

      expect(result.results[0].responseTimeMs).toBeGreaterThanOrEqual(0)
    })

    it('calculates total duration across all endpoints', async () => {
      mockFetch.mockResolvedValue({ status: 200, ok: true })

      const service = createService()
      const config: EndpointHealthCheckConfig = {
        enabled: true,
        endpoints: [
          {
            id: 'endpoint-1',
            name: 'First',
            url: 'https://api.example.com/1',
            method: 'GET',
            expectedStatus: 200,
          },
          {
            id: 'endpoint-2',
            name: 'Second',
            url: 'https://api.example.com/2',
            method: 'GET',
            expectedStatus: 200,
          },
        ],
        retryCount: 0,
      }

      const result = await service.verifyHealth(config)

      expect(result.durationMs).toBeGreaterThanOrEqual(0)
    })

    it('handles different expected status codes', async () => {
      mockFetch.mockResolvedValue({ status: 301, ok: false })

      const service = createService()
      const config: EndpointHealthCheckConfig = {
        enabled: true,
        endpoints: [
          {
            id: 'redirect',
            name: 'Redirect',
            url: 'https://api.example.com/old',
            method: 'GET',
            expectedStatus: 301, // Expecting redirect
          },
        ],
        retryCount: 0,
      }

      const result = await service.verifyHealth(config)

      expect(result.passed).toBe(true)
      expect(result.results[0].status).toBe('pass')
      expect(result.results[0].responseStatus).toBe(301)
    })
  })
})
