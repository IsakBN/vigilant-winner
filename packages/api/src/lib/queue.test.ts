/**
 * Queue utility tests
 * @agent queue-system
 */

import { describe, it, expect, vi } from 'vitest'
import { getUserPriority, getQueueForPriority, enqueueBuild, moveToDeadLetter } from './queue'
import type { Env, BuildJobMessage } from '../types/env'

// =============================================================================
// Mocks
// =============================================================================

function createMockDb(planName: string | null): D1Database {
  return {
    prepare: vi.fn().mockReturnValue({
      bind: vi.fn().mockReturnThis(),
      first: vi.fn().mockResolvedValue(planName ? { plan_name: planName } : null),
    }),
  } as unknown as D1Database
}

function createMockEnv(queueMocks: Record<string, { send: ReturnType<typeof vi.fn> }>): Env {
  return {
    DB: createMockDb('pro'),
    BUILD_QUEUE_P0: queueMocks.p0,
    BUILD_QUEUE_P1: queueMocks.p1,
    BUILD_QUEUE_P2: queueMocks.p2,
    BUILD_QUEUE_P3: queueMocks.p3,
    BUILD_QUEUE_DLQ: queueMocks.dlq,
  } as unknown as Env
}

// =============================================================================
// Tests
// =============================================================================

