#!/bin/bash
# BundleNudge Verification Pipeline
# Usage: ./scripts/verify.sh [package] [--quick] [--fix]

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Parse arguments
PKG="${1:-all}"
QUICK=false
FIX=false

for arg in "$@"; do
  case $arg in
    --quick) QUICK=true ;;
    --fix) FIX=true ;;
  esac
done

# Determine filter
if [ "$PKG" = "all" ]; then
  FILTER=""
  FILTER_DISPLAY="all packages"
else
  FILTER="--filter @bundlenudge/$PKG"
  FILTER_DISPLAY="@bundlenudge/$PKG"
fi

echo ""
echo -e "${BLUE}=== Verification Pipeline for ${FILTER_DISPLAY} ===${NC}"
echo ""

# Track results
STEP=1
TOTAL=5
if [ "$QUICK" = true ]; then
  TOTAL=4
fi

# Function to run step
run_step() {
  local name=$1
  local cmd=$2

  echo -e "${BLUE}[$STEP/$TOTAL] $name${NC}"

  if eval "$cmd" > /tmp/verify-output.txt 2>&1; then
    echo -e "      ${GREEN}✅ PASS${NC}"
    STEP=$((STEP + 1))
    return 0
  else
    echo -e "      ${RED}❌ FAIL${NC}"
    echo ""
    cat /tmp/verify-output.txt
    echo ""
    echo -e "${RED}=== Verification failed at step $STEP ===${NC}"
    exit $STEP
  fi
}

# Step 1: TypeScript Check
run_step "TypeScript Check" "pnpm $FILTER typecheck"

# Step 2: Tests
run_step "Tests" "pnpm $FILTER test -- --run"

# Step 3: Lint
if [ "$FIX" = true ]; then
  echo -e "${YELLOW}Running lint with --fix...${NC}"
  pnpm $FILTER lint -- --fix 2>/dev/null || true
fi
run_step "Lint" "pnpm $FILTER lint"

# Step 4: Build (skip if --quick)
if [ "$QUICK" = false ]; then
  run_step "Build" "pnpm $FILTER build"
fi

# Step 5: Quality Audit
run_step "Quality Audit" "./scripts/quality-audit.sh $PKG"

echo ""
echo -e "${GREEN}=== All checks passed ===${NC}"
echo ""

exit 0
