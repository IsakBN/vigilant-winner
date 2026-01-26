'use client'

/**
 * useBilling Hook
 *
 * TanStack Query hooks for subscription and billing management.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { billing } from '@/lib/api'

/**
 * Query key factory for billing
 */
export const billingKeys = {
    all: ['billing'] as const,
    subscription: (accountId: string) =>
        [...billingKeys.all, 'subscription', accountId] as const,
    plans: () => [...billingKeys.all, 'plans'] as const,
    invoices: (accountId: string) =>
        [...billingKeys.all, 'invoices', accountId] as const,
    usage: (accountId: string) =>
        [...billingKeys.all, 'usage', accountId] as const,
}

/**
 * Hook to fetch current subscription
 */
export function useSubscription(accountId: string) {
    return useQuery({
        queryKey: billingKeys.subscription(accountId),
        queryFn: () => billing.getSubscription(accountId),
        enabled: Boolean(accountId),
    })
}

/**
 * Hook to fetch available plans
 */
export function usePlans() {
    return useQuery({
        queryKey: billingKeys.plans(),
        queryFn: () => billing.getPlans(),
    })
}

/**
 * Hook to fetch billing invoices
 */
export function useInvoices(accountId: string) {
    return useQuery({
        queryKey: billingKeys.invoices(accountId),
        queryFn: () => billing.getInvoices(accountId),
        enabled: Boolean(accountId),
    })
}

/**
 * Hook to fetch usage statistics
 */
export function useUsage(accountId: string) {
    return useQuery({
        queryKey: billingKeys.usage(accountId),
        queryFn: () => billing.getUsage(accountId),
        enabled: Boolean(accountId),
    })
}

/**
 * Hook to create checkout session
 */
export function useCreateCheckout(accountId: string) {
    return useMutation({
        mutationFn: (planId: string) =>
            billing.createCheckoutSession(accountId, planId),
        onSuccess: (data) => {
            window.location.href = data.url
        },
    })
}

/**
 * Hook to create billing portal session
 */
export function useCreatePortal(accountId: string) {
    return useMutation({
        mutationFn: () => billing.createPortalSession(accountId),
        onSuccess: (data) => {
            window.location.href = data.url
        },
    })
}

/**
 * Hook to cancel subscription
 */
export function useCancelSubscription(accountId: string) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: () => billing.cancelSubscription(accountId),
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: billingKeys.subscription(accountId),
            })
        },
    })
}

/**
 * Hook to resume subscription
 */
export function useResumeSubscription(accountId: string) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: () => billing.resumeSubscription(accountId),
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: billingKeys.subscription(accountId),
            })
        },
    })
}
