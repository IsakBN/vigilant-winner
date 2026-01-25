# Feature: api/credentials-android

Implement Android credentials management for code signing.

## Knowledge Docs to Read First

- `.claude/knowledge/IMPLEMENTATION_DETAILS.md` → Encryption patterns (AES-256-GCM)
- `.claude/knowledge/API_FEATURES.md` → Credentials architecture

## Dependencies

- `api/auth-middleware` (must complete first)
- `api/apps-crud` (must complete first)
- `api/credentials-apple` (for crypto utilities)

## What to Implement

### 1. Android Credentials Route

```typescript
// packages/api/src/routes/credentials/android.ts
import { Hono } from 'hono'
import { z } from 'zod'
import { authMiddleware } from '@/middleware/auth'
import { validateBody } from '@/middleware/validation'
import {
  createAndroidCredential,
  getAndroidCredential,
  listAndroidCredentials,
  deleteAndroidCredential,
  updateAndroidCredential,
} from '@/lib/credentials/android'

const androidCredentialSchema = z.object({
  name: z.string().min(1).max(100),
  keystoreFile: z.string().min(1), // Base64 encoded JKS/PKCS12
  keystorePassword: z.string().min(1),
  keyAlias: z.string().min(1),
  keyPassword: z.string().min(1),
  keystoreType: z.enum(['jks', 'pkcs12']).default('jks'),
  googlePlayServiceAccountJson: z.string().optional(), // Base64 encoded
})

const updateSchema = androidCredentialSchema.partial()

const android = new Hono()

android.use('*', authMiddleware)

// Create Android credential
android.post('/', validateBody(androidCredentialSchema), async (c) => {
  const user = c.get('user')
  const data = c.req.valid('json')

  const credential = await createAndroidCredential(c.env, {
    ...data,
    userId: user.id,
  })

  return c.json({ credential: sanitizeCredential(credential) }, 201)
})

// List Android credentials
android.get('/', async (c) => {
  const user = c.get('user')

  const credentials = await listAndroidCredentials(c.env, user.id)

  return c.json({
    credentials: credentials.map(sanitizeCredential),
  })
})

// Get specific credential
android.get('/:credentialId', async (c) => {
  const user = c.get('user')
  const credentialId = c.req.param('credentialId')

  const credential = await getAndroidCredential(c.env, credentialId, user.id)

  if (!credential) {
    return c.json({ error: 'Credential not found' }, 404)
  }

  return c.json({ credential: sanitizeCredential(credential) })
})

// Update credential
android.patch('/:credentialId', validateBody(updateSchema), async (c) => {
  const user = c.get('user')
  const credentialId = c.req.param('credentialId')
  const data = c.req.valid('json')

  const credential = await getAndroidCredential(c.env, credentialId, user.id)

  if (!credential) {
    return c.json({ error: 'Credential not found' }, 404)
  }

  const updated = await updateAndroidCredential(c.env, credentialId, data)

  return c.json({ credential: sanitizeCredential(updated) })
})

// Delete credential
android.delete('/:credentialId', async (c) => {
  const user = c.get('user')
  const credentialId = c.req.param('credentialId')

  const credential = await getAndroidCredential(c.env, credentialId, user.id)

  if (!credential) {
    return c.json({ error: 'Credential not found' }, 404)
  }

  await deleteAndroidCredential(c.env, credentialId)

  return c.json({ success: true })
})

// Validate credential
android.post('/:credentialId/validate', async (c) => {
  const user = c.get('user')
  const credentialId = c.req.param('credentialId')

  const credential = await getAndroidCredential(c.env, credentialId, user.id)

  if (!credential) {
    return c.json({ error: 'Credential not found' }, 404)
  }

  const validation = await validateAndroidCredential(c.env, credential)

  return c.json({ validation })
})

// Get keystore info (aliases, expiry)
android.get('/:credentialId/info', async (c) => {
  const user = c.get('user')
  const credentialId = c.req.param('credentialId')

  const credential = await getAndroidCredential(c.env, credentialId, user.id)

  if (!credential) {
    return c.json({ error: 'Credential not found' }, 404)
  }

  const info = await getKeystoreInfo(c.env, credential)

  return c.json({ info })
})

function sanitizeCredential(credential: AndroidCredential) {
  return {
    id: credential.id,
    name: credential.name,
    keyAlias: credential.keyAlias,
    keystoreType: credential.keystoreType,
    hasGooglePlayCredentials: !!credential.googlePlayServiceAccountJsonEncrypted,
    certificateExpiresAt: credential.certificateExpiresAt,
    certificateSha256: credential.certificateSha256,
    createdAt: credential.createdAt,
    updatedAt: credential.updatedAt,
  }
}

export { android }
```

