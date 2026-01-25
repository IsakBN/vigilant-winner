/**
 * Targeting Rule Evaluation
 *
 * Evaluates targeting rules against device attributes to determine
 * if a device matches a release's targeting criteria.
 */

import type {
  TargetingRule,
  TargetingRules,
  DeviceAttributes,
} from '@bundlenudge/shared'
import { getBucket } from './hash'

/**
 * Evaluate all targeting rules against a device
 *
 * @param rules - Targeting rules configuration (null = matches all)
 * @param device - Device attributes to evaluate against
 * @returns true if device matches the targeting rules
 */
export function evaluateRules(
  rules: TargetingRules | null,
  device: DeviceAttributes
): boolean {
  if (!rules || rules.rules.length === 0) {
    return true // No rules = matches all devices
  }

  const results = rules.rules.map((rule) => evaluateRule(rule, device))

  return rules.match === 'all'
    ? results.every(Boolean)
    : results.some(Boolean)
}

/**
 * Evaluate a single targeting rule
 *
 * @param rule - The rule to evaluate
 * @param device - Device attributes
 * @returns true if the rule matches
 */
export function evaluateRule(
  rule: TargetingRule,
  device: DeviceAttributes
): boolean {
  // Special case: percentage targeting
  if (rule.field === 'percentage') {
    return evaluatePercentage(device.deviceId, rule.value as number)
  }

  const value = device[rule.field as keyof DeviceAttributes]

  // Null/undefined field values don't match any rule
  if (value === undefined || value === null) {
    return false
  }

  return evaluateOperator(rule.op, value, rule.value)
}

/**
 * Evaluate percentage-based targeting
 * Uses FNV-1a hash for sticky bucket assignment
 */
function evaluatePercentage(deviceId: string, percentage: number): boolean {
  const bucket = getBucket(deviceId)
  return bucket < percentage
}

/**
 * Evaluate an operator against a field value and target value
 */
function evaluateOperator(
  op: string,
  fieldValue: string | number | null,
  targetValue: string | number | string[]
): boolean {
  switch (op) {
    case 'eq':
      return fieldValue === targetValue

    case 'neq':
      return fieldValue !== targetValue

    case 'gt':
      return typeof fieldValue === 'number' && typeof targetValue === 'number'
        ? fieldValue > targetValue
        : false

    case 'gte':
      return typeof fieldValue === 'number' && typeof targetValue === 'number'
        ? fieldValue >= targetValue
        : false

    case 'lt':
      return typeof fieldValue === 'number' && typeof targetValue === 'number'
        ? fieldValue < targetValue
        : false

    case 'lte':
      return typeof fieldValue === 'number' && typeof targetValue === 'number'
        ? fieldValue <= targetValue
        : false

    case 'starts_with':
      return String(fieldValue).startsWith(String(targetValue))

    case 'ends_with':
      return String(fieldValue).endsWith(String(targetValue))

    case 'contains':
      return String(fieldValue).includes(String(targetValue))

    case 'in':
      return Array.isArray(targetValue) && targetValue.includes(String(fieldValue))

    case 'not_in':
      return Array.isArray(targetValue) && !targetValue.includes(String(fieldValue))

    case 'semver_gt':
      return compareSemver(String(fieldValue), String(targetValue)) > 0

    case 'semver_gte':
      return compareSemver(String(fieldValue), String(targetValue)) >= 0

    case 'semver_lt':
      return compareSemver(String(fieldValue), String(targetValue)) < 0

    case 'semver_lte':
      return compareSemver(String(fieldValue), String(targetValue)) <= 0

    default:
      return false
  }
}

/**
 * Compare two semver strings
 * @returns negative if a < b, 0 if equal, positive if a > b
 */
function compareSemver(a: string, b: string): number {
  const partsA = a.split('.').map((n) => parseInt(n, 10) || 0)
  const partsB = b.split('.').map((n) => parseInt(n, 10) || 0)

  for (let i = 0; i < 3; i++) {
    const diff = (partsA[i] || 0) - (partsB[i] || 0)
    if (diff !== 0) return diff
  }

  return 0
}
