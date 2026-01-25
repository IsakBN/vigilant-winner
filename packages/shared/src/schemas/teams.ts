/**
 * @agent remediate-team-schemas
 * @created 2026-01-25
 * @description Team management Zod schemas
 */
import { z } from 'zod'

// =============================================================================
// Role Definitions
// =============================================================================

export const orgRoleSchema = z.enum(['owner', 'admin', 'member'])
export type OrgRole = z.infer<typeof orgRoleSchema>

export const projectRoleSchema = z.enum(['admin', 'developer', 'viewer'])
export type ProjectRole = z.infer<typeof projectRoleSchema>

// =============================================================================
// Team CRUD
// =============================================================================

export const createTeamSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z
    .string()
    .min(3)
    .max(50)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens')
    .optional(), // Auto-generated from name if not provided
})
export type CreateTeamInput = z.infer<typeof createTeamSchema>

export const updateTeamSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  slug: z
    .string()
    .min(3)
    .max(50)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens')
    .optional(),
})
export type UpdateTeamInput = z.infer<typeof updateTeamSchema>

// =============================================================================
// Invitations
// =============================================================================

export const inviteMemberSchema = z.object({
  email: z.string().email(),
  role: orgRoleSchema.exclude(['owner']), // Can't invite as owner
})
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>

export const verifyInvitationSchema = z.object({
  otp: z.string().regex(/^[A-Z0-9]{6}$/, 'Invalid invitation code'),
  teamId: z.string().uuid().optional(), // Optional if using invite link
})
export type VerifyInvitationInput = z.infer<typeof verifyInvitationSchema>

// =============================================================================
// Member Management
// =============================================================================

export const updateMemberRoleSchema = z.object({
  role: orgRoleSchema.exclude(['owner']), // Can't change to owner
})
export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>

export const addProjectMemberSchema = z.object({
  userId: z.string().uuid(),
  role: projectRoleSchema,
})
export type AddProjectMemberInput = z.infer<typeof addProjectMemberSchema>

export const updateProjectMemberSchema = z.object({
  role: projectRoleSchema,
})
export type UpdateProjectMemberInput = z.infer<typeof updateProjectMemberSchema>
