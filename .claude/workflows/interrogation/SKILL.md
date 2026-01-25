---
name: interrogation
description: Deep investigation workflow with hierarchical agent spawning. Asks multi-choice questions with recommendations before making any assumptions. Use this to deeply understand the codepush reference implementation before building BundleNudge.
allowed-tools: Read, Grep, Glob, Task, AskUserQuestion
---

# Interrogation Workflow

## Purpose

Before writing ANY code, we deeply investigate the reference implementation (codepush) to understand every architectural decision. The interrogation:

1. **ASKS questions** - Never assumes, always asks with options
2. **Gives recommendations** - Each question has A/B/C/D options with pros/cons
3. **Spawns sub-agents** - Hierarchical investigation per domain
4. **Produces structured output** - Tables, not essays

## The Hierarchy

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                      │
│  INTERROGATION ORCHESTRATOR (You)                                   │
│  ─────────────────────────────                                      │
│  Coordinates all investigation. Asks high-level architecture        │
│  questions. Spawns domain investigators.                            │
│                                                                      │
│                         ↓                                           │
│                                                                      │
│  DOMAIN INVESTIGATORS (Parallel Agents)                             │
│  ───────────────────────────────────                                │
│  One per major domain. Each investigates deeply and asks            │
│  domain-specific questions.                                         │
│                                                                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │   API    │ │   SDK    │ │Dashboard │ │ Builder  │ │  Worker  │  │
│  │Investigator│ │Investigator│ │Investigator│ │Investigator│ │Investigator│  │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘  │
│       │            │            │            │            │         │
│       ↓            ↓            ↓            ↓            ↓         │
│                                                                      │
│  SUB-INVESTIGATORS (Per Domain)                                     │
│  ─────────────────────────────                                      │
│                                                                      │
│  API Domain:           SDK Domain:       Dashboard Domain:          │
│  ├── Auth              ├── Updater       ├── Components             │
│  ├── Routes            ├── Storage       ├── API Client             │
│  ├── Middleware        ├── Rollback      ├── State Management       │
│  ├── Database          ├── Health        └── Auth Flow              │
│  ├── Storage (R2)      └── Native Bridge                           │
│  └── Queues                                                         │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## Question Format (CRITICAL)

Every decision point uses this format:

```markdown
## Question: [Topic]

**Context**: [Why this matters]

| Option | Description | Pros | Cons |
|--------|-------------|------|------|
| A) [Choice] | [What it means] | [Benefits] | [Drawbacks] |
| B) [Choice] | [What it means] | [Benefits] | [Drawbacks] |
| C) [Choice] | [What it means] | [Benefits] | [Drawbacks] |
| D) Other | [Custom input] | [Depends] | [Depends] |

**Reference Choice**: [What codepush uses]
**Recommendation**: A) [Choice] ✅
**Rationale**: [Why this is recommended]

**Your choice?** [Wait for user input]
```

## Output Structure

All interrogation produces structured files in `.claude/knowledge/`:

```
.claude/knowledge/
├── decisions/
│   ├── 01-runtime.md           # Cloudflare Workers decision
│   ├── 02-database.md          # D1 decision
│   ├── 03-storage.md           # R2 decision
│   ├── 04-queue.md             # Priority queues decision
│   └── ...
├── domains/
│   ├── api/
│   │   ├── overview.md
│   │   ├── auth.md
│   │   ├── routes.md
│   │   ├── middleware.md
│   │   └── database.md
│   ├── sdk/
│   │   ├── overview.md
│   │   ├── updater.md
│   │   └── storage.md
│   └── dashboard/
│       └── ...
├── flows/
│   ├── update-check.md
│   ├── bundle-upload.md
│   └── rollback.md
├── edge-cases/
│   ├── network.md
│   ├── concurrency.md
│   └── data-integrity.md
└── bundlenudge-knowledge.md    # Final synthesized knowledge base
```

## Phase Breakdown

### Phase 1: Scope & High-Level Architecture (Orchestrator)

The orchestrator asks:
1. What packages are we building? (scope)
2. What's the deployment model? (Cloudflare vs other)
3. What tier system do we need? (pricing)
4. What's MVP vs full feature set?

### Phase 2: Domain Investigation (Parallel Agents)

Each domain investigator:
1. Reads all files in that domain from codepush
2. Identifies key patterns and decisions
3. Asks domain-specific questions
4. Spawns sub-investigators for complex areas

### Phase 3: Cross-Cutting Concerns

After domains, investigate:
1. Authentication flows (API + SDK + Dashboard)
2. Error handling patterns
3. Rate limiting strategy
4. Monitoring and analytics

### Phase 4: Synthesis

Compile all findings into the final knowledge base.

## Running the Workflow

```bash
# Full interrogation (recommended first time)
pnpm interrogate

# Specific domain only
pnpm interrogate api
pnpm interrogate sdk

# Resume from checkpoint
pnpm interrogate --resume
```

## Key Principles

### 1. Never Assume - Always Ask
If there's a decision to make, present options and ask.

### 2. Show Your Work
Every recommendation includes evidence from the reference codebase.

### 3. Tables Over Essays
Use structured tables for decisions, not paragraphs of prose.

### 4. Fresh Context Per Agent
Each sub-investigator runs in a fresh context to avoid pollution.

### 5. Checkpoint Progress
Save findings incrementally so we can resume.

## Files

### Orchestrator
- `agents/orchestrator.md` - Main coordination agent

### Domain Investigators
- `agents/domains/api-investigator.md`
- `agents/domains/sdk-investigator.md`
- `agents/domains/dashboard-investigator.md`
- `agents/domains/builder-investigator.md`
- `agents/domains/worker-investigator.md`

### Sub-Investigators (API Domain Example)
- `agents/domains/api/auth-investigator.md`
- `agents/domains/api/routes-investigator.md`
- `agents/domains/api/middleware-investigator.md`
- `agents/domains/api/database-investigator.md`
- `agents/domains/api/storage-investigator.md`
- `agents/domains/api/queue-investigator.md`

### Synthesizer
- `agents/synthesizer.md` - Compiles final knowledge base
