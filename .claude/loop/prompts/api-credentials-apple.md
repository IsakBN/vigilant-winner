# Feature: api/credentials-apple

Implement Apple credentials management for iOS code signing.

## Knowledge Docs to Read First

- `.claude/knowledge/IMPLEMENTATION_DETAILS.md` → Encryption patterns (AES-256-GCM)
- `.claude/knowledge/API_FEATURES.md` → Credentials architecture

## Dependencies

- `api/auth-middleware` (must complete first)
- `api/apps-crud` (must complete first)

## What to Implement

### 1. Apple Credentials Route

```typescript
// packages/api/src/routes/credentials/apple.ts
import { Hono } from 'hono'
import { z } from 'zod'
import { authMiddleware } from '@/middleware/auth'
import { validateBody } from '@/middleware/validation'
import {
  createAppleCredential,
  getAppleCredential,
  listAppleCredentials,
  deleteAppleCredential,
  updateAppleCredential,
} from '@/lib/credentials/apple'

const appleCredentialSchema = z.object({
  name: z.string().min(1).max(100),
  teamId: z.string().length(10),
  teamName: z.string().min(1).max(200),
  bundleId: z.string().min(1).max(200),
  certificateP12: z.string().min(1), // Base64 encoded
  certificatePassword: z.string().min(1),
  provisioningProfile: z.string().optional(), // Base64 encoded
  appStoreConnectKeyId: z.string().optional(),
  appStoreConnectIssuerId: z.string().optional(),
  appStoreConnectPrivateKey: z.string().optional(), // Base64 encoded
})

const updateSchema = appleCredentialSchema.partial().omit({
  teamId: true,
})

const apple = new Hono()

apple.use('*', authMiddleware)

// Create Apple credential
apple.post('/', validateBody(appleCredentialSchema), async (c) => {
  const user = c.get('user')
  const data = c.req.valid('json')

  const credential = await createAppleCredential(c.env, {
    ...data,
    userId: user.id,
  })

  return c.json({ credential: sanitizeCredential(credential) }, 201)
})

// List Apple credentials
apple.get('/', async (c) => {
  const user = c.get('user')

  const credentials = await listAppleCredentials(c.env, user.id)

  return c.json({
    credentials: credentials.map(sanitizeCredential),
  })
})

// Get specific credential
apple.get('/:credentialId', async (c) => {
  const user = c.get('user')
  const credentialId = c.req.param('credentialId')

  const credential = await getAppleCredential(c.env, credentialId, user.id)

  if (!credential) {
    return c.json({ error: 'Credential not found' }, 404)
  }

  return c.json({ credential: sanitizeCredential(credential) })
})

// Update credential
apple.patch('/:credentialId', validateBody(updateSchema), async (c) => {
  const user = c.get('user')
  const credentialId = c.req.param('credentialId')
  const data = c.req.valid('json')

  const credential = await getAppleCredential(c.env, credentialId, user.id)

  if (!credential) {
    return c.json({ error: 'Credential not found' }, 404)
  }

  const updated = await updateAppleCredential(c.env, credentialId, data)

  return c.json({ credential: sanitizeCredential(updated) })
})

// Delete credential
apple.delete('/:credentialId', async (c) => {
  const user = c.get('user')
  const credentialId = c.req.param('credentialId')

  const credential = await getAppleCredential(c.env, credentialId, user.id)

  if (!credential) {
    return c.json({ error: 'Credential not found' }, 404)
  }

  await deleteAppleCredential(c.env, credentialId)

  return c.json({ success: true })
})

// Validate credential (test connection)
apple.post('/:credentialId/validate', async (c) => {
  const user = c.get('user')
  const credentialId = c.req.param('credentialId')

  const credential = await getAppleCredential(c.env, credentialId, user.id)

  if (!credential) {
    return c.json({ error: 'Credential not found' }, 404)
  }

  const validation = await validateAppleCredential(c.env, credential)

  return c.json({ validation })
})

function sanitizeCredential(credential: AppleCredential) {
  return {
    id: credential.id,
    name: credential.name,
    teamId: credential.teamId,
    teamName: credential.teamName,
    bundleId: credential.bundleId,
    hasProvisioningProfile: !!credential.provisioningProfile,
    hasAppStoreConnect: !!credential.appStoreConnectKeyId,
    certificateExpiresAt: credential.certificateExpiresAt,
    createdAt: credential.createdAt,
    updatedAt: credential.updatedAt,
  }
}

export { apple }
```

