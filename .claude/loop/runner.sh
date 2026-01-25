#!/bin/bash
# BundleNudge Autonomous Build Loop
#
# Runs Claude in a loop to build the entire project autonomously.
# Each iteration: read state → build feature → test → checkpoint
#
# Usage:
#   ./runner.sh              # Start fresh
#   ./runner.sh --continue   # Resume from last state

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
CLAUDE_BIN="$HOME/.local/bin/claude"
STATE_FILE="$SCRIPT_DIR/state.json"
LOG_DIR="$SCRIPT_DIR/logs"
PROMPTS_DIR="$SCRIPT_DIR/prompts"
SUMMARY_LOG="$LOG_DIR/build-summary.log"
RUN_ID="$(date +%Y%m%d-%H%M%S)"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Config
MAX_RETRIES=3
CHECKPOINT_EVERY=5  # features (reduced from default for better recovery)
STOP_FILE="$SCRIPT_DIR/STOP"
FAILURES_DIR="$SCRIPT_DIR/failures"

# Ensure directories exist
mkdir -p "$LOG_DIR"
mkdir -p "$PROMPTS_DIR"
mkdir -p "$FAILURES_DIR"

# Summary log helper - writes to both console and summary log
summary() {
  local msg="[$(date '+%Y-%m-%d %H:%M:%S')] $1"
  echo "$msg" >> "$SUMMARY_LOG"
  echo -e "${CYAN}$msg${NC}"
}

# Check for emergency stop
check_stop() {
  if [ -f "$STOP_FILE" ]; then
    error "STOP file detected - halting build loop"
    summary "🛑 EMERGENCY STOP triggered by user"
    checkpoint "emergency-stop"
    rm -f "$STOP_FILE"
    exit 0
  fi
}

# Get last N completed features for context
get_recent_completed() {
  local n="${1:-3}"
  jq -r ".completedFeatures | .[-${n}:] | .[]" "$STATE_FILE" 2>/dev/null || echo ""
}

