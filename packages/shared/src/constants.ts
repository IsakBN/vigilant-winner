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
