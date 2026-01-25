# BundleNudge Handover Document

## Project Overview

**BundleNudge** is an OTA (Over-The-Air) update system for React Native apps, being rebuilt from the reference implementation at `/Users/isaks_macbook/Desktop/Dev/codepush` (66k+ lines TypeScript).

**Target**: `/Users/isaks_macbook/Desktop/Dev/bundlenudge`
**License**: BSL 1.1 (free for self-use, converts to Apache 2.0 in 2030)

---

## Current State

### Phase: Pre-Interrogation Complete

We have completed:
1. ✅ Workflow infrastructure (interrogation + build agents)
2. ✅ Critical feature identification (11 features)
3. ✅ Decision discussions with user (all locked)
4. ✅ Sub-investigators for all domains
5. ✅ Confidence gates defined

**Next Step**: Run interrogation workflow to analyze codepush in detail and produce knowledge base.

---

## Key Files to Read

| File | Purpose |
|------|---------|
| `.claude/workflows/interrogation/DECISIONS-FINAL.md` | All locked decisions |
| `.claude/workflows/interrogation/CRITICAL-FEATURES-V2.md` | 11 critical features with details |
| `.claude/workflows/interrogation/WHAT-WE-ARE-BUILDING.md` | Semantic understanding |
| `.claude/workflows/interrogation/agents/orchestrator.md` | Main interrogation agent |
| `scripts/preflight-check.sh` | Pre-build validation |

---

## Locked Decisions (Do Not Change)

| Decision | Choice |
|----------|--------|
| Native Detection | STRICT - block on ANY native change |
| Route-Based Rollback | Dashboard defines critical routes, SDK monitors |
| Verification Window | Wait for all routes called + 5min timeout |
| GitHub Integration | GitHub Action only (MVP) |
| Hermes/JSC | Auto-detect bundle type |
| Bundle Encryption | AES-256-GCM with appSecret in native code |
| Source Maps | Server-side only, never expose to device |

---

## Critical Features (11 Total)

| # | Feature | Confidence | Notes |
|---|---------|------------|-------|
| 1 | Native Module Detection | 10/10 | Strict blocking |
| 2 | App Store Version Tracking | 10/10 | min_version per release |
| 3 | Upload Queue Isolation | 10/10 | P0-P3 priority queues |
| 4 | In-App Update Modal | 8/10 | Built-in + callback option |
| 5 | Tiered Rollback | 10/10 | Crash-based (Free/Pro), Event-based (Team/Enterprise) |
| 6 | GitHub Upload Verification | 9/10 | Presign + poll + hash verify |
| 7 | Hash Verification | 10/10 | SHA256, never skip |
| 8 | Atomic Storage | 10/10 | Temp file + rename |
| 9 | Bundle Encryption | 10/10 | appSecret in native code |
| 10 | Source Maps | 9/10 | Server-side decode only |
| 11 | Hermes + JSC | 8/10 | Auto-detect magic bytes |

---

## Tiered Rollback (User's Key Feature)

**Free/Pro tiers**: 3 crashes in 60s → rollback

**Team/Enterprise tiers**: Event-based rollback
1. SDK auto-tracks all network calls
2. Dashboard shows observed routes (like Postman)
3. Developer marks critical routes
4. If critical route returns non-200 → immediate rollback
5. Keep previous bundle until ALL critical routes succeed

---

## Workflow Structure

```
.claude/workflows/
├── interrogation/
│   ├── DECISIONS-FINAL.md       # Locked decisions
│   ├── CRITICAL-FEATURES-V2.md  # Feature details
│   ├── agents/
│   │   ├── orchestrator.md      # Main coordinator
│   │   └── domains/
│   │       ├── api/             # 8 sub-investigators
│   │       ├── sdk/             # 3 sub-investigators
│   │       └── dashboard/       # 2 sub-investigators
├── package-build/
│   ├── CONFIDENCE-GATES.md      # Build gates requiring /approve
│   └── agents/                  # 8 build agents
└── runner/
    ├── interrogate.sh           # Run interrogation
    └── build-package.sh         # Build with gates
```

---

## Confidence Gates

Build workflow STOPS and requires `/approve` at:

| Gate | Feature |
|------|---------|
| `rollback` | Crash + route-based rollback |
| `native-detection` | Native module detection |
| `storage` | Atomic storage operations |
| `integrity` | Hash verification + encryption |
| `api` | All API endpoints |
| `e2e` | Full end-to-end flow |

---

## Reference Implementation

```
/Users/isaks_macbook/Desktop/Dev/codepush
├── packages/api/          # Cloudflare Workers API
├── packages/sdk/          # React Native SDK
├── packages/dashboard-v2/ # Next.js dashboard
├── packages/shared/       # Shared types
├── packages/builder/      # Bundle processing
└── packages/worker/       # Background jobs
```

Key files already analyzed:
- `packages/sdk/src/rollback.ts` - Rollback logic
- `packages/sdk/src/health.ts` - Health monitoring
- `packages/api/src/lib/native-deps/` - Native detection
- `packages/api/src/routes/updates.ts` - Update check endpoint
- `packages/api/src/queue-handlers/upload-processor.ts` - Queue processing

---

## Commands

```bash
pnpm interrogate        # Run interrogation workflow
pnpm preflight          # Check if ready for build
pnpm build-package sdk  # Build a package with gates
```

---

## Resume Instructions

1. Read `DECISIONS-FINAL.md` for all locked decisions
2. Read `CRITICAL-FEATURES-V2.md` for feature details
3. Run interrogation workflow OR start building packages
4. Use `/approve <gate>` to pass confidence gates

---

## User Preferences

- Wants **bulletproof** critical features ("one billion percent sure")
- Prefers **strict** over flexible (safety first)
- Wants **visibility** (dashboard shows routes like Postman)
- Values **testing** (100% coverage on critical paths)
- Likes **tiered** approach (different behavior per subscription)
