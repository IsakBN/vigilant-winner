#!/bin/bash
# BundleNudge Hierarchical Interrogation Workflow
#
# This is an INTERACTIVE workflow that asks questions with A/B/C/D options.
# It NEVER assumes - always asks for your input with recommendations.
#
# Usage:
#   pnpm interrogate           # Full interrogation (orchestrator first)
#   pnpm interrogate api       # API domain only
#   pnpm interrogate sdk       # SDK domain only
#   pnpm interrogate api:auth  # API auth sub-investigation
#   pnpm interrogate synthesize # Compile knowledge base

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
WORKFLOWS_DIR="$PROJECT_ROOT/.claude/workflows"
AGENTS_DIR="$WORKFLOWS_DIR/interrogation/agents"
KNOWLEDGE_DIR="$PROJECT_ROOT/.claude/knowledge"
REFERENCE="/Users/isaks_macbook/Desktop/Dev/codepush"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Parse arguments
SCOPE="${1:-all}"
SUB_SCOPE=""
if [[ "$SCOPE" == *":"* ]]; then
  SUB_SCOPE="${SCOPE#*:}"
  SCOPE="${SCOPE%%:*}"
fi

echo ""
echo -e "${BLUE}╔══════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║         BUNDLENUDGE INTERROGATION WORKFLOW (v2)                  ║${NC}"
echo -e "${BLUE}╠══════════════════════════════════════════════════════════════════╣${NC}"
echo -e "${BLUE}║                                                                  ║${NC}"
echo -e "${BLUE}║  This workflow asks questions with A/B/C/D options.              ║${NC}"
echo -e "${BLUE}║  Each question includes pros/cons and a recommendation.          ║${NC}"
echo -e "${BLUE}║  YOU decide - the agent waits for your input.                    ║${NC}"
echo -e "${BLUE}║                                                                  ║${NC}"
echo -e "${BLUE}╠══════════════════════════════════════════════════════════════════╣${NC}"
echo -e "${BLUE}║  Scope: ${GREEN}$SCOPE${NC}$([ -n "$SUB_SCOPE" ] && echo -e " : ${CYAN}$SUB_SCOPE${NC}")${BLUE}                                              ║${NC}"
echo -e "${BLUE}║  Reference: ${GREEN}codepush${BLUE}                                              ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Ensure knowledge directories exist
mkdir -p "$KNOWLEDGE_DIR/decisions"
mkdir -p "$KNOWLEDGE_DIR/domains/api"
mkdir -p "$KNOWLEDGE_DIR/domains/sdk"
mkdir -p "$KNOWLEDGE_DIR/domains/dashboard"
mkdir -p "$KNOWLEDGE_DIR/domains/builder"
mkdir -p "$KNOWLEDGE_DIR/domains/worker"
mkdir -p "$KNOWLEDGE_DIR/domains/shared"
mkdir -p "$KNOWLEDGE_DIR/flows"
mkdir -p "$KNOWLEDGE_DIR/edge-cases"

# ==============================================================================
# AGENT RUNNER FUNCTION
# ==============================================================================

run_agent() {
  local agent_name="$1"
  local agent_file="$2"
  local output_dir="$3"
  local extra_context="$4"

  echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${GREEN}  AGENT: ${CYAN}$agent_name${NC}"
  echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""

  if [[ ! -f "$agent_file" ]]; then
    echo -e "${RED}ERROR: Agent file not found: $agent_file${NC}"
    return 1
  fi

  echo -e "${YELLOW}This agent will ask you questions with A/B/C/D options.${NC}"
  echo -e "${YELLOW}Each option has pros/cons listed. A recommendation is marked with ✅${NC}"
  echo -e "${YELLOW}Press Enter to start...${NC}"
  read

  # Note: In production, this would use claude code command
  # For now, we just display the agent instructions
  echo ""
  echo -e "${CYAN}Agent instructions loaded from: $agent_file${NC}"
  echo ""
  echo "To run this agent interactively, start a new Claude conversation with:"
  echo ""
  echo -e "${YELLOW}━━━━ COPY BELOW ━━━━${NC}"
  cat "$agent_file"
  echo ""
  echo -e "${YELLOW}━━━━ COPY ABOVE ━━━━${NC}"
  echo ""
  echo -e "${GREEN}After answering all questions, save decisions to: $output_dir${NC}"
}

# ==============================================================================
# ORCHESTRATOR (High-Level Architecture)
# ==============================================================================

run_orchestrator() {
  echo -e "${BLUE}╔══════════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${BLUE}║  PHASE 1: ORCHESTRATOR                                           ║${NC}"
  echo -e "${BLUE}║  High-level architecture questions                               ║${NC}"
  echo -e "${BLUE}╚══════════════════════════════════════════════════════════════════╝${NC}"
  echo ""
  echo "The orchestrator asks these high-level questions:"
  echo ""
  echo "  1. What packages are we building? (scope)"
  echo "  2. What deployment target? (Cloudflare Workers vs other)"
  echo "  3. What pricing tiers? (Free/Pro/Team/Enterprise)"
  echo "  4. What database? (D1 vs Postgres vs other)"
  echo "  5. What auth strategy? (JWT + API keys)"
  echo ""

  run_agent "Orchestrator" "$AGENTS_DIR/orchestrator.md" "$KNOWLEDGE_DIR/decisions"
}

# ==============================================================================
# DOMAIN INVESTIGATORS
# ==============================================================================

