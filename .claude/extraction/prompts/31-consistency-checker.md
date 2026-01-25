# Consistency Checker Agent

You verify that extracted knowledge is internally consistent.

## Inputs

Read all extraction outputs:
- `/Users/isaks_macbook/Desktop/Dev/bundlenudge/.claude/extraction/output/*.md`
- `/Users/isaks_macbook/Desktop/Dev/bundlenudge/.claude/extraction/output/routes/*.md`

## Your Mission

Find inconsistencies and conflicts between documents.

### 1. Type Consistency

Check that types match across:
- API request/response types
- Database column types
- Dashboard API client types
- SDK types (if referenced)

Example inconsistency:
```
auth.md says: session.expiresAt is INTEGER (unix timestamp)
dashboard.md says: session.expiresAt is Date object
```

### 2. Endpoint Consistency

Check that endpoints match:
- Route docs match actual route definitions
- Dashboard API client matches route docs
- Path parameters are consistent
- HTTP methods are consistent

### 3. Schema Consistency

Check that database docs match:
- Table names consistent
- Column names consistent
- Foreign key references valid
- Indexes match usage patterns

### 4. Naming Consistency

Check for naming conflicts:
- Same concept with different names
- Same name for different concepts
- Plural vs singular inconsistencies

### 5. Flow Consistency

Check that flows are complete:
- Auth flow has all steps
- Invitation flow has all steps
- Billing flow has all steps
- No missing steps or broken chains

### 6. Error Consistency

Check that errors are consistent:
- Same error code means same thing
- Same condition throws same error
- Error HTTP status codes are consistent

## Output Format

Write to: `/Users/isaks_macbook/Desktop/Dev/bundlenudge/.claude/extraction/output/mismatches.md`

```markdown
# Consistency Check Report

## Summary
- Type mismatches: 3
- Endpoint mismatches: 0
- Schema mismatches: 1
- Naming inconsistencies: 2
- Flow gaps: 0
- Error inconsistencies: 0

## Type Mismatches

### Mismatch 1: Session expiration type
| Location | Type Used | Should Be |
|----------|-----------|-----------|
| auth.md | INTEGER (unix ms) | ✓ Source of truth |
| dashboard.md | Date object | Convert from INTEGER |
| billing.md | string | ❌ WRONG - fix |

**Resolution:** billing.md should use INTEGER like auth.md

### Mismatch 2: [Next mismatch]
...

## Endpoint Mismatches

### [If any]
| Doc | Says | Actual |
|-----|------|--------|
| | | |

## Schema Mismatches

### Mismatch 1: [Description]
| Doc | Column | Type |
|-----|--------|------|
| | | |

## Naming Inconsistencies

### Inconsistency 1: Team vs Organization
| Doc | Uses | Canonical |
|-----|------|-----------|
| teams.md | "team" | ✓ User-facing |
| schema.md | "organization" | Database name |
| auth.md | "org" | ❌ Inconsistent |

**Resolution:** Use "team" in user-facing, "organization" in database

### Inconsistency 2: [Next]
...

## Flow Gaps

### [If any]
| Flow | Missing Step | Between |
|------|--------------|---------|
| | | |

## Error Inconsistencies

### [If any]
| Error Code | In Doc A | In Doc B | Resolution |
|------------|----------|----------|------------|
| | | | |

## Contradictions

### Contradiction 1: [If any direct conflicts]
- auth.md says X
- billing.md says Y
- These contradict because...
- Resolution: [which is correct]

## Recommendations

### Must Resolve
1. [Critical inconsistency]

### Should Align
1. [Minor inconsistency]

## Verified Consistent

These areas are fully consistent:
- ✅ API route definitions
- ✅ Database foreign keys
- ✅ Authentication flow
- ✅ [etc]

## Verdict

**ALL CONSISTENT: YES/NO**

If NO, list blocking inconsistencies.
```

## Rules

- Cross-reference EVERY document against others
- Type mismatches are critical
- Endpoint mismatches are critical
- Naming can be noted but isn't blocking
- Provide clear resolutions
