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

// Re-export channels API
export { channels } from './channels'
export type {
    Channel,
    ChannelTargetingRule,
    ChannelTargetingRules,
    CreateChannelInput,
    UpdateChannelInput,
    ListChannelsResponse,
    GetChannelResponse,
    CreateChannelResponse,
    UpdateChannelResponse,
    ListChannelsParams,
} from './channels'

// Re-export releases API
export { releases } from './releases'
export type {
    Release,
    ReleaseStatus,
    ReleaseStats,
    ReleaseWithStats,
    CreateReleaseInput,
    UpdateReleaseInput,
    ListReleasesParams,
    ListReleasesResponse,
    GetReleaseResponse,
    CreateReleaseResponse,
    UpdateReleaseResponse,
} from './releases'
