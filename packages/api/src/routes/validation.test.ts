/**
 * @agent fix-validation
 * @modified 2026-01-25
 *
 * Validation Tests
 *
 * Tests for request validation across all API routes.
 * Covers body size limits, malformed JSON, and missing required fields.
 */

import { describe, it, expect } from 'vitest'
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import {
  createBodySizeMiddleware,
  DEFAULT_BODY_SIZE_LIMIT,
  BUNDLE_UPLOAD_SIZE_LIMIT,
} from '../middleware/body-size'

describe('API validation', () => {
  describe('body size limits', () => {
    it('rejects payloads over 1MB with 413 status', async () => {
      const app = new Hono()
      app.use('*', createBodySizeMiddleware(DEFAULT_BODY_SIZE_LIMIT))
      app.post('/test', (c) => c.json({ success: true }))

      // Create a payload slightly over 1MB
      const oversizedPayload = 'x'.repeat(DEFAULT_BODY_SIZE_LIMIT + 1)

      const res = await app.request('/test', {
        method: 'POST',
        body: oversizedPayload,
        headers: {
          'Content-Type': 'text/plain',
          'Content-Length': oversizedPayload.length.toString(),
        },
      })

      expect(res.status).toBe(413)
      const body = (await res.json())
      expect(body.error).toBe('PAYLOAD_TOO_LARGE')
    })

    it('accepts payloads under 1MB limit', async () => {
      const app = new Hono()
      app.use('*', createBodySizeMiddleware(DEFAULT_BODY_SIZE_LIMIT))
      app.post('/test', (c) => c.json({ success: true }))

      // Create a small payload
      const smallPayload = JSON.stringify({ data: 'small' })

      const res = await app.request('/test', {
        method: 'POST',
        body: smallPayload,
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': smallPayload.length.toString(),
        },
      })

      expect(res.status).toBe(200)
    })

    it('allows up to 50MB for bundle uploads', async () => {
      const app = new Hono()
      app.use('*', createBodySizeMiddleware(BUNDLE_UPLOAD_SIZE_LIMIT))
      app.post('/test', (c) => c.json({ success: true }))

      // Create a 10MB payload (under 50MB limit but over 1MB)
      const largePayload = 'x'.repeat(10 * 1024 * 1024)

      const res = await app.request('/test', {
        method: 'POST',
        body: largePayload,
        headers: {
          'Content-Type': 'application/octet-stream',
          'Content-Length': largePayload.length.toString(),
        },
      })

      expect(res.status).toBe(200)
    })

    it('rejects bundle uploads over 50MB with 413', async () => {
      const app = new Hono()
      app.use('*', createBodySizeMiddleware(BUNDLE_UPLOAD_SIZE_LIMIT))
      app.post('/test', (c) => c.json({ success: true }))

      // Just check header-based rejection (avoid actually allocating 51MB)
      const res = await app.request('/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/octet-stream',
          'Content-Length': (BUNDLE_UPLOAD_SIZE_LIMIT + 1).toString(),
        },
        body: 'x', // Small body, but header claims large size
      })

      expect(res.status).toBe(413)
      const body = (await res.json())
      expect(body.error).toBe('PAYLOAD_TOO_LARGE')
      expect(body.maxBytes).toBe(BUNDLE_UPLOAD_SIZE_LIMIT)
    })
  })

  describe('malformed JSON rejection', () => {
    it('rejects invalid JSON with 400 status', async () => {
      const schema = z.object({ name: z.string() })
      const app = new Hono()
      app.post('/test', zValidator('json', schema), (c) => {
        return c.json({ success: true })
      })

      const res = await app.request('/test', {
        method: 'POST',
        body: 'not valid json{{{',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      expect(res.status).toBe(400)
    })

    it('rejects empty body when JSON expected', async () => {
      const schema = z.object({ name: z.string() })
      const app = new Hono()
      app.post('/test', zValidator('json', schema), (c) => {
        return c.json({ success: true })
      })

      const res = await app.request('/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      expect(res.status).toBe(400)
    })
  })

  describe('missing required fields rejection', () => {
    it('rejects request missing required string field', async () => {
      const schema = z.object({
        name: z.string(),
        email: z.string().email(),
      })
      const app = new Hono()
      app.post('/test', zValidator('json', schema), (c) => {
        return c.json({ success: true })
      })

      const res = await app.request('/test', {
        method: 'POST',
        body: JSON.stringify({ name: 'test' }), // missing email
        headers: {
          'Content-Type': 'application/json',
        },
      })

      expect(res.status).toBe(400)
    })

    it('rejects request missing required UUID field', async () => {
      const schema = z.object({
        appId: z.string().uuid(),
        deviceId: z.string(),
      })
      const app = new Hono()
      app.post('/test', zValidator('json', schema), (c) => {
        return c.json({ success: true })
      })

      const res = await app.request('/test', {
        method: 'POST',
        body: JSON.stringify({ deviceId: 'device-123' }), // missing appId
        headers: {
          'Content-Type': 'application/json',
        },
      })

      expect(res.status).toBe(400)
    })

    it('rejects request with invalid UUID format', async () => {
      const schema = z.object({
        appId: z.string().uuid(),
      })
      const app = new Hono()
      app.post('/test', zValidator('json', schema), (c) => {
        return c.json({ success: true })
      })

      const res = await app.request('/test', {
        method: 'POST',
        body: JSON.stringify({ appId: 'not-a-valid-uuid' }),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      expect(res.status).toBe(400)
    })

    it('rejects request with invalid enum value', async () => {
      const schema = z.object({
        platform: z.enum(['ios', 'android']),
      })
      const app = new Hono()
      app.post('/test', zValidator('json', schema), (c) => {
        return c.json({ success: true })
      })

      const res = await app.request('/test', {
        method: 'POST',
        body: JSON.stringify({ platform: 'windows' }),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      expect(res.status).toBe(400)
    })
  })

  describe('validation error response format', () => {
    it('includes validation details in error response', async () => {
      const schema = z.object({
        name: z.string().min(1),
        count: z.number().positive(),
      })
      const app = new Hono()
      app.post('/test', zValidator('json', schema), (c) => {
        return c.json({ success: true })
      })

      const res = await app.request('/test', {
        method: 'POST',
        body: JSON.stringify({ name: '', count: -5 }),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      expect(res.status).toBe(400)
      const body = (await res.json())
      expect(body.success).toBe(false)
    })
  })

  describe('string length validation', () => {
    it('rejects strings exceeding max length', async () => {
      const schema = z.object({
        message: z.string().max(100),
      })
      const app = new Hono()
      app.post('/test', zValidator('json', schema), (c) => {
        return c.json({ success: true })
      })

      const res = await app.request('/test', {
        method: 'POST',
        body: JSON.stringify({ message: 'x'.repeat(101) }),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      expect(res.status).toBe(400)
    })

    it('rejects empty strings when min length required', async () => {
      const schema = z.object({
        name: z.string().min(1),
      })
      const app = new Hono()
      app.post('/test', zValidator('json', schema), (c) => {
        return c.json({ success: true })
      })

      const res = await app.request('/test', {
        method: 'POST',
        body: JSON.stringify({ name: '' }),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      expect(res.status).toBe(400)
    })
  })

  describe('numeric validation', () => {
    it('rejects number outside valid range', async () => {
      const schema = z.object({
        percentage: z.number().min(0).max(100),
      })
      const app = new Hono()
      app.post('/test', zValidator('json', schema), (c) => {
        return c.json({ success: true })
      })

      const res = await app.request('/test', {
        method: 'POST',
        body: JSON.stringify({ percentage: 150 }),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      expect(res.status).toBe(400)
    })

    it('rejects negative number when positive required', async () => {
      const schema = z.object({
        size: z.number().positive(),
      })
      const app = new Hono()
      app.post('/test', zValidator('json', schema), (c) => {
        return c.json({ success: true })
      })

      const res = await app.request('/test', {
        method: 'POST',
        body: JSON.stringify({ size: -10 }),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      expect(res.status).toBe(400)
    })
  })

  describe('array validation', () => {
    it('rejects array exceeding max length', async () => {
      const schema = z.object({
        events: z.array(z.string()).max(10),
      })
      const app = new Hono()
      app.post('/test', zValidator('json', schema), (c) => {
        return c.json({ success: true })
      })

      const res = await app.request('/test', {
        method: 'POST',
        body: JSON.stringify({ events: Array(11).fill('event') }),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      expect(res.status).toBe(400)
    })

    it('rejects empty array when min length required', async () => {
      const schema = z.object({
        items: z.array(z.string()).min(1),
      })
      const app = new Hono()
      app.post('/test', zValidator('json', schema), (c) => {
        return c.json({ success: true })
      })

      const res = await app.request('/test', {
        method: 'POST',
        body: JSON.stringify({ items: [] }),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      expect(res.status).toBe(400)
    })
  })
})
