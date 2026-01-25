# /loop Command

Autonomous infinity loop for BundleNudge rebuild. Implements Ralph Wiggum-style checkpoint loops with quality gates.

## Usage

```bash
/loop                    # Resume from last checkpoint
/loop --start            # Start new loop from beginning
/loop --status           # Show current loop status
/loop --pause            # Pause at next checkpoint
/loop --resume           # Resume paused loop
/loop --checkpoint       # Force checkpoint now
/loop --max-iterations N # Set max iterations (default: 500)
```

## CRITICAL: Use Subagents

**YOU MUST USE THE TASK TOOL FOR EACH FEATURE BUILD.**

For each feature, spawn a named subagent:

```
Task tool call:
- description: "Phase {N} Feature: {feature-name}"
- subagent_type: "Explore" (for research) or "general-purpose" (for implementation)
- prompt: Contains feature requirements + context
```

### Agent Naming Convention

Each subagent MUST be named: `phase-{N}-{feature-name}`

Example: `phase-3-apps-crud`, `phase-5-webhooks-outgoing`

### Agent Attribution

When a subagent creates or modifies files, it MUST add attribution:

```typescript
/**
 * @agent phase-3-apps-crud
 * @created 2026-01-25
 */
```

And update CURRENT_STATE.md with:
```markdown
### Completed by Agents
- phase-3-apps-crud: Created apps routes, 5 test files
- phase-3-releases-crud: Created releases routes, 4 test files
```

## Behavior

### Start/Resume Logic

1. Read `.claude/loop-state.json`
2. If `status === "initialized"`, start from Phase 1
3. If `status === "running"`, continue from current iteration
4. If `status === "paused"`, resume from checkpoint
5. If `status === "completed"`, report completion

### Each Iteration

```
1. PRE-CHECKS
   - Disk space > 1GB
   - Git working tree clean (or commit changes)
   - No .claude/STOP file
   - Dependencies installed

2. TASK EXECUTION
   - Read current phase's plan.md
   - Find next unchecked task
   - Execute task (implement file, write tests)
   - Update checkin.md

3. VERIFICATION PIPELINE
   - pnpm typecheck (current package)
   - pnpm test --run (current package)
   - pnpm lint (current package)
   - pnpm build (current package)
   - ./scripts/quality-audit.sh (current package)

4. POST-ITERATION
   - If all pass: commit, increment iteration
   - If fail: retry up to 3 times, then pause
   - Every 10 iterations: create checkpoint
```

### Checkpoint Format

Checkpoints saved to `.claude/checkpoints/checkpoint-{iteration}-{label}.json`:

```json
{
  "id": "checkpoint-047-api-routes",
  "timestamp": "2024-01-23T03:42:00Z",
  "loopState": { /* full loop-state.json */ },
  "gitState": {
    "branch": "main",
    "commitHash": "abc123def"
  },
  "resumePrompt": "Continue from checkpoint-047. Working on API routes package..."
}
```

### Stop Signals

Loop pauses when:
- `.claude/STOP` file exists
- `maxIterations` reached
- 3 consecutive failures on same task
- Quality audit fails (after 3 retries)
- User runs `/loop --pause`

### Safety Limits

| Limit | Value | Action |
|-------|-------|--------|
| Max lines changed/iteration | 500 | Warning + log |
| Max files changed/iteration | 20 | Warning + log |
| Max consecutive failures | 3 | Pause + checkpoint |
| Checkpoint interval | 10 | Auto-checkpoint |

## Phase Order

1. **foundation** - Monorepo setup
2. **shared** - Types and schemas
3. **api** - Cloudflare Workers API (largest)
4. **sdk** - React Native SDK
5. **dashboard** - Next.js dashboard
6. **builder** - Bundle builder
7. **worker** - Mac build worker

## Files Modified

- `.claude/loop-state.json` - Updated every iteration
- `.claude/checkpoints/` - Checkpoint files
- `packages/*/checkin.md` - Package progress
- `checkin.md` - Root progress file

## Example Session

```
/loop --status
> Loop Status: initialized
> Current Phase: foundation
> Iteration: 0/500
> Next Task: Create package.json

/loop --start
> Starting BundleNudge rebuild loop...
> Phase: foundation
> Iteration 1: Creating root package.json
> [PASS] typecheck
> [PASS] lint
> Committed: "loop: iteration 1 - root package.json"

> Iteration 2: Creating pnpm-workspace.yaml
> [PASS] typecheck
> [PASS] lint
> Committed: "loop: iteration 2 - pnpm workspace config"

... continues autonomously ...

> Iteration 10: Checkpoint created
> Saved to: .claude/checkpoints/checkpoint-010-foundation.json
```

## Recovery

If loop fails unexpectedly:

```bash
# Check what happened
/loop --status

# If state corrupted, restore from checkpoint
cp .claude/checkpoints/checkpoint-040-api.json .claude/loop-state.json

# Resume
/loop --resume
```

## Quality Gates

Every iteration enforces:
- Max 250 lines per file
- Max 50 lines per function
- No `any` types in production code
- No `console.log` in production code
- No silent catch blocks
- All tests passing
- TypeScript strict mode

Violations fail the iteration and must be fixed before proceeding.
