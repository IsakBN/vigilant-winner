'use client'

/**
 * useAdminUsers Hooks
 *
 * TanStack Query hooks for admin user management.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminUsers, type ListUsersParams } from '@/lib/api'
import { adminKeys } from './useAdmin'

/**
 * Hook to fetch paginated list of users with filtering
 */
export function useAdminUsers(params: ListUsersParams = {}) {
    const query = useQuery({
        queryKey: adminKeys.usersList(params),
        queryFn: () => adminUsers.list(params),
    })

    return {
        users: query.data?.users ?? [],
        total: query.data?.total ?? 0,
        page: query.data?.page ?? 1,
        limit: query.data?.limit ?? 20,
        totalPages: query.data?.totalPages ?? 0,
        isLoading: query.isLoading,
        isError: query.isError,
        error: query.error,
        refetch: query.refetch,
    }
}

/**
 * Hook to fetch a single user with full details
 */
export function useAdminUser(userId: string) {
    const query = useQuery({
        queryKey: adminKeys.userDetail(userId),
        queryFn: () => adminUsers.get(userId),
        enabled: Boolean(userId),
    })

    return {
        user: query.data?.user,
        isLoading: query.isLoading,
        isError: query.isError,
        error: query.error,
        refetch: query.refetch,
    }
}

/**
 * Hook for suspending a user
 */
export function useSuspendUser() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ userId, reason }: { userId: string; reason?: string }) =>
            adminUsers.suspend(userId, reason),
        onSuccess: (_, { userId }) => {
            void queryClient.invalidateQueries({ queryKey: adminKeys.users() })
            void queryClient.invalidateQueries({ queryKey: adminKeys.userDetail(userId) })
        },
    })
}

/**
 * Hook for unsuspending a user
 */
export function useUnsuspendUser() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (userId: string) => adminUsers.unsuspend(userId),
        onSuccess: (_, userId) => {
            void queryClient.invalidateQueries({ queryKey: adminKeys.users() })
            void queryClient.invalidateQueries({ queryKey: adminKeys.userDetail(userId) })
        },
    })
}

/**
 * Hook for banning a user
 */
export function useBanUser() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ userId, reason }: { userId: string; reason: string }) =>
            adminUsers.ban(userId, reason),
        onSuccess: (_, { userId }) => {
            void queryClient.invalidateQueries({ queryKey: adminKeys.users() })
            void queryClient.invalidateQueries({ queryKey: adminKeys.userDetail(userId) })
        },
    })
}

/**
 * Hook for unbanning a user
 */
export function useUnbanUser() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (userId: string) => adminUsers.unban(userId),
        onSuccess: (_, userId) => {
            void queryClient.invalidateQueries({ queryKey: adminKeys.users() })
            void queryClient.invalidateQueries({ queryKey: adminKeys.userDetail(userId) })
        },
    })
}

/**
 * Hook for verifying user email
 */
export function useVerifyEmail() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (userId: string) => adminUsers.verifyEmail(userId),
        onSuccess: (_, userId) => {
            void queryClient.invalidateQueries({ queryKey: adminKeys.users() })
            void queryClient.invalidateQueries({ queryKey: adminKeys.userDetail(userId) })
        },
    })
}

/**
 * Hook for sending password reset
 */
export function useSendPasswordReset() {
    return useMutation({
        mutationFn: (userId: string) => adminUsers.sendPasswordReset(userId),
    })
}

/**
 * Hook for revoking all sessions
 */
export function useRevokeAllSessions() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (userId: string) => adminUsers.revokeAllSessions(userId),
        onSuccess: (_, userId) => {
            void queryClient.invalidateQueries({ queryKey: adminKeys.userDetail(userId) })
        },
    })
}

/**
 * Hook for deleting a user
 */
export function useDeleteUser() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (userId: string) => adminUsers.delete(userId),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: adminKeys.users() })
        },
    })
}

/**
 * Combined hook for all user actions
 */
export function useUserActions() {
    return {
        ban: useBanUser(),
        unban: useUnbanUser(),
        verifyEmail: useVerifyEmail(),
        sendPasswordReset: useSendPasswordReset(),
        revokeAllSessions: useRevokeAllSessions(),
        deleteUser: useDeleteUser(),
    }
}
