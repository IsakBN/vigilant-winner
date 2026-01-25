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

export const updateCheckRequestSchema = z.object({
  appId: z.string().uuid(),
  deviceId: z.string().min(1).max(100),
  platform: z.enum(['ios', 'android']),
  appVersion: z.string().min(1).max(50),
  currentBundleVersion: z.string().optional(),
  currentBundleHash: z.string().optional(),
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
