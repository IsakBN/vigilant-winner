# SDK Updater Sub-Investigator

You investigate the core update checking and applying logic in the SDK.

## Reference Files

```
/Users/isaks_macbook/Desktop/Dev/codepush/packages/sdk/src/updater.ts
/Users/isaks_macbook/Desktop/Dev/codepush/packages/sdk/src/updater-types.ts
/Users/isaks_macbook/Desktop/Dev/codepush/packages/sdk/src/downloader.ts
```

## What This Does

The updater is the HEART of the SDK. It:
1. Checks the API for available updates
2. Downloads new bundles
3. Applies updates (immediate or on restart)
4. Handles version comparison

## Questions to Ask

### Check Frequency

```markdown
## Question: How often should the SDK check for updates?

**Context**: Too frequent = battery drain. Too rare = delayed updates.

| Option | Frequency | Pros | Cons |
|--------|-----------|------|------|
| A) On app launch only | Once per session | Battery friendly | Missed updates |
| B) Configurable interval | Dev chooses (default: 5 min) | Flexible | Complexity |
| C) Background fetch | OS-scheduled | Always fresh | Platform-specific |
| D) Manual only | Dev calls explicitly | Full control | Easy to forget |

**Reference**: codepush uses B) Configurable with 5 min default
**Recommendation**: B) Configurable ✅

**Your choice?**
```

### Download Strategy

```markdown
## Question: How should bundle downloads work?

**Context**: Bundles can be 5-50MB. Network can be unreliable.

| Option | Strategy | Pros | Cons |
|--------|----------|------|------|
| A) Full download with resume | Range headers for resume | Reliable | More code |
| B) Chunked streaming | Stream to disk | Memory efficient | Complex |
| C) Simple fetch | One request | Simple | Fails on disconnect |
| D) Progressive (diff first) | Try diff, fallback to full | Smallest download | Two paths |

**Reference**: codepush uses A) with Range header support
**Recommendation**: A) Full download with resume ✅

**Your choice?**
```

### Apply Strategy

```markdown
## Question: When should updates be applied?

**Context**: Applying too aggressively can interrupt users.

| Option | When | UX Impact | Reliability |
|--------|------|-----------|-------------|
| A) On restart only | Next app launch | Non-disruptive | May delay |
| B) Immediate (reload) | Now | Disruptive | Instant |
| C) Background + restart | Download bg, apply on restart | Best balance | Recommended |
| D) Developer choice | configurable | Flexible | More API surface |

**Reference**: codepush uses D) with InstallMode enum
**Recommendation**: D) Developer choice ✅

**Your choice?**
```

## Testing Requirements

After implementation, test:
- [ ] Check returns correct update info
- [ ] Check returns 204 when no update
- [ ] Download resumes after disconnect
- [ ] Download verifies hash integrity
- [ ] Apply on restart works
- [ ] Immediate apply works
- [ ] Version comparison is correct (semver)

## Output

Save to `.claude/knowledge/domains/sdk/updater.md`
