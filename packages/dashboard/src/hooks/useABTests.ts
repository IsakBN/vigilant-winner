'use client'

/**
 * A/B Testing Hooks for BundleNudge Dashboard
 *
 * TanStack Query hooks for A/B test management.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient, buildQueryString } from '@/lib/api/client'

// Types (temporary until ab-tests.ts API client is created)

export interface ABTestVariant {
    id: string
    name: string
    releaseId: string
    weight: number
    impressions: number
    conversions: number
    crashRate: number
}

export interface ABTestResults {
    id: string
    appId: string
    name: string
    status: 'draft' | 'running' | 'paused' | 'completed'
    variants: ABTestVariant[]
    winnerId: string | null
    totalImpressions: number
    startedAt: string | null
    completedAt: string | null
    createdAt: string
    updatedAt: string
}

export interface ABTest {
    id: string
    appId: string
    name: string
    description: string | null
    status: 'draft' | 'running' | 'paused' | 'completed'
    winnerId: string | null
    createdAt: string
    updatedAt: string
}

export interface VersionDistribution {
    version: string
    releaseId: string
    deviceCount: number
    percentage: number
}

export interface ListABTestsParams {
    page?: number
    limit?: number
}

interface ListABTestsResponse {
    tests: ABTest[]
    pagination: { page: number; limit: number; total: number; totalPages: number }
}

interface GetABTestResultsResponse {
    results: ABTestResults
}

interface GetVersionDistributionResponse {
    distributions: VersionDistribution[]
    totalDevices: number
}

export interface CreateABTestInput {
    name: string
    description?: string
    variants: Array<{ name: string; releaseId: string; weight: number }>
}

interface CreateABTestResponse {
    test: ABTest
}

interface DeclareWinnerInput {
    releaseId: string
    testId: string
}

interface UpdateRolloutInput {
    releaseId: string
    percentage: number
}

// Query Keys

export const abTestKeys = {
    all: ['ab-tests'] as const,
    lists: () => [...abTestKeys.all, 'list'] as const,
    list: (appId: string, params?: ListABTestsParams) =>
        [...abTestKeys.lists(), appId, params] as const,
    results: () => [...abTestKeys.all, 'results'] as const,
    result: (releaseId: string) => [...abTestKeys.results(), releaseId] as const,
    versionDistribution: (appId: string) =>
        [...abTestKeys.all, 'version-distribution', appId] as const,
}

// Hooks

interface UseABTestResultsOptions {
    polling?: boolean
    enabled?: boolean
}

export function useABTestResults(
    releaseId: string,
    options?: UseABTestResultsOptions
) {
    return useQuery({
        queryKey: abTestKeys.result(releaseId),
        queryFn: () =>
            apiClient.get<GetABTestResultsResponse>(
                `/releases/${releaseId}/ab-test-results`
            ),
        enabled: Boolean(releaseId) && (options?.enabled ?? true),
        refetchInterval: options?.polling ? 5000 : undefined,
        staleTime: options?.polling ? 0 : 30 * 1000,
        select: (data) => data.results,
    })
}

interface UseABTestListOptions {
    enabled?: boolean
    refetchOnWindowFocus?: boolean
}

export function useABTestList(
    appId: string,
    params?: ListABTestsParams,
    options?: UseABTestListOptions
) {
    const queryString = buildQueryString({
        page: params?.page,
        limit: params?.limit,
    })

    return useQuery({
        queryKey: abTestKeys.list(appId, params),
        queryFn: () =>
            apiClient.get<ListABTestsResponse>(`/apps/${appId}/ab-tests${queryString}`),
        enabled: Boolean(appId) && (options?.enabled ?? true),
        refetchOnWindowFocus: options?.refetchOnWindowFocus ?? true,
        staleTime: 30 * 1000,
        select: (data) => ({
            tests: data.tests,
            pagination: data.pagination,
        }),
    })
}

interface UseVersionDistributionOptions {
    enabled?: boolean
    refetchInterval?: number
}

export function useVersionDistribution(
    appId: string,
    options?: UseVersionDistributionOptions
) {
    return useQuery({
        queryKey: abTestKeys.versionDistribution(appId),
        queryFn: () =>
            apiClient.get<GetVersionDistributionResponse>(
                `/apps/${appId}/version-distribution`
            ),
        enabled: Boolean(appId) && (options?.enabled ?? true),
        refetchInterval: options?.refetchInterval,
        staleTime: 60 * 1000,
        select: (data) => ({
            distributions: data.distributions,
            totalDevices: data.totalDevices,
        }),
    })
}

// Mutations

export function useCreateABTest(appId: string) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (data: CreateABTestInput) =>
            apiClient.post<CreateABTestResponse>(`/apps/${appId}/ab-tests`, data),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: abTestKeys.lists() })
        },
    })
}

export function useDeclareWinner() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ releaseId, testId }: DeclareWinnerInput) =>
            apiClient.post(`/releases/${releaseId}/ab-tests/${testId}/declare-winner`),
        onSuccess: (_data, variables) => {
            void queryClient.invalidateQueries({
                queryKey: abTestKeys.result(variables.releaseId),
            })
            void queryClient.invalidateQueries({ queryKey: abTestKeys.lists() })
        },
    })
}

export function useUpdateRollout() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ releaseId, percentage }: UpdateRolloutInput) =>
            apiClient.patch(`/releases/${releaseId}/rollout`, { percentage }),
        onSuccess: (_data, variables) => {
            void queryClient.invalidateQueries({
                queryKey: abTestKeys.result(variables.releaseId),
            })
        },
    })
}
