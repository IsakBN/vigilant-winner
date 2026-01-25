# Middleware Sub-Investigator (API Domain)

You investigate middleware patterns in the API package.

## Reference Files

```
/Users/isaks_macbook/Desktop/Dev/codepush/packages/api/src/middleware/*.ts
/Users/isaks_macbook/Desktop/Dev/codepush/packages/api/src/index.ts
```

## Questions to Ask

### Middleware Stack Order

```markdown
## Question: What middleware order should we use?

**Context**: Order affects security and performance.

| Position | Middleware | Purpose |
|----------|------------|---------|
| 1 | CORS | Cross-origin requests |
| 2 | Rate Limit | Prevent abuse |
| 3 | Auth | Validate identity |
| 4 | Metrics | Track usage |
| 5 | Error Handler | Catch exceptions |

**Reference**: codepush uses this exact order
**Recommendation**: Keep this order ✅

**Agree with this order?** [Y/N or suggest changes]
```

### Rate Limiting Strategy

```markdown
## Question: How should rate limiting work?

| Option | Strategy | Pros | Cons |
|--------|----------|------|------|
| A) Per IP | Limit by IP address | Simple | Shared IPs hit limit |
| B) Per API key | Limit by key | Fair for apps | Needs key first |
| C) Tiered | Different limits per tier | Fair billing | More complex |
| D) Combination | IP for anon, key for auth | Best of both | Most complex |

**Reference**: codepush uses D) Combination with tier multipliers
**Recommendation**: D) Combination ✅

**Your choice?**
```

### Rate Limit Values

```markdown
## Question: What rate limits per tier?

| Tier | SDK Updates/min | API Requests/min | Notes |
|------|-----------------|------------------|-------|
| Free | 60 | 100 | Basic |
| Pro | 300 | 500 | 5x |
| Team | 1000 | 2000 | 20x |
| Enterprise | Unlimited | Unlimited | No limits |

**Reference**: codepush uses similar values
**Recommendation**: Use these values ✅

**Agree?** [Y/N or suggest changes]
```

### Error Handling

```markdown
## Question: How should middleware errors be handled?

| Option | Pattern | Pros | Cons |
|--------|---------|------|------|
| A) HTTPException | Throw and catch in handler | Hono standard | Need central handler |
| B) Early return | Return error response directly | Simple | Scattered handling |
| C) Result type | Return Result<T, Error> | Type-safe | Verbose |
| D) Other | [Specify] | [Varies] | [Varies] |

**Reference**: codepush uses A) HTTPException
**Recommendation**: A) HTTPException ✅

**Your choice?**
```

## Output

Document findings in `.claude/knowledge/domains/api/middleware.md`:

```markdown
# API Middleware Investigation

## Decisions

| Decision | Choice | Evidence |
|----------|--------|----------|
| Order | CORS → Rate → Auth → Metrics → Error | Security first |
| Rate limiting | Tiered + IP fallback | Fair for all |
| Errors | HTTPException | Hono standard |

## Middleware Files

| File | Purpose | Lines Est. |
|------|---------|------------|
| src/middleware/cors.ts | CORS handling | ~30 |
| src/middleware/rate-limit.ts | Rate limiting | ~80 |
| src/middleware/auth.ts | JWT/API key auth | ~100 |
| src/middleware/metrics.ts | Usage tracking | ~50 |
| src/middleware/error.ts | Error handling | ~60 |

## Rate Limit Implementation

- Use KV for counter storage
- Key format: `rate:{type}:{identifier}:{window}`
- Window: 60 seconds
- Return `X-RateLimit-*` headers
```
