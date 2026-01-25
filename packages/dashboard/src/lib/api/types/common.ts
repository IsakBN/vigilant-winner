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
