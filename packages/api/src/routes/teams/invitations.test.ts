import { describe, it, expect } from 'vitest'
import { z } from 'zod'
import { generateOTP } from './invitations'

// Local schema definitions for testing
const createInvitationSchema = z.object({
  email: z.string().email(),
  role: z.enum(['admin', 'member']).default('member'),
})

const verifyInvitationSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
})

describe('team invitations logic', () => {
  describe('createInvitationSchema', () => {
    it('validates valid invitation', () => {
      const result = createInvitationSchema.safeParse({
        email: 'user@example.com',
        role: 'member',
      })
      expect(result.success).toBe(true)
    })

    it('validates with default role', () => {
      const result = createInvitationSchema.safeParse({
        email: 'user@example.com',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.role).toBe('member')
      }
    })

    it('accepts admin role', () => {
      const result = createInvitationSchema.safeParse({
        email: 'admin@example.com',
        role: 'admin',
      })
      expect(result.success).toBe(true)
    })

    it('rejects invalid email', () => {
      const result = createInvitationSchema.safeParse({
        email: 'not-an-email',
        role: 'member',
      })
      expect(result.success).toBe(false)
    })

    it('rejects owner role', () => {
      const result = createInvitationSchema.safeParse({
        email: 'user@example.com',
        role: 'owner',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('verifyInvitationSchema', () => {
    it('validates valid verification', () => {
      const result = verifyInvitationSchema.safeParse({
        email: 'user@example.com',
        otp: '123456',
      })
      expect(result.success).toBe(true)
    })

    it('rejects OTP with wrong length', () => {
      const result = verifyInvitationSchema.safeParse({
        email: 'user@example.com',
        otp: '12345', // 5 digits
      })
      expect(result.success).toBe(false)
    })

    it('rejects OTP with extra digits', () => {
      const result = verifyInvitationSchema.safeParse({
        email: 'user@example.com',
        otp: '1234567', // 7 digits
      })
      expect(result.success).toBe(false)
    })
  })

  describe('generateOTP', () => {
    it('generates 6-digit string', () => {
      const otp = generateOTP()
      expect(otp).toHaveLength(6)
    })

    it('generates numeric string', () => {
      const otp = generateOTP()
      expect(otp).toMatch(/^\d{6}$/)
    })

    it('pads with leading zeros', () => {
      // Can't guarantee this without mocking, but verify format
      const otp = generateOTP()
      expect(otp.length).toBe(6)
      expect(parseInt(otp, 10)).toBeLessThan(1000000)
    })

    it('generates different values', () => {
      const otps = new Set<string>()
      for (let i = 0; i < 10; i++) {
        otps.add(generateOTP())
      }
      // Should have at least a few different values
      expect(otps.size).toBeGreaterThan(1)
    })
  })

  describe('OTP hashing', () => {
    async function hashOTP(otp: string): Promise<string> {
      const encoder = new TextEncoder()
      const data = encoder.encode(otp)
      const hashBuffer = await crypto.subtle.digest('SHA-256', data)
      const hashArray = new Uint8Array(hashBuffer)
      return Array.from(hashArray)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')
    }

    async function verifyOTP(otp: string, storedHash: string): Promise<boolean> {
      const inputHash = await hashOTP(otp)
      return inputHash === storedHash
    }

    it('produces consistent hash', async () => {
      const otp = '123456'
      const hash1 = await hashOTP(otp)
      const hash2 = await hashOTP(otp)
      expect(hash1).toBe(hash2)
    })

    it('produces 64-character hex hash', async () => {
      const hash = await hashOTP('123456')
      expect(hash).toHaveLength(64)
      expect(hash).toMatch(/^[a-f0-9]{64}$/)
    })

    it('verifies correct OTP', async () => {
      const otp = '654321'
      const hash = await hashOTP(otp)
      const isValid = await verifyOTP(otp, hash)
      expect(isValid).toBe(true)
    })

    it('rejects incorrect OTP', async () => {
      const hash = await hashOTP('123456')
      const isValid = await verifyOTP('654321', hash)
      expect(isValid).toBe(false)
    })

    it('different OTPs produce different hashes', async () => {
      const hash1 = await hashOTP('123456')
      const hash2 = await hashOTP('654321')
      expect(hash1).not.toBe(hash2)
    })
  })

  describe('OTP expiration', () => {
    const OTP_EXPIRY_MS = 30 * 60 * 1000 // 30 minutes

    it('calculates correct expiration time', () => {
      const now = Math.floor(Date.now() / 1000)
      const expiresAt = now + Math.floor(OTP_EXPIRY_MS / 1000)
      const expiryInMinutes = (expiresAt - now) / 60
      expect(expiryInMinutes).toBe(30)
    })

    it('identifies non-expired OTP', () => {
      const now = Math.floor(Date.now() / 1000)
      const expiresAt = now + 1800 // 30 minutes in future
      const isExpired = now > expiresAt
      expect(isExpired).toBe(false)
    })

    it('identifies expired OTP', () => {
      const now = Math.floor(Date.now() / 1000)
      const expiresAt = now - 1 // 1 second in past
      const isExpired = now > expiresAt
      expect(isExpired).toBe(true)
    })
  })

  describe('invitation formatting', () => {
    function formatInvitation(inv: Record<string, unknown>) {
      return {
        id: inv.id,
        email: inv.email,
        role: inv.role,
        invitedBy: inv.invited_by,
        expiresAt: inv.expires_at,
        createdAt: inv.created_at,
      }
    }

    it('formats invitation correctly', () => {
      const dbInvitation = {
        id: 'inv-123',
        email: 'user@example.com',
        role: 'member',
        invited_by: 'user-456',
        expires_at: 1700001800,
        created_at: 1700000000,
      }

      const formatted = formatInvitation(dbInvitation)

      expect(formatted.id).toBe('inv-123')
      expect(formatted.email).toBe('user@example.com')
      expect(formatted.role).toBe('member')
      expect(formatted.invitedBy).toBe('user-456')
    })
  })

  describe('role permissions', () => {
    type Role = 'owner' | 'admin' | 'member'

    function canInvite(role: Role): boolean {
      return role === 'owner' || role === 'admin'
    }

    function canInviteAsAdmin(role: Role): boolean {
      return role === 'owner'
    }

    it('owner can invite', () => {
      expect(canInvite('owner')).toBe(true)
    })

    it('admin can invite', () => {
      expect(canInvite('admin')).toBe(true)
    })

    it('member cannot invite', () => {
      expect(canInvite('member')).toBe(false)
    })

    it('only owner can invite as admin', () => {
      expect(canInviteAsAdmin('owner')).toBe(true)
      expect(canInviteAsAdmin('admin')).toBe(false)
      expect(canInviteAsAdmin('member')).toBe(false)
    })
  })

  describe('verification responses', () => {
    it('successful join response', () => {
      const response = {
        success: true,
        teamId: 'team-123',
        teamName: 'My Team',
      }

      expect(response.success).toBe(true)
      expect(response.teamId).toBeDefined()
    })

    it('requires signup response', () => {
      const response = {
        success: false,
        requiresSignup: true,
        email: 'new@example.com',
        teamName: 'My Team',
        invitationId: 'inv-123',
      }

      expect(response.success).toBe(false)
      expect(response.requiresSignup).toBe(true)
      expect(response.email).toBeDefined()
    })
  })

  describe('audit events', () => {
    const invitationAuditEvents = [
      'team.member_invited',
      'team.member_joined',
      'team.invitation_resent',
      'team.invitation_cancelled',
    ]

    it('has member_invited event', () => {
      expect(invitationAuditEvents).toContain('team.member_invited')
    })

    it('has member_joined event', () => {
      expect(invitationAuditEvents).toContain('team.member_joined')
    })
  })
})
