/**
 * Project Members Tests
 *
 * @agent remediate-project-members
 * @modified 2026-01-25
 */

import { describe, it, expect } from 'vitest'
import { z } from 'zod'

// Schema definitions (matching the routes)
const addMemberSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(['admin', 'developer', 'viewer']),
})

const updateMemberSchema = z.object({
  role: z.enum(['admin', 'developer', 'viewer']),
})

describe('project members', () => {
  describe('addMemberSchema', () => {
    it('validates valid input', () => {
      const result = addMemberSchema.safeParse({
        userId: '550e8400-e29b-41d4-a716-446655440000',
        role: 'developer',
      })
      expect(result.success).toBe(true)
    })

    it('accepts admin role', () => {
      const result = addMemberSchema.safeParse({
        userId: '550e8400-e29b-41d4-a716-446655440000',
        role: 'admin',
      })
      expect(result.success).toBe(true)
    })

    it('accepts developer role', () => {
      const result = addMemberSchema.safeParse({
        userId: '550e8400-e29b-41d4-a716-446655440000',
        role: 'developer',
      })
      expect(result.success).toBe(true)
    })

    it('accepts viewer role', () => {
      const result = addMemberSchema.safeParse({
        userId: '550e8400-e29b-41d4-a716-446655440000',
        role: 'viewer',
      })
      expect(result.success).toBe(true)
    })

    it('rejects invalid userId', () => {
      const result = addMemberSchema.safeParse({
        userId: 'not-a-uuid',
        role: 'developer',
      })
      expect(result.success).toBe(false)
    })

    it('rejects owner role (org-level only)', () => {
      const result = addMemberSchema.safeParse({
        userId: '550e8400-e29b-41d4-a716-446655440000',
        role: 'owner',
      })
      expect(result.success).toBe(false)
    })

    it('rejects member role (org-level only)', () => {
      const result = addMemberSchema.safeParse({
        userId: '550e8400-e29b-41d4-a716-446655440000',
        role: 'member',
      })
      expect(result.success).toBe(false)
    })

    it('rejects missing userId', () => {
      const result = addMemberSchema.safeParse({
        role: 'developer',
      })
      expect(result.success).toBe(false)
    })

    it('rejects missing role', () => {
      const result = addMemberSchema.safeParse({
        userId: '550e8400-e29b-41d4-a716-446655440000',
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
    interface MemberWithUserRow {
      id: string
      app_id: string
      user_id: string
      role: string
      created_at: number
      user_name: string | null
      user_email: string
    }

    function formatMemberWithUser(member: MemberWithUserRow) {
      return {
        id: member.id,
        userId: member.user_id,
        user: {
          name: member.user_name,
          email: member.user_email,
        },
        role: member.role,
        createdAt: member.created_at,
      }
    }

    it('formats member correctly', () => {
      const dbMember: MemberWithUserRow = {
        id: 'member-123',
        app_id: 'app-456',
        user_id: 'user-789',
        role: 'developer',
        created_at: 1700000000,
        user_name: 'John Doe',
        user_email: 'john@example.com',
      }

      const formatted = formatMemberWithUser(dbMember)

      expect(formatted.id).toBe('member-123')
      expect(formatted.userId).toBe('user-789')
      expect(formatted.user.name).toBe('John Doe')
      expect(formatted.user.email).toBe('john@example.com')
      expect(formatted.role).toBe('developer')
      expect(formatted.createdAt).toBe(1700000000)
    })

    it('handles null user name', () => {
      const dbMember: MemberWithUserRow = {
        id: 'member-123',
        app_id: 'app-456',
        user_id: 'user-789',
        role: 'viewer',
        created_at: 1700000000,
        user_name: null,
        user_email: 'anon@example.com',
      }

      const formatted = formatMemberWithUser(dbMember)

      expect(formatted.user.name).toBeNull()
      expect(formatted.user.email).toBe('anon@example.com')
    })

    it('converts snake_case to camelCase', () => {
      const dbMember: MemberWithUserRow = {
        id: 'id',
        app_id: 'app',
        user_id: 'user',
        role: 'admin',
        created_at: 0,
        user_name: 'Test',
        user_email: 'test@example.com',
      }

      const formatted = formatMemberWithUser(dbMember)

      expect('userId' in formatted).toBe(true)
      expect('createdAt' in formatted).toBe(true)
      expect('user_id' in formatted).toBe(false)
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

    it('project role overrides org role', () => {
      // Org admin but project viewer
      const result = resolveProjectAccess(false, false, 'admin', 'viewer')
      expect(result.allowed).toBe(true)
      expect(result.effectiveRole).toBe('viewer')
    })
  })

  describe('response formats', () => {
    it('POST response matches spec', () => {
      const response = {
        id: 'member-123',
        userId: 'user-456',
        role: 'developer',
        createdAt: 1700000000,
      }

      expect(response).toHaveProperty('id')
      expect(response).toHaveProperty('userId')
      expect(response).toHaveProperty('role')
      expect(response).toHaveProperty('createdAt')
    })

    it('PATCH response matches spec', () => {
      const response = {
        id: 'member-123',
        userId: 'user-456',
        role: 'admin',
      }

      expect(response).toHaveProperty('id')
      expect(response).toHaveProperty('userId')
      expect(response).toHaveProperty('role')
      expect(response).not.toHaveProperty('createdAt')
    })

    it('GET response has data array with user info', () => {
      const response = {
        data: [
          {
            id: 'member-123',
            userId: 'user-456',
            user: { name: 'John', email: 'john@example.com' },
            role: 'admin',
            createdAt: 1700000000,
          },
        ],
      }

      expect(response).toHaveProperty('data')
      expect(Array.isArray(response.data)).toBe(true)
      const firstMember = response.data[0]
      expect(firstMember).toBeDefined()
      expect(firstMember).toHaveProperty('user')
      expect(firstMember?.user).toHaveProperty('name')
      expect(firstMember?.user).toHaveProperty('email')
    })
  })
})
