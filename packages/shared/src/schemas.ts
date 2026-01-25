/**
 * Zod validation schemas for runtime type checking
 *
 * Used by API for request validation and SDK for response validation.
 */

import { z } from 'zod'

// =============================================================================
// Apps
// =============================================================================

export const createAppSchema = z.object({
  name: z.string().min(1).max(100),
  platform: z.enum(['ios', 'android']),
  bundleId: z.string().min(1).max(255).optional(),
})

export const updateAppSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  bundleId: z.string().min(1).max(255).optional().nullable(),
})

export type CreateAppSchema = z.infer<typeof createAppSchema>
export type UpdateAppSchema = z.infer<typeof updateAppSchema>

// =============================================================================
// Releases
// =============================================================================

export const createReleaseSchema = z.object({
  version: z.string().min(1).max(50),
  releaseNotes: z.string().max(5000).optional(),
  minAppVersion: z.string().max(50).optional(),
  maxAppVersion: z.string().max(50).optional(),
})

export const updateReleaseSchema = z.object({
  releaseNotes: z.string().max(5000).optional(),
  status: z.enum(['active', 'paused', 'rolled_back']).optional(),
  rollbackReason: z.string().max(500).optional(),
})

export const updateRolloutSchema = z.object({
  rolloutPercentage: z.number().min(0).max(100).optional(),
})

export type CreateReleaseSchema = z.infer<typeof createReleaseSchema>
export type UpdateReleaseSchema = z.infer<typeof updateReleaseSchema>
export type UpdateRolloutSchema = z.infer<typeof updateRolloutSchema>

// =============================================================================
// Device & Targeting
// =============================================================================

export const deviceAttributesSchema = z.object({
  deviceId: z.string().min(1).max(100),
  os: z.enum(['ios', 'android']),
  osVersion: z.string().max(20),
  deviceModel: z.string().max(100),
  timezone: z.string().max(50),
  locale: z.string().max(20),
  appVersion: z.string().max(50),
  currentBundleVersion: z.string().nullable(),
})

export const targetingOperatorSchema = z.enum([
  'eq',
  'neq',
  'gt',
  'gte',
  'lt',
  'lte',
  'starts_with',
  'ends_with',
  'contains',
  'in',
  'not_in',
  'semver_gt',
  'semver_gte',
  'semver_lt',
  'semver_lte',
])

export const targetingRuleSchema = z.object({
  field: z.string(),
  op: targetingOperatorSchema,
  value: z.union([z.string(), z.number(), z.array(z.string())]),
})

export const targetingRulesSchema = z.object({
  match: z.enum(['all', 'any']),
  rules: z.array(targetingRuleSchema),
})

// =============================================================================
// Update Check
// =============================================================================

/**
 * @agent wave4-channels
 * @modified 2026-01-25
 * @description Added optional channel field for channel-based deployments
 */
export const updateCheckRequestSchema = z.object({
  appId: z.string().uuid(),
  deviceId: z.string().min(1).max(100),
  platform: z.enum(['ios', 'android']),
  appVersion: z.string().min(1).max(50),
  currentBundleVersion: z.string().optional(),
  currentBundleHash: z.string().optional(),
  channel: z.string().min(1).max(50).optional(),
  deviceInfo: z
    .object({
      osVersion: z.string().optional(),
      deviceModel: z.string().optional(),
      timezone: z.string().optional(),
      locale: z.string().optional(),
    })
    .optional(),
})

export const criticalRouteSchema = z.object({
  id: z.string(),
  pattern: z.string(),
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE', '*']),
  name: z.string().optional(),
})

export const updateCheckReleaseInfoSchema = z.object({
  version: z.string(),
  bundleUrl: z.string().url(),
  bundleSize: z.number().positive(),
  bundleHash: z.string(),
  releaseId: z.string(),
  releaseNotes: z.string().optional(),
  criticalRoutes: z.array(criticalRouteSchema).optional(),
})

export const updateCheckResponseSchema = z.object({
  updateAvailable: z.boolean(),
  requiresAppStoreUpdate: z.boolean().optional(),
  appStoreMessage: z.string().optional(),
  release: updateCheckReleaseInfoSchema.optional(),
})

// =============================================================================
// Device Registration
// =============================================================================

export const deviceRegisterRequestSchema = z.object({
  appId: z.string().uuid(),
  deviceId: z.string().min(1).max(100),
  platform: z.enum(['ios', 'android']),
  appVersion: z.string().min(1).max(50),
  deviceInfo: z
    .object({
      osVersion: z.string().optional(),
      deviceModel: z.string().optional(),
      timezone: z.string().optional(),
      locale: z.string().optional(),
    })
    .optional(),
})

export const deviceRegisterResponseSchema = z.object({
  accessToken: z.string(),
  expiresAt: z.number(),
})

// =============================================================================
// Telemetry
// =============================================================================

export const rollbackReasonSchema = z.enum(['crash', 'route_failure', 'manual'])

export const telemetryAppliedSchema = z.object({
  type: z.literal('applied'),
  version: z.string(),
  previousVersion: z.string().nullable(),
})

export const telemetryRollbackSchema = z.object({
  type: z.literal('rollback'),
  fromVersion: z.string(),
  toVersion: z.string(),
  reason: rollbackReasonSchema,
})

