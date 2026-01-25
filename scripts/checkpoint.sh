#!/bin/bash
# BundleNudge Checkpoint Script
# Creates checkpoint snapshots for loop recovery
# Usage: ./scripts/checkpoint.sh [label]

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

LABEL="${1:-manual}"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
CHECKPOINT_DIR=".claude/checkpoints"

# Ensure checkpoint directory exists
mkdir -p "$CHECKPOINT_DIR"

# Read current loop state
if [ ! -f ".claude/loop-state.json" ]; then
  echo -e "${RED}Error: .claude/loop-state.json not found${NC}"
  exit 1
fi

ITERATION=$(jq -r '.currentIteration' .claude/loop-state.json)
PHASE=$(jq -r '.currentPhase' .claude/loop-state.json)

# Generate checkpoint ID
CHECKPOINT_ID="checkpoint-$(printf '%03d' $ITERATION)-$LABEL"
CHECKPOINT_FILE="$CHECKPOINT_DIR/$CHECKPOINT_ID.json"

echo -e "${BLUE}Creating checkpoint: $CHECKPOINT_ID${NC}"

# Get git state
GIT_BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")
GIT_HASH=$(git rev-parse HEAD 2>/dev/null || echo "unknown")
GIT_DIRTY=$(git status --porcelain 2>/dev/null | wc -l | tr -d ' ')

# Calculate metrics
TOTAL_FILES=0
TOTAL_LINES=0
TEST_COUNT=0
ANY_COUNT=0
LARGE_FILES=0

for dir in packages/*/src; do
  if [ -d "$dir" ]; then
    files=$(find "$dir" -name "*.ts" -o -name "*.tsx" 2>/dev/null | wc -l | tr -d ' ')
    TOTAL_FILES=$((TOTAL_FILES + files))

    for f in $(find "$dir" -name "*.ts" -o -name "*.tsx" 2>/dev/null); do
      lines=$(wc -l < "$f" | tr -d ' ')
      TOTAL_LINES=$((TOTAL_LINES + lines))
      if [ "$lines" -gt 250 ]; then
        LARGE_FILES=$((LARGE_FILES + 1))
      fi
    done

    tests=$(find "$dir" -name "*.test.ts" -o -name "*.test.tsx" 2>/dev/null | wc -l | tr -d ' ')
    TEST_COUNT=$((TEST_COUNT + tests))

    any=$(grep -r ": any\|as any" "$dir" 2>/dev/null | grep -v ".test." | wc -l | tr -d ' ')
    ANY_COUNT=$((ANY_COUNT + any))
  fi
done

# Generate resume prompt
RESUME_PROMPT="Continue BundleNudge rebuild from $CHECKPOINT_ID. Currently in $PHASE phase at iteration $ITERATION."

# Create checkpoint JSON
cat > "$CHECKPOINT_FILE" << EOF
{
  "id": "$CHECKPOINT_ID",
  "timestamp": "$TIMESTAMP",
  "iteration": $ITERATION,
  "phase": "$PHASE",
  "label": "$LABEL",

  "gitState": {
    "branch": "$GIT_BRANCH",
    "commitHash": "$GIT_HASH",
    "uncommittedChanges": $([ "$GIT_DIRTY" -gt 0 ] && echo "true" || echo "false")
  },

  "qualityMetrics": {
    "totalFiles": $TOTAL_FILES,
    "totalLines": $TOTAL_LINES,
    "testCount": $TEST_COUNT,
    "anyTypeCount": $ANY_COUNT,
    "filesOver250Lines": $LARGE_FILES
  },

  "resumePrompt": "$RESUME_PROMPT"
}
EOF

# Also embed the full loop state
jq --slurpfile state .claude/loop-state.json '. + {loopState: $state[0]}' "$CHECKPOINT_FILE" > "$CHECKPOINT_FILE.tmp"
mv "$CHECKPOINT_FILE.tmp" "$CHECKPOINT_FILE"

echo ""
echo -e "${GREEN}✅ Checkpoint created: $CHECKPOINT_FILE${NC}"
echo ""
echo "  Iteration: $ITERATION"
echo "  Phase: $PHASE"
echo "  Git: $GIT_BRANCH @ ${GIT_HASH:0:7}"
echo "  Files: $TOTAL_FILES ($TOTAL_LINES lines)"
echo "  Tests: $TEST_COUNT"
echo ""

# List recent checkpoints
echo -e "${BLUE}Recent checkpoints:${NC}"
ls -1t "$CHECKPOINT_DIR"/*.json 2>/dev/null | head -5 | while read f; do
  echo "  - $(basename "$f")"
done

exit 0
