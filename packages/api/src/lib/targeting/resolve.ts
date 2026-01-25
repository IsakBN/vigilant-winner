/**
 * Release Resolution
 *
 * Resolves which release (if any) a device should receive
 * based on targeting rules. Uses "newest wins" strategy.
 */

import type { Release, DeviceAttributes } from '@bundlenudge/shared'
import { evaluateRules } from './evaluate'

/**
 * Resolve the best matching release for a device
 *
 * Strategy: "Newest wins" - returns the newest active release
 * that matches the device's attributes.
 *
 * @param releases - Releases sorted by createdAt DESC (newest first)
 * @param device - Device attributes to match against
 * @returns The matching release, or null if none match
 */
export function resolveRelease(
  releases: Release[],
  device: DeviceAttributes
): Release | null {
  // Releases should already be sorted by createdAt DESC
  // Return first (newest) that matches all criteria

  for (const release of releases) {
    // Skip non-active releases
    if (release.status !== 'active') {
      continue
    }

    // Check targeting rules
    if (!evaluateRules(release.targetingRules, device)) {
      continue
    }

    // Found a matching release
    return release
  }

  return null
}

/**
 * Check if a device is eligible for a specific release
 *
 * @param release - The release to check
 * @param device - Device attributes
 * @returns true if the device is eligible
 */
export function isEligible(release: Release, device: DeviceAttributes): boolean {
  if (release.status !== 'active') {
    return false
  }

  return evaluateRules(release.targetingRules, device)
}
