'use client'

/**
 * useAdminOrgs Hooks
 *
 * TanStack Query hooks for admin organization management.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminOrgs, type ListAdminOrgsParams, type UpdateAdminOrgInput } from '@/lib/api'
import { adminKeys } from './useAdmin'

/**
 * Hook to fetch all organizations with filtering
 */
export function useAdminOrgs(params?: ListAdminOrgsParams) {
    const query = useQuery({
        queryKey: adminKeys.orgsList(params),
        queryFn: () => adminOrgs.list(params),
    })

    return {
        organizations: query.data?.organizations ?? [],
        total: query.data?.total ?? 0,
        isLoading: query.isLoading,
        isError: query.isError,
        error: query.error,
        refetch: query.refetch,
    }
}

/**
 * Hook to fetch a single organization with details
 */
export function useAdminOrg(orgId: string) {
    const query = useQuery({
        queryKey: adminKeys.orgDetail(orgId),
        queryFn: () => adminOrgs.get(orgId),
        enabled: Boolean(orgId),
    })

    return {
        organization: query.data?.organization,
        isLoading: query.isLoading,
        isError: query.isError,
        error: query.error,
        refetch: query.refetch,
    }
}

/**
 * Hook to update an organization
 */
export function useUpdateAdminOrg(orgId: string) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (data: UpdateAdminOrgInput) => adminOrgs.update(orgId, data),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: adminKeys.orgDetail(orgId) })
            void queryClient.invalidateQueries({ queryKey: adminKeys.orgs() })
        },
    })
}

/**
 * Hook to suspend an organization
 */
export function useSuspendOrg() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (orgId: string) => adminOrgs.suspend(orgId),
        onSuccess: (_data, orgId) => {
            void queryClient.invalidateQueries({ queryKey: adminKeys.orgDetail(orgId) })
            void queryClient.invalidateQueries({ queryKey: adminKeys.orgs() })
        },
    })
}

/**
 * Hook to reactivate an organization
 */
export function useReactivateOrg() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (orgId: string) => adminOrgs.reactivate(orgId),
        onSuccess: (_data, orgId) => {
            void queryClient.invalidateQueries({ queryKey: adminKeys.orgDetail(orgId) })
            void queryClient.invalidateQueries({ queryKey: adminKeys.orgs() })
        },
    })
}

/**
 * Hook to delete an organization
 */
export function useDeleteAdminOrg() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (orgId: string) => adminOrgs.delete(orgId),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: adminKeys.orgs() })
        },
    })
}

/**
 * Combined hook for organization actions
 */
export function useOrgActions() {
    return {
        suspend: useSuspendOrg(),
        reactivate: useReactivateOrg(),
        delete: useDeleteAdminOrg(),
    }
}
