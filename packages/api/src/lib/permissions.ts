/**
 * Permission definitions for RBAC
 *
 * Defines granular permissions for organization and project roles.
 */

// =============================================================================
// Organization Permissions
// =============================================================================

export const ORG_PERMISSIONS = {
  owner: {
    canManageOrg: true,
    canDeleteOrg: true,
    canManageMembers: true,
    canManageAdmins: true,
    canManageBilling: true,
    canManageProjects: true,
    canViewAuditLog: true,
  },
  admin: {
    canManageOrg: false,
    canDeleteOrg: false,
    canManageMembers: true,
    canManageAdmins: false,
    canManageBilling: false,
    canManageProjects: true,
    canViewAuditLog: true,
  },
  member: {
    canManageOrg: false,
    canDeleteOrg: false,
    canManageMembers: false,
    canManageAdmins: false,
    canManageBilling: false,
    canManageProjects: false,
    canViewAuditLog: false,
  },
} as const

// =============================================================================
// Project Permissions
// =============================================================================

export const PROJECT_PERMISSIONS = {
  admin: {
    canManageProject: true,
    canManageReleases: true,
    canManageCredentials: true,
    canViewAnalytics: true,
    canTriggerBuilds: true,
  },
  developer: {
    canManageProject: false,
    canManageReleases: true,
    canManageCredentials: false,
    canViewAnalytics: true,
    canTriggerBuilds: true,
  },
  viewer: {
    canManageProject: false,
    canManageReleases: false,
    canManageCredentials: false,
    canViewAnalytics: true,
    canTriggerBuilds: false,
  },
} as const

// =============================================================================
// Types
// =============================================================================

export type OrgRole = keyof typeof ORG_PERMISSIONS
export type ProjectRole = keyof typeof PROJECT_PERMISSIONS
export type OrgPermission = keyof (typeof ORG_PERMISSIONS)['owner']
export type ProjectPermission = keyof (typeof PROJECT_PERMISSIONS)['admin']

// =============================================================================
// Permission Checks
// =============================================================================

/**
 * Check if an organization role has a specific permission
 */
export function hasOrgPermission(role: OrgRole, permission: OrgPermission): boolean {
  return ORG_PERMISSIONS[role][permission]
}

/**
 * Check if a project role has a specific permission
 */
export function hasProjectPermission(role: ProjectRole, permission: ProjectPermission): boolean {
  return PROJECT_PERMISSIONS[role][permission]
}

/**
 * Get the default project role for an organization role
 * Org owners/admins get admin project access, members get viewer
 */
export function getDefaultProjectRole(orgRole: OrgRole): ProjectRole {
  if (orgRole === 'owner' || orgRole === 'admin') {
    return 'admin'
  }
  return 'viewer'
}
