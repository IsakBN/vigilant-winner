# API Native Detection Sub-Investigator

You investigate how native module changes are detected to block unsafe OTA updates.

## Reference Files

```
/Users/isaks_macbook/Desktop/Dev/codepush/packages/api/src/lib/native-deps/index.ts
/Users/isaks_macbook/Desktop/Dev/codepush/packages/api/src/lib/native-deps/types.ts
/Users/isaks_macbook/Desktop/Dev/codepush/packages/api/src/lib/native-deps/ios.ts
/Users/isaks_macbook/Desktop/Dev/codepush/packages/api/src/lib/native-deps/android.ts
/Users/isaks_macbook/Desktop/Dev/codepush/packages/api/src/lib/native-deps/common.ts
```

## What This Does

Native detection prevents OTA updates when native modules change:
- Detects added/removed/updated native packages
- Compares package.json between releases
- Fingerprints lock files (Podfile.lock, gradle.lockfile)
- Returns `requiresAppStoreUpdate: true` when blocked

## Decision (LOCKED)

**Strategy: STRICT**
- Block on ANY native package change
- Block on ANY lock file hash change
- No exceptions, no overrides

## Questions to Investigate

### Package Pattern Detection

```markdown
## Investigation: What patterns identify native packages?

**Read**: ios.ts and android.ts for pattern lists

**Document**:
| Pattern | Example Packages | Why Native |
|---------|------------------|------------|
| react-native-* | react-native-maps | Bridge code |
| @react-native-* | @react-native-community/netinfo | Scoped bridge |
| expo-* | expo-camera | Expo modules |
| [specific] | firebase, sentry | Known native |

**Questions**:
1. Are there patterns we're missing?
2. Any false positives (pure JS packages matching patterns)?
3. How do we handle new packages not in our list?
```

### Lock File Fingerprinting

```markdown
## Investigation: How do lock files detect transitive changes?

**Read**: common.ts for fingerprint building

**The Problem**:
Developer adds `some-library` which depends on `react-native-something`.
Package.json shows `some-library` but NOT `react-native-something`.
Only the lock file reveals the transitive native dependency.

**Document**:
| Lock File | Platform | What It Catches |
|-----------|----------|-----------------|
| Podfile.lock | iOS | CocoaPods native deps |
| gradle.lockfile | Android | Gradle native deps |
| package-lock.json | Both | npm transitive deps |
| yarn.lock | Both | Yarn transitive deps |
| pnpm-lock.yaml | Both | pnpm transitive deps |

**Questions**:
1. How do we fetch these files from GitHub?
2. What if lock file doesn't exist?
3. How do we handle monorepos with multiple lock files?
```

### API Response Flow

```markdown
## Investigation: How does the update check respond?

**Read**: /packages/api/src/routes/updates.ts

**Document the flow**:
1. SDK calls POST /v1/updates/check
2. API gets current release
3. API compares native fingerprints
4. If changed: return { requiresAppStoreUpdate: true, appStoreMessage: "..." }
5. If safe: return update info

**Questions**:
1. Where is min_version set when native changes detected?
2. How do we know which App Store version to require?
3. What message do we show users?
```

## Testing Requirements

- [ ] Detect added native package
- [ ] Detect removed native package
- [ ] Detect updated native package (version change)
- [ ] Detect transitive native dependency via lock file
- [ ] Handle missing lock file gracefully
- [ ] Handle first release (no baseline)
- [ ] Correct API response format
- [ ] Custom app store message works

## Output

Save to `.claude/knowledge/domains/api/native-detection.md`
