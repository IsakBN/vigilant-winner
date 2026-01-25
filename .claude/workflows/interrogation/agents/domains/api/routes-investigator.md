# Routes Sub-Investigator (API Domain)

You investigate API route patterns in the API package.

## Reference Files

```
/Users/isaks_macbook/Desktop/Dev/codepush/packages/api/src/routes/*.ts
```

## Questions to Ask

### Route Organization

```markdown
## Question: How should routes be organized?

| Option | Pattern | Example | Notes |
|--------|---------|---------|-------|
| A) Resource CRUD | /apps, /apps/:id | RESTful | Standard |
| B) Action-based | /apps/create, /apps/get | RPC-style | More explicit |
| C) Nested resources | /apps/:id/releases/:rid | Full hierarchy | More URLs |
| D) Flat with params | /releases?appId=X | Query-based | Flexible |

**Reference**: codepush uses A) Resource CRUD with some nesting
**Recommendation**: A) Resource CRUD ✅

**Your choice?**
```

### Response Format

```markdown
## Question: What response envelope should we use?

| Option | Format | Pros | Cons |
|--------|--------|------|------|
| A) Direct | `{ id, name, ... }` | Simple | No metadata |
| B) Envelope | `{ data: {...}, meta: {...} }` | Extensible | Verbose |
| C) Paginated | `{ items: [...], cursor, total }` | Good for lists | Overkill for single |
| D) Mixed | Direct for single, envelope for lists | Best of both | Inconsistent |

**Reference**: codepush uses D) Mixed
**Recommendation**: D) Mixed ✅

**Your choice?**
```

### Error Response Format

```markdown
## Question: How should errors be returned?

| Option | Format | Pros | Cons |
|--------|--------|------|------|
| A) Simple | `{ error: "message" }` | Easy to use | No details |
| B) Detailed | `{ error: { code, message, details } }` | Debuggable | More complex |
| C) RFC 7807 | `{ type, title, status, detail }` | Standard | Overhead |
| D) Other | [Specify] | [Varies] | [Varies] |

**Reference**: codepush uses B) Detailed with error codes
**Recommendation**: B) Detailed ✅

**Your choice?**
```

### Pagination Strategy

```markdown
## Question: How should list endpoints paginate?

| Option | Method | Pros | Cons |
|--------|--------|------|------|
| A) Cursor-based | `?cursor=abc123` | No skip issues | Can't jump pages |
| B) Offset-based | `?page=2&limit=20` | Jump to page | Skip issues at scale |
| C) Keyset | `?after_id=123` | Stable, efficient | Needs sortable key |
| D) Other | [Specify] | [Varies] | [Varies] |

**Reference**: codepush uses A) Cursor-based
**Recommendation**: A) Cursor-based ✅

**Your choice?**
```

## Output

Document findings in `.claude/knowledge/domains/api/routes.md`:

```markdown
# API Routes Investigation

## Decisions

| Decision | Choice | Evidence |
|----------|--------|----------|
| Organization | Resource CRUD | RESTful, standard |
| Response | Mixed (direct single, envelope list) | Pragmatic |
| Errors | Detailed with codes | Debugging support |
| Pagination | Cursor-based | Scalable |

## Route Map

| Method | Path | Purpose | Auth |
|--------|------|---------|------|
| GET | /apps | List apps | JWT |
| POST | /apps | Create app | JWT |
| GET | /apps/:id | Get app | JWT |
| PUT | /apps/:id | Update app | JWT |
| DELETE | /apps/:id | Delete app | JWT |
| GET | /apps/:id/releases | List releases | JWT |
| POST | /apps/:id/releases | Create release | JWT |
| GET | /v1/updates/check | Check for update | API Key |
| POST | /v1/health/report | Report health | API Key |

## Files to Create

| File | Purpose | Lines Est. |
|------|---------|------------|
| src/routes/apps.ts | App CRUD | ~150 |
| src/routes/releases.ts | Release management | ~200 |
| src/routes/channels.ts | Channel management | ~120 |
| src/routes/updates.ts | SDK update check | ~80 |
| src/routes/uploads.ts | Bundle upload | ~150 |
```
