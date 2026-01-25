# Wave Plan Template

Copy this file to `outputs/wave-{N}-plan.md` and fill in.

---

# Wave {N} Plan: {Wave Title}

## Wave Focus
{One sentence describing the wave's goal}

## Prerequisites
- [ ] Previous wave completed
- [ ] GO decision received
- [ ] Required context available

## Tasks

### Task 1: {Task Name}
**Description**: {What needs to be done}
**Files**:
- `path/to/file1.ts` (create/modify)
- `path/to/file2.ts` (create/modify)

**Acceptance Criteria**:
- [ ] {Criterion 1}
- [ ] {Criterion 2}
- [ ] Tests added and passing

**Dependencies**: None / Task X

---

### Task 2: {Task Name}
**Description**: {What needs to be done}
**Files**:
- `path/to/file.ts`

**Acceptance Criteria**:
- [ ] {Criterion 1}

**Dependencies**: Task 1

---

## Execution Order

```
Task 1 ─────┬────► Task 2
            │
            └────► Task 3 ────► Task 4
```

Or in text:
1. Task 1 (no deps)
2. Task 2, Task 3 (parallel, depend on Task 1)
3. Task 4 (depends on Task 3)

## Expected Outcomes

After this wave:
- {Outcome 1}
- {Outcome 2}
- {Metric improvement}

## Audit Focus Areas

**Security Auditor**: Focus on {specific concerns}
**Performance Auditor**: Focus on {specific concerns}
**Integration Auditor**: Focus on {specific concerns}

## GO/NO-GO Criteria

**GO if**:
- All tasks completed successfully
- No CRITICAL audit findings
- Tests pass

**NO-GO if**:
- Any task failed
- CRITICAL security issue found
- Integration tests broken

## Rollback Plan

If wave fails:
1. Revert commits
2. Create fix tasks
3. Re-run wave
