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
    apiKey?: string | null
}

export interface GetAppWithStatsResponse {
    app: AppWithStats
}

/**
 * Input for updating an app
 */
export interface UpdateAppInput {
    name?: string
}

export interface UpdateAppResponse {
    app: App
}

export interface RegenerateApiKeyResponse {
    apiKey: string
}

// =============================================================================
// Release Types
// =============================================================================

/**
 * Release status
 */
export type ReleaseStatus = 'draft' | 'active' | 'disabled' | 'rolling' | 'complete' | 'paused' | 'failed'

/**
 * Release entity
 */
export interface Release extends BaseEntity {
    appId: string
    version: string
    description: string | null
    channel: string
    status: ReleaseStatus
    rolloutPercentage: number
    bundleUrl: string | null
    bundleSize: number | null
    minAppVersion: string | null
    maxAppVersion: string | null
    targetPlatform: string | null
    allowlist: string[] | null
    blocklist: string[] | null
}

/**
 * Release stats
 */
export interface ReleaseStats {
    downloads: number
    activeDevices: number
    errors: number
    adoptionRate: number
}

/**
 * Release with stats
 */
export interface ReleaseWithStats extends Release {
    stats: ReleaseStats
}

/**
 * Input for creating a release
 */
export interface CreateReleaseInput {
    version: string
    description?: string
    channel?: string
    minAppVersion?: string
    maxAppVersion?: string
    rolloutPercentage?: number
}

/**
 * Input for updating a release
 */
export interface UpdateReleaseInput {
    description?: string
    channel?: string
    status?: ReleaseStatus
    rolloutPercentage?: number
    allowlist?: string[]
    blocklist?: string[]
}

/**
 * Params for listing releases
 */
export interface ListReleasesParams {
    status?: ReleaseStatus
    channel?: string
    search?: string
    page?: number
    pageSize?: number
    sortBy?: 'version' | 'createdAt' | 'rolloutPercentage'
    sortOrder?: 'asc' | 'desc'
}

/**
 * Response types for releases
 */
export interface ListReleasesResponse {
    releases: Release[]
    pagination: {
        page: number
        pageSize: number
        total: number
        totalPages: number
    }
}

export interface GetReleaseResponse {
    release: ReleaseWithStats
}

export interface CreateReleaseResponse {
    release: Release
}

export interface UpdateReleaseResponse {
    release: Release
}

// =============================================================================
// Channel Types
// =============================================================================

/**
 * Channel targeting rule
 */
export interface ChannelTargetingRule {
    field: string
    op: string
    value: string | number | string[]
}

/**
 * Channel targeting rules configuration
 */
export interface ChannelTargetingRules {
    match: 'all' | 'any'
    rules: ChannelTargetingRule[]
}

/**
 * Channel entity
 */
export interface Channel extends BaseEntity {
    appId: string
    name: string
    displayName: string
    description: string | null
    isDefault: boolean
    rolloutPercentage: number
    targetingRules: ChannelTargetingRules | null
    activeReleaseId: string | null
}

/**
 * Input for creating a channel
 */
export interface CreateChannelInput {
    name: string
    displayName: string
    description?: string
    rolloutPercentage?: number
    targetingRules?: ChannelTargetingRules
}

/**
 * Input for updating a channel
 */
export interface UpdateChannelInput {
    name?: string
    displayName?: string
    description?: string | null
    isDefault?: boolean
    rolloutPercentage?: number
    targetingRules?: ChannelTargetingRules | null
    activeReleaseId?: string | null
}

/**
 * Params for listing channels
 */
export interface ListChannelsParams {
    limit?: number
    offset?: number
}

/**
 * Response types for channels
 */
export interface ListChannelsResponse {
    data: Channel[]
    pagination: {
        total: number
        limit: number
        offset: number
        hasMore: boolean
    }
}

export interface GetChannelResponse {
    channel: Channel
}

export interface CreateChannelResponse {
    channel: Channel
}

export interface UpdateChannelResponse {
    channel: Channel
}

// =============================================================================
// Device Types
// =============================================================================

/**
 * Device platform type
 */
export type DevicePlatform = 'ios' | 'android'

/**
 * Device entity
 */
export interface Device extends BaseEntity {
    deviceId: string
    appId: string
    platform: DevicePlatform
    osVersion: string | null
    deviceModel: string | null
    appVersion: string | null
    currentBundleVersion: string | null
    timezone: string | null
    locale: string | null
    lastSeenAt: number | null
    revokedAt: number | null
}

/**
 * Device with current release info
 */
export interface DeviceWithRelease extends Device {
    currentRelease?: {
        id: string
        version: string
        channelId: string
        channelName: string
    } | null
}

/**
 * Device update event
 */
export interface DeviceUpdateEvent {
    id: string
    deviceId: string
    releaseId: string
    releaseVersion: string
    status: 'checking' | 'downloading' | 'installing' | 'installed' | 'failed'
    errorMessage: string | null
    createdAt: number
}

/**
 * Params for listing devices
 */
export interface ListDevicesParams {
    limit?: number
    offset?: number
    platform?: DevicePlatform
    search?: string
}

/**
 * Response types for devices
 */
export interface ListDevicesResponse {
    data: Device[]
    pagination: {
        total: number
        limit: number
        offset: number
        hasMore: boolean
    }
}

export interface GetDeviceResponse {
    device: DeviceWithRelease
    updateHistory: DeviceUpdateEvent[]
}

export interface RevokeDeviceResponse {
    success: boolean
    revokedAt: number
}

// =============================================================================
// Team Types
// =============================================================================

/**
 * Team role
 */
export type TeamRole = 'owner' | 'admin' | 'member'

/**
 * Invitation status
 */
export type InvitationStatus = 'pending' | 'accepted' | 'expired' | 'cancelled'

/**
 * Team entity
 */
export interface Team extends BaseEntity {
    name: string
    slug: string
    domain: string | null
    planId: string | null
    myRole: TeamRole
    memberCount?: number
}

/**
 * Team member entity
 */
export interface TeamMember {
    id: string
    userId: string
    email: string
    name: string | null
    avatarUrl: string | null
    role: TeamRole
    createdAt: number
}

/**
 * Team invitation entity
 */
export interface TeamInvitation {
    id: string
    email: string
    role: 'admin' | 'member'
    status: InvitationStatus
    createdAt: number
    expiresAt: number
    invitedBy: string
    invitedByEmail?: string
}

/**
 * Input for creating a team
 */
export interface CreateTeamInput {
    name: string
    slug: string
}

/**
 * Input for updating a team
 */
export interface UpdateTeamInput {
    name?: string
}

/**
 * Input for inviting a member
 */
export interface InviteMemberInput {
    email: string
    role?: 'admin' | 'member'
}

/**
 * Input for updating member role
 */
export interface UpdateMemberRoleInput {
    role: 'admin' | 'member'
}

/**
 * Response types for teams
 */
export interface ListTeamsResponse {
    teams: Team[]
}

export interface GetTeamResponse {
    team: Team
}

export interface CreateTeamResponse {
    team: Team
}

export interface ListMembersResponse {
    members: TeamMember[]
}

export interface ListInvitationsResponse {
    invitations: TeamInvitation[]
}

export interface InviteMemberResponse {
    invitation: {
        id: string
        email: string
        role: string
        expiresAt: number
    }
}
