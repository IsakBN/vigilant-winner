import { describe, it, expect, vi, beforeEach } from 'vitest'
import { sendEmail, sendOTPEmail } from './email'
import type { Env } from '../types/env'

const mockFetch = vi.fn()
global.fetch = mockFetch

const mockEnv = {
  RESEND_API_KEY: 'test-api-key',
} as Env

describe('email', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  describe('sendEmail', () => {
    it('sends email via Resend API', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 'email-123' }),
      })

      const result = await sendEmail({
        to: 'user@example.com',
        subject: 'Test Subject',
        html: '<p>Test body</p>',
        env: mockEnv,
      })

      expect(result.success).toBe(true)
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.resend.com/emails',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-api-key',
          },
        })
      )
    })

    it('returns error on API failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ message: 'Invalid email' }),
      })

      const result = await sendEmail({
        to: 'invalid',
        subject: 'Test',
        html: '<p>Test</p>',
        env: mockEnv,
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid email')
    })

    it('handles network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const result = await sendEmail({
        to: 'user@example.com',
        subject: 'Test',
        html: '<p>Test</p>',
        env: mockEnv,
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Network error')
    })
  })

  describe('sendOTPEmail', () => {
    it('sends OTP email with correct subject', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 'email-123' }),
      })

      await sendOTPEmail('user@example.com', '123456', mockEnv)

      const [, options] = mockFetch.mock.calls[0] as [string, RequestInit]
      const body = JSON.parse(options.body as string) as { subject: string; html: string }

      expect(body.subject).toBe('Your BundleNudge verification code')
      expect(body.html).toContain('123456')
    })

    it('throws on email failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ message: 'Server error' }),
      })

      await expect(
        sendOTPEmail('user@example.com', '123456', mockEnv)
      ).rejects.toThrow('Failed to send OTP email')
    })
  })
})
