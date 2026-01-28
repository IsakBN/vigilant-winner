/**
 * Common API Types for BundleNudge Dashboard
 *
 * Core types used across all API modules.
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
 * Generic paginated response wrapper
 */
export interface PaginatedResponse<T> {
    data: T[]
    pagination: {
        page: number
        pageSize: number
        total: number
        totalPages: number
    }
}

/**
 * Generic list response (non-paginated)
 */
export interface ListResponse<T> {
    data: T[]
    count: number
}

/**
 * Success response with message
 */
export interface SuccessResponse {
    success: boolean
    message?: string
}

/**
 * Common pagination parameters for list endpoints
 */
export interface PaginationParams {
    page?: number
    pageSize?: number
    limit?: number
    offset?: number
}

/**
 * Common sort parameters
 */
export interface SortParams {
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
}

/**
 * Combined list query parameters
 */
export type ListParams = PaginationParams & SortParams

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
 * Usage metric with value and optional trend/sparkline
 */
export interface UsageMetric {
    value: number
    trend?: number
    sparkline?: number[]
    isAlert?: boolean
}

/**
 * App health status levels
 */
export type AppHealthStatus = 'healthy' | 'warning' | 'critical' | 'setup_required'

/**
 * App health metrics for dashboard display
 */
export interface AppHealthMetrics {
    successRate: UsageMetric
    devices: UsageMetric
    rollbacks: UsageMetric
}

/**
 * App health funnel data - tracks update flow progression
 */
export interface AppHealthFunnel {
    checks: number
    downloads: number
    applied: number
    active: number
}

/**
 * Issue types that can affect app health
 */
export type AppHealthIssueType = 'error' | 'rollback' | 'health_failure'

/**
 * A recent issue affecting app health
 */
export interface AppHealthIssue {
    time: number
    type: AppHealthIssueType
    deviceInfo: string
    error: string
}

/**
 * Complete app health data for monitoring and display
 */
export interface AppHealth {
    status: AppHealthStatus
    metrics: AppHealthMetrics
    funnel: AppHealthFunnel
    recentIssues: AppHealthIssue[]
}

/**
 * API response wrapper for app health endpoint
 */
export interface GetAppHealthResponse {
    health: AppHealth
}

/**
 * Usage limit info
 */
export interface UsageLimitInfo {
    current: number
    limit: number | null
    percentage: number | null
    isOverLimit: boolean
    isHardLimited?: boolean
}

/**
 * Storage usage info
 */
export interface StorageUsageInfo {
    currentGb: number
    limitGb: number | null
    percentage: number | null
    isOverLimit: boolean
}

/**
 * Combined usage info for account dashboard
 */
export interface UsageInfo {
    planName: string
    displayName: string
    usage: {
        mau: UsageLimitInfo
        storage: StorageUsageInfo
    }
}
