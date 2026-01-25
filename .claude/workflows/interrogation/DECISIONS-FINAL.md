# BundleNudge - Final Decisions

These decisions were made through discussion and are now locked for implementation.

---

## Decision 1: Native Module Detection

**Decision: STRICT**

Block OTA updates on ANY native module change:
- New native package added → Block
- Native package removed → Block
- Native package version changed (any change) → Block
- Lock file hash changed (Podfile.lock, gradle.lockfile) → Block

**Implementation:**
- Level 1: Package.json diff analysis
- Level 2: Lock file fingerprinting
- Response: `requiresAppStoreUpdate: true` with custom message

**Rationale:** Safety first. A single missed native change = crashed apps for all users.

---

## Decision 2: Route-Based Rollback (Team/Enterprise)

**Decision: DASHBOARD + SDK (Option C)**

1. SDK auto-tracks all network calls made by the app
2. Dashboard displays observed routes (like Postman UI)
3. Developer marks critical routes in dashboard
4. On update check, API sends critical route config to SDK
5. SDK monitors those routes after update applies
6. If critical route fails → immediate rollback
7. Keep previous bundle until all critical routes succeed

**Tier Behavior:**
| Tier | Rollback Trigger |
|------|------------------|
| Free | 3 crashes in 60s |
| Pro | 3 crashes in 60s |
| Team | Event-based (critical routes) |
| Enterprise | Event-based (critical routes) |

---

## Decision 3: Verification Window

**Decision: WAIT FOR ALL ROUTES (Option C) + Timeout**

- Wait until all critical routes are called successfully, OR
- 5 minute timeout (whichever comes first)
- If timeout reached: mark as "unverified" (don't rollback, but track)
- If any critical route fails: immediate rollback

**Rationale:** Most accurate verification, with safety net for edge cases.

---

## Decision 4: GitHub Integration

**Decision: GITHUB ACTION ONLY (Option A)**

MVP ships with official GitHub Action:
```yaml
- uses: bundlenudge/upload-action@v1
  with:
    api-key: ${{ secrets.BUNDLENUDGE_API_KEY }}
    bundle-path: ./bundle.js
    version: ${{ github.sha }}
```

CLI can be added later if customers request it.

---

## Decision 5: Hermes vs JSC Support

**Decision: AUTO-DETECT (Option A)**

SDK automatically detects bundle type:
- Hermes bytecode: Magic bytes `HBC` at start
- Plain JavaScript: No magic bytes

No developer configuration needed. Works with any React Native version.

---

## Decision 6: Bundle Encryption

**Decision: YES, with App ID validation**

```
Upload: bundle.js → encrypt(bundle, appSecret) → R2
Download: R2 → SDK validates appId → decrypt → apply
```

- Each app has unique `appSecret`
- `appSecret` embedded in native code (not JS)
- Different from API key (API key = auth, appSecret = decryption)
- App ID must match for decryption to succeed

---

## Decision 7: Source Maps

**Decision: SERVER-SIDE ONLY**

- Source maps uploaded alongside bundle
- Stored in R2 (private, never served to devices)
- Used server-side for crash report decoding
- Integration with Sentry/Crashlytics via API

**Security:** Source maps expose code structure. Never expose to devices.

---

## Decision 8: Native Module Compatibility

**Decision: COMPATIBLE WITH ALL**

BundleNudge works with ANY native modules:
- We only update the JS bundle
- We don't touch native code
- Detection prevents OTA when native changes
- Works with: Firebase, Sentry, Maps, Camera, etc.

---

## Decision 9: React Native Engine Support

**Decision: BOTH HERMES AND JSC**

| Engine | React Native Version | Bundle Type |
|--------|---------------------|-------------|
| Hermes | 0.70+ (default) | Bytecode |
| JSC | Older versions | Plain JS |

Auto-detection handles both. No configuration needed.

---

## Priority Order

### MVP (Phase 1) - Must Ship
1. OTA Updates (core value)
2. Automatic Rollback (crash-based for all, route-based for Team+)
3. Native Module Detection (strict)
4. Health Monitoring (visibility)
5. Basic Dashboard (usability)
6. Bundle Encryption
7. Hash Verification
8. Atomic Storage

### P1 (Phase 2) - Ship Soon
9. Multi-Channel Releases (beta, production, staging)
10. Delta Updates (bandwidth optimization)
11. Rate Limiting (security)
12. Source Map Integration (Sentry/Crashlytics)

### P2 (Phase 3) - Nice to Have
13. A/B Testing
14. Gradual Rollout (percentage-based)
15. Team Management
16. Advanced Analytics
17. CLI Tool

---

## Critical Feature Confidence Gates

Build workflow STOPS at these gates requiring `/approve`:

| Gate | Feature | Confidence Required |
|------|---------|---------------------|
| `rollback` | Crash-based + route-based rollback | 10/10 |
| `native-detection` | Native module detection | 10/10 |
| `storage` | Atomic storage operations | 10/10 |
| `integrity` | Hash verification + encryption | 10/10 |
| `updater` | Update check + download + apply | 10/10 |
| `health` | Health monitoring + auto-disable | 8/10 |
| `api` | All API endpoints | 9/10 |
| `dashboard` | Dashboard UI | 8/10 |
| `e2e` | Full end-to-end flow | 10/10 |

---

## Test Requirements Summary

Each critical feature needs:
- [ ] Unit tests (100% coverage for critical paths)
- [ ] Integration tests (all flows)
- [ ] Edge case tests (per decision tables)
- [ ] Load tests (API endpoints)
- [ ] Manual device tests (iOS + Android)
- [ ] Chaos tests (network failure, storage corruption)

---

**Document Status: FINAL**
**Last Updated: Based on user discussion**
**Ready for: Interrogation and Build phases**
