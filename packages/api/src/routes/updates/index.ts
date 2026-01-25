/**
 * Update Check Routes
 *
 * Handles update checks from SDK. Returns available updates
 * based on device attributes and targeting rules.
 *
 * @agent fix-subscription-enforcement, fix-targeting-rules
 * @modified 2026-01-25
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
import { checkMAULimitForApp } from '../../lib/subscription-limits'
import type { Env } from '../../types/env'

interface ReleaseRow {
  id: string
  app_id: string
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

      if (!payload || payload.appId !== body.appId) {
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

    // Get the latest active release for this app
    const release = await c.env.DB.prepare(`
      SELECT * FROM releases
      WHERE app_id = ? AND status = 'active' AND bundle_url != ''
      ORDER BY created_at DESC
      LIMIT 1
    `).bind(body.appId).first<ReleaseRow>()

    if (!release) {
      return c.json({ updateAvailable: false })
    }

    // Check if device already has this version
    if (body.currentBundleVersion === release.version) {
      return c.json({ updateAvailable: false })
    }

    // Check if device already has this bundle hash
    if (body.currentBundleHash === release.bundle_hash) {
      return c.json({ updateAvailable: false })
    }

    // Check app version constraints
    if (!isVersionInRange(body.appVersion, release.min_app_version, release.max_app_version)) {
      return c.json({
        updateAvailable: false,
        requiresAppStoreUpdate: true,
        appStoreMessage: 'Please update to the latest app version to receive OTA updates.',
      })
    }

    // Check rollout percentage
    if (!isInRollout(body.deviceId, release.rollout_percentage)) {
      return c.json({ updateAvailable: false })
    }

    // Evaluate targeting rules
    const targetingRules = parseTargetingRules(release.targeting_rules)
    if (targetingRules) {
      const deviceAttributes = buildDeviceAttributes(body)
      if (!evaluateRules(targetingRules, deviceAttributes)) {
        return c.json({ updateAvailable: false })
      }
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
 * Uses hash of deviceId to get consistent assignment
 */
function isInRollout(deviceId: string, rolloutPercentage: number): boolean {
  if (rolloutPercentage >= 100) return true
  if (rolloutPercentage <= 0) return false

  // Simple hash: sum of char codes modulo 100
  let hash = 0
  for (let i = 0; i < deviceId.length; i++) {
    hash = (hash + deviceId.charCodeAt(i)) % 100
  }

  return hash < rolloutPercentage
}

/**
 * Parse targeting rules from JSON string stored in database
 */
function parseTargetingRules(json: string | null): TargetingRules | null {
  if (!json) return null

  try {
    const parsed = JSON.parse(json) as TargetingRules
    if (!parsed.rules || parsed.rules.length === 0) {
      return null
    }
    return parsed
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
