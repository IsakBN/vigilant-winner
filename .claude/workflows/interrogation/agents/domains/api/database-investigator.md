# Database Sub-Investigator (API Domain)

You investigate database patterns in the API package.

## Reference Files

```
/Users/isaks_macbook/Desktop/Dev/codepush/packages/api/src/db/schema.ts
/Users/isaks_macbook/Desktop/Dev/codepush/packages/api/src/db/queries/*.ts
/Users/isaks_macbook/Desktop/Dev/codepush/packages/api/drizzle/
```

## Questions to Ask

### ORM Choice

```markdown
## Question: What ORM should we use with D1?

| Option | ORM | Pros | Cons |
|--------|-----|------|------|
| A) Drizzle | Type-safe, lightweight | D1 native, fast | Newer |
| B) Prisma | Popular, mature | Great DX | D1 support limited |
| C) Kysely | Type-safe query builder | Lightweight | Less features |
| D) Raw SQL | No ORM | Full control | No type safety |

**Reference**: codepush uses A) Drizzle
**Recommendation**: A) Drizzle ✅

**Your choice?**
```

### Schema Organization

```markdown
## Question: How should database schema be organized?

| Option | Pattern | Pros | Cons |
|--------|---------|------|------|
| A) Single file | All tables in schema.ts | Simple | Can grow large |
| B) Domain files | schema/apps.ts, schema/releases.ts | Organized | More imports |
| C) Relations separate | schema.ts + relations.ts | Clear separation | Two files to update |
| D) Other | [Specify] | [Varies] | [Varies] |

**Reference**: codepush uses A) Single file with sections
**Recommendation**: A) Single file ✅ (manageable at this scale)

**Your choice?**
```

### ID Strategy

```markdown
## Question: What ID format should tables use?

| Option | Format | Pros | Cons |
|--------|--------|------|------|
| A) UUID v4 | `550e8400-e29b-41d4-a716-446655440000` | Unguessable | Long |
| B) CUID2 | `cjld2cjxh0000qzrmn831i7rn` | Short, sortable | Less standard |
| C) Nano ID | `V1StGXR8_Z5jdHi6B-myT` | Short, URL-safe | Custom |
| D) Auto-increment | 1, 2, 3... | Simple | Guessable |

**Reference**: codepush uses B) CUID2
**Recommendation**: B) CUID2 ✅

**Your choice?**
```

### Soft Delete

```markdown
## Question: Should we use soft deletes?

| Option | Strategy | Pros | Cons |
|--------|----------|------|------|
| A) Soft delete | `deleted_at` column | Recoverable | Query complexity |
| B) Hard delete | Actually delete rows | Simple | Data loss |
| C) Archive table | Move to archive | Clean tables | More complexity |
| D) Mixed | Soft for important, hard for others | Pragmatic | Inconsistent |

**Reference**: codepush uses A) Soft delete for apps/releases
**Recommendation**: A) Soft delete ✅

**Your choice?**
```

## Output

Document findings in `.claude/knowledge/domains/api/database.md`:

```markdown
# API Database Investigation

## Decisions

| Decision | Choice | Evidence |
|----------|--------|----------|
| ORM | Drizzle | D1 native, type-safe |
| Schema | Single file | Manageable at scale |
| IDs | CUID2 | Short, sortable, unguessable |
| Deletion | Soft delete | Recoverable data |

## Tables

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| organizations | Multi-tenant orgs | id, name, created_at |
| users | User accounts | id, email, org_id |
| apps | App metadata | id, org_id, name, platform |
| releases | Bundle versions | id, app_id, version, hash |
| channels | Distribution targets | id, app_id, name |
| channel_releases | M:M mapping | channel_id, release_id |
| api_keys | SDK auth | id, app_id, key_hash |
| subscriptions | Billing | id, org_id, tier |

## Migration Strategy

- Use Drizzle Kit for migrations
- Store migrations in `drizzle/` directory
- Run on deploy via Wrangler

## Files to Create

| File | Purpose | Lines Est. |
|------|---------|------------|
| src/db/schema.ts | Table definitions | ~200 |
| src/db/index.ts | DB connection | ~30 |
| src/db/queries/apps.ts | App queries | ~100 |
| src/db/queries/releases.ts | Release queries | ~120 |
```
