#!/bin/bash
# Pre-flight checks before running build workflow
#
# This script verifies that all prerequisites are met:
# 1. Interrogation is complete
# 2. Knowledge base exists and is valid
# 3. Reference repo is accessible
# 4. Required tools are available

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
KNOWLEDGE_DIR="$PROJECT_ROOT/.claude/knowledge"
REFERENCE="/Users/isaks_macbook/Desktop/Dev/codepush"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo ""
echo -e "${BLUE}╔══════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║              PRE-FLIGHT CHECK FOR BUILD WORKFLOW                 ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════════╝${NC}"
echo ""

ERRORS=0
WARNINGS=0

# ==============================================================================
# CHECK 1: Reference Repository
# ==============================================================================

echo -e "${YELLOW}[1/6] Checking reference repository...${NC}"

if [ ! -d "$REFERENCE" ]; then
  echo -e "${RED}  ✗ FAIL: Reference repo not found at $REFERENCE${NC}"
  ERRORS=$((ERRORS + 1))
elif [ ! -f "$REFERENCE/package.json" ]; then
  echo -e "${RED}  ✗ FAIL: Reference repo missing package.json${NC}"
  ERRORS=$((ERRORS + 1))
else
  PACKAGES=$(ls -d "$REFERENCE/packages/"*/ 2>/dev/null | wc -l | tr -d ' ')
  echo -e "${GREEN}  ✓ Reference repo found with $PACKAGES packages${NC}"
fi

# ==============================================================================
# CHECK 2: Knowledge Base Exists
# ==============================================================================

echo -e "${YELLOW}[2/6] Checking knowledge base...${NC}"

KB_FILE="$KNOWLEDGE_DIR/bundlenudge-knowledge.md"
if [ ! -f "$KB_FILE" ]; then
  echo -e "${RED}  ✗ FAIL: Knowledge base not found at $KB_FILE${NC}"
  echo -e "${RED}         Run 'pnpm interrogate' first to complete interrogation${NC}"
  ERRORS=$((ERRORS + 1))
else
  KB_SIZE=$(wc -l < "$KB_FILE" | tr -d ' ')
  if [ "$KB_SIZE" -lt 100 ]; then
    echo -e "${YELLOW}  ⚠ WARNING: Knowledge base is only $KB_SIZE lines (expected 200+)${NC}"
    WARNINGS=$((WARNINGS + 1))
  else
    echo -e "${GREEN}  ✓ Knowledge base found ($KB_SIZE lines)${NC}"
  fi
fi

# ==============================================================================
# CHECK 3: Decision Files
# ==============================================================================

echo -e "${YELLOW}[3/6] Checking decision files...${NC}"

DECISIONS_DIR="$KNOWLEDGE_DIR/decisions"
if [ ! -d "$DECISIONS_DIR" ]; then
  echo -e "${RED}  ✗ FAIL: Decisions directory not found${NC}"
  ERRORS=$((ERRORS + 1))
