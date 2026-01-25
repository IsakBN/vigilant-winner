# Queue Sub-Investigator (API Domain)

You investigate Cloudflare Queue patterns in the API package.

## Reference Files

```
/Users/isaks_macbook/Desktop/Dev/codepush/packages/api/src/lib/queue.ts
/Users/isaks_macbook/Desktop/Dev/codepush/packages/api/src/lib/tiers.ts
/Users/isaks_macbook/Desktop/Dev/codepush/packages/api/wrangler.toml
```

## Questions to Ask

### Priority Queue Strategy

```markdown
## Question: How many priority queues do we need?

| Option | Queues | Mapping | Notes |
|--------|--------|---------|-------|
| A) 4 queues | P0, P1, P2, P3 | Enterprise, Team, Pro, Free | Full tier separation |
| B) 3 queues | P0, P1, P2 | Enterprise, Paid, Free | Simpler |
| C) 2 queues | P0, P1 | Paid, Free | Minimal |
| D) 1 queue | Single | Priority field in message | Simplest but no isolation |

**Reference**: codepush uses A) 4 queues
**Recommendation**: A) 4 queues ✅

**Your choice?**
```

### Queue Message Format

```markdown
## Question: What should queue messages contain?

| Option | Format | Pros | Cons |
|--------|--------|------|------|
| A) Minimal | `{ jobId, releaseId }` | Small messages | Need DB lookup |
| B) Full context | `{ job, release, app, tier }` | No lookups | Larger messages |
| C) Hybrid | `{ jobId, appId, tier }` | Balance | Some lookups |
| D) Other | [Specify] | [Varies] | [Varies] |

**Reference**: codepush uses C) Hybrid
**Recommendation**: C) Hybrid ✅

**Your choice?**
```

### Retry Strategy

```markdown
## Question: How should failed jobs be retried?

| Option | Strategy | Max Retries | Backoff |
|--------|----------|-------------|---------|
| A) Aggressive | Retry quickly | 5 | Linear (1s, 2s, 3s) |
| B) Conservative | Retry slowly | 3 | Exponential (1s, 4s, 16s) |
| C) Dead letter | Move to DLQ after 3 | 3 | Exponential |
| D) No retry | Fail immediately | 0 | N/A |

**Reference**: codepush uses C) Dead letter
**Recommendation**: C) Dead letter ✅

**Your choice?**
```

### Concurrency Limits

```markdown
## Question: What concurrency limits per tier?

| Tier | Max Concurrent Jobs | Notes |
|------|---------------------|-------|
| Free | 5 | Basic |
| Pro | 10 | 2x |
| Team | 20 | 4x |
| Enterprise | 50 | 10x |

**Reference**: codepush uses these values
**Recommendation**: Use these values ✅

**Agree?** [Y/N or suggest changes]
```

## Output

Document findings in `.claude/knowledge/domains/api/queues.md`:

```markdown
# API Queue Investigation

## Decisions

| Decision | Choice | Evidence |
|----------|--------|----------|
| Queue count | 4 (P0-P3) | Full tier separation |
| Message format | Hybrid (jobId + key context) | Balance |
| Retry | DLQ after 3 attempts | Reliable |
| Concurrency | Tier-based limits | Fair resource usage |

## Queue Configuration

| Queue | Binding | Tier |
|-------|---------|------|
| UPLOAD_QUEUE_P0 | env.UPLOAD_QUEUE_P0 | Enterprise |
| UPLOAD_QUEUE_P1 | env.UPLOAD_QUEUE_P1 | Team |
| UPLOAD_QUEUE_P2 | env.UPLOAD_QUEUE_P2 | Pro |
| UPLOAD_QUEUE_P3 | env.UPLOAD_QUEUE_P3 | Free |

## Message Schema

```typescript
interface UploadJobMessage {
  jobId: string;
  appId: string;
  releaseId: string;
  tier: 'enterprise' | 'team' | 'pro' | 'free';
  timestamp: number;
  attempt: number;
}
```

## Files to Create

| File | Purpose | Lines Est. |
|------|---------|------------|
| src/lib/queue.ts | Queue routing | ~100 |
| src/lib/tiers.ts | Tier limits | ~80 |
```
