'use client'

/**
 * useReleaseRollout Hook
 *
 * Provides a simplified API for managing release rollout state,
 * including percentage control, pause/resume, and rollback actions.
 */

import { useState, useCallback } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { releases, type ReleaseStatus, type UpdateReleaseInput } from '@/lib/api/releases'
import { releaseKeys } from '@/hooks/useReleases'

// =============================================================================
// Types
// =============================================================================

interface UseReleaseRolloutOptions {
    appId: string
    releaseId: string
    initialPercentage?: number
    initialStatus?: ReleaseStatus
    onSuccess?: (action: RolloutAction) => void
    onError?: (error: Error, action: RolloutAction) => void
}

type RolloutAction =
    | 'update_percentage'
    | 'pause'
    | 'resume'
    | 'rollback'
    | 'update_targeting'

interface RolloutState {
    percentage: number
    status: ReleaseStatus
    allowlist: string[]
    blocklist: string[]
}

interface UseReleaseRolloutReturn {
    // Current state
    state: RolloutState
    isActive: boolean
    isPaused: boolean
    isUpdating: boolean
    currentAction: RolloutAction | null
    error: Error | null

    // Actions
    setPercentage: (percentage: number) => void
    commitPercentage: () => void
    pause: () => void
    resume: () => void
    rollback: (reason?: string) => void
    addToAllowlist: (deviceId: string) => void
    removeFromAllowlist: (deviceId: string) => void
    addToBlocklist: (deviceId: string) => void
    removeFromBlocklist: (deviceId: string) => void
}

// =============================================================================
// Hook Implementation
// =============================================================================

export function useReleaseRollout({
    appId,
    releaseId,
    initialPercentage = 0,
    initialStatus = 'draft',
    onSuccess,
    onError,
}: UseReleaseRolloutOptions): UseReleaseRolloutReturn {
    const queryClient = useQueryClient()

    // Local state for optimistic updates
    const [state, setState] = useState<RolloutState>({
        percentage: initialPercentage,
        status: initialStatus,
        allowlist: [],
        blocklist: [],
    })

    const [currentAction, setCurrentAction] = useState<RolloutAction | null>(null)
    const [error, setError] = useState<Error | null>(null)

    // Derived state
    const isActive = state.status === 'active' || state.status === 'rolling'
    const isPaused = state.status === 'paused'

    // Invalidate queries helper
    const invalidateQueries = useCallback(() => {
        void queryClient.invalidateQueries({
            queryKey: releaseKeys.list(appId),
        })
        void queryClient.invalidateQueries({
            queryKey: releaseKeys.detail(appId, releaseId),
        })
    }, [queryClient, appId, releaseId])

    // Update mutation
    const updateMutation = useMutation({
        mutationFn: (data: UpdateReleaseInput) =>
            releases.update(appId, releaseId, data),
        onSuccess: () => {
            invalidateQueries()
            if (currentAction) {
                onSuccess?.(currentAction)
            }
            setError(null)
        },
        onError: (err) => {
            const error = err instanceof Error ? err : new Error('Unknown error')
            setError(error)
            if (currentAction) {
                onError?.(error, currentAction)
            }
        },
        onSettled: () => {
            setCurrentAction(null)
        },
    })

    // Actions
    const setPercentage = useCallback((percentage: number) => {
        const clampedValue = Math.max(0, Math.min(100, percentage))
        setState((prev) => ({ ...prev, percentage: clampedValue }))
    }, [])

    const commitPercentage = useCallback(() => {
        setCurrentAction('update_percentage')
        updateMutation.mutate({
            rolloutPercentage: state.percentage,
        })
    }, [state.percentage, updateMutation])

    const pause = useCallback(() => {
        setCurrentAction('pause')
        setState((prev) => ({ ...prev, status: 'paused' }))
        updateMutation.mutate({
            status: 'paused',
        })
    }, [updateMutation])

    const resume = useCallback(() => {
        setCurrentAction('resume')
        setState((prev) => ({ ...prev, status: 'active' }))
        updateMutation.mutate({
            status: 'active',
        })
    }, [updateMutation])

    const rollback = useCallback((_reason?: string) => {
        setCurrentAction('rollback')
        setState((prev) => ({ ...prev, status: 'disabled', percentage: 0 }))
        updateMutation.mutate({
            status: 'disabled',
        })
    }, [updateMutation])

    const addToAllowlist = useCallback((deviceId: string) => {
        const newAllowlist = [...state.allowlist, deviceId]
        setState((prev) => ({ ...prev, allowlist: newAllowlist }))
        setCurrentAction('update_targeting')
        updateMutation.mutate({
            allowlist: newAllowlist,
        })
    }, [state.allowlist, updateMutation])

    const removeFromAllowlist = useCallback((deviceId: string) => {
        const newAllowlist = state.allowlist.filter((id) => id !== deviceId)
        setState((prev) => ({ ...prev, allowlist: newAllowlist }))
        setCurrentAction('update_targeting')
        updateMutation.mutate({
            allowlist: newAllowlist,
        })
    }, [state.allowlist, updateMutation])

    const addToBlocklist = useCallback((deviceId: string) => {
        const newBlocklist = [...state.blocklist, deviceId]
        setState((prev) => ({ ...prev, blocklist: newBlocklist }))
        setCurrentAction('update_targeting')
        updateMutation.mutate({
            blocklist: newBlocklist,
        })
    }, [state.blocklist, updateMutation])

    const removeFromBlocklist = useCallback((deviceId: string) => {
        const newBlocklist = state.blocklist.filter((id) => id !== deviceId)
        setState((prev) => ({ ...prev, blocklist: newBlocklist }))
        setCurrentAction('update_targeting')
        updateMutation.mutate({
            blocklist: newBlocklist,
        })
    }, [state.blocklist, updateMutation])

    return {
        state,
        isActive,
        isPaused,
        isUpdating: updateMutation.isPending,
        currentAction,
        error,
        setPercentage,
        commitPercentage,
        pause,
        resume,
        rollback,
        addToAllowlist,
        removeFromAllowlist,
        addToBlocklist,
        removeFromBlocklist,
    }
}

// =============================================================================
// Preset Helper
// =============================================================================

export const ROLLOUT_PRESETS = [10, 25, 50, 100] as const

export type RolloutPreset = (typeof ROLLOUT_PRESETS)[number]