else
  DECISION_COUNT=$(ls -1 "$DECISIONS_DIR"/*.md 2>/dev/null | wc -l | tr -d ' ')
  if [ "$DECISION_COUNT" -lt 5 ]; then
    echo -e "${YELLOW}  ⚠ WARNING: Only $DECISION_COUNT decision files (expected 5+)${NC}"
    echo -e "${YELLOW}             Run 'pnpm interrogate' to complete high-level decisions${NC}"
    WARNINGS=$((WARNINGS + 1))
  else
    echo -e "${GREEN}  ✓ Found $DECISION_COUNT decision files${NC}"
  fi
fi

# ==============================================================================
# CHECK 4: Domain Investigations
# ==============================================================================

echo -e "${YELLOW}[4/6] Checking domain investigations...${NC}"

DOMAINS=("api" "sdk" "dashboard" "builder" "worker" "shared")
DOMAIN_COUNT=0
MISSING_DOMAINS=()

for domain in "${DOMAINS[@]}"; do
  DOMAIN_DIR="$KNOWLEDGE_DIR/domains/$domain"
  if [ -d "$DOMAIN_DIR" ] && [ "$(ls -A "$DOMAIN_DIR" 2>/dev/null)" ]; then
    DOMAIN_COUNT=$((DOMAIN_COUNT + 1))
  else
    MISSING_DOMAINS+=("$domain")
  fi
done

if [ ${#MISSING_DOMAINS[@]} -gt 0 ]; then
  echo -e "${YELLOW}  ⚠ WARNING: Missing domain investigations: ${MISSING_DOMAINS[*]}${NC}"
  echo -e "${YELLOW}             Run 'pnpm interrogate <domain>' for each${NC}"
  WARNINGS=$((WARNINGS + 1))
else
  echo -e "${GREEN}  ✓ All $DOMAIN_COUNT domains investigated${NC}"
fi

# ==============================================================================
# CHECK 5: Required Tools
# ==============================================================================

echo -e "${YELLOW}[5/6] Checking required tools...${NC}"

# Check pnpm
if ! command -v pnpm &> /dev/null; then
  echo -e "${RED}  ✗ FAIL: pnpm not found${NC}"
  ERRORS=$((ERRORS + 1))
else
  PNPM_VERSION=$(pnpm --version)
  echo -e "${GREEN}  ✓ pnpm $PNPM_VERSION${NC}"
fi

# Check node
if ! command -v node &> /dev/null; then
  echo -e "${RED}  ✗ FAIL: node not found${NC}"
  ERRORS=$((ERRORS + 1))
else
  NODE_VERSION=$(node --version)
  echo -e "${GREEN}  ✓ node $NODE_VERSION${NC}"
fi

# Check git
if ! command -v git &> /dev/null; then
  echo -e "${RED}  ✗ FAIL: git not found${NC}"
  ERRORS=$((ERRORS + 1))
else
  GIT_VERSION=$(git --version | cut -d' ' -f3)
  echo -e "${GREEN}  ✓ git $GIT_VERSION${NC}"
fi

# ==============================================================================
# CHECK 6: Git State
# ==============================================================================

echo -e "${YELLOW}[6/6] Checking git state...${NC}"

if [ -n "$(git status --porcelain 2>/dev/null)" ]; then
  echo -e "${YELLOW}  ⚠ WARNING: Uncommitted changes in working directory${NC}"
  echo -e "${YELLOW}             Consider committing before build${NC}"
  WARNINGS=$((WARNINGS + 1))
else
  echo -e "${GREEN}  ✓ Git working directory clean${NC}"
fi

# ==============================================================================
# SUMMARY
# ==============================================================================

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if [ $ERRORS -gt 0 ]; then
  echo -e "${RED}PRE-FLIGHT FAILED: $ERRORS error(s), $WARNINGS warning(s)${NC}"
  echo ""
  echo "Fix the errors above before running the build workflow."
  echo ""
  echo "Common fixes:"
  echo "  1. Run 'pnpm interrogate' to complete interrogation"
  echo "  2. Ensure reference repo exists at $REFERENCE"
  echo "  3. Install missing tools (pnpm, node, git)"
  exit 1
elif [ $WARNINGS -gt 0 ]; then
  echo -e "${YELLOW}PRE-FLIGHT PASSED WITH WARNINGS: $WARNINGS warning(s)${NC}"
  echo ""
  echo "You can proceed, but consider addressing the warnings first."
  echo ""
  echo -e "${YELLOW}Continue anyway? [y/N]${NC}"
  read -r response
  if [[ ! "$response" =~ ^[Yy]$ ]]; then
    exit 1
  fi
else
  echo -e "${GREEN}PRE-FLIGHT PASSED: All checks passed!${NC}"
  echo ""
  echo "Ready to run build workflow."
fi

echo ""
