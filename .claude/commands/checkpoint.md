# /checkpoint Command

Create or restore checkpoints for the BundleNudge rebuild loop.

## Usage

```bash
/checkpoint              # Create checkpoint now
/checkpoint --list       # List all checkpoints
/checkpoint --restore N  # Restore to checkpoint N
/checkpoint --diff N     # Show changes since checkpoint N
/checkpoint --clean      # Remove old checkpoints (keep last 10)
```

## Behavior

### Create Checkpoint

Captures complete state:

1. Copy current `loop-state.json`
2. Record git commit hash
3. Snapshot quality metrics
4. Generate resume prompt
5. Save to `.claude/checkpoints/checkpoint-{iteration}-{label}.json`

### Checkpoint Contents

```json
{
  "id": "checkpoint-047-api-routes",
  "timestamp": "2024-01-23T03:42:00Z",
  "iteration": 47,
  "phase": "api",
  "subphase": "routes",

  "loopState": {
    /* Complete copy of loop-state.json */
  },

  "gitState": {
    "branch": "main",
    "commitHash": "abc123def456",
    "uncommittedChanges": false
  },

  "qualityMetrics": {
    "totalFiles": 47,
    "totalLines": 3200,
    "testCount": 89,
    "anyTypeCount": 0,
    "filesOver250Lines": 0,
    "passedVerification": true
  },

  "packageProgress": {
    "shared": { "files": 12, "tests": 24, "complete": true },
    "api": { "files": 35, "tests": 65, "complete": false }
  },

  "resumePrompt": "Continue BundleNudge rebuild from checkpoint-047. Currently in API package, working on routes. Last completed: src/routes/apps.ts. Next task: src/routes/releases.ts."
}
```

### Restore Checkpoint

```bash
/checkpoint --restore 47
```

1. Read checkpoint file
2. Restore `loop-state.json`
3. Git reset to checkpoint commit (if needed)
4. Update `checkin.md` files
5. Report restored state

### Automatic Checkpoints

Loop creates checkpoints automatically:
- Every 10 iterations
- Before phase transitions
- Before risky operations
- After major milestones

### Checkpoint Naming

Format: `checkpoint-{iteration}-{label}.json`

Labels:
- `foundation` - Monorepo setup complete
- `shared` - Shared package complete
- `api-middleware` - API middleware complete
- `api-routes` - API routes complete
- `sdk` - SDK complete
- `dashboard` - Dashboard complete
- `final` - All packages complete

## Files

```
.claude/checkpoints/
├── checkpoint-010-foundation.json
├── checkpoint-025-shared.json
├── checkpoint-050-api-middleware.json
├── checkpoint-100-api-routes.json
├── checkpoint-150-api.json
├── checkpoint-200-sdk.json
├── checkpoint-280-dashboard.json
└── checkpoint-345-final.json
```

## Recovery Scenarios

### Scenario 1: Loop crashed mid-iteration

```bash
# Check current state
/loop --status

# If corrupted, restore last checkpoint
/checkpoint --list
/checkpoint --restore 40

# Resume
/loop --resume
```

### Scenario 2: Bad changes introduced

```bash
# Find checkpoint before bad changes
/checkpoint --diff 30  # Compare to checkpoint 30

# Restore to known good state
/checkpoint --restore 30

# Continue from there
/loop --resume
```

### Scenario 3: Need to branch

```bash
# Create checkpoint before experiment
/checkpoint

# Try experimental approach
/loop --start

# If fails, restore
/checkpoint --restore 50
```

## Cleanup

Remove old checkpoints to save space:

```bash
/checkpoint --clean  # Keeps last 10 checkpoints
```

Checkpoints at phase boundaries are never deleted.
