# Feature: api/teams-invitations

Implement team invitation flow with OTP email verification.

## Knowledge Docs to Read First

- `.claude/knowledge/IMPLEMENTATION_DETAILS.md` → Section 3: Team Invite Flow
- `.claude/knowledge/API_FEATURES.md` → Section: 👥 Teams/Organizations

## Dependencies

- `api/teams-crud` (team must exist)
- `api/email-service` (for sending OTP)
- `api/better-auth-setup` (for user lookup)

## What to Implement

### 1. Invitation Endpoints

Create `packages/api/src/routes/teams/invitations.ts`:

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/:teamId/invitations` | Admin/Owner | List pending invites |
| POST | `/:teamId/invitations` | Admin/Owner | Create invitation |
| POST | `/:teamId/invitations/:id/resend` | Admin/Owner | Resend OTP |
| DELETE | `/:teamId/invitations/:id` | Admin/Owner | Cancel invite |
| POST | `/verify-invite` | None | Verify OTP and join |

### 2. OTP Generation

```typescript
import * as bcrypt from 'bcryptjs'

const BCRYPT_SALT_ROUNDS = 10
const OTP_EXPIRY_MS = 30 * 60 * 1000  // 30 minutes

export function generateOTP(): string {
  const array = new Uint32Array(1)
  crypto.getRandomValues(array)
  return (array[0] % 1000000).toString().padStart(6, '0')
}

// Hash before storing
const otpHash = await bcrypt.hash(otp, BCRYPT_SALT_ROUNDS)

// Verify on submit
const isValid = await bcrypt.compare(submittedOtp, storedHash)
```

### 3. Create Invitation Flow

```typescript
// POST /:teamId/invitations
async function createInvitation(c) {
  const { email, role } = await c.req.json()

  // 1. Check if user is already a member
  const existing = await db.organization_members.findOne({
    org_id: teamId,
    user_id: { via: 'users.email': email }
  })
  if (existing) throw new Error('Already a member')

  // 2. Generate and hash OTP
  const otp = generateOTP()
  const otpHash = await bcrypt.hash(otp, 10)
  const expiresAt = Date.now() + OTP_EXPIRY_MS

  // 3. Store invitation
  await db.team_invitations.insert({
    id: generateId(),
    org_id: teamId,
    email,
    invited_by: userId,
    otp_code: otpHash,
    otp_expires_at: expiresAt,
    role: role || 'member',
    status: 'pending',
    created_at: Date.now(),
  })

  // 4. Check if user exists
  const existingUser = await db.users.findOne({ email })

  // 5. Send email with appropriate template
  await sendTeamInviteEmail({
    to: email,
    teamName: team.name,
    otp,
    expiresInMinutes: 30,
    isExistingUser: !!existingUser,
    env: c.env,
  })

  // 6. Audit log
  await logTeamAction(db, {
    orgId: teamId,
    actorId: userId,
    action: 'member.invited',
    targetInvitationId: invitationId,
    details: { email, role },
    ipAddress: c.req.header('CF-Connecting-IP'),
    userAgent: c.req.header('User-Agent'),
  })

  return c.json({ success: true })
}
```

### 4. Verify OTP Flow

```typescript
// POST /verify-invite
async function verifyInvite(c) {
  const { email, otp } = await c.req.json()

  // 1. Find pending invitation
  const invitation = await db.team_invitations.findOne({
    email,
    status: 'pending',
  })
  if (!invitation) throw new Error('Invitation not found')

  // 2. Check expiration
  if (Date.now() > invitation.otp_expires_at) {
    throw new Error('OTP expired')
  }

  // 3. Verify OTP
  const isValid = await bcrypt.compare(otp, invitation.otp_code)
  if (!isValid) throw new Error('Invalid OTP')

  // 4. Check if user exists
  const user = await db.users.findOne({ email })
  if (!user) {
    // New user - needs to sign up first
    return c.json({
      success: false,
      requiresSignup: true,
      email,
      teamName: team.name,
      invitationId: invitation.id,
    })
  }

  // 5. Add to team
  await db.organization_members.insert({
    id: generateId(),
    org_id: invitation.org_id,
    user_id: user.id,
    role: invitation.role,
    created_at: Date.now(),
  })

  // 6. Update invitation
  await db.team_invitations.update(invitation.id, {
    status: 'accepted',
    accepted_at: Date.now(),
  })

  // 7. Audit log
  await logTeamAction(db, {
    orgId: invitation.org_id,
    actorId: user.id,
    action: 'member.joined',
    targetUserId: user.id,
    targetInvitationId: invitation.id,
    details: { email, role: invitation.role },
  })

  return c.json({ success: true, teamId: invitation.org_id })
}
```

### 5. Email Templates

Two templates needed:
- **Existing user**: "You've been invited to join {teamName}. Enter code: {otp}"
- **New user**: "You've been invited to join {teamName}. First sign up, then enter code: {otp}"

## Database Table

```sql
CREATE TABLE team_invitations (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  invited_by TEXT NOT NULL REFERENCES users(id),
  otp_code TEXT NOT NULL,            -- bcrypt hash
  otp_expires_at INTEGER NOT NULL,   -- 30 minutes
  role TEXT NOT NULL DEFAULT 'member',
  status TEXT NOT NULL DEFAULT 'pending',
  created_at INTEGER NOT NULL,
  accepted_at INTEGER,
  UNIQUE(org_id, email, status)
);
```

## Tests Required

1. Create invitation (admin)
2. Create invitation (non-admin fails)
3. OTP generation is 6 digits
4. OTP hash/verify works
5. Verify with valid OTP
6. Verify with expired OTP fails
7. Verify with wrong OTP fails
8. Resend generates new OTP
9. Cancel updates status
10. Existing user joins immediately
11. New user gets `requiresSignup: true`
12. Audit log entries created

## Acceptance Criteria

- [ ] OTP is 6 digits, cryptographically random
- [ ] OTP hashed with bcrypt (10 rounds)
- [ ] OTP expires in 30 minutes
- [ ] Email sent via Resend
- [ ] Different templates for new/existing users
- [ ] Verify flow handles both user types
- [ ] Audit log on invite, join
- [ ] All tests pass
