'use client'

/**
 * useSettings Hooks
 *
 * TanStack Query hooks for user settings management.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
    settings,
    type UpdateProfileInput,
    type ChangePasswordInput,
} from '@/lib/api/settings'

/**
 * Query key factory for settings
 */
export const settingsKeys = {
    all: ['settings'] as const,
    profile: (accountId: string) =>
        [...settingsKeys.all, 'profile', accountId] as const,
}

/**
 * Hook to fetch user profile
 */
export function useProfile(accountId: string) {
    return useQuery({
        queryKey: settingsKeys.profile(accountId),
        queryFn: () => settings.getProfile(accountId),
        enabled: Boolean(accountId),
    })
}

/**
 * Hook to update user profile
 */
export function useUpdateProfile(accountId: string) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (data: UpdateProfileInput) =>
            settings.updateProfile(accountId, data),
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: settingsKeys.profile(accountId),
            })
        },
    })
}

/**
 * Hook to change password
 */
export function useChangePassword(accountId: string) {
    return useMutation({
        mutationFn: (data: ChangePasswordInput) =>
            settings.changePassword(accountId, data),
    })
}

/**
 * Hook to upload avatar
 */
export function useUploadAvatar(accountId: string) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (file: File) => settings.uploadAvatar(accountId, file),
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: settingsKeys.profile(accountId),
            })
        },
    })
}

/**
 * Hook to delete account
 */
export function useDeleteAccount(accountId: string) {
    return useMutation({
        mutationFn: () => settings.deleteAccount(accountId),
    })
}