# Save failure details for debugging
save_failure() {
  local feature="$1"
  local attempt="$2"
  local log_file="$3"
  local failure_file="$FAILURES_DIR/${feature//://}-$(date +%Y%m%d-%H%M%S).md"

  cat > "$failure_file" << FAILURE_EOF
# Failure Report: $feature

**Time:** $(date '+%Y-%m-%d %H:%M:%S')
**Attempt:** $attempt
**Run ID:** $RUN_ID

## State at Failure
\`\`\`json
$(jq '{currentPackage, currentFeature, completedFeatures, failedAttempts}' "$STATE_FILE")
\`\`\`

## Last 50 Lines of Log
\`\`\`
$(tail -50 "$log_file" 2>/dev/null || echo "Log not available")
\`\`\`

## Recent Completed Features
$(get_recent_completed 5 | sed 's/^/- /')

FAILURE_EOF

  warn "Failure details saved to: $failure_file"
}

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

log() {
  echo -e "${BLUE}[$(date '+%H:%M:%S')]${NC} $1"
}

success() {
  echo -e "${GREEN}[$(date '+%H:%M:%S')] ✓${NC} $1"
}

error() {
  echo -e "${RED}[$(date '+%H:%M:%S')] ✗${NC} $1"
}

warn() {
  echo -e "${YELLOW}[$(date '+%H:%M:%S')] !${NC} $1"
}

# Read JSON field from state
read_state() {
  local field="$1"
  jq -r ".$field" "$STATE_FILE"
}

# Update JSON field in state
update_state() {
  local field="$1"
  local value="$2"
  local tmp=$(mktemp)
  jq ".$field = $value" "$STATE_FILE" > "$tmp" && mv "$tmp" "$STATE_FILE"
}

# Get next feature to build
get_next_feature() {
  local completed=$(jq -r '.completedFeatures | join(",")' "$STATE_FILE")
  jq -r --arg completed "$completed" '
    .buildOrder[] |
    .package as $pkg |
    .features[] |
    select(($pkg + ":" + .) as $full | ($completed | split(",") | index($full) | not)) |
    "\(.package):\(.)"
  ' "$STATE_FILE" | head -1
}

# Create checkpoint
checkpoint() {
  local message="$1"
  cd "$PROJECT_ROOT"

  if git diff --quiet && git diff --cached --quiet; then
    log "No changes to checkpoint"
    return 0
  fi

  git add -A
  git commit -m "checkpoint: $message

Autonomous build loop checkpoint.
State: $(cat "$STATE_FILE" | jq -c '{phase,currentFeature,completedFeatures}')"

  update_state "lastCheckpoint" "\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\""
  success "Checkpoint created: $message"
}

# ============================================================================
# BUILD FEATURE
# ============================================================================

build_feature() {
  local feature="$1"
  local package="${feature%%:*}"
  local feature_name="${feature##*:}"
  local attempt=1
  local log_file="$LOG_DIR/${package}-${feature_name}-${RUN_ID}.log"
  local start_time=$(date +%s)

  log "Building: $package/$feature_name"
  summary "▶ STARTING: $package/$feature_name"

  # Update state
  update_state "currentPackage" "\"$package\""
  update_state "currentFeature" "\"$feature_name\""
  update_state "phase" "\"building\""

  # Build the prompt
  local prompt=$(build_prompt "$package" "$feature_name")

  while [ $attempt -le $MAX_RETRIES ]; do
    # Check for emergency stop before each attempt
    check_stop

    log "Attempt $attempt/$MAX_RETRIES"

    # Run Claude with fresh context (no --continue, explicit new session)
    # -p: Non-interactive mode (prints output, doesn't wait for input)
    # --dangerously-skip-permissions: Auto-approve tool use
    # --model: Use sonnet for speed/cost balance
    # Each invocation is a NEW session with NO prior context
    if echo "$prompt" | $CLAUDE_BIN -p \
      --dangerously-skip-permissions \
      --model sonnet \
      2>&1 | tee "$log_file"; then

      # Run tests
      if run_tests "$package"; then
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        success "Feature complete: $feature"
        summary "✅ COMPLETED: $package/$feature_name (${duration}s, attempt $attempt)"

        # Update completed
        local completed=$(jq -c '.completedFeatures + ["'"$feature"'"]' "$STATE_FILE")
        update_state "completedFeatures" "$completed"
        update_state "phase" "\"ready\""

        return 0
      else
        warn "Tests failed, retrying..."
      fi
    else
      warn "Build failed, retrying..."
    fi

    # Record failed attempt
    local failed=$(jq -c '.failedAttempts + [{"feature":"'"$feature"'","attempt":'$attempt',"time":"'"$(date -u +%Y-%m-%dT%H:%M:%SZ)"'"}]' "$STATE_FILE")
    update_state "failedAttempts" "$failed"

    attempt=$((attempt + 1))
  done

  local end_time=$(date +%s)
  local duration=$((end_time - start_time))
  error "Feature failed after $MAX_RETRIES attempts: $feature"
  summary "❌ FAILED: $package/$feature_name (${duration}s, $MAX_RETRIES attempts)"

  # Save failure details for debugging
  save_failure "$feature" "$MAX_RETRIES" "$log_file"

  update_state "phase" "\"failed\""
  return 1
}

# ============================================================================
# BUILD PROMPT
# ============================================================================

build_prompt() {
  local package="$1"
  local feature="$2"

  # Load base context
  local decisions=$(cat "$PROJECT_ROOT/.claude/design/DECISIONS.md")
  local knowledge=$(cat "$PROJECT_ROOT/.claude/knowledge/KNOWLEDGE.md")
  local claude_md=$(cat "$PROJECT_ROOT/CLAUDE.md")
  local current_state=$(cat "$PROJECT_ROOT/.claude/knowledge/CURRENT_STATE.md")

  # Build context primer (reduces warm-up time)
  local completed_count=$(jq '.completedFeatures | length' "$STATE_FILE")
  local total_features=$(jq '.totalFeatures' "$STATE_FILE")
  local recent_completed=$(get_recent_completed 3)
  local context_primer="## Context Primer (READ FIRST)
Progress: $completed_count / $total_features features completed

Last 3 completed features:
$recent_completed

Current task: $package/$feature
"

  # Load feature-specific prompt if exists
  local feature_prompt=""
  local prompt_key="${package}/${feature}"
  local prompt_file=$(jq -r ".promptFiles[\"$prompt_key\"] // \"\"" "$STATE_FILE")

  if [ -n "$prompt_file" ] && [ -f "$PROMPTS_DIR/$prompt_file" ]; then
    feature_prompt=$(cat "$PROMPTS_DIR/$prompt_file")
  elif [ -f "$PROMPTS_DIR/${package}-${feature}.md" ]; then
    feature_prompt=$(cat "$PROMPTS_DIR/${package}-${feature}.md")
  else
    warn "No prompt file found for $package/$feature"
  fi

  # Build full prompt
  cat << EOF
You are building BundleNudge, an OTA update system for React Native.

$context_primer

## Your Task
Build the "$feature" feature for the "$package" package.

## Current State (What Already Exists)
$current_state

## Context Files

### DECISIONS.md (Design decisions - follow these exactly)
$decisions

### KNOWLEDGE.md (Implementation patterns)
$knowledge

### CLAUDE.md (Code quality rules)
$claude_md

## Feature-Specific Instructions
$feature_prompt

## Requirements
1. READ CURRENT_STATE.md first - don't recreate existing files
2. Follow ALL patterns from KNOWLEDGE.md
3. Respect ALL decisions from DECISIONS.md
4. Follow ALL code quality rules from CLAUDE.md (max 250 lines/file, etc.)
5. Write tests for the feature (colocated *.test.ts files)
6. Tests MUST pass before you're done

## Output
- Create/edit files as needed
- Run tests to verify: pnpm test --filter=@bundlenudge/$package
- If tests fail, fix the code until they pass

Begin implementation.
EOF
}

# ============================================================================
# RUN VERIFICATION
# ============================================================================

run_tests() {
  local package="$1"

  cd "$PROJECT_ROOT"

  # Run tests
  log "Running tests for $package..."
  if ! pnpm test --filter="@bundlenudge/$package" 2>&1; then
    error "Tests failed"
    return 1
  fi
  success "Tests passed"

  # Run typecheck
  log "Running typecheck for $package..."
  if ! pnpm typecheck --filter="@bundlenudge/$package" 2>&1; then
    error "Typecheck failed"
    return 1
  fi
  success "Typecheck passed"

  # Run lint (optional - don't fail build)
  log "Running lint for $package..."
  if pnpm lint --filter="@bundlenudge/$package" 2>&1; then
    success "Lint passed"
  else
    warn "Lint warnings (non-blocking)"
  fi

  return 0
}

# ============================================================================
# MAIN LOOP
# ============================================================================

main() {
  echo ""
  echo -e "${CYAN}╔══════════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${CYAN}║         BUNDLENUDGE AUTONOMOUS BUILD LOOP                        ║${NC}"
  echo -e "${CYAN}╚══════════════════════════════════════════════════════════════════╝${NC}"
  echo ""

  # Check Claude CLI
  if [ ! -x "$CLAUDE_BIN" ]; then
    error "Claude CLI not found at $CLAUDE_BIN"
    exit 1
  fi

  # Initialize state if starting fresh
  if [ "$1" != "--continue" ]; then
    log "Starting fresh build..."
    update_state "startedAt" "\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\""
    update_state "completedFeatures" "[]"
    update_state "failedAttempts" "[]"
    update_state "phase" "\"ready\""
    summary "═══════════════════════════════════════════════════════════════"
    summary "BUILD STARTED: $(date '+%Y-%m-%d %H:%M:%S')"
    summary "Run ID: $RUN_ID"
    summary "Total features: $(jq '.totalFeatures' "$STATE_FILE")"
    summary "═══════════════════════════════════════════════════════════════"
  else
    log "Resuming from previous state..."
    local completed_count=$(jq '.completedFeatures | length' "$STATE_FILE")
    summary "═══════════════════════════════════════════════════════════════"
    summary "BUILD RESUMED: $(date '+%Y-%m-%d %H:%M:%S')"
    summary "Already completed: $completed_count features"
    summary "═══════════════════════════════════════════════════════════════"
  fi

  # Main build loop
  local features_since_checkpoint=0
  local loop_start_time=$(date +%s)
  local iteration=0

  while true; do
    # Check for emergency stop at start of each iteration
    check_stop

    local next=$(get_next_feature)
    iteration=$((iteration + 1))

    if [ -z "$next" ] || [ "$next" = "null" ]; then
      success "All features complete!"
      checkpoint "final"
      break
    fi

    log "Next feature: $next"

    if ! build_feature "$next"; then
      error "Build loop stopped due to failure"
      checkpoint "failed-$next"
      exit 1
    fi

    features_since_checkpoint=$((features_since_checkpoint + 1))

    # Checkpoint every N features
    if [ $features_since_checkpoint -ge $CHECKPOINT_EVERY ]; then
      checkpoint "$next"
      features_since_checkpoint=0
    fi

    # Small delay between features
    sleep 2
  done

  # Final verification of entire project
  log "Running final project verification..."
  cd "$PROJECT_ROOT"

  if pnpm test 2>&1 && pnpm typecheck 2>&1; then
    success "All project tests and typecheck passed!"
  else
    error "Final verification failed"
    exit 1
  fi

  echo ""
  success "Build loop complete!"

  local completed_count=$(jq '.completedFeatures | length' "$STATE_FILE")
  local failed_count=$(jq '.failedAttempts | length' "$STATE_FILE")
  local started=$(read_state startedAt)
  local finished=$(date -u +%Y-%m-%dT%H:%M:%SZ)

  summary "═══════════════════════════════════════════════════════════════"
  summary "BUILD COMPLETE: $finished"
  summary "═══════════════════════════════════════════════════════════════"
  summary "  Completed features: $completed_count"
  summary "  Failed attempts: $failed_count"
  summary "  Started: $started"
  summary "  Finished: $finished"
  summary "═══════════════════════════════════════════════════════════════"
  summary ""
  summary "COMPLETED FEATURES:"
  jq -r '.completedFeatures[]' "$STATE_FILE" | while read -r f; do
    summary "  ✅ $f"
  done

  if [ "$failed_count" -gt 0 ]; then
    summary ""
    summary "FAILED ATTEMPTS:"
    jq -r '.failedAttempts[] | "  ❌ \(.feature) (attempt \(.attempt) at \(.time))"' "$STATE_FILE" >> "$SUMMARY_LOG"
  fi

  echo ""
  echo "Full summary log: $SUMMARY_LOG"
  echo ""

  # Generate morning summary report
  generate_morning_summary
}

# ============================================================================
# MORNING SUMMARY REPORT
# ============================================================================

generate_morning_summary() {
  local report_file="$LOG_DIR/morning-summary-${RUN_ID}.md"
  local completed_count=$(jq '.completedFeatures | length' "$STATE_FILE")
  local failed_count=$(jq '.failedAttempts | length' "$STATE_FILE")
  local total_features=$(jq '.totalFeatures' "$STATE_FILE")
  local started=$(read_state startedAt)
  local finished=$(date -u +%Y-%m-%dT%H:%M:%SZ)

  # Calculate duration
  local start_epoch=$(date -d "$started" +%s 2>/dev/null || date -j -f "%Y-%m-%dT%H:%M:%SZ" "$started" +%s 2>/dev/null || echo "0")
  local end_epoch=$(date +%s)
  local duration_mins=$(( (end_epoch - start_epoch) / 60 ))
  local avg_time_per_feature=0
  if [ "$completed_count" -gt 0 ]; then
    avg_time_per_feature=$(( duration_mins / completed_count ))
  fi

  # Count files created
  local files_created=$(git diff --name-only --diff-filter=A HEAD~$((completed_count > 10 ? 10 : completed_count)) 2>/dev/null | wc -l | tr -d ' ')

  cat > "$report_file" << MORNING_EOF
# BundleNudge Build Loop - Morning Summary

**Generated:** $(date '+%Y-%m-%d %H:%M:%S')
**Run ID:** $RUN_ID

---

## Overview

| Metric | Value |
|--------|-------|
| Features Completed | $completed_count / $total_features |
| Failed Attempts | $failed_count |
| Total Duration | ${duration_mins} minutes |
| Avg Time/Feature | ${avg_time_per_feature} minutes |
| Files Created | ~$files_created |

---

## Progress

\`\`\`
[$completed_count/$total_features] $(printf '█%.0s' $(seq 1 $((completed_count * 30 / total_features)))) $(printf '░%.0s' $(seq 1 $(( (total_features - completed_count) * 30 / total_features ))))
\`\`\`

---

## Completed Features

$(jq -r '.completedFeatures[]' "$STATE_FILE" | nl -w2 -s'. ' | sed 's/^/- /')

---

## Failed Attempts

$(if [ "$failed_count" -gt 0 ]; then
  jq -r '.failedAttempts[] | "- **\(.feature)** - attempt \(.attempt) at \(.time)"' "$STATE_FILE"
else
  echo "_No failures_"
fi)

---

## Failure Reports

$(ls -1 "$FAILURES_DIR"/*.md 2>/dev/null | while read f; do echo "- [$f]($f)"; done || echo "_No failure reports_")

---

## Next Steps

$(if [ "$completed_count" -lt "$total_features" ]; then
  echo "1. Resume with: \`pnpm loop:continue\`"
  echo "2. Next feature: $(get_next_feature)"
else
  echo "1. Run full verification: \`pnpm verify\`"
  echo "2. Test on device"
fi)

---

## Logs

- Summary: \`$SUMMARY_LOG\`
- Individual: \`$LOG_DIR/*.log\`
- Failures: \`$FAILURES_DIR/\`

MORNING_EOF

  success "Morning summary generated: $report_file"
  echo ""
  cat "$report_file"
}

main "$@"
