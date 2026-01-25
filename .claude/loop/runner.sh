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
CHECKPOINT_EVERY=3  # features

# Ensure directories exist
mkdir -p "$LOG_DIR"
mkdir -p "$PROMPTS_DIR"

# Summary log helper - writes to both console and summary log
summary() {
  local msg="[$(date '+%Y-%m-%d %H:%M:%S')] $1"
  echo "$msg" >> "$SUMMARY_LOG"
  echo -e "${CYAN}$msg${NC}"
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
    log "Attempt $attempt/$MAX_RETRIES"

    # Run Claude with fresh context (no --continue, explicit new session)
    # --print: Non-interactive mode
    # --dangerously-skip-permissions: Auto-approve tool use
    # --model: Use sonnet for speed/cost balance
    # Each invocation is a NEW session with NO prior context
    if $CLAUDE_BIN --print \
      --dangerously-skip-permissions \
      --model sonnet \
      "$prompt" \
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

## Your Task
Build the "$feature" feature for the "$package" package.

## Context Files (READ THESE FIRST)

### DECISIONS.md (Design decisions - follow these exactly)
$decisions

### KNOWLEDGE.md (Implementation patterns)
$knowledge

### CLAUDE.md (Code quality rules)
$claude_md

## Feature-Specific Instructions
$feature_prompt

## Requirements
1. Follow ALL patterns from KNOWLEDGE.md
2. Respect ALL decisions from DECISIONS.md
3. Follow ALL code quality rules from CLAUDE.md (max 250 lines/file, etc.)
4. Write tests for the feature (colocated *.test.ts files)
5. Tests MUST pass before you're done

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

  while true; do
    local next=$(get_next_feature)

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
}

main "$@"
