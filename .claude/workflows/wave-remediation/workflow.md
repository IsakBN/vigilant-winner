# Wave-Based Remediation Workflow

## Purpose

Hierarchical agent orchestration for fixing, completing, and auditing existing code. Used when we have partially built features that need to be brought to production quality.

## Agent Hierarchy

```
                        ┌─────────────────┐
                        │      USER       │
                        │   (Approver)    │
                        └────────┬────────┘
                                 │
                                 ▼
                  ┌──────────────────────────────┐
                  │         LAUNCH PM            │
                  │      (Main Claude)           │
                  │  • Owns master plan          │
                  │  • Coordinates waves         │
                  │  • Makes go/no-go calls      │
                  └──────────────┬───────────────┘
                                 │
        ┌────────────────────────┼────────────────────────┐
        │                        │                        │
        ▼                        ▼                        ▼
┌───────────────┐      ┌───────────────┐      ┌───────────────┐
│    WAVE 1     │      │    WAVE 2     │      │    WAVE N     │
│  COORDINATOR  │      │  COORDINATOR  │      │  COORDINATOR  │
└───────┬───────┘      └───────────────┘      └───────────────┘
        │
        │ Spawns parallel executors
        │
┌───────┴───────┬───────────────┬───────────────┐
│               │               │               │
▼               ▼               ▼               ▼
┌─────────┐ ┌─────────┐ ┌─────────┐      ┌─────────┐
│Executor │ │Executor │ │Executor │ ...  │Executor │
│  Task 1 │ │  Task 2 │ │  Task 3 │      │  Task N │
└─────────┘ └─────────┘ └─────────┘      └─────────┘
        │               │               │
        └───────────────┴───────┬───────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
        ▼                       ▼                       ▼
┌──────────────┐     ┌────────────────┐     ┌──────────────────┐
│   Security   │     │  Performance   │     │   Integration    │
│   Auditor    │     │    Auditor     │     │     Auditor      │
└──────────────┘     └────────────────┘     └──────────────────┘
        │                       │                       │
        └───────────────────────┴───────────┬───────────┘
                                            │
                                            ▼
                                   ┌─────────────────┐
                                   │    GO/NO-GO     │
                                   │    Decision     │
                                   └────────┬────────┘
                                            │
                            ┌───────────────┴───────────────┐
                            │                               │
                            ▼                               ▼
                    ┌──────────────┐               ┌──────────────┐
                    │     PASS     │               │     FAIL     │
                    │  Next Wave   │               │  Fix Issues  │
                    └──────────────┘               └──────────────┘
```

## Workflow Phases

### Phase 1: Wave Planning (Launch PM)

**Agent**: Main Claude session (YOU)

**Tasks**:
1. Analyze current state vs target state
2. Group fixes into logical waves
3. Define acceptance criteria per wave
4. Create wave-N plan document

**Output**: `wave-{N}-plan.md`

### Phase 2: Wave Coordination

**Agent**: `wave-coordinator`

**Prompt Template**:
```
You are Wave {N} Coordinator. Your job is to:
1. Read the wave plan
2. Spawn executor agents in parallel for each task
3. Monitor their progress
4. Report back when all executors complete

Tasks for this wave:
{task_list}

For each task, spawn an executor with:
- Clear task description
- Relevant file context
- Acceptance criteria
- Required tests

Do NOT implement yourself - only coordinate executors.
```

### Phase 3: Execution (Parallel)

**Agent**: `executor` (multiple instances)

**Prompt Template**:
```
You are Executor for task: {task_name}

Your ONLY job is to implement this specific task:
{task_description}

Files to modify/create:
{file_list}

Acceptance criteria:
{criteria}

After implementing:
1. Run `pnpm test` in relevant package
2. Run `pnpm typecheck`
3. Add @agent attribution

Report: SUCCESS/FAILURE with summary
```

### Phase 4: Audit (Parallel)

