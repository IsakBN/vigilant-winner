# API Bundle Encryption Sub-Investigator

You investigate how bundles are encrypted for security.

## Decision (LOCKED)

**Strategy: Encrypt with App Secret**
- Each app has unique `appSecret`
- Bundle encrypted before storing in R2
- SDK decrypts with embedded appSecret
- App ID validates the request

## What This Does

```
Upload Flow:
1. Developer uploads bundle.js
2. API encrypts: encrypt(bundle, appSecret)
3. Encrypted bundle stored in R2

Download Flow:
1. SDK requests bundle with appId
2. API validates appId
3. SDK receives encrypted bundle
4. SDK decrypts with appSecret (embedded in native code)
5. SDK applies bundle
```

## Questions to Investigate

### Encryption Algorithm

```markdown
## Question: What encryption algorithm should we use?

**Context**: Need fast encryption that works on mobile devices.

| Option | Algorithm | Key Size | Pros | Cons |
|--------|-----------|----------|------|------|
| A) AES-256-GCM | Symmetric | 256-bit | Fast, authenticated | Need secure key distribution |
| B) AES-256-CBC | Symmetric | 256-bit | Widely supported | No authentication |
| C) ChaCha20-Poly1305 | Symmetric | 256-bit | Fast on mobile | Less common |
| D) RSA + AES | Hybrid | 2048/256 | Asymmetric | Slower, more complex |

**Recommendation**: A) AES-256-GCM ✅
- Authenticated encryption (tamper detection)
- Fast on modern devices
- Well supported in React Native

**Your choice?**
```

### Key Management

```markdown
## Question: How should appSecret be managed?

**Context**: appSecret must be secure but accessible to SDK.

| Component | Storage Location | Security |
|-----------|------------------|----------|
| appSecret | Native code (iOS Keychain / Android Keystore) | High |
| appId | SDK config (can be in JS) | Medium |
| API Key | CI/CD secrets | High |

**Flow**:
1. App created → API generates appSecret
2. Developer downloads native config file
3. Config added to iOS/Android native code
4. SDK reads from native bridge at runtime

**Questions**:
1. How do we generate appSecret? (crypto.randomUUID or stronger?)
2. How do we rotate appSecret if compromised?
3. What format is the native config file?
```

### Encryption at Rest vs Transit

```markdown
## Investigation: Where is encryption applied?

| Stage | Encrypted? | Method |
|-------|------------|--------|
| Upload (dev → API) | Yes | HTTPS (TLS) |
| Storage (R2) | Yes | AES-256-GCM with appSecret |
| Download (API → SDK) | Yes | HTTPS + still encrypted |
| On device | Decrypted | Only in memory during apply |

**Key insight**: Bundle is decrypted ONLY when applying update.
Even on device storage, it stays encrypted until needed.
```

## Testing Requirements

- [ ] Encryption produces different output each time (IV/nonce)
- [ ] Decryption with correct key works
- [ ] Decryption with wrong key fails gracefully
- [ ] Decryption with tampered data fails (GCM auth)
- [ ] Key rotation doesn't break existing bundles (versioning?)
- [ ] Performance: encryption adds <100ms to upload
- [ ] Performance: decryption adds <50ms to apply

## Output

Save to `.claude/knowledge/domains/api/encryption.md`
