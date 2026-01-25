/**
 * Base API Client for BundleNudge Dashboard
 *
 * Provides typed fetch wrapper with cookie-based authentication.
 * Uses Better-Auth session cookies for authentication.
 */

import type { ApiError } from './types'

/**
 * API base URL - configurable via environment variable
 */
export const API_URL =
    process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787'

/**
 * Custom error class for API errors
 *
 * Provides structured error information including HTTP status and details.
 */
export class ApiClientError extends Error {
    readonly status: number
    readonly details?: string
    readonly code?: string

    constructor(message: string, status: number, details?: string, code?: string) {
        super(message)
        this.name = 'ApiClientError'
        this.status = status
        this.details = details
        this.code = code
    }

    /**
     * Check if this is a specific HTTP status
     */
    isStatus(status: number): boolean {
        return this.status === status
    }

    /**
     * Check if this is an authentication error (401)
     */
    isUnauthorized(): boolean {
        return this.status === 401
    }

    /**
     * Check if this is a forbidden error (403)
     */
    isForbidden(): boolean {
        return this.status === 403
    }

    /**
     * Check if this is a not found error (404)
     */
    isNotFound(): boolean {
        return this.status === 404
    }

    /**
     * Check if this is a rate limit error (429)
     */
    isRateLimited(): boolean {
        return this.status === 429
    }
}

/**
 * Request options extending standard RequestInit
 */
export interface ApiFetchOptions extends Omit<RequestInit, 'body'> {
    /** Request body - will be JSON stringified */
    body?: unknown
    /** Skip JSON parsing of response (for empty responses) */
    skipResponseParse?: boolean
}

/**
 * Base fetch wrapper with cookie-based authentication
 *
 * Better-Auth uses cookies for session management, so we include credentials.
 *
 * @param endpoint - API endpoint path (e.g., '/apps')
 * @param options - Fetch options including body and headers
 * @returns Parsed JSON response
 * @throws ApiClientError on non-2xx responses
 */
export async function apiFetch<T>(
    endpoint: string,
    options: ApiFetchOptions = {}
): Promise<T> {
    const { body, skipResponseParse, ...fetchOptions } = options

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    }

    // Merge additional headers if provided
    if (fetchOptions.headers) {
        const additionalHeaders = fetchOptions.headers as Record<string, string>
        Object.assign(headers, additionalHeaders)
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...fetchOptions,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        credentials: 'include', // Send cookies for Better-Auth session
    })

    if (!response.ok) {
        const errorBody = await response.json().catch(() => ({
            error: `HTTP ${response.status}: ${response.statusText}`,
        })) as ApiError

        throw new ApiClientError(
            errorBody.error,
            response.status,
            errorBody.details,
            errorBody.code
        )
    }

    // Handle empty responses (204 No Content, etc.)
    if (skipResponseParse || response.status === 204) {
        return undefined as T
    }

    return response.json() as Promise<T>
}

/**
 * Helper to build query strings from parameter objects
 *
 * Handles undefined values by omitting them from the query string.
 *
 * @param params - Object of key-value pairs
 * @returns Query string including '?' prefix, or empty string if no params
 */
export function buildQueryString(
    params: Record<string, string | number | boolean | undefined>
): string {
    const searchParams = new URLSearchParams()

    for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null && value !== '') {
            searchParams.set(key, String(value))
        }
    }

    const query = searchParams.toString()
    return query ? `?${query}` : ''
}

/**
 * Convenience methods for common HTTP verbs
 */
export const apiClient = {
    /**
     * GET request
     */
    get<T>(endpoint: string, options?: Omit<ApiFetchOptions, 'method' | 'body'>): Promise<T> {
        return apiFetch<T>(endpoint, { ...options, method: 'GET' })
    },

    /**
     * POST request
     */
    post<T>(endpoint: string, body?: unknown, options?: Omit<ApiFetchOptions, 'method' | 'body'>): Promise<T> {
        return apiFetch<T>(endpoint, { ...options, method: 'POST', body })
    },

    /**
     * PUT request
     */
    put<T>(endpoint: string, body?: unknown, options?: Omit<ApiFetchOptions, 'method' | 'body'>): Promise<T> {
        return apiFetch<T>(endpoint, { ...options, method: 'PUT', body })
    },

    /**
     * PATCH request
     */
    patch<T>(endpoint: string, body?: unknown, options?: Omit<ApiFetchOptions, 'method' | 'body'>): Promise<T> {
        return apiFetch<T>(endpoint, { ...options, method: 'PATCH', body })
    },

    /**
     * DELETE request
     */
    delete<T>(endpoint: string, options?: Omit<ApiFetchOptions, 'method'>): Promise<T> {
        return apiFetch<T>(endpoint, { ...options, method: 'DELETE', skipResponseParse: true })
    },
}
