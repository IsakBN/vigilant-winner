'use client'

/**
 * Release Action Hooks - TanStack Query mutations for release management.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient, ApiClientError } from '@/lib/api'

interface ReleaseActionOptions {
    accountId: string
    appId: string
    onSuccess?: () => void
    onError?: (error: ApiClientError) => void
}

interface ReleaseIdOptions extends ReleaseActionOptions {
    releaseId: string
}

const releaseKeys = {
    all: (accountId: string, appId: string) => ['releases', accountId, appId] as const,
    detail: (accountId: string, appId: string, releaseId: string) => ['releases', accountId, appId, releaseId] as const,
}

function useReleaseMutation<T = void>(
    { accountId, appId, releaseId, onSuccess, onError }: ReleaseIdOptions,
    mutationFn: () => Promise<T>,
    invalidateDetail = true
) {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn,
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: releaseKeys.all(accountId, appId) })
            if (invalidateDetail) {
                void queryClient.invalidateQueries({ queryKey: releaseKeys.detail(accountId, appId, releaseId) })
            }
            onSuccess?.()
        },
        onError: (error) => { if (error instanceof ApiClientError) onError?.(error) },
    })
}

export function useEnableRelease(opts: ReleaseIdOptions) {
    return useReleaseMutation(opts, () => apiClient.post(`/accounts/${opts.accountId}/apps/${opts.appId}/releases/${opts.releaseId}/enable`))
}

export function useDisableRelease(opts: ReleaseIdOptions) {
    return useReleaseMutation(opts, () => apiClient.post(`/accounts/${opts.accountId}/apps/${opts.appId}/releases/${opts.releaseId}/disable`))
}

export function useRollbackRelease(opts: ReleaseIdOptions) {
    return useReleaseMutation(opts, () => apiClient.post(`/accounts/${opts.accountId}/apps/${opts.appId}/releases/${opts.releaseId}/rollback`), false)
}

export function useDeleteRelease(opts: ReleaseIdOptions) {
    return useReleaseMutation(opts, () => apiClient.delete(`/accounts/${opts.accountId}/apps/${opts.appId}/releases/${opts.releaseId}`), false)
}

interface UseUpdateRolloutOptions extends Omit<ReleaseIdOptions, 'onSuccess'> {
    onSuccess?: (rollout: number) => void
}

export function useUpdateRollout({ accountId, appId, releaseId, onSuccess, onError }: UseUpdateRolloutOptions) {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (input: { rollout: number }) => apiClient.patch<{ rollout: number }>(`/accounts/${accountId}/apps/${appId}/releases/${releaseId}/rollout`, input),
        onSuccess: (data) => {
            void queryClient.invalidateQueries({ queryKey: releaseKeys.all(accountId, appId) })
            void queryClient.invalidateQueries({ queryKey: releaseKeys.detail(accountId, appId, releaseId) })
            onSuccess?.(data.rollout)
        },
        onError: (error) => { if (error instanceof ApiClientError) onError?.(error) },
    })
}

interface UseReleaseActionsOptions {
    accountId: string
    appId: string
    releaseId: string
    onSuccess?: (action: string) => void
    onError?: (error: ApiClientError, action: string) => void
}

export function useReleaseActions({ accountId, appId, releaseId, onSuccess, onError }: UseReleaseActionsOptions) {
    const baseOptions = { accountId, appId, releaseId }

    const enableMutation = useEnableRelease({ ...baseOptions, onSuccess: () => onSuccess?.('enable'), onError: (e) => onError?.(e, 'enable') })
    const disableMutation = useDisableRelease({ ...baseOptions, onSuccess: () => onSuccess?.('disable'), onError: (e) => onError?.(e, 'disable') })
    const rollbackMutation = useRollbackRelease({ ...baseOptions, onSuccess: () => onSuccess?.('rollback'), onError: (e) => onError?.(e, 'rollback') })
    const deleteMutation = useDeleteRelease({ ...baseOptions, onSuccess: () => onSuccess?.('delete'), onError: (e) => onError?.(e, 'delete') })
    const rolloutMutation = useUpdateRollout({ ...baseOptions, onSuccess: () => onSuccess?.('rollout'), onError: (e) => onError?.(e, 'rollout') })

    const isLoading = enableMutation.isPending || disableMutation.isPending || rollbackMutation.isPending || deleteMutation.isPending || rolloutMutation.isPending

    const currentAction = enableMutation.isPending ? 'enable' : disableMutation.isPending ? 'disable' : rollbackMutation.isPending ? 'rollback' : deleteMutation.isPending ? 'delete' : rolloutMutation.isPending ? 'rollout' : null

    return {
        enable: enableMutation.mutate,
        disable: disableMutation.mutate,
        rollback: rollbackMutation.mutate,
        delete: deleteMutation.mutate,
        updateRollout: rolloutMutation.mutate,
        isLoading,
        currentAction,
        enableMutation,
        disableMutation,
        rollbackMutation,
        deleteMutation,
        rolloutMutation,
    }
}
