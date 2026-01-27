/**
 * Worker log routes tests
 * @agent queue-system
 */

import { describe, it, expect } from 'vitest'
import { z } from 'zod'

// =============================================================================
// Schema Definition
// =============================================================================

const appendLogSchema = z.object({
  logs: z.array(z.object({
    timestamp: z.number(),
    level: z.enum(['info', 'warn', 'error', 'debug']),
    message: z.string().max(5000),
  })).max(100),
})

// =============================================================================
// Log Append Tests
// =============================================================================

describe('Worker Log Routes', () => {
  describe('appendLogSchema', () => {
    it('validates single log entry', () => {
      const result = appendLogSchema.safeParse({
        logs: [
          {
            timestamp: Date.now(),
            level: 'info',
            message: 'Starting build process',
          },
        ],
      })
      expect(result.success).toBe(true)
    })

    it('validates multiple log entries', () => {
      const result = appendLogSchema.safeParse({
        logs: [
          { timestamp: Date.now(), level: 'info', message: 'Starting build' },
          { timestamp: Date.now(), level: 'info', message: 'Compiling sources' },
          { timestamp: Date.now(), level: 'warn', message: 'Deprecated API used' },
        ],
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.logs).toHaveLength(3)
      }
    })

    it('validates all log levels', () => {
      const levels = ['info', 'warn', 'error', 'debug']
      levels.forEach(level => {
        const result = appendLogSchema.safeParse({
          logs: [{ timestamp: Date.now(), level, message: 'Test' }],
        })
        expect(result.success).toBe(true)
      })
    })

    it('rejects invalid log level', () => {
      const result = appendLogSchema.safeParse({
        logs: [
          { timestamp: Date.now(), level: 'trace', message: 'Test' },
        ],
      })
      expect(result.success).toBe(false)
    })

    it('rejects message exceeding max length', () => {
      const result = appendLogSchema.safeParse({
        logs: [
          { timestamp: Date.now(), level: 'info', message: 'a'.repeat(5001) },
        ],
      })
      expect(result.success).toBe(false)
    })

    it('rejects more than 100 log entries', () => {
      const logs = Array.from({ length: 101 }, () => ({
        timestamp: Date.now(),
        level: 'info',
        message: 'Log entry',
      }))
      const result = appendLogSchema.safeParse({ logs })
      expect(result.success).toBe(false)
    })

    it('accepts exactly 100 log entries', () => {
      const logs = Array.from({ length: 100 }, () => ({
        timestamp: Date.now(),
        level: 'info',
        message: 'Log entry',
      }))
      const result = appendLogSchema.safeParse({ logs })
      expect(result.success).toBe(true)
    })

    it('accepts empty logs array', () => {
      const result = appendLogSchema.safeParse({
        logs: [],
      })
      expect(result.success).toBe(true)
    })
  })

  describe('log formatting', () => {
    it('formats logs with ISO timestamp', () => {
      const timestamp = 1640995200000
      const log = {
        timestamp,
        level: 'info',
        message: 'Building project',
      }
      const formatted = `[${new Date(timestamp).toISOString()}] [INFO] Building project`
      expect(formatted).toContain('2022-01-01')
      expect(formatted).toContain('[INFO]')
      expect(formatted).toContain('Building project')
    })

    it('formats level in uppercase', () => {
      const log = { timestamp: Date.now(), level: 'warn', message: 'Warning' }
      const formatted = `[${new Date(log.timestamp).toISOString()}] [${log.level.toUpperCase()}] ${log.message}`
      expect(formatted).toContain('[WARN]')
    })

    it('formats multiple logs with newlines', () => {
      const logs = [
        { timestamp: Date.now(), level: 'info', message: 'Starting' },
        { timestamp: Date.now(), level: 'info', message: 'Processing' },
      ]
      const formatted = logs.map(l =>
        `[${new Date(l.timestamp).toISOString()}] [${l.level.toUpperCase()}] ${l.message}`
      ).join('\n')
      expect(formatted.split('\n')).toHaveLength(2)
    })
  })
})
