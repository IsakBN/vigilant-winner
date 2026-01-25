# Architecture Q&A

## Runtime: Cloudflare Workers

### Q: Why Cloudflare Workers instead of traditional servers?
**A**: Edge computing provides sub-50ms latency globally without infrastructure management. Workers have zero cold starts (pre-warmed), pay-per-millisecond pricing ideal for variable OTA traffic, and native bindings to D1/R2/KV/Queues in a single worker. DDoS protection is automatic.
**Evidence**: `packages/api/wrangler.toml` - single worker config; `DEPLOYMENT.md:75-76` - "API | Cloudflare Workers (Hono)"
**Trade-offs**:
- Gain: Global edge, zero cold starts, integrated services, DDoS protection
- Lose: Long-running processes (128MB memory limit, 30s CPU limit)

### Q: What are the Worker limitations that shaped the architecture?
**A**: 1MB code size soft limit, 128MB memory limit, 30s CPU time limit per request. Bundle processing offloaded to async queues. Request size limited to 5MB default, 100MB for uploads.
**Evidence**: `packages/api/src/index.ts:86-97` - request size limits configured per route
**Impact**: Heavy processing (module parsing, delta generation) happens in queue handlers, not request handlers

### Q: How does cold start impact SDK update checks?
**A**: Near-zero impact. Cloudflare pre-warms workers; no database connections on init (lazy-loaded). V8 snapshot caches script after first use. P95 latency dominated by query time, not startup.
**Evidence**: `packages/api/src/index.ts:68-79` - `envValidated` flag validates env once per instance

---

## Database: D1 + Neon

### Q: Why D1 (SQLite) for metadata + Neon (Postgres) for auth?
**A**: Split by requirements:
- **D1**: OTA metadata (apps, releases, devices). Eventual consistency acceptable. Simple queries. Easy backups (SQLite export). No cross-table transactions needed.
- **Neon**: Better-Auth requires mature SQL with transactions. Session management needs ACID guarantees. Serverless connection pooling matches Workers model.
**Evidence**: `packages/api/src/lib/auth.ts:1-40` - imports `neon` for auth; `wrangler.toml:50-54` - D1 for main DB
**Trade-offs**:
- Gain: Right tool for each job, simplified D1 queries
- Lose: Two databases to manage, no joins across systems

### Q: What are D1's consistency guarantees?
**A**: Per-row ACID via SQLite transactions. Write serialization via locks. No multi-row transactions used. Analytics (device_pings) are eventually consistent. No foreign key constraints enforced (validation at application layer).
**Evidence**: `packages/api/src/queue-handlers/upload-processor.ts:50-93` - individual UPDATE statements
**Impact**: Application layer handles validation and relationships

### Q: How are migrations handled?
**A**: No automatic migrations. Schema is static, defined outside code. Manual deployment via `./scripts/migrate.sh`. Changes require backward-compatible alterations + manual migration script.
**Evidence**: `DEPLOYMENT.md:100-130` - manual migration instructions
**Why**: Simplicity for edge computing; migrations don't happen during worker update

### Q: What are D1's query limitations?
**A**: No full-text search, limited indexing hints, no window functions, single-threaded writes (mitigated by queues), no recursive queries.
**Evidence**: `packages/api/src/lib/crash-monitor/aggregation.ts` - manual aggregation in application code
**Workarounds**: Analytics aggregated in app code, pagination in application, JSON filtering in memory

---

## Storage: R2

### Q: Why R2 for bundles vs storing in D1?
**A**:
1. **Size**: D1 prefers <100KB per row; Metro bundles are 500KB-5MB. R2 supports up to 5TB objects.
2. **Bandwidth**: R2 serves directly via Cloudflare CDN. D1 would require Worker streaming (higher latency + CPU time).
3. **Cost**: Bundle egress dominates (millions of SDK downloads). R2 storage + egress cheaper than D1 + Worker CPU.
4. **Separation**: Metadata in D1, blobs in R2. Decouples schema changes from binary data.
**Evidence**: `packages/api/src/lib/bundle/storage.ts:12-26` - stores to R2 with content type; `types/database.ts:60-70` - Release stores `bundle_key` (R2 path)
**Trade-offs**:
- Gain: Efficient blob storage, CDN delivery, cost optimization
- Lose: Additional service to manage, no transactional blob + metadata updates

