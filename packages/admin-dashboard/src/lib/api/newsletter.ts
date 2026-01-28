/**
 * Newsletter API
 *
 * Provides methods for managing newsletter subscribers and campaigns.
 */

import { apiClient, buildQueryString, API_URL } from './client'
import type {
    ListSubscribersParams,
    ListSubscribersResponse,
    ImportSubscribersInput,
    ImportSubscribersResponse,
    ListCampaignsParams,
    ListCampaignsResponse,
    GetCampaignResponse,
    CampaignPreviewResponse,
    CreateCampaignInput,
    UpdateCampaignInput,
    SendCampaignInput,
    SendCampaignResponse,
    CampaignStats,
} from './types'

/**
 * Newsletter API methods
 */
export const newsletter = {
    /**
     * List all subscribers with pagination
     */
    listSubscribers(params: ListSubscribersParams = {}): Promise<ListSubscribersResponse> {
        const query = buildQueryString({
            limit: params.limit,
            offset: params.offset,
            search: params.search,
            active: params.active?.toString(),
        })
        return apiClient.get(`/admin/newsletter/subscribers${query}`)
    },

    /**
     * Import subscribers from CSV
     */
    importSubscribers(data: ImportSubscribersInput): Promise<ImportSubscribersResponse> {
        return apiClient.post('/admin/newsletter/subscribers/import', data)
    },

    /**
     * Export subscribers as CSV (returns blob)
     */
    async exportSubscribers(): Promise<Blob> {
        const response = await fetch(`${API_URL}/admin/newsletter/subscribers/export`, {
            credentials: 'include',
        })
        return response.blob()
    },

    /**
     * List all campaigns with pagination
     */
    listCampaigns(params: ListCampaignsParams = {}): Promise<ListCampaignsResponse> {
        const query = buildQueryString({
            limit: params.limit,
            offset: params.offset,
            status: params.status,
        })
        return apiClient.get(`/admin/newsletter/campaigns${query}`)
    },

    /**
     * Get a single campaign with full content
     */
    getCampaign(campaignId: string): Promise<GetCampaignResponse> {
        return apiClient.get(`/admin/newsletter/campaigns/${campaignId}`)
    },

    /**
     * Create a new draft campaign
     */
    createCampaign(data: CreateCampaignInput): Promise<{ success: boolean; campaignId: string }> {
        return apiClient.post('/admin/newsletter/campaigns', data)
    },

    /**
     * Update a draft campaign
     */
    updateCampaign(campaignId: string, data: UpdateCampaignInput): Promise<{ success: boolean }> {
        return apiClient.patch(`/admin/newsletter/campaigns/${campaignId}`, data)
    },

    /**
     * Delete a draft campaign
     */
    deleteCampaign(campaignId: string): Promise<{ success: boolean }> {
        return apiClient.delete(`/admin/newsletter/campaigns/${campaignId}`)
    },

    /**
     * Preview campaign HTML
     */
    previewCampaign(campaignId: string): Promise<CampaignPreviewResponse> {
        return apiClient.get(`/admin/newsletter/campaigns/${campaignId}/preview`)
    },

    /**
     * Send test email
     */
    sendTestEmail(campaignId: string, email: string): Promise<{ success: boolean }> {
        return apiClient.post(`/admin/newsletter/campaigns/${campaignId}/test`, { email })
    },

    /**
     * Send or schedule campaign
     */
    sendCampaign(campaignId: string, data: SendCampaignInput = {}): Promise<SendCampaignResponse> {
        return apiClient.post(`/admin/newsletter/campaigns/${campaignId}/send`, data)
    },

    /**
     * Get campaign statistics
     */
    getCampaignStats(campaignId: string): Promise<{ stats: CampaignStats }> {
        return apiClient.get(`/admin/newsletter/campaigns/${campaignId}/stats`)
    },

    /**
     * Subscribe email (public endpoint)
     */
    subscribe(email: string, name?: string): Promise<{ success: boolean; message: string }> {
        return apiClient.post('/admin/newsletter/subscribe', { email, name })
    },
}
