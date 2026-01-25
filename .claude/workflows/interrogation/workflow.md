# Interrogation Workflow

## Purpose

Build complete, deep understanding of the codepush reference implementation before writing ANY code. This is a ~1 hour process of agents systematically questioning every aspect of the architecture.

## Why Interrogation?

1. **Prevent blind copying** - Understand WHY, not just WHAT
2. **Surface hidden complexity** - Find edge cases before they find you
3. **Build knowledge base** - Persistent context for all future work
4. **Align mental models** - Same understanding across all agents

## Reference Repository

```
/Users/isaks_macbook/Desktop/Dev/codepush
```

Production-ready OTA update system with 66k+ lines of TypeScript.

## Phase Overview

| Phase | Agent | Duration | Output |
|-------|-------|----------|--------|
| 0 | Scope Definer | 5 min | interrogation-scope.md |
| 1 | Architecture Interrogator | 15 min | architecture-qa.md |
| 2 | Data Model Interrogator | 15 min | data-model-qa.md |
| 3 | Flow Interrogator | 15 min | flows-qa.md |
| 4 | Edge Case Interrogator | 10 min | edge-cases-qa.md |
| 5 | Synthesizer | 10 min | bundlenudge-knowledge.md |

**Total: ~70 minutes**

## Phase Details

### Phase 0: Scope Definition

**Agent**: `scope-definer.md`

**Task**: Define what we're interrogating and set boundaries.

**Questions to answer**:
- Which packages are we rebuilding? (all 6)
- What is the priority order?
- What features are must-have vs nice-to-have?
- What are the known constraints?

**Output**: `interrogation-scope.md`

### Phase 1: Architecture Interrogation

**Agent**: `architecture-interrogator.md`

**Task**: Deeply understand the system architecture.

**Areas to explore**:
- Why Cloudflare Workers? Trade-offs?
- Why D1 over Postgres? Limitations?
- Why 4 priority queues? How determined?
- Why Durable Objects for status? Alternatives?
- How does the SDK communicate with API?
- What's the authentication model?
- How are secrets managed?

**For each decision, ask**:
1. What problem does this solve?
2. What alternatives were considered?
3. What are the trade-offs?
4. What would break if we changed it?

**Output**: `architecture-qa.md`

### Phase 2: Data Model Interrogation

**Agent**: `data-model-interrogator.md`

**Task**: Map every data structure, relationship, and storage location.

**D1 Tables** - For each table:
- What does it store?
- What are the relationships?
- What indexes exist and why?
- What are the access patterns?
- What are the constraints?

**R2 Storage** - For each path pattern:
- What is stored there?
- How is it accessed?
- What's the lifecycle?
- How is it cleaned up?

**KV Keys** - For each key pattern:
- What data is cached?
- What's the TTL?
- What happens on cache miss?

**Queues** - For each queue:
- What messages flow through?
- What's the processing logic?
- What happens on failure?
- What's the retry strategy?

**Output**: `data-model-qa.md`

### Phase 3: Flow Interrogation

**Agent**: `flow-interrogator.md`

**Task**: Trace every major operation end-to-end.

**Flows to trace**:

1. **Update Check Flow**
   - SDK calls API
   - API validates
   - API checks channel
   - API compares versions
   - API returns update or 204

2. **Bundle Upload Flow**
   - Dashboard initiates
   - API creates job
   - R2 stores pending
   - Queue routes by tier
   - Worker processes
   - Worker moves to final location

3. **Crash Monitoring Flow**
   - SDK detects crash
   - SDK reports to API
   - API increments counter
   - Cron checks rates
   - Auto-rollback triggers

4. **A/B Testing Flow**
   - Release tagged with variant
   - SDK requests with device ID
   - API hashes for bucket
   - API returns appropriate variant

5. **Rollback Flow**
   - Manual trigger or auto
   - API marks release
   - SDK receives on next check
   - SDK applies previous bundle

**For each flow, document**:
- Entry point
- Each step with code references
- Error handling at each step
- Edge cases

**Output**: `flows-qa.md`

### Phase 4: Edge Case Interrogation

**Agent**: `edge-case-interrogator.md`

**Task**: Find and document every edge case.

**Questions to explore**:

**Network/Connectivity**:
- What if SDK loses connection mid-download?
- What if API is unreachable?
- What if R2 is slow/unavailable?

**Concurrency**:
- What if two uploads happen simultaneously?
- What if SDK checks during upload?
- What if release promotes during download?

**State Transitions**:
- What if app crashes during update apply?
- What if device runs out of storage?
- What if bundle is corrupted?

**Limits**:
- What happens at tier limits?
- What if bundle exceeds max size?
- What if rate limit exceeded?

**Data Integrity**:
- How are hashes verified?
- What if hash mismatch?
- How is data consistency maintained?

**Output**: `edge-cases-qa.md`

### Phase 5: Synthesis

**Agent**: `synthesizer.md`

**Task**: Compile all interrogation results into a single knowledge base.

**Process**:
1. Read all Q&A files
2. Extract key facts
3. Organize by topic
4. Cross-reference related items
5. Create searchable knowledge base

**Output**: `.claude/knowledge/bundlenudge-knowledge.md`

This knowledge base becomes the primary context for all future agents.

## Running the Interrogation

```bash
./claude/workflows/runner/interrogate.sh [scope]

# Examples:
./claude/workflows/runner/interrogate.sh all      # Full interrogation
./claude/workflows/runner/interrogate.sh api      # Just API package
./claude/workflows/runner/interrogate.sh flows    # Just flow analysis
```

## Output Directory

```
.claude/knowledge/
├── interrogation-scope.md
├── architecture-qa.md
├── data-model-qa.md
├── flows-qa.md
├── edge-cases-qa.md
└── bundlenudge-knowledge.md    # THE knowledge base
```

## Success Criteria

Interrogation is complete when:
- [ ] Every major architectural decision is documented with WHY
- [ ] Every data model is mapped with relationships
- [ ] Every major flow is traced end-to-end
- [ ] Every known edge case has handling documented
- [ ] Knowledge base is comprehensive and searchable
- [ ] No "I don't know" gaps remain

## Next Step

After interrogation, run:
```bash
./claude/workflows/runner/build-package.sh shared
```
