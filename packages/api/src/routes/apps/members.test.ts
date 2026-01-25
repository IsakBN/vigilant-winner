import { describe, it, expect } from 'vitest'
import { z } from 'zod'

// Schema definitions (matching the routes)
const addMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(['admin', 'developer', 'viewer']),
})

const updateMemberSchema = z.object({
  role: z.enum(['admin', 'developer', 'viewer']),
})

describe('project members', () => {
  describe('addMemberSchema', () => {
    it('validates valid input', () => {
      const result = addMemberSchema.safeParse({
        email: 'user@example.com',
        role: 'developer',
      })
      expect(result.success).toBe(true)
    })

    it('accepts admin role', () => {
      const result = addMemberSchema.safeParse({
        email: 'admin@example.com',
        role: 'admin',
      })
      expect(result.success).toBe(true)
    })

    it('accepts developer role', () => {
      const result = addMemberSchema.safeParse({
        email: 'dev@example.com',
        role: 'developer',
      })
      expect(result.success).toBe(true)
    })

    it('accepts viewer role', () => {
      const result = addMemberSchema.safeParse({
        email: 'viewer@example.com',
        role: 'viewer',
      })
      expect(result.success).toBe(true)
    })

    it('rejects invalid email', () => {
      const result = addMemberSchema.safeParse({
        email: 'not-an-email',
        role: 'developer',
      })
      expect(result.success).toBe(false)
    })

    it('rejects owner role (org-level only)', () => {
      const result = addMemberSchema.safeParse({
        email: 'user@example.com',
        role: 'owner',
      })
      expect(result.success).toBe(false)
    })

    it('rejects member role (org-level only)', () => {
      const result = addMemberSchema.safeParse({
        email: 'user@example.com',
        role: 'member',
      })
      expect(result.success).toBe(false)
    })

    it('rejects missing email', () => {
      const result = addMemberSchema.safeParse({
        role: 'developer',
      })
      expect(result.success).toBe(false)
    })

    it('rejects missing role', () => {
      const result = addMemberSchema.safeParse({
        email: 'user@example.com',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('updateMemberSchema', () => {
    it('validates valid role update', () => {
      const result = updateMemberSchema.safeParse({
        role: 'admin',
      })
      expect(result.success).toBe(true)
    })

    it('accepts developer role', () => {
      const result = updateMemberSchema.safeParse({
        role: 'developer',
      })
      expect(result.success).toBe(true)
    })

    it('accepts viewer role', () => {
      const result = updateMemberSchema.safeParse({
        role: 'viewer',
      })
      expect(result.success).toBe(true)
    })

    it('rejects owner role', () => {
      const result = updateMemberSchema.safeParse({
        role: 'owner',
      })
      expect(result.success).toBe(false)
    })

    it('rejects member role', () => {
      const result = updateMemberSchema.safeParse({
        role: 'member',
      })
      expect(result.success).toBe(false)
    })

    it('rejects invalid role', () => {
      const result = updateMemberSchema.safeParse({
        role: 'superuser',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('member formatting', () => {
    interface MemberRow {
      id: string
      app_id: string
      user_id: string
      role: string
      created_at: number
    }

    function formatMember(member: MemberRow): {
      id: string
      appId: string
      userId: string
      role: string
      createdAt: number
    } {
      return {
        id: member.id,
        appId: member.app_id,
        userId: member.user_id,
        role: member.role,
        createdAt: member.created_at,
      }
    }

    it('formats member correctly', () => {
      const dbMember: MemberRow = {
        id: 'member-123',
        app_id: 'app-456',
        user_id: 'user-789',
        role: 'developer',
        created_at: 1700000000,
      }

      const formatted = formatMember(dbMember)

      expect(formatted.id).toBe('member-123')
      expect(formatted.appId).toBe('app-456')
      expect(formatted.userId).toBe('user-789')
      expect(formatted.role).toBe('developer')
      expect(formatted.createdAt).toBe(1700000000)
    })

    it('converts snake_case to camelCase', () => {
      const dbMember: MemberRow = {
        id: 'id',
        app_id: 'app',
        user_id: 'user',
        role: 'admin',
        created_at: 0,
      }

      const formatted = formatMember(dbMember)

      expect('appId' in formatted).toBe(true)
      expect('userId' in formatted).toBe(true)
      expect('createdAt' in formatted).toBe(true)
      expect('app_id' in formatted).toBe(false)
    })
  })

  describe('role hierarchy', () => {
    type ProjectRole = 'admin' | 'developer' | 'viewer'

    const roleLevel: Record<ProjectRole, number> = {
      viewer: 1,
      developer: 2,
      admin: 3,
    }

    function hasMinRole(userRole: ProjectRole, requiredRole: ProjectRole): boolean {
      return roleLevel[userRole] >= roleLevel[requiredRole]
    }

    it('admin meets all requirements', () => {
      expect(hasMinRole('admin', 'admin')).toBe(true)
      expect(hasMinRole('admin', 'developer')).toBe(true)
      expect(hasMinRole('admin', 'viewer')).toBe(true)
    })

    it('developer meets developer and viewer requirements', () => {
      expect(hasMinRole('developer', 'admin')).toBe(false)
      expect(hasMinRole('developer', 'developer')).toBe(true)
      expect(hasMinRole('developer', 'viewer')).toBe(true)
    })

    it('viewer only meets viewer requirement', () => {
      expect(hasMinRole('viewer', 'admin')).toBe(false)
      expect(hasMinRole('viewer', 'developer')).toBe(false)
      expect(hasMinRole('viewer', 'viewer')).toBe(true)
    })
  })

  describe('project access scenarios', () => {
    // Simulating different access scenarios

    type OrgRole = 'owner' | 'admin' | 'member'
    type ProjectRole = 'admin' | 'developer' | 'viewer'

    function resolveProjectAccess(
      isPersonalApp: boolean,
      isAppOwner: boolean,
      orgRole: OrgRole | null,
      projectRole: ProjectRole | null
    ): { allowed: boolean; effectiveRole: ProjectRole | null } {
      // Personal app: only owner has access
      if (isPersonalApp) {
        if (isAppOwner) {
          return { allowed: true, effectiveRole: 'admin' }
        }
        return { allowed: false, effectiveRole: null }
      }

      // Team app with explicit project role
      if (projectRole) {
        return { allowed: true, effectiveRole: projectRole }
      }

      // Fall back to org role
      if (!orgRole) {
        return { allowed: false, effectiveRole: null }
      }

      if (orgRole === 'owner' || orgRole === 'admin') {
        return { allowed: true, effectiveRole: 'admin' }
      }

      return { allowed: true, effectiveRole: 'viewer' }
    }

    it('personal app owner gets admin access', () => {
      const result = resolveProjectAccess(true, true, null, null)
      expect(result.allowed).toBe(true)
      expect(result.effectiveRole).toBe('admin')
    })

    it('personal app non-owner gets denied', () => {
      const result = resolveProjectAccess(true, false, null, null)
      expect(result.allowed).toBe(false)
    })

    it('team app with explicit project role uses that role', () => {
      const result = resolveProjectAccess(false, false, 'member', 'developer')
      expect(result.allowed).toBe(true)
      expect(result.effectiveRole).toBe('developer')
    })

    it('team app org owner gets admin access', () => {
      const result = resolveProjectAccess(false, false, 'owner', null)
      expect(result.allowed).toBe(true)
      expect(result.effectiveRole).toBe('admin')
    })

    it('team app org admin gets admin access', () => {
      const result = resolveProjectAccess(false, false, 'admin', null)
      expect(result.allowed).toBe(true)
      expect(result.effectiveRole).toBe('admin')
    })

    it('team app org member gets viewer access', () => {
      const result = resolveProjectAccess(false, false, 'member', null)
      expect(result.allowed).toBe(true)
      expect(result.effectiveRole).toBe('viewer')
    })

    it('team app non-member gets denied', () => {
      const result = resolveProjectAccess(false, false, null, null)
      expect(result.allowed).toBe(false)
    })
  })
})
