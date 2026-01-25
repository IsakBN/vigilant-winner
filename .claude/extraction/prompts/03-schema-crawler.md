# Schema Crawler Agent

You are an exhaustive database schema crawler. Your job is to find and document EVERY database table, column, and relationship.

## Target Directories

1. SQL schemas: `/Users/isaks_macbook/Desktop/Dev/codepush/packages/api/src/*.sql`
2. Drizzle schemas: `/Users/isaks_macbook/Desktop/Dev/codepush/packages/api/src/db/`
3. Auth schemas: `/Users/isaks_macbook/Desktop/Dev/codepush/packages/api/src/lib/auth-schema.ts`

## Your Mission

Find and document:
- Every CREATE TABLE statement
- Every Drizzle table definition
- All columns with types and constraints
- All indexes
- All foreign key relationships
- Which database (D1 vs Neon Postgres)

## How to Find Schemas

### 1. Search for SQL
```bash
cd /Users/isaks_macbook/Desktop/Dev/codepush/packages/api

# Find SQL files
find . -name "*.sql" -type f

# Find CREATE TABLE
grep -rn "CREATE TABLE" .

# Find Drizzle table definitions
grep -rn "sqliteTable\|pgTable" src/
```

### 2. Drizzle Patterns
```typescript
// SQLite (D1)
export const apps = sqliteTable('apps', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  ...
})

// Postgres (Neon - for auth)
export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').unique().notNull(),
  ...
})
```

## Output Format

Write to: `/Users/isaks_macbook/Desktop/Dev/bundlenudge/.claude/extraction/manifests/schema.json`

```json
{
  "crawledAt": "2024-01-25T15:00:00Z",
  "databases": {
    "d1": {
      "description": "Cloudflare D1 (SQLite) - operational data",
      "tables": [
        {
          "name": "apps",
          "file": "src/db/schema.ts",
          "columns": [
            {"name": "id", "type": "TEXT", "constraints": ["PRIMARY KEY"]},
            {"name": "user_id", "type": "TEXT", "constraints": ["NOT NULL", "REFERENCES users(id)"]},
            {"name": "name", "type": "TEXT", "constraints": ["NOT NULL"]},
            {"name": "platform", "type": "TEXT", "constraints": ["NOT NULL"]},
            {"name": "bundle_id", "type": "TEXT", "constraints": []},
            {"name": "created_at", "type": "INTEGER", "constraints": ["NOT NULL"]},
            {"name": "auto_pause_threshold", "type": "REAL", "constraints": ["DEFAULT 2.0"]},
            {"name": "auto_pause_window_minutes", "type": "INTEGER", "constraints": ["DEFAULT 5"]}
          ],
          "indexes": [
            {"name": "idx_apps_user", "columns": ["user_id"]}
          ]
        },
        {
          "name": "releases",
          "file": "src/db/schema.ts",
          "columns": [...],
          "indexes": [...]
        },
        {
          "name": "devices",
          "file": "src/db/schema.ts",
          "columns": [...],
          "indexes": [...]
        },
        {
          "name": "team_invitations",
          "file": "src/db/schema.ts",
          "columns": [
            {"name": "id", "type": "TEXT", "constraints": ["PRIMARY KEY"]},
            {"name": "team_id", "type": "TEXT", "constraints": ["NOT NULL", "REFERENCES organizations(id)"]},
            {"name": "email", "type": "TEXT", "constraints": ["NOT NULL"]},
            {"name": "otp_hash", "type": "TEXT", "constraints": ["NOT NULL"]},
            {"name": "expires_at", "type": "INTEGER", "constraints": ["NOT NULL"]},
            {"name": "status", "type": "TEXT", "constraints": ["DEFAULT 'pending'"]}
          ]
        }
      ]
    },
    "neon": {
      "description": "Neon Postgres - authentication data (Better Auth)",
      "tables": [
        {
          "name": "users",
          "file": "src/lib/auth-schema.ts",
          "columns": [
            {"name": "id", "type": "TEXT", "constraints": ["PRIMARY KEY"]},
            {"name": "email", "type": "TEXT", "constraints": ["UNIQUE", "NOT NULL"]},
            {"name": "name", "type": "TEXT", "constraints": []},
            {"name": "created_at", "type": "TIMESTAMP", "constraints": ["NOT NULL"]}
          ]
        },
        {
          "name": "sessions",
          "file": "src/lib/auth-schema.ts",
          "columns": [...]
        },
        {
          "name": "accounts",
          "file": "src/lib/auth-schema.ts",
          "columns": [...]
        }
      ]
    }
  },
  "relationships": [
    {"from": "apps.user_id", "to": "users.id", "type": "many-to-one"},
    {"from": "releases.app_id", "to": "apps.id", "type": "many-to-one"},
    {"from": "organization_members.org_id", "to": "organizations.id", "type": "many-to-one"},
    {"from": "organization_members.user_id", "to": "users.id", "type": "many-to-one"},
    {"from": "team_invitations.team_id", "to": "organizations.id", "type": "many-to-one"}
  ],
  "totalTables": 23,
  "tablesByDomain": {
    "auth": ["users", "sessions", "accounts"],
    "apps": ["apps", "releases", "devices", "device_events"],
    "teams": ["organizations", "organization_members", "team_invitations", "team_audit_log", "project_members"],
    "billing": ["subscription_plans", "subscriptions", "build_usage", "usage_notifications", "user_limit_overrides"],
    "integrations": ["webhooks", "webhook_events", "crash_integrations", "github_installations"],
    "admin": ["admin_otps", "admin_sessions"]
  }
}
```

## Rules

- Find EVERY table, no exceptions
- Document ALL columns with exact types
- Note all constraints (NOT NULL, UNIQUE, DEFAULT, REFERENCES)
- Identify which database each table belongs to
- Document all indexes
- Map out foreign key relationships
- Group tables by domain for easier understanding
