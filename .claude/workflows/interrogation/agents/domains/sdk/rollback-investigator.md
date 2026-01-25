# SDK Rollback Sub-Investigator

You investigate crash detection and rollback logic in the SDK.

## Reference Files

```
/Users/isaks_macbook/Desktop/Dev/codepush/packages/sdk/src/rollback.ts
/Users/isaks_macbook/Desktop/Dev/codepush/packages/sdk/src/health.ts
/Users/isaks_macbook/Desktop/Dev/codepush/packages/sdk/src/crash-detector.ts
```

## What This Does

Rollback is CRITICAL for safety. If an update causes crashes:
1. SDK detects crash pattern
2. SDK reverts to previous bundle
3. SDK reports rollback to API
4. Prevents crash loops

## Questions to Ask

### Crash Detection

```markdown
## Question: How should crashes be detected?

**Context**: We need to know if an update is causing problems.

| Option | Detection Method | Pros | Cons |
|--------|------------------|------|------|
| A) Consecutive crash count | 3 crashes in 60s → rollback | Simple | Might miss some |
| B) Health heartbeat | App reports healthy periodically | Comprehensive | Needs timer |
| C) Session success flag | Mark session as successful | Explicit | Dev must call |
| D) Combination | Heartbeat + crash count | Best coverage | More complex |

**Reference**: codepush uses D) Combination
**Recommendation**: D) Combination ✅

**Your choice?**
```

### Rollback Depth

```markdown
## Question: How many versions back can we rollback?

**Context**: Sometimes the previous version also has issues.

| Option | Depth | Pros | Cons |
|--------|-------|------|------|
| A) One version | Previous only | Simple, small storage | Limited recovery |
| B) Two versions | Previous + one before | More safety | More storage |
| C) Original only | Back to app store version | Always works | May be very old |
| D) Configurable | Dev chooses depth | Flexible | Complexity |

**Reference**: codepush keeps 2 versions + original
**Recommendation**: B) Two versions ✅

**Your choice?**
```

### Rollback Reporting

```markdown
## Question: Should rollbacks be reported to the API?

**Context**: Knowing rollback rates helps identify bad releases.

| Option | Reporting | Pros | Cons |
|--------|-----------|------|------|
| A) Always report | Every rollback → API | Full visibility | Network needed |
| B) Report on reconnect | Queue if offline | Reliable | Delayed |
| C) Don't report | Local only | Simpler | No visibility |
| D) Optional | Configurable | Flexible | More config |

**Reference**: codepush uses B) Report on reconnect
**Recommendation**: B) Report on reconnect ✅

**Your choice?**
```

## Testing Requirements

- [ ] Crash detected after 3 consecutive crashes
- [ ] Health heartbeat stops → rollback triggers
- [ ] Rollback reverts to previous bundle correctly
- [ ] Rollback works when offline
- [ ] Rollback reported when back online
- [ ] Original bundle always available as fallback
- [ ] Crash loop protection prevents infinite restart

## Output

Save to `.claude/knowledge/domains/sdk/rollback.md`
