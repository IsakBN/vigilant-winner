/**
 * Teams API for BundleNudge Dashboard
 *
 * Provides typed API methods for team management, members, and invitations.
 */

import { apiClient } from './client'

// =============================================================================
// Types
// =============================================================================

export type TeamRole = 'owner' | 'admin' | 'member'
export type InvitationStatus = 'pending' | 'accepted' | 'expired' | 'cancelled'

export interface Team {
    id: string
    name: string
    slug: string
    domain: string | null
    planId: string | null
    createdAt: number
    updatedAt?: number
    myRole: TeamRole
    memberCount?: number
}

export interface TeamMember {
    id: string
    userId: string
    email: string
    name: string | null
    avatarUrl: string | null
    role: TeamRole
    createdAt: number
}

export interface TeamInvitation {
    id: string
    email: string
    role: 'admin' | 'member'
    status: InvitationStatus
    createdAt: number
    expiresAt: number
    invitedBy: string
    invitedByEmail?: string
}

export interface CreateTeamInput {
    name: string
    slug: string
}

export interface UpdateTeamInput {
    name?: string
}

export interface InviteMemberInput {
    email: string
    role?: 'admin' | 'member'
}

export interface UpdateMemberRoleInput {
    role: 'admin' | 'member'
}

// Response types
export interface ListTeamsResponse {
    teams: Team[]
}

export interface GetTeamResponse {
    team: Team
}

export interface CreateTeamResponse {
    team: Team
}

export interface ListMembersResponse {
    members: TeamMember[]
}

export interface ListInvitationsResponse {
    invitations: TeamInvitation[]
}

export interface InviteMemberResponse {
    invitation: {
        id: string
        email: string
        role: string
        expiresAt: number
    }
}

// =============================================================================
// API Methods
// =============================================================================

export const teams = {
    /**
     * List all teams for the current account
     */
    list(accountId: string): Promise<ListTeamsResponse> {
        return apiClient.get(`/accounts/${accountId}/teams`)
    },

    /**
     * Get a single team by ID
     */
    get(accountId: string, teamId: string): Promise<GetTeamResponse> {
        return apiClient.get(`/accounts/${accountId}/teams/${teamId}`)
    },

    /**
     * Create a new team
     */
    create(accountId: string, data: CreateTeamInput): Promise<CreateTeamResponse> {
        return apiClient.post(`/accounts/${accountId}/teams`, data)
    },

    /**
     * Update team details
     */
    update(accountId: string, teamId: string, data: UpdateTeamInput): Promise<void> {
        return apiClient.patch(`/accounts/${accountId}/teams/${teamId}`, data)
    },

    /**
     * Delete a team (owner only)
     */
    delete(accountId: string, teamId: string): Promise<void> {
        return apiClient.delete(`/accounts/${accountId}/teams/${teamId}`)
    },

    // =========================================================================
    // Members
    // =========================================================================

    /**
     * List team members
     */
    listMembers(accountId: string, teamId: string): Promise<ListMembersResponse> {
        return apiClient.get(`/accounts/${accountId}/teams/${teamId}/members`)
    },

    /**
     * Update member role
     */
    updateMemberRole(
        accountId: string,
        teamId: string,
        memberId: string,
        data: UpdateMemberRoleInput
    ): Promise<void> {
        return apiClient.patch(
            `/accounts/${accountId}/teams/${teamId}/members/${memberId}`,
            data
        )
    },

    /**
     * Remove member from team
     */
    removeMember(accountId: string, teamId: string, memberId: string): Promise<void> {
        return apiClient.delete(
            `/accounts/${accountId}/teams/${teamId}/members/${memberId}`
        )
    },

    // =========================================================================
    // Invitations
    // =========================================================================

    /**
     * List pending invitations
     */
    listInvitations(accountId: string, teamId: string): Promise<ListInvitationsResponse> {
        return apiClient.get(`/accounts/${accountId}/teams/${teamId}/invitations`)
    },

    /**
     * Invite a new member
     */
    inviteMember(
        accountId: string,
        teamId: string,
        data: InviteMemberInput
    ): Promise<InviteMemberResponse> {
        return apiClient.post(
            `/accounts/${accountId}/teams/${teamId}/invitations`,
            data
        )
    },

    /**
     * Resend invitation email
     */
    resendInvitation(
        accountId: string,
        teamId: string,
        invitationId: string
    ): Promise<void> {
        return apiClient.post(
            `/accounts/${accountId}/teams/${teamId}/invitations/${invitationId}/resend`
        )
    },

    /**
     * Cancel invitation
     */
    cancelInvitation(
        accountId: string,
        teamId: string,
        invitationId: string
    ): Promise<void> {
        return apiClient.delete(
            `/accounts/${accountId}/teams/${teamId}/invitations/${invitationId}`
        )
    },
}
