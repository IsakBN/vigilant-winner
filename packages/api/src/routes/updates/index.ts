/**
 * Update Check Routes
 *
 * Handles update checks from SDK. Returns available updates
 * based on device attributes and targeting rules.
 *
 * @agent fix-subscription-enforcement, fix-targeting-rules, remediate-rollout-hash, remediate-multi-release-resolution
 * @modified 2026-01-25
 *
 * @agent wave4-channels
 * @modified 2026-01-25
 * @description Added channel filtering for update checks
 */

import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import {
  updateCheckRequestSchema,
  ERROR_CODES,
} from '@bundlenudge/shared'
import type {
  TargetingRules,
  DeviceAttributes,
  UpdateCheckRequestSchema,
} from '@bundlenudge/shared'
import { verifyDeviceToken } from '../../lib/device-token'
import { evaluateRules } from '../../lib/targeting'
import { getBucket } from '../../lib/targeting/hash'
import { checkMAULimitForApp } from '../../lib/subscription-limits'
import type { Env } from '../../types/env'

interface ReleaseRow {
  id: string
  app_id: string
  channel_id: string | null
  version: string
  bundle_url: string
  bundle_size: number
  bundle_hash: string
  rollout_percentage: number
  status: string
  min_app_version: string | null
  max_app_version: string | null
  release_notes: string | null
  targeting_rules: string | null
}

interface ChannelRow {
  id: string
  name: string
}

const DEFAULT_CHANNEL = 'production'

interface AppRow {
  id: string
  webhook_secret: string
}

export const updatesRouter = new Hono<{ Bindings: Env }>()

/**
 * POST /v1/updates/check
 *
 * Check for available updates for a device.
 * Returns the latest active release if device qualifies.
 */
updatesRouter.post(
  '/check',
  zValidator('json', updateCheckRequestSchema),
  async (c) => {
    const body = c.req.valid('json')

    // Get app and validate
    const app = await c.env.DB.prepare(
      'SELECT id, webhook_secret FROM apps WHERE id = ? AND deleted_at IS NULL'
    ).bind(body.appId).first<AppRow>()

    if (!app) {
      return c.json({ updateAvailable: false })
    }

    // Validate device token if provided
    const authHeader = c.req.header('Authorization')
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7)
      const payload = await verifyDeviceToken(token, app.webhook_secret)

      if (payload?.appId !== body.appId) {
        return c.json(
          { error: ERROR_CODES.INVALID_TOKEN, message: 'Invalid token' },
          401
        )
      }
    }

    // Check MAU limit for app owner
    const mauCheck = await checkMAULimitForApp(c.env, body.appId)
    if (!mauCheck.allowed) {
      return c.json(
        {
          error: ERROR_CODES.MAU_LIMIT_EXCEEDED,
          message: mauCheck.message ?? 'MAU limit exceeded. Please upgrade your plan.',
          updateAvailable: false,
        },
        403
      )
    }

    // Resolve channel - use provided channel or default to 'production'
    // @agent wave4-channels
    const requestedChannel = body.channel ?? DEFAULT_CHANNEL
    const channel = await c.env.DB.prepare(
      'SELECT id, name FROM channels WHERE app_id = ? AND name = ?'
    ).bind(body.appId, requestedChannel).first<ChannelRow>()

    // Get all active releases for this app (limited to newest 10)
    // Filter by channel if one was found, otherwise get all releases
    // Include releases with NULL channel_id for backwards compatibility
    // We iterate through them to find the first that matches targeting rules
    // @agent remediate-multi-release-resolution, wave4-channels
    const releases = channel
      ? await c.env.DB.prepare(`
          SELECT * FROM releases
          WHERE app_id = ? AND status = 'active' AND bundle_url != ''
            AND (channel_id = ? OR channel_id IS NULL)
          ORDER BY created_at DESC
          LIMIT 10
        `).bind(body.appId, channel.id).all<ReleaseRow>()
      : await c.env.DB.prepare(`
          SELECT * FROM releases
          WHERE app_id = ? AND status = 'active' AND bundle_url != ''
          ORDER BY created_at DESC
          LIMIT 10
        `).bind(body.appId).all<ReleaseRow>()

    if (releases.results.length === 0) {
      return c.json({ updateAvailable: false })
    }

    // Build device attributes once for all release evaluations
    const deviceAttributes = buildDeviceAttributes(body)

    // Find the first (newest) release that matches all criteria
    const release = findMatchingRelease(
      releases.results,
      body,
      deviceAttributes
    )

    if (!release) {
      return c.json({ updateAvailable: false })
    }

    // Update device last seen
    const now = Math.floor(Date.now() / 1000)
    c.executionCtx.waitUntil(
      c.env.DB.prepare(`
        UPDATE devices SET last_seen_at = ?, current_bundle_version = ?
        WHERE app_id = ? AND device_id = ?
      `).bind(now, body.currentBundleVersion ?? null, body.appId, body.deviceId).run()
    )

    // Return update info
    return c.json({
      updateAvailable: true,
      release: {
        version: release.version,
        bundleUrl: release.bundle_url,
        bundleSize: release.bundle_size,
        bundleHash: release.bundle_hash,
        releaseId: release.id,
        releaseNotes: release.release_notes ?? undefined,
      },
    })
  }
)

