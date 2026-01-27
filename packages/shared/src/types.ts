/**
 * Core type definitions for BundleNudge
 *
 * These types are shared across SDK, API, and Dashboard.
 * Keep them minimal and focused on the data contracts.
 */

// =============================================================================
// Device & Targeting
// =============================================================================

export interface DeviceAttributes {
  deviceId: string
  os: 'ios' | 'android'
  osVersion: string
  deviceModel: string
  timezone: string
  locale: string
  appVersion: string
  currentBundleVersion: string | null
}

export interface TargetingRule {
  field: keyof DeviceAttributes | 'percentage'
  op: TargetingOperator
  value: string | number | string[]
}

export type TargetingOperator =
  | 'eq'
  | 'neq'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'starts_with'
  | 'ends_with'
  | 'contains'
  | 'in'
  | 'not_in'
  | 'semver_gt'
  | 'semver_gte'
  | 'semver_lt'
  | 'semver_lte'

export interface TargetingRules {
  match: 'all' | 'any'
  rules: TargetingRule[]
}

// =============================================================================
// Release
// =============================================================================

export type ReleaseStatus = 'active' | 'paused' | 'rolled_back'

export interface Release {
  id: string
  appId: string
  version: string
  bundleUrl: string
  bundleSize: number
  bundleHash: string
  targetingRules: TargetingRules | null
  status: ReleaseStatus
  createdAt: number
  minIosVersion: string | null
  minAndroidVersion: string | null
}

// =============================================================================
// Update Check (SDK <-> API contract)
// =============================================================================

export interface UpdateCheckRequest {
  appId: string
  deviceId: string
  platform: 'ios' | 'android'
  appVersion: string
  currentBundleVersion?: string
  currentBundleHash?: string
  deviceInfo?: Partial<DeviceAttributes>
}

export interface UpdateCheckResponse {
  updateAvailable: boolean
  requiresAppStoreUpdate?: boolean
  appStoreMessage?: string
  release?: UpdateRelease
}

export interface UpdateRelease {
  version: string
  bundleUrl: string
  bundleSize: number
  bundleHash: string
  releaseId: string
  releaseNotes?: string
  criticalRoutes?: CriticalRoute[]
}

// =============================================================================
// Critical Routes (Team/Enterprise)
// =============================================================================

export interface CriticalRoute {
  id: string
  pattern: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | '*'
  name?: string
}

// =============================================================================
// Telemetry
// =============================================================================

export type RollbackReason = 'crash' | 'route_failure' | 'manual'

export type TelemetryEvent =
  | TelemetryApplied
  | TelemetryRollback
  | TelemetryError
  | TelemetryRoute

export interface TelemetryApplied {
  type: 'applied'
  version: string
  previousVersion: string | null
}

export interface TelemetryRollback {
  type: 'rollback'
  fromVersion: string
  toVersion: string
  reason: RollbackReason
}

export interface TelemetryError {
  type: 'error'
  errorType: SDKErrorCode
  errorMessage: string
  targetVersion?: string
}

export interface TelemetryRoute {
  type: 'route'
  routeId: string
  success: boolean
  statusCode?: number
}

// =============================================================================
// SDK Metadata (stored on device)
// =============================================================================

export interface SDKMetadata {
  deviceId: string
  accessToken: string | null
  currentVersion: string | null
  currentVersionHash: string | null
  previousVersion: string | null
  pendingUpdateFlag: boolean
  lastSuccessTime: number | null
}

// =============================================================================
// Error Codes
// =============================================================================

export type SDKErrorCode =
  | 'NO_UPDATE'
  | 'ALREADY_LATEST'
  | 'DOWNLOAD_FAILED'
  | 'HASH_MISMATCH'
  | 'STORAGE_ERROR'
  | 'APPLY_FAILED'
  | 'ROLLBACK_FAILED'
  | 'NETWORK_ERROR'
  | 'UNAUTHORIZED'

// =============================================================================
// Device Registration
// =============================================================================

export interface DeviceRegisterRequest {
  appId: string
  deviceId: string
  platform: 'ios' | 'android'
  appVersion: string
  deviceInfo?: Partial<DeviceAttributes>
}

export interface DeviceRegisterResponse {
  accessToken: string
  expiresAt: number
}

// =============================================================================
// API Error Response
// =============================================================================

export interface APIError {
  error: string
  message?: string
  details?: unknown
}

// =============================================================================
// Team Invitations
// =============================================================================

export type InvitationScope = 'full' | 'projects'

export interface TeamInvitation {
  id: string
  organizationId: string
  email: string
  role: 'admin' | 'member'
  /** 'full' for entire org access, 'projects' for specific projects only */
  scope: InvitationScope
  /** App IDs this invitation grants access to (only when scope='projects') */
  projectIds: string[] | null
  invitedBy: string
  expiresAt: number
  acceptedAt: number | null
  createdAt: number
}

export interface CreateInvitationRequest {
  email: string
  role: 'admin' | 'member'
  scope?: InvitationScope
  projectIds?: string[]
}

export interface MemberProjectAccess {
  id: string
  organizationId: string
  userId: string
  appId: string
  grantedBy: string
  grantedAt: number
}
