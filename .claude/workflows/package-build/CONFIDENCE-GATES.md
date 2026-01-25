# Confidence Gates

The build workflow will STOP at these gates and require explicit approval.

## How Gates Work

1. Builder reaches a gate (e.g., "rollback complete")
2. Workflow pauses and outputs gate status
3. Human reviews the work
4. Human runs `/approve rollback` to continue
5. Workflow proceeds to next phase

Without `/approve`, the workflow CANNOT continue.

---

## Gate 1: Foundation Complete

**Triggers after**: Shared package complete

**Checklist**:
- [ ] All shared types defined
- [ ] Zod schemas for all types
- [ ] Constants defined (thresholds, limits)
- [ ] Type exports working
- [ ] No `any` types

**Command**: `/approve foundation`

---

## Gate 2: Rollback Complete (CRITICAL)

**Triggers after**: SDK rollback module complete

**Checklist**:
- [ ] RollbackManager class implemented
- [ ] Crash counting works correctly
- [ ] Threshold detection works
- [ ] Rollback to previous version works
- [ ] Edge case: no previous version → embedded bundle
- [ ] Edge case: storage corrupted → embedded bundle
- [ ] Unit tests: 100% coverage
- [ ] Integration test: 3 crashes → rollback
- [ ] Integration test: 2 crashes → no rollback
- [ ] Manual test: iOS device
- [ ] Manual test: Android device

**Required Test Output**:
```
ROLLBACK TEST RESULTS
=====================
Unit tests: 15/15 passed
Integration tests: 5/5 passed
Edge cases: 8/8 passed
Coverage: 100%

Manual verification required:
[ ] Tested on physical iOS device
[ ] Tested on physical Android device
```

**Command**: `/approve rollback`

---

## Gate 3: Storage Complete (CRITICAL)

**Triggers after**: SDK storage module complete

**Checklist**:
- [ ] Atomic write pattern implemented
- [ ] Temp file → rename flow
- [ ] Old bundle cleanup
- [ ] Version tracking (current, previous, pending)
- [ ] Edge case: disk full → error before state change
- [ ] Edge case: power loss → temp file cleanup
- [ ] Unit tests: 100% coverage

**Required Test Output**:
```
STORAGE TEST RESULTS
====================
Unit tests: 12/12 passed
Atomic write tests: 5/5 passed
Edge cases: 6/6 passed
Coverage: 100%
```

**Command**: `/approve storage`

---

## Gate 4: Integrity Complete (CRITICAL)

**Triggers after**: SDK hash verification complete

**Checklist**:
- [ ] SHA256 hash computation works
- [ ] Hash format validation (sha256:xxx)
- [ ] Mismatch detection works
- [ ] Edge case: invalid format → reject immediately
- [ ] Edge case: empty bundle → reject
- [ ] Edge case: partial download → reject
- [ ] Security test: modified bytes detected

**Required Test Output**:
```
INTEGRITY TEST RESULTS
======================
Hash validation: 8/8 passed
Security tests: 3/3 passed
Coverage: 100%
```

**Command**: `/approve integrity`

---

## Gate 5: Updater Complete

**Triggers after**: SDK updater module complete

**Checklist**:
- [ ] Update check works
- [ ] Download with progress works
- [ ] Background download works
- [ ] Patch application works (if available)
- [ ] Full bundle fallback works
- [ ] Version tracking updated
- [ ] Unit tests: 95%+ coverage
- [ ] Integration with storage/rollback

**Command**: `/approve updater`

---

## Gate 6: Health Complete

**Triggers after**: SDK health module complete

**Checklist**:
- [ ] Event tracking works
- [ ] Timer-based failure detection works
- [ ] Healthy devices: ZERO network calls
- [ ] Unhealthy devices: single failure ping
- [ ] Aggregation on server side
- [ ] Auto-disable at 5% threshold

**Command**: `/approve health`

---

## Gate 7: API Complete

**Triggers after**: API package complete

**Checklist**:
- [ ] All routes implemented
- [ ] Authentication works (API key + JWT)
- [ ] Rate limiting works
- [ ] Database operations work
- [ ] Storage (R2) operations work
- [ ] Queue integration works
- [ ] Load test: 10,000 RPS sustained
- [ ] Latency: p99 < 100ms

**Required Test Output**:
```
API TEST RESULTS
================
Unit tests: all passed
Integration tests: all passed
Load test: 12,000 RPS peak (target: 10,000)
Latency p99: 87ms (target: <100ms)
Error rate: 0.002% (target: <0.01%)
```

**Command**: `/approve api`

---

## Gate 8: Dashboard Complete

**Triggers after**: Dashboard package complete

**Checklist**:
- [ ] All pages render
- [ ] Authentication flow works
- [ ] App CRUD works
- [ ] Release upload works
- [ ] Rollback button works
- [ ] Analytics display works
- [ ] Responsive design (mobile)
- [ ] Accessibility basics

**Command**: `/approve dashboard`

---

## Gate 9: End-to-End Complete (FINAL)

**Triggers after**: All packages complete

**Checklist**:
- [ ] Full flow: upload → check → download → apply
- [ ] Rollback flow: crash → rollback → report
- [ ] Health flow: failure → report → auto-disable
- [ ] Dashboard shows correct state
- [ ] SDK works on iOS simulator
- [ ] SDK works on Android emulator
- [ ] SDK works on physical iOS
- [ ] SDK works on physical Android

**Required**:
- Video recording of full flow working
- Screenshot of dashboard showing release

**Command**: `/approve e2e`

---

## Gate Implementation

The build workflow checks for gates like this:

```bash
# In build-package.sh
check_gate() {
  local gate_name=$1
  local gate_file=".claude/gates/$gate_name.approved"

  if [ ! -f "$gate_file" ]; then
    echo ""
    echo "═══════════════════════════════════════════════════════"
    echo "  GATE: $gate_name"
    echo "═══════════════════════════════════════════════════════"
    echo ""
    echo "This gate requires human approval before continuing."
    echo "Review the checklist in CONFIDENCE-GATES.md"
    echo ""
    echo "To approve: /approve $gate_name"
    echo ""
    exit 0  # Clean exit, workflow pauses
  fi
}
```

The `/approve` command creates the gate file:

```bash
# /approve command
approve_gate() {
  local gate_name=$1
  mkdir -p .claude/gates
  echo "Approved at $(date)" > ".claude/gates/$gate_name.approved"
  echo "Gate '$gate_name' approved. Workflow can continue."
}
```

---

## Gate Status

Check current gate status:

```bash
# /gates command
ls -la .claude/gates/
```

Reset all gates (start fresh):

```bash
rm -rf .claude/gates/
```
