# Failure Logs

This directory stores failure logs from loop iterations.

## Format

Each failure creates a file: `failure-{iteration}-{timestamp}.md`

```markdown
# Failure at Iteration 47

**Time**: 2024-01-23T03:42:00Z
**Phase**: api
**Task**: src/routes/apps.ts
**Error Type**: TypeScript

## Error Output
[paste error here]

## Context
[what was being attempted]

## Resolution
[how it was fixed, or "pending"]
```

## Usage

When the loop fails 3 times on the same task, check here for patterns.
