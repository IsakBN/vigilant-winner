import { describe, it, expect } from 'vitest'
import {
  generateSignature,
  verifySignature,
  WEBHOOK_EVENTS,
  type WebhookPayload,
} from './webhooks'

describe('webhooks', () => {
  describe('generateSignature', () => {
    it('generates consistent signature', async () => {
      const secret = 'whsec_test123'
      const timestamp = 1700000000
      const body = '{"event":"test"}'

      const sig1 = await generateSignature(secret, timestamp, body)
      const sig2 = await generateSignature(secret, timestamp, body)

      expect(sig1).toBe(sig2)
    })

    it('generates hex string', async () => {
      const signature = await generateSignature('secret', 1700000000, '{}')
      expect(signature).toMatch(/^[a-f0-9]{64}$/)
    })

    it('different timestamps produce different signatures', async () => {
      const secret = 'secret'
      const body = '{}'

      const sig1 = await generateSignature(secret, 1700000000, body)
      const sig2 = await generateSignature(secret, 1700000001, body)

      expect(sig1).not.toBe(sig2)
    })

    it('different bodies produce different signatures', async () => {
      const secret = 'secret'
      const timestamp = 1700000000

      const sig1 = await generateSignature(secret, timestamp, '{"a":1}')
      const sig2 = await generateSignature(secret, timestamp, '{"a":2}')

      expect(sig1).not.toBe(sig2)
    })

    it('different secrets produce different signatures', async () => {
      const timestamp = 1700000000
      const body = '{}'

      const sig1 = await generateSignature('secret1', timestamp, body)
      const sig2 = await generateSignature('secret2', timestamp, body)

      expect(sig1).not.toBe(sig2)
    })
  })

  describe('verifySignature', () => {
    it('verifies valid signature', async () => {
      const secret = 'whsec_test123'
      const body = '{"event":"test"}'
      const timestamp = Math.floor(Date.now() / 1000)

      const signature = await generateSignature(secret, timestamp, body)
      const header = `t=${String(timestamp)},v1=${signature}`

      const isValid = await verifySignature(header, body, secret)
      expect(isValid).toBe(true)
    })

    it('rejects invalid signature', async () => {
      const secret = 'whsec_test123'
      const body = '{"event":"test"}'
      const timestamp = Math.floor(Date.now() / 1000)

      const header = `t=${String(timestamp)},v1=invalidsignature`

      const isValid = await verifySignature(header, body, secret)
      expect(isValid).toBe(false)
    })

    it('rejects wrong secret', async () => {
      const body = '{"event":"test"}'
      const timestamp = Math.floor(Date.now() / 1000)

      const signature = await generateSignature('secret1', timestamp, body)
      const header = `t=${String(timestamp)},v1=${signature}`

      const isValid = await verifySignature(header, body, 'secret2')
      expect(isValid).toBe(false)
    })

    it('rejects expired timestamp', async () => {
      const secret = 'whsec_test123'
      const body = '{"event":"test"}'
      const oldTimestamp = Math.floor(Date.now() / 1000) - 600 // 10 minutes ago

      const signature = await generateSignature(secret, oldTimestamp, body)
      const header = `t=${String(oldTimestamp)},v1=${signature}`

      const isValid = await verifySignature(header, body, secret)
      expect(isValid).toBe(false)
    })

    it('accepts timestamp within tolerance', async () => {
      const secret = 'whsec_test123'
      const body = '{"event":"test"}'
      const timestamp = Math.floor(Date.now() / 1000) - 60 // 1 minute ago

      const signature = await generateSignature(secret, timestamp, body)
      const header = `t=${String(timestamp)},v1=${signature}`

      const isValid = await verifySignature(header, body, secret)
      expect(isValid).toBe(true)
    })

    it('rejects malformed header', async () => {
      const isValid = await verifySignature('invalid', '{}', 'secret')
      expect(isValid).toBe(false)
    })

    it('rejects missing timestamp', async () => {
      const isValid = await verifySignature('v1=abc123', '{}', 'secret')
      expect(isValid).toBe(false)
    })

    it('rejects missing signature', async () => {
      const isValid = await verifySignature('t=1700000000', '{}', 'secret')
      expect(isValid).toBe(false)
    })
  })

  describe('WebhookPayload', () => {
    it('has correct structure', () => {
      const payload: WebhookPayload = {
        event: 'release.created',
        timestamp: new Date().toISOString(),
        data: {
          releaseId: 'rel-123',
          version: '1.0.0',
        },
      }

      expect(payload.event).toBe('release.created')
      expect(payload.timestamp).toBeDefined()
      expect(payload.data.releaseId).toBe('rel-123')
    })

    it('serializes to JSON', () => {
      const payload: WebhookPayload = {
        event: 'test',
        timestamp: '2023-01-01T00:00:00.000Z',
        data: { key: 'value' },
      }

      const json = JSON.stringify(payload)
      const parsed = JSON.parse(json) as WebhookPayload

      expect(parsed.event).toBe('test')
      expect(parsed.data.key).toBe('value')
    })
  })

  describe('WEBHOOK_EVENTS', () => {
    describe('release events', () => {
      it('has release.created', () => {
        expect(WEBHOOK_EVENTS.RELEASE_CREATED).toBe('release.created')
      })

      it('has release.updated', () => {
        expect(WEBHOOK_EVENTS.RELEASE_UPDATED).toBe('release.updated')
      })

      it('has release.paused', () => {
        expect(WEBHOOK_EVENTS.RELEASE_PAUSED).toBe('release.paused')
      })

      it('has release.resumed', () => {
        expect(WEBHOOK_EVENTS.RELEASE_RESUMED).toBe('release.resumed')
      })

      it('has release.rolled_back', () => {
        expect(WEBHOOK_EVENTS.RELEASE_ROLLED_BACK).toBe('release.rolled_back')
      })
    })

    describe('device events', () => {
      it('has device.registered', () => {
        expect(WEBHOOK_EVENTS.DEVICE_REGISTERED).toBe('device.registered')
      })

      it('has device.updated', () => {
        expect(WEBHOOK_EVENTS.DEVICE_UPDATED).toBe('device.updated')
      })
    })

    describe('app events', () => {
      it('has app.created', () => {
        expect(WEBHOOK_EVENTS.APP_CREATED).toBe('app.created')
      })

      it('has app.updated', () => {
        expect(WEBHOOK_EVENTS.APP_UPDATED).toBe('app.updated')
      })

      it('has app.deleted', () => {
        expect(WEBHOOK_EVENTS.APP_DELETED).toBe('app.deleted')
      })
    })

    describe('update events', () => {
      it('has update.installed', () => {
        expect(WEBHOOK_EVENTS.UPDATE_INSTALLED).toBe('update.installed')
      })

      it('has update.failed', () => {
        expect(WEBHOOK_EVENTS.UPDATE_FAILED).toBe('update.failed')
      })

      it('has update.rolled_back', () => {
        expect(WEBHOOK_EVENTS.UPDATE_ROLLED_BACK).toBe('update.rolled_back')
      })
    })

    describe('crash events', () => {
      it('has crash.detected', () => {
        expect(WEBHOOK_EVENTS.CRASH_DETECTED).toBe('crash.detected')
      })

      it('has crash.threshold_exceeded', () => {
        expect(WEBHOOK_EVENTS.CRASH_THRESHOLD_EXCEEDED).toBe('crash.threshold_exceeded')
      })
    })

    describe('test event', () => {
      it('has test event', () => {
        expect(WEBHOOK_EVENTS.TEST).toBe('test')
      })
    })

    describe('naming conventions', () => {
      it('all events follow dot notation', () => {
        const events = Object.values(WEBHOOK_EVENTS)
        for (const event of events) {
          expect(event).toMatch(/^[a-z]+(\.[a-z_]+)?$/)
        }
      })
    })
  })

  describe('signature header format', () => {
    it('format is t=timestamp,v1=signature', async () => {
      const secret = 'secret'
      const timestamp = 1700000000
      const body = '{}'
      const signature = await generateSignature(secret, timestamp, body)

      const header = `t=${String(timestamp)},v1=${signature}`

      expect(header).toMatch(/^t=\d+,v1=[a-f0-9]{64}$/)
    })

    it('can parse header components', () => {
      const header = 't=1700000000,v1=abc123'
      const parts = header.split(',')

      const timestampPart = parts.find((p) => p.startsWith('t='))
      const signaturePart = parts.find((p) => p.startsWith('v1='))

      expect(timestampPart).toBe('t=1700000000')
      expect(signaturePart).toBe('v1=abc123')
      expect(timestampPart?.slice(2)).toBe('1700000000')
      expect(signaturePart?.slice(3)).toBe('abc123')
    })
  })
})
