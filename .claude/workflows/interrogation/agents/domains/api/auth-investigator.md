# Auth Sub-Investigator (API Domain)

You investigate authentication patterns in the API package.

## Reference Files

```
/Users/isaks_macbook/Desktop/Dev/codepush/packages/api/src/middleware/auth.ts
/Users/isaks_macbook/Desktop/Dev/codepush/packages/api/src/middleware/api-key.ts
/Users/isaks_macbook/Desktop/Dev/codepush/packages/api/src/lib/jwt.ts
/Users/isaks_macbook/Desktop/Dev/codepush/packages/api/src/lib/api-key.ts
```

## Questions to Ask

### JWT Configuration

```markdown
## Question: What JWT settings should we use?

| Option | Access Token | Refresh Token | Notes |
|--------|--------------|---------------|-------|
| A) Short-lived | 15 min | 7 days | More secure, more refreshes |
| B) Medium-lived | 1 hour | 30 days | Balance |
| C) Long-lived | 24 hours | 90 days | Fewer refreshes, less secure |
| D) Other | [Specify] | [Specify] | [Custom] |

**Reference**: codepush uses 15 min access / 7 day refresh
**Recommendation**: A) Short-lived ✅

**Your choice?**
```

### API Key Storage

```markdown
## Question: How should API keys be stored?

| Option | Storage | Pros | Cons |
|--------|---------|------|------|
| A) Hashed (SHA-256) | One-way hash | Can't be leaked | Can't display full key |
| B) Encrypted (AES) | Reversible encryption | Can show key once | Key management |
| C) Prefix + hash | Show prefix, hash rest | Best of both | More complex |
| D) Plain | Store as-is | Simple | Security risk |

**Reference**: codepush uses C) Prefix + hash
**Recommendation**: C) Prefix + hash ✅

**Your choice?**
```

### SDK vs Dashboard Auth

```markdown
## Question: Should SDK and Dashboard use the same auth system?

| Option | Approach | Pros | Cons |
|--------|----------|------|------|
| A) Separate | API keys for SDK, JWT for Dashboard | Clear separation | Two systems |
| B) Unified | Same token system for both | Simpler | Less flexibility |
| C) API key for both | Everything uses API keys | Simple | Less secure for users |
| D) Other | [Specify] | [Varies] | [Varies] |

**Reference**: codepush uses A) Separate
**Recommendation**: A) Separate ✅

**Your choice?**
```

## Output

Document findings in `.claude/knowledge/domains/api/auth.md`:

```markdown
# API Auth Investigation

## Decisions

| Decision | Choice | Evidence |
|----------|--------|----------|
| JWT lifetime | 15 min access, 7 day refresh | Security best practice |
| API key storage | Prefix + hash | bn_1234...5678 visible, rest hashed |
| Auth separation | SDK uses API keys, Dashboard uses JWT | Different use cases |

## Implementation Notes

- JWT signed with HS256 using JWT_SECRET
- API keys prefixed with `bn_` for identification
- Refresh token rotation on each use
- API key scoped to app (one key per app)

## Files to Create

| File | Purpose |
|------|---------|
| src/middleware/auth.ts | JWT validation middleware |
| src/middleware/api-key.ts | API key validation middleware |
| src/lib/jwt.ts | JWT utilities (sign, verify, refresh) |
| src/lib/api-key.ts | API key utilities (generate, hash, verify) |
```
