# Teams System Extractor

You are extracting COMPLETE team management knowledge from codepush.

## Target Files

Read EVERY file in these locations:
- `/Users/isaks_macbook/Desktop/Dev/codepush/packages/api/src/routes/teams/` (ALL files)
- `/Users/isaks_macbook/Desktop/Dev/codepush/packages/dashboard-v2/src/app/**/teams/**`
- `/Users/isaks_macbook/Desktop/Dev/codepush/packages/dashboard-v2/src/components/teams/`
- `/Users/isaks_macbook/Desktop/Dev/codepush/packages/dashboard-v2/src/lib/api/teams.ts`
- Any file with "team", "org", "member", "invite", "role", "permission", "rbac" in the name

## What to Extract

### 1. Team/Organization CRUD
- Create team endpoint
- Get team endpoint
- Update team endpoint
- Delete team endpoint
- List teams for user
- Database schema for `organizations`

### 2. Team Invitations
- Create invitation flow
- OTP generation (6-digit)
- OTP hashing (bcrypt)
- Email sending (Resend)
- OTP verification endpoint
- Invitation expiration (30 min)
- Resend invitation
- Cancel invitation
- Database schema for `team_invitations`

### 3. Member Management
- List members endpoint
- Update member role
- Remove member
- Self-leave team
- Database schema for `organization_members`

### 4. Role System
Document ALL roles:
- `owner` - permissions
- `admin` - permissions
- `member` - permissions

How roles are checked:
- `requireTeamOwner` middleware
- `requireTeamAdmin` middleware
- `requireTeamMember` middleware

### 5. Project-Level RBAC
- Per-project roles (`editor`, `viewer`)
- Project member management
- Database schema for `project_members`
- How project access is checked

### 6. Audit Logging
- What actions are logged
- Audit log schema
- How to query audit log
- Retention policy

### 7. Team Join Flow (New User)
- What happens when invitee doesn't have account
- Sign up flow for invited users
- How invitation links to new account

### 8. Email Templates
- Invitation email format
- Email for existing vs new users
- Resend email format

## Output Format

Write to: `/Users/isaks_macbook/Desktop/Dev/bundlenudge/.claude/extraction/output/teams.md`

```markdown
# Team Management System

## Overview
[2-3 sentence summary]

## Organizations (Teams)

### Database Schema
[Full schema for organizations table]

### CRUD Endpoints

#### Create Team
- Endpoint: POST /api/teams
- Auth: requireAuth
- Request: { name: string }
- Response: { id, name, createdAt }
- Logic: [What happens - creator becomes owner]

#### Get Team
[Full details]

#### Update Team
[Full details]

#### Delete Team
[Full details]

#### List User's Teams
[Full details]

## Invitations

### Database Schema
[Full schema for team_invitations]

### Invitation Flow
1. Admin creates invitation (POST /api/teams/:teamId/invitations)
2. System generates 6-digit OTP
3. OTP is bcrypt hashed (10 rounds)
4. Invitation stored with 30-min expiration
5. Email sent via Resend
6. Invitee receives email with OTP
7. Invitee goes to /teams/join
8. Invitee enters email + OTP
9. System verifies OTP (POST /api/teams/verify-invite)
10. If valid, user added to team

### OTP Security
- Generation: [How OTP is generated]
- Hashing: [bcrypt config]
- Verification: [Constant-time comparison?]
- Expiration: 30 minutes
- Single use: [Is it invalidated after use?]

### Email Content
[Actual email template/format]

### Endpoints

#### Create Invitation
[Full endpoint details with code]

#### Verify Invitation (Join)
[Full endpoint details with code]

#### Resend Invitation
[Full endpoint details]

#### Cancel Invitation
[Full endpoint details]

## Members

### Database Schema
[Full schema for organization_members]

### Endpoints

#### List Members
[Full details]

#### Update Member Role
[Full details]

#### Remove Member
[Full details]

## Roles & Permissions

### Role Hierarchy
| Role | Can Invite | Can Remove | Can Delete Team | Can Manage Admins |
|------|------------|------------|-----------------|-------------------|
| owner | Yes | Yes | Yes | Yes |
| admin | Yes | Members only | No | No |
| member | No | No | No | No |

### Middleware Implementation

#### requireTeamOwner
[Full code]

#### requireTeamAdmin
[Full code]

#### requireTeamMember
[Full code]

## Project-Level Access

### Database Schema
[Full schema for project_members]

### Roles
- `editor`: Can deploy, manage releases
- `viewer`: Read-only access

### Endpoints
[All project member endpoints]

## Audit Logging

### Database Schema
[Full schema for team_audit_log]

### Logged Actions
| Action | When | Data Captured |
|--------|------|---------------|
| team.created | New team | actor, teamId |
| member.invited | Invitation sent | actor, email, teamId |
| member.joined | OTP verified | userId, teamId |
| member.removed | Member kicked | actor, targetId, teamId |
| member.role_changed | Role updated | actor, targetId, oldRole, newRole |

### Audit Helper
[Code for logging function]

## New User Join Flow

### When Invitee Has No Account
1. [Step by step flow]
2. [How account creation links to invitation]

## Environment Variables

| Variable | Purpose |
|----------|---------|
| RESEND_API_KEY | Email sending |
| EMAIL_FROM | From address |

## Error Handling

| Error | HTTP | When |
|-------|------|------|
| team_not_found | 404 | Invalid teamId |
| not_team_member | 403 | User not in team |
| not_team_admin | 403 | User not admin/owner |
| invitation_expired | 400 | OTP past 30 min |
| invalid_otp | 400 | Wrong OTP code |

## Integration Points
- [How teams connect to billing (Team plan required)]
- [How teams connect to projects]
- [How teams connect to auth]
```

## Rules

- Read EVERY file in teams/ directory
- Document the COMPLETE invitation flow
- Include actual OTP generation code
- Note all permission checks
- Document the audit log completely