### Q: What are upload/download patterns?
**A**:
- **Upload**: SDK sends multipart form → Worker stores to pending R2 location → Enqueues to priority queue → Queue processor parses/stores modules → Moves to final location → Broadcasts completion via Durable Object WebSocket
- **Download**: SDK calls `/v1/updates` → Worker queries D1 for applicable release → Returns R2 URL → SDK downloads directly from R2 CDN → Verifies hash before loading
**Evidence**: `packages/api/src/queue-handlers/upload-processor.ts:98-200` - queue processing flow

### Q: How is large file handling managed?
**A**: 100MB request limit for uploads (Worker memory limit is 128MB). Entire bundle buffered in memory. Heavy processing offloaded to queue handlers. Typical bundles are 1-5MB, well within limits. 100MB limit is defensive against abuse.
**Evidence**: `packages/api/src/index.ts:128-145` - request size validation

---

## Queue Architecture

### Q: Why 4 priority queues (P0-P3)?
**A**: SLA differentiation by subscription tier:
- P0 (Enterprise): batch=10, concurrency=5 → ~2-3 sec/upload
- P1 (Team): batch=5, concurrency=3 → ~5-10 sec/upload
- P2 (Pro): batch=3, concurrency=2 → ~15-30 sec/upload
- P3 (Free): batch=1, concurrency=1 → ~60-120 sec/upload

Billing differentiator without additional infrastructure. Free tier served (no starvation) but slower.
**Evidence**: `wrangler.toml:77-151` - 4 queue consumers with different batch/concurrency; `lib/upload-limits.ts:318-343` - `getQueueForPriority()` switch
**Trade-offs**:
- Gain: Fair resource distribution, clear paid tier value
- Lose: More queues to monitor, complex routing

### Q: What's the retry handling strategy?
**A**: Cloudflare Queues automatic exponential backoff (1s, 10s, 100s). After 3 retries (~111 seconds), job moves to Dead Letter Queue (DLQ). DLQ processes at batch=10, concurrency=1 with no retries. DLQ is for monitoring/alerting.
**Evidence**: `wrangler.toml:126-151` - all consumers have `max_retries = 3` and `dead_letter_queue = "upload-dlq"`
**Why 3 retries**: Typical Cloudflare outage <30 seconds, well within ~2 minute retry window

### Q: What's the dead letter strategy?
**A**: Jobs failing 3 times auto-move to DLQ. No further retries (prevents infinite loops). DLQ logged with full context. Manual intervention workflow: operator investigates, fixes infrastructure or notifies user, may manually retry transient issues.
**Evidence**: `packages/api/src/index.ts:404-416` - queue handler routes DLQ messages

---

## Real-time: Durable Objects

### Q: Why Durable Objects + WebSocket for upload status instead of polling?
**A**:
1. **Connection persistence**: Each user has one DO instance maintaining WebSocket state
2. **Push efficiency**: Queue processor broadcasts status changes instantly. Polling would waste 600 requests/min
3. **Cost**: WebSocket scales with connections, not time
4. **UX**: Dashboard shows progress instantly (<100ms vs 1-5s polling delay)
**Evidence**: `packages/api/src/durable-objects/UploadStatusDO.ts:1-250` - WebSocket implementation; `wrangler.toml:160-170` - DO binding
**Trade-offs**:
- Gain: Real-time updates, bandwidth efficiency
- Lose: Connection management complexity, DO billing per request

### Q: How does state persist in Durable Objects?
**A**: In-memory only. `sessions: Map<WebSocket, WebSocketSession>` not persisted. Connections lost on DO restart. OK because D1 is source of truth - clients reconnect and query current status.
**Evidence**: `packages/api/src/durable-objects/UploadStatusDO.ts:69-125` - sessions map in memory only
**Why no durable storage**: WebSocket connections are ephemeral. Dashboard recovers on reconnect by querying API.

---

## Authentication

### Q: What's the multi-auth pattern (JWT vs session vs API key)?
**A**: Three parallel systems:
1. **Session (Dashboard)**: Better-Auth sessions in Neon Postgres. Cookie-based. 7-day expiry, 24-hour refresh. Used by dashboard users.
2. **API Key (SDK uploads)**: Format `cp_(live|test)_[8]_[24+]`. Bcrypt hashed (12 rounds). Stored in D1 `api_keys` table. Used by SDKs and build systems.
3. **Device Token (SDK updates)**: Keyless authentication. Device registers once, gets persistent token. Used for update checks.
**Evidence**: `packages/api/src/lib/auth.ts:30-87` - Better-Auth config; `middleware/auth.ts:50-92` - bcrypt API key verification

