/**
 * Release Form Types
 *
 * Shared types for release form components.
 */

export interface ReleaseFormState {
    version: string
    description: string
    channel: string
    minAppVersion: string
    maxAppVersion: string
    rolloutPercentage: number
}

export interface ReleaseFormErrors {
    version?: string
    channel?: string
    bundle?: string
}

export interface ChannelOption {
    id: string
    name: string
}
