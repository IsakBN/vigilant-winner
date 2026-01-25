# @bundlenudge/api

## Purpose

Cloudflare Workers REST API for BundleNudge. Handles all backend operations including app management, release deployment, update checks, upload processing via priority queues, and real-time status via Durable Objects.

## Reference

```
/Users/isaks_macbook/Desktop/Dev/codepush/packages/api
```

## Tech Stack

- Cloudflare Workers (runtime)
- Hono.js (routing)
- Drizzle ORM (database)
- Zod (validation)
- Vitest (testing)

## Cloudflare Bindings

| Binding | Type | Purpose |
|---------|------|---------|
| DB | D1 | SQLite database |
| BUNDLES | R2 | Bundle storage |
| RATE_LIMITS | KV | Rate limiting |
| CACHE | KV | Response caching |
| UPLOAD_QUEUE_P0 | Queue | Enterprise uploads |
| UPLOAD_QUEUE_P1 | Queue | Team uploads |
| UPLOAD_QUEUE_P2 | Queue | Pro uploads |
| UPLOAD_QUEUE_P3 | Queue | Free uploads |
| UPLOAD_STATUS | DurableObject | WebSocket status |
| ANALYTICS | AnalyticsEngine | Telemetry |

## Directory Structure

```
packages/api/
├── src/
│   ├── index.ts              # Hono app entry, < 100 lines
│   ├── types.ts              # Env and binding types
│   ├── routes/
│   │   ├── apps.ts           # App CRUD
│   │   ├── apps.test.ts
│   │   ├── releases.ts       # Release management
│   │   ├── releases.test.ts
│   │   ├── channels.ts       # Channel management
│   │   ├── updates.ts        # Update check endpoint
│   │   ├── uploads.ts        # Upload handling
│   │   └── webhooks.ts       # GitHub webhooks
│   ├── middleware/
│   │   ├── auth.ts           # JWT/API key auth
│   │   ├── rateLimit.ts      # Rate limiting
│   │   ├── cors.ts           # CORS handling
│   │   └── error.ts          # Error handling
│   ├── lib/
│   │   ├── jwt.ts            # Token operations
│   │   ├── encryption.ts     # Encryption utils
│   │   ├── storage.ts        # R2 operations
│   │   ├── queue.ts          # Queue routing
│   │   └── tiers.ts          # Tier limit checks
│   ├── db/
│   │   ├── schema.ts         # Drizzle schema
│   │   ├── queries/          # Query functions
│   │   └── migrations/       # DB migrations
│   └── durable-objects/
│       └── upload-status.ts  # WebSocket DO
├── wrangler.toml             # Worker config
├── package.json
└── CLAUDE.md
```

## DO's

### Code Style

- Max 250 lines per file
- Max 50 lines per function
- Named exports only
- Zod for all validation
- Explicit error handling

### Patterns

```typescript
// ✅ Route handler structure
export const appsRoutes = new Hono<Env>()
  .get('/', listApps)
  .get('/:id', getApp)
  .post('/', createApp)
  .patch('/:id', updateApp)
  .delete('/:id', deleteApp);

// ✅ Handler function
async function listApps(c: Context<Env>) {
  const user = c.get('user');
  const apps = await getAppsForUser(c.env.DB, user.id);
  return c.json({ apps });
}

// ✅ Validation
const CreateAppSchema = z.object({
  name: z.string().min(1).max(100),
  platform: z.enum(['ios', 'android']),
});

// ✅ Error handling
if (!app) {
  throw new HTTPException(404, { message: 'App not found' });
}

// ✅ Queue routing by tier
const queue = getQueueForTier(c.env, user.tier);
await queue.send({ jobId, userId: user.id });
```

## DON'Ts

### Never

- No `any` types
- No raw SQL (use Drizzle)
- No default exports
- No `console.log`
- No silent catches
- No hardcoded secrets

### Avoid

```typescript
// ❌ Inline SQL
await db.run(`SELECT * FROM apps WHERE id = ${id}`);

// ❌ Business logic in route handler
app.get('/apps/:id', async (c) => {
  // 200 lines of logic...
});

// ❌ Catching and swallowing
try { ... } catch { return c.json({ error: 'Error' }); }

// ❌ Hardcoded limits
if (apps.length >= 5) { ... }
```

## Key Files

| File | Purpose |
|------|---------|
| `src/index.ts` | Hono app setup |
| `src/routes/updates.ts` | SDK update check endpoint |
| `src/routes/uploads.ts` | Upload handling + queue routing |
| `src/lib/queue.ts` | Priority queue selection |
| `src/lib/tiers.ts` | Tier limit enforcement |
| `src/db/schema.ts` | All D1 tables |
| `src/durable-objects/upload-status.ts` | WebSocket status |

## Commands

```bash
# Development
pnpm --filter @bundlenudge/api dev

# Deploy
pnpm --filter @bundlenudge/api deploy

# Generate types
pnpm --filter @bundlenudge/api generate-types
```

## Dependencies

- `@bundlenudge/shared` - Types and schemas
- `hono` - Web framework
- `drizzle-orm` - Database ORM
- `zod` - Validation

## Testing

- Framework: Vitest
- Use Hono's `app.request()` for route testing
- Mock Cloudflare bindings with miniflare

## Notes

- Largest package (~165 iterations)
- Queue routing is critical for billing
- Rate limiting fails CLOSED (deny on error)
- All responses use shared schemas
