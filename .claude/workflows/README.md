# BundleNudge Workflows

Two-phase approach for rebuilding BundleNudge from codepush reference.

## Philosophy

1. **Interrogation First** - Deep understanding before any code
2. **Fresh Context Per Task** - Bash loops, not Ralph loops
3. **Hierarchical Planning** - Architect → Planner → Sub-planners → Builders
4. **Continuous Verification** - PM verifies while builders work

## Workflows

### 1. Interrogation Workflow (`/interrogate`)

**Purpose**: Build complete understanding of codepush before writing code.

**Duration**: ~1 hour of agent questioning

**Process**:
```
Phase 0: SCOPE DEFINITION
         │
         ├── What are we interrogating? (api? sdk? all?)
         └── Output: interrogation-scope.md

Phase 1: ARCHITECTURE INTERROGATION
         │
         ├── Agent reads all codepush architecture
         ├── Asks questions about every decision
         └── Output: architecture-qa.md

Phase 2: DATA MODEL INTERROGATION
         │
         ├── Every D1 table, every relationship
         ├── Every R2 path, every KV key
         └── Output: data-model-qa.md

Phase 3: FLOW INTERROGATION
         │
         ├── Update check flow
         ├── Upload processing flow
         ├── Crash monitoring flow
         ├── A/B testing flow
         └── Output: flows-qa.md

Phase 4: EDGE CASES INTERROGATION
         │
         ├── What happens when X fails?
         ├── How does Y handle Z?
         └── Output: edge-cases-qa.md

Phase 5: SYNTHESIS
         │
         ├── Compile all Q&A into knowledge base
         └── Output: .claude/knowledge/bundlenudge-knowledge.md
```

### 2. Package Build Workflow (`/build-package <package>`)

**Purpose**: Build one package with full orchestration.

**Process**:
```
Phase 1: ARCHITECT
         │
         ├── Read knowledge base
         ├── Read codepush reference for this package
         ├── Design package structure
         └── Output: packages/<pkg>/spec.md

Phase 2: PLANNER
         │
         ├── Break spec into domains
         ├── For each domain, spawn Sub-Planner
         │   └── Sub-Planner creates detailed task list
         └── Output: packages/<pkg>/tasks/*.md

Phase 3: EXECUTE (Bash Loop)
         │
         ├── For each task file:
         │   ├── Fresh Claude instance
         │   ├── Load only relevant context
         │   ├── Implement + test
         │   └── Verify before next task
         │
         └── PM Agent verifies completed tasks in parallel

Phase 4: REVIEW
         │
         ├── Reviewer Agent audits all code
         ├── Planner Agent checks against spec
         └── Output: review-report.md

Phase 5: INTEGRATE
         │
         ├── Run full package verification
         ├── Fix any issues
         └── Output: integration-report.md

Phase 6: FINAL AUDIT
         │
         ├── Architect confirms vision match
         ├── Compare against codepush reference
         └── Output: SHIP or REVISE decision
```

## Bash Loop Advantage

Instead of Ralph loops (same context accumulating), we use bash loops:

```bash
#!/bin/bash
# Each task gets FRESH context

for task in packages/api/tasks/*.md; do
  echo "=== Executing: $task ==="

  # Fresh Claude instance with only relevant context
  claude --prompt "$(cat prompts/executor.md)" \
         --context "$(cat .claude/knowledge/bundlenudge-knowledge.md)" \
         --context "$(cat packages/api/spec.md)" \
         --context "$(cat $task)" \
         --max-turns 50

  # Verify before continuing
  ./scripts/verify.sh api
  if [ $? -ne 0 ]; then
    echo "FAILED: $task"
    exit 1
  fi
done
```

## Directory Structure

```
.claude/workflows/
├── README.md                    # This file
├── interrogation/
│   ├── workflow.md              # Interrogation process
│   └── agents/
│       ├── scope-definer.md
│       ├── architecture-interrogator.md
│       ├── data-model-interrogator.md
│       ├── flow-interrogator.md
│       ├── edge-case-interrogator.md
│       └── synthesizer.md
├── package-build/
│   ├── workflow.md              # Build process
│   └── agents/
│       ├── architect.md
│       ├── planner.md
│       ├── sub-planner.md
│       ├── executor.md
│       ├── pm-verifier.md
│       ├── reviewer.md
│       ├── integrator.md
│       └── final-auditor.md
└── runner/
    ├── interrogate.sh           # Run interrogation
    └── build-package.sh         # Run package build
```

## Usage

```bash
# Step 1: Deep interrogation (do this FIRST)
./claude/workflows/runner/interrogate.sh all

# Step 2: Build packages in order
./claude/workflows/runner/build-package.sh shared
./claude/workflows/runner/build-package.sh api
./claude/workflows/runner/build-package.sh sdk
./claude/workflows/runner/build-package.sh dashboard
./claude/workflows/runner/build-package.sh builder
./claude/workflows/runner/build-package.sh worker
```

## Key Principles

1. **No code without understanding** - Interrogation creates knowledge base
2. **Fresh context is power** - Each task gets full 200k tokens
3. **Hierarchical decomposition** - Big → Medium → Small tasks
4. **Continuous verification** - Never proceed with broken code
5. **Reference fidelity** - Always compare against codepush
