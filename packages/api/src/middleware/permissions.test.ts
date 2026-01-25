import { describe, it, expect } from 'vitest'
import { z } from 'zod'
import {
  ORG_PERMISSIONS,
  PROJECT_PERMISSIONS,
  type OrgRole,
  type ProjectRole,
} from '../lib/permissions'

describe('permissions middleware', () => {
  describe('org permission middleware logic', () => {
    function checkOrgPermission(
      userRole: OrgRole,
      permission: keyof (typeof ORG_PERMISSIONS)['owner']
    ): boolean {
      const permissions = ORG_PERMISSIONS[userRole]
      return permissions[permission]
    }

    it('owner can manage billing', () => {
      expect(checkOrgPermission('owner', 'canManageBilling')).toBe(true)
    })

    it('admin cannot manage billing', () => {
      expect(checkOrgPermission('admin', 'canManageBilling')).toBe(false)
    })

    it('member cannot manage billing', () => {
      expect(checkOrgPermission('member', 'canManageBilling')).toBe(false)
    })

    it('owner can delete org', () => {
      expect(checkOrgPermission('owner', 'canDeleteOrg')).toBe(true)
    })

    it('admin cannot delete org', () => {
      expect(checkOrgPermission('admin', 'canDeleteOrg')).toBe(false)
    })

    it('admin can manage members', () => {
      expect(checkOrgPermission('admin', 'canManageMembers')).toBe(true)
    })

    it('admin can manage projects', () => {
      expect(checkOrgPermission('admin', 'canManageProjects')).toBe(true)
    })

    it('admin can view audit log', () => {
      expect(checkOrgPermission('admin', 'canViewAuditLog')).toBe(true)
    })

    it('member cannot view audit log', () => {
      expect(checkOrgPermission('member', 'canViewAuditLog')).toBe(false)
    })
  })

  describe('project permission middleware logic', () => {
    function checkProjectPermission(
      userRole: ProjectRole,
      permission: keyof (typeof PROJECT_PERMISSIONS)['admin']
    ): boolean {
      const permissions = PROJECT_PERMISSIONS[userRole]
      return permissions[permission]
    }

    it('admin can manage project', () => {
      expect(checkProjectPermission('admin', 'canManageProject')).toBe(true)
    })

    it('developer cannot manage project', () => {
      expect(checkProjectPermission('developer', 'canManageProject')).toBe(false)
    })

    it('developer can manage releases', () => {
      expect(checkProjectPermission('developer', 'canManageReleases')).toBe(true)
    })

    it('viewer cannot manage releases', () => {
      expect(checkProjectPermission('viewer', 'canManageReleases')).toBe(false)
    })

    it('developer can trigger builds', () => {
      expect(checkProjectPermission('developer', 'canTriggerBuilds')).toBe(true)
    })

    it('viewer cannot trigger builds', () => {
      expect(checkProjectPermission('viewer', 'canTriggerBuilds')).toBe(false)
    })

    it('admin can manage credentials', () => {
      expect(checkProjectPermission('admin', 'canManageCredentials')).toBe(true)
    })

    it('developer cannot manage credentials', () => {
      expect(checkProjectPermission('developer', 'canManageCredentials')).toBe(false)
    })
  })

  describe('permission fallback logic', () => {
    // Tests for falling back from project to org role
    function getEffectiveProjectRole(
      orgRole: OrgRole,
      projectRole: ProjectRole | null
    ): ProjectRole {
      if (projectRole) {
        return projectRole
      }
      // Org owners/admins get admin project access
      if (orgRole === 'owner' || orgRole === 'admin') {
        return 'admin'
      }
      // Org members get viewer access
      return 'viewer'
    }

    it('uses project role when available', () => {
      expect(getEffectiveProjectRole('member', 'developer')).toBe('developer')
    })

    it('org owner gets admin when no project role', () => {
      expect(getEffectiveProjectRole('owner', null)).toBe('admin')
    })

    it('org admin gets admin when no project role', () => {
      expect(getEffectiveProjectRole('admin', null)).toBe('admin')
    })

    it('org member gets viewer when no project role', () => {
      expect(getEffectiveProjectRole('member', null)).toBe('viewer')
    })
  })

  describe('role validation schemas', () => {
    const orgRoleSchema = z.enum(['owner', 'admin', 'member'])
    const projectRoleSchema = z.enum(['admin', 'developer', 'viewer'])

    it('validates valid org roles', () => {
      expect(orgRoleSchema.safeParse('owner').success).toBe(true)
      expect(orgRoleSchema.safeParse('admin').success).toBe(true)
      expect(orgRoleSchema.safeParse('member').success).toBe(true)
    })

    it('rejects invalid org roles', () => {
      expect(orgRoleSchema.safeParse('superadmin').success).toBe(false)
      expect(orgRoleSchema.safeParse('viewer').success).toBe(false)
      expect(orgRoleSchema.safeParse('').success).toBe(false)
    })

    it('validates valid project roles', () => {
      expect(projectRoleSchema.safeParse('admin').success).toBe(true)
      expect(projectRoleSchema.safeParse('developer').success).toBe(true)
      expect(projectRoleSchema.safeParse('viewer').success).toBe(true)
    })

    it('rejects invalid project roles', () => {
      expect(projectRoleSchema.safeParse('owner').success).toBe(false)
      expect(projectRoleSchema.safeParse('member').success).toBe(false)
      expect(projectRoleSchema.safeParse('').success).toBe(false)
    })
  })

  describe('permission matrix coverage', () => {
    it('all org roles have all permission keys', () => {
      const permKeys = Object.keys(ORG_PERMISSIONS.owner)
      for (const role of ['owner', 'admin', 'member'] as const) {
        const rolePerms = Object.keys(ORG_PERMISSIONS[role])
        expect(rolePerms.sort()).toEqual(permKeys.sort())
      }
    })

    it('all project roles have all permission keys', () => {
      const permKeys = Object.keys(PROJECT_PERMISSIONS.admin)
      for (const role of ['admin', 'developer', 'viewer'] as const) {
        const rolePerms = Object.keys(PROJECT_PERMISSIONS[role])
        expect(rolePerms.sort()).toEqual(permKeys.sort())
      }
    })

    it('org permissions are booleans', () => {
      for (const role of ['owner', 'admin', 'member'] as const) {
        for (const [, value] of Object.entries(ORG_PERMISSIONS[role])) {
          expect(typeof value).toBe('boolean')
        }
      }
    })

    it('project permissions are booleans', () => {
      for (const role of ['admin', 'developer', 'viewer'] as const) {
        for (const [, value] of Object.entries(PROJECT_PERMISSIONS[role])) {
          expect(typeof value).toBe('boolean')
        }
      }
    })
  })
})
