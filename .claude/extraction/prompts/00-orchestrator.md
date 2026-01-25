# Extraction Orchestrator

You are the orchestrator for exhaustive knowledge extraction from the codepush codebase.

## Your Mission

Coordinate the complete extraction of ALL production SaaS features from:
`/Users/isaks_macbook/Desktop/Dev/codepush`

Into comprehensive documentation for BundleNudge autonomous building.

## Wave Execution Order

### Wave 0: Discovery (MUST complete first)
Run these 3 crawlers in PARALLEL:
1. `01-file-crawler.md` → outputs `manifests/files.json`
2. `02-route-crawler.md` → outputs `manifests/routes.json`
3. `03-schema-crawler.md` → outputs `manifests/schema.json`

Wait for all 3 to complete. Verify outputs exist.

### Wave 1: Deep Extraction (Parallel)
Using the manifests, run these 6 extractors in PARALLEL:
1. `10-auth-extractor.md` → outputs `output/auth.md`
2. `11-billing-extractor.md` → outputs `output/billing.md`
3. `12-teams-extractor.md` → outputs `output/teams.md`
4. `13-integrations-extractor.md` → outputs `output/integrations.md`
5. `14-admin-extractor.md` → outputs `output/admin.md`
6. `15-dashboard-extractor.md` → outputs `output/dashboard.md`

Wait for all 6 to complete. Verify outputs exist.

### Wave 2: Route Verification
For EVERY route in `manifests/routes.json`:
- Run `20-route-verifier.md` with the route as input
- Output to `output/routes/{method}-{path-slug}.md`
- Run in batches of 10 parallel

### Wave 3: Cross-Reference (Parallel)
Run these 3 checkers in PARALLEL:
1. `30-completeness-checker.md` → outputs `output/gaps.md`
2. `31-consistency-checker.md` → outputs `output/mismatches.md`
3. `32-dependency-tracer.md` → outputs `output/dependencies.md`

### Wave 4: Synthesis
Run the synthesizer:
1. `40-synthesizer.md` → outputs:
   - `SAAS-KNOWLEDGE.md` (comprehensive doc)
   - `FEATURE-MANIFEST.json` (complete feature list)
   - Updates to `.claude/loop/prompts/` (new feature prompts)

## Success Criteria

Before declaring complete:
- [ ] Every file in manifests/files.json is accounted for
- [ ] Every route in manifests/routes.json has documentation
- [ ] Every table in manifests/schema.json has documentation
- [ ] No gaps flagged in gaps.md remain unresolved
- [ ] SAAS-KNOWLEDGE.md is comprehensive (target: 40+ pages)
- [ ] All loop prompts updated with new features

## Output Location

All outputs go to: `/Users/isaks_macbook/Desktop/Dev/bundlenudge/.claude/extraction/output/`

## How to Run

```bash
# From bundlenudge root
./.claude/extraction/run-extraction.sh
```
