import { describe, it, expect } from 'vitest'

import { app } from './index'

interface HealthResponse {
  status: string
  service?: string
}

interface ErrorResponse {
  error: string
}

describe('API', () => {
  describe('health endpoints', () => {
    it('returns ok status at root', async () => {
      const res = await app.request('/')
      expect(res.status).toBe(200)

      const json: HealthResponse = await res.json()
      expect(json.status).toBe('ok')
      expect(json.service).toBe('bundlenudge-api')
    })

    it('returns healthy at /health', async () => {
      const res = await app.request('/health')
      expect(res.status).toBe(200)

      const json: HealthResponse = await res.json()
      expect(json.status).toBe('healthy')
    })
  })

  describe('404 handling', () => {
    it('returns 404 for unknown routes', async () => {
      const res = await app.request('/unknown-route')
      expect(res.status).toBe(404)

      const json: ErrorResponse = await res.json()
      expect(json.error).toBe('not_found')
    })
  })
})
