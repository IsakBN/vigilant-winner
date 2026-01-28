/**
 * Testers API for BundleNudge Dashboard
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
    list(appId: string): Promise<ListTestersResponse> {
        return apiClient.get(`/apps/${appId}/testers`)
    },

    /**
     * Get a single tester by ID
     */
    get(appId: string, testerId: string): Promise<GetTesterResponse> {
        return apiClient.get(`/apps/${appId}/testers/${testerId}`)
    },

    /**
     * Create a new tester
     */
    create(appId: string, data: CreateTesterInput): Promise<CreateTesterResponse> {
        return apiClient.post(`/apps/${appId}/testers`, data)
    },

    /**
     * Delete a tester
     */
    delete(appId: string, testerId: string): Promise<void> {
        return apiClient.delete(`/apps/${appId}/testers/${testerId}`)
    },

    /**
     * Bulk import testers from CSV
     * CSV format: email,name (one per line)
     */
    importCsv(appId: string, csv: string): Promise<ImportTestersResponse> {
        return apiClient.post(`/apps/${appId}/testers/import`, { csv })
    },

    /**
     * Export testers as CSV
     */
    exportCsv(appId: string): Promise<ExportTestersResponse> {
        return apiClient.get(`/apps/${appId}/testers/export`)
    },
}
