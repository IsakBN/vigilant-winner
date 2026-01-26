/**
 * Billing API for BundleNudge Dashboard
 *
 * Provides typed API methods for subscription and billing management.
 */

import { apiClient } from './client'
import type { BaseEntity } from './types'

// =============================================================================
// Types
// =============================================================================

export type SubscriptionStatus =
    | 'active'
    | 'canceled'
    | 'past_due'
    | 'trialing'
    | 'incomplete'

export interface SubscriptionPlan {
    id: string
    name: string
    displayName: string
    priceCents: number
    interval: 'month' | 'year'
    features: string[]
    limits: PlanLimits
    stripePriceId: string | null
}

export interface PlanLimits {
    monthlyActiveUsers: number | null
    apps: number | null
    storage: number | null
    apiCalls: number | null
    teamMembers: number | null
}

export interface Subscription extends BaseEntity {
    accountId: string
    planId: string
    status: SubscriptionStatus
    currentPeriodStart: number
    currentPeriodEnd: number
    cancelAtPeriodEnd: boolean
    stripeSubscriptionId: string | null
    stripeCustomerId: string | null
}

export interface Invoice extends BaseEntity {
    accountId: string
    amountCents: number
    status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible'
    invoiceDate: number
    dueDate: number | null
    paidAt: number | null
    invoicePdf: string | null
    stripeInvoiceId: string | null
}

export interface UsageStats {
    monthlyActiveUsers: number
    apps: number
    storageUsedMb: number
    apiCalls: number
    bandwidthMb: number
    periodStart: number
    periodEnd: number
}

export interface GetSubscriptionResponse {
    subscription: Subscription | null
    plan: SubscriptionPlan
    isFreeTier: boolean
}

export interface ListPlansResponse {
    plans: SubscriptionPlan[]
}

export interface ListInvoicesResponse {
    invoices: Invoice[]
}

export interface GetUsageResponse {
    usage: UsageStats
    limits: PlanLimits
}

export interface CreateCheckoutResponse {
    url: string
}

export interface CreatePortalResponse {
    url: string
}

// =============================================================================
// API Methods
// =============================================================================

export const billing = {
    /**
     * Get current subscription
     */
    getSubscription(accountId: string): Promise<GetSubscriptionResponse> {
        return apiClient.get(`/accounts/${accountId}/billing/subscription`)
    },

    /**
     * Get available plans
     */
    getPlans(): Promise<ListPlansResponse> {
        return apiClient.get('/billing/plans')
    },

    /**
     * Get billing invoices
     */
    getInvoices(accountId: string): Promise<ListInvoicesResponse> {
        return apiClient.get(`/accounts/${accountId}/billing/invoices`)
    },

    /**
     * Get usage statistics
     */
    getUsage(accountId: string): Promise<GetUsageResponse> {
        return apiClient.get(`/accounts/${accountId}/billing/usage`)
    },

    /**
     * Create Stripe checkout session for upgrade
     */
    createCheckoutSession(
        accountId: string,
        planId: string
    ): Promise<CreateCheckoutResponse> {
        return apiClient.post(`/accounts/${accountId}/billing/checkout`, {
            planId,
        })
    },

    /**
     * Create Stripe billing portal session
     */
    createPortalSession(accountId: string): Promise<CreatePortalResponse> {
        return apiClient.post(`/accounts/${accountId}/billing/portal`)
    },

    /**
     * Cancel subscription at period end
     */
    cancelSubscription(
        accountId: string
    ): Promise<{ subscription: Subscription }> {
        return apiClient.post(`/accounts/${accountId}/billing/cancel`)
    },

    /**
     * Resume canceled subscription
     */
    resumeSubscription(
        accountId: string
    ): Promise<{ subscription: Subscription }> {
        return apiClient.post(`/accounts/${accountId}/billing/resume`)
    },
}
