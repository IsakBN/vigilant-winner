'use client'

/**
 * useNewsletter Hooks
 *
 * TanStack Query hooks for newsletter subscriber and campaign management.
 *
 * @agent newsletter-system
 * @created 2026-01-27
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
    newsletter,
    type ListSubscribersParams,
    type ListCampaignsParams,
    type CreateCampaignInput,
    type UpdateCampaignInput,
    type SendCampaignInput,
    type ImportSubscribersInput,
} from '@/lib/api'

/**
 * Query key factory for newsletter
 */
export const newsletterKeys = {
    all: ['newsletter'] as const,
    subscribers: () => [...newsletterKeys.all, 'subscribers'] as const,
    subscribersList: (params?: ListSubscribersParams) =>
        [...newsletterKeys.subscribers(), 'list', params] as const,
    campaigns: () => [...newsletterKeys.all, 'campaigns'] as const,
    campaignsList: (params?: ListCampaignsParams) =>
        [...newsletterKeys.campaigns(), 'list', params] as const,
    campaignDetail: (id: string) => [...newsletterKeys.campaigns(), 'detail', id] as const,
    campaignPreview: (id: string) => [...newsletterKeys.campaigns(), 'preview', id] as const,
    campaignStats: (id: string) => [...newsletterKeys.campaigns(), 'stats', id] as const,
}

// =============================================================================
// Subscriber Hooks
// =============================================================================

/**
 * Hook to fetch paginated list of subscribers
 */
export function useSubscribers(params: ListSubscribersParams = {}) {
    const query = useQuery({
        queryKey: newsletterKeys.subscribersList(params),
        queryFn: () => newsletter.listSubscribers(params),
    })

    return {
        subscribers: query.data?.subscribers ?? [],
        pagination: query.data?.pagination ?? { total: 0, limit: 50, offset: 0, hasMore: false },
        isLoading: query.isLoading,
        isError: query.isError,
        error: query.error,
        refetch: query.refetch,
    }
}

/**
 * Hook for importing subscribers from CSV
 */
export function useImportSubscribers() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (data: ImportSubscribersInput) => newsletter.importSubscribers(data),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: newsletterKeys.subscribers() })
        },
    })
}

/**
 * Hook for exporting subscribers to CSV
 */
export function useExportSubscribers() {
    return useMutation({
        mutationFn: () => newsletter.exportSubscribers(),
        onSuccess: (blob) => {
            const url = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = `subscribers-${Date.now()}.csv`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            URL.revokeObjectURL(url)
        },
    })
}

// =============================================================================
// Campaign Hooks
// =============================================================================

/**
 * Hook to fetch paginated list of campaigns
 */
export function useCampaigns(params: ListCampaignsParams = {}) {
    const query = useQuery({
        queryKey: newsletterKeys.campaignsList(params),
        queryFn: () => newsletter.listCampaigns(params),
    })

    return {
        campaigns: query.data?.campaigns ?? [],
        pagination: query.data?.pagination ?? { total: 0, limit: 20, offset: 0, hasMore: false },
        isLoading: query.isLoading,
        isError: query.isError,
        error: query.error,
        refetch: query.refetch,
    }
}

/**
 * Hook to fetch a single campaign with full content
 */
export function useCampaign(campaignId: string) {
    const query = useQuery({
        queryKey: newsletterKeys.campaignDetail(campaignId),
        queryFn: () => newsletter.getCampaign(campaignId),
        enabled: Boolean(campaignId),
    })

    return {
        campaign: query.data?.campaign,
        isLoading: query.isLoading,
        isError: query.isError,
        error: query.error,
        refetch: query.refetch,
    }
}

/**
 * Hook to fetch campaign preview HTML
 */
export function useCampaignPreview(campaignId: string) {
    const query = useQuery({
        queryKey: newsletterKeys.campaignPreview(campaignId),
        queryFn: () => newsletter.previewCampaign(campaignId),
        enabled: Boolean(campaignId),
    })

    return {
        preview: query.data,
        isLoading: query.isLoading,
        isError: query.isError,
        error: query.error,
        refetch: query.refetch,
    }
}

/**
 * Hook to fetch campaign statistics
 */
export function useCampaignStats(campaignId: string) {
    const query = useQuery({
        queryKey: newsletterKeys.campaignStats(campaignId),
        queryFn: () => newsletter.getCampaignStats(campaignId),
        enabled: Boolean(campaignId),
    })

    return {
        stats: query.data?.stats,
        isLoading: query.isLoading,
        isError: query.isError,
        error: query.error,
        refetch: query.refetch,
    }
}

/**
 * Hook for creating a new campaign
 */
export function useCreateCampaign() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (data: CreateCampaignInput) => newsletter.createCampaign(data),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: newsletterKeys.campaigns() })
        },
    })
}

/**
 * Hook for updating a campaign
 */
export function useUpdateCampaign(campaignId: string) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (data: UpdateCampaignInput) => newsletter.updateCampaign(campaignId, data),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: newsletterKeys.campaignDetail(campaignId) })
            void queryClient.invalidateQueries({ queryKey: newsletterKeys.campaignPreview(campaignId) })
            void queryClient.invalidateQueries({ queryKey: newsletterKeys.campaigns() })
        },
    })
}

/**
 * Hook for deleting a campaign
 */
export function useDeleteCampaign() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (campaignId: string) => newsletter.deleteCampaign(campaignId),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: newsletterKeys.campaigns() })
        },
    })
}

/**
 * Hook for sending test email
 */
export function useSendTestEmail(campaignId: string) {
    return useMutation({
        mutationFn: (email: string) => newsletter.sendTestEmail(campaignId, email),
    })
}

/**
 * Hook for sending or scheduling campaign
 */
export function useSendCampaign(campaignId: string) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (data: SendCampaignInput = {}) => newsletter.sendCampaign(campaignId, data),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: newsletterKeys.campaignDetail(campaignId) })
            void queryClient.invalidateQueries({ queryKey: newsletterKeys.campaigns() })
        },
    })
}

/**
 * Combined hook for all campaign actions
 */
export function useCampaignActions(campaignId: string) {
    return {
        update: useUpdateCampaign(campaignId),
        delete: useDeleteCampaign(),
        sendTest: useSendTestEmail(campaignId),
        send: useSendCampaign(campaignId),
    }
}
