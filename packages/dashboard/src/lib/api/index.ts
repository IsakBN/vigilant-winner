/**
 * API Client for BundleNudge Dashboard
 *
 * Central export for all API functionality.
 * Import from '@/lib/api' to use any API function or type.
 */

// Re-export all types
export * from './types'

// Re-export client utilities
export {
    API_URL,
    ApiClientError,
    apiFetch,
    apiClient,
    buildQueryString,
} from './client'

export type { ApiFetchOptions } from './client'

// Re-export auth API
export { auth, github } from './auth'
export type { User, GitHubStatus } from './auth'

// Re-export apps API
export { apps } from './apps'
export type {
    App,
    Platform,
    CreateAppInput,
    CreateAppResponse,
    ListAppsResponse,
    GetAppResponse,
} from './apps'
