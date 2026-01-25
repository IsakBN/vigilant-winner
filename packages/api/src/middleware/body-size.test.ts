/**
 * @agent fix-validation
 * @modified 2026-01-25
 *
 * Tests for body size limit middleware
 */

import { describe, it, expect } from 'vitest'
import { Hono } from 'hono'
import {
  createBodySizeMiddleware,
  bodySizeLimit,
  bundleUploadSizeLimit,
  DEFAULT_BODY_SIZE_LIMIT,
  BUNDLE_UPLOAD_SIZE_LIMIT,
} from './body-size'

describe('body size middleware', () => {
  describe('constants', () => {
    it('has 1MB default limit', () => {
      expect(DEFAULT_BODY_SIZE_LIMIT).toBe(1 * 1024 * 1024)
    })

    it('has 50MB bundle upload limit', () => {
      expect(BUNDLE_UPLOAD_SIZE_LIMIT).toBe(50 * 1024 * 1024)
    })
  })

  describe('createBodySizeMiddleware', () => {
    it('allows requests under the limit', async () => {
      const app = new Hono()
      app.use('*', createBodySizeMiddleware(1024))
      app.post('/test', (c) => c.json({ success: true }))

      const smallPayload = JSON.stringify({ data: 'x'.repeat(100) })
      const res = await app.request('/test', {
        method: 'POST',
        body: smallPayload,
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': smallPayload.length.toString(),
        },
      })

      expect(res.status).toBe(200)
      const body = (await res.json())
      expect(body.success).toBe(true)
    })

    it('rejects requests over the limit via Content-Length header', async () => {
      const app = new Hono()
      app.use('*', createBodySizeMiddleware(100))
      app.post('/test', (c) => c.json({ success: true }))

      const res = await app.request('/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': '500',
        },
        body: 'x'.repeat(500),
      })

      expect(res.status).toBe(413)
      const body = (await res.json())
      expect(body.error).toBe('PAYLOAD_TOO_LARGE')
      expect(body.maxBytes).toBe(100)
    })

    it('allows GET requests regardless of size check', async () => {
      const app = new Hono()
      app.use('*', createBodySizeMiddleware(100))
      app.get('/test', (c) => c.json({ success: true }))

      const res = await app.request('/test', {
        method: 'GET',
      })

      expect(res.status).toBe(200)
    })

    it('rejects oversized POST requests', async () => {
      const app = new Hono()
      app.use('*', createBodySizeMiddleware(50))
      app.post('/test', (c) => c.json({ success: true }))

      const payload = 'x'.repeat(100)
      const res = await app.request('/test', {
        method: 'POST',
        body: payload,
        headers: {
          'Content-Type': 'text/plain',
          'Content-Length': payload.length.toString(),
        },
      })

      expect(res.status).toBe(413)
    })

    it('rejects oversized PUT requests', async () => {
      const app = new Hono()
      app.use('*', createBodySizeMiddleware(50))
      app.put('/test', (c) => c.json({ success: true }))

      const payload = 'x'.repeat(100)
      const res = await app.request('/test', {
        method: 'PUT',
        body: payload,
        headers: {
          'Content-Type': 'text/plain',
          'Content-Length': payload.length.toString(),
        },
      })

      expect(res.status).toBe(413)
    })

    it('rejects oversized PATCH requests', async () => {
      const app = new Hono()
      app.use('*', createBodySizeMiddleware(50))
      app.patch('/test', (c) => c.json({ success: true }))

      const payload = 'x'.repeat(100)
      const res = await app.request('/test', {
        method: 'PATCH',
        body: payload,
        headers: {
          'Content-Type': 'text/plain',
          'Content-Length': payload.length.toString(),
        },
      })

      expect(res.status).toBe(413)
    })
  })

  describe('pre-configured middlewares', () => {
    it('bodySizeLimit is a function', () => {
      expect(typeof bodySizeLimit).toBe('function')
    })

    it('bundleUploadSizeLimit is a function', () => {
      expect(typeof bundleUploadSizeLimit).toBe('function')
    })
  })

  describe('error response structure', () => {
    it('returns proper error structure for oversized payload', async () => {
      const app = new Hono()
      app.use('*', createBodySizeMiddleware(10))
      app.post('/test', (c) => c.json({ success: true }))

      const payload = 'x'.repeat(100)
      const res = await app.request('/test', {
        method: 'POST',
        body: payload,
        headers: {
          'Content-Type': 'text/plain',
          'Content-Length': payload.length.toString(),
        },
      })

      expect(res.status).toBe(413)
      const body = await res.json()

      expect(body).toHaveProperty('error', 'PAYLOAD_TOO_LARGE')
      expect(body).toHaveProperty('message', 'Request body exceeds maximum allowed size')
      expect(body).toHaveProperty('maxBytes', 10)
    })
  })

  describe('edge cases', () => {
    it('allows request exactly at the limit', async () => {
      const limit = 100
      const app = new Hono()
      app.use('*', createBodySizeMiddleware(limit))
      app.post('/test', (c) => c.json({ success: true }))

      const payload = 'x'.repeat(limit)
      const res = await app.request('/test', {
        method: 'POST',
        body: payload,
        headers: {
          'Content-Type': 'text/plain',
          'Content-Length': payload.length.toString(),
        },
      })

      expect(res.status).toBe(200)
    })

    it('allows empty body', async () => {
      const app = new Hono()
      app.use('*', createBodySizeMiddleware(100))
      app.post('/test', (c) => c.json({ success: true }))

      const res = await app.request('/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': '0',
        },
      })

      expect(res.status).toBe(200)
    })
  })
})