export const telemetryErrorSchema = z.object({
  type: z.literal('error'),
  errorType: z.string(),
  errorMessage: z.string(),
  targetVersion: z.string().optional(),
})

export const telemetryRouteSchema = z.object({
  type: z.literal('route'),
  routeId: z.string(),
  success: z.boolean(),
  statusCode: z.number().optional(),
})

export const telemetryEventSchema = z.discriminatedUnion('type', [
  telemetryAppliedSchema,
  telemetryRollbackSchema,
  telemetryErrorSchema,
  telemetryRouteSchema,
])

// =============================================================================
// SDK Metadata
// =============================================================================

export const sdkMetadataSchema = z.object({
  deviceId: z.string(),
  accessToken: z.string().nullable(),
  currentVersion: z.string().nullable(),
  currentVersionHash: z.string().nullable(),
  previousVersion: z.string().nullable(),
  pendingUpdateFlag: z.boolean(),
  lastSuccessTime: z.number().nullable(),
})

// =============================================================================
// Type exports from schemas
// =============================================================================

export type DeviceAttributesSchema = z.infer<typeof deviceAttributesSchema>
export type UpdateCheckRequestSchema = z.infer<typeof updateCheckRequestSchema>
export type UpdateCheckResponseSchema = z.infer<typeof updateCheckResponseSchema>
export type DeviceRegisterRequestSchema = z.infer<typeof deviceRegisterRequestSchema>
export type DeviceRegisterResponseSchema = z.infer<typeof deviceRegisterResponseSchema>
export type TelemetryEventSchema = z.infer<typeof telemetryEventSchema>
export type SDKMetadataSchema = z.infer<typeof sdkMetadataSchema>

// =============================================================================
// Billing & Subscriptions
// =============================================================================

export const planIdSchema = z.enum(['free', 'pro', 'team', 'enterprise'])
// Note: PlanId type is exported from constants.ts (keyof typeof PLAN_LIMITS)

export const subscriptionStatusSchema = z.enum([
  'active',
  'past_due',
  'canceled',
  'expired',
  'trialing',
])
export type SubscriptionStatus = z.infer<typeof subscriptionStatusSchema>

export const createCheckoutSchema = z.object({
  planId: planIdSchema.exclude(['free']),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
})
export type CreateCheckoutInput = z.infer<typeof createCheckoutSchema>

export const createPortalSessionSchema = z.object({
  returnUrl: z.string().url(),
})
export type CreatePortalSessionInput = z.infer<typeof createPortalSessionSchema>

export const stripeEventTypeSchema = z.enum([
  'checkout.session.completed',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.payment_failed',
  'invoice.paid',
])
export type StripeEventType = z.infer<typeof stripeEventTypeSchema>

export const stripeWebhookHeaderSchema = z.object({
  'stripe-signature': z.string(),
})

export const subscriptionSchema = z.object({
  id: z.string(),
  planId: planIdSchema,
  status: subscriptionStatusSchema,
  currentPeriodStart: z.number(),
  currentPeriodEnd: z.number(),
  cancelAtPeriodEnd: z.boolean(),
})
export type Subscription = z.infer<typeof subscriptionSchema>

export const usageStatsSchema = z.object({
  mau: z.object({
    current: z.number(),
    limit: z.number(),
    percentage: z.number(),
  }),
  storage: z.object({
    currentGb: z.number(),
    limitGb: z.number(),
    percentage: z.number(),
  }),
  apps: z.object({
    current: z.number(),
    limit: z.number(),
  }),
})
export type UsageStats = z.infer<typeof usageStatsSchema>

// =============================================================================
// Authentication
// =============================================================================

/**
 * Password schema: 8-72 characters (72 is bcrypt max)
 */
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password must be at most 72 characters')

export const signUpSchema = z.object({
  email: z.string().email('Invalid email'),
  password: passwordSchema,
  name: z.string().min(1).max(100).optional(),
})
export type SignUpInput = z.infer<typeof signUpSchema>

export const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})
export type SignInInput = z.infer<typeof signInSchema>

export const emailVerificationSchema = z.object({
  email: z.string().email(),
  otp: z.string().regex(/^\d{6}$/, 'OTP must be 6 digits'),
})
export type EmailVerificationInput = z.infer<typeof emailVerificationSchema>

export const adminOtpRequestSchema = z.object({
  email: z
    .string()
    .email()
    .refine(
      (email) => email.toLowerCase().endsWith('@bundlenudge.com'),
      'Admin access requires @bundlenudge.com email'
    ),
})
export type AdminOtpRequestInput = z.infer<typeof adminOtpRequestSchema>

export const adminOtpVerifySchema = z.object({
  email: z.string().email(),
  otp: z.string().regex(/^\d{6}$/, 'OTP must be 6 digits'),
})
export type AdminOtpVerifyInput = z.infer<typeof adminOtpVerifySchema>

export const passwordResetRequestSchema = z.object({
  email: z.string().email(),
})
export type PasswordResetRequestInput = z.infer<typeof passwordResetRequestSchema>

export const passwordResetSchema = z.object({
  token: z.string().min(1),
  newPassword: passwordSchema,
})
export type PasswordResetInput = z.infer<typeof passwordResetSchema>
