/**
 * Channel management Zod schemas
 *
 * Channels are named release tracks (production, staging, beta) that allow
 * apps to have different releases for different audiences.
 *
 * @agent channels-system
 * @created 2026-01-25
 */
import { z } from 'zod'
import { targetingOperatorSchema } from '../schemas'

// =============================================================================
// Channel Name Validation
// =============================================================================

/** Channel name: lowercase alphanumeric + hyphens, 1-50 chars */
export const channelNameSchema = z
  .string()
  .min(1, 'Channel name is required')
  .max(50, 'Channel name must be at most 50 characters')
  .regex(/^[a-z0-9-]+$/, {
    message: 'Channel name must be lowercase alphanumeric with hyphens only',
  })

/** Channel display name: 1-100 chars */
export const channelDisplayNameSchema = z
  .string()
  .min(1, 'Display name is required')
  .max(100, 'Display name must be at most 100 characters')

/** Rollout percentage: 0-100 */
export const rolloutPercentageSchema = z
  .number()
  .min(0, 'Rollout percentage must be at least 0')
  .max(100, 'Rollout percentage must be at most 100')

export const channelTargetingRuleSchema = z.object({
  field: z.string().min(1),
  op: targetingOperatorSchema,
  value: z.union([z.string(), z.number(), z.array(z.string())]),
})
export type ChannelTargetingRule = z.infer<typeof channelTargetingRuleSchema>

export const channelTargetingRulesSchema = z.object({
  match: z.enum(['all', 'any']),
  rules: z.array(channelTargetingRuleSchema),
})
export type ChannelTargetingRules = z.infer<typeof channelTargetingRulesSchema>

// =============================================================================
// Channel CRUD Schemas
// =============================================================================

export const createChannelSchema = z.object({
  name: channelNameSchema,
  displayName: channelDisplayNameSchema,
  description: z.string().max(500).optional(),
  rolloutPercentage: rolloutPercentageSchema.optional().default(100),
  targetingRules: channelTargetingRulesSchema.optional(),
})
export type CreateChannelInput = z.infer<typeof createChannelSchema>

export const updateChannelSchema = z.object({
  name: channelNameSchema.optional(),
  displayName: channelDisplayNameSchema.optional(),
  description: z.string().max(500).nullable().optional(),
  isDefault: z.boolean().optional(),
  rolloutPercentage: rolloutPercentageSchema.optional(),
  targetingRules: channelTargetingRulesSchema.nullable().optional(),
  activeReleaseId: z.string().uuid().nullable().optional(),
})
export type UpdateChannelInput = z.infer<typeof updateChannelSchema>

// =============================================================================
// Channel Response Types
// =============================================================================

export const channelSchema = z.object({
  id: z.string().uuid(),
  appId: z.string().uuid(),
  name: channelNameSchema,
  displayName: channelDisplayNameSchema,
  description: z.string().nullable(),
  isDefault: z.boolean(),
  rolloutPercentage: rolloutPercentageSchema,
  targetingRules: channelTargetingRulesSchema.nullable(),
  activeReleaseId: z.string().uuid().nullable(),
  createdAt: z.number(),
  updatedAt: z.number(),
})
export type Channel = z.infer<typeof channelSchema>

// =============================================================================
// Default Channels
// =============================================================================

export const DEFAULT_CHANNELS = ['production', 'staging', 'development'] as const
export type DefaultChannel = typeof DEFAULT_CHANNELS[number]

/**
 * Check if a channel name is a default channel
 */
export function isDefaultChannelName(name: string): name is DefaultChannel {
  return DEFAULT_CHANNELS.includes(name as DefaultChannel)
}

/**
 * Get display name for a default channel
 */
export function getDefaultChannelDisplayName(name: DefaultChannel): string {
  const displayNames: Record<DefaultChannel, string> = {
    production: 'Production',
    staging: 'Staging',
    development: 'Development',
  }
  return displayNames[name]
}
