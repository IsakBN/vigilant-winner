#!/bin/bash
# BundleNudge Package Build Workflow Runner
# Usage: ./build-package.sh <package>
#   package: shared | api | sdk | dashboard | builder | worker

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
WORKFLOWS_DIR="$PROJECT_ROOT/.claude/workflows"
KNOWLEDGE_DIR="$PROJECT_ROOT/.claude/knowledge"
GATES_DIR="$PROJECT_ROOT/.claude/gates"
REFERENCE="/Users/isaks_macbook/Desktop/Dev/codepush"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
NC='\033[0m'

PKG="${1}"

if [ -z "$PKG" ]; then
  echo -e "${RED}ERROR: Package name required${NC}"
  echo "Usage: ./build-package.sh <package>"
  echo "Packages: shared | api | sdk | dashboard | builder | worker"
  exit 1
fi

PKG_DIR="$PROJECT_ROOT/packages/$PKG"
TASKS_DIR="$PKG_DIR/tasks"

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║        BundleNudge Package Build Workflow                  ║${NC}"
echo -e "${BLUE}╠════════════════════════════════════════════════════════════╣${NC}"
echo -e "${BLUE}║ Package: ${GREEN}@bundlenudge/$PKG${NC}${BLUE}                                   ║${NC}"
echo -e "${BLUE}║ Gates: ${MAGENTA}CRITICAL FEATURES REQUIRE APPROVAL${NC}${BLUE}                  ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# ==========================================
# Gate Check Function
# ==========================================
check_gate() {
  local gate_name=$1
  local gate_file="$GATES_DIR/$gate_name.approved"

  if [ ! -f "$gate_file" ]; then
    echo ""
    echo -e "${MAGENTA}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${MAGENTA}║  CONFIDENCE GATE: $gate_name${NC}"
    echo -e "${MAGENTA}╠════════════════════════════════════════════════════════════╣${NC}"
    echo -e "${MAGENTA}║                                                            ║${NC}"
    echo -e "${MAGENTA}║  This gate requires HUMAN APPROVAL before continuing.      ║${NC}"
    echo -e "${MAGENTA}║                                                            ║${NC}"
    echo -e "${MAGENTA}║  1. Review the implementation                              ║${NC}"
    echo -e "${MAGENTA}║  2. Check tests pass (especially edge cases)               ║${NC}"
    echo -e "${MAGENTA}║  3. Verify on real devices if applicable                   ║${NC}"
    echo -e "${MAGENTA}║                                                            ║${NC}"
    echo -e "${MAGENTA}║  See: .claude/workflows/package-build/CONFIDENCE-GATES.md  ║${NC}"
    echo -e "${MAGENTA}║                                                            ║${NC}"
    echo -e "${MAGENTA}║  To approve: Run /approve $gate_name                       ║${NC}"
    echo -e "${MAGENTA}║                                                            ║${NC}"
    echo -e "${MAGENTA}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo "Workflow paused at gate: $gate_name"
    exit 0
  else
    echo -e "${GREEN}✓ Gate '$gate_name' previously approved${NC}"
  fi
}

approve_gate() {
  local gate_name=$1
  mkdir -p "$GATES_DIR"
  echo "Approved at $(date)" > "$GATES_DIR/$gate_name.approved"
  echo -e "${GREEN}Gate '$gate_name' approved. Workflow can continue.${NC}"
}

# ==========================================
# Pre-flight checks
# ==========================================
echo -e "${YELLOW}Pre-flight checks...${NC}"

# Check knowledge base exists
if [ ! -f "$KNOWLEDGE_DIR/bundlenudge-knowledge.md" ]; then
  echo -e "${RED}ERROR: Knowledge base not found.${NC}"
  echo "Run ./interrogate.sh first"
  exit 1
fi
echo -e "${GREEN}✓ Knowledge base exists${NC}"

# Check for critical features document
if [ ! -f "$WORKFLOWS_DIR/interrogation/CRITICAL-FEATURES.md" ]; then
  echo -e "${RED}ERROR: CRITICAL-FEATURES.md not found.${NC}"
  echo "Critical features must be defined before build."
  exit 1
fi
echo -e "${GREEN}✓ Critical features defined${NC}"

# Check git clean
if [ -n "$(git -C $PROJECT_ROOT status --porcelain)" ]; then
  echo -e "${YELLOW}WARNING: Git working tree not clean. Committing changes...${NC}"
  git -C $PROJECT_ROOT add -A
  git -C $PROJECT_ROOT commit -m "pre-build($PKG): commit before build"
fi
echo -e "${GREEN}✓ Git state OK${NC}"
echo ""

# Create directories
mkdir -p "$PKG_DIR"
mkdir -p "$PKG_DIR/src"
mkdir -p "$TASKS_DIR"
mkdir -p "$GATES_DIR"

# ==========================================
# Gate: Foundation (before any package builds)
# ==========================================
if [ "$PKG" != "shared" ]; then
  check_gate "foundation"
fi

# ==========================================
# Phase 1: Architect
# ==========================================
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo -e "${BLUE}Phase 1: ARCHITECT${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}"

