# BundleNudge - Product Overview

> **The open-source CodePush alternative for React Native**

---

## What is BundleNudge?

BundleNudge is a complete OTA (Over-The-Air) update platform for React Native apps. Ship JavaScript updates instantly without going through the app stores. Built as an open-source alternative to Microsoft's discontinued CodePush.

---

## Core Value Propositions

### 1. **Instant Updates**
Push bug fixes and features to users in minutes, not days. No app store review required for JavaScript changes.

### 2. **Smart & Safe**
Automatic crash detection with instant rollback. A/B test new features before full rollout.

### 3. **Open Source**
Self-host on Cloudflare Workers or use our managed service. No vendor lock-in.

### 4. **Built for Scale**
Edge-deployed globally via Cloudflare. Delta updates minimize bandwidth. Handles millions of devices.

---

## Feature Overview

### 🚀 OTA Updates

| Feature | Description |
|---------|-------------|
| **Instant Deployment** | Push JS bundle updates directly to devices |
| **Delta Updates** | Only download changed modules (up to 90% smaller) |
| **Hash Verification** | SHA-256 integrity checks on all bundles |
| **Offline Support** | Updates cached locally, apply on next launch |
| **Version Tracking** | Current, pending, and previous versions stored |

**How it works:**
1. SDK checks for updates on app launch
2. If available, downloads bundle (or delta patch)
3. Verifies hash integrity
4. Applies on next app restart
5. Reports success/failure to server

---

### 🧪 A/B Testing

| Feature | Description |
|---------|-------------|
| **Variant Assignment** | Deterministic device-to-variant mapping |
| **Multiple Variants** | Control group + unlimited test variants |
| **Percentage Allocation** | Fine-grained traffic splitting |
| **Consistent Experience** | Same device always gets same variant |
| **Rich Metrics** | Sessions, crashes, custom events, performance |

**Metrics Collected:**
- Session duration and count
- Crash rate and crash-free rate
- Custom events (checkout, signup, etc.)
- Performance timing (screen load, API latency)
- All segmented by variant for analysis

**SDK API:**
```typescript
const variant = await codepush.getCurrentVariant()
if (codepush.isInVariant('new-checkout')) {
  // Show new checkout flow
}
```

---

### 🛡️ Auto-Rollback

| Feature | Description |
|---------|-------------|
| **Crash Detection** | Monitors app stability after update |
| **Automatic Revert** | Reverts to previous version on crash spike |
| **Configurable Threshold** | Set crash % that triggers rollback |
| **10-Second Window** | Only counts crashes at cold boot |
| **Success Marking** | Call `markUpdateSuccessful()` to confirm stability |

**How it works:**
1. Update is applied, app restarts
2. SDK monitors for crashes in first 10 seconds
3. If 3+ crashes occur, automatically reverts
4. Previous stable version restored instantly
5. Rollback event reported to server

**Threshold Configuration:**
- Per-release crash threshold (default 5%)
- Auto-rollback can be disabled per release
- Server-side monitoring for crash spikes

---

### 🎯 Targeting & Rollout

| Feature | Description |
|---------|-------------|
| **Gradual Rollout** | Start at 1%, increase to 100% |
| **Device Allowlist** | Push to specific devices (testing) |
| **Device Blocklist** | Exclude problematic devices |
| **Channel-Based** | production, staging, beta channels |
| **Device Info Targeting** | Platform, OS, locale, timezone |

**Rollout Strategy:**
```
Day 1: 1% rollout → monitor crashes
Day 2: 10% rollout → check metrics
Day 3: 50% rollout → review feedback
Day 4: 100% rollout → full deployment
```

**Targeting Example:**
- iOS 17+ users only
- US timezone users
- Specific device IDs for QA

---

### 📱 Native Build System

#### iOS Builds
| Feature | Description |
|---------|-------------|
| **Cloud Builds** | Build on Mac infrastructure |
| **App Store Connect** | Integrated Apple credentials |
| **Ad-Hoc Distribution** | Direct device installation |
| **TestFlight Ready** | App Store and enterprise exports |
| **Code Signing** | Automatic profile management |

#### Android Builds
| Feature | Description |
|---------|-------------|
| **GitHub Actions** | Integrated CI/CD |
| **APK & AAB** | Both output formats |
| **Keystore Management** | Secure credential storage |
| **Build Variants** | Debug, release, custom flavors |

**Build Queue Features:**
- Priority queue (Enterprise builds first)
- Concurrent build limits by plan
- Real-time log streaming
- Artifact storage and download

---

### 🔐 Security

| Feature | Description |
|---------|-------------|
| **Encryption at Rest** | AES-256-GCM for all credentials |
| **API Key Auth** | SHA-256 hashed, never stored plaintext |
| **Bundle Verification** | SHA-256 hash on all bundles |
| **Rate Limiting** | Distributed via Cloudflare KV |
| **Input Validation** | Zod schemas, parameterized queries |
| **No Secrets Logging** | Tokens never appear in logs |

