## Feature: api/targeting-engine

Implement the targeting rules engine for release resolution.

### Critical Decision (from DECISIONS.md)
- Releases have optional targeting rules
- "Newest wins" - return the newest release that matches
- Percentage targeting is STICKY (FNV-1a hash of deviceId)

### Files to Create

`packages/api/src/lib/targeting/evaluate.ts` - Rule evaluation
`packages/api/src/lib/targeting/resolve.ts` - Release resolution
`packages/api/src/lib/targeting/hash.ts` - FNV-1a implementation
`packages/api/src/lib/targeting/index.ts` - Exports
`packages/api/src/lib/targeting/*.test.ts` - Tests

### Implementation

```typescript
// evaluate.ts
import { TargetingRule, TargetingRules, DeviceAttributes } from '@bundlenudge/shared'
import { fnv1aHash } from './hash'

export function evaluateRules(
  rules: TargetingRules | null,
  device: DeviceAttributes
): boolean {
  if (!rules || rules.rules.length === 0) {
    return true // No rules = matches all
  }

  const results = rules.rules.map(rule => evaluateRule(rule, device))

  return rules.match === 'all'
    ? results.every(Boolean)
    : results.some(Boolean)
}

export function evaluateRule(
  rule: TargetingRule,
  device: DeviceAttributes
): boolean {
  // Special case: percentage targeting
  if (rule.field === 'percentage') {
    return evaluatePercentage(device.deviceId, rule.value as number)
  }

  const value = device[rule.field as keyof DeviceAttributes]
  if (value === undefined || value === null) {
    return false
  }

  switch (rule.op) {
    case 'eq': return value === rule.value
    case 'neq': return value !== rule.value
    case 'gt': return value > rule.value
    case 'gte': return value >= rule.value
    case 'lt': return value < rule.value
    case 'lte': return value <= rule.value
    case 'starts_with': return String(value).startsWith(String(rule.value))
    case 'ends_with': return String(value).endsWith(String(rule.value))
    case 'contains': return String(value).includes(String(rule.value))
    case 'in': return (rule.value as string[]).includes(String(value))
    case 'not_in': return !(rule.value as string[]).includes(String(value))
    case 'semver_gt': return compareSemver(String(value), String(rule.value)) > 0
    case 'semver_gte': return compareSemver(String(value), String(rule.value)) >= 0
    case 'semver_lt': return compareSemver(String(value), String(rule.value)) < 0
    case 'semver_lte': return compareSemver(String(value), String(rule.value)) <= 0
    default: return false
  }
}

function evaluatePercentage(deviceId: string, percentage: number): boolean {
  const bucket = fnv1aHash(deviceId) % 100
  return bucket < percentage
}

function compareSemver(a: string, b: string): number {
  const partsA = a.split('.').map(Number)
  const partsB = b.split('.').map(Number)

  for (let i = 0; i < 3; i++) {
    const diff = (partsA[i] || 0) - (partsB[i] || 0)
    if (diff !== 0) return diff
  }
  return 0
}
```

```typescript
// hash.ts
/**
 * FNV-1a hash algorithm.
 * Used for consistent device bucketing in percentage targeting.
 * Same device always gets same bucket (0-99).
 */
export function fnv1aHash(str: string): number {
  let hash = 2166136261

  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i)
    hash = (hash * 16777619) >>> 0  // Keep as 32-bit unsigned
  }

  return hash
}
```

```typescript
// resolve.ts
import { Release, DeviceAttributes } from '@bundlenudge/shared'
import { evaluateRules } from './evaluate'

export function resolveRelease(
  releases: Release[],
  device: DeviceAttributes
): Release | null {
  // Releases should be sorted by createdAt DESC (newest first)
  // Return first (newest) that matches

  for (const release of releases) {
    if (release.status !== 'active') continue

    if (evaluateRules(release.targetingRules, device)) {
      return release
    }
  }

  return null
}
```

### Tests Required

1. **Operator tests** - each operator works correctly
   - `eq`, `neq` with strings and numbers
   - `gt`, `gte`, `lt`, `lte` with numbers
   - `starts_with`, `ends_with`, `contains` with strings
   - `in`, `not_in` with arrays
   - `semver_*` with version strings

2. **Match mode tests**
   - `match: 'all'` requires all rules to pass
   - `match: 'any'` requires at least one rule to pass

3. **Percentage tests**
   - Same deviceId always gets same bucket (consistency)
   - Distribution is roughly uniform over many deviceIds
   - 50% setting captures ~50% of random deviceIds

4. **Resolution tests**
   - Returns newest matching release
   - Skips non-active releases
   - Returns null when nothing matches
   - No targeting rules = matches all devices

### FNV-1a Consistency Test

```typescript
test('fnv1aHash returns consistent results', () => {
  const deviceId = 'device-abc-123'
  const hash1 = fnv1aHash(deviceId)
  const hash2 = fnv1aHash(deviceId)
  expect(hash1).toBe(hash2)

  // Known value test (computed externally)
  expect(fnv1aHash('test')).toBe(2949673445)
})
```
