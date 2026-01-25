import { describe, it, expect } from 'vitest'
import {
  ORG_PERMISSIONS,
  PROJECT_PERMISSIONS,
  hasOrgPermission,
  hasProjectPermission,
  getDefaultProjectRole,
} from './permissions'

describe('permissions', () => {
  describe('ORG_PERMISSIONS', () => {
    describe('owner', () => {
      it('has all permissions', () => {
        const perms = ORG_PERMISSIONS.owner
        expect(perms.canManageOrg).toBe(true)
        expect(perms.canDeleteOrg).toBe(true)
        expect(perms.canManageMembers).toBe(true)
        expect(perms.canManageAdmins).toBe(true)
        expect(perms.canManageBilling).toBe(true)
        expect(perms.canManageProjects).toBe(true)
        expect(perms.canViewAuditLog).toBe(true)
      })
    })

    describe('admin', () => {
      it('has limited management permissions', () => {
        const perms = ORG_PERMISSIONS.admin
        expect(perms.canManageOrg).toBe(false)
        expect(perms.canDeleteOrg).toBe(false)
        expect(perms.canManageMembers).toBe(true)
        expect(perms.canManageAdmins).toBe(false)
        expect(perms.canManageBilling).toBe(false)
        expect(perms.canManageProjects).toBe(true)
        expect(perms.canViewAuditLog).toBe(true)
      })
    })

    describe('member', () => {
      it('has no management permissions', () => {
        const perms = ORG_PERMISSIONS.member
        expect(perms.canManageOrg).toBe(false)
        expect(perms.canDeleteOrg).toBe(false)
        expect(perms.canManageMembers).toBe(false)
        expect(perms.canManageAdmins).toBe(false)
        expect(perms.canManageBilling).toBe(false)
        expect(perms.canManageProjects).toBe(false)
        expect(perms.canViewAuditLog).toBe(false)
      })
    })
  })

  describe('PROJECT_PERMISSIONS', () => {
    describe('admin', () => {
      it('has all project permissions', () => {
        const perms = PROJECT_PERMISSIONS.admin
        expect(perms.canManageProject).toBe(true)
        expect(perms.canManageReleases).toBe(true)
        expect(perms.canManageCredentials).toBe(true)
        expect(perms.canViewAnalytics).toBe(true)
        expect(perms.canTriggerBuilds).toBe(true)
      })
    })

    describe('developer', () => {
      it('can manage releases but not project settings', () => {
        const perms = PROJECT_PERMISSIONS.developer
        expect(perms.canManageProject).toBe(false)
        expect(perms.canManageReleases).toBe(true)
        expect(perms.canManageCredentials).toBe(false)
        expect(perms.canViewAnalytics).toBe(true)
        expect(perms.canTriggerBuilds).toBe(true)
      })
    })

    describe('viewer', () => {
      it('can only view analytics', () => {
        const perms = PROJECT_PERMISSIONS.viewer
        expect(perms.canManageProject).toBe(false)
        expect(perms.canManageReleases).toBe(false)
        expect(perms.canManageCredentials).toBe(false)
        expect(perms.canViewAnalytics).toBe(true)
        expect(perms.canTriggerBuilds).toBe(false)
      })
    })
  })

  describe('hasOrgPermission', () => {
    it('owner has canManageBilling', () => {
      expect(hasOrgPermission('owner', 'canManageBilling')).toBe(true)
    })

    it('admin does not have canManageBilling', () => {
      expect(hasOrgPermission('admin', 'canManageBilling')).toBe(false)
    })

    it('member does not have canManageBilling', () => {
      expect(hasOrgPermission('member', 'canManageBilling')).toBe(false)
    })

    it('admin has canManageMembers', () => {
      expect(hasOrgPermission('admin', 'canManageMembers')).toBe(true)
    })

    it('member does not have canManageMembers', () => {
      expect(hasOrgPermission('member', 'canManageMembers')).toBe(false)
    })

    it('only owner has canDeleteOrg', () => {
      expect(hasOrgPermission('owner', 'canDeleteOrg')).toBe(true)
      expect(hasOrgPermission('admin', 'canDeleteOrg')).toBe(false)
      expect(hasOrgPermission('member', 'canDeleteOrg')).toBe(false)
    })
  })

  describe('hasProjectPermission', () => {
    it('admin has canManageProject', () => {
      expect(hasProjectPermission('admin', 'canManageProject')).toBe(true)
    })

    it('developer does not have canManageProject', () => {
      expect(hasProjectPermission('developer', 'canManageProject')).toBe(false)
    })

    it('developer has canManageReleases', () => {
      expect(hasProjectPermission('developer', 'canManageReleases')).toBe(true)
    })

    it('viewer does not have canManageReleases', () => {
      expect(hasProjectPermission('viewer', 'canManageReleases')).toBe(false)
    })

    it('all roles have canViewAnalytics', () => {
      expect(hasProjectPermission('admin', 'canViewAnalytics')).toBe(true)
      expect(hasProjectPermission('developer', 'canViewAnalytics')).toBe(true)
      expect(hasProjectPermission('viewer', 'canViewAnalytics')).toBe(true)
    })

    it('viewer does not have canTriggerBuilds', () => {
      expect(hasProjectPermission('viewer', 'canTriggerBuilds')).toBe(false)
    })
  })

  describe('getDefaultProjectRole', () => {
    it('owner gets admin project role', () => {
      expect(getDefaultProjectRole('owner')).toBe('admin')
    })

    it('admin gets admin project role', () => {
      expect(getDefaultProjectRole('admin')).toBe('admin')
    })

    it('member gets viewer project role', () => {
      expect(getDefaultProjectRole('member')).toBe('viewer')
    })
  })
})
