/**
 * Admin User Action Types
 *
 * Types for admin user operations: overrides, credits, suspension.
 */

// =============================================================================
// Override Limits
// =============================================================================

/** Parameters for setting user limit overrides */
export interface AdminOverrideLimitsParams {
    /** Monthly build limit (absolute value) */
    monthlyBuildLimit?: number
    /** Concurrent builds limit (absolute value) */
    concurrentBuilds?: number
    /** Build timeout in minutes (absolute value) */
    buildTimeoutMinutes?: number
    /** MAU limit (absolute value, cannot use with mauMultiplier) */
    mauLimit?: number
    /** MAU multiplier (cannot use with mauLimit) */
    mauMultiplier?: number
    /** Storage in GB (absolute value, cannot use with storageMultiplier) */
    storageGb?: number
    /** Storage multiplier (cannot use with storageGb) */
    storageMultiplier?: number
    /** Override expiration timestamp (required) */
    expiresAt: number
    /** Reason for override (required for audit trail) */
    reason: string
}

/** Response for setting limit overrides */
export interface AdminOverrideLimitsResponse {
    success: boolean
    message: string
    expiresAt: number
}

/** Parameters for clearing user overrides */
export interface AdminClearOverridesParams {
    /** Reason for clearing overrides (required for audit trail) */
    reason: string
}

/** Response for clearing overrides */
export interface AdminClearOverridesResponse {
    success: boolean
    message: string
}

// =============================================================================
// Credits
// =============================================================================

/** Parameters for adding credits to a user */
export interface AdminAddCreditsParams {
    /** Number of credits to add */
    amount: number
    /** Reason for adding credits (required for audit trail) */
    reason: string
    /** Optional expiration timestamp for credits */
    expiresAt?: number
}

/** Response for adding credits */
export interface AdminAddCreditsResponse {
    success: boolean
    message: string
    newBalance: number
}

// =============================================================================
// Suspension
// =============================================================================

/** Parameters for suspending a user */
export interface AdminSuspendParams {
    /** Reason for suspension (required for audit trail) */
    reason: string
    /** Optional suspension end timestamp (null for indefinite) */
    until?: number | null
}

/** Response for suspending a user */
export interface AdminSuspendResponse {
    success: boolean
    message: string
    suspendedUntil: number | null
}

/** Parameters for unsuspending a user */
export interface AdminUnsuspendParams {
    /** Reason for unsuspending (required for audit trail) */
    reason: string
}

/** Response for unsuspending a user */
export interface AdminUnsuspendResponse {
    success: boolean
    message: string
}