if [ ! -f "$PKG_DIR/spec.md" ]; then
  echo "The architect agent will read the reference implementation and create a spec."
  echo ""
  echo -e "${YELLOW}Please run the architect agent manually:${NC}"
  echo ""
  echo "Read these files first:"
  echo "  $REFERENCE/packages/$PKG/src/"
  echo "  $KNOWLEDGE_DIR/bundlenudge-knowledge.md"
  echo ""
  echo "Then create: $PKG_DIR/spec.md"
  echo ""
  echo "Re-run this script when spec.md is ready."
  exit 0
else
  echo -e "${GREEN}✓ spec.md exists${NC}"
fi
echo ""

# ==========================================
# Phase 2: Planner
# ==========================================
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo -e "${BLUE}Phase 2: PLANNER${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}"

TASK_COUNT=$(ls -1 "$TASKS_DIR"/*.md 2>/dev/null | wc -l | tr -d ' ')
if [ "$TASK_COUNT" -eq 0 ]; then
  echo "The planner agent will break down spec.md into tasks."
  echo ""
  echo -e "${YELLOW}Please create task files in:${NC} $TASKS_DIR/"
  echo "Format: 01-task-name.md, 02-task-name.md, etc."
  echo ""
  echo "Re-run this script when tasks are ready."
  exit 0
else
  echo -e "${GREEN}✓ $TASK_COUNT tasks exist${NC}"
fi
echo ""

# ==========================================
# Phase 3: Execute (with Critical Gates)
# ==========================================
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo -e "${BLUE}Phase 3: EXECUTE (with Confidence Gates)${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}"

# Critical gate checks based on package
case "$PKG" in
  "sdk")
    # SDK has the most critical features
    if ls "$PKG_DIR/src"/*rollback* 2>/dev/null; then
      check_gate "rollback"
    fi
    if ls "$PKG_DIR/src"/*storage* 2>/dev/null; then
      check_gate "storage"
    fi
    if ls "$PKG_DIR/src"/*patcher* 2>/dev/null || ls "$PKG_DIR/src"/*hash* 2>/dev/null; then
      check_gate "integrity"
    fi
    if ls "$PKG_DIR/src"/*updater* 2>/dev/null; then
      check_gate "updater"
    fi
    if ls "$PKG_DIR/src"/*health* 2>/dev/null; then
      check_gate "health"
    fi
    ;;
  "api")
    check_gate "api"
    ;;
  "dashboard")
    check_gate "dashboard"
    ;;
esac

COMPLETED_MARKER="$PKG_DIR/.tasks-completed"

if [ -f "$COMPLETED_MARKER" ]; then
  echo -e "${GREEN}✓ Tasks already completed${NC}"
else
  echo ""
  echo -e "${YELLOW}Execute tasks manually:${NC}"
  echo ""

  for task in $(ls -1 "$TASKS_DIR"/*.md 2>/dev/null | sort); do
    TASK_NAME=$(basename "$task" .md)
    echo "  - $TASK_NAME"
  done

  echo ""
  echo "After each task:"
  echo "  1. Implement the feature"
  echo "  2. Write tests (100% coverage for critical features)"
  echo "  3. Run: pnpm verify $PKG"
  echo "  4. Commit: git commit -m \"build($PKG): \$TASK_NAME\""
  echo ""
  echo "When all tasks complete, run: touch $COMPLETED_MARKER"
  echo "Then re-run this script."
  exit 0
fi
echo ""

# ==========================================
# Phase 4: Final Verification
# ==========================================
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo -e "${BLUE}Phase 4: FINAL VERIFICATION${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}"

echo "Running verification..."
if ! "$PROJECT_ROOT/scripts/verify.sh" "$PKG"; then
  echo -e "${RED}Verification FAILED${NC}"
  echo "Fix issues before continuing."
  exit 1
fi
echo -e "${GREEN}✓ Verification passed${NC}"
echo ""

# ==========================================
# Phase 5: Quality Audit
# ==========================================
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo -e "${BLUE}Phase 5: QUALITY AUDIT${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}"

if [ -f "$PROJECT_ROOT/scripts/quality-audit.sh" ]; then
  echo "Running quality audit..."
  if ! "$PROJECT_ROOT/scripts/quality-audit.sh" "$PKG"; then
    echo -e "${RED}Quality audit FAILED${NC}"
    echo "Fix quality issues before continuing."
    exit 1
  fi
  echo -e "${GREEN}✓ Quality audit passed${NC}"
else
  echo -e "${YELLOW}Quality audit script not found, skipping${NC}"
fi
echo ""

# ==========================================
# Phase 6: Package Complete
# ==========================================
echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║           Package Build Complete!                          ║${NC}"
echo -e "${GREEN}╠════════════════════════════════════════════════════════════╣${NC}"
echo -e "${GREEN}║ Package: @bundlenudge/$PKG${NC}"
echo -e "${GREEN}║ Status: All gates passed, verification complete            ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if this is the last package for E2E gate
if [ "$PKG" = "worker" ]; then
  echo ""
  echo -e "${MAGENTA}All packages complete. Run E2E tests next.${NC}"
  echo "After E2E tests pass: /approve e2e"
fi

# Final commit
git -C "$PROJECT_ROOT" add -A
git -C "$PROJECT_ROOT" commit -m "build($PKG): complete" || true

echo -e "${GREEN}Done!${NC}"
