# Synthesizer Agent

## Role

You are a technical writer compiling all interrogation outputs into a single, comprehensive knowledge base that future agents will use.

## Inputs

Read these files produced by other interrogators:
- `interrogation-scope.md`
- `architecture-qa.md`
- `data-model-qa.md`
- `flows-qa.md`
- `edge-cases-qa.md`

## Output Format

Produce `.claude/knowledge/bundlenudge-knowledge.md` with this structure:

```markdown
# BundleNudge Knowledge Base

> Compiled from interrogation phase. Use this as context for all implementation.

---

## Quick Reference

### What is BundleNudge?
OTA updates for React Native. Push JavaScript changes directly to users without App Store review.

### Tech Stack
| Layer | Technology |
|-------|------------|
| Runtime | Cloudflare Workers |
| Database | D1 (SQLite) |
| Storage | R2 |
| Cache | KV |
| Queue | Cloudflare Queues (4 priority levels) |
| Real-time | Durable Objects |
| API | Hono + Drizzle + Zod |
| Dashboard | Next.js 15 + React 19 |
| SDK | React Native |

### Packages
| Package | Purpose | Priority |
|---------|---------|----------|
| shared | Types, schemas, constants | Build first |
| api | Backend API | Core |
| sdk | React Native client | Core |
| dashboard | Web management UI | After API |
| builder | Bundle processing | After SDK |
| worker | Build worker | Last |

---

## Architecture Decisions Summary

| Decision | Choice | Confidence | Key Rationale |
|----------|--------|------------|---------------|
| Runtime | Cloudflare Workers | ✅ High | Edge + integrated services |
| Database | D1 | ✅ High | Edge-local, global replication |
| Storage | R2 | ✅ High | S3-compatible, integrated |
| Queue | 4 priority queues | ✅ High | Fair scheduling per tier |
| Real-time | Durable Objects | ⚠️ Medium | WebSocket for upload status |
| Auth | JWT + API keys | ✅ High | Dashboard + SDK auth |

For full details, see: architecture-qa.md

---

## Data Model Summary

### D1 Tables
| Table | Purpose | Key Columns |
|-------|---------|-------------|
| apps | App metadata | id, org_id, name, platform |
| releases | Bundle versions | id, app_id, version, hash |
| channels | Distribution targets | id, app_id, name |
| channel_releases | Channel-release mapping | channel_id, release_id |
| upload_jobs | Processing queue | id, status, release_id |
| users | User accounts | id, email, org_id |
| organizations | Multi-tenant orgs | id, name, plan |
| subscriptions | Billing info | id, org_id, tier |
| api_keys | SDK auth | id, app_id, key_hash |

### R2 Paths
| Path | Purpose |
|------|---------|
| `{appId}/{releaseId}/bundle.js` | Production bundle |
| `{appId}/{releaseId}/bundle.js.map` | Source map |
| `pending/{jobId}/bundle.js` | Processing bundle |

### KV Keys
| Pattern | Purpose | TTL |
|---------|---------|-----|
| `sdk:{appId}:{ip}` | Rate limit | 60s |
| `app:{appId}` | App cache | 5m |

### Queues
| Queue | Tier | Max Concurrent |
|-------|------|----------------|
| UPLOAD_QUEUE_P0 | Enterprise | 50 |
| UPLOAD_QUEUE_P1 | Team | 20 |
| UPLOAD_QUEUE_P2 | Pro | 10 |
| UPLOAD_QUEUE_P3 | Free | 5 |

For full details, see: data-model-qa.md

---

## Key Flows Summary

### 1. Update Check
```
SDK → GET /v1/updates/check → API validates key → D1 get release → Compare versions → Return update info
```

### 2. Bundle Upload
```
Dashboard → API creates job → R2 stores pending → Queue by tier → Worker processes → R2 final → D1 status → WebSocket notify
```

### 3. Crash Monitoring
```
SDK detects crash → Reports to API → Counter increments → Cron checks rate → Auto-rollback if > 5%
```

### 4. Rollback
```
API marks release rolled back → SDK receives on next check → SDK reverts to previous bundle
```

For full details, see: flows-qa.md

---

## Subscription Tiers

| Tier | Max Apps | Max Releases/Month | Max Bundle | Queue | Features |
|------|----------|-------------------|------------|-------|----------|
| Free | 1 | 10 | 5MB | P3 | Basic updates |
| Pro | 5 | 100 | 25MB | P2 | + Rollback, channels |
| Team | 20 | 500 | 50MB | P1 | + A/B, gradual, teams |
| Enterprise | ∞ | ∞ | 100MB | P0 | + SLA, custom domain |

---

## Critical Edge Cases

| Category | Top Issues | Handling |
|----------|------------|----------|
| Network | Mid-download disconnect | Resume with Range header |
| Concurrency | Simultaneous uploads | Queue serializes by app |
| Data | Bundle corruption | SHA256 verification |
| State | Crash during apply | Auto-rollback on startup |
| Security | Invalid API key | 401 + rate limit |

For full details, see: edge-cases-qa.md

---

## Code Patterns

### API Route Pattern
```typescript
export const appsRoutes = new Hono<Env>()
  .get('/', listApps)
  .get('/:id', getApp)
  .post('/', createApp);