/**
 * Check if app version is within min/max constraints
 */
function isVersionInRange(
  appVersion: string,
  minVersion: string | null,
  maxVersion: string | null
): boolean {
  if (minVersion && compareVersions(appVersion, minVersion) < 0) {
    return false
  }
  if (maxVersion && compareVersions(appVersion, maxVersion) > 0) {
    return false
  }
  return true
}

/**
 * Simple semver comparison (major.minor.patch)
 * Returns: -1 if a < b, 0 if a == b, 1 if a > b
 */
function compareVersions(a: string, b: string): number {
  const partsA = a.split('.').map(n => parseInt(n, 10) || 0)
  const partsB = b.split('.').map(n => parseInt(n, 10) || 0)

  for (let i = 0; i < 3; i++) {
    const partA = partsA[i] ?? 0
    const partB = partsB[i] ?? 0

    if (partA < partB) return -1
    if (partA > partB) return 1
  }

  return 0
}

/**
 * Deterministic rollout check based on device ID
 * Uses FNV-1a hash for even bucket distribution
 *
 * @agent remediate-rollout-hash
 */
function isInRollout(deviceId: string, rolloutPercentage: number): boolean {
  if (rolloutPercentage >= 100) return true
  if (rolloutPercentage <= 0) return false
  return getBucket(deviceId) < rolloutPercentage
}

/**
 * Parse targeting rules from JSON string stored in database
 */
function parseTargetingRules(json: string | null): TargetingRules | null {
  if (!json) return null

  try {
    const parsed: unknown = JSON.parse(json)
    // Validate shape before type assertion
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      !('rules' in parsed) ||
      !Array.isArray(parsed.rules) ||
      parsed.rules.length === 0
    ) {
      return null
    }
    return parsed as TargetingRules
  } catch {
    return null
  }
}

/**
 * Build DeviceAttributes from update check request body
 */
function buildDeviceAttributes(body: UpdateCheckRequestSchema): DeviceAttributes {
  return {
    deviceId: body.deviceId,
    os: body.platform,
    osVersion: body.deviceInfo?.osVersion ?? '',
    deviceModel: body.deviceInfo?.deviceModel ?? '',
    timezone: body.deviceInfo?.timezone ?? '',
    locale: body.deviceInfo?.locale ?? '',
    appVersion: body.appVersion,
    currentBundleVersion: body.currentBundleVersion ?? null,
  }
}

/**
 * Find the first (newest) release that matches all eligibility criteria
 *
 * Iterates through releases (already sorted by createdAt DESC) and returns
 * the first one that passes:
 * - Version check (not already installed)
 * - Hash check (not already installed)
 * - App version constraints
 * - Rollout percentage
 * - Targeting rules
 *
 * @agent remediate-multi-release-resolution
 */
function findMatchingRelease(
  releases: ReleaseRow[],
  body: UpdateCheckRequestSchema,
  deviceAttributes: DeviceAttributes
): ReleaseRow | null {
  for (const release of releases) {
    // Skip if device already has this version
    if (body.currentBundleVersion === release.version) {
      continue
    }

    // Skip if device already has this bundle hash
    if (body.currentBundleHash === release.bundle_hash) {
      continue
    }

    // Skip if app version is outside constraints
    if (!isVersionInRange(body.appVersion, release.min_app_version, release.max_app_version)) {
      continue
    }

    // Skip if device is not in rollout bucket
    if (!isInRollout(body.deviceId, release.rollout_percentage)) {
      continue
    }

    // Skip if targeting rules exclude this device
    const targetingRules = parseTargetingRules(release.targeting_rules)
    if (targetingRules && !evaluateRules(targetingRules, deviceAttributes)) {
      continue
    }

    // Found a matching release
    return release
  }

  return null
}
