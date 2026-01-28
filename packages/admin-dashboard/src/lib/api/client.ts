/**
 * Base API Client for BundleNudge Admin Dashboard
 *
 * Provides typed fetch wrapper with cookie-based authentication.
 */

import type { ApiError } from './types'

/**
 * API base URL - configurable via environment variable
 */
export const API_URL =
    process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787'

/**
 * Custom error class for API errors
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

    isUnauthorized(): boolean {
        return this.status === 401
    }

    isForbidden(): boolean {
        return this.status === 403
    }

    isNotFound(): boolean {
        return this.status === 404
    }

    isRateLimited(): boolean {
        return this.status === 429
    }
}

/**
 * Request options extending standard RequestInit
 */
export interface ApiFetchOptions extends Omit<RequestInit, 'body'> {
    body?: unknown
    skipResponseParse?: boolean
}

/**
 * Base fetch wrapper with cookie-based authentication
 */
export async function apiFetch<T>(
    endpoint: string,
    options: ApiFetchOptions = {}
): Promise<T> {
    const { body, skipResponseParse, ...fetchOptions } = options

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    }

    if (fetchOptions.headers) {
        const additionalHeaders = fetchOptions.headers as Record<string, string>
        Object.assign(headers, additionalHeaders)
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...fetchOptions,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        credentials: 'include',
    })

    if (!response.ok) {
        const errorBody = await response.json().catch(() => ({
            error: `HTTP ${String(response.status)}: ${response.statusText}`,
        })) as ApiError

        throw new ApiClientError(
            errorBody.error,
            response.status,
            errorBody.details,
            errorBody.code
        )
    }

    if (skipResponseParse || response.status === 204) {
        return undefined as T
    }

    return response.json() as Promise<T>
}

/**
 * Helper to build query strings from parameter objects
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
    get<T>(endpoint: string, options?: Omit<ApiFetchOptions, 'method' | 'body'>): Promise<T> {
        return apiFetch<T>(endpoint, { ...options, method: 'GET' })
    },

    post<T>(endpoint: string, body?: unknown, options?: Omit<ApiFetchOptions, 'method' | 'body'>): Promise<T> {
        return apiFetch<T>(endpoint, { ...options, method: 'POST', body })
    },

    put<T>(endpoint: string, body?: unknown, options?: Omit<ApiFetchOptions, 'method' | 'body'>): Promise<T> {
        return apiFetch<T>(endpoint, { ...options, method: 'PUT', body })
    },

    patch<T>(endpoint: string, body?: unknown, options?: Omit<ApiFetchOptions, 'method' | 'body'>): Promise<T> {
        return apiFetch<T>(endpoint, { ...options, method: 'PATCH', body })
    },

    delete<T>(endpoint: string, options?: Omit<ApiFetchOptions, 'method'>): Promise<T> {
        return apiFetch<T>(endpoint, { ...options, method: 'DELETE', skipResponseParse: true })
    },
}
