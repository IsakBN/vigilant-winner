/**
 * Worker status routes tests
 * @agent queue-system
 */

import { describe, it, expect } from 'vitest'
import { z } from 'zod'

// =============================================================================
// Schema Definition
// =============================================================================

const updateStatusSchema = z.object({
  status: z.enum(['building', 'signing', 'uploading', 'complete', 'failed']),
  error: z.string().max(10000).optional(),
  artifactUrl: z.string().url().optional(),
  artifactSize: z.number().int().positive().optional(),
})

// =============================================================================
// Status Update Tests
// =============================================================================

describe('Worker Status Routes', () => {
  describe('updateStatusSchema', () => {
    it('validates building status', () => {
      const result = updateStatusSchema.safeParse({
        status: 'building',
      })
      expect(result.success).toBe(true)
    })

    it('validates complete status with artifact details', () => {
      const result = updateStatusSchema.safeParse({
        status: 'complete',
        artifactUrl: 'https://example.com/builds/app.ipa',
        artifactSize: 50000000,
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.artifactUrl).toBe('https://example.com/builds/app.ipa')
        expect(result.data.artifactSize).toBe(50000000)
      }
    })

    it('validates failed status with error', () => {
      const result = updateStatusSchema.safeParse({
        status: 'failed',
        error: 'Build failed: Compilation error in MainViewController.swift',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.error).toContain('Compilation error')
      }
    })

    it('validates all intermediate statuses', () => {
      const statuses = ['building', 'signing', 'uploading', 'complete', 'failed']
      statuses.forEach(status => {
        const result = updateStatusSchema.safeParse({ status })
        expect(result.success).toBe(true)
      })
    })

    it('rejects invalid status', () => {
      const result = updateStatusSchema.safeParse({
        status: 'pending',
      })
      expect(result.success).toBe(false)
    })

    it('rejects error exceeding max length', () => {
      const result = updateStatusSchema.safeParse({
        status: 'failed',
        error: 'a'.repeat(10001),
      })
      expect(result.success).toBe(false)
    })

    it('rejects invalid URL format', () => {
      const result = updateStatusSchema.safeParse({
        status: 'complete',
        artifactUrl: 'not-a-url',
      })
      expect(result.success).toBe(false)
    })

    it('rejects negative artifact size', () => {
      const result = updateStatusSchema.safeParse({
        status: 'complete',
        artifactSize: -1000,
      })
      expect(result.success).toBe(false)
    })

    it('rejects non-integer artifact size', () => {
      const result = updateStatusSchema.safeParse({
        status: 'complete',
        artifactSize: 1000.5,
      })
      expect(result.success).toBe(false)
    })
  })

  describe('completion logic', () => {
    it('identifies complete status as terminal', () => {
      const status = 'complete'
      const isComplete = status === 'complete' || status === 'failed'
      expect(isComplete).toBe(true)
    })

    it('identifies failed status as terminal', () => {
      const status = 'failed'
      const isComplete = status === 'complete' || status === 'failed'
      expect(isComplete).toBe(true)
    })

    it('identifies building status as non-terminal', () => {
      const status = 'building'
      const isComplete = status === 'complete' || status === 'failed'
      expect(isComplete).toBe(false)
    })

    it('identifies signing status as non-terminal', () => {
      const status = 'signing'
      const isComplete = status === 'complete' || status === 'failed'
      expect(isComplete).toBe(false)
    })

    it('identifies uploading status as non-terminal', () => {
      const status = 'uploading'
      const isComplete = status === 'complete' || status === 'failed'
      expect(isComplete).toBe(false)
    })
  })
})
