#!/bin/bash
# BundleNudge Quality Audit Script
# Enforces code quality rules beyond standard linting
# Usage: ./scripts/quality-audit.sh [package]

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PKG="${1:-all}"

# Quality limits
MAX_LINES_PER_FILE=250
MAX_LINES_PER_FUNCTION=50

echo ""
echo -e "${BLUE}=== Quality Audit for $PKG ===${NC}"
echo ""

# Determine source directories
if [ "$PKG" = "all" ]; then
  SRC_DIRS="packages/*/src"
else
  SRC_DIRS="packages/$PKG/src"
fi

# Check if directories exist
if ! ls $SRC_DIRS 1>/dev/null 2>&1; then
  echo -e "${YELLOW}No source files found. Skipping audit.${NC}"
  exit 0
fi

ERRORS=0
WARNINGS=0

# Metrics
TOTAL_FILES=0
TOTAL_LINES=0
LARGEST_FILE=""
LARGEST_FILE_LINES=0

# Check 1: File sizes
echo -e "${BLUE}Checking file sizes (max $MAX_LINES_PER_FILE lines)...${NC}"
for f in $(find $SRC_DIRS -name "*.ts" -o -name "*.tsx" 2>/dev/null | grep -v ".test." | grep -v "__tests__"); do
  if [ -f "$f" ]; then
    lines=$(wc -l < "$f" | tr -d ' ')
    TOTAL_FILES=$((TOTAL_FILES + 1))
    TOTAL_LINES=$((TOTAL_LINES + lines))

    if [ "$lines" -gt "$LARGEST_FILE_LINES" ]; then
      LARGEST_FILE="$f"
      LARGEST_FILE_LINES=$lines
    fi

    if [ "$lines" -gt "$MAX_LINES_PER_FILE" ]; then
      echo -e "  ${RED}❌ $f: $lines lines (max $MAX_LINES_PER_FILE)${NC}"
      ERRORS=$((ERRORS + 1))
    elif [ "$lines" -gt 200 ]; then
      echo -e "  ${YELLOW}⚠️  $f: $lines lines (approaching limit)${NC}"
      WARNINGS=$((WARNINGS + 1))
    fi
  fi
done

# Check 2: 'any' types in production code
echo ""
echo -e "${BLUE}Checking for 'any' types...${NC}"
ANY_COUNT=0
for f in $(find $SRC_DIRS -name "*.ts" -o -name "*.tsx" 2>/dev/null | grep -v ".test." | grep -v "__tests__" | grep -v "types.d.ts"); do
  if [ -f "$f" ]; then
    # Match ": any", "as any", "<any>", "any[]", "any," but not "company" or "many"
    matches=$(grep -n ": any\|as any\|<any>\|any\[\]\|any," "$f" 2>/dev/null | grep -v "// allow-any" || true)
    if [ -n "$matches" ]; then
      count=$(echo "$matches" | wc -l | tr -d ' ')
      ANY_COUNT=$((ANY_COUNT + count))
      echo -e "  ${RED}❌ $f: Found 'any' type${NC}"
      echo "$matches" | head -3 | while read line; do
        echo "      $line"
      done
      ERRORS=$((ERRORS + count))
    fi
  fi
done

# Check 3: console.log in production code
echo ""
echo -e "${BLUE}Checking for console.log...${NC}"
CONSOLE_COUNT=0
for f in $(find $SRC_DIRS -name "*.ts" -o -name "*.tsx" 2>/dev/null | grep -v ".test." | grep -v "__tests__" | grep -v "logger.ts"); do
  if [ -f "$f" ]; then
    matches=$(grep -n "console.log\|console.warn\|console.error\|console.info" "$f" 2>/dev/null | grep -v "// allow-console" || true)
    if [ -n "$matches" ]; then
      count=$(echo "$matches" | wc -l | tr -d ' ')
      CONSOLE_COUNT=$((CONSOLE_COUNT + count))
      echo -e "  ${RED}❌ $f: Found console.log${NC}"
      echo "$matches" | head -3 | while read line; do
        echo "      $line"
      done
      ERRORS=$((ERRORS + count))
    fi
  fi
done

# Check 4: Silent catch blocks
echo ""
echo -e "${BLUE}Checking for silent catch blocks...${NC}"
for f in $(find $SRC_DIRS -name "*.ts" -o -name "*.tsx" 2>/dev/null | grep -v ".test." | grep -v "__tests__"); do
  if [ -f "$f" ]; then
    # Match "catch {}" or "catch (e) {}" with empty body
    if grep -Pzo "catch\s*\([^)]*\)\s*\{\s*\}" "$f" 2>/dev/null | grep -q .; then
      echo -e "  ${RED}❌ $f: Found silent catch block${NC}"
      ERRORS=$((ERRORS + 1))
    fi
    # Also check .catch(() => {})
    if grep -n "\.catch\s*(\s*(\s*)\s*=>\s*{\s*})" "$f" 2>/dev/null | grep -q .; then
      echo -e "  ${RED}❌ $f: Found silent .catch()${NC}"
      ERRORS=$((ERRORS + 1))
    fi
  fi
done

# Check 5: Default exports
echo ""
echo -e "${BLUE}Checking for default exports...${NC}"
for f in $(find $SRC_DIRS -name "*.ts" -o -name "*.tsx" 2>/dev/null | grep -v ".test." | grep -v "__tests__"); do
  if [ -f "$f" ]; then
    if grep -n "^export default" "$f" 2>/dev/null | grep -q .; then
      echo -e "  ${RED}❌ $f: Uses default export${NC}"
      ERRORS=$((ERRORS + 1))
    fi
  fi
done

# Check 6: @ts-ignore and @ts-nocheck
echo ""
echo -e "${BLUE}Checking for TypeScript escape hatches...${NC}"
for f in $(find $SRC_DIRS -name "*.ts" -o -name "*.tsx" 2>/dev/null); do
  if [ -f "$f" ]; then
    matches=$(grep -n "@ts-ignore\|@ts-nocheck\|@ts-expect-error" "$f" 2>/dev/null || true)
    if [ -n "$matches" ]; then
      echo -e "  ${RED}❌ $f: Uses TypeScript escape hatch${NC}"
      echo "$matches" | while read line; do
        echo "      $line"
      done
      ERRORS=$((ERRORS + 1))
    fi
  fi
done

# Summary
echo ""
echo -e "${BLUE}=== Audit Summary ===${NC}"
echo "  Files scanned: $TOTAL_FILES"
echo "  Total lines: $TOTAL_LINES"
if [ -n "$LARGEST_FILE" ]; then
  echo "  Largest file: $LARGEST_FILE_LINES lines ($LARGEST_FILE)"
fi
echo "  'any' types found: $ANY_COUNT"
echo "  console.log found: $CONSOLE_COUNT"
echo ""

if [ $ERRORS -gt 0 ]; then
  echo -e "${RED}❌ FAILED: $ERRORS errors, $WARNINGS warnings${NC}"
  exit 5
elif [ $WARNINGS -gt 0 ]; then
  echo -e "${YELLOW}⚠️  PASSED with $WARNINGS warnings${NC}"
  exit 0
else
  echo -e "${GREEN}✅ PASSED${NC}"
  exit 0
fi
