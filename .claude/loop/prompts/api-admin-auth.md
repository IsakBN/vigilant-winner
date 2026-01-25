# Feature: api/admin-auth

Implement OTP-based admin authentication with domain restriction.

## Knowledge Docs to Read First

- `.claude/knowledge/IMPLEMENTATION_DETAILS.md` → Section 2.3: Admin OTP Login
- `.claude/knowledge/API_FEATURES.md` → Section: Admin Auth

## Dependencies

- `api/email-service` (for OTP email)

## What to Implement

### 1. Admin Auth Routes

Create `packages/api/src/routes/admin-auth.ts`:

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/send-otp` | None | Send OTP to admin email |
| POST | `/verify-otp` | None | Verify OTP, create session |

### 2. Domain Check

```typescript
const ADMIN_DOMAIN = '@bundlenudge.com'

function isAdminEmail(email: string): boolean {
  return email.endsWith(ADMIN_DOMAIN)
}
```

### 3. OTP Configuration

```typescript
const OTP_EXPIRY_SECONDS = 10 * 60        // 10 minutes
const MAX_SEND_ATTEMPTS = 3                // per 15 minutes
const MAX_VERIFY_ATTEMPTS = 5              // per OTP
const LOCKOUT_THRESHOLD = 10               // failures before lockout
const LOCKOUT_DURATION_MS = 30 * 60 * 1000 // 30 minutes
```

### 4. Send OTP Flow

```typescript
// POST /admin-auth/send-otp
async function sendOTP(c) {
  const { email } = await c.req.json()

  // 1. Validate admin email
  if (!isAdminEmail(email)) {
    return c.json({ error: 'Admin access requires @bundlenudge.com email' }, 403)
  }

  // 2. Check rate limit (KV)
  const sendKey = `admin-otp-send:${email}`
  const sendAttempts = await c.env.RATE_LIMIT.get(sendKey)
  if (parseInt(sendAttempts || '0') >= MAX_SEND_ATTEMPTS) {
    return c.json({ error: 'Too many OTP requests. Wait 15 minutes.' }, 429)
  }

  // 3. Generate OTP
  const otp = generateOTP()  // 6 digits

  // 4. Store in KV with expiry
  const otpKey = `admin-otp:${email}`
  await c.env.RATE_LIMIT.put(otpKey, otp, { expirationTtl: OTP_EXPIRY_SECONDS })

  // 5. Increment send counter
  await c.env.RATE_LIMIT.put(sendKey, String(parseInt(sendAttempts || '0') + 1), {
    expirationTtl: 15 * 60  // 15 minutes
  })

  // 6. Send email
  await sendAdminOTPEmail(email, otp, c.env)

  return c.json({ success: true, message: 'OTP sent to email' })
}
```

### 5. Verify OTP Flow

```typescript
// POST /admin-auth/verify-otp
async function verifyOTP(c) {
  const { email, otp } = await c.req.json()

  // 1. Validate admin email
  if (!isAdminEmail(email)) {
    return c.json({ error: 'Admin access requires @bundlenudge.com email' }, 403)
  }

  // 2. Check lockout
  const lockoutKey = `admin-lockout:${email}`
  const lockoutUntil = await c.env.RATE_LIMIT.get(lockoutKey)
  if (lockoutUntil && Date.now() < parseInt(lockoutUntil)) {
    return c.json({ error: 'Account locked. Try again later.' }, 429)
  }

  // 3. Check verify attempts
  const verifyKey = `admin-otp-verify:${email}`
  const verifyAttempts = parseInt(await c.env.RATE_LIMIT.get(verifyKey) || '0')
  if (verifyAttempts >= MAX_VERIFY_ATTEMPTS) {
    return c.json({ error: 'Too many failed attempts' }, 429)
  }

  // 4. Get stored OTP
  const otpKey = `admin-otp:${email}`
  const storedOtp = await c.env.RATE_LIMIT.get(otpKey)
  if (!storedOtp) {
    return c.json({ error: 'OTP expired or not found' }, 400)
  }

  // 5. Constant-time comparison
  if (!constantTimeEqual(otp, storedOtp)) {
    // Increment failure counter
    await c.env.RATE_LIMIT.put(verifyKey, String(verifyAttempts + 1), {
      expirationTtl: OTP_EXPIRY_SECONDS
    })

    // Check for lockout
    if (verifyAttempts + 1 >= LOCKOUT_THRESHOLD) {
      await c.env.RATE_LIMIT.put(lockoutKey, String(Date.now() + LOCKOUT_DURATION_MS), {
        expirationTtl: LOCKOUT_DURATION_MS / 1000
      })
    }

    return c.json({ error: 'Invalid OTP' }, 400)
  }

  // 6. Clear OTP and counters
  await c.env.RATE_LIMIT.delete(otpKey)
  await c.env.RATE_LIMIT.delete(verifyKey)

  // 7. Return success (frontend handles admin session separately)
  return c.json({ success: true, email })
}
```

### 6. Generate OTP Helper

```typescript
function generateOTP(): string {
  const array = new Uint32Array(1)
  crypto.getRandomValues(array)
  return (array[0] % 1000000).toString().padStart(6, '0')
}
```

### 7. Constant Time Compare

```typescript
function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return result === 0
}
```

## KV Keys Used

| Key Pattern | Purpose | TTL |
|-------------|---------|-----|
| `admin-otp:{email}` | The OTP itself | 10 min |
| `admin-otp-send:{email}` | Send attempt counter | 15 min |
| `admin-otp-verify:{email}` | Verify attempt counter | 10 min |
| `admin-lockout:{email}` | Lockout timestamp | 30 min |

## Tests Required

1. Send OTP to valid admin email
2. Send OTP to non-admin email fails (403)
3. Rate limit on send attempts
4. Verify with correct OTP
5. Verify with wrong OTP fails
6. Verify attempts tracked
7. Lockout after threshold
8. Constant-time compare works
9. OTP expires after 10 min

## Acceptance Criteria

- [ ] Only @bundlenudge.com can request OTP
- [ ] OTP is 6 digits, cryptographically random
- [ ] OTP stored in KV with 10min expiry
- [ ] Max 3 send attempts per 15 min
- [ ] Max 5 verify attempts per OTP
- [ ] Lockout after 10 failures (30 min)
- [ ] Constant-time string comparison
- [ ] Email sent via Resend
- [ ] All tests pass