### 2. Android Credentials Service

```typescript
// packages/api/src/lib/credentials/android.ts
import { nanoid } from 'nanoid'
import { Env } from '@/types'
import { encrypt, decrypt } from '@/lib/crypto'

export interface AndroidCredential {
  id: string
  userId: string
  name: string
  keystoreFileEncrypted: string
  keystorePasswordEncrypted: string
  keyAlias: string
  keyPasswordEncrypted: string
  keystoreType: 'jks' | 'pkcs12'
  googlePlayServiceAccountJsonEncrypted: string | null
  certificateExpiresAt: string | null
  certificateSha256: string | null
  createdAt: string
  updatedAt: string
}

interface CreateParams {
  userId: string
  name: string
  keystoreFile: string
  keystorePassword: string
  keyAlias: string
  keyPassword: string
  keystoreType: 'jks' | 'pkcs12'
  googlePlayServiceAccountJson?: string
}

export async function createAndroidCredential(
  env: Env,
  params: CreateParams
): Promise<AndroidCredential> {
  const id = nanoid()
  const now = new Date().toISOString()

  // Encrypt sensitive data
  const keystoreFileEncrypted = await encrypt(params.keystoreFile, env.ENCRYPTION_KEY)
  const keystorePasswordEncrypted = await encrypt(params.keystorePassword, env.ENCRYPTION_KEY)
  const keyPasswordEncrypted = await encrypt(params.keyPassword, env.ENCRYPTION_KEY)
  const googlePlayServiceAccountJsonEncrypted = params.googlePlayServiceAccountJson
    ? await encrypt(params.googlePlayServiceAccountJson, env.ENCRYPTION_KEY)
    : null

  // Parse keystore to get certificate info
  const certInfo = await parseKeystoreCertificate(
    params.keystoreFile,
    params.keystorePassword,
    params.keyAlias,
    params.keyPassword
  )

  const credential: AndroidCredential = {
    id,
    userId: params.userId,
    name: params.name,
    keystoreFileEncrypted,
    keystorePasswordEncrypted,
    keyAlias: params.keyAlias,
    keyPasswordEncrypted,
    keystoreType: params.keystoreType,
    googlePlayServiceAccountJsonEncrypted,
    certificateExpiresAt: certInfo?.expiresAt || null,
    certificateSha256: certInfo?.sha256 || null,
    createdAt: now,
    updatedAt: now,
  }

  await env.DB.prepare(`
    INSERT INTO android_credentials (
      id, user_id, name, keystore_file_encrypted, keystore_password_encrypted,
      key_alias, key_password_encrypted, keystore_type,
      google_play_service_account_json_encrypted,
      certificate_expires_at, certificate_sha256, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    credential.id,
    credential.userId,
    credential.name,
    credential.keystoreFileEncrypted,
    credential.keystorePasswordEncrypted,
    credential.keyAlias,
    credential.keyPasswordEncrypted,
    credential.keystoreType,
    credential.googlePlayServiceAccountJsonEncrypted,
    credential.certificateExpiresAt,
    credential.certificateSha256,
    credential.createdAt,
    credential.updatedAt
  ).run()

  return credential
}

export async function getAndroidCredential(
  env: Env,
  credentialId: string,
  userId: string
): Promise<AndroidCredential | null> {
  const row = await env.DB.prepare(`
    SELECT * FROM android_credentials WHERE id = ? AND user_id = ?
  `).bind(credentialId, userId).first()

  if (!row) return null

  return rowToCredential(row)
}

