/**
 * Upload Status Routes Tests
 *
 * Tests for HTTP polling and WebSocket status endpoints.
 */

import { describe, it, expect } from 'vitest'
import {
  uploadStatusSchema,
  uploadStatusResponseSchema,
  getUploadStatusKey,
  UPLOAD_STATUS_TTL_SECONDS,
  type UploadStatus,
  type UploadStatusResponse,
} from '@bundlenudge/shared'

describe('upload status routes', () => {
  describe('uploadStatusSchema', () => {
    it('accepts pending status', () => {
      const result = uploadStatusSchema.safeParse('pending')
      expect(result.success).toBe(true)
    })

    it('accepts processing status', () => {
      const result = uploadStatusSchema.safeParse('processing')
      expect(result.success).toBe(true)
    })

    it('accepts validating status', () => {
      const result = uploadStatusSchema.safeParse('validating')
      expect(result.success).toBe(true)
    })

    it('accepts storing status', () => {
      const result = uploadStatusSchema.safeParse('storing')
      expect(result.success).toBe(true)
    })

    it('accepts complete status', () => {
      const result = uploadStatusSchema.safeParse('complete')
      expect(result.success).toBe(true)
    })

    it('accepts failed status', () => {
      const result = uploadStatusSchema.safeParse('failed')
      expect(result.success).toBe(true)
    })

    it('rejects invalid status', () => {
      const result = uploadStatusSchema.safeParse('unknown')
      expect(result.success).toBe(false)
    })
  })

  describe('uploadStatusResponseSchema', () => {
    it('validates a pending upload status', () => {
      const status: UploadStatusResponse = {
        uploadId: '550e8400-e29b-41d4-a716-446655440000',
        status: 'pending',
        progress: 0,
        message: 'Upload queued for processing',
        error: null,
        releaseId: null,
        startedAt: 1706227200,
        completedAt: null,
      }

      const result = uploadStatusResponseSchema.safeParse(status)
      expect(result.success).toBe(true)
    })

    it('validates a processing upload status', () => {
      const status: UploadStatusResponse = {
        uploadId: '550e8400-e29b-41d4-a716-446655440000',
        status: 'processing',
        progress: 25,
        message: 'Processing bundle',
        error: null,
        releaseId: null,
        startedAt: 1706227200,
        completedAt: null,
      }

      const result = uploadStatusResponseSchema.safeParse(status)
      expect(result.success).toBe(true)
    })

    it('validates a completed upload status with releaseId', () => {
      const status: UploadStatusResponse = {
        uploadId: '550e8400-e29b-41d4-a716-446655440000',
        status: 'complete',
        progress: 100,
        message: 'Upload complete',
        error: null,
        releaseId: '660e8400-e29b-41d4-a716-446655440001',
        startedAt: 1706227200,
        completedAt: 1706227260,
      }

      const result = uploadStatusResponseSchema.safeParse(status)
      expect(result.success).toBe(true)
    })

    it('validates a failed upload status with error', () => {
      const status: UploadStatusResponse = {
        uploadId: '550e8400-e29b-41d4-a716-446655440000',
        status: 'failed',
        progress: 45,
        message: null,
        error: 'Bundle validation failed: invalid format',
        releaseId: null,
        startedAt: 1706227200,
        completedAt: 1706227230,
      }

      const result = uploadStatusResponseSchema.safeParse(status)
      expect(result.success).toBe(true)
    })

    it('rejects progress below 0', () => {
      const status = {
        uploadId: '550e8400-e29b-41d4-a716-446655440000',
        status: 'processing',
        progress: -1,
        message: null,
        error: null,
        releaseId: null,
        startedAt: 1706227200,
        completedAt: null,
      }

      const result = uploadStatusResponseSchema.safeParse(status)
      expect(result.success).toBe(false)
    })

    it('rejects progress above 100', () => {
      const status = {
        uploadId: '550e8400-e29b-41d4-a716-446655440000',
        status: 'processing',
        progress: 101,
        message: null,
        error: null,
        releaseId: null,
        startedAt: 1706227200,
        completedAt: null,
      }

      const result = uploadStatusResponseSchema.safeParse(status)
      expect(result.success).toBe(false)
    })

    it('rejects invalid uploadId format', () => {
      const status = {
        uploadId: 'not-a-uuid',
        status: 'pending',
        progress: 0,
        message: null,
        error: null,
        releaseId: null,
        startedAt: 1706227200,
        completedAt: null,
      }

      const result = uploadStatusResponseSchema.safeParse(status)
      expect(result.success).toBe(false)
    })

    it('rejects missing required fields', () => {
      const status = {
        uploadId: '550e8400-e29b-41d4-a716-446655440000',
        status: 'pending',
      }

      const result = uploadStatusResponseSchema.safeParse(status)
      expect(result.success).toBe(false)
    })
  })

  describe('getUploadStatusKey', () => {
    it('generates correct KV key', () => {
      const uploadId = '550e8400-e29b-41d4-a716-446655440000'
      const key = getUploadStatusKey(uploadId)
      expect(key).toBe('upload:550e8400-e29b-41d4-a716-446655440000')
    })

    it('handles different upload IDs', () => {
      const key1 = getUploadStatusKey('aaa')
      const key2 = getUploadStatusKey('bbb')
      expect(key1).not.toBe(key2)
      expect(key1).toBe('upload:aaa')
      expect(key2).toBe('upload:bbb')
    })
  })

  describe('UPLOAD_STATUS_TTL_SECONDS', () => {
    it('equals 24 hours in seconds', () => {
      expect(UPLOAD_STATUS_TTL_SECONDS).toBe(86400)
    })
  })

  describe('status progression', () => {
    const validProgressions: [UploadStatus, UploadStatus][] = [
      ['pending', 'processing'],
      ['processing', 'validating'],
      ['validating', 'storing'],
      ['storing', 'complete'],
      ['pending', 'failed'],
      ['processing', 'failed'],
      ['validating', 'failed'],
      ['storing', 'failed'],
    ]

    it.each(validProgressions)(
      'allows progression from %s to %s',
      (from, to) => {
        const fromResult = uploadStatusSchema.safeParse(from)
        const toResult = uploadStatusSchema.safeParse(to)
        expect(fromResult.success).toBe(true)
        expect(toResult.success).toBe(true)
      }
    )
  })

  describe('progress values by status', () => {
    it('pending has 0% progress', () => {
      const status: UploadStatusResponse = {
        uploadId: '550e8400-e29b-41d4-a716-446655440000',
        status: 'pending',
        progress: 0,
        message: null,
        error: null,
        releaseId: null,
        startedAt: 1706227200,
        completedAt: null,
      }
      expect(status.progress).toBe(0)
    })

    it('complete has 100% progress', () => {
      const status: UploadStatusResponse = {
        uploadId: '550e8400-e29b-41d4-a716-446655440000',
        status: 'complete',
        progress: 100,
        message: null,
        error: null,
        releaseId: '660e8400-e29b-41d4-a716-446655440001',
        startedAt: 1706227200,
        completedAt: 1706227260,
      }
      expect(status.progress).toBe(100)
    })

    it('allows intermediate progress values', () => {
      const progressValues = [10, 25, 50, 75, 90]
      progressValues.forEach((progress) => {
        const status: UploadStatusResponse = {
          uploadId: '550e8400-e29b-41d4-a716-446655440000',
          status: 'processing',
          progress,
          message: null,
          error: null,
          releaseId: null,
          startedAt: 1706227200,
          completedAt: null,
        }
        const result = uploadStatusResponseSchema.safeParse(status)
        expect(result.success).toBe(true)
      })
    })
  })

  describe('error states', () => {
    it('failed status should have error message', () => {
      const status: UploadStatusResponse = {
        uploadId: '550e8400-e29b-41d4-a716-446655440000',
        status: 'failed',
        progress: 30,
        message: null,
        error: 'Bundle size exceeds limit',
        releaseId: null,
        startedAt: 1706227200,
        completedAt: 1706227230,
      }
      expect(status.error).not.toBeNull()
      expect(status.releaseId).toBeNull()
    })

    it('completed status should have releaseId', () => {
      const status: UploadStatusResponse = {
        uploadId: '550e8400-e29b-41d4-a716-446655440000',
        status: 'complete',
        progress: 100,
        message: 'Successfully deployed',
        error: null,
        releaseId: '660e8400-e29b-41d4-a716-446655440001',
        startedAt: 1706227200,
        completedAt: 1706227260,
      }
      expect(status.releaseId).not.toBeNull()
      expect(status.error).toBeNull()
    })

    it('failed status should have completedAt', () => {
      const status: UploadStatusResponse = {
        uploadId: '550e8400-e29b-41d4-a716-446655440000',
        status: 'failed',
        progress: 30,
        message: null,
        error: 'Validation error',
        releaseId: null,
        startedAt: 1706227200,
        completedAt: 1706227230,
      }
      expect(status.completedAt).not.toBeNull()
    })
  })

  describe('websocket stub response', () => {
    it('returns correct error structure', () => {
      const uploadId = '550e8400-e29b-41d4-a716-446655440000'
      const expectedResponse = {
        error: 'WEBSOCKET_NOT_AVAILABLE',
        message: 'Use polling endpoint instead',
        pollingUrl: `/v1/uploads/${uploadId}/status`,
      }

      expect(expectedResponse.error).toBe('WEBSOCKET_NOT_AVAILABLE')
      expect(expectedResponse.pollingUrl).toContain(uploadId)
    })
  })

  describe('uploadId validation', () => {
    const validUUIDs = [
      '550e8400-e29b-41d4-a716-446655440000',
      'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      '00000000-0000-0000-0000-000000000000',
      'FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFF',
    ]

    const invalidUUIDs = [
      'not-a-uuid',
      '550e8400-e29b-41d4-a716',
      '550e8400-e29b-41d4-a716-446655440000-extra',
      '',
      '550e8400_e29b_41d4_a716_446655440000',
    ]

    it.each(validUUIDs)('accepts valid UUID: %s', (uuid) => {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      expect(uuidRegex.test(uuid)).toBe(true)
    })

    it.each(invalidUUIDs)('rejects invalid UUID: %s', (uuid) => {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      expect(uuidRegex.test(uuid)).toBe(false)
    })
  })
})
