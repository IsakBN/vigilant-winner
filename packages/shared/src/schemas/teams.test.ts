/**
 * @agent remediate-team-schemas
 * @created 2026-01-25
 * @description Tests for team management schemas
 */
import { describe, it, expect } from 'vitest'
import {
  orgRoleSchema,
  projectRoleSchema,
  createTeamSchema,
  updateTeamSchema,
  inviteMemberSchema,
  verifyInvitationSchema,
  updateMemberRoleSchema,
  addProjectMemberSchema,
  updateProjectMemberSchema,
} from './teams'

describe('team schemas', () => {
  describe('orgRoleSchema', () => {
    it('accepts valid org roles', () => {
      expect(orgRoleSchema.safeParse('owner').success).toBe(true)
      expect(orgRoleSchema.safeParse('admin').success).toBe(true)
      expect(orgRoleSchema.safeParse('member').success).toBe(true)
    })

    it('rejects invalid roles', () => {
      expect(orgRoleSchema.safeParse('superadmin').success).toBe(false)
      expect(orgRoleSchema.safeParse('').success).toBe(false)
    })
  })

  describe('projectRoleSchema', () => {
    it('accepts valid project roles', () => {
      expect(projectRoleSchema.safeParse('admin').success).toBe(true)
      expect(projectRoleSchema.safeParse('developer').success).toBe(true)
      expect(projectRoleSchema.safeParse('viewer').success).toBe(true)
    })

    it('rejects invalid roles', () => {
      expect(projectRoleSchema.safeParse('owner').success).toBe(false)
      expect(projectRoleSchema.safeParse('member').success).toBe(false)
    })
  })

  describe('createTeamSchema', () => {
    it('validates team with name only', () => {
      const result = createTeamSchema.safeParse({ name: 'My Team' })
      expect(result.success).toBe(true)
    })

    it('validates team with name and slug', () => {
      const result = createTeamSchema.safeParse({
        name: 'My Team',
        slug: 'my-team',
      })
      expect(result.success).toBe(true)
    })

    it('rejects empty name', () => {
      const result = createTeamSchema.safeParse({ name: '' })
      expect(result.success).toBe(false)
    })

    it('rejects name exceeding max length', () => {
      const result = createTeamSchema.safeParse({ name: 'a'.repeat(101) })
      expect(result.success).toBe(false)
    })

    it('rejects invalid slug format', () => {
      expect(createTeamSchema.safeParse({ name: 'Team', slug: 'My Team' }).success).toBe(false)
      expect(createTeamSchema.safeParse({ name: 'Team', slug: 'UPPERCASE' }).success).toBe(false)
      expect(createTeamSchema.safeParse({ name: 'Team', slug: 'has_underscores' }).success).toBe(false)
    })

    it('rejects slug too short', () => {
      const result = createTeamSchema.safeParse({ name: 'Team', slug: 'ab' })
      expect(result.success).toBe(false)
    })

    it('accepts valid slug formats', () => {
      expect(createTeamSchema.safeParse({ name: 'Team', slug: 'abc' }).success).toBe(true)
      expect(createTeamSchema.safeParse({ name: 'Team', slug: 'my-team-123' }).success).toBe(true)
      expect(createTeamSchema.safeParse({ name: 'Team', slug: '123' }).success).toBe(true)
    })
  })

  describe('updateTeamSchema', () => {
    it('validates partial update with name only', () => {
      const result = updateTeamSchema.safeParse({ name: 'New Name' })
      expect(result.success).toBe(true)
    })

    it('validates partial update with slug only', () => {
      const result = updateTeamSchema.safeParse({ slug: 'new-slug' })
      expect(result.success).toBe(true)
    })

    it('validates empty update', () => {
      const result = updateTeamSchema.safeParse({})
      expect(result.success).toBe(true)
    })

    it('rejects invalid slug on update', () => {
      const result = updateTeamSchema.safeParse({ slug: 'Invalid Slug!' })
      expect(result.success).toBe(false)
    })
  })

  describe('inviteMemberSchema', () => {
    it('validates invitation with admin role', () => {
      const result = inviteMemberSchema.safeParse({
        email: 'user@example.com',
        role: 'admin',
      })
      expect(result.success).toBe(true)
    })

    it('validates invitation with member role', () => {
      const result = inviteMemberSchema.safeParse({
        email: 'user@example.com',
        role: 'member',
      })
      expect(result.success).toBe(true)
    })

    it('rejects invitation with owner role', () => {
      const result = inviteMemberSchema.safeParse({
        email: 'user@example.com',
        role: 'owner',
      })
      expect(result.success).toBe(false)
    })

    it('rejects invalid email', () => {
      const result = inviteMemberSchema.safeParse({
        email: 'not-an-email',
        role: 'member',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('verifyInvitationSchema', () => {
    it('validates OTP without team ID', () => {
      const result = verifyInvitationSchema.safeParse({
        otp: 'ABC123',
      })
      expect(result.success).toBe(true)
    })

    it('validates OTP with team ID', () => {
      const result = verifyInvitationSchema.safeParse({
        otp: 'XYZ789',
        teamId: '550e8400-e29b-41d4-a716-446655440000',
      })
      expect(result.success).toBe(true)
    })

    it('rejects invalid OTP format', () => {
      expect(verifyInvitationSchema.safeParse({ otp: 'abc123' }).success).toBe(false)
      expect(verifyInvitationSchema.safeParse({ otp: 'ABCDE' }).success).toBe(false)
      expect(verifyInvitationSchema.safeParse({ otp: 'ABCDEFG' }).success).toBe(false)
      expect(verifyInvitationSchema.safeParse({ otp: 'ABC-12' }).success).toBe(false)
    })

    it('rejects invalid team ID', () => {
      const result = verifyInvitationSchema.safeParse({
        otp: 'ABC123',
        teamId: 'not-a-uuid',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('updateMemberRoleSchema', () => {
    it('validates admin role', () => {
      const result = updateMemberRoleSchema.safeParse({ role: 'admin' })
      expect(result.success).toBe(true)
    })

    it('validates member role', () => {
      const result = updateMemberRoleSchema.safeParse({ role: 'member' })
      expect(result.success).toBe(true)
    })

    it('rejects owner role', () => {
      const result = updateMemberRoleSchema.safeParse({ role: 'owner' })
      expect(result.success).toBe(false)
    })
  })

  describe('addProjectMemberSchema', () => {
    it('validates adding admin', () => {
      const result = addProjectMemberSchema.safeParse({
        userId: '550e8400-e29b-41d4-a716-446655440000',
        role: 'admin',
      })
      expect(result.success).toBe(true)
    })

    it('validates adding developer', () => {
      const result = addProjectMemberSchema.safeParse({
        userId: '550e8400-e29b-41d4-a716-446655440000',
        role: 'developer',
      })
      expect(result.success).toBe(true)
    })

    it('validates adding viewer', () => {
      const result = addProjectMemberSchema.safeParse({
        userId: '550e8400-e29b-41d4-a716-446655440000',
        role: 'viewer',
      })
      expect(result.success).toBe(true)
    })

    it('rejects invalid userId', () => {
      const result = addProjectMemberSchema.safeParse({
        userId: 'not-a-uuid',
        role: 'developer',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('updateProjectMemberSchema', () => {
    it('validates role update', () => {
      expect(updateProjectMemberSchema.safeParse({ role: 'admin' }).success).toBe(true)
      expect(updateProjectMemberSchema.safeParse({ role: 'developer' }).success).toBe(true)
      expect(updateProjectMemberSchema.safeParse({ role: 'viewer' }).success).toBe(true)
    })

    it('rejects invalid roles', () => {
      expect(updateProjectMemberSchema.safeParse({ role: 'owner' }).success).toBe(false)
      expect(updateProjectMemberSchema.safeParse({ role: 'member' }).success).toBe(false)
    })
  })
})