export async function listAndroidCredentials(
  env: Env,
  userId: string
): Promise<AndroidCredential[]> {
  const rows = await env.DB.prepare(`
    SELECT * FROM android_credentials WHERE user_id = ? ORDER BY created_at DESC
  `).bind(userId).all()

  return rows.results.map(rowToCredential)
}

export async function updateAndroidCredential(
  env: Env,
  credentialId: string,
  updates: Partial<CreateParams>
): Promise<AndroidCredential> {
  const setClauses: string[] = ['updated_at = ?']
  const values: any[] = [new Date().toISOString()]

  if (updates.name !== undefined) {
    setClauses.push('name = ?')
    values.push(updates.name)
  }
  if (updates.keystoreFile !== undefined) {
    setClauses.push('keystore_file_encrypted = ?')
    values.push(await encrypt(updates.keystoreFile, env.ENCRYPTION_KEY))
  }
  if (updates.keystorePassword !== undefined) {
    setClauses.push('keystore_password_encrypted = ?')
    values.push(await encrypt(updates.keystorePassword, env.ENCRYPTION_KEY))
  }
  if (updates.keyAlias !== undefined) {
    setClauses.push('key_alias = ?')
    values.push(updates.keyAlias)
  }
  if (updates.keyPassword !== undefined) {
    setClauses.push('key_password_encrypted = ?')
    values.push(await encrypt(updates.keyPassword, env.ENCRYPTION_KEY))
  }
  if (updates.keystoreType !== undefined) {
    setClauses.push('keystore_type = ?')
    values.push(updates.keystoreType)
  }
  if (updates.googlePlayServiceAccountJson !== undefined) {
    setClauses.push('google_play_service_account_json_encrypted = ?')
    values.push(await encrypt(updates.googlePlayServiceAccountJson, env.ENCRYPTION_KEY))
  }

  values.push(credentialId)

  await env.DB.prepare(`
    UPDATE android_credentials SET ${setClauses.join(', ')} WHERE id = ?
  `).bind(...values).run()

  const row = await env.DB.prepare('SELECT * FROM android_credentials WHERE id = ?')
    .bind(credentialId).first()

  return rowToCredential(row!)
}

export async function deleteAndroidCredential(
  env: Env,
  credentialId: string
): Promise<void> {
  await env.DB.prepare('DELETE FROM android_credentials WHERE id = ?')
    .bind(credentialId).run()
}

export async function getDecryptedCredential(
  env: Env,
  credentialId: string,
  userId: string
): Promise<{
  keystoreFile: string
  keystorePassword: string
  keyPassword: string
  googlePlayServiceAccountJson: string | null
} | null> {
  const credential = await getAndroidCredential(env, credentialId, userId)
  if (!credential) return null

  return {
    keystoreFile: await decrypt(credential.keystoreFileEncrypted, env.ENCRYPTION_KEY),
    keystorePassword: await decrypt(credential.keystorePasswordEncrypted, env.ENCRYPTION_KEY),
    keyPassword: await decrypt(credential.keyPasswordEncrypted, env.ENCRYPTION_KEY),
    googlePlayServiceAccountJson: credential.googlePlayServiceAccountJsonEncrypted
      ? await decrypt(credential.googlePlayServiceAccountJsonEncrypted, env.ENCRYPTION_KEY)
      : null,
  }
}

async function parseKeystoreCertificate(
  keystoreBase64: string,
  keystorePassword: string,
  keyAlias: string,
  keyPassword: string
): Promise<{ expiresAt: string; sha256: string } | null> {
  // This would use a Java interop or library to parse the keystore
  // For now, return null - actual implementation needed
  return null
}

