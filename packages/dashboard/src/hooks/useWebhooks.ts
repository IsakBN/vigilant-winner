'use client'

/**
 * useWebhooks Hook
 *
 * TanStack Query hooks for webhook management.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
    webhooks,
    type CreateWebhookInput,
    type UpdateWebhookInput,
} from '@/lib/api'

/**
 * Query key factory for webhooks
 */
export const webhooksKeys = {
    all: ['webhooks'] as const,
    list: (accountId: string, appId?: string) =>
        [...webhooksKeys.all, 'list', accountId, appId] as const,
    detail: (accountId: string, webhookId: string) =>
        [...webhooksKeys.all, 'detail', accountId, webhookId] as const,
    deliveries: (accountId: string, webhookId: string) =>
        [...webhooksKeys.all, 'deliveries', accountId, webhookId] as const,
}

/**
 * Hook to fetch webhooks list
 */
export function useWebhooks(accountId: string, appId?: string) {
    return useQuery({
        queryKey: webhooksKeys.list(accountId, appId),
        queryFn: () => webhooks.list(accountId, appId),
        enabled: Boolean(accountId),
    })
}

/**
 * Hook to fetch a single webhook
 */
export function useWebhook(accountId: string, webhookId: string) {
    return useQuery({
        queryKey: webhooksKeys.detail(accountId, webhookId),
        queryFn: () => webhooks.get(accountId, webhookId),
        enabled: Boolean(accountId) && Boolean(webhookId),
    })
}

/**
 * Hook to fetch webhook deliveries
 */
export function useWebhookDeliveries(accountId: string, webhookId: string) {
    return useQuery({
        queryKey: webhooksKeys.deliveries(accountId, webhookId),
        queryFn: () => webhooks.getDeliveries(accountId, webhookId),
        enabled: Boolean(accountId) && Boolean(webhookId),
    })
}

/**
 * Hook to create a webhook
 */
export function useCreateWebhook(accountId: string) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (data: CreateWebhookInput) =>
            webhooks.create(accountId, data),
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: webhooksKeys.list(accountId),
            })
        },
    })
}

/**
 * Hook to update a webhook
 */
export function useUpdateWebhook(accountId: string) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({
            webhookId,
            data,
        }: {
            webhookId: string
            data: UpdateWebhookInput
        }) => webhooks.update(accountId, webhookId, data),
        onSuccess: (_, { webhookId }) => {
            void queryClient.invalidateQueries({
                queryKey: webhooksKeys.detail(accountId, webhookId),
            })
            void queryClient.invalidateQueries({
                queryKey: webhooksKeys.list(accountId),
            })
        },
    })
}

/**
 * Hook to delete a webhook
 */
export function useDeleteWebhook(accountId: string) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (webhookId: string) =>
            webhooks.delete(accountId, webhookId),
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: webhooksKeys.list(accountId),
            })
        },
    })
}

/**
 * Hook to test a webhook
 */
export function useTestWebhook(accountId: string) {
    return useMutation({
        mutationFn: (webhookId: string) =>
            webhooks.test(accountId, webhookId),
    })
}

/**
 * Hook to regenerate webhook secret
 */
export function useRegenerateWebhookSecret(accountId: string) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (webhookId: string) =>
            webhooks.regenerateSecret(accountId, webhookId),
        onSuccess: (_, webhookId) => {
            void queryClient.invalidateQueries({
                queryKey: webhooksKeys.detail(accountId, webhookId),
            })
        },
    })
}
