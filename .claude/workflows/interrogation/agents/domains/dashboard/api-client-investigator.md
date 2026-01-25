# Dashboard API Client Sub-Investigator

You investigate how the dashboard communicates with the API.

## Reference Files

```
/Users/isaks_macbook/Desktop/Dev/codepush/packages/dashboard-v2/src/lib/api/
/Users/isaks_macbook/Desktop/Dev/codepush/packages/dashboard-v2/src/hooks/
```

## What This Does

The API client handles:
- Fetching data from the backend
- Mutations (create, update, delete)
- Error handling
- Token refresh

## Questions to Ask

### Fetching Strategy

```markdown
## Question: How should API data be fetched and cached?

**Context**: Dashboard needs to display data from many endpoints.

| Option | Library | Pros | Cons |
|--------|---------|------|------|
| A) TanStack Query | Server state, caching, refetch | Best for API data | Learning curve |
| B) SWR | Vercel's fetching | Simple, good for Next | Less features |
| C) React Context | Built-in | No deps | Manual caching |
| D) Redux Toolkit Query | RTK ecosystem | If using Redux | Heavy |

**Reference**: codepush uses A) TanStack Query
**Recommendation**: A) TanStack Query ✅

**Your choice?**
```

### Type Safety

```markdown
## Question: How should API calls be typed?

**Context**: Type safety prevents bugs at compile time.

| Option | Approach | Pros | Cons |
|--------|----------|------|------|
| A) Manual types | Define types matching API | Full control | Can drift from API |
| B) Shared types | Import from @bundlenudge/shared | Single source | Need to keep in sync |
| C) Generated | Generate from OpenAPI spec | Always in sync | Spec maintenance |
| D) Any/unknown | No types | Fast | No safety |

**Reference**: codepush uses B) Shared types from @bundlenudge/shared
**Recommendation**: B) Shared types ✅

**Your choice?**
```

### Error Handling

```markdown
## Question: How should API errors be handled?

**Context**: Users need clear feedback when things fail.

| Option | Pattern | Pros | Cons |
|--------|---------|------|------|
| A) Toast notifications | Show toast on error | Non-blocking | Can miss |
| B) Inline errors | Show error in component | Clear context | More code |
| C) Error boundary | Catch and show error page | Catches all | Loses context |
| D) Combination | Toast + inline for forms | Best UX | More complexity |

**Reference**: codepush uses D) Combination
**Recommendation**: D) Combination ✅

**Your choice?**
```

## Testing Requirements

- [ ] API calls include auth token
- [ ] Token refresh works when expired
- [ ] Errors display correctly
- [ ] Loading states show during fetch
- [ ] Mutations invalidate related queries
- [ ] Offline handling is graceful

## Output

Save to `.claude/knowledge/domains/dashboard/api-client.md`