### 2. Apple Credentials Service

```typescript
// packages/api/src/lib/credentials/apple.ts
import { nanoid } from 'nanoid'
import { Env } from '@/types'
import { encrypt, decrypt } from '@/lib/crypto'

export interface AppleCredential {
  id: string
  userId: string
  name: string
  teamId: string
  teamName: string
  bundleId: string
  certificateP12Encrypted: string
  certificatePasswordEncrypted: string
  provisioningProfile: string | null
  appStoreConnectKeyId: string | null
  appStoreConnectIssuerId: string | null
  appStoreConnectPrivateKeyEncrypted: string | null
  certificateExpiresAt: string | null
  createdAt: string
  updatedAt: string
}

interface CreateParams {
  userId: string
  name: string
  teamId: string
  teamName: string
  bundleId: string
  certificateP12: string
  certificatePassword: string
  provisioningProfile?: string
  appStoreConnectKeyId?: string
  appStoreConnectIssuerId?: string
  appStoreConnectPrivateKey?: string
}

export async function createAppleCredential(
  env: Env,
  params: CreateParams
): Promise<AppleCredential> {
  const id = nanoid()
  const now = new Date().toISOString()

  // Encrypt sensitive data
  const certificateP12Encrypted = await encrypt(params.certificateP12, env.ENCRYPTION_KEY)
  const certificatePasswordEncrypted = await encrypt(params.certificatePassword, env.ENCRYPTION_KEY)
  const appStoreConnectPrivateKeyEncrypted = params.appStoreConnectPrivateKey
    ? await encrypt(params.appStoreConnectPrivateKey, env.ENCRYPTION_KEY)
    : null

  // Parse certificate to get expiration
  const certificateExpiresAt = await parseCertificateExpiry(params.certificateP12, params.certificatePassword)

  const credential: AppleCredential = {
    id,
    userId: params.userId,
    name: params.name,
    teamId: params.teamId,
    teamName: params.teamName,
    bundleId: params.bundleId,
    certificateP12Encrypted,
    certificatePasswordEncrypted,
    provisioningProfile: params.provisioningProfile || null,
    appStoreConnectKeyId: params.appStoreConnectKeyId || null,
    appStoreConnectIssuerId: params.appStoreConnectIssuerId || null,
    appStoreConnectPrivateKeyEncrypted,
    certificateExpiresAt,
    createdAt: now,
    updatedAt: now,
  }

  await env.DB.prepare(`
    INSERT INTO apple_credentials (
      id, user_id, name, team_id, team_name, bundle_id,
      certificate_p12_encrypted, certificate_password_encrypted,
      provisioning_profile, app_store_connect_key_id,
      app_store_connect_issuer_id, app_store_connect_private_key_encrypted,
      certificate_expires_at, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    credential.id,
    credential.userId,
    credential.name,
    credential.teamId,
    credential.teamName,
    credential.bundleId,
    credential.certificateP12Encrypted,
    credential.certificatePasswordEncrypted,
    credential.provisioningProfile,
    credential.appStoreConnectKeyId,
    credential.appStoreConnectIssuerId,
    credential.appStoreConnectPrivateKeyEncrypted,
    credential.certificateExpiresAt,
    credential.createdAt,
    credential.updatedAt
  ).run()

  return credential
}

export async function getAppleCredential(
  env: Env,
  credentialId: string,
  userId: string
): Promise<AppleCredential | null> {
  const row = await env.DB.prepare(`
    SELECT * FROM apple_credentials WHERE id = ? AND user_id = ?
  `).bind(credentialId, userId).first()

  if (!row) return null

  return rowToCredential(row)
}

export async function listAppleCredentials(
  env: Env,
  userId: string
): Promise<AppleCredential[]> {
  const rows = await env.DB.prepare(`
    SELECT * FROM apple_credentials WHERE user_id = ? ORDER BY created_at DESC
  `).bind(userId).all()

  return rows.results.map(rowToCredential)
}

