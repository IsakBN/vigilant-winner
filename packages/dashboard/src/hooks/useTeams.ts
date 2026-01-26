'use client'

/**
 * useTeams Hooks
 *
 * TanStack Query hooks for team management, members, and invitations.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
    teams,
    type CreateTeamInput,
    type UpdateTeamInput,
    type InviteMemberInput,
    type UpdateMemberRoleInput,
} from '@/lib/api'

// =============================================================================
// Query Key Factory
// =============================================================================

export const teamsKeys = {
    all: ['teams'] as const,
    list: (accountId: string) => [...teamsKeys.all, 'list', accountId] as const,
    detail: (accountId: string, teamId: string) =>
        [...teamsKeys.all, 'detail', accountId, teamId] as const,
    members: (accountId: string, teamId: string) =>
        [...teamsKeys.all, 'members', accountId, teamId] as const,
    invitations: (accountId: string, teamId: string) =>
        [...teamsKeys.all, 'invitations', accountId, teamId] as const,
}

// =============================================================================
// Team Queries
// =============================================================================

/**
 * Hook to fetch all teams for an account
 */
export function useTeams(accountId: string) {
    const query = useQuery({
        queryKey: teamsKeys.list(accountId),
        queryFn: () => teams.list(accountId),
        enabled: Boolean(accountId),
    })

    return {
        teams: query.data?.teams ?? [],
        isLoading: query.isLoading,
        isError: query.isError,
        error: query.error,
        refetch: query.refetch,
    }
}

/**
 * Hook to fetch a single team
 */
export function useTeam(accountId: string, teamId: string) {
    return useQuery({
        queryKey: teamsKeys.detail(accountId, teamId),
        queryFn: () => teams.get(accountId, teamId),
        enabled: Boolean(accountId) && Boolean(teamId),
    })
}

/**
 * Hook to fetch team members
 */
export function useTeamMembers(accountId: string, teamId: string) {
    const query = useQuery({
        queryKey: teamsKeys.members(accountId, teamId),
        queryFn: () => teams.listMembers(accountId, teamId),
        enabled: Boolean(accountId) && Boolean(teamId),
    })

    return {
        members: query.data?.members ?? [],
        isLoading: query.isLoading,
        isError: query.isError,
        error: query.error,
        refetch: query.refetch,
    }
}

/**
 * Hook to fetch team invitations
 */
export function useInvitations(accountId: string, teamId: string) {
    const query = useQuery({
        queryKey: teamsKeys.invitations(accountId, teamId),
        queryFn: () => teams.listInvitations(accountId, teamId),
        enabled: Boolean(accountId) && Boolean(teamId),
    })

    return {
        invitations: query.data?.invitations ?? [],
        isLoading: query.isLoading,
        isError: query.isError,
        error: query.error,
        refetch: query.refetch,
    }
}

// =============================================================================
// Team Mutations
// =============================================================================

/**
 * Hook to create a new team
 */
export function useCreateTeam(accountId: string) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (data: CreateTeamInput) => teams.create(accountId, data),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: teamsKeys.list(accountId) })
        },
    })
}

/**
 * Hook to update a team
 */
export function useUpdateTeam(accountId: string, teamId: string) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (data: UpdateTeamInput) => teams.update(accountId, teamId, data),
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: teamsKeys.detail(accountId, teamId),
            })
            void queryClient.invalidateQueries({ queryKey: teamsKeys.list(accountId) })
        },
    })
}

/**
 * Hook to delete a team
 */
export function useDeleteTeam(accountId: string) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (teamId: string) => teams.delete(accountId, teamId),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: teamsKeys.list(accountId) })
        },
    })
}

// =============================================================================
// Member Mutations
// =============================================================================

/**
 * Hook to invite a new member
 */
export function useInviteMember(accountId: string, teamId: string) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (data: InviteMemberInput) =>
            teams.inviteMember(accountId, teamId, data),
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: teamsKeys.invitations(accountId, teamId),
            })
        },
    })
}

/**
 * Hook to update a member's role
 */
export function useUpdateMemberRole(accountId: string, teamId: string) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ memberId, data }: { memberId: string; data: UpdateMemberRoleInput }) =>
            teams.updateMemberRole(accountId, teamId, memberId, data),
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: teamsKeys.members(accountId, teamId),
            })
        },
    })
}

/**
 * Hook to remove a member
 */
export function useRemoveMember(accountId: string, teamId: string) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (memberId: string) => teams.removeMember(accountId, teamId, memberId),
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: teamsKeys.members(accountId, teamId),
            })
            void queryClient.invalidateQueries({
                queryKey: teamsKeys.detail(accountId, teamId),
            })
        },
    })
}

// =============================================================================
// Invitation Mutations
// =============================================================================

/**
 * Hook to resend an invitation
 */
export function useResendInvitation(accountId: string, teamId: string) {
    return useMutation({
        mutationFn: (invitationId: string) =>
            teams.resendInvitation(accountId, teamId, invitationId),
    })
}

/**
 * Hook to cancel an invitation
 */
export function useCancelInvitation(accountId: string, teamId: string) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (invitationId: string) =>
            teams.cancelInvitation(accountId, teamId, invitationId),
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: teamsKeys.invitations(accountId, teamId),
            })
        },
    })
}
