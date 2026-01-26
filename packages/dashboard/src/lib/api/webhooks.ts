/**
 * Webhooks API for BundleNudge Dashboard
 *
 * Provides typed API methods for webhook management.
 */

import { apiClient } from './client'
import type { BaseEntity, SuccessResponse } from './types'

// =============================================================================
// Types
// =============================================================================

export type WebhookEvent =
    | 'release.created'
    | 'release.published'
    | 'release.rollback'
    | 'device.registered'
    | 'device.updated'
    | 'update.downloaded'
    | 'update.installed'
    | 'update.failed'

export const WEBHOOK_EVENTS: { value: WebhookEvent; label: string }[] = [
    { value: 'release.created', label: 'Release Created' },
    { value: 'release.published', label: 'Release Published' },
    { value: 'release.rollback', label: 'Release Rollback' },
    { value: 'device.registered', label: 'Device Registered' },
    { value: 'device.updated', label: 'Device Updated' },
    { value: 'update.downloaded', label: 'Update Downloaded' },
    { value: 'update.installed', label: 'Update Installed' },
    { value: 'update.failed', label: 'Update Failed' },
]

export interface Webhook extends BaseEntity {
    accountId: string
    appId: string | null
    name: string
    url: string
    secret: string
    events: WebhookEvent[]
    enabled: boolean
    lastTriggeredAt: number | null
    failureCount: number
}

export interface WebhookDelivery extends BaseEntity {
    webhookId: string
    event: WebhookEvent
    payload: Record<string, unknown>
    responseStatus: number | null
    responseBody: string | null
    success: boolean
    duration: number | null
}

export interface CreateWebhookInput {
    name: string
    url: string
    events: WebhookEvent[]
    appId?: string
    enabled?: boolean
}

export interface UpdateWebhookInput {
    name?: string
    url?: string
    events?: WebhookEvent[]
    enabled?: boolean
}

export interface ListWebhooksResponse {
    webhooks: Webhook[]
}

export interface GetWebhookResponse {
    webhook: Webhook
}

export interface CreateWebhookResponse {
    webhook: Webhook
}

export interface UpdateWebhookResponse {
    webhook: Webhook
}

export interface ListDeliveriesResponse {
    deliveries: WebhookDelivery[]
}

export interface TestWebhookResponse {
    success: boolean
    statusCode: number | null
    duration: number | null
    error?: string
}

// =============================================================================
// API Methods
// =============================================================================

export const webhooks = {
    /**
     * List all webhooks
     */
    list(accountId: string, appId?: string): Promise<ListWebhooksResponse> {
        const query = appId ? `?appId=${appId}` : ''
        return apiClient.get(`/accounts/${accountId}/webhooks${query}`)
    },

    /**
     * Get a single webhook
     */
    get(accountId: string, webhookId: string): Promise<GetWebhookResponse> {
        return apiClient.get(`/accounts/${accountId}/webhooks/${webhookId}`)
    },

    /**
     * Create a new webhook
     */
    create(
        accountId: string,
        data: CreateWebhookInput
    ): Promise<CreateWebhookResponse> {
        return apiClient.post(`/accounts/${accountId}/webhooks`, data)
    },

    /**
     * Update a webhook
     */
    update(
        accountId: string,
        webhookId: string,
        data: UpdateWebhookInput
    ): Promise<UpdateWebhookResponse> {
        return apiClient.patch(
            `/accounts/${accountId}/webhooks/${webhookId}`,
            data
        )
    },

    /**
     * Delete a webhook
     */
    delete(accountId: string, webhookId: string): Promise<SuccessResponse> {
        return apiClient.delete(`/accounts/${accountId}/webhooks/${webhookId}`)
    },

    /**
     * Get webhook deliveries (history)
     */
    getDeliveries(
        accountId: string,
        webhookId: string
    ): Promise<ListDeliveriesResponse> {
        return apiClient.get(
            `/accounts/${accountId}/webhooks/${webhookId}/deliveries`
        )
    },

    /**
     * Test webhook with sample payload
     */
    test(accountId: string, webhookId: string): Promise<TestWebhookResponse> {
        return apiClient.post(
            `/accounts/${accountId}/webhooks/${webhookId}/test`
        )
    },

    /**
     * Regenerate webhook secret
     */
    regenerateSecret(
        accountId: string,
        webhookId: string
    ): Promise<{ secret: string }> {
        return apiClient.post(
            `/accounts/${accountId}/webhooks/${webhookId}/regenerate-secret`
        )
    },
}
