# Package Build Workflow

## Purpose

Build one package at a time with full orchestration, fresh context per task, and continuous verification.

## Prerequisites

Before running this workflow:
1. Interrogation phase complete (`.claude/knowledge/bundlenudge-knowledge.md` exists)
2. Previous dependency packages built (e.g., shared before api)
3. Git working tree clean

## Workflow Phases

```
/build-package <package>
│
Phase 1: ARCHITECT (~5 min)
│   ├── Agent: architect.md
│   ├── Reads: knowledge base, reference package
│   ├── Produces: packages/<pkg>/spec.md
│   └── Approval: Auto (spec written)
│
Phase 2: PLANNER (~10 min)
│   ├── Agent: planner.md
│   ├── Reads: spec.md
│   ├── Breaks into domains
│   │
│   └── For each domain, spawns SUB-PLANNER:
│       ├── Agent: sub-planner.md
│       └── Produces: packages/<pkg>/tasks/<domain>-*.md
│
Phase 3: EXECUTE (Bash Loop, variable time)
│   ├── For each task file in packages/<pkg>/tasks/:
│   │   ├── Fresh Claude instance
│   │   ├── Agent: executor.md
│   │   ├── Context: knowledge base + spec + task only
│   │   ├── Implements code + tests
│   │   └── Runs: ./scripts/verify.sh <pkg>
│   │
│   └── In parallel: PM-VERIFIER
│       ├── Agent: pm-verifier.md
│       └── Verifies completed tasks match spec
│
Phase 4: REVIEW (~10 min)
│   ├── Agent: reviewer.md
│   ├── Audits all code for:
│   │   ├── Security issues
│   │   ├── Pattern consistency
│   │   ├── Edge case handling
│   │   └── Quality violations
│   └── Produces: packages/<pkg>/review-report.md
│
Phase 5: INTEGRATE (~5 min)
│   ├── Agent: integrator.md
│   ├── Runs full package verification
│   ├── Fixes any integration issues
│   └── Produces: packages/<pkg>/integration-report.md
│
Phase 6: FINAL AUDIT (~5 min)
│   ├── Agent: final-auditor.md
│   ├── Compares against reference package
│   ├── Confirms vision match
│   └── Decision: SHIP or REVISE
```

## Phase Details

### Phase 1: Architect

**Purpose**: Create detailed specification before any code.

**Input**:
- `.claude/knowledge/bundlenudge-knowledge.md`
- Reference: `/Users/isaks_macbook/Desktop/Dev/codepush/packages/<pkg>`

**Output**: `packages/<pkg>/spec.md`

**Spec Structure**:
```markdown
# <Package> Specification

## Purpose
[One paragraph]

## Exports
| Export | Type | Description |
|--------|------|-------------|
| ... | ... | ... |

## Dependencies
[List]

## File Structure
[Directory tree]

## Key Patterns
[Code examples]

## Test Strategy
[Approach]
```

### Phase 2: Planner

**Purpose**: Break spec into executable tasks with dependency ordering.

**Input**: `packages/<pkg>/spec.md`

**Output**: `packages/<pkg>/tasks/*.md`

**Task File Structure**:
```markdown
# Task: <name>

## Objective
[One sentence]

## Files to Create
- path/to/file.ts
- path/to/file.test.ts

## Dependencies
- [Previous task or "None"]

## Reference
/Users/isaks_macbook/Desktop/Dev/codepush/packages/<pkg>/src/...

## Implementation Notes
[Key points]

## Verification
- [ ] File under 250 lines
- [ ] Tests pass
- [ ] Types check
```

**Task Ordering**:
Tasks are numbered: `001-setup.md`, `002-types.md`, `003-schema.md`, etc.
Bash loop processes in order.

### Phase 3: Execute (Bash Loop)

**Purpose**: Implement each task with fresh context.

**Key Principle**: Each task gets a NEW Claude instance with ONLY:
1. Knowledge base (~5000 tokens)
2. Package spec (~2000 tokens)
3. Current task (~500 tokens)
4. **NOT** previous task outputs (clean slate)

**Loop Script**:
```bash
for task in packages/$PKG/tasks/*.md; do
  # Fresh Claude with minimal context
  claude code \
    --context ".claude/knowledge/bundlenudge-knowledge.md" \
    --context "packages/$PKG/spec.md" \
    --prompt "$(cat $task)"

  # Verify before continuing
  ./scripts/verify.sh $PKG || exit 1

  # Commit
  git add -A && git commit -m "build($PKG): $(basename $task .md)"
done
```

### Phase 4: Review

**Purpose**: Audit all code after implementation.

**Checks**:
1. Security (auth, input validation, injection)
2. Pattern consistency (matches reference)
3. Edge case handling (from edge-cases-qa.md)
4. Quality (250 LOC, no any, etc.)

**Output**: `packages/<pkg>/review-report.md`

### Phase 5: Integrate

**Purpose**: Ensure package works as a whole.

**Steps**:
1. Run full verification: `./scripts/verify.sh <pkg>`
2. Run integration tests if any
3. Fix any cross-file issues
4. Update package exports

### Phase 6: Final Audit

**Purpose**: Confirm package matches reference and vision.

**Checks**:
1. All exports match spec
2. All routes/methods match reference
3. Code quality metrics pass
4. No missing functionality

**Decision**:
- **SHIP**: Package complete, move to next
- **REVISE**: Issues found, create fix tasks

## File Outputs Per Package

After workflow completes:
```
packages/<pkg>/
├── spec.md                 # Phase 1 output
├── tasks/                  # Phase 2 output
│   ├── 001-setup.md
│   ├── 002-types.md
│   └── ...
├── review-report.md        # Phase 4 output
├── integration-report.md   # Phase 5 output
├── src/                    # Phase 3 output (code)
├── package.json
├── tsconfig.json
├── CLAUDE.md
├── plan.md
├── checkin.md
└── llms.txt
```

## Build Order

Must build in dependency order:
1. `shared` (no deps)
2. `api` (depends on shared)
3. `sdk` (depends on shared)
4. `dashboard` (depends on shared, api types)
5. `builder` (depends on shared)
6. `worker` (depends on shared)

## Commands

```bash
# Build one package
./claude/workflows/runner/build-package.sh api

# Build all in order
./claude/workflows/runner/build-package.sh shared
./claude/workflows/runner/build-package.sh api
./claude/workflows/runner/build-package.sh sdk
./claude/workflows/runner/build-package.sh dashboard
./claude/workflows/runner/build-package.sh builder
./claude/workflows/runner/build-package.sh worker
```

## Failure Handling

If any phase fails:
1. Log error to `packages/<pkg>/errors/`
2. Create checkpoint
3. Pause for human review
4. Can resume from last successful phase

## Success Criteria

Package is complete when:
- [ ] All tasks executed successfully
- [ ] All tests pass
- [ ] TypeScript compiles
- [ ] Lint passes
- [ ] Build succeeds
- [ ] Quality audit passes
- [ ] Review report shows no blockers
- [ ] Final audit says SHIP