**Agents**: `security-auditor`, `performance-auditor`, `integration-auditor`

#### Security Auditor
```
You are Security Auditor for Wave {N}.

Review ALL changes made in this wave for:
- Input validation (Zod schemas used?)
- Authentication (middleware applied?)
- Authorization (ownership checks?)
- Injection risks (parameterized queries?)
- Token handling (encrypted at rest?)
- Rate limiting (applied to public endpoints?)

Files changed:
{file_list}

Output:
- CRITICAL: Must fix before proceeding
- HIGH: Should fix before ship
- MEDIUM: Fix in next wave
- LOW: Nice to have
```

#### Performance Auditor
```
You are Performance Auditor for Wave {N}.

Review ALL changes for:
- N+1 query patterns
- Missing indexes
- Unbounded queries (need pagination?)
- Large response payloads
- Blocking operations
- Memory leaks

Files changed:
{file_list}

Output: Issues by severity
```

#### Integration Auditor
```
You are Integration Auditor for Wave {N}.

Verify ALL changes work together:
1. Run full test suite
2. Check for import/export issues
3. Verify API contracts match
4. Check for circular dependencies
5. Verify shared types are used

Output: Integration report
```

### Phase 5: GO/NO-GO Decision

**Agent**: Main Claude (Launch PM)

**Criteria for GO**:
- [ ] All executors reported SUCCESS
- [ ] Security Auditor: No CRITICAL issues
- [ ] Performance Auditor: No CRITICAL issues
- [ ] Integration Auditor: All tests pass
- [ ] Code coverage maintained or improved

**Actions**:
- **GO**: Commit changes, proceed to next wave
- **NO-GO**: Create remediation tasks, re-run wave

## Wave Categories

### Security Waves
Focus: Vulnerabilities, auth issues, encryption
Auditors: Security (primary), Integration

### Functionality Waves
Focus: Missing features, broken logic
Auditors: Integration (primary), Performance

### Quality Waves
Focus: Tests, schemas, constants
Auditors: Integration (primary)

### Completion Waves
Focus: Missing routes, features
Auditors: All three

## File Structure

```
.claude/workflows/wave-remediation/
├── workflow.md                 # This file
├── agents/
│   ├── wave-coordinator.md     # Coordinator prompt
│   ├── executor.md             # Executor prompt
│   ├── security-auditor.md     # Security audit prompt
│   ├── performance-auditor.md  # Performance audit prompt
│   └── integration-auditor.md  # Integration audit prompt
├── templates/
│   ├── wave-plan.md            # Wave plan template
│   ├── executor-task.md        # Task template
│   └── audit-report.md         # Audit report template
└── outputs/
    ├── wave-1-plan.md
    ├── wave-1-audit.md
    ├── wave-2-plan.md
    └── ...
```

## Usage

### From Launch PM (Main Claude):

```
1. Create wave plan:
   "Create wave-4-plan.md with tasks for channel system and admin routes"

2. Spawn Wave Coordinator:
   Task tool → wave-coordinator with wave plan

3. Coordinator spawns Executors (parallel)

4. Coordinator reports completion

5. Launch PM spawns Auditors (parallel)

6. Auditors report findings

7. Launch PM makes GO/NO-GO decision

8. Repeat for next wave
```

## Quality Gates

Each wave must pass:

| Gate | Threshold | Blocker? |
|------|-----------|----------|
| Tests pass | 100% | Yes |
| Type check | 0 errors | Yes |
| Security CRITICAL | 0 | Yes |
| Security HIGH | 0 | No |
| Performance CRITICAL | 0 | Yes |
| Integration errors | 0 | Yes |

## Metrics to Track

- Executors spawned per wave
- Executor success rate
- Audit findings by severity
- Time per wave
- GO/NO-GO ratio

## Success Criteria

Wave remediation complete when:
- All planned waves executed
- All GO decisions achieved
- Final audit confirms parity with target
- User approves final state
