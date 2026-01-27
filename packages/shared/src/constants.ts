/**
 * Shared constants used across BundleNudge packages
 */

// =============================================================================
// Timing
// =============================================================================

/** Time window for crash detection (Free/Pro tier) */
export const CRASH_VERIFICATION_WINDOW_MS = 60_000 // 60 seconds

/** Time window for route-based verification (Team/Enterprise) */
export const ROUTE_VERIFICATION_TIMEOUT_MS = 5 * 60_000 // 5 minutes

/** Default auto-pause threshold (percentage of devices) */
export const DEFAULT_AUTO_PAUSE_THRESHOLD = 2.0 // 2%

/** Default auto-pause time window */
export const DEFAULT_AUTO_PAUSE_WINDOW_MS = 5 * 60_000 // 5 minutes

// =============================================================================
// Network
// =============================================================================

/** Maximum retries for network requests */
export const MAX_NETWORK_RETRIES = 3

/** Base delay for exponential backoff (ms) */
export const NETWORK_RETRY_BASE_DELAY_MS = 1000

/** Request timeout (ms) */
export const REQUEST_TIMEOUT_MS = 30_000

// =============================================================================
// Storage
// =============================================================================

/** Directory name for BundleNudge files */
export const BUNDLENUDGE_DIR = 'bundlenudge'

/** Metadata filename */
export const METADATA_FILE = 'metadata.json'

/** Bundles subdirectory */
export const BUNDLES_DIR = 'bundles'

/** Temp directory for downloads */
export const TEMP_DIR = 'temp'

// =============================================================================
// API
// =============================================================================

/** API version prefix */
export const API_VERSION = 'v1'

/** Default API base URL */
export const DEFAULT_API_URL = 'https://api.bundlenudge.com'

// =============================================================================
// Hash
// =============================================================================

/** Hash algorithm used for bundle verification */
export const HASH_ALGORITHM = 'SHA-256'

/** Hash prefix in responses */
export const HASH_PREFIX = 'sha256:'

// =============================================================================
// Error Codes
// =============================================================================

/** Standardized error codes for API responses */
export const ERROR_CODES = {
  // Authentication & Authorization
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  INVALID_TOKEN: 'INVALID_TOKEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  SESSION_EXPIRED: 'SESSION_EXPIRED',

  // Validation
  INVALID_INPUT: 'INVALID_INPUT',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',

  // Resources
  NOT_FOUND: 'NOT_FOUND',
  APP_NOT_FOUND: 'APP_NOT_FOUND',
  CHANNEL_NOT_FOUND: 'CHANNEL_NOT_FOUND',
  RELEASE_NOT_FOUND: 'RELEASE_NOT_FOUND',
  DEVICE_NOT_FOUND: 'DEVICE_NOT_FOUND',
  TEAM_NOT_FOUND: 'TEAM_NOT_FOUND',

  // Rate Limiting
  RATE_LIMITED: 'RATE_LIMITED',
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',

  // OTP / Auth
  INVALID_OTP: 'INVALID_OTP',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',

  // Subscription Limits
  MAU_LIMIT_EXCEEDED: 'MAU_LIMIT_EXCEEDED',
  STORAGE_LIMIT_EXCEEDED: 'STORAGE_LIMIT_EXCEEDED',

  // Server Errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  DATABASE_ERROR: 'DATABASE_ERROR',

  // Business Logic
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  CONFLICT: 'CONFLICT',
  INVALID_STATE: 'INVALID_STATE',
  OPERATION_FAILED: 'OPERATION_FAILED',
  DUPLICATE_VERSION: 'DUPLICATE_VERSION',
} as const

export type ErrorCode = keyof typeof ERROR_CODES

// =============================================================================
// Rate Limits
// =============================================================================

/**
 * Rate limiting configuration for API endpoints
 * @agent remediate-rate-limits-constants
 */
export const RATE_LIMITS = {
  /** Default rate limit for most endpoints */
  default: {
    requests: 100,
    windowSeconds: 60,
  },
  /** Auth routes (login, signup, OTP) - strict to prevent brute force */
  auth: {
    requests: 10,
    windowSeconds: 60,
  },
  /** SDK update check endpoint - relaxed for app launches */
  updateCheck: {
    requests: 60,
    windowSeconds: 60,
  },
  /** SDK device registration */
  devices: {
    requests: 10,
    windowSeconds: 60,
  },
  /** SDK telemetry endpoint - higher limit for event batching */
  telemetry: {
    requests: 100,
    windowSeconds: 60,
  },
  /** Bundle upload endpoint - low limit for expensive operations */
  upload: {
    requests: 10,
    windowSeconds: 60,
  },
  /** Admin OTP send - very strict */
  adminOtpSend: {
    requests: 3,
    windowSeconds: 900, // 15 minutes
  },
  /** Admin OTP verify - strict but allows retries */
  adminOtpVerify: {
    requests: 5,
    windowSeconds: 60,
  },
  /** Webhook retry configuration */
  webhookRetry: {
    maxAttempts: 3,
    backoffMs: [1000, 5000, 30000], // 1s, 5s, 30s
  },
} as const

export type RateLimitKey = keyof typeof RATE_LIMITS
export type RateLimitConfig = typeof RATE_LIMITS[Exclude<RateLimitKey, 'webhookRetry'>]

// =============================================================================
// Plan Limits
// =============================================================================

/**
 * Plan limits for each subscription tier
 * Used for subscription enforcement and UI display
 * @agent remediate-plan-limits
 */
export const PLAN_LIMITS = {
  free: {
    mauLimit: 1_000,
    storageGb: 1,
    appsLimit: 2,
    teamMembersLimit: 1,
    buildsPerMonth: 10,
    hasAnalytics: false,
    hasWebhooks: false,
    hasPrioritySupport: false,
  },
  pro: {
    mauLimit: 10_000,
    storageGb: 10,
    appsLimit: 10,
    teamMembersLimit: 5,
    buildsPerMonth: 100,
    hasAnalytics: true,
    hasWebhooks: true,
    hasPrioritySupport: false,
  },
  team: {
    mauLimit: 100_000,
    storageGb: 50,
    appsLimit: 50,
    teamMembersLimit: 20,
    buildsPerMonth: 500,
    hasAnalytics: true,
    hasWebhooks: true,
    hasPrioritySupport: true,
  },
  enterprise: {
    mauLimit: Infinity,
    storageGb: Infinity,
    appsLimit: Infinity,
    teamMembersLimit: Infinity,
    buildsPerMonth: Infinity,
    hasAnalytics: true,
    hasWebhooks: true,
    hasPrioritySupport: true,
  },
} as const

export type PlanId = keyof typeof PLAN_LIMITS
export type PlanLimits = typeof PLAN_LIMITS[PlanId]