describe('Queue Utilities', () => {
  describe('getUserPriority', () => {
    it('should return 0 for enterprise users', async () => {
      const mockDb = createMockDb('enterprise')
      const priority = await getUserPriority(mockDb, 'user-123')
      expect(priority).toBe(0)
    })

    it('should return 0 for Enterprise users (capital E)', async () => {
      const mockDb = createMockDb('Enterprise')
      const priority = await getUserPriority(mockDb, 'user-123')
      expect(priority).toBe(0)
    })

    it('should return 1 for team users', async () => {
      const mockDb = createMockDb('team')
      const priority = await getUserPriority(mockDb, 'user-123')
      expect(priority).toBe(1)
    })

    it('should return 2 for pro users', async () => {
      const mockDb = createMockDb('pro')
      const priority = await getUserPriority(mockDb, 'user-123')
      expect(priority).toBe(2)
    })

    it('should return 3 for free users (no subscription)', async () => {
      const mockDb = createMockDb(null)
      const priority = await getUserPriority(mockDb, 'user-123')
      expect(priority).toBe(3)
    })

    it('should return 3 for unknown plan names', async () => {
      const mockDb = createMockDb('unknown-plan')
      const priority = await getUserPriority(mockDb, 'user-123')
      expect(priority).toBe(3)
    })

    it('should query active or trialing subscriptions', async () => {
      const prepareMock = vi.fn().mockReturnValue({
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue({ plan_name: 'pro' }),
      })

      const mockDb = {
        prepare: prepareMock,
      } as unknown as D1Database

      await getUserPriority(mockDb, 'user-123')

      const prepareCall = prepareMock.mock.calls[0]?.[0] as string | undefined
      expect(prepareCall).toContain("status IN ('active', 'trialing')")
    })
  })

  describe('getQueueForPriority', () => {
    const queueMocks = {
      p0: { send: vi.fn() },
      p1: { send: vi.fn() },
      p2: { send: vi.fn() },
      p3: { send: vi.fn() },
      dlq: { send: vi.fn() },
    }

    const mockEnv = createMockEnv(queueMocks)

    it('should return P0 queue for priority 0', () => {
      const queue = getQueueForPriority(mockEnv, 0)
      expect(queue).toBe(queueMocks.p0)
    })

    it('should return P1 queue for priority 1', () => {
      const queue = getQueueForPriority(mockEnv, 1)
      expect(queue).toBe(queueMocks.p1)
    })

    it('should return P2 queue for priority 2', () => {
      const queue = getQueueForPriority(mockEnv, 2)
      expect(queue).toBe(queueMocks.p2)
    })

    it('should return P3 queue for priority 3', () => {
      const queue = getQueueForPriority(mockEnv, 3)
      expect(queue).toBe(queueMocks.p3)
    })
  })

  describe('enqueueBuild', () => {
    it('should enqueue build to correct priority queue', async () => {
      const queueMocks = {
        p0: { send: vi.fn() },
        p1: { send: vi.fn() },
        p2: { send: vi.fn().mockResolvedValue(undefined) },
        p3: { send: vi.fn() },
        dlq: { send: vi.fn() },
      }

      const mockEnv = createMockEnv(queueMocks)

      const result = await enqueueBuild(
        mockEnv,
        'build-123',
        'ios',
        'app-456',
        'user-789'
      )

      expect(result.queued).toBe(true)
      expect(result.priority).toBe(2)
      expect(queueMocks.p2.send).toHaveBeenCalledWith(
        expect.objectContaining({
          buildId: 'build-123',
          buildType: 'ios',
          appId: 'app-456',
          priority: 2,
        })
      )
    })

    it('should include createdAt timestamp', async () => {
      const queueMocks = {
        p0: { send: vi.fn() },
        p1: { send: vi.fn() },
        p2: { send: vi.fn().mockResolvedValue(undefined) },
        p3: { send: vi.fn() },
        dlq: { send: vi.fn() },
      }

      const mockEnv = createMockEnv(queueMocks)

      const beforeTime = Date.now()
      await enqueueBuild(mockEnv, 'build-123', 'android', 'app-456', 'user-789')
      const afterTime = Date.now()

      const sendCall = queueMocks.p2.send.mock.calls[0]
      expect(sendCall).toBeDefined()
      if (sendCall) {
        const call = sendCall[0] as BuildJobMessage
        expect(call.createdAt).toBeGreaterThanOrEqual(beforeTime)
        expect(call.createdAt).toBeLessThanOrEqual(afterTime)
      }
    })
  })

  describe('moveToDeadLetter', () => {
    it('should move failed job to DLQ with error details', async () => {
      const queueMocks = {
        p0: { send: vi.fn() },
        p1: { send: vi.fn() },
        p2: { send: vi.fn() },
        p3: { send: vi.fn() },
        dlq: { send: vi.fn().mockResolvedValue(undefined) },
      }

      const mockEnv = createMockEnv(queueMocks)

      const originalMessage: BuildJobMessage = {
        buildId: 'build-123',
        buildType: 'ios',
        appId: 'app-456',
        priority: 2,
        createdAt: 1234567890,
      }

      const errorMessage = 'Build failed due to timeout'

      await moveToDeadLetter(mockEnv, originalMessage, errorMessage)

      const sendCall = queueMocks.dlq.send.mock.calls[0]
      expect(sendCall).toBeDefined()
      if (sendCall) {
        const sentMessage = sendCall[0] as BuildJobMessage & { error: string; failedAt: number }
        expect(sentMessage.buildId).toBe('build-123')
        expect(sentMessage.buildType).toBe('ios')
        expect(sentMessage.appId).toBe('app-456')
        expect(sentMessage.priority).toBe(2)
        expect(sentMessage.createdAt).toBe(1234567890)
        expect(sentMessage.error).toBe(errorMessage)
        expect(typeof sentMessage.failedAt).toBe('number')
      }
    })

    it('should include failedAt timestamp', async () => {
      const queueMocks = {
        p0: { send: vi.fn() },
        p1: { send: vi.fn() },
        p2: { send: vi.fn() },
        p3: { send: vi.fn() },
        dlq: { send: vi.fn().mockResolvedValue(undefined) },
      }

      const mockEnv = createMockEnv(queueMocks)

      const message: BuildJobMessage = {
        buildId: 'build-123',
        buildType: 'android',
        appId: 'app-456',
        priority: 1,
        createdAt: 1234567890,
      }

      const beforeTime = Date.now()
      await moveToDeadLetter(mockEnv, message, 'Test error')
      const afterTime = Date.now()

      const sendCall = queueMocks.dlq.send.mock.calls[0]
      expect(sendCall).toBeDefined()
      if (sendCall) {
        const call = sendCall[0] as BuildJobMessage & { failedAt: number }
        expect(call.failedAt).toBeGreaterThanOrEqual(beforeTime)
        expect(call.failedAt).toBeLessThanOrEqual(afterTime)
      }
    })
  })
})
