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
  RELEASE_NOT_FOUND: 'RELEASE_NOT_FOUND',
  DEVICE_NOT_FOUND: 'DEVICE_NOT_FOUND',
  TEAM_NOT_FOUND: 'TEAM_NOT_FOUND',

  // Rate Limiting
  RATE_LIMITED: 'RATE_LIMITED',
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',

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
