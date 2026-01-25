/**
 * Targeting Engine
 *
 * Evaluates targeting rules to determine which devices
 * should receive which releases.
 */

export { fnv1aHash, getBucket } from './hash'
export { evaluateRules, evaluateRule } from './evaluate'
export { resolveRelease, isEligible } from './resolve'