export async function updateAppleCredential(
  env: Env,
  credentialId: string,
  updates: Partial<CreateParams>
): Promise<AppleCredential> {
  const setClauses: string[] = ['updated_at = ?']
  const values: any[] = [new Date().toISOString()]

  if (updates.name !== undefined) {
    setClauses.push('name = ?')
    values.push(updates.name)
  }
  if (updates.bundleId !== undefined) {
    setClauses.push('bundle_id = ?')
    values.push(updates.bundleId)
  }
  if (updates.teamName !== undefined) {
    setClauses.push('team_name = ?')
    values.push(updates.teamName)
  }
  if (updates.certificateP12 !== undefined) {
    setClauses.push('certificate_p12_encrypted = ?')
    values.push(await encrypt(updates.certificateP12, env.ENCRYPTION_KEY))
  }
  if (updates.certificatePassword !== undefined) {
    setClauses.push('certificate_password_encrypted = ?')
    values.push(await encrypt(updates.certificatePassword, env.ENCRYPTION_KEY))
  }
  if (updates.provisioningProfile !== undefined) {
    setClauses.push('provisioning_profile = ?')
    values.push(updates.provisioningProfile)
  }
  if (updates.appStoreConnectKeyId !== undefined) {
    setClauses.push('app_store_connect_key_id = ?')
    values.push(updates.appStoreConnectKeyId)
  }
  if (updates.appStoreConnectIssuerId !== undefined) {
    setClauses.push('app_store_connect_issuer_id = ?')
    values.push(updates.appStoreConnectIssuerId)
  }
  if (updates.appStoreConnectPrivateKey !== undefined) {
    setClauses.push('app_store_connect_private_key_encrypted = ?')
    values.push(await encrypt(updates.appStoreConnectPrivateKey, env.ENCRYPTION_KEY))
  }

  values.push(credentialId)

  await env.DB.prepare(`
    UPDATE apple_credentials SET ${setClauses.join(', ')} WHERE id = ?
  `).bind(...values).run()

  const row = await env.DB.prepare('SELECT * FROM apple_credentials WHERE id = ?')
    .bind(credentialId).first()

  return rowToCredential(row!)
}

export async function deleteAppleCredential(
  env: Env,
  credentialId: string
): Promise<void> {
  await env.DB.prepare('DELETE FROM apple_credentials WHERE id = ?')
    .bind(credentialId).run()
}

export async function getDecryptedCredential(
  env: Env,
  credentialId: string,
  userId: string
): Promise<{
  certificateP12: string
  certificatePassword: string
  appStoreConnectPrivateKey: string | null
} | null> {
  const credential = await getAppleCredential(env, credentialId, userId)
  if (!credential) return null

  return {
    certificateP12: await decrypt(credential.certificateP12Encrypted, env.ENCRYPTION_KEY),
    certificatePassword: await decrypt(credential.certificatePasswordEncrypted, env.ENCRYPTION_KEY),
    appStoreConnectPrivateKey: credential.appStoreConnectPrivateKeyEncrypted
      ? await decrypt(credential.appStoreConnectPrivateKeyEncrypted, env.ENCRYPTION_KEY)
      : null,
  }
}

async function parseCertificateExpiry(p12Base64: string, password: string): Promise<string | null> {
  // This would use a library like node-forge to parse the P12
  // For now, return null - actual implementation needed
  return null
}

