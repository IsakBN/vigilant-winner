/**
 * Common API Types for BundleNudge App Dashboard
 */

/**
 * Standard API error response shape
 */
export interface ApiError {
    error: string
    details?: string
    code?: string
}

/**
 * Timestamp fields commonly found on entities
 */
export interface Timestamps {
    createdAt: number
    updatedAt?: number
}

/**
 * Base entity with ID and timestamps
 */
export interface BaseEntity extends Timestamps {
    id: string
}

/**
 * Platform type for apps
 */
export type Platform = 'ios' | 'android'

/**
 * App entity
 */
export interface App extends BaseEntity {
    name: string
    platform: Platform
    bundleId: string | null
    accountId: string
    teamId: string | null
    iconUrl?: string | null
    activeDevices?: number
    lastReleaseAt?: number | null
    lastReleaseVersion?: string | null
}

/**
 * Input for creating a new app
 */
export interface CreateAppInput {
    name: string
    platform: Platform
    bundleId?: string
}

/**
 * Response types
 */
export interface CreateAppResponse {
    app: App
}

export interface ListAppsResponse {
    apps: App[]
}

export interface GetAppResponse {
    app: App
}

/**
 * App stats
 */
export interface AppStats {
    activeDevices: number
    totalReleases: number
    downloadsThisMonth: number
}

export interface AppWithStats extends App {
    stats: AppStats
}

export interface GetAppWithStatsResponse {
    app: AppWithStats
}