run_domain() {
  local domain="$1"
  local agent_file="$AGENTS_DIR/domains/${domain}-investigator.md"
  local output_dir="$KNOWLEDGE_DIR/domains/$domain"

  echo -e "${BLUE}╔══════════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${BLUE}║  DOMAIN: ${domain^^}                                               ║${NC}"
  echo -e "${BLUE}╚══════════════════════════════════════════════════════════════════╝${NC}"
  echo ""

  run_agent "${domain^} Investigator" "$agent_file" "$output_dir"

  # For API domain, offer sub-investigations
  if [[ "$domain" == "api" ]]; then
    echo ""
    echo -e "${YELLOW}API domain has sub-investigations available:${NC}"
    echo "  - auth: JWT, API keys, sessions"
    echo "  - routes: Endpoints, responses, errors"
    echo "  - database: Schema, queries, migrations"
    echo "  - middleware: CORS, rate limit, auth"
    echo "  - storage: R2, uploads, downloads"
    echo "  - queue: Priority queues, messages"
    echo ""
    echo "Run: pnpm interrogate api:auth (or api:routes, etc.)"
  fi
}

# ==============================================================================
# SUB-INVESTIGATORS (API Domain)
# ==============================================================================

run_api_sub() {
  local sub="$1"
  local agent_file="$AGENTS_DIR/domains/api/${sub}-investigator.md"
  local output_dir="$KNOWLEDGE_DIR/domains/api"

  echo -e "${BLUE}╔══════════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${BLUE}║  API SUB-INVESTIGATION: ${sub^^}                                   ║${NC}"
  echo -e "${BLUE}╚══════════════════════════════════════════════════════════════════╝${NC}"
  echo ""

  run_agent "API ${sub^} Investigator" "$agent_file" "$output_dir"
}

# ==============================================================================
# SYNTHESIZER
# ==============================================================================

run_synthesizer() {
  echo -e "${BLUE}╔══════════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${BLUE}║  SYNTHESIZER                                                     ║${NC}"
  echo -e "${BLUE}║  Compile all findings into knowledge base                        ║${NC}"
  echo -e "${BLUE}╚══════════════════════════════════════════════════════════════════╝${NC}"
  echo ""
  echo "The synthesizer will:"
  echo "  1. Read all decision files in $KNOWLEDGE_DIR/decisions/"
  echo "  2. Read all domain findings in $KNOWLEDGE_DIR/domains/"
  echo "  3. Compile into $KNOWLEDGE_DIR/bundlenudge-knowledge.md"
  echo ""

  run_agent "Synthesizer" "$AGENTS_DIR/synthesizer.md" "$KNOWLEDGE_DIR"
}

# ==============================================================================
# MAIN EXECUTION
# ==============================================================================

case "$SCOPE" in
  "all")
    echo "Full interrogation workflow:"
    echo ""
    echo "  Phase 1: Orchestrator (high-level architecture)"
    echo "  Phase 2: Domain investigators (api, sdk, dashboard, etc.)"
    echo "  Phase 3: Sub-investigators (api:auth, api:routes, etc.)"
    echo "  Phase 4: Synthesizer (compile knowledge base)"
    echo ""
    echo -e "${YELLOW}Starting with Phase 1: Orchestrator${NC}"
    echo ""
    run_orchestrator
    ;;

  "orchestrator")
    run_orchestrator
    ;;

  "api")
    if [[ -n "$SUB_SCOPE" ]]; then
      run_api_sub "$SUB_SCOPE"
    else
      run_domain "api"
    fi
    ;;

  "sdk")
    run_domain "sdk"
    ;;

  "dashboard")
    run_domain "dashboard"
    ;;

  "builder")
    run_domain "builder"
    ;;

  "worker")
    run_domain "worker"
    ;;

  "shared")
    run_domain "shared"
    ;;

  "synthesize"|"synthesis")
    run_synthesizer
    ;;

  "help"|"--help"|"-h")
    echo "Usage: pnpm interrogate [scope]"
    echo ""
    echo "Scopes:"
    echo "  all          Full interrogation (orchestrator → domains → synthesize)"
    echo "  orchestrator High-level architecture questions"
    echo "  api          API domain investigation"
    echo "  api:auth     API auth sub-investigation"
    echo "  api:routes   API routes sub-investigation"
    echo "  api:database API database sub-investigation"
    echo "  api:middleware API middleware sub-investigation"
    echo "  api:storage  API storage sub-investigation"
    echo "  api:queue    API queue sub-investigation"
    echo "  sdk          SDK domain investigation"
    echo "  dashboard    Dashboard domain investigation"
    echo "  builder      Builder domain investigation"
    echo "  worker       Worker domain investigation"
    echo "  shared       Shared domain investigation"
    echo "  synthesize   Compile knowledge base"
    echo ""
    echo "Examples:"
    echo "  pnpm interrogate           # Start full interrogation"
    echo "  pnpm interrogate api       # Investigate API domain"
    echo "  pnpm interrogate api:auth  # Deep dive into API auth"
    ;;

  *)
    echo -e "${RED}Unknown scope: $SCOPE${NC}"
    echo "Run 'pnpm interrogate help' for usage."
    exit 1
    ;;
esac

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  Investigation scope complete: $SCOPE${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Decisions saved to: $KNOWLEDGE_DIR/decisions/"
echo "Domain findings saved to: $KNOWLEDGE_DIR/domains/"
echo ""
echo "Next steps:"
if [[ "$SCOPE" == "all" || "$SCOPE" == "orchestrator" ]]; then
  echo "  1. Run domain investigators: pnpm interrogate api"
  echo "  2. Run sub-investigators: pnpm interrogate api:auth"
  echo "  3. Synthesize: pnpm interrogate synthesize"
elif [[ "$SCOPE" == "synthesize" ]]; then
  echo "  1. Start building: pnpm build-package shared"
else
  echo "  1. Continue with more domains or synthesize"
  echo "  2. Run: pnpm interrogate synthesize"
fi
