/**
 * Teams API for BundleNudge App Dashboard
 *
 * Provides typed API methods for team management, members, and invitations.
 */

import { apiClient } from './client'
import type {
    CreateTeamInput,
    UpdateTeamInput,
    InviteMemberInput,
    UpdateMemberRoleInput,
    ListTeamsResponse,
    GetTeamResponse,
    CreateTeamResponse,
    ListMembersResponse,
    ListInvitationsResponse,
    InviteMemberResponse,
} from './types'

export const teams = {
    /**
     * List all teams for the current account
     */
    list(accountId: string): Promise<ListTeamsResponse> {
        return apiClient.get(`/api/accounts/${accountId}/teams`)
    },

    /**
     * Get a single team by ID
     */
    get(accountId: string, teamId: string): Promise<GetTeamResponse> {
        return apiClient.get(`/api/accounts/${accountId}/teams/${teamId}`)
    },

    /**
     * Create a new team
     */
    create(accountId: string, data: CreateTeamInput): Promise<CreateTeamResponse> {
        return apiClient.post(`/api/accounts/${accountId}/teams`, data)
    },

    /**
     * Update team details
     */
    update(accountId: string, teamId: string, data: UpdateTeamInput): Promise<void> {
        return apiClient.patch(`/api/accounts/${accountId}/teams/${teamId}`, data)
    },

    /**
     * Delete a team (owner only)
     */
    delete(accountId: string, teamId: string): Promise<void> {
        return apiClient.delete(`/api/accounts/${accountId}/teams/${teamId}`)
    },

    // =========================================================================
    // Members
    // =========================================================================

    /**
     * List team members
     */
    listMembers(accountId: string, teamId: string): Promise<ListMembersResponse> {
        return apiClient.get(`/api/accounts/${accountId}/teams/${teamId}/members`)
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
            `/api/accounts/${accountId}/teams/${teamId}/members/${memberId}`,
            data
        )
    },

    /**
     * Remove member from team
     */
    removeMember(accountId: string, teamId: string, memberId: string): Promise<void> {
        return apiClient.delete(
            `/api/accounts/${accountId}/teams/${teamId}/members/${memberId}`
        )
    },

    /**
     * Leave a team (current user)
     */
    leave(accountId: string, teamId: string): Promise<void> {
        return apiClient.post(`/api/accounts/${accountId}/teams/${teamId}/leave`)
    },

    // =========================================================================
    // Invitations
    // =========================================================================

    /**
     * List pending invitations
     */
    listInvitations(accountId: string, teamId: string): Promise<ListInvitationsResponse> {
        return apiClient.get(`/api/accounts/${accountId}/teams/${teamId}/invitations`)
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
            `/api/accounts/${accountId}/teams/${teamId}/invitations`,
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
            `/api/accounts/${accountId}/teams/${teamId}/invitations/${invitationId}/resend`
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
            `/api/accounts/${accountId}/teams/${teamId}/invitations/${invitationId}`
        )
    },
}
