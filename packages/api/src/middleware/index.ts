/**
 * @agent fix-validation
 * @modified 2026-01-25
 *
 * @agent remediate-api-key-middleware
 * @modified 2026-01-25
 *
 * Middleware exports
 */

export { authMiddleware, requireAdmin } from './auth'
export type { AuthUser, AuthSession } from './auth'

export { deviceAuthMiddleware } from './device-auth'
export type { DeviceContext } from './device-auth'

export {
  apiKeyMiddleware,
  requirePermission,
  hashApiKey,
  API_KEY_PERMISSIONS,
} from './api-key'
export type { ApiKeyData, ApiKeyPermission } from './api-key'

export { requireTeamRole, hasMinRole } from './team-permission'

export {
  createRateLimitMiddleware,
  rateLimitUpdates,
  rateLimitTelemetry,
  rateLimitDevices,
  RATE_LIMITS,
} from './rate-limit'
export type { RateLimitType, RateLimitInfo } from './rate-limit'

export {
  createBodySizeMiddleware,
  bodySizeLimit,
  bundleUploadSizeLimit,
  DEFAULT_BODY_SIZE_LIMIT,
  BUNDLE_UPLOAD_SIZE_LIMIT,
} from './body-size'
