/**
 * Common API Types for Admin Dashboard
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