### Q: Why separate SDK vs dashboard authentication?
**A**:
- **SDK (API Key)**: SDKs can't use cookies. Stateless validation. Revocable per app. Auditable.
- **Dashboard (Session)**: Browser sends cookies naturally. Better-Auth handles security (httpOnly, sameSite, secure). Standard web pattern.
**Trade-offs**:
- Gain: SDK compromise doesn't compromise dashboard, better UX
- Lose: Three auth systems to maintain

### Q: How does keyless SDK authentication work?
**A**: SDK only has `appId`. On first install, SDK calls `/v1/devices/register` with app ID + device info. Backend generates unique device token. Token stored locally, used for subsequent update checks. No API key needed in production binary.
**Evidence**: `packages/api/src/lib/device-token.ts` - device token generation/verification
**Why**: Better security (no API keys in binaries), device-level granularity, enables per-device analytics

---

## Multi-tenancy

### Q: How is app isolation enforced per user/org?
**A**: Application layer enforcement, not database layer (no row-level security). Routes validate user ownership via `WHERE user_id = ?`. Upload validates `formAppId === appId` from API key. Admin routes check email domain.
**Evidence**: `packages/api/src/routes/uploads.ts:92-98` - app ID validation; `types/database.ts:29-42` - AppRow has `user_id`
**Pattern**: User → Apps → Releases/Builds/Credentials

### Q: How are billing limits enforced?
**A**:
1. **Concurrent uploads**: Check KV for active uploads, reject if at plan limit (429)
2. **Queue priority**: Free → P3 (slow), Enterprise → P0 (fast)
3. **Bundle size**: Plan defines `max_bundle_size_mb`, checked in upload endpoint
4. **Monthly builds**: Tracked in `build_usage` table, checked before processing
5. **Hard stops**: Account suspension blocks all operations
**Evidence**: `packages/api/src/lib/upload-limits.ts:54-150` - comprehensive limit checking

---

## Framework: Hono + Drizzle

### Q: Why Hono over Express/Fastify?
**A**:
1. **Edge-first**: Designed for Workers/Deno/Bun, not Node.js
2. **Performance**: Minimal overhead, tree-based routing, ~30KB bundle
3. **Type safety**: Full TypeScript, type-safe context (`c.env`, `c.get()`)
4. **Native WebSocket**: Works with Durable Objects
**Evidence**: `packages/api/src/index.ts:99-291` - 30+ route registrations using Hono patterns
**Trade-offs**:
- Gain: Edge-optimized, small bundle, type-safe
- Lose: Smaller ecosystem than Express

### Q: Why Drizzle for ORM (auth only)?
**A**:
1. **Type safety**: Schema defines DB structure, queries type-checked at compile time
2. **Lightweight**: No runtime overhead, compiles to raw SQL
3. **Better-Auth integration**: Official Drizzle adapter
4. **D1 uses raw SQL**: Ad-hoc queries (`db.prepare().bind().first()`) sufficient for simple operations
**Evidence**: `packages/api/src/lib/auth.ts:9-24` - Drizzle with Better-Auth adapter
**Why not for D1**: Would add overhead for simple queries; main queries are straightforward

### Q: What patterns does Hono enable?
**A**:
1. **Middleware composition**: Ordered chain of `app.use()` calls
2. **Route groups with middleware**: `uploadsRoutes.use('*', apiKeyMiddleware)`
3. **Type-safe context**: `c.set('userId', user.id)` / `c.get('userId')`
4. **Global error handling**: `app.onError()` catches all exceptions
**Evidence**: `packages/api/src/index.ts:101-166` - middleware chaining

---

## Summary: Key Architectural Decisions

| Area | Choice | Why |
|------|--------|-----|
| Runtime | Cloudflare Workers | Edge presence, zero cold starts, integrated services |
| API Framework | Hono | Edge-first, minimal bundle, type-safe |
| Primary Database | D1 (SQLite) | Metadata, eventual consistency OK, easy backups |
| Auth Database | Neon (Postgres) | Better-Auth needs ACID transactions |
| Auth ORM | Drizzle | Type-safe, lightweight, Better-Auth integration |
| Bundle Storage | R2 | Large objects, CDN delivery, cost optimization |
| Rate Limiting | KV + Sliding Window | Distributed state, O(1) checks |
| Upload Processing | Queues (4 tiers) | Async, SLA differentiation, fair scheduling |
| Upload Status | Durable Objects + WebSocket | Real-time push, efficient vs polling |
| SDK Auth | API Keys (bcrypt) | Stateless, revocable, auditable |
| Dashboard Auth | Sessions (Better-Auth) | Standard web pattern, cookie security |
| Device Auth | Device Tokens (keyless) | No keys in binaries, device granularity |
| Validation | Zod | Runtime safety, detailed errors |