**Authentication Flow:**
- JWT tokens for dashboard (via Clerk)
- API keys for SDK (Bearer token)
- WorkOS SSO for enterprise

---

### 📊 Analytics & Dashboard

#### Device Analytics
- Update check events
- Download completion
- Apply success/failure
- Rollback events
- Crash reports

#### Bundle Analytics
- Size tracking over time
- Delta vs full download ratio
- Module-level breakdown
- Size increase alerts

#### A/B Test Analytics
- Variant comparison
- Statistical significance
- Conversion metrics
- Crash-free rates

---

### 👥 Team Features

| Feature | Description |
|---------|-------------|
| **Organizations** | Multi-user team support |
| **Role-Based Access** | Owner, Admin, Member |
| **Enterprise SSO** | WorkOS integration |
| **Webhooks** | Slack, Discord, custom |
| **Email Distribution** | Send builds to testers |
| **QR Install Links** | Shareable build links |

---

## Technical Architecture

### Stack
- **API**: Cloudflare Workers (Hono framework)
- **Database**: D1 (SQLite at edge)
- **Storage**: R2 (bundles, artifacts)
- **Cache**: KV (rate limits, sessions)
- **SDK**: React Native (TypeScript)
- **Dashboard**: React 19 + Vite

### Deployment
- Edge-deployed to 300+ locations globally
- Sub-50ms latency for update checks
- Auto-scaling, zero cold starts
- Self-hostable or managed service

### Data Flow
```
React Native App
    ↓ POST /v1/updates/check
Cloudflare Workers (Edge)
    ↓ Query D1
SQLite Database
    ↓ Fetch from R2
Bundle Storage
    ↓ Return to app
Delta Patch or Full Bundle
    ↓ Apply
Updated App ✓
```

---

## Pricing Model (Suggested)

### Free Tier
- 1 app
- 10,000 update checks/month
- 50MB bundle limit
- Community support

### Pro ($29/mo)
- 5 apps
- 100,000 update checks/month
- 100MB bundle limit
- A/B testing
- Priority support

### Team ($99/mo)
- 25 apps
- 1M update checks/month
- 200MB bundle limit
- SSO
- Dedicated support

### Enterprise (Custom)
- Unlimited apps
- Unlimited checks
- Self-hosting option
- SLA
- Dedicated builds

---

## Competitive Positioning

| Feature | BundleNudge | CodePush (EOL) | Expo Updates | App Center |
|---------|-------------|----------------|--------------|------------|
| Open Source | ✅ | ❌ | ❌ | ❌ |
| Self-Hostable | ✅ | ❌ | ❌ | ❌ |
| Delta Updates | ✅ | ✅ | ❌ | ✅ |
| A/B Testing | ✅ | ❌ | ❌ | ❌ |
| Auto-Rollback | ✅ | ❌ | ❌ | ❌ |
| Native Builds | ✅ | ❌ | ✅ | ✅ |
| Edge Deployed | ✅ | ❌ | ❌ | ❌ |

---

## Key Differentiators

1. **Open Source First** - Full source code, self-host anywhere
2. **Edge Performance** - Cloudflare Workers = global, fast
3. **Delta Updates** - Bandwidth efficient, faster downloads
4. **A/B Testing Built-in** - Not an afterthought
5. **Auto-Rollback** - Automatic safety net
6. **Modern Stack** - TypeScript, React 19, Cloudflare

---

## Taglines (for landing page)

**Primary:**
> "Ship React Native updates instantly. No app store required."

**Alternatives:**
- "The open-source CodePush replacement"
- "OTA updates that just work"
- "Deploy in minutes, not days"
- "Push updates, not your users' patience"

---

## Call to Action

**Primary CTA:** "Get Started Free"
**Secondary CTA:** "View on GitHub" / "Read the Docs"

---

## Landing Page Sections (Suggested)

1. **Hero** - Headline + CTA + product screenshot
2. **Problem** - App store delays, lost revenue, frustrated users
3. **Solution** - Instant updates, A/B testing, auto-rollback
4. **Features** - Grid of key capabilities
5. **How It Works** - 3-step visual flow
6. **Comparison** - vs CodePush, Expo, etc.
7. **Pricing** - Free/Pro/Team/Enterprise
8. **Testimonials** - Social proof
9. **FAQ** - Common questions
10. **Footer CTA** - Final conversion push

---

## Assets Needed for Landing Page

- [ ] Logo + favicon
- [ ] Hero illustration/screenshot
- [ ] Feature icons
- [ ] Architecture diagram
- [ ] Dashboard screenshots
- [ ] Code snippets (SDK usage)
- [ ] Comparison table
- [ ] Pricing cards

---

*Document generated from codebase analysis. Ready to hand off to landing page design.*
