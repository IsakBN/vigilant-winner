# SDK Storage Sub-Investigator

You investigate bundle storage management in the SDK.

## Reference Files

```
/Users/isaks_macbook/Desktop/Dev/codepush/packages/sdk/src/storage.ts
/Users/isaks_macbook/Desktop/Dev/codepush/packages/sdk/src/bundle-manager.ts
/Users/isaks_macbook/Desktop/Dev/codepush/packages/sdk/src/file-utils.ts
```

## What This Does

Storage manages bundles on the device:
1. Where bundles are stored
2. How many versions to keep
3. Atomic update swapping
4. Cleanup of old bundles

## Questions to Ask

### Storage Location

```markdown
## Question: Where should bundles be stored on device?

**Context**: React Native has limited storage options.

| Option | Location | Pros | Cons |
|--------|----------|------|------|
| A) Documents directory | User-visible folder | Survives reinstall | User can delete |
| B) Library/Caches | System cache folder | Hidden, managed | May be cleared |
| C) Library/Application Support | App data folder | Hidden, persistent | Best choice |
| D) Configurable | Dev chooses | Flexible | More API surface |

**Reference**: codepush uses C) Library/Application Support
**Recommendation**: C) Library/Application Support ✅

**Your choice?**
```

### Atomic Updates

```markdown
## Question: How should bundle swapping be atomic?

**Context**: If swap fails mid-way, app could be broken.

| Option | Strategy | Pros | Cons |
|--------|----------|------|------|
| A) Rename-based | Download to temp, rename to active | Atomic on most FS | Need temp space |
| B) Symlink-based | Point symlink to new folder | Very atomic | Symlink support varies |
| C) Two-slot A/B | Active slot and pending slot | Cleanest | More storage |
| D) Copy-on-apply | Copy when applying | Simple | Slow for large bundles |

**Reference**: codepush uses A) Rename-based
**Recommendation**: A) Rename-based ✅

**Your choice?**
```

### Cleanup Strategy

```markdown
## Question: How should old bundles be cleaned up?

**Context**: Storage is limited on mobile devices.

| Option | Strategy | Pros | Cons |
|--------|----------|------|------|
| A) Keep last N | Keep 3 most recent | Predictable | Might keep bad ones |
| B) Keep last successful | Keep bundles that ran without crash | Smarter | More tracking |
| C) Manual cleanup | Dev calls cleanup() | Full control | Easy to forget |
| D) Time-based | Delete after 7 days | Auto cleanup | Might delete good ones |

**Reference**: codepush uses B) Keep last successful + A) Keep last 3
**Recommendation**: B) Keep last successful ✅

**Your choice?**
```

## Testing Requirements

- [ ] Bundle saved to correct location
- [ ] Bundle swap is atomic (power loss safe)
- [ ] Old bundles cleaned up correctly
- [ ] Storage space calculated accurately
- [ ] Works on iOS and Android
- [ ] Handles disk full gracefully

## Output

Save to `.claude/knowledge/domains/sdk/storage.md`
