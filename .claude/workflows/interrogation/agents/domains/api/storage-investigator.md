# Storage Sub-Investigator (API Domain)

You investigate R2 storage patterns in the API package.

## Reference Files

```
/Users/isaks_macbook/Desktop/Dev/codepush/packages/api/src/lib/storage.ts
/Users/isaks_macbook/Desktop/Dev/codepush/packages/api/src/lib/r2.ts
/Users/isaks_macbook/Desktop/Dev/codepush/packages/api/src/routes/uploads.ts
```

## Questions to Ask

### R2 Path Convention

```markdown
## Question: How should R2 paths be structured?

| Option | Pattern | Pros | Cons |
|--------|---------|------|------|
| A) Flat | `{releaseId}/bundle.js` | Simple | No org isolation |
| B) Org-based | `{orgId}/{appId}/{releaseId}/bundle.js` | Full isolation | Longer paths |
| C) App-based | `{appId}/{releaseId}/bundle.js` | App isolation | No org prefix |
| D) Other | [Specify] | [Varies] | [Varies] |

**Reference**: codepush uses C) App-based
**Recommendation**: C) App-based ✅

**Your choice?**
```

### Upload Strategy

```markdown
## Question: How should bundle uploads work?

| Option | Method | Pros | Cons |
|--------|--------|------|------|
| A) Presigned URL | Client uploads directly to R2 | Scalable | Two-step process |
| B) Through API | Upload to API, API writes to R2 | Simple | API bottleneck |
| C) Multipart | Chunked upload with resume | Reliable | Complex |
| D) Other | [Specify] | [Varies] | [Varies] |

**Reference**: codepush uses A) Presigned URL
**Recommendation**: A) Presigned URL ✅

**Your choice?**
```

### Download Strategy

```markdown
## Question: How should bundle downloads work?

| Option | Method | Pros | Cons |
|--------|--------|------|------|
| A) Presigned URL | Direct from R2 | Fast, CDN-able | URL management |
| B) Through API | API proxies download | Control | API bottleneck |
| C) Public bucket | Public read access | Simple | No access control |
| D) Custom domain | R2 with custom domain | Branded | Setup required |

**Reference**: codepush uses A) Presigned URL
**Recommendation**: A) Presigned URL ✅

**Your choice?**
```

### Source Map Handling

```markdown
## Question: How should source maps be stored?

| Option | Location | Access | Notes |
|--------|----------|--------|-------|
| A) Same bucket, restricted | `{appId}/{releaseId}/bundle.js.map` | Auth required | Secure |
| B) Separate bucket | `sourcemaps/{appId}/{releaseId}/` | More isolated | Two buckets |
| C) Same as bundle | With bundle file | Simple | Potentially exposed |
| D) Not stored | Don't upload source maps | Simplest | No debugging |

**Reference**: codepush uses A) Same bucket, restricted access
**Recommendation**: A) Same bucket, restricted ✅

**Your choice?**
```

## Output

Document findings in `.claude/knowledge/domains/api/storage.md`:

```markdown
# API Storage Investigation

## Decisions

| Decision | Choice | Evidence |
|----------|--------|----------|
| Path convention | `{appId}/{releaseId}/bundle.js` | App-based isolation |
| Upload | Presigned URLs | Scalable |
| Download | Presigned URLs | Fast, CDN-ready |
| Source maps | Same bucket, auth required | Secure |

## R2 Structure

```
bundles/
├── {appId}/
│   ├── {releaseId}/
│   │   ├── bundle.js
│   │   ├── bundle.js.map
│   │   └── metadata.json
│   └── {releaseId2}/
│       └── ...
└── pending/
    └── {uploadJobId}/
        └── bundle.js
```

## Files to Create

| File | Purpose | Lines Est. |
|------|---------|------------|
| src/lib/storage.ts | R2 operations | ~150 |
| src/lib/presigned.ts | URL generation | ~80 |
| src/routes/uploads.ts | Upload handling | ~150 |
```
