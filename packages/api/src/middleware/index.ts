/**
 * @agent fix-validation
 * @modified 2026-01-25
 *
 * Middleware exports
 */

export { authMiddleware, requireAdmin } from './auth'
export type { AuthUser, AuthSession } from './auth'

export { deviceAuthMiddleware } from './device-auth'
export type { DeviceContext } from './device-auth'

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