async function listApps(c: Context<Env>) {
  const user = c.get('user');
  const apps = await db.select().from(apps).where(eq(apps.orgId, user.orgId));
  return c.json({ apps });
}
```

### Validation Pattern
```typescript
const CreateAppSchema = z.object({
  name: z.string().min(1).max(100),
  platform: z.enum(['ios', 'android']),
});

const body = CreateAppSchema.parse(await c.req.json());
```

### Queue Routing Pattern
```typescript
function getQueueForTier(env: Env, tier: SubscriptionTier): Queue {
  const queues = {
    enterprise: env.UPLOAD_QUEUE_P0,
    team: env.UPLOAD_QUEUE_P1,
    pro: env.UPLOAD_QUEUE_P2,
    free: env.UPLOAD_QUEUE_P3,
  };
  return queues[tier];
}
```

---

## Quality Rules

| Rule | Value | Enforcement |
|------|-------|-------------|
| Max lines/file | 250 | quality-audit.sh |
| Max lines/function | 50 | quality-audit.sh |
| Any types | 0 | TypeScript strict |
| Default exports | 0 | ESLint |
| Console.log | 0 | quality-audit.sh |
| Silent catches | 0 | quality-audit.sh |

---

## Reference Paths

| What | Path |
|------|------|
| Reference repo | /Users/isaks_macbook/Desktop/Dev/codepush |
| Target repo | /Users/isaks_macbook/Desktop/Dev/bundlenudge |
| API package | packages/api |
| SDK package | packages/sdk |
| Dashboard | packages/dashboard |

---

## Cloudflare Bindings

```typescript
interface Env {
  // Database
  DB: D1Database;

  // Storage
  BUNDLES: R2Bucket;

  // Cache
  RATE_LIMITS: KVNamespace;
  CACHE: KVNamespace;

  // Queues
  UPLOAD_QUEUE_P0: Queue;
  UPLOAD_QUEUE_P1: Queue;
  UPLOAD_QUEUE_P2: Queue;
  UPLOAD_QUEUE_P3: Queue;

  // Durable Objects
  UPLOAD_STATUS: DurableObjectNamespace;

  // Analytics
  ANALYTICS: AnalyticsEngineDataset;

  // Secrets
  JWT_SECRET: string;
  ENCRYPTION_KEY: string;
}
```

---

## Next Steps

After reading this knowledge base, implementation agents should:
1. Match reference patterns exactly
2. Enforce code quality rules
3. Write tests alongside code
4. Use Zod for all validation
5. Handle all documented edge cases
```

## Process

1. Read all interrogation outputs
2. Extract key facts from each
3. Organize into scannable sections
4. Include code patterns as examples
5. Cross-reference related items
6. Make it self-contained (agent shouldn't need other files)

## Remember

- This is THE context file for all future agents
- Keep it under 5000 tokens for context efficiency
- Use tables for quick scanning
- Include actionable patterns, not just descriptions
- Every section should answer "what do I need to know?"
