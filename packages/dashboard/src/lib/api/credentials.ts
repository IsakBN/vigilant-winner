/**
 * Apple Credentials API for BundleNudge Dashboard
 *
 * Provides typed API methods for Apple App Store Connect credential management.
 */

import { apiClient } from './client'
import type { BaseEntity, SuccessResponse } from './types'

// =============================================================================
// Types
// =============================================================================

export interface AppleCredential extends BaseEntity {
    accountId: string
    appId: string
    name: string
    keyId: string
    issuerId: string
    teamId: string
    teamName: string | null
    lastUsedAt: number | null
    verified: boolean
}

export interface CreateCredentialInput {
    name: string
    keyId: string
    issuerId: string
    teamId: string
    privateKey: string
}

export interface ListCredentialsResponse {
    credentials: AppleCredential[]
}

export interface GetCredentialResponse {
    credential: AppleCredential
}

export interface CreateCredentialResponse {
    credential: AppleCredential
}

export interface VerifyCredentialResponse {
    valid: boolean
    teamName?: string
    error?: string
}

// =============================================================================
// API Methods
// =============================================================================

export const credentials = {
    /**
     * List all credentials for an app
     */
    list(accountId: string, appId: string): Promise<ListCredentialsResponse> {
        return apiClient.get(`/accounts/${accountId}/apps/${appId}/credentials`)
    },

    /**
     * Get a single credential
     */
    get(
        accountId: string,
        appId: string,
        credentialId: string
    ): Promise<GetCredentialResponse> {
        return apiClient.get(
            `/accounts/${accountId}/apps/${appId}/credentials/${credentialId}`
        )
    },

    /**
     * Create a new credential
     */
    create(
        accountId: string,
        appId: string,
        data: CreateCredentialInput
    ): Promise<CreateCredentialResponse> {
        return apiClient.post(
            `/accounts/${accountId}/apps/${appId}/credentials`,
            data
        )
    },

    /**
     * Delete a credential
     */
    delete(
        accountId: string,
        appId: string,
        credentialId: string
    ): Promise<SuccessResponse> {
        return apiClient.delete(
            `/accounts/${accountId}/apps/${appId}/credentials/${credentialId}`
        )
    },

    /**
     * Verify a credential is valid
     */
    verify(
        accountId: string,
        appId: string,
        credentialId: string
    ): Promise<VerifyCredentialResponse> {
        return apiClient.post(
            `/accounts/${accountId}/apps/${appId}/credentials/${credentialId}/verify`
        )
    },
}
