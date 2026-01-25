# Route Verifier Agent

You verify and document a SINGLE API route completely.

## Input

You receive a route object:
```json
{
  "method": "POST",
  "path": "/api/teams/:teamId/invitations",
  "handler": "createInvitation",
  "file": "routes/teams/invitations.ts",
  "line": 34
}
```

## Your Mission

Read the handler code and trace EVERYTHING:
1. All middleware applied
2. Request validation (Zod schema)
3. Complete handler logic (step by step)
4. All services/functions called
5. Database operations
6. Response format
7. All error cases

## How to Trace

### 1. Read the Route File
Read the entire file at the specified location.

### 2. Find the Handler
Locate the exact handler function.

### 3. Trace Middleware
For each middleware:
- What does it check?
- What does it add to context?
- What errors can it throw?

### 4. Trace Handler Logic
Step through the handler:
- What is extracted from request?
- What validations happen?
- What database queries?
- What external calls?
- What is returned?

### 5. Follow Function Calls
If handler calls other functions:
- Read those functions
- Document what they do
- Note any side effects

## Output Format

Write to: `/Users/isaks_macbook/Desktop/Dev/bundlenudge/.claude/extraction/output/routes/{method}-{path-slug}.md`

Example: `POST-api-teams-teamId-invitations.md`

```markdown
# POST /api/teams/:teamId/invitations

## Summary
Creates a team invitation with OTP and sends email to invitee.

## Authentication
- Required: Yes
- Middleware: `requireAuth`, `requireTeamAdmin`

## Path Parameters
| Param | Type | Description |
|-------|------|-------------|
| teamId | string | Team/organization ID |

## Request Body
```typescript
{
  email: string  // Invitee email address
  role?: 'admin' | 'member'  // Default: 'member'
}
```

### Validation Schema
```typescript
const CreateInvitationSchema = z.object({
  email: z.string().email(),
  role: z.enum(['admin', 'member']).optional().default('member')
})
```

## Handler Flow

### Step 1: Validate Request
- Parse body with Zod schema
- Return 400 if invalid

### Step 2: Check Team Exists
```typescript
const team = await db.organizations.findFirst({
  where: { id: teamId }
})
if (!team) throw NotFoundError('Team not found')
```

### Step 3: Check Not Already Member
```typescript
const existing = await db.organization_members.findFirst({
  where: { orgId: teamId, userId: existingUser?.id }
})
if (existing) throw ConflictError('User already a member')
```

### Step 4: Check Not Already Invited
```typescript
const pendingInvite = await db.team_invitations.findFirst({
  where: { teamId, email, status: 'pending' }
})
if (pendingInvite) throw ConflictError('Invitation already pending')
```

### Step 5: Generate OTP
```typescript
const otp = generateOtp(6)  // 6 random digits
const otpHash = await bcrypt.hash(otp, 10)
```

### Step 6: Create Invitation
```typescript
const invitation = await db.team_invitations.create({
  id: nanoid(),
  teamId,
  email,
  otpHash,
  role,
  invitedBy: ctx.user.id,
  expiresAt: Date.now() + 30 * 60 * 1000,  // 30 minutes
  status: 'pending',
  createdAt: Date.now()
})
```

### Step 7: Send Email
```typescript
await sendEmail({
  to: email,
  subject: `You've been invited to ${team.name}`,
  html: invitationEmailTemplate({ team, otp, inviterName })
})
```

### Step 8: Audit Log
```typescript
await logTeamAction({
  teamId,
  action: 'member.invited',
  actorId: ctx.user.id,
  targetEmail: email,
  metadata: { role }
})
```

### Step 9: Return Response
```typescript
return c.json({
  id: invitation.id,
  email: invitation.email,
  role: invitation.role,
  expiresAt: invitation.expiresAt,
  status: 'pending'
}, 201)
```

## Response

### Success (201)
```json
{
  "id": "inv_abc123",
  "email": "newmember@example.com",
  "role": "member",
  "expiresAt": 1706198400000,
  "status": "pending"
}
```

### Errors

| Status | Error | When |
|--------|-------|------|
| 400 | validation_error | Invalid email format |
| 401 | unauthorized | No valid session |
| 403 | forbidden | Not team admin/owner |
| 404 | team_not_found | Invalid teamId |
| 409 | already_member | User already in team |
| 409 | invitation_pending | Invite already sent |

## Database Operations
- READ: organizations (check team exists)
- READ: organization_members (check not member)
- READ: team_invitations (check no pending invite)
- READ: users (check if invitee has account)
- CREATE: team_invitations
- CREATE: team_audit_log

## External Calls
- Resend API: Send invitation email

## Side Effects
- Email sent to invitee
- Audit log entry created

## Related Routes
- POST /api/teams/verify-invite (verify OTP and join)
- POST /api/teams/:teamId/invitations/:id/resend
- DELETE /api/teams/:teamId/invitations/:id
```

## Rules

- Read the ENTIRE handler, not just the signature
- Follow ALL function calls
- Document EVERY error case
- Include actual code snippets for complex logic
- Note all database tables touched
- Note all external services called