function rowToCredential(row: any): AppleCredential {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    teamId: row.team_id,
    teamName: row.team_name,
    bundleId: row.bundle_id,
    certificateP12Encrypted: row.certificate_p12_encrypted,
    certificatePasswordEncrypted: row.certificate_password_encrypted,
    provisioningProfile: row.provisioning_profile,
    appStoreConnectKeyId: row.app_store_connect_key_id,
    appStoreConnectIssuerId: row.app_store_connect_issuer_id,
    appStoreConnectPrivateKeyEncrypted: row.app_store_connect_private_key_encrypted,
    certificateExpiresAt: row.certificate_expires_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function validateAppleCredential(
  env: Env,
  credential: AppleCredential
): Promise<{ valid: boolean; errors: string[] }> {
  const errors: string[] = []

  // Check certificate expiry
  if (credential.certificateExpiresAt) {
    const expiresAt = new Date(credential.certificateExpiresAt)
    if (expiresAt < new Date()) {
      errors.push('Certificate has expired')
    } else if (expiresAt < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)) {
      errors.push('Certificate expires within 30 days')
    }
  }

  // Validate App Store Connect credentials if provided
  if (credential.appStoreConnectKeyId && credential.appStoreConnectIssuerId) {
    try {
      const decrypted = await getDecryptedCredential(env, credential.id, credential.userId)
      if (decrypted?.appStoreConnectPrivateKey) {
        // Test API connection
        // Implementation would call Apple's App Store Connect API
      }
    } catch (error) {
      errors.push('Failed to validate App Store Connect credentials')
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}
```

### 3. Crypto Utility

```typescript
// packages/api/src/lib/crypto.ts
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12
const AUTH_TAG_LENGTH = 16

export async function encrypt(plaintext: string, key: string): Promise<string> {
  const keyBuffer = Buffer.from(key, 'hex')
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, keyBuffer, iv, { authTagLength: AUTH_TAG_LENGTH })

  let encrypted = cipher.update(plaintext, 'utf8', 'base64')
  encrypted += cipher.final('base64')
  const authTag = cipher.getAuthTag()

  // Format: iv:authTag:ciphertext
  return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`
}

export async function decrypt(ciphertext: string, key: string): Promise<string> {
  const [ivBase64, authTagBase64, encrypted] = ciphertext.split(':')

  const keyBuffer = Buffer.from(key, 'hex')
  const iv = Buffer.from(ivBase64, 'base64')
  const authTag = Buffer.from(authTagBase64, 'base64')

  const decipher = createDecipheriv(ALGORITHM, keyBuffer, iv, { authTagLength: AUTH_TAG_LENGTH })
  decipher.setAuthTag(authTag)

  let decrypted = decipher.update(encrypted, 'base64', 'utf8')
  decrypted += decipher.final('utf8')

  return decrypted
}
```

### 4. Database Migration

```sql
-- migrations/0009_apple_credentials.sql
CREATE TABLE IF NOT EXISTS apple_credentials (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  team_id TEXT NOT NULL,
  team_name TEXT NOT NULL,
  bundle_id TEXT NOT NULL,
  certificate_p12_encrypted TEXT NOT NULL,
  certificate_password_encrypted TEXT NOT NULL,
  provisioning_profile TEXT,
  app_store_connect_key_id TEXT,
  app_store_connect_issuer_id TEXT,
  app_store_connect_private_key_encrypted TEXT,
  certificate_expires_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX idx_apple_credentials_user_id ON apple_credentials(user_id);
CREATE INDEX idx_apple_credentials_team_id ON apple_credentials(team_id);
```

## Files to Create

1. `packages/api/src/routes/credentials/apple.ts`
2. `packages/api/src/lib/credentials/apple.ts`
3. `packages/api/src/lib/crypto.ts`
4. `migrations/0009_apple_credentials.sql`

## Tests to Write

```typescript
// packages/api/src/lib/__tests__/crypto.test.ts
describe('Crypto', () => {
  const key = 'a'.repeat(64) // 32 bytes in hex

  it('should encrypt and decrypt', async () => {
    const plaintext = 'secret data'
    const encrypted = await encrypt(plaintext, key)
    const decrypted = await decrypt(encrypted, key)
    expect(decrypted).toBe(plaintext)
  })

  it('should produce different ciphertext for same input', async () => {
    const plaintext = 'secret data'
    const encrypted1 = await encrypt(plaintext, key)
    const encrypted2 = await encrypt(plaintext, key)
    expect(encrypted1).not.toBe(encrypted2)
  })
})
```

## Acceptance Criteria

- [ ] Create Apple credential with encryption
- [ ] List credentials (sanitized)
- [ ] Get credential details
- [ ] Update credential
- [ ] Delete credential
- [ ] Validate credential
- [ ] AES-256-GCM encryption
- [ ] Certificate expiry parsing
- [ ] App Store Connect integration ready
