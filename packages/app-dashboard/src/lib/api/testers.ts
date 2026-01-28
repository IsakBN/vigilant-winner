/**
 * Testers API for BundleNudge App Dashboard
 *
 * Provides typed API methods for managing testers who receive build notifications.
 */

import { apiClient } from './client'

// =============================================================================
// Types
// =============================================================================

export interface TesterStats {
    totalSent: number
    totalOpened: number
    lastSentAt: number | null
}

export interface Tester {
    id: string
    email: string
    name: string | null
    createdAt: number
    stats?: TesterStats
}

export interface CreateTesterInput {
    email: string
    name?: string
}

export interface ImportCsvResult {
    added: number
    duplicates: number
}

export interface ExportCsvResult {
    csv: string
}

// Response types
export interface ListTestersResponse {
    testers: Tester[]
}

export interface GetTesterResponse {
    tester: Tester
}

export interface CreateTesterResponse {
    tester: Tester
}

export interface ImportTestersResponse {
    added: number
    duplicates: number
}

export interface ExportTestersResponse {
    csv: string
}

// =============================================================================
// API Methods
// =============================================================================

export const testers = {
    /**
     * List all testers for an app
     */
    list(accountId: string, appId: string): Promise<ListTestersResponse> {
        return apiClient.get(`/accounts/${accountId}/apps/${appId}/testers`)
    },

    /**
     * Get a single tester by ID
     */
    get(accountId: string, appId: string, testerId: string): Promise<GetTesterResponse> {
        return apiClient.get(`/accounts/${accountId}/apps/${appId}/testers/${testerId}`)
    },

    /**
     * Create a new tester
     */
    create(
        accountId: string,
        appId: string,
        data: CreateTesterInput
    ): Promise<CreateTesterResponse> {
        return apiClient.post(`/accounts/${accountId}/apps/${appId}/testers`, data)
    },

    /**
     * Delete a tester
     */
    delete(accountId: string, appId: string, testerId: string): Promise<void> {
        return apiClient.delete(`/accounts/${accountId}/apps/${appId}/testers/${testerId}`)
    },

    /**
     * Bulk import testers from CSV
     * CSV format: email,name (one per line)
     */
    importCsv(accountId: string, appId: string, csv: string): Promise<ImportTestersResponse> {
        return apiClient.post(`/accounts/${accountId}/apps/${appId}/testers/import`, { csv })
    },

    /**
     * Export testers as CSV
     */
    exportCsv(accountId: string, appId: string): Promise<ExportTestersResponse> {
        return apiClient.get(`/accounts/${accountId}/apps/${appId}/testers/export`)
    },
}