function rowToCredential(row: any): AndroidCredential {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    keystoreFileEncrypted: row.keystore_file_encrypted,
    keystorePasswordEncrypted: row.keystore_password_encrypted,
    keyAlias: row.key_alias,
    keyPasswordEncrypted: row.key_password_encrypted,
    keystoreType: row.keystore_type,
    googlePlayServiceAccountJsonEncrypted: row.google_play_service_account_json_encrypted,
    certificateExpiresAt: row.certificate_expires_at,
    certificateSha256: row.certificate_sha256,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function validateAndroidCredential(
  env: Env,
  credential: AndroidCredential
): Promise<{ valid: boolean; errors: string[] }> {
  const errors: string[] = []

  // Check certificate expiry
  if (credential.certificateExpiresAt) {
    const expiresAt = new Date(credential.certificateExpiresAt)
    if (expiresAt < new Date()) {
      errors.push('Signing certificate has expired')
    } else if (expiresAt < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)) {
      errors.push('Signing certificate expires within 30 days')
    }
  }

  // Validate Google Play credentials if provided
  if (credential.googlePlayServiceAccountJsonEncrypted) {
    try {
      const decrypted = await getDecryptedCredential(env, credential.id, credential.userId)
      if (decrypted?.googlePlayServiceAccountJson) {
        const serviceAccount = JSON.parse(
          Buffer.from(decrypted.googlePlayServiceAccountJson, 'base64').toString()
        )
        if (!serviceAccount.client_email || !serviceAccount.private_key) {
          errors.push('Invalid Google Play service account JSON')
        }
        // Could test API connection here
      }
    } catch (error) {
      errors.push('Failed to validate Google Play credentials')
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

export async function getKeystoreInfo(
  env: Env,
  credential: AndroidCredential
): Promise<{
  aliases: string[]
  expiresAt: string | null
  sha256: string | null
  keystoreType: string
}> {
  // This would parse the keystore to get detailed info
  return {
    aliases: [credential.keyAlias],
    expiresAt: credential.certificateExpiresAt,
    sha256: credential.certificateSha256,
    keystoreType: credential.keystoreType,
  }
}
```

### 3. Database Migration

```sql
-- migrations/0010_android_credentials.sql
CREATE TABLE IF NOT EXISTS android_credentials (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  keystore_file_encrypted TEXT NOT NULL,
  keystore_password_encrypted TEXT NOT NULL,
  key_alias TEXT NOT NULL,
  key_password_encrypted TEXT NOT NULL,
  keystore_type TEXT NOT NULL DEFAULT 'jks',
  google_play_service_account_json_encrypted TEXT,
  certificate_expires_at TEXT,
  certificate_sha256 TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX idx_android_credentials_user_id ON android_credentials(user_id);
```

## Files to Create

1. `packages/api/src/routes/credentials/android.ts`
2. `packages/api/src/lib/credentials/android.ts`
3. `migrations/0010_android_credentials.sql`

## Tests to Write

```typescript
// packages/api/src/routes/credentials/__tests__/android.test.ts
describe('Android Credentials API', () => {
  it('should create a credential', async () => {
    const response = await app.request('/credentials/android', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({
        name: 'Production Keystore',
        keystoreFile: 'base64encodedkeystore',
        keystorePassword: 'password123',
        keyAlias: 'my-key',
        keyPassword: 'keypassword',
        keystoreType: 'jks',
      }),
    })
    expect(response.status).toBe(201)
    const data = await response.json()
    expect(data.credential.keyAlias).toBe('my-key')
  })

  it('should list credentials without sensitive data', async () => {
    const response = await app.request('/credentials/android', {
      headers: authHeaders,
    })
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.credentials[0].keystoreFileEncrypted).toBeUndefined()
  })

  it('should support both JKS and PKCS12', async () => {
    const response = await app.request('/credentials/android', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({
        name: 'PKCS12 Keystore',
        keystoreFile: 'base64encoded',
        keystorePassword: 'password',
        keyAlias: 'key',
        keyPassword: 'keypassword',
        keystoreType: 'pkcs12',
      }),
    })
    expect(response.status).toBe(201)
    const data = await response.json()
    expect(data.credential.keystoreType).toBe('pkcs12')
  })
})
```

## Acceptance Criteria

- [ ] Create Android credential with encryption
- [ ] List credentials (sanitized)
- [ ] Get credential details
- [ ] Update credential
- [ ] Delete credential
- [ ] Validate credential
- [ ] Support JKS and PKCS12 formats
- [ ] Google Play service account storage
- [ ] Certificate SHA256 fingerprint
- [ ] Certificate expiry tracking
